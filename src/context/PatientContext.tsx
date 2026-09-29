import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Patient, TriageRisk, Doctor, DoctorStatus } from '../../types';
import { supabase } from '../lib/supabaseClient';
import { 
  getPatients, 
  addPatient as apiAddPatient, 
  updatePatient as apiUpdatePatient, 
  deletePatient as apiDeletePatient, 
  getICUBeds as apiGetICUBeds,
  getDoctors as apiGetDoctors,
  addDoctor as apiAddDoctor,
  assignDoctorToPatient as apiAssignDoctorToPatient,
  updateDoctorStatus as apiUpdateDoctorStatus,
  patientDatabase,
  mapPatientRow 
} from '../services/patientDatabase';
import { alarmService } from '../services/alarmService';
import { DoctorRosterModal } from '../components/DoctorRosterModal';
import type { ICUBedData } from '../modules/clinical_intelligence/ICUBedView3D';
import { X, UserPlus, Heart, Activity, ShieldAlert, Sparkles, Loader2, AlertTriangle, VolumeX, Stethoscope } from 'lucide-react';

interface CriticalAlertState {
  patientId: string;
  patientName: string;
  bedNumber: string;
  doctorName: string;
  reason: string;
  alertKey: string;
}

interface PatientContextType {
  patients: Patient[];
  activePatient: Patient | null;
  setActivePatient: (patient: Patient | null) => void;
  addPatient: (data: Partial<Patient>) => Promise<Patient | null>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<Patient | null>;
  deletePatient: (id: string) => Promise<boolean>;
  dischargePatient: (id: string, notes?: string) => Promise<Patient | null>;
  icuBeds: ICUBedData[];
  
  // Doctor Management
  doctors: Doctor[];
  addDoctor: (doctor: Omit<Doctor, 'id' | 'created_at'>) => Promise<Doctor | null>;
  assignDoctorToPatient: (patientId: string, doctorId: string, doctorName?: string) => Promise<boolean>;
  updateDoctorStatus: (doctorId: string, status: DoctorStatus) => Promise<boolean>;
  refreshDoctors: () => Promise<void>;
  isDoctorModalOpen: boolean;
  openDoctorModal: () => void;
  closeDoctorModal: () => void;

  // Critical Patient Alarm System
  criticalAlert: CriticalAlertState | null;
  muteCriticalAlarm: () => void;
  isAlarmActive: boolean;

  // Add Patient Modal
  isAddModalOpen: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
  refreshPatients: () => Promise<void>;
  resetDatabase: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [icuBeds, setIcuBeds] = useState<ICUBedData[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState<boolean>(false);
  const [criticalAlert, setCriticalAlert] = useState<CriticalAlertState | null>(null);
  const [isAlarmActive, setIsAlarmActive] = useState<boolean>(false);

  // Manual or programmatic re-fetch of patients & beds
  const refreshPatients = useCallback(async () => {
    try {
      const data = await getPatients();
      const beds = await apiGetICUBeds();
      setPatients(data);
      setIcuBeds(beds);
      if (data.length > 0) {
        setActivePatient((prev) => {
          if (!prev) return data[0];
          const matched = data.find((p) => p.id === prev.id);
          return matched || data[0];
        });
      }
    } catch (err) {
      console.error('Error refreshing patients from Supabase:', err);
    }
  }, []);

  // Fetch doctors list
  const refreshDoctors = useCallback(async () => {
    try {
      const docs = await apiGetDoctors();
      setDoctors(docs);
    } catch (err) {
      console.error('Error refreshing doctors:', err);
    }
  }, []);

  // 1. Initial async fetch from Supabase on mount
  // 2. Set up real-time postgres_changes subscription via supabase.channel
  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      try {
        const [patientData, bedsData, docsData] = await Promise.all([
          getPatients(),
          apiGetICUBeds(),
          apiGetDoctors()
        ]);
        if (isMounted) {
          setPatients(patientData);
          setIcuBeds(bedsData);
          setDoctors(docsData);
          if (patientData.length > 0) {
            setActivePatient((prev) => prev || patientData[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load initial Supabase patients/doctors:', err);
      }
    };

    initData();

    // Supabase Real-Time Channel for instant multi-client / multi-view synchronization
    const channel = supabase
      .channel('patients-and-doctors-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        async (payload) => {
          console.log('⚡ Real-time Postgres change received on patients:', payload);
          const updatedList = await getPatients();
          const updatedBeds = await apiGetICUBeds();
          if (isMounted) {
            setPatients(updatedList);
            setIcuBeds(updatedBeds);
            setActivePatient((current) => {
              if (!current) return updatedList[0] || null;
              const match = updatedList.find((p) => p.id === current.id);
              return match || updatedList[0] || null;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'doctors' },
        async (payload) => {
          console.log('⚡ Real-time Postgres change received on doctors:', payload);
          const updatedDocs = await apiGetDoctors();
          if (isMounted) {
            setDoctors(updatedDocs);
          }
        }
      )
      .subscribe();

    // Also listen to internal reactive store for zero-latency local optimistics
    const unsubscribeStore = patientDatabase.subscribe((updated) => {
      if (isMounted) {
        setPatients(updated);
        setIcuBeds(patientDatabase.getICUBeds());
        setDoctors(patientDatabase.getDoctors());
      }
    });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      unsubscribeStore();
    };
  }, []);

  // ========================================================
  // Real-Time Critical Patient Deterioration & Alarm Monitor
  // ========================================================
  useEffect(() => {
    // Scan all admitted/active patients for critical thresholds
    // Criteria: SpO2 < 90 OR Heart Rate > 130 OR Heart Rate < 45 OR High Triage Risk / Acuity
    const criticalPatient = patients.find((p) => {
      if (p.status === 'DISCHARGED') return false;
      const spo2 = p.spO2 ?? p.vitals?.spO2 ?? (p as any).spo2;
      const hr = p.heart_rate_bpm ?? p.heartRate ?? p.vitals?.heartRate;
      const risk = p.triage_risk ?? p.triageInfo?.risk;
      const riskScore = p.deterioration_risk ?? p.triageInfo?.riskScore ?? 0;

      const isSpO2Critical = typeof spo2 === 'number' && spo2 > 0 && spo2 < 90;
      const isHRCritical = typeof hr === 'number' && (hr > 130 || hr < 45);
      const isAcuityCritical = risk === 'High' || riskScore >= 75;

      return isSpO2Critical || isHRCritical || isAcuityCritical;
    });

    if (criticalPatient) {
      const spo2 = criticalPatient.spO2 ?? criticalPatient.vitals?.spO2;
      const hr = criticalPatient.heart_rate_bpm ?? criticalPatient.heartRate ?? criticalPatient.vitals?.heartRate;
      
      const reasons: string[] = [];
      if (typeof spo2 === 'number' && spo2 > 0 && spo2 < 90) reasons.push(`SpO₂ critical (${spo2}%)`);
      if (typeof hr === 'number' && hr > 130) reasons.push(`Severe Tachycardia (HR ${hr} bpm)`);
      if (typeof hr === 'number' && hr < 45) reasons.push(`Severe Bradycardia (HR ${hr} bpm)`);
      if (reasons.length === 0) reasons.push(`High Acuity / Deterioration Risk`);

      // Determine bed bay
      const matchingBed = icuBeds.find(b => b.patientId === criticalPatient.id || b.id.includes(criticalPatient.id));
      const bedNumber = matchingBed?.bedCode || criticalPatient.assigned_bed_id || `ICU Bay ${(criticalPatient.id || '01').slice(0, 4).toUpperCase()}`;

      // Assigned Doctor
      const doctorName = criticalPatient.assigned_doctor_name || 
        doctors.find(d => d.id === criticalPatient.assigned_doctor_id)?.name || 
        'Dr. Alistair Vance (Lead ICU)';

      const alertKey = `${criticalPatient.id}-${reasons.join('-')}`;

      setCriticalAlert({
        patientId: criticalPatient.id,
        patientName: criticalPatient.name,
        bedNumber,
        doctorName,
        reason: reasons.join(' • '),
        alertKey,
      });

      // Trigger Web Audio telemetry alarm
      alarmService.playCriticalAlarm(alertKey);
      setIsAlarmActive(true);
    } else {
      // No critical patients; quiet any alarm
      if (alarmService.isAlarmPlaying()) {
        alarmService.stopAlarm();
      }
      setCriticalAlert(null);
      setIsAlarmActive(false);
    }
  }, [patients, icuBeds, doctors]);

  // Acknowledge and mute alarm button handler
  const muteCriticalAlarm = useCallback(() => {
    if (criticalAlert) {
      alarmService.acknowledgeAlarm(criticalAlert.alertKey);
    }
    alarmService.stopAlarm();
    setIsAlarmActive(false);
  }, [criticalAlert]);

  // Doctor operations
  const addDoctor = useCallback(async (doctorData: Omit<Doctor, 'id' | 'created_at'>): Promise<Doctor | null> => {
    const doc = await apiAddDoctor(doctorData);
    if (doc) {
      setDoctors((prev) => [doc, ...prev]);
    }
    return doc;
  }, []);

  const assignDoctorToPatient = useCallback(async (patientId: string, doctorId: string, doctorName?: string): Promise<boolean> => {
    const ok = await apiAssignDoctorToPatient(patientId, doctorId, doctorName);
    if (ok) {
      await refreshPatients();
      await refreshDoctors();
    }
    return ok;
  }, [refreshPatients, refreshDoctors]);

  const updateDoctorStatus = useCallback(async (doctorId: string, status: DoctorStatus): Promise<boolean> => {
    const ok = await apiUpdateDoctorStatus(doctorId, status);
    if (ok) {
      setDoctors((prev) => prev.map(d => d.id === doctorId ? { ...d, status } : d));
    }
    return ok;
  }, []);

  const addPatient = useCallback(async (data: Partial<Patient>): Promise<Patient | null> => {
    const created = await apiAddPatient(data);
    if (created) {
      setActivePatient(created);
    }
    return created;
  }, []);

  const updatePatient = useCallback(async (id: string, data: Partial<Patient>): Promise<Patient | null> => {
    const updated = await apiUpdatePatient(id, data);
    if (updated && activePatient?.id === id) {
      setActivePatient(updated);
    }
    return updated;
  }, [activePatient]);

  const deletePatient = useCallback(async (id: string): Promise<boolean> => {
    // Optimistic UI removal
    setPatients((prev) => prev.filter((p) => p.id !== id));
    setIcuBeds((prev) => prev.filter((b) => !b.id.includes(id)));
    if (activePatient?.id === id) {
      setActivePatient(null);
    }
    const ok = await apiDeletePatient(id);
    return ok;
  }, [activePatient]);

  const dischargePatient = useCallback(async (id: string, notes?: string): Promise<Patient | null> => {
    const updated = await apiUpdatePatient(id, {
      status: 'DISCHARGED',
      clinical_notes: notes || 'Discharged from ICU',
      clinicalNotes: notes || 'Discharged from ICU',
    });
    return updated;
  }, []);

  const resetDatabase = useCallback(() => {
    refreshPatients();
  }, [refreshPatients]);

  const openAddModal = useCallback(() => setIsAddModalOpen(true), []);
  const closeAddModal = useCallback(() => setIsAddModalOpen(false), []);
  const openDoctorModal = useCallback(() => setIsDoctorModalOpen(true), []);
  const closeDoctorModal = useCallback(() => setIsDoctorModalOpen(false), []);

  return (
    <PatientContext.Provider
      value={{
        patients,
        activePatient,
        setActivePatient,
        addPatient,
        updatePatient,
        deletePatient,
        dischargePatient,
        icuBeds,
        doctors,
        addDoctor,
        assignDoctorToPatient,
        updateDoctorStatus,
        refreshDoctors,
        isDoctorModalOpen,
        openDoctorModal,
        closeDoctorModal,
        criticalAlert,
        muteCriticalAlarm,
        isAlarmActive,
        isAddModalOpen,
        openAddModal,
        closeAddModal,
        refreshPatients,
        resetDatabase,
      }}
    >
      {/* 🔴 High-Priority Pulsing Red Emergency Banner Overlay */}
      {criticalAlert && isAlarmActive && (
        <aside
          role="alert"
          aria-live="assertive"
          className="fixed top-0 left-0 right-0 z-50 animate-pulse bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-b-2 border-red-500 shadow-[0_4px_35px_rgba(239,68,68,0.85)] px-4 py-3 text-white backdrop-blur-2xl"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white font-black shadow-[0_0_20px_rgba(239,68,68,0.8)]">
                <AlertTriangle className="h-5 w-5 animate-bounce" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-red-500/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-200 border border-red-400/50">
                    [CRITICAL ALERT]
                  </span>
                  <span className="text-sm font-bold text-white">
                    Patient <span className="underline decoration-red-300 font-black">{criticalAlert.patientName}</span> in <span className="font-black text-rose-200">{criticalAlert.bedNumber}</span> is deteriorating!
                  </span>
                </div>
                <p className="text-xs text-rose-200/90 mt-0.5">
                  Assigned Doctor: <span className="font-bold text-white">{criticalAlert.doctorName}</span> on call. • {criticalAlert.reason}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={muteCriticalAlarm}
                className="flex items-center gap-2 rounded-xl bg-white text-rose-950 px-4 py-2 text-xs font-black shadow-lg hover:bg-rose-50 transition active:scale-95"
                title="Acknowledge critical incident and mute audio synthesizer"
              >
                <VolumeX className="h-4 w-4 text-red-600" />
                <span>Acknowledge & Mute Alarm</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {children}

      {/* Patient Registration Modal with On-Call Doctor Selection */}
      {isAddModalOpen && (
        <AddPatientModal 
          doctors={doctors}
          onClose={closeAddModal} 
          onSave={addPatient} 
        />
      )}

      {/* Doctors & On-Call Roster Modal */}
      {isDoctorModalOpen && (
        <DoctorRosterModal 
          isOpen={isDoctorModalOpen} 
          onClose={closeDoctorModal} 
        />
      )}
    </PatientContext.Provider>
  );
};

export const usePatientContext = (): PatientContextType => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatientContext must be used within a PatientProvider');
  }
  return context;
};

/**
 * Glassmorphic Modal for Registering a New Patient Directly to Supabase
 */
const AddPatientModal: React.FC<{
  doctors: Doctor[];
  onClose: () => void;
  onSave: (data: Partial<Patient>) => Promise<Patient | null>;
}> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState(48);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [complaint, setComplaint] = useState('');
  const [department, setDepartment] = useState('ICU & Emergency');
  const [risk, setRisk] = useState<TriageRisk>('High');
  const [hr, setHr] = useState(94);
  const [bpSys, setBpSys] = useState(132);
  const [bpDia, setBpDia] = useState(86);
  const [tempF, setTempF] = useState(99.2);
  const [rr, setRr] = useState(20);
  const [spo2, setSpo2] = useState(96);
  const [isSaving, setIsSaving] = useState(false);

  // Default to first on-call doctor or first doctor in list
  const initialDoctor = doctors.find(d => d.status === 'ON_CALL') || doctors[0];
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctor?.id || '');
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>(initialDoctor?.name || 'Dr. Alistair Vance (Lead ICU)');

  const handleDoctorChange = (id: string) => {
    setSelectedDoctorId(id);
    const found = doctors.find(d => d.id === id);
    if (found) {
      setSelectedDoctorName(found.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !complaint.trim()) {
      alert('Please provide a patient name and chief clinical complaint.');
      return;
    }

    const riskScore = risk === 'High' ? 84 : risk === 'Medium' ? 52 : 18;
    setIsSaving(true);

    try {
      await onSave({
        name: name.trim(),
        age: Number(age),
        gender,
        department,
        status: 'ADMITTED',
        assigned_doctor_id: selectedDoctorId || undefined,
        assigned_doctor_name: selectedDoctorName || undefined,
        clinical_notes: `Initial Admitting Note: ${complaint}`,
        clinicalNotes: `Initial Admitting Note: ${complaint}`,
        triage_info: {
          chiefComplaint: complaint,
          risk,
          riskScore,
          triageDate: new Date().toISOString(),
        },
        triage_risk: risk,
        heart_rate_bpm: Number(hr),
        bp_systolic: Number(bpSys),
        bp_diastolic: Number(bpDia),
        temperature_f: Number(tempF),
        temperature_F: Number(tempF),
        respiration_rate: Number(rr),
        symptoms: [complaint],
        spO2: Number(spo2),
      });

      onClose();
    } catch (err: any) {
      console.error('Error saving patient:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-purple-500/30 bg-[#120826]/95 p-6 sm:p-8 shadow-[0_0_50px_rgba(168,85,247,0.25)] text-white">
        <div className="flex items-center justify-between pb-4 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600/30 border border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-white">Register Clinical Patient</h3>
              <p className="text-xs text-purple-300/80">Saves directly to Supabase PostgreSQL & syncs real-time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:bg-purple-800/40 transition disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isSaving ? (
          <div className="py-14 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-12 w-12 text-purple-400 animate-spin" />
            <h4 className="mt-4 text-base font-bold text-white">Persisting to Supabase Database...</h4>
            <p className="mt-1 text-xs text-purple-300/70">
              Broadcasting postgres_changes to 3D Ward, Triage, and Telemetry systems.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Patient Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Jonathan Mercer"
                  className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/40 px-3.5 py-2.5 text-sm text-white placeholder-purple-400/40 focus:border-purple-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Age</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/40 px-3.5 py-2.5 text-sm text-white focus:border-purple-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/60 px-3.5 py-2.5 text-sm text-white focus:border-purple-400 focus:outline-none"
                >
                  <option value="Male" className="bg-[#1a0c36] text-white">Male</option>
                  <option value="Female" className="bg-[#1a0c36] text-white">Female</option>
                  <option value="Other" className="bg-[#1a0c36] text-white">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Department</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/60 px-3.5 py-2.5 text-sm text-white focus:border-purple-400 focus:outline-none"
                >
                  <option value="ICU & Emergency" className="bg-[#1a0c36] text-white">ICU & Emergency</option>
                  <option value="Cardiology" className="bg-[#1a0c36] text-white">Cardiology</option>
                  <option value="Neurology" className="bg-[#1a0c36] text-white">Neurology</option>
                  <option value="Pulmonology" className="bg-[#1a0c36] text-white">Pulmonology</option>
                  <option value="General Medicine" className="bg-[#1a0c36] text-white">General Medicine</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Initial Triage Risk</label>
                <select
                  value={risk}
                  onChange={e => setRisk(e.target.value as TriageRisk)}
                  className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/60 px-3.5 py-2.5 text-sm text-white focus:border-purple-400 focus:outline-none"
                >
                  <option value="High" className="bg-[#1a0c36] text-rose-300">High Risk (ICU Alert)</option>
                  <option value="Medium" className="bg-[#1a0c36] text-amber-300">Medium Risk</option>
                  <option value="Low" className="bg-[#1a0c36] text-emerald-300">Low Risk</option>
                </select>
              </div>
            </div>

            {/* Assigned Doctor Dropdown */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center justify-between">
                <span>Assign On-Call Physician</span>
                <span className="text-[10px] font-normal text-purple-400/80">Links patient directly to doctor telemetry</span>
              </label>
              <select
                value={selectedDoctorId}
                onChange={e => handleDoctorChange(e.target.value)}
                className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/60 px-3.5 py-2.5 text-sm text-white focus:border-purple-400 focus:outline-none"
              >
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id} className="bg-[#1a0c36] text-white">
                    {doc.name} — {doc.specialization} [{doc.status === 'ON_CALL' ? '🟢 ON CALL' : doc.status === 'IN_SURGERY' ? '🟡 IN SURGERY' : '⚪ OFF DUTY'}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Chief Complaint & Clinical Presentation</label>
              <input
                type="text"
                required
                value={complaint}
                onChange={e => setComplaint(e.target.value)}
                placeholder="e.g. Sudden severe retrosternal pain, diaphoresis, dyspnea"
                className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/40 px-3.5 py-2.5 text-sm text-white placeholder-purple-400/40 focus:border-purple-400 focus:outline-none"
              />
            </div>

            {/* Vitals Grid */}
            <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300/80 flex items-center gap-1.5 mb-2">
                <Activity className="h-3.5 w-3.5 text-purple-400" />
                Admitting Vital Signs & Telemetry
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-purple-300">Heart Rate (BPM)</label>
                  <input
                    type="number"
                    value={hr}
                    onChange={e => setHr(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-purple-500/30 bg-purple-950/60 p-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-purple-300">BP Systolic / Dia</label>
                  <div className="mt-1 flex items-center gap-1">
                    <input
                      type="number"
                      value={bpSys}
                      onChange={e => setBpSys(Number(e.target.value))}
                      className="w-1/2 rounded-lg border border-purple-500/30 bg-purple-950/60 p-2 text-white text-xs"
                    />
                    <span className="text-purple-400">/</span>
                    <input
                      type="number"
                      value={bpDia}
                      onChange={e => setBpDia(Number(e.target.value))}
                      className="w-1/2 rounded-lg border border-purple-500/30 bg-purple-950/60 p-2 text-white text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-purple-300">SpO₂ (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={spo2}
                    onChange={e => setSpo2(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-purple-500/30 bg-purple-950/60 p-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-purple-300">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempF}
                    onChange={e => setTempF(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-purple-500/30 bg-purple-950/60 p-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-purple-300">Resp Rate (/min)</label>
                  <input
                    type="number"
                    value={rr}
                    onChange={e => setRr(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-purple-500/30 bg-purple-950/60 p-2 text-white text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/20">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-purple-500/30 px-5 py-2.5 text-xs font-semibold text-purple-300 hover:bg-purple-900/40 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:brightness-110 transition"
              >
                <Sparkles className="h-4 w-4" />
                Save to Supabase
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
