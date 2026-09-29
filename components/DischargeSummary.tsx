import React, { useState, useCallback, useEffect } from 'react';
import { ArrowRight, BrainCircuit, Sparkles, UserCheck, FileCheck, RefreshCw, Printer } from 'lucide-react';
import type { Patient } from '../types';
import { generateSummary } from '../services/geminiService';
import { usePatientContext } from '../src/context/PatientContext';

interface ExaminerProps {
  patient?: Patient;
}

export const Examiner: React.FC<ExaminerProps> = ({ patient: propPatient }) => {
  const { patients, activePatient, setActivePatient, dischargePatient } = usePatientContext();
  
  // Use prop patient if provided, else use activePatient from context or first available
  const selectedPatient = propPatient || activePatient || patients[0];

  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dischargeSuccess, setDischargeSuccess] = useState<boolean>(false);

  // If patient changes, check if they already have an AI summary in their notes
  useEffect(() => {
    if (selectedPatient?.clinicalNotes && selectedPatient.clinicalNotes.includes('[GEMINI AI CLINICAL SUMMARY')) {
      const parts = selectedPatient.clinicalNotes.split('[GEMINI AI CLINICAL SUMMARY');
      const latestSummary = parts[parts.length - 1];
      setAnalysis(`[GEMINI AI CLINICAL SUMMARY${latestSummary}`);
    } else {
      setAnalysis('');
    }
    setDischargeSuccess(false);
  }, [selectedPatient]);

  const handleGenerateAnalysis = useCallback(async () => {
    if (!selectedPatient) return;
    setIsLoading(true);
    setError(null);
    setAnalysis('');
    try {
      // Calls Gemini AI and automatically saves into patient record in central database!
      const result = await generateSummary(selectedPatient);
      setAnalysis(result);
    } catch (e: any) {
      setError('Failed to generate clinical summary. ' + (e?.message || 'Please check Gemini API key.'));
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPatient]);

  const handleFinalizeDischarge = () => {
    if (!selectedPatient) return;
    if (confirm(`Confirm final clinical discharge for ${selectedPatient.name}?`)) {
      dischargePatient(selectedPatient.id, 'Clinical examination & discharge completed with AI summary.');
      setDischargeSuccess(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!selectedPatient) {
    return (
      <div className="rounded-3xl border border-purple-500/30 bg-[#120826]/90 p-8 text-center text-purple-200">
        No active patient selected for discharge summary.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-3xl border border-purple-500/30 bg-[#120826]/90 p-6 shadow-[0_0_40px_rgba(147,51,234,0.18)] backdrop-blur-2xl text-white">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>Clinical Documentation</span>
          </div>
          <h3 className="text-xl font-black tracking-tight text-white">
            Discharge Summary & Clinical Examination
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Patient Selector if not locked by props */}
          {!propPatient && (
            <select
              value={selectedPatient.id}
              onChange={(e) => {
                const found = patients.find(p => p.id === e.target.value);
                if (found) setActivePatient(found);
              }}
              className="rounded-xl border border-purple-500/30 bg-purple-950/60 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id} className="bg-[#190a36] text-white">
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            <Sparkles className="h-3.5 w-3.5" />
            Gemini AI
          </div>
        </div>
      </div>

      {/* Selected Patient Banner */}
      <div className="mb-4 rounded-2xl border border-purple-500/20 bg-purple-950/30 p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-white">{selectedPatient.name}</span>
            <span className="font-mono text-purple-300/80">({selectedPatient.id})</span>
            <span className="text-purple-300">• {selectedPatient.age}y / {selectedPatient.gender}</span>
            <span className="text-purple-300">• Dept: {selectedPatient.department || 'ICU'}</span>
          </div>
          <div className="text-purple-300/80">
            <span>Status: </span>
            <span className="font-bold text-white uppercase">{selectedPatient.status || 'ACTIVE'}</span>
          </div>
        </div>
        <p className="mt-1 text-purple-200/90 truncate">
          <strong>Admitting Complaint:</strong> {selectedPatient.triageInfo?.chiefComplaint || 'Standard ICU evaluation'}
        </p>
      </div>

      {/* Main Analysis Output Area */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-purple-500/20 bg-[#0c051a]/80 p-5 text-xs text-purple-100/90 leading-relaxed font-sans min-h-[300px]">
        {isLoading ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-purple-400 border-t-transparent" />
            <p className="font-bold text-purple-200">Gemini Clinical Intelligence is generating examination report...</p>
            <span className="text-[11px] text-purple-400">Synthesizing hemodynamics, lab values, and treatment plan</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-300">
            {error}
          </div>
        ) : analysis ? (
          <div>
            <div className="mb-3 flex items-center justify-between border-b border-purple-500/20 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5" />
                Verified Clinical Examination Report (Synced to Central Database)
              </span>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 text-[11px] font-semibold text-purple-300 hover:text-white transition"
              >
                <Printer className="h-3.5 w-3.5" />
                Print / Export
              </button>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-purple-100">
              {analysis}
            </pre>
          </div>
        ) : (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center text-purple-300/70 p-6">
            <BrainCircuit className="h-10 w-10 text-purple-400/50" />
            <p className="max-w-md font-medium text-purple-200">
              Generate an authoritative, structured clinical discharge summary powered by Gemini AI. Consumes complete patient history, vitals trajectory, and inpatient prescriptions.
            </p>
          </div>
        )}
      </div>

      {dischargeSuccess && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs text-emerald-300">
          <UserCheck className="h-4 w-4" />
          <span>Patient status successfully updated to DISCHARGED. Record synced across all hospital modules.</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        <button
          onClick={handleGenerateAnalysis}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:brightness-110 transition disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Generate Gemini AI Summary
            </>
          )}
        </button>

        <button
          onClick={handleFinalizeDischarge}
          disabled={selectedPatient.status === 'DISCHARGED'}
          className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-950/50 px-5 py-2.5 text-xs font-bold text-purple-200 hover:bg-purple-900/60 hover:text-white transition disabled:opacity-50"
        >
          <UserCheck className="h-3.5 w-3.5" />
          {selectedPatient.status === 'DISCHARGED' ? 'Already Discharged' : 'Finalize & Discharge Patient'}
        </button>
      </div>
    </div>
  );
};

export const DischargeSummary = Examiner;
export default Examiner;