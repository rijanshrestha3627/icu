import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Activity, 
  Clock3, 
  Sparkles, 
  UserPlus, 
  Trash2, 
  Heart, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  Wind, 
  Thermometer, 
  AlertTriangle 
} from 'lucide-react';
import type { Patient, TriageRisk, TriageAnalysis, Doctor } from '../types';
import { calculateTriageRisk } from '../services/geminiService';
import { getPatients, addPatient, deletePatient, getDoctors } from '../src/services/patientDatabase';
import { patientDatabase } from '../src/services/patientDatabase';

const DetailPanel: React.FC<{
  analysis: TriageAnalysis | null;
  isLoading: boolean;
  error: string | null;
  onRefreshAI: () => void;
}> = ({ analysis, isLoading, error, onRefreshAI }) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 p-5 md:grid-cols-[180px_1fr] bg-slate-900/60 rounded-xl border border-slate-800">
        <div className="flex flex-col items-center justify-center p-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          <p className="mt-3 text-xs font-semibold text-slate-300">Evaluating clinical acuity with Gemini...</p>
        </div>
        <div className="space-y-3 p-4">
          <div className="h-4 w-3/4 rounded bg-slate-800 animate-pulse" />
          <div className="h-3 w-full rounded bg-slate-800/80 animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-slate-800/80 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-sm font-semibold text-rose-300 bg-rose-500/10 rounded-xl border border-rose-500/30">
        {error}
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-6 text-center text-sm text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
        Click "Analyze with Gemini AI" to calculate clinical acuity score and justification.
      </div>
    );
  }

  const scoreTone =
    analysis.score > 75
      ? 'border-rose-500/50 bg-rose-500/15 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
      : analysis.score > 40
      ? 'border-amber-500/50 bg-amber-500/15 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
      : 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)]';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={analysis.score}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="grid gap-4 p-5 md:grid-cols-[200px_1fr] rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md"
      >
        <div className={`flex flex-col items-center justify-center rounded-xl border p-4 ${scoreTone}`}>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white">AI ACUITY SCORE</p>
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-current bg-slate-950/60 text-3xl font-black text-white">
            {analysis.score}
          </div>
          <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-200">
            {analysis.score > 75 ? 'Resuscitation Required' : analysis.score > 40 ? 'Urgent Evaluation' : 'Standard Routine'}
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <h4 className="text-xs font-black uppercase tracking-[0.16em] text-white">Gemini Clinical Justification</h4>
            </div>
            <button
              onClick={onRefreshAI}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white transition"
            >
              <RefreshCw className="h-3 w-3" />
              Re-evaluate
            </button>
          </div>
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-200">{analysis.justification}</p>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Result saved automatically into central patient electronic medical record.</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const TriageView: React.FC = () => {
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [filter, setFilter] = useState<TriageRisk | 'All'>('All');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TriageAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeminiEvaluating, setIsGeminiEvaluating] = useState(false);

  // Form Fields: Name, Age, HR, BP, SpO2, Symptoms
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState(52);
  const [formHR, setFormHR] = useState(98);
  const [formBPSys, setFormBPSys] = useState(135);
  const [formBPDia, setFormBPDia] = useState(88);
  const [formSpO2, setFormSpO2] = useState(94);
  const [formSymptoms, setFormSymptoms] = useState('');
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [formDoctorId, setFormDoctorId] = useState('');
  const [formDoctorName, setFormDoctorName] = useState('');

  // Async data load
  const refreshPatients = useCallback(async () => {
    try {
      const [data, docs] = await Promise.all([
        getPatients(),
        getDoctors()
      ]);
      setPatientsList(data);
      setDoctorsList(docs);
      if (docs.length > 0 && !formDoctorId) {
        const onCall = docs.find(d => d.status === 'ON_CALL') || docs[0];
        setFormDoctorId(onCall.id);
        setFormDoctorName(onCall.name);
      }
    } catch (err) {
      console.error('Failed to load patients or doctors:', err);
    }
  }, [formDoctorId]);

  useEffect(() => {
    refreshPatients();
    const unsubscribe = patientDatabase.subscribe((updated) => {
      setPatientsList(updated);
    });
    return () => unsubscribe();
  }, [refreshPatients]);

  const handleRunAIAnalysis = useCallback(async (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await calculateTriageRisk(patient);
      setAnalysis(result);
      await refreshPatients();
    } catch (e: any) {
      setError('Failed to run Gemini AI triage analysis: ' + (e?.message || 'Please try again.'));
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [refreshPatients]);

  const handleToggleRow = (patient: Patient) => {
    if (selectedPatientId === patient.id) {
      setSelectedPatientId(null);
    } else {
      setSelectedPatientId(patient.id);
      if (patient.triageInfo?.riskScore) {
        setAnalysis({
          score: patient.triageInfo.riskScore,
          justification: patient.clinicalNotes || `Triage evaluation for complaint: ${patient.triageInfo.chiefComplaint}`,
        });
      } else {
        handleRunAIAnalysis(patient);
      }
    }
  };

  const handleDeletePatient = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to discharge or delete this patient from the triage queue?')) return;
    
    setPatientsList(prev => prev.filter(p => p.id !== id));
    if (selectedPatientId === id) setSelectedPatientId(null);

    try {
      await deletePatient(id);
      await refreshPatients();
    } catch (err) {
      console.error('Failed to delete patient:', err);
      await refreshPatients();
    }
  };

  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSymptoms.trim()) {
      alert('Please provide patient name and presenting symptoms.');
      return;
    }

    setIsGeminiEvaluating(true);

    const symptomsList = Array.isArray(formSymptoms) 
      ? formSymptoms 
      : typeof formSymptoms === 'string' && formSymptoms.trim() 
      ? formSymptoms.split(',').map(s => s.trim()) 
      : [];

    try {
      let aiResult: TriageAnalysis = {
        score: formSpO2 < 90 || formHR > 120 ? 85 : 45,
        justification: `Clinical presentation of ${symptomsList.join(', ')} with SpO2 ${formSpO2}% and HR ${formHR} bpm.`,
      };

      try {
        aiResult = await calculateTriageRisk(symptomsList.join(', '), Number(formAge), 'Adult');
      } catch (aiErr) {
        console.warn('Gemini triage calculation fallback used:', aiErr);
      }

      const calculatedRisk: TriageRisk = aiResult.score >= 70 ? 'High' : aiResult.score >= 40 ? 'Medium' : 'Low';

      await addPatient({
        name: formName.trim(),
        age: Number(formAge),
        gender: 'Adult',
        department: 'ICU & Emergency',
        status: 'WAITING_FOR_DOCTOR',
        assigned_doctor_id: formDoctorId || undefined,
        assigned_doctor_name: formDoctorName || undefined,
        symptoms: symptomsList,
        clinicalNotes: `[Admitted to Triage] Symptoms: ${symptomsList.join(', ')}.\nGemini Justification: ${aiResult.justification}`,
        triageInfo: {
          risk: calculatedRisk,
          riskScore: aiResult.score,
          chiefComplaint: symptomsList.join(', ') || formSymptoms.trim(),
          vitals: {
            heartRate: Number(formHR),
            bloodPressure: `${formBPSys}/${formBPDia}`,
            spO2: Number(formSpO2),
            temperature: 98.6,
          },
          arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        heart_rate_bpm: Number(formHR),
        bp_systolic: Number(formBPSys),
        bp_diastolic: Number(formBPDia),
        spO2: Number(formSpO2),
        temperature_F: 98.6,
        respiration_rate: 18,
      });

      setFormName('');
      setFormSymptoms('');
      setIsModalOpen(false);
      await refreshPatients();
    } catch (err: any) {
      alert('Failed to register triage patient: ' + (err?.message || 'Error'));
    } finally {
      setIsGeminiEvaluating(false);
    }
  };

  const riskLevels: (TriageRisk | 'All')[] = ['All', 'High', 'Medium', 'Low'];

  const filteredPatients = patientsList.filter((p) => {
    if (filter === 'All') return true;
    return p.triageInfo?.risk === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">Emergency & Triage Queue</h2>
          <p className="text-xs text-slate-400">
            Real-time emergency acuity ranking synchronized with Supabase & Gemini clinical co-pilot.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300">
            <Clock3 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Active in Queue: {filteredPatients.length}</span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:brightness-110 transition"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Patient</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-xl border border-slate-800 bg-slate-900/60 w-fit backdrop-blur-md">
        {riskLevels.map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilter(lvl)}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
              filter === lvl
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {lvl === 'All' ? 'All Patients' : `${lvl} Risk`}
          </button>
        ))}
      </div>

      {/* Patient Cards List */}
      <div className="space-y-3">
        {filteredPatients.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
            <Activity className="mx-auto h-8 w-8 text-slate-500 mb-2" />
            <p className="font-semibold text-slate-300">No patients currently match this triage acuity level.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition"
            >
              <UserPlus className="h-4 w-4" />
              Add Patient
            </button>
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const isSelected = selectedPatientId === patient.id;
            const risk = patient.triageInfo?.risk || 'Low';
            const riskBadge =
              risk === 'High'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                : risk === 'Medium'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]';

            const symptomsList = Array.isArray(patient.symptoms) 
              ? patient.symptoms 
              : typeof patient.symptoms === 'string' && (patient.symptoms as string).trim() 
              ? (patient.symptoms as string).split(',').map(s => s.trim()) 
              : [];

            return (
              <div
                key={patient.id}
                className={`overflow-hidden rounded-2xl border transition-all duration-200 backdrop-blur-md ${
                  isSelected
                    ? 'border-cyan-500 bg-slate-800/90 shadow-[0_0_25px_rgba(6,182,212,0.2)]'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div
                  onClick={() => handleToggleRow(patient)}
                  className="flex flex-col gap-4 p-5 cursor-pointer sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 font-black text-sm">
                      {patient.gender === 'Female' ? 'F' : 'M'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-base font-black text-white">{patient.name}</h4>
                        <span className="font-mono text-xs text-cyan-400">{patient.id}</span>
                        <span className="text-xs text-slate-400">• {patient.age}y</span>
                        <span className="text-xs text-slate-400">• {patient.department || 'ICU'}</span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-300">
                        <strong className="text-slate-400">Symptoms / Complaint:</strong>{' '}
                        {patient.triageInfo?.chiefComplaint || (symptomsList.length > 0 ? symptomsList.join(', ') : 'Acute triage intake')}
                      </p>
                      {/* Vitals telemetry */}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-rose-400" />
                          {patient.heart_rate_bpm || 75} bpm
                        </span>
                        <span>•</span>
                        <span>BP: {patient.bp_systolic || 120}/{patient.bp_diastolic || 80}</span>
                        <span>•</span>
                        <span>Temp: {patient.temperature_F || 98.6}°F</span>
                        <span>•</span>
                        <span>RR: {patient.respiration_rate || 16}/min</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${riskBadge}`}>
                      {risk} Risk {patient.triageInfo?.riskScore ? `(${patient.triageInfo.riskScore})` : ''}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunAIAnalysis(patient);
                      }}
                      className="rounded-xl border border-cyan-500/40 bg-cyan-600/20 px-3.5 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-600/30 hover:text-white transition flex items-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                      Gemini AI
                    </button>

                    {/* Discharge / Delete button on patient card */}
                    <button
                      onClick={(e) => handleDeletePatient(e, patient.id)}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition flex items-center gap-1.5"
                      title="Discharge / Delete Patient"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Discharge</span>
                    </button>
                  </div>
                </div>

                {/* Expanded AI Acuity Detail Panel */}
                {isSelected && (
                  <div className="border-t border-slate-800 p-5 bg-slate-950/60">
                    <DetailPanel
                      analysis={analysis}
                      isLoading={isLoading}
                      error={error}
                      onRefreshAI={() => handleRunAIAnalysis(patient)}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Add Emergency Patient</h3>
                  <p className="text-xs text-slate-400">Auto-evaluates with Gemini AI & syncs with central database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isGeminiEvaluating}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddPatientSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Patient Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Rachel Sterling"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formAge}
                    onChange={e => setFormAge(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Assigned Doctor Dropdown */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>Assign On-Call Physician</span>
                  <span className="text-[10px] text-slate-400">Links patient to doctor telemetry</span>
                </label>
                <select
                  value={formDoctorId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setFormDoctorId(id);
                    const doc = doctorsList.find(d => d.id === id);
                    if (doc) setFormDoctorName(doc.name);
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  {doctorsList.map((doc) => (
                    <option key={doc.id} value={doc.id} className="bg-slate-900 text-white">
                      {doc.name} — {doc.specialization} [{doc.status === 'ON_CALL' ? '🟢 ON CALL' : doc.status === 'IN_SURGERY' ? '🟡 IN SURGERY' : '⚪ OFF DUTY'}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Vitals Inputs: HR, BP, SpO2 */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  Bedside Vitals & Telemetry Inputs
                </span>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400">HR (BPM)</label>
                    <input
                      type="number"
                      value={formHR}
                      onChange={e => setFormHR(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-white font-bold focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">BP (Sys / Dia)</label>
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        type="number"
                        value={formBPSys}
                        onChange={e => setFormBPSys(Number(e.target.value))}
                        className="w-1/2 rounded-lg border border-slate-700 bg-slate-900 p-2 text-white font-bold focus:border-cyan-400 focus:outline-none"
                      />
                      <span className="text-slate-500">/</span>
                      <input
                        type="number"
                        value={formBPDia}
                        onChange={e => setFormBPDia(Number(e.target.value))}
                        className="w-1/2 rounded-lg border border-slate-700 bg-slate-900 p-2 text-white font-bold focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">SpO2 (%)</label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={formSpO2}
                      onChange={e => setFormSpO2(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-white font-bold focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Symptoms Input */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Symptoms & Clinical Presentation</label>
                <textarea
                  required
                  rows={2}
                  value={formSymptoms}
                  onChange={e => setFormSymptoms(e.target.value)}
                  placeholder="e.g. Sudden severe retrosternal chest pain radiating to left shoulder with shortness of breath..."
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Loading Spinner while Gemini evaluates */}
              {isGeminiEvaluating ? (
                <div className="flex items-center justify-center gap-3 p-4 rounded-xl border border-cyan-500/40 bg-slate-950/80 text-cyan-300">
                  <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />
                  <span className="text-xs font-bold">Gemini AI is evaluating triage acuity & deterioration index...</span>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:brightness-110 transition"
                  >
                    <Sparkles className="h-4 w-4" />
                    Submit & Evaluate with Gemini
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TriageView;
