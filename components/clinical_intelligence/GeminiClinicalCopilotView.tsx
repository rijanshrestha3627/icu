import React, { useState } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  Heart, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  ShieldAlert, 
  Stethoscope, 
  Pill, 
  Building2, 
  FileText,
  RefreshCw
} from 'lucide-react';
import { usePatientContext } from '../../src/context/PatientContext';
import { 
  calculateTriageRisk, 
  recommendDepartment, 
  checkDrugInteractions, 
  generateSummary,
  askGeminiCopilot,
  getActiveModel,
  getApiKey
} from '../../services/geminiService';

export const GeminiClinicalCopilotView: React.FC = () => {
  const { patients, activePatient, setActivePatient, updatePatient } = usePatientContext();
  const selectedPatient = activePatient || patients[0];

  const [promptQuery, setPromptQuery] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'assistant'; text: string; timestamp: string }[]>([
    {
      role: 'assistant',
      text: 'Hello, Doctor. I am your Gemini Clinical Co-Pilot. I have direct access to the central patient database, active ICU hemodynamics, and medication history. How can I assist with clinical decision support today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);

  const handleRunTriage = async () => {
    if (!selectedPatient) return;
    setActionLoading('triage');
    setActionResult(null);
    try {
      const res = await calculateTriageRisk(selectedPatient);
      const msg = `[AI Triage Score: ${res.score}/100]\n${res.justification}`;
      setActionResult(msg);
      setChatLog(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `🎯 **AI Triage Assessment Completed for ${selectedPatient.name}:**\n• **Acuity Score:** ${res.score}/100\n• **Clinical Justification:** ${res.justification}\n*(Persisted to central database record)*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e: any) {
      setActionResult('Failed to compute triage risk: ' + (e?.message || 'Check API key.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecommendDept = async () => {
    if (!selectedPatient) return;
    setActionLoading('dept');
    setActionResult(null);
    try {
      const res = await recommendDepartment({
        id: selectedPatient.id,
        age: selectedPatient.age,
        gender: selectedPatient.gender,
        chiefComplaint: selectedPatient.triageInfo?.chiefComplaint || 'Acute evaluation',
        vitals: {
          heartRate: selectedPatient.heart_rate_bpm,
          bloodPressure: {
            systolic: selectedPatient.bp_systolic || 120,
            diastolic: selectedPatient.bp_diastolic || 80,
          },
        },
      });
      const msg = `[Recommended Department: ${res.department}]\n${res.explanation}`;
      setActionResult(msg);
      setChatLog(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `🏥 **Department Allocation for ${selectedPatient.name}:**\n• **Recommended:** ${res.department}\n• **Rationale:** ${res.explanation}\n*(Patient department updated in central database)*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e: any) {
      setActionResult('Failed to recommend department: ' + (e?.message || 'Check API key.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckMeds = async () => {
    if (!selectedPatient) return;
    setActionLoading('meds');
    setActionResult(null);
    try {
      const meds = selectedPatient.prescriptions?.map(p => p.medication) || ['Aspirin', 'Heparin', 'Atorvastatin'];
      const res = await checkDrugInteractions(meds, selectedPatient.id);
      const msg = `[Drug Safety: ${res.safe ? 'Safe' : 'Interaction Alert'} • Severity: ${res.severity}]\n${res.summary}`;
      setActionResult(msg);
      setChatLog(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `💊 **Drug Interaction & ADR Analysis for ${selectedPatient.name}:**\n• **Meds Checked:** ${meds.join(', ')}\n• **Risk Severity:** ${res.severity}\n• **Advisory:** ${res.summary}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e: any) {
      setActionResult('Failed to check medications: ' + (e?.message || 'Check API key.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateSummaryReport = async () => {
    if (!selectedPatient) return;
    setActionLoading('summary');
    setActionResult(null);
    try {
      const res = await generateSummary(selectedPatient);
      setActionResult(`Clinical Examination Report generated and stored.`);
      setChatLog(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `📋 **Full Clinical Examination & Discharge Report Generated for ${selectedPatient.name}:**\n\n${res}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e: any) {
      setActionResult('Failed to generate summary: ' + (e?.message || 'Check API key.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptQuery.trim() || isSubmitting) return;

    const userMsg = promptQuery.trim();
    setPromptQuery('');
    setChatLog(prev => [
      ...prev,
      {
        role: 'user',
        text: userMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setIsSubmitting(true);

    try {
      const reply = await askGeminiCopilot(userMsg, selectedPatient);

      setChatLog(prev => [
        ...prev,
        {
          role: 'assistant',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setChatLog(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Error during clinical reasoning: ${err.message || 'Gemini API call failed.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-md shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>AI & Automation Layer</span>
          </div>
          <h3 className="mt-1 text-2xl font-black tracking-tight text-white">Gemini Clinical Co-Pilot</h3>
          <p className="text-xs text-slate-400">
            Real-time differential diagnosis, AI triage acuity calculation, drug interaction scrutiny, and automated clinical summaries.
          </p>
        </div>

        {/* Patient Switcher */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 p-2">
          <Stethoscope className="h-4 w-4 text-cyan-400 ml-1" />
          <span className="text-xs font-semibold text-slate-300">Active Patient:</span>
          <select
            value={selectedPatient?.id}
            onChange={(e) => {
              const found = patients.find(p => p.id === e.target.value);
              if (found) setActivePatient(found);
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                {p.name} ({p.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Telemetry Strip */}
      {selectedPatient && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs backdrop-blur-md">
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase text-cyan-400">Patient</span>
            <p className="font-black text-white text-sm truncate">{selectedPatient.name}</p>
            <p className="text-[11px] text-slate-400">{selectedPatient.age}y • {selectedPatient.gender}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-cyan-400">Acuity Risk</span>
            <p className="font-bold text-rose-400 text-sm">{selectedPatient.triageInfo?.risk || 'Moderate'} ({selectedPatient.triageInfo?.riskScore ?? 45})</p>
            <p className="text-[11px] text-slate-400">{selectedPatient.department || 'ICU'}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-cyan-400">Heart Rate</span>
            <p className="font-black text-white text-sm flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 text-rose-400" />
              {selectedPatient.heart_rate_bpm || 78} bpm
            </p>
            <p className="text-[11px] text-slate-400">BP: {selectedPatient.bp_systolic || 120}/{selectedPatient.bp_diastolic || 80}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-cyan-400">Temp / Resp</span>
            <p className="font-black text-white text-sm">{selectedPatient.temperature_F || 98.6}°F</p>
            <p className="text-[11px] text-slate-400">{selectedPatient.respiration_rate || 16} breaths/min</p>
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase text-cyan-400">Chief Complaint</span>
            <p className="text-xs text-slate-300 truncate">{selectedPatient.triageInfo?.chiefComplaint || 'Acute monitoring'}</p>
          </div>
        </div>
      )}

      {/* Co-Pilot Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick AI Clinical Workflows */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-md">
            <h4 className="text-sm font-black uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              1-Click AI Clinical Actions
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              All outputs automatically sync into the central patient database record.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleRunTriage}
                disabled={Boolean(actionLoading)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-left text-xs font-bold text-white hover:bg-slate-800 hover:border-cyan-500/50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  <div>
                    <p className="text-white">Calculate Triage Risk</p>
                    <p className="text-[10px] text-slate-400 font-normal">Calibrated 1-100 score + clinical justification</p>
                  </div>
                </div>
                {actionLoading === 'triage' && <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />}
              </button>

              <button
                onClick={handleRecommendDept}
                disabled={Boolean(actionLoading)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-left text-xs font-bold text-white hover:bg-slate-800 hover:border-cyan-500/50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4 text-teal-400" />
                  <div>
                    <p className="text-white">Recommend Department</p>
                    <p className="text-[10px] text-slate-400 font-normal">AI routing based on chief complaint & vitals</p>
                  </div>
                </div>
                {actionLoading === 'dept' && <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />}
              </button>

              <button
                onClick={handleCheckMeds}
                disabled={Boolean(actionLoading)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-left text-xs font-bold text-white hover:bg-slate-800 hover:border-cyan-500/50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Pill className="h-4 w-4 text-amber-400" />
                  <div>
                    <p className="text-white">Drug Interaction & ADR</p>
                    <p className="text-[10px] text-slate-400 font-normal">Checks medication safety & contraindications</p>
                  </div>
                </div>
                {actionLoading === 'meds' && <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />}
              </button>

              <button
                onClick={handleGenerateSummaryReport}
                disabled={Boolean(actionLoading)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-left text-xs font-bold text-white hover:bg-slate-800 hover:border-cyan-500/50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-white">Generate Full Examination</p>
                    <p className="text-[10px] text-slate-400 font-normal">Synthesize structured discharge summary</p>
                  </div>
                </div>
                {actionLoading === 'summary' && <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right (2 columns): Interactive Co-Pilot Consultation Thread */}
        <div className="lg:col-span-2 flex flex-col h-[580px] rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black tracking-wide text-white uppercase">Clinical Reasoning Console</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-700">
              {getActiveModel()}
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {chatLog.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase">
                    {msg.role === 'user' ? 'Attending Physician' : 'Gemini Clinical Co-Pilot'}
                  </span>
                  <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                </div>
                <div
                  className={`max-w-[88%] rounded-xl p-4 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                      : 'border border-slate-800 bg-slate-950/80 text-slate-200'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans">{msg.text}</pre>
                </div>
              </div>
            ))}
            {isSubmitting && (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                <span>Gemini is analyzing patient telemetry and medical literature...</span>
              </div>
            )}
          </div>

          {/* Prompt Query Bar */}
          <form onSubmit={handleSendQuery} className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-800">
            <input
              type="text"
              value={promptQuery}
              onChange={e => setPromptQuery(e.target.value)}
              placeholder={`Ask Gemini regarding ${selectedPatient?.name || 'patient'} (e.g. "Assess septic shock trajectory and vasopressor requirements")...`}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting || !promptQuery.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:brightness-110 transition disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GeminiClinicalCopilotView;
