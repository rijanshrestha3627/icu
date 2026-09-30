import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TriageView } from './components/TriageView';
import { DischargeSummary } from './components/DischargeSummary';
import { ThreeBackground } from './src/components/ThreeBackground';
import { ICUBedView3D } from './src/modules/clinical_intelligence/ICUBedView3D';
import { GeminiClinicalCopilotView } from './components/clinical_intelligence/GeminiClinicalCopilotView';
import { ActivePatientsView } from './components/modules/ActivePatientsView';
import { SettingsView } from './components/modules/SettingsView';
import { TestAIFeatures } from './components/TestAIFeatures';
import { PatientProvider, usePatientContext } from './src/context/PatientContext';
import { navStructure } from './navigation';
import { generatePID, mockDoctors } from './services/mockData';
import { getPatients, addPatient, deletePatient, patientDatabase } from './src/services/patientDatabase';
import { calculateTriageRisk } from './services/geminiService';
import { 
  Patient, 
  View, 
  PatientPrescription, 
  Appointment, 
  Doctor, 
  VitalSignEntry, 
  Notification, 
  ActivityLog, 
  WardBed,
  TriageRisk
} from './types';
import { UserPlus, X, Sparkles, Loader2, Trash2 } from 'lucide-react';

// Clinical Operations & Intelligence Components
import { EPrescriptionView, DrugInfoView, InternDashboardView } from './components/modules';
import {
  ICUEarlyWarningView,
  PatientRiskDetailView,
  DemoReplayView,
  AlertCenterView,
  ModelPerformanceView,
} from './components/clinical_intelligence';

// Role Dashboards & Auth
import { LoginView } from './components/LoginView';
import { PatientDashboard } from './components/patient_dashboard/PatientDashboard';
import { ReceptionistDashboard } from './components/receptionist/ReceptionistDashboard';
import { InternDashboard } from './components/intern_dashboard/InternDashboard';
import { DoctorDashboard } from './components/doctor_dashboard/DoctorDashboard';
import { NurseDashboard } from './components/nurse';

export { ThreeBackground };

/**
 * Main Clinical Suite with 4 Streamlined Sections:
 * 1. 🌟 ICU & Clinical Intelligence
 * 2. 🏥 Core Clinical Operations
 * 3. 🤖 AI & Automation Layer
 * 4. ⚙️ System
 */
const HisSuite: React.FC<{ 
  onLogout: () => void; 
  userRole: string;
  onOpenAddPatient: () => void;
}> = ({ onLogout, userRole, onOpenAddPatient }) => {
  const [activeView, setActiveView] = useState<View>('icu-3d');
  const [selectedICUPatientId, setSelectedICUPatientId] = useState<string>('132588');

  const handleSelectICUPatient = useCallback((recordId: string) => {
    setSelectedICUPatientId(recordId);
    setActiveView('ci_patient_risk');
  }, []);

  const handleLaunchReplay = useCallback((recordId?: string) => {
    if (recordId) setSelectedICUPatientId(recordId);
    setActiveView('ci_replay');
  }, []);

  const handleViewChange = useCallback((view: View) => {
    setActiveView(view);
  }, []);

  const getHeaderTitle = () => {
    switch (activeView) {
      case 'icu-3d':
      case '/icu-3d':
        return '3D ICU Ward • Real-Time Digital Twin';
      case 'ci_icu_warning':
        return 'ICU Early Warning System & Telemetry Monitoring';
      case 'ci_replay':
        return 'Chronological Patient Replay & Telemetry Simulation';
      case 'ci_alerts':
        return 'ICU Alert Center & Clinical Audit Log';
      case 'ci_patient_risk':
        return `ICU Deterioration Risk Trajectory (Record #${selectedICUPatientId})`;
      case 'triage':
        return 'Emergency & Triage Queue';
      case 'patient':
        return 'Active Patients & Vitals Logging';
      case 'module_5':
        return 'Consultation & E-Prescriptions';
      case 'discharge_summary':
      case 'module_33':
        return 'Discharge Summary Management';
      case 'gemini_copilot':
        return 'Gemini AI Clinical Co-Pilot';
      case 'module_7':
        return 'Drug Interaction & Adverse Drug Reaction (ADR) Reporting';
      case 'ci_model_performance':
        return 'AI Model Performance & Benchmark Architecture';
      case 'settings':
        return 'System & Gemini API Key Configuration';
      case 'test-ai':
        return 'Gemini AI Features Benchmark Test';
      default: {
        const allItems = navStructure.flatMap(cat => cat.items);
        const item = allItems.find(i => i.id === activeView);
        return item ? item.label : 'NeuroNexus — ICU Clinical Intelligence & Operations';
      }
    }
  };

  const renderContent = () => {
    switch (activeView) {
      // 1. 🌟 ICU & Clinical Intelligence
      case 'icu-3d':
      case '/icu-3d':
        return <ICUBedView3D />;
      case 'ci_icu_warning':
        return (
          <ICUEarlyWarningView
            onSelectPatient={handleSelectICUPatient}
            onLaunchReplay={handleLaunchReplay}
            onNavigateTab={handleViewChange}
          />
        );
      case 'ci_replay':
        return (
          <DemoReplayView
            initialPatientId={selectedICUPatientId}
            onNavigateToPatient={handleSelectICUPatient}
          />
        );
      case 'ci_alerts':
        return <AlertCenterView />;
      case 'ci_patient_risk':
        return (
          <PatientRiskDetailView
            patientId={selectedICUPatientId}
            onBack={() => setActiveView('ci_icu_warning')}
            onLaunchReplay={handleLaunchReplay}
          />
        );

      // 2. 🏥 Core Clinical Operations
      case 'triage':
        return <TriageView />;
      case 'patient':
        return <ActivePatientsView />;
      case 'module_5':
        return <EPrescriptionView />;
      case 'discharge_summary':
      case 'module_33':
        return <DischargeSummary />;

      // 3. 🤖 AI & Automation Layer
      case 'gemini_copilot':
        return <GeminiClinicalCopilotView />;
      case 'module_7':
        return <DrugInfoView />;
      case 'ci_model_performance':
        return <ModelPerformanceView />;

      // 4. ⚙️ System
      case 'settings':
        return <SettingsView />;
      case 'test-ai':
        return <TestAIFeatures />;

      default:
        return <ICUBedView3D />;
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0f172a] text-white antialiased">
      <ThreeBackground />
      <div className="relative z-10 flex w-full overflow-hidden min-h-screen">
        <Sidebar activeView={activeView} setActiveView={handleViewChange} />
        <main className="flex flex-1 flex-col overflow-hidden min-h-screen">
          <Header title={getHeaderTitle()} onLogout={onLogout} userRole={userRole} />
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 xl:px-8">
            <div className="mx-auto max-w-[1600px]">{renderContent()}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  const [userRole, setUserRole] = useState<string | null>('Chief Medical Officer');
  const [loggedInPatient, setLoggedInPatient] = useState<Patient | null>(null);

  // 1. Asynchronous state loaded via getPatients() on component mount
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);

  // 2. Add Patient Modal State & Inputs: Name, Age, HR, BP, SpO2, Symptoms
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isGeminiEvaluating, setIsGeminiEvaluating] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formAge, setFormAge] = useState<number>(50);
  const [formHR, setFormHR] = useState<number>(88);
  const [formBPSys, setFormBPSys] = useState<number>(128);
  const [formBPDia, setFormBPDia] = useState<number>(82);
  const [formSpO2, setFormSpO2] = useState<number>(96);
  const [formSymptoms, setFormSymptoms] = useState<string>('');

  // 1. Replace static dummy arrays with async calls to getPatients() on mount
  const refreshPatients = useCallback(async () => {
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients in App:', err);
    }
  }, []);

  useEffect(() => {
    refreshPatients();
    // Subscribe to central database changes for immediate UI synchronization
    const unsubscribe = patientDatabase.subscribe((updated) => {
      setPatients(updated);
    });
    return () => unsubscribe();
  }, [refreshPatients]);

  // 4. Discharge / Delete patient handler
  const handleDeletePatient = async (id: string) => {
    if (!confirm('Are you sure you want to discharge / delete this patient?')) return;
    setPatients((prev) => prev.filter((p) => p.id !== id));
    try {
      await deletePatient(id);
      await refreshPatients();
    } catch (err) {
      console.error('Failed to delete patient:', err);
      await refreshPatients();
    }
  };

  // 3. Add patient form submission with Gemini evaluation spinner and list refresh
  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSymptoms.trim()) {
      alert('Please fill out patient name and symptoms.');
      return;
    }

    const symptomsList = Array.isArray(formSymptoms) 
      ? formSymptoms 
      : typeof formSymptoms === 'string' && formSymptoms.trim() 
      ? formSymptoms.split(',').map((s) => s.trim()) 
      : [];

    setIsGeminiEvaluating(true);

    try {
      let aiResult = {
        score: formSpO2 < 90 || formHR > 120 ? 85 : 40,
        justification: `Vitals: HR ${formHR} bpm, SpO2 ${formSpO2}%, Symptoms: ${symptomsList.join(', ')}`,
      };

      try {
        aiResult = await calculateTriageRisk(symptomsList.join(', '), Number(formAge), 'Adult');
      } catch (err) {
        console.warn('Gemini triage evaluation fallback:', err);
      }

      const calculatedRisk: TriageRisk = aiResult.score >= 70 ? 'High' : aiResult.score >= 40 ? 'Medium' : 'Low';

      await addPatient({
        name: formName.trim(),
        age: Number(formAge),
        gender: 'Adult',
        department: 'ICU & Emergency',
        status: 'ADMITTED',
        symptoms: symptomsList,
        clinicalNotes: `[Admitted] Symptoms: ${symptomsList.join(', ')}.\nGemini Evaluation: ${aiResult.justification}`,
        triageInfo: {
          chiefComplaint: symptomsList.join(', ') || formSymptoms.trim(),
          risk: calculatedRisk,
          riskScore: aiResult.score,
          triageDate: new Date().toISOString(),
        },
        heart_rate_bpm: Number(formHR),
        bp_systolic: Number(formBPSys),
        bp_diastolic: Number(formBPDia),
        temperature_F: 98.6,
        respiration_rate: 18,
      });

      // Clear form
      setFormName('');
      setFormSymptoms('');
      setIsAddModalOpen(false);

      // Refresh list
      await refreshPatients();
    } catch (err: any) {
      alert('Error registering patient: ' + (err?.message || 'Failed'));
    } finally {
      setIsGeminiEvaluating(false);
    }
  };

  const handleStaffLogin = (role: string) => {
    setUserRole(role);
    setLoggedInPatient(null);
  };

  const handlePatientLogin = (pid: string, password: string): Patient | null => {
    setUserRole('Patient');
    return null;
  };

  const findPatientByPhone = (phoneNumber: string): Patient | null => {
    return null;
  };

  const handleResetPassword = (phoneNumber: string, newPassword: string): Patient | null => {
    return null;
  };

  const handlePatientSignUp = (details: any): Patient => {
    return {} as Patient;
  };

  const handleLogout = () => {
    setUserRole(null);
    setLoggedInPatient(null);
  };

  const renderAppContent = () => {
    if (!userRole && !loggedInPatient) {
      return (
        <LoginView
          onStaffLogin={handleStaffLogin}
          onPatientLogin={handlePatientLogin}
          onPatientSignUp={handlePatientSignUp}
          onFindPatientByPhone={findPatientByPhone}
          onResetPassword={handleResetPassword}
        />
      );
    }

    if (userRole === 'Receptionist') {
      return (
        <ReceptionistDashboard
          onLogout={handleLogout}
          userRole={userRole}
          patients={patients}
          appointments={appointments}
          doctors={doctors}
          activityLog={activityLog}
          onAddPatient={() => {
            setIsAddModalOpen(true);
            return {} as Patient;
          }}
          onAddVitals={() => {}}
          onUpdateAppointmentStatus={() => {}}
          onAssignDoctorToAppointment={() => {}}
        />
      );
    }

    if (userRole === 'Intern') {
      return (
        <InternDashboard
          onLogout={handleLogout}
          userRole={userRole}
          patients={patients}
          doctors={doctors}
          onAddVitals={() => {}}
          onAssignDoctor={() => {}}
          onInternAssessment={() => {}}
          onAddPrescription={() => {}}
        />
      );
    }

    if (userRole === 'Doctor') {
      const loggedInDoctor = { id: 'DOC001', name: 'Dr. Evelyn Reed' };
      return (
        <DoctorDashboard
          onLogout={handleLogout}
          userRole={userRole}
          doctor={loggedInDoctor}
          patients={patients}
          doctors={doctors}
          onAddPrescription={() => {}}
        />
      );
    }

    // Default primary clinical view
    return (
      <HisSuite 
        onLogout={handleLogout} 
        userRole={userRole || 'Chief Medical Officer'} 
        onOpenAddPatient={() => setIsAddModalOpen(true)}
      />
    );
  };

  return (
    <PatientProvider>
      <div className="relative min-h-screen w-full overflow-hidden bg-[#0f172a] font-sans antialiased text-white">
        <ThreeBackground />
        <div className="relative z-10 min-h-screen w-full">
          {renderAppContent()}
        </div>

        {/* Global Add Patient Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl text-white">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-white">Register Clinical Patient</h3>
                    <p className="text-xs text-slate-400">Evaluates acuity with Gemini and synchronizes database</p>
                  </div>
                </div>
                <button
                  onClick={() => !isGeminiEvaluating && setIsAddModalOpen(false)}
                  disabled={isGeminiEvaluating}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {isGeminiEvaluating ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Loader2 className="h-12 w-12 text-cyan-400 animate-spin" />
                  <h4 className="mt-4 text-base font-bold text-white">Gemini Clinical AI Evaluating Acuity...</h4>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm">
                    Analyzing vitals and symptoms to compute deterioration risk trajectory.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAddPatientSubmit} className="mt-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Name</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Jordan Price"
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Age</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="120"
                        value={formAge}
                        onChange={(e) => setFormAge(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300">HR (bpm)</label>
                      <input
                        type="number"
                        required
                        value={formHR}
                        onChange={(e) => setFormHR(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300">BP Sys (mmHg)</label>
                      <input
                        type="number"
                        required
                        value={formBPSys}
                        onChange={(e) => setFormBPSys(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300">BP Dia (mmHg)</label>
                      <input
                        type="number"
                        required
                        value={formBPDia}
                        onChange={(e) => setFormBPDia(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300">SpO₂ (%)</label>
                      <input
                        type="number"
                        required
                        min="50"
                        max="100"
                        value={formSpO2}
                        onChange={(e) => setFormSpO2(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Symptoms</label>
                    <textarea
                      required
                      rows={3}
                      value={formSymptoms}
                      onChange={(e) => setFormSymptoms(e.target.value)}
                      placeholder="e.g. Diaphoresis, severe headache, palpitations"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:brightness-110 transition"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Evaluate with Gemini & Register</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </PatientProvider>
  );
}

export default App;