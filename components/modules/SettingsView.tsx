import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Database, 
  RotateCcw,
  Cpu
} from 'lucide-react';
import { 
  getApiKey, 
  setApiKey, 
  testGeminiConnection, 
  getActiveModel, 
  setActiveModel, 
  DEFAULT_GEMINI_MODEL 
} from '../../services/geminiService';
import { usePatientContext } from '../../src/context/PatientContext';

export const SettingsView: React.FC = () => {
  const { resetDatabase, patients } = usePatientContext();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(() => getActiveModel());
  const [showKey, setShowKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    setApiKeyInput(getApiKey());
    setSelectedModel(getActiveModel());
  }, []);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(apiKeyInput.trim());
    setActiveModel(selectedModel.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiConnection(apiKeyInput.trim(), selectedModel);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection test failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetDB = () => {
    if (confirm('Reset central patient database back to original baseline demo data?')) {
      resetDatabase();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 text-white max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="rounded-3xl border border-purple-500/30 bg-[#120826]/90 p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(147,51,234,0.15)]">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
          <Cpu className="h-3.5 w-3.5" />
          <span>System Settings</span>
        </div>
        <h3 className="mt-1 text-2xl font-black tracking-tight text-white">System & Gemini API Configuration</h3>
        <p className="text-xs text-purple-200/70">
          Configure real-time Gemini AI authentication, verify model connectivity, and manage local electronic health records.
        </p>
      </div>

      {/* Gemini API Key Configuration Card */}
      <div className="rounded-3xl border border-purple-500/30 bg-[#120826]/90 p-6 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">Gemini API Key & Model Selection</h4>
              <p className="text-[11px] text-purple-300/80">Saved locally in your browser storage for all AI workflows</p>
            </div>
          </div>
          <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-1 font-mono text-[10px] font-bold text-purple-300">
            {selectedModel}
          </span>
        </div>

        <form onSubmit={handleSaveKey} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Google Gemini API Key
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-2xl border border-purple-500/30 bg-[#0a0417] px-4 py-3 text-xs text-white placeholder-purple-400/40 font-mono focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white transition"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Active Gemini Model
              </label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-purple-500/30 bg-[#0a0417] px-3.5 py-3 text-xs text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              >
                <option value="gemini-1.5-flash" className="bg-[#120826] text-white">gemini-1.5-flash (Default / Recommended)</option>
                <option value="gemini-2.0-flash" className="bg-[#120826] text-white">gemini-2.0-flash (Next-Gen)</option>
                <option value="gemini-1.5-pro" className="bg-[#120826] text-white">gemini-1.5-pro (Advanced Reasoning)</option>
              </select>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-purple-400/70">
            If left blank, intelligent fallback simulated responses will be utilized for ICU early warning and triage analysis.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={isTesting}
              className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-950/50 px-4 py-2 text-xs font-bold text-purple-200 hover:bg-purple-900/60 hover:text-white transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              {isTesting ? 'Testing Connectivity...' : 'Test Gemini Connection'}
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:brightness-110 transition"
            >
              <ShieldCheck className="h-4 w-4" />
              Save API Key
            </button>
          </div>
        </form>

        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            <span>Gemini API key successfully saved and active across all clinical modules.</span>
          </div>
        )}

        {testResult && (
          <div
            className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${
              testResult.success
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                : 'border-rose-500/40 bg-rose-500/15 text-rose-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{testResult.success ? 'Gemini Verification Passed' : 'Connection Error'}</p>
              <p className="mt-0.5 text-[11px] opacity-90">{testResult.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Central Database Management Card */}
      <div className="rounded-3xl border border-purple-500/30 bg-[#120826]/90 p-6 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">Central Patient Database</h4>
              <p className="text-[11px] text-purple-300/80">Active Records: {patients.length} patients</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-purple-200/80">
          The application maintains a synchronized patient database state across the 3D ICU Ward, Triage, and Gemini AI. You can restore the baseline simulated dataset at any time.
        </p>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetDB}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Database to Demo Baseline
          </button>
        </div>

        {resetSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            <span>Patient database restored to default records.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;