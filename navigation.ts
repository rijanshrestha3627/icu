import type { NavCategoryType } from './types';
import { 
    DashboardIcon, 
    PatientsIcon, 
    TriageIcon, 
    SettingsIcon, 
    ClinicalIcon,
    DocumentTextIcon,
    FlaskIcon,
    CogIcon,
    BrainIcon,
    PulseIcon,
    ShieldAlertIcon,
    PlayIcon
} from './components/icons';

export const navStructure: NavCategoryType[] = [
    {
        category: '🌟 ICU & Clinical Intelligence',
        icon: BrainIcon,
        items: [
            { id: 'icu-3d', label: '3D ICU Ward', icon: BrainIcon },
            { id: 'ci_icu_warning', label: 'ICU Early Warning System', icon: PulseIcon },
            { id: 'ci_replay', label: 'Chronological Patient Replay', icon: PlayIcon },
            { id: 'ci_alerts', label: 'Alert Center & Audit Log', icon: ShieldAlertIcon },
        ]
    },
    {
        category: '🏥 Core Clinical Operations',
        icon: ClinicalIcon,
        items: [
            { id: 'triage', label: 'Emergency & Triage Queue', icon: TriageIcon },
            { id: 'patient', label: 'Active Patients & Vitals Logging', icon: PatientsIcon },
            { id: 'module_5', label: 'Consultation & E-Prescriptions', icon: ClinicalIcon },
            { id: 'discharge_summary', label: 'Discharge Summary Management', icon: DocumentTextIcon },
        ]
    },
    {
        category: '🤖 AI & Automation Layer',
        icon: BrainIcon,
        items: [
            { id: 'gemini_copilot', label: 'Gemini Clinical Co-Pilot', icon: BrainIcon },
            { id: 'module_7', label: 'Drug Interaction & ADR Reporting', icon: FlaskIcon },
            { id: 'ci_model_performance', label: 'AI Model Performance & Benchmark', icon: DashboardIcon },
        ]
    },
    {
        category: '⚙️ System',
        icon: CogIcon,
        items: [
            { id: 'settings', label: 'Settings & API Key Configuration', icon: SettingsIcon },
            { id: 'test-ai', label: 'Test AI Features', icon: CogIcon },
        ]
    }
];