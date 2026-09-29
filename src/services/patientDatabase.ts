import { supabase } from '../lib/supabaseClient';
import type { ICUBedData, BedStatus } from '../modules/clinical_intelligence/ICUBedView3D';
import type { VitalSignEntry, Doctor, DoctorStatus } from '../../types';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender?: string;
  department?: string;
  status?: string;
  symptoms?: string[];
  clinical_notes?: string;
  clinicalNotes?: string;
  triage_info?: any;
  triageInfo?: any;
  vitals?: VitalSignEntry[];
  triage_risk?: string;
  ai_summary?: string;
  heart_rate_bpm?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  temperature_f?: number;
  temperature_F?: number;
  respiration_rate?: number;
  assigned_doctor_id?: string;
  assignedDoctorId?: string;
  assigned_doctor_name?: string;
  assignedDoctorName?: string;
  created_at?: string;
  [key: string]: any;
}

export const DEFAULT_DOCTORS: Doctor[] = [
  {
    id: 'doc-001',
    name: 'Dr. Evelyn Reed',
    specialization: 'Chief of Critical Care & Cardiology',
    phone: '+1 (555) 234-5678',
    email: 'evelyn.reed@srm.hosp',
    status: 'ON_CALL',
    department: 'Critical Care & Cardiology',
  },
  {
    id: 'doc-002',
    name: 'Dr. Marcus Vance',
    specialization: 'Trauma Surgery & Resuscitation',
    phone: '+1 (555) 345-6789',
    email: 'marcus.vance@srm.hosp',
    status: 'IN_SURGERY',
    department: 'Trauma Surgery',
  },
  {
    id: 'doc-003',
    name: 'Dr. Sarah Chen',
    specialization: 'Pulmonary Critical Care & ARDS',
    phone: '+1 (555) 456-7890',
    email: 'sarah.chen@srm.hosp',
    status: 'ON_CALL',
    department: 'Pulmonary Critical Care',
  },
  {
    id: 'doc-004',
    name: 'Dr. Ben Carter',
    specialization: 'Neurocritical Care Specialist',
    phone: '+1 (555) 567-8901',
    email: 'ben.carter@srm.hosp',
    status: 'OFF_DUTY',
    department: 'Neurology',
  },
];

export const mapPatientRow = (row: any): Patient => {
  if (!row) return {} as Patient;

  const symptoms = Array.isArray(row.symptoms)
    ? row.symptoms
    : typeof row.symptoms === 'string' && row.symptoms.trim()
    ? [row.symptoms]
    : [];

  const triageInfo = row.triage_info && Object.keys(row.triage_info).length > 0
    ? row.triage_info
    : {
        chiefComplaint: symptoms[0] || row.clinical_notes || 'Clinical Admission',
        risk: row.triage_risk || 'Medium',
        riskScore: row.triage_risk === 'High' ? 85 : row.triage_risk === 'Low' ? 22 : 50,
        triageDate: row.created_at || new Date().toISOString(),
      };

  const hr = Number(row.heart_rate_bpm) || 80;
  const sys = Number(row.bp_systolic) || 120;
  const dia = Number(row.bp_diastolic) || 80;
  const tempF = Number(row.temperature_f) || 98.6;
  const tempC = Number((((tempF - 32) * 5) / 9).toFixed(1));
  const rr = Number(row.respiration_rate) || 16;

  // Normalize vitals into a guaranteed valid VitalSignEntry[] array
  let vitalsList: VitalSignEntry[] = [];
  if (Array.isArray(row.vitals) && row.vitals.length > 0) {
    vitalsList = row.vitals.map((v: any) => ({
      timestamp: v.timestamp || row.created_at || new Date().toISOString(),
      temperature: typeof v.temperature === 'number' ? v.temperature : tempC,
      heartRate: typeof v.heartRate === 'number' ? v.heartRate : Number(v.hr) || hr,
      bloodPressure: {
        systolic: typeof v.bloodPressure?.systolic === 'number' ? v.bloodPressure.systolic : Number(v.bp_systolic) || sys,
        diastolic: typeof v.bloodPressure?.diastolic === 'number' ? v.bloodPressure.diastolic : Number(v.bp_diastolic) || dia,
      },
      respirationRate: typeof v.respirationRate === 'number' ? v.respirationRate : Number(v.rr) || rr,
      symptomsSummary: v.symptomsSummary || 'Bedside vitals logged',
    }));
  } else {
    // Generate baseline telemetry reading from snapshot vitals
    vitalsList = [
      {
        timestamp: row.created_at || new Date().toISOString(),
        temperature: tempC,
        heartRate: hr,
        bloodPressure: {
          systolic: sys,
          diastolic: dia,
        },
        respirationRate: rr,
        symptomsSummary: 'Baseline admission vitals',
      },
    ];
  }

  const assignedDocId = row.assigned_doctor_id || row.assignedDoctorId || undefined;
  const assignedDocName = row.assigned_doctor_name || row.assignedDoctorName || 'Dr. Evelyn Reed';

  return {
    ...row,
    id: String(row.id),
    name: row.name || 'Patient ' + String(row.id).slice(0, 5),
    age: Number(row.age) || 35,
    gender: row.gender || 'Adult',
    department: row.department || 'ICU & Emergency',
    status: row.status || 'ADMITTED',
    symptoms,
    clinical_notes: row.clinical_notes || '',
    clinicalNotes: row.clinical_notes || '',
    triage_info: triageInfo,
    triageInfo,
    vitals: vitalsList,
    triage_risk: row.triage_risk || triageInfo.risk || 'Medium',
    ai_summary: row.ai_summary || '',
    heart_rate_bpm: hr,
    bp_systolic: sys,
    bp_diastolic: dia,
    temperature_f: tempF,
    temperature_F: tempF,
    respiration_rate: rr,
    assigned_doctor_id: assignedDocId,
    assignedDoctorId: assignedDocId,
    assigned_doctor_name: assignedDocName,
    assignedDoctorName: assignedDocName,
    created_at: row.created_at || new Date().toISOString(),
  };
};

/**
 * 1. Fetch all patients dynamically from Supabase in descending order of created_at
 */
export async function getPatients(): Promise<Patient[]> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('SUPABASE FETCH ERROR in getPatients:', error);
      return patientDatabase.getCachedPatients();
    }

    const mapped = (data || []).map(mapPatientRow);
    patientDatabase.setCache(mapped);
    return mapped;
  } catch (err) {
    console.error('SUPABASE FETCH EXCEPTION in getPatients:', err);
    return patientDatabase.getCachedPatients();
  }
}

/**
 * 2. Insert new patient record into Supabase
 */
export async function addPatient(patientData: Partial<Patient>): Promise<Patient | null> {
  const hr = patientData.heart_rate_bpm ?? 80;
  const sys = patientData.bp_systolic ?? 120;
  const dia = patientData.bp_diastolic ?? 80;
  const tempF = patientData.temperature_f ?? patientData.temperature_F ?? 98.6;
  const tempC = Number((((tempF - 32) * 5) / 9).toFixed(1));
  const rr = patientData.respiration_rate ?? 16;
  const symptomsArray = Array.isArray(patientData.symptoms)
    ? patientData.symptoms
    : patientData.symptoms
    ? [patientData.symptoms]
    : [];

  const triageRisk = patientData.triage_risk || patientData.triageInfo?.risk || 'Medium';
  const triageScore =
    patientData.triageInfo?.riskScore ??
    patientData.triage_info?.riskScore ??
    (triageRisk === 'High' ? 85 : triageRisk === 'Medium' ? 52 : 20);

  const initialVitalsEntry: VitalSignEntry = {
    timestamp: new Date().toISOString(),
    temperature: tempC,
    heartRate: hr,
    bloodPressure: { systolic: sys, diastolic: dia },
    respirationRate: rr,
    symptomsSummary: symptomsArray[0] || 'Initial assessment',
  };

  const assignedDocId = patientData.assigned_doctor_id || patientData.assignedDoctorId || null;
  const assignedDocName = patientData.assigned_doctor_name || patientData.assignedDoctorName || 'Dr. Evelyn Reed';

  const payload: any = {
    name: patientData.name || 'Unknown Patient',
    age: Number(patientData.age) || 30,
    gender: patientData.gender || 'Adult',
    department: patientData.department || 'ICU & Emergency',
    status: patientData.status || 'ADMITTED',
    symptoms: symptomsArray,
    clinical_notes: patientData.clinical_notes || patientData.clinicalNotes || '',
    vitals: patientData.vitals || [initialVitalsEntry],
    triage_info: patientData.triage_info || patientData.triageInfo || {
      chiefComplaint: symptomsArray[0] || 'Admitted to ward',
      risk: triageRisk,
      riskScore: triageScore,
      triageDate: new Date().toISOString(),
    },
    triage_risk: triageRisk,
    ai_summary: patientData.ai_summary || '',
    heart_rate_bpm: hr,
    bp_systolic: sys,
    bp_diastolic: dia,
    temperature_f: tempF,
    respiration_rate: rr,
    assigned_doctor_id: assignedDocId,
    assigned_doctor_name: assignedDocName,
  };

  try {
    const { data, error } = await supabase
      .from('patients')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('SUPABASE INSERT ERROR in addPatient:', error);
      alert('Database Save Error: ' + error.message);
      return null;
    }

    console.log('SUCCESSFULLY SAVED TO SUPABASE:', data);
    const created = mapPatientRow(data);
    patientDatabase.addCache(created);
    return created;
  } catch (err: any) {
    console.error('SUPABASE INSERT EXCEPTION in addPatient:', err);
    alert('Database Save Error: ' + (err?.message || 'Connection failed'));
    return null;
  }
}

/**
 * 3. Update patient fields in Supabase by ID
 */
export async function updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | null> {
  const existing = patientDatabase.getPatientById(id);
  const payload: any = {};

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.age !== undefined) payload.age = Number(updates.age);
  if (updates.gender !== undefined) payload.gender = updates.gender;
  if (updates.department !== undefined) payload.department = updates.department;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.symptoms !== undefined) {
    payload.symptoms = Array.isArray(updates.symptoms) ? updates.symptoms : [updates.symptoms];
  }
  if (updates.clinical_notes !== undefined || updates.clinicalNotes !== undefined) {
    payload.clinical_notes = updates.clinical_notes ?? updates.clinicalNotes;
  }
  if (updates.triage_info !== undefined || updates.triageInfo !== undefined) {
    payload.triage_info = updates.triage_info ?? updates.triageInfo;
  }
  if (updates.triage_risk !== undefined) payload.triage_risk = updates.triage_risk;
  if (updates.ai_summary !== undefined) payload.ai_summary = updates.ai_summary;
  
  if (updates.assigned_doctor_id !== undefined || updates.assignedDoctorId !== undefined) {
    payload.assigned_doctor_id = updates.assigned_doctor_id ?? updates.assignedDoctorId;
  }
  if (updates.assigned_doctor_name !== undefined || updates.assignedDoctorName !== undefined) {
    payload.assigned_doctor_name = updates.assigned_doctor_name ?? updates.assignedDoctorName;
  }

  const hr = updates.heart_rate_bpm !== undefined ? Number(updates.heart_rate_bpm) : undefined;
  const sys = updates.bp_systolic !== undefined ? Number(updates.bp_systolic) : undefined;
  const dia = updates.bp_diastolic !== undefined ? Number(updates.bp_diastolic) : undefined;
  const tempF = updates.temperature_f !== undefined || updates.temperature_F !== undefined
    ? Number(updates.temperature_f ?? updates.temperature_F)
    : undefined;
  const rr = updates.respiration_rate !== undefined ? Number(updates.respiration_rate) : undefined;

  if (hr !== undefined) payload.heart_rate_bpm = hr;
  if (sys !== undefined) payload.bp_systolic = sys;
  if (dia !== undefined) payload.bp_diastolic = dia;
  if (tempF !== undefined) payload.temperature_f = tempF;
  if (rr !== undefined) payload.respiration_rate = rr;

  // If vitals list is explicitly passed, persist it
  if (updates.vitals !== undefined) {
    payload.vitals = updates.vitals;
  } else if (hr !== undefined || sys !== undefined || dia !== undefined || tempF !== undefined || rr !== undefined) {
    // Automatically record vital signs history entry
    const finalHr = hr ?? existing?.heart_rate_bpm ?? 80;
    const finalSys = sys ?? existing?.bp_systolic ?? 120;
    const finalDia = dia ?? existing?.bp_diastolic ?? 80;
    const finalTempF = tempF ?? existing?.temperature_f ?? existing?.temperature_F ?? 98.6;
    const finalTempC = Number((((finalTempF - 32) * 5) / 9).toFixed(1));
    const finalRr = rr ?? existing?.respiration_rate ?? 16;

    const newEntry: VitalSignEntry = {
      timestamp: new Date().toISOString(),
      temperature: finalTempC,
      heartRate: finalHr,
      bloodPressure: { systolic: finalSys, diastolic: finalDia },
      respirationRate: finalRr,
      symptomsSummary: updates.clinicalNotes || updates.clinical_notes || 'Bedside vitals logged',
    };

    const currentVitals = Array.isArray(existing?.vitals) ? existing.vitals : [];
    payload.vitals = [newEntry, ...currentVitals];
  }

  try {
    const { data, error } = await supabase
      .from('patients')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('SUPABASE UPDATE ERROR in updatePatient:', error);
      // Fallback local update
      if (existing) {
        const localMerged = mapPatientRow({ ...existing, ...payload });
        patientDatabase.updateCache(localMerged);
        return localMerged;
      }
      return null;
    }

    const mapped = mapPatientRow(data);
    patientDatabase.updateCache(mapped);
    return mapped;
  } catch (err) {
    console.error('SUPABASE UPDATE EXCEPTION in updatePatient:', err);
    if (existing) {
      const localMerged = mapPatientRow({ ...existing, ...payload });
      patientDatabase.updateCache(localMerged);
      return localMerged;
    }
    return null;
  }
}

/**
 * 4. Permanently remove patient record from Supabase by ID
 */
export async function deletePatient(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('SUPABASE DELETE ERROR in deletePatient:', error);
      return false;
    }

    patientDatabase.removeCache(id);
    return true;
  } catch (err) {
    console.error('SUPABASE DELETE EXCEPTION in deletePatient:', err);
    return false;
  }
}

/**
 * 5. Transform Supabase patients rows into 3D ICU Bed telemetry objects
 */
export async function getICUBeds(): Promise<ICUBedData[]> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('SUPABASE FETCH ERROR in getICUBeds:', error);
      return formatBedsFromPatients(patientDatabase.getCachedPatients());
    }

    const allPatients = (data || []).map(mapPatientRow);
    patientDatabase.setCache(allPatients);

    // Filter patients where department or status relates to ICU, or active acuity
    const icuPatients = allPatients.filter((p) => {
      const dept = (p.department || '').toLowerCase();
      const status = (p.status || '').toLowerCase();
      const risk = (p.triage_risk || p.triageInfo?.risk || '').toLowerCase();
      return (
        status !== 'discharged' &&
        (dept.includes('icu') ||
          dept.includes('emergency') ||
          risk === 'high' ||
          status.includes('admitted') ||
          status.includes('icu'))
      );
    });

    const candidates = icuPatients.length > 0
      ? icuPatients
      : allPatients.filter((p) => p.status !== 'DISCHARGED');

    return formatBedsFromPatients(candidates);
  } catch (err) {
    console.error('SUPABASE FETCH EXCEPTION in getICUBeds:', err);
    return formatBedsFromPatients(patientDatabase.getCachedPatients());
  }
}

export function formatBedsFromPatients(patients: Patient[]): ICUBedData[] {
  const bedCoordinates: [number, number, number][] = [
    [-5, 0, -2.5],
    [-1.6, 0, -2.5],
    [1.8, 0, -2.5],
    [5.2, 0, -2.5],
  ];

  const bedRooms = [
    'Bay 1 (North ICU)',
    'Bay 2 (Trauma & Resuscitation)',
    'Bay 3 (Respiratory)',
    'Bay 4 (Step-down ICU)',
  ];

  return patients.slice(0, 4).map((patient, index) => {
    const riskScore =
      patient.triageInfo?.riskScore ??
      patient.triage_info?.riskScore ??
      (patient.triage_risk === 'High' ? 88 : patient.triage_risk === 'Medium' ? 55 : 22);

    const bedStatus: BedStatus =
      riskScore >= 75 ? 'Critical' : riskScore >= 45 ? 'Requires Attention' : 'Stable';

    const hr = patient.heart_rate_bpm || 78;
    const sys = patient.bp_systolic || 120;
    const dia = patient.bp_diastolic || 80;
    const tempF = patient.temperature_f || patient.temperature_F || 98.6;
    const tempC = Number((((tempF - 32) * 5) / 9).toFixed(1));
    const rr = patient.respiration_rate || 16;
    const spO2 = riskScore > 75 ? 89 : riskScore > 50 ? 93 : 99;
    const doctorName = patient.assigned_doctor_name || patient.assignedDoctorName || 'Dr. Evelyn Reed';

    return {
      id: `bed-${patient.id}`,
      bedCode: `ICU-BAY-0${index + 1}`,
      name: patient.name,
      age: patient.age,
      gender: patient.gender || 'Adult',
      diagnosis:
        patient.triageInfo?.chiefComplaint ||
        patient.triage_info?.chiefComplaint ||
        patient.clinicalNotes?.slice(0, 45) ||
        patient.clinical_notes?.slice(0, 45) ||
        'Critical ICU Telemetry Monitoring',
      position: bedCoordinates[index] || [index * 3, 0, -2.5],
      rotationY: 0,
      heartRate: hr,
      bloodPressure: `${sys}/${dia}`,
      spO2,
      respirationRate: rr,
      temperature: tempC,
      status: bedStatus,
      deteriorationRisk: riskScore,
      attendingDoctor: doctorName,
      room: bedRooms[index] || `Bay ${index + 1}`,
    };
  });
}

/**
 * 6. Doctor Management: Fetch Doctors from Supabase
 */
export async function getDoctors(): Promise<Doctor[]> {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('Doctors table not populated yet or query returned empty. Using fallback doctors:', error?.message);
      return patientDatabase.getDoctors();
    }

    const mapped: Doctor[] = data.map((d: any) => ({
      id: String(d.id),
      name: d.name,
      specialization: d.specialization || 'Critical Care Medicine',
      department: d.specialization || d.department || 'ICU',
      phone: d.phone || '+1 (555) 019-2834',
      email: d.email,
      status: (d.status as DoctorStatus) || 'ON_CALL',
      created_at: d.created_at,
    }));

    patientDatabase.setDoctorsCache(mapped);
    return mapped;
  } catch (err) {
    console.error('SUPABASE FETCH EXCEPTION in getDoctors:', err);
    return patientDatabase.getDoctors();
  }
}

/**
 * 7. Add a new doctor to Supabase
 */
export async function addDoctor(doctorData: Partial<Doctor>): Promise<Doctor | null> {
  const payload = {
    name: doctorData.name || 'Dr. New Attending',
    specialization: doctorData.specialization || doctorData.department || 'Critical Care Medicine',
    phone: doctorData.phone || '+1 (555) 123-4567',
    email: doctorData.email || `doc_${Date.now()}@srm.hosp`,
    status: doctorData.status || 'ON_CALL',
  };

  try {
    const { data, error } = await supabase
      .from('doctors')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('SUPABASE INSERT DOCTOR ERROR:', error);
      // Fallback local registration
      const localDoc: Doctor = {
        id: `doc-${Date.now()}`,
        ...payload,
      };
      patientDatabase.addDoctorCache(localDoc);
      return localDoc;
    }

    const created: Doctor = {
      id: String(data.id),
      name: data.name,
      specialization: data.specialization,
      department: data.specialization,
      phone: data.phone,
      email: data.email,
      status: data.status,
      created_at: data.created_at,
    };
    patientDatabase.addDoctorCache(created);
    return created;
  } catch (err) {
    console.error('SUPABASE INSERT DOCTOR EXCEPTION:', err);
    const localDoc: Doctor = {
      id: `doc-${Date.now()}`,
      ...payload,
    };
    patientDatabase.addDoctorCache(localDoc);
    return localDoc;
  }
}

/**
 * 8. Assign Doctor to Patient
 */
export async function assignDoctorToPatient(
  patientId: string, 
  doctorId: string, 
  doctorName?: string
): Promise<Patient | null> {
  const resolvedName = doctorName || 
    patientDatabase.getDoctors().find(d => d.id === doctorId)?.name || 
    'On-Call Specialist';

  return updatePatient(patientId, {
    assigned_doctor_id: doctorId,
    assignedDoctorId: doctorId,
    assigned_doctor_name: resolvedName,
    assignedDoctorName: resolvedName,
  });
}

/**
 * 9. Update Doctor Status
 */
export async function updateDoctorStatus(
  doctorId: string,
  status: DoctorStatus
): Promise<boolean> {
  patientDatabase.updateDoctorStatus(doctorId, status);
  try {
    const { error } = await supabase
      .from('doctors')
      .update({ status })
      .eq('id', doctorId);
    if (error) {
      console.warn('Supabase doctor status update error (using cache):', error);
    }
    return true;
  } catch (err) {
    console.warn('Supabase doctor status update exception:', err);
    return true;
  }
}

/**
 * Central Reactive Store for instantaneous cross-component state synchronization
 */
class PatientDatabaseStore {
  private listeners: ((patients: Patient[]) => void)[] = [];
  private cachedPatients: Patient[] = [];
  private cachedDoctors: Doctor[] = [...DEFAULT_DOCTORS];

  subscribe(listener: (patients: Patient[]) => void) {
    this.listeners.push(listener);
    if (this.cachedPatients.length > 0) {
      listener([...this.cachedPatients]);
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    const copy = [...this.cachedPatients];
    this.listeners.forEach((l) => l(copy));
  }

  setCache(patients: Patient[]) {
    this.cachedPatients = [...patients];
    this.notify();
  }

  addCache(patient: Patient) {
    this.cachedPatients = [patient, ...this.cachedPatients.filter((p) => p.id !== patient.id)];
    this.notify();
  }

  updateCache(patient: Patient) {
    const idx = this.cachedPatients.findIndex((p) => String(p.id) === String(patient.id));
    if (idx !== -1) {
      this.cachedPatients[idx] = { ...this.cachedPatients[idx], ...patient };
    } else {
      this.cachedPatients.unshift(patient);
    }
    this.notify();
  }

  removeCache(id: string) {
    this.cachedPatients = this.cachedPatients.filter((p) => String(p.id) !== String(id));
    this.notify();
  }

  getCachedPatients(): Patient[] {
    return [...this.cachedPatients];
  }

  getPatients(): Patient[] {
    return [...this.cachedPatients];
  }

  getPatientById(id: string): Patient | undefined {
    return this.cachedPatients.find((p) => String(p.id) === String(id));
  }

  getDoctors(): Doctor[] {
    return [...this.cachedDoctors];
  }

  setDoctorsCache(doctors: Doctor[]) {
    this.cachedDoctors = [...doctors];
  }

  addDoctorCache(doctor: Doctor) {
    this.cachedDoctors = [doctor, ...this.cachedDoctors.filter((d) => d.id !== doctor.id)];
  }

  updateDoctorStatus(doctorId: string, status: DoctorStatus) {
    const doc = this.cachedDoctors.find((d) => d.id === doctorId);
    if (doc) {
      doc.status = status;
    }
    // Also try background supabase update
    supabase.from('doctors').update({ status }).eq('id', doctorId).then();
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | null> {
    return updatePatient(id, updates);
  }

  async addPatient(patientData: Partial<Patient>): Promise<Patient | null> {
    return addPatient(patientData);
  }

  async deletePatient(id: string): Promise<boolean> {
    return deletePatient(id);
  }

  async dischargePatient(id: string, notes?: string): Promise<Patient | null> {
    return updatePatient(id, {
      status: 'DISCHARGED',
      clinicalNotes: notes || 'Discharged from ICU',
      clinical_notes: notes || 'Discharged from ICU',
    });
  }

  resetToDefault() {
    getPatients();
  }

  getICUBeds(): ICUBedData[] {
    return formatBedsFromPatients(this.cachedPatients);
  }
}

export const patientDatabase = new PatientDatabaseStore();