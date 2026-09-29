import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Heart, 
  Activity, 
  Thermometer, 
  Wind, 
  UserPlus, 
  Trash2, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  Save,
  Clock,
  Loader2,
  Stethoscope
} from 'lucide-react';
import { usePatientContext } from '../../src/context/PatientContext';
import { VitalsChart } from '../VitalsChart';
import type { Patient, VitalSignEntry } from '../../types';

export const ActivePatientsView: React.FC = () => {
  const { 
    patients, 
    activePatient, 
    setActivePatient, 
    updatePatient, 
    openAddModal, 
    dischargePatient,
    doctors,
    assignDoctorToPatient
  } = usePatientContext();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Automatically select first patient if none is selected
  useEffect(() => {
    if (!selectedId && patients.length > 0) {
      setSelectedId(activePatient?.id || patients[0].id);
    }
  }, [patients, selectedId, activePatient]);

  const currentPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedId) || activePatient || patients[0] || null;
  }, [patients, selectedId, activePatient]);

  // Inline vitals editing states
  const [hr, setHr] = useState<number>(80);
  const [bpSys, setBpSys] = useState<number>(120);
  const [bpDia, setBpDia] = useState<number>(80);
  const [tempF, setTempF] = useState<number>(98.6);
  const [rr, setRr] = useState<number>(16);
  const [vitalNotes, setVitalNotes] = useState<string>('');

  // Synchronize inputs whenever current patient is chosen or updated
  useEffect(() => {
    if (currentPatient) {
      setHr(currentPatient.heart_rate_bpm ?? 80);
      setBpSys(currentPatient.bp_systolic ?? 120);
      setBpDia(currentPatient.bp_diastolic ?? 80);
      setTempF(currentPatient.temperature_F ?? currentPatient.temperature_f ?? 98.6);
      setRr(currentPatient.respiration_rate ?? 16);
      setVitalNotes('');
      setSaveSuccess(false);
    }
  }, [currentPatient?.id]);

  const handleSelectPatient = (p: Patient) => {
    setSelectedId(p.id);
    setActivePatient(p);
  };

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const now = new Date().toISOString();
      const numTempF = Number(tempF) || 98.6;
      const tempC = Number((((numTempF - 32) * 5) / 9).toFixed(1));
      const numHr = Number(hr) || 80;
      const numSys = Number(bpSys) || 120;
      const numDia = Number(bpDia) || 80;
      const numRr = Number(rr) || 16;

      const newEntry: VitalSignEntry = {
        timestamp: now,
        temperature: tempC,
        heartRate: numHr,
        bloodPressure: {
          systolic: numSys,
          diastolic: numDia,
        },
        respirationRate: numRr,
        symptomsSummary: vitalNotes.trim() || 'Bedside vitals logged',
      };

      const existingVitals = Array.isArray(currentPatient.vitals) ? currentPatient.vitals : [];
      const updatedVitals = [newEntry, ...existingVitals];

      const noteToAppend = vitalNotes.trim()
        ? `${currentPatient.clinicalNotes || ''}\n\n[VITALS LOGGED ${new Date().toLocaleTimeString()}]: HR ${numHr} bpm, BP ${numSys}/${numDia} mmHg, Temp ${numTempF}°F - ${vitalNotes.trim()}`
        : currentPatient.clinicalNotes;

      await updatePatient(currentPatient.id, {
        heart_rate_bpm: numHr,
        bp_systolic: numSys,
        bp_diastolic: numDia,
        temperature_f: numTempF,
        temperature_F: numTempF,
        respiration_rate: numRr,
        vitals: updatedVitals,
        clinicalNotes: noteToAppend,
        clinical_notes: noteToAppend,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to log bedside vitals:', err);
      alert('Error updating patient vitals. Please check database connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = patients.filter((p) => {
    if (p.status === 'DISCHARGED') return false;
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q) ||
      (p.department || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-white">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-purple-500/30 bg-[#120826]/90 p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(147,51,234,0.15)]">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
            <Users className="h-3.5 w-3.5" />
            <span>Clinical Operations</span>
          </div>
          <h3 className="mt-1 text-2xl font-black tracking-tight text-white">Active Patients & Vitals Logging</h3>
          <p className="text-xs text-purple-200/70">
            Manage hospital in-patients, record bedside telemetry, and sync vitals across 3D Ward and AI engines.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:brightness-110 transition"
        >
          <UserPlus className="h-4 w-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Patient List Roster (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name, PID, or department..."
              className="w-full rounded-2xl border border-purple-500/30 bg-[#120826]/90 py-2.5 pl-10 pr-4 text-xs text-white placeholder-purple-400/40 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-purple-500/20 bg-[#100724]/60 p-8 text-center text-purple-300/70 text-xs">
                No active patients found matching your search.
              </div>
            ) : (
              filtered.map((patient) => {
                const isSelected = patient.id === currentPatient?.id;
                return (
                  <div
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                      isSelected
                        ? 'border-purple-400 bg-[#170a36] shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                        : 'border-purple-500/20 bg-[#100724]/80 hover:bg-[#140a2c] hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-white">{patient.name}</h4>
                        <p className="text-[11px] text-purple-300">
                          {patient.id} • {patient.age}y / {patient.gender} • {patient.department || 'ICU'}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] font-bold uppercase rounded-full px-2 py-0.5 border border-purple-500/30 bg-purple-950/60 text-purple-300">
                        {patient.triageInfo?.risk || patient.triage_risk || 'Medium'} Risk
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-3 text-[10px] text-purple-300/80">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-rose-400" />
                        {patient.heart_rate_bpm || 80} bpm
                      </span>
                      <span>•</span>
                      <span>
                        BP: {patient.bp_systolic || 120}/{patient.bp_diastolic || 80}
                      </span>
                      <span>•</span>
                      <span>{patient.temperature_F || patient.temperature_f || 98.6}°F</span>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-purple-300/90 font-medium">
                      <Stethoscope className="h-3 w-3 text-cyan-400" />
                      <span>{patient.assigned_doctor_name || 'Dr. Alistair Vance (Lead ICU)'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Patient Details & Vitals Logger (7 cols) */}
        {currentPatient ? (
          <div className="lg:col-span-7 space-y-6">
            {/* Patient Header Card */}
            <div className="rounded-3xl border border-purple-500/30 bg-[#120826]/90 p-5 backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs text-purple-400 font-bold">{currentPatient.id}</span>
                  <h3 className="text-xl font-black text-white">{currentPatient.name}</h3>
                  <p className="text-xs text-purple-300/80">
                    Age: {currentPatient.age} • Gender: {currentPatient.gender} • Dept: {currentPatient.department}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Discharge ${currentPatient.name}?`)) {
                      dischargePatient(currentPatient.id, 'Discharged from Active Patients View.');
                    }
                  }}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition"
                >
                  Discharge
                </button>
              </div>

              <div className="mt-3 rounded-2xl border border-purple-500/20 bg-purple-950/40 p-3 text-xs">
                <span className="text-[10px] font-bold uppercase text-purple-400">Chief Complaint</span>
                <p className="mt-0.5 text-purple-100">
                  {currentPatient.triageInfo?.chiefComplaint ||
                    currentPatient.symptoms?.[0] ||
                    currentPatient.clinicalNotes ||
                    'Clinical evaluation under way'}
                </p>
              </div>

              {/* Assigned Physician Selector */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-purple-500/20 bg-purple-950/30 p-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-cyan-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Assigned Physician</span>
                    <span className="text-[10px] text-purple-300/70">Receives real-time telemetry deterioration alerts</span>
                  </div>
                </div>
                <select
                  value={currentPatient.assigned_doctor_id || ''}
                  onChange={async (e) => {
                    const docId = e.target.value;
                    const doc = doctors.find(d => d.id === docId);
                    if (doc) {
                      await assignDoctorToPatient(currentPatient.id, doc.id, doc.name);
                    }
                  }}
                  className="rounded-xl border border-purple-500/30 bg-purple-950/80 px-3 py-1.5 text-xs font-bold text-white focus:border-purple-400 focus:outline-none"
                >
                  <option value="" disabled>Select On-Call Physician</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id} className="bg-[#120826] text-white">
                      {d.name} ({d.specialization}) — [{d.status === 'ON_CALL' ? '🟢 ON CALL' : d.status === 'IN_SURGERY' ? '🟡 IN SURGERY' : '⚪ OFF DUTY'}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vitals Entry Form */}
            <form onSubmit={handleSaveVitals} className="rounded-3xl border border-purple-500/30 bg-[#120826]/90 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-400" />
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">Log Live Bedside Vitals</h4>
                </div>
                {saveSuccess && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 animate-pulse">
                    <CheckCircle2 className="h-4 w-4" />
                    Vitals synced to central DB!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-purple-300">Heart Rate (BPM)</label>
                  <input
                    type="number"
                    required
                    value={hr}
                    onChange={(e) => setHr(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/60 p-2.5 text-white font-bold focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-purple-300">BP Systolic</label>
                  <input
                    type="number"
                    required
                    value={bpSys}
                    onChange={(e) => setBpSys(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/60 p-2.5 text-white font-bold focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-purple-300">BP Diastolic</label>
                  <input
                    type="number"
                    required
                    value={bpDia}
                    onChange={(e) => setBpDia(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/60 p-2.5 text-white font-bold focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-purple-300">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={tempF}
                    onChange={(e) => setTempF(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/60 p-2.5 text-white font-bold focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-purple-300">Clinical Observations & Vitals Note</label>
                <input
                  type="text"
                  value={vitalNotes}
                  onChange={(e) => setVitalNotes(e.target.value)}
                  placeholder="e.g. Patient resting quietly, sinus rhythm on telemetry, good peripheral perfusion"
                  className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/40 p-2.5 text-xs text-white placeholder-purple-400/40 focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:brightness-110 transition disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Syncing Vitals to Database...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save & Broadcast Vitals</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Vitals Telemetry Chart */}
            <div className="rounded-3xl border border-purple-500/30 bg-[#120826]/90 p-5 backdrop-blur-xl">
              <VitalsChart patient={currentPatient} />
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 rounded-3xl border border-purple-500/30 bg-[#120826]/90 p-8 text-center text-purple-300">
            Please select a patient from the list.
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivePatientsView;
