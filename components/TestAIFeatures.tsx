import React, { useState } from 'react';
import { generateSummary, calculateTriageRisk, getApiKey, getActiveModel } from '../services/geminiService';
import { Sparkles, BrainCircuit, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const TestAIFeatures: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTest, setActiveTest] = useState<string | null>(null);

  const testDischargeSummary = async () => {
    setIsLoading(true);
    setActiveTest('summary');
    setError(null);
    setTestResult('');
    
    try {
      const testNotes = "Patient presented with acute retrosternal chest pain. ECG demonstrated ST elevation in leads V1-V4. Admitted to ICU with diagnosis of Acute Anterior STEMI, underwent emergency primary PCI with drug-eluting stent. Hemodynamically stable on dual antiplatelet therapy.";
      const result = await generateSummary(testNotes);
      setTestResult(result);
    } catch (e) {
      setError('Failed to generate discharge summary: ' + (e as Error).message);
      console.error(e);
    } finally {
      setIsLoading(false);
      setActiveTest(null);
    }
  };

  const testTriageRisk = async () => {
    setIsLoading(true);
    setActiveTest('triage');
    setError(null);
    setTestResult('');
    
    try {
      const result = await calculateTriageRisk("Severe crushing chest pain radiating to left jaw with diaphoresis", 54, "Male");
      setTestResult(`Risk Score: ${result.score}/100\n\nClinical Justification:\n${result.justification}`);
    } catch (e) {
      setError('Failed to calculate triage risk: ' + (e as Error).message);
      console.error(e);
    } finally {
      setIsLoading(false);
      setActiveTest(null);
    }
  };

  const hasKey = Boolean(getApiKey());

  return (
    <div className="space-y-6 text-white max-w-3xl mx-auto">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Diagnostic Test Console</span>
        </div>
        <h3 className="mt-1 text-2xl font-black tracking-tight text-white">Gemini AI Features Benchmark</h3>
        <p className="text-xs text-slate-400">
          Run automated verification suites against {getActiveModel()} for clinical triage risk assessment and structured discharge summaries.
        </p>

        <div className="mt-4 flex items-center gap-2 text-xs">
          <span className="text-slate-400">API Status:</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold ${
            hasKey ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            {hasKey ? '● API Key Detected' : '● Using Simulated Fallback'}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-md space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={testDischargeSummary}
            disabled={isLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-3 text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:brightness-110 transition disabled:opacity-50"
          >
            {activeTest === 'summary' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
            Test Gemini Discharge Summary
          </button>
          
          <button
            onClick={testTriageRisk}
            disabled={isLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-850 px-5 py-3 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
          >
            {activeTest === 'triage' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
            Test Gemini Triage Risk
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center p-8 text-center text-slate-300 gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />
            <span className="text-xs font-semibold">Executing Gemini AI prompt...</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-4 text-xs text-rose-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <p className="font-bold">Execution Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {testResult && (
          <div className="rounded-xl border border-emerald-500/40 bg-slate-950 p-5 text-xs text-slate-200 font-sans leading-relaxed">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-2 uppercase text-[10px]">
              <CheckCircle2 className="h-4 w-4" />
              Benchmark Output
            </div>
            <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-200">
              {testResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAIFeatures;