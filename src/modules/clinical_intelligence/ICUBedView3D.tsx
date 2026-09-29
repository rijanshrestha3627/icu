import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import type { Group } from 'three';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Heart, 
  RefreshCw, 
  ShieldAlert, 
  Thermometer, 
  Wind,
  UserPlus,
  Trash2,
  Sparkles,
  X,
  Loader2
} from 'lucide-react';
import { getPatients, getICUBeds, addPatient, deletePatient, getDoctors, patientDatabase } from '../../services/patientDatabase';
import { calculateTriageRisk } from '../../../services/geminiService';
import type { TriageRisk, Doctor } from '../../../types';

export type BedStatus = 'Stable' | 'Requires Attention' | 'Critical';

export interface ICUBedData {
  id: string;
  bedCode: string;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  position: [number, number, number];
  rotationY?: number;
  heartRate: number;
  bloodPressure: string;
  spO2: number;
  respirationRate: number;
  temperature: number;
  status: BedStatus;
  deteriorationRisk: number; // 0 - 100%
  attendingDoctor: string;
  room: string;
}

const getStatusColor = (status: BedStatus): { hex: string; glow: string; textClass: string; bgClass: string; borderClass: string } => {
  switch (status) {
    case 'Critical':
      return {
        hex: '#f43f5e',
        glow: 'rgba(244, 63, 94, 0.45)',
        textClass: 'text-rose-300',
        bgClass: 'bg-rose-500/20',
        borderClass: 'border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.35)]',
      };
    case 'Requires Attention':
      return {
        hex: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.45)',
        textClass: 'text-amber-300',
        bgClass: 'bg-amber-500/20',
        borderClass: 'border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.35)]',
      };
    case 'Stable':
    default:
      return {
        hex: '#10b981',
        glow: 'rgba(16, 185, 129, 0.45)',
        textClass: 'text-emerald-300',
        bgClass: 'bg-emerald-500/20',
        borderClass: 'border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
      };
  }
};

/**
 * Procedural 3D ICU Hospital Bed Mesh
 */
interface BedMeshProps {
  bed: ICUBedData;
  isSelected: boolean;
  onSelect: (bedId: string) => void;
  onDelete: (bedId: string) => void;
}

const HospitalBedMesh: React.FC<BedMeshProps> = ({ bed, isSelected, onSelect, onDelete }) => {
  const [hovered, setHovered] = useState(false);
  const statusMeta = useMemo(() => getStatusColor(bed.status), [bed.status]);
  const monitorGlowRef = useRef<Group>(null);

  useFrame((state) => {
    if (monitorGlowRef.current && bed.status === 'Critical') {
      const s = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.08;
      monitorGlowRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group
      position={bed.position}
      rotation={[0, bed.rotationY || 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(bed.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Selection / Hover Indicator Ring on Floor */}
      {(isSelected || hovered) && (
        <mesh position={[0, -0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.85, 32]} />
          <meshBasicMaterial
            color={isSelected ? '#a855f7' : statusMeta.hex}
            transparent
            opacity={isSelected ? 0.75 : 0.35}
          />
        </mesh>
      )}

      {/* Bed Base Platform */}
      <mesh position={[0, -0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.3, 2.7]} />
        <meshStandardMaterial
          color={isSelected ? '#1e1138' : '#140c26'}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>

      {/* Modern Medical Mattress */}
      <mesh position={[0, -0.15, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[1.55, 0.32, 2.45]} />
        <meshStandardMaterial
          color={isSelected ? '#ffffff' : '#f1f5f9'}
          roughness={0.4}
        />
      </mesh>

      {/* Articulated Headrest Pillow */}
      <mesh position={[0, 0.15, -0.75]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[1.3, 0.22, 0.65]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>

      {/* Patient Blanket with Status Accent Trim */}
      <mesh position={[0, 0.05, 0.3]} castShadow>
        <boxGeometry args={[1.5, 0.14, 1.6]} />
        <meshStandardMaterial color="#6b21a8" roughness={0.6} />
      </mesh>

      {/* Glowing Status Strip across Foot of Bed */}
      <mesh position={[0, 0.14, 1.05]}>
        <boxGeometry args={[1.52, 0.04, 0.12]} />
        <meshBasicMaterial color={statusMeta.hex} />
      </mesh>

      {/* Safety Side Rails */}
      <mesh position={[-0.82, 0.12, -0.1]} castShadow>
        <boxGeometry args={[0.06, 0.35, 1.8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0.82, 0.12, -0.1]} castShadow>
        <boxGeometry args={[0.06, 0.35, 1.8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Headboard */}
      <mesh position={[0, 0.35, -1.28]} castShadow>
        <boxGeometry args={[1.65, 0.85, 0.12]} />
        <meshStandardMaterial color="#2e1065" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* IV Pole & Infusion Pump Stand */}
      <group position={[-1.05, 0, -0.9]}>
        <mesh position={[0, 0.65, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 2.4, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Infusion pump unit */}
        <mesh position={[0.08, 0.8, 0]} castShadow>
          <boxGeometry args={[0.22, 0.32, 0.18]} />
          <meshStandardMaterial color="#3b0764" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* IV Fluid Bag */}
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[0.16, 0.3, 0.08]} />
          <meshStandardMaterial color="#e0f2fe" transparent opacity={0.85} roughness={0.1} />
        </mesh>
      </group>

      {/* ICU Multiparameter Vital Sign Monitor Stand */}
      <group position={[1.1, 0, -0.85]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 2.0, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Monitor Screen Frame */}
        <mesh position={[-0.05, 1.25, 0]} rotation={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[0.65, 0.45, 0.08]} />
          <meshStandardMaterial color="#0f0728" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Glowing Screen Display Face */}
        <group ref={monitorGlowRef} position={[-0.05, 1.25, 0.045]} rotation={[0, -0.35, 0]}>
          <mesh>
            <planeGeometry args={[0.58, 0.38]} />
            <meshBasicMaterial color="#1e103a" />
          </mesh>
          {/* Real-time status waveform emitter */}
          <pointLight color={statusMeta.hex} intensity={0.9} distance={1.8} />
        </group>
      </group>

      {/* Floating 3D Telemetry HUD Pill */}
      <Html
        position={[0, 1.85, 0]}
        center
        distanceFactor={9.5}
        zIndexRange={[100, 0]}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect(bed.id);
          }}
          className={`cursor-pointer transition-all duration-300 ease-out select-none ${
            isSelected
              ? 'scale-110 shadow-[0_0_30px_rgba(168,85,247,0.55)]'
              : 'scale-95 opacity-90 hover:scale-100 hover:opacity-100'
          }`}
          style={{ width: '230px' }}
        >
          <div
            className={`overflow-hidden rounded-2xl border backdrop-blur-xl transition-all ${
              isSelected
                ? 'border-purple-400 bg-[#150a2f]/95 ring-2 ring-purple-400/50'
                : 'border-purple-500/30 bg-[#0d0520]/85 hover:border-purple-400/60'
            }`}
          >
            {/* Bed Code + Status Pill */}
            <div className="flex items-center justify-between border-b border-purple-500/20 px-3 py-2 bg-purple-950/40">
              <span className="font-mono text-[11px] font-bold tracking-wider text-purple-300">
                {bed.bedCode}
              </span>
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusMeta.bgClass} ${statusMeta.textClass} ${statusMeta.borderClass} border`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      bed.status === 'Critical' ? 'animate-ping' : ''
                    }`}
                    style={{ backgroundColor: statusMeta.hex }}
                  />
                  {bed.status}
                </div>
                {/* Quick Delete / Discharge Button in HUD */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(bed.id);
                  }}
                  title="Discharge / Delete Patient"
                  className="rounded-lg p-1 text-rose-300 hover:bg-rose-500/30 transition border border-rose-500/30"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Patient Name + Live Vitals */}
            <div className="p-3">
              <div className="flex items-center justify-between">
                <h4 className="truncate text-xs font-black text-white">
                  {bed.name}
                </h4>
                <span className="text-[10px] text-purple-300/70">
                  {bed.age}y • {bed.gender?.charAt(0) || 'U'}
                </span>
              </div>

              {/* Quick Vitals Row */}
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-purple-950/40 p-2 text-[10px] border border-purple-500/20">
                <div className="flex items-center gap-1.5">
                  <Heart
                    className={`h-3.5 w-3.5 ${
                      bed.status === 'Critical'
                        ? 'animate-pulse text-rose-400'
                        : 'text-rose-400'
                    }`}
                  />
                  <span className="font-bold text-white">
                    {bed.heartRate}{' '}
                    <span className="text-[8px] font-normal text-purple-300">BPM</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-purple-300" />
                  <span className="font-bold text-white">
                    {bed.spO2}%{' '}
                    <span className="text-[8px] font-normal text-purple-300">SpO₂</span>
                  </span>
                </div>
              </div>

              {/* Click to Select Hint */}
              <div className="mt-2 flex items-center justify-between text-[9px] text-purple-300/70">
                <span>{bed.room}</span>
                <span className={isSelected ? 'font-bold text-purple-300' : 'text-purple-400/50'}>
                  {isSelected ? '● Target Selected' : 'Click to inspect'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};

/**
 * 3D Scene Container
 */
const WardScene: React.FC<{
  beds: ICUBedData[];
  selectedBedId: string;
  onSelectBed: (bedId: string) => void;
  onDeleteBed: (bedId: string) => void;
}> = ({ beds, selectedBedId, onSelectBed, onDeleteBed }) => {
  return (
    <>
      <ambientLight intensity={0.65} color="#f5f3ff" />
      <directionalLight
        position={[6, 12, 8]}
        intensity={1.2}
        color="#ede9fe"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-6, 10, -6]} intensity={0.5} color="#c084fc" />
      <pointLight position={[0, 8, 0]} intensity={0.8} color="#e9d5ff" distance={22} />

      {/* Floor Plane with Deep Purple Vinyl Tone */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.74, 0]}
        receiveShadow
      >
        <planeGeometry args={[36, 26]} />
        <meshStandardMaterial
          color="#0c051a"
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>

      {/* Grid Lines on Floor */}
      <gridHelper
        args={[36, 36, '#6b21a8', 'rgba(255, 255, 255, 0.12)']}
        position={[0, -0.73, 0]}
      />

      {/* Bed Bays */}
      {beds.map((bed) => (
        <HospitalBedMesh
          key={bed.id}
          bed={bed}
          isSelected={bed.id === selectedBedId}
          onSelect={onSelectBed}
          onDelete={onDeleteBed}
        />
      ))}
    </>
  );
};

/**
 * Main ICUBedView3D Component
 */
export const ICUBedView3D: React.FC = () => {
  const [beds, setBeds] = useState<ICUBedData[]>([]);
  const [selectedBedId, setSelectedBedId] = useState<string>('');
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add Patient Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeminiEvaluating, setIsGeminiEvaluating] = useState(false);

  // Form Fields: Name, Age, HR, BP, SpO2, Symptoms
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState(54);
  const [formHR, setFormHR] = useState(105);
  const [formBPSys, setFormBPSys] = useState(138);
  const [formBPDia, setFormBPDia] = useState(88);
  const [formSpO2, setFormSpO2] = useState(93);
  const [formSymptoms, setFormSymptoms] = useState('');
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [formDoctorId, setFormDoctorId] = useState('');
  const [formDoctorName, setFormDoctorName] = useState('');

  // 1. Async call to getPatients(), getICUBeds(), and getDoctors() on mount
  const refreshBeds = useCallback(async () => {
    try {
      setIsLoading(true);
      await getPatients();
      const [icuList, docs] = await Promise.all([
        getICUBeds(),
        getDoctors()
      ]);
      setBeds(icuList);
      setDoctorsList(docs);
      if (docs.length > 0 && !formDoctorId) {
        const onCall = docs.find(d => d.status === 'ON_CALL') || docs[0];
        setFormDoctorId(onCall.id);
        setFormDoctorName(onCall.name);
      }
      if (icuList.length > 0 && (!selectedBedId || !icuList.some(b => b.id === selectedBedId))) {
        setSelectedBedId(icuList[0].id);
      }
    } catch (err) {
      console.error('Failed to load ICU beds from central database:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBedId, formDoctorId]);

  useEffect(() => {
    refreshBeds();
    const unsubscribe = patientDatabase.subscribe(() => {
      const updated = patientDatabase.getICUBeds();
      setBeds(updated);
      setDoctorsList(patientDatabase.getDoctors());
    });
    return () => unsubscribe();
  }, [refreshBeds]);

  // Keep selected bed valid
  useEffect(() => {
    if (beds.length > 0 && !beds.some(b => b.id === selectedBedId)) {
      setSelectedBedId(beds[0].id);
    }
  }, [beds, selectedBedId]);

  const selectedBed = useMemo(
    () => beds.find((b) => b.id === selectedBedId) || beds[0],
    [beds, selectedBedId]
  );

  const statusMeta = useMemo(() => getStatusColor(selectedBed?.status || 'Stable'), [selectedBed?.status]);

  // Ward summary statistics
  const stats = useMemo(() => {
    const total = beds.length;
    const critical = beds.filter((b) => b.status === 'Critical').length;
    const warning = beds.filter((b) => b.status === 'Requires Attention').length;
    const stable = beds.filter((b) => b.status === 'Stable').length;
    return { total, critical, warning, stable };
  }, [beds]);

  // 4. Discharge / Delete button that calls deletePatient(id) and updates view immediately
  const handleDeleteBed = async (bedId: string) => {
    const rawId = bedId.startsWith('bed-') ? bedId.replace('bed-', '') : bedId;
    const targetBed = beds.find(b => b.id === bedId);
    const targetName = targetBed?.name || 'this patient';

    if (!confirm(`Are you sure you want to discharge / delete ${targetName} from the ICU ward?`)) {
      return;
    }

    // Optimistic UI update immediately
    setBeds(prev => prev.filter(b => b.id !== bedId));
    if (selectedBedId === bedId) {
      const nextBed = beds.find(b => b.id !== bedId);
      setSelectedBedId(nextBed ? nextBed.id : '');
    }

    try {
      await deletePatient(rawId);
      await refreshBeds();
    } catch (err) {
      console.error('Failed to delete/discharge patient:', err);
      await refreshBeds();
    }
  };

  // 3. Add patient form submission with Gemini evaluation spinner and refresh
  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSymptoms.trim()) {
      alert('Please fill out the patient name and symptoms.');
      return;
    }

    setIsGeminiEvaluating(true);

    try {
      // Evaluate acuity with Gemini AI
      let aiResult = {
        score: formSpO2 < 90 || formHR > 120 ? 86 : formSpO2 < 94 ? 58 : 22,
        justification: `Evaluated clinical telemetry: SpO2 ${formSpO2}%, HR ${formHR} bpm, presenting with ${formSymptoms}.`,
      };

      try {
        aiResult = await calculateTriageRisk(formSymptoms, Number(formAge), 'Adult');
      } catch (err) {
        console.warn('Gemini triage fallback activated:', err);
      }

      const calculatedRisk: TriageRisk = aiResult.score >= 70 ? 'High' : aiResult.score >= 40 ? 'Medium' : 'Low';

      await addPatient({
        name: formName.trim(),
        age: Number(formAge),
        gender: 'Adult',
        department: 'ICU & Emergency',
        status: 'ADMITTED',
        assigned_doctor_id: formDoctorId || undefined,
        assigned_doctor_name: formDoctorName || undefined,
        symptoms: [formSymptoms.trim()],
        clinicalNotes: `[ICU Ward Admission] Symptoms: ${formSymptoms.trim()}.\nGemini Acuity Assessment: ${aiResult.justification}`,
        triageInfo: {
          chiefComplaint: formSymptoms.trim(),
          risk: calculatedRisk,
          riskScore: aiResult.score,
          triageDate: new Date().toISOString(),
        },
        heart_rate_bpm: Number(formHR),
        bp_systolic: Number(formBPSys),
        bp_diastolic: Number(formBPDia),
        spO2: Number(formSpO2),
        temperature_F: 98.6,
        respiration_rate: 18,
      });

      // Clear form
      setFormName('');
      setFormSymptoms('');
      setIsModalOpen(false);

      // Refresh ICU beds from database
      await refreshBeds();
    } catch (err: any) {
      alert('Error registering patient: ' + (err?.message || 'Failed'));
    } finally {
      setIsGeminiEvaluating(false);
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-140px)] min-h-[680px] w-full flex-col overflow-hidden rounded-3xl border border-purple-500/30 bg-[#0e071e]/90 shadow-[0_0_50px_rgba(147,51,234,0.15)] text-white backdrop-blur-xl">
      {/* ================= TOP HUD CONTROLS BAR ================= */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 border-b border-purple-500/20 bg-[#120826]/85 px-6 py-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 items-center justify-center">
              <span className="h-2.5 w-2.5 animate-ping rounded-full bg-purple-400" />
            </span>
            <h2 className="text-base font-black text-white sm:text-lg tracking-tight">
              3D ICU Ward Twin • Real-Time Bed Telemetry
            </h2>
            <span className="rounded-md border border-purple-400/40 bg-purple-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-300">
              SYNCHRONIZED WITH CENTRAL DB
            </span>
          </div>
          <p className="mt-0.5 text-xs text-purple-200/70">
            Interactive digital twin of hospital ICU beds. Click any bed to inspect live vitals or adjust acuity.
          </p>
        </div>

        {/* Quick Summary Pill Counters & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-purple-500/20 bg-purple-950/40 px-3 py-1.5 text-xs">
            <span className="text-purple-300/80">ICU Beds:</span>
            <span className="font-bold text-white">{stats.total}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs text-rose-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Critical:</span>
            <span className="font-bold">{stats.critical}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-300">
            <Activity className="h-3.5 w-3.5" />
            <span>Attention:</span>
            <span className="font-bold">{stats.warning}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Stable:</span>
            <span className="font-bold">{stats.stable}</span>
          </div>

          {/* 2. Add Patient Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.35)] hover:brightness-110 transition"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add Patient</span>
          </button>

          {/* Auto rotate toggle */}
          <button
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              isAutoRotate
                ? 'border-purple-400 bg-purple-500/25 text-purple-200'
                : 'border-purple-500/30 bg-purple-950/40 text-purple-300 hover:bg-purple-900/40'
            }`}
            title="Toggle camera orbit rotation"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Orbit</span>
          </button>
        </div>
      </header>

      {/* ================= 3D VIEWPORT CANVAS ================= */}
      <div className="relative flex-1">
        {beds.length === 0 && !isLoading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-base font-bold text-purple-200">No patients currently in ICU Ward</p>
            <p className="mt-1 text-xs text-purple-300/70">Click "Add Patient" above to admit a patient to an ICU bed.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Patient Now</span>
            </button>
          </div>
        ) : (
          <Canvas
            camera={{ position: [0, 8.5, 12], fov: 45 }}
            shadows
            dpr={[1, 1.5]}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
          >
            <color attach="background" args={['#080314']} />
            <WardScene
              beds={beds}
              selectedBedId={selectedBedId}
              onSelectBed={setSelectedBedId}
              onDeleteBed={handleDeleteBed}
            />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableDamping={true}
              dampingFactor={0.06}
              autoRotate={isAutoRotate}
              autoRotateSpeed={0.8}
              minDistance={5}
              maxDistance={22}
              maxPolarAngle={Math.PI / 2.05}
            />
          </Canvas>
        )}

        {/* Bottom Bed Switcher Tabs */}
        {beds.length > 0 && (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-2xl border border-purple-500/30 bg-[#120826]/90 p-1.5 shadow-[0_0_25px_rgba(0,0,0,0.5)] backdrop-blur-xl max-w-[90vw] overflow-x-auto">
            {beds.map((bed) => {
              const meta = getStatusColor(bed.status);
              const isTarget = bed.id === selectedBedId;
              return (
                <button
                  key={bed.id}
                  onClick={() => setSelectedBedId(bed.id)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                    isTarget
                      ? 'border border-purple-400 bg-purple-600/30 text-white shadow-md'
                      : 'text-purple-300/80 hover:bg-purple-900/40 hover:text-white'
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: meta.hex }}
                  />
                  <span>{bed.bedCode}</span>
                  <span className="hidden md:inline text-[11px] font-normal text-purple-300/70">
                    ({bed.name.split(' ')[0]})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ================= FLOATING TELEMETRY SIDE DRAWER ================= */}
        {selectedBed && (
          <aside className="absolute right-4 top-4 z-20 w-84 max-w-[calc(100vw-2rem)] rounded-3xl border border-purple-500/30 bg-[#13092b]/95 p-5 text-white shadow-[0_0_35px_rgba(168,85,247,0.25)] backdrop-blur-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-purple-400">
                    {selectedBed.bedCode}
                  </span>
                  <span className="text-xs text-purple-300/70">• {selectedBed.room}</span>
                </div>
                <h3 className="mt-1 text-lg font-black text-white tracking-tight">{selectedBed.name}</h3>
                <p className="text-xs text-purple-300/70">
                  {selectedBed.age} yrs • {selectedBed.gender} • {selectedBed.attendingDoctor}
                </p>
              </div>

              <div
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusMeta.bgClass} ${statusMeta.textClass} ${statusMeta.borderClass}`}
              >
                {selectedBed.status}
              </div>
            </div>

            {/* Diagnosis */}
            <div className="mt-3.5 rounded-2xl border border-purple-500/20 bg-purple-950/40 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300/80">
                Primary Admitting Diagnosis
              </span>
              <p className="mt-0.5 text-xs font-medium text-purple-100">
                {selectedBed.diagnosis}
              </p>
            </div>

            {/* AI Deterioration Risk Gauge */}
            <div className="mt-3 rounded-2xl border border-purple-500/20 bg-purple-950/40 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-purple-200">
                  <ShieldAlert className="h-4 w-4 text-purple-400" />
                  AI Deterioration Risk Index
                </span>
                <span
                  className="font-mono text-sm font-black"
                  style={{ color: statusMeta.hex }}
                >
                  {selectedBed.deteriorationRisk}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-purple-950/80">
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${selectedBed.deteriorationRisk}%`,
                    backgroundColor: statusMeta.hex,
                  }}
                />
              </div>
            </div>

            {/* Real-Time Hemodynamic Telemetry Grid */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 p-2.5">
                <div className="flex items-center gap-1 text-[10px] text-purple-300">
                  <Heart className="h-3 w-3 text-rose-400" />
                  <span>HEART RATE</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-black text-white">{selectedBed.heartRate}</span>
                  <span className="text-[10px] text-purple-300">bpm</span>
                </div>
              </div>

              <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 p-2.5">
                <div className="flex items-center gap-1 text-[10px] text-purple-300">
                  <Activity className="h-3 w-3 text-emerald-400" />
                  <span>BLOOD PRESSURE</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-black text-white">{selectedBed.bloodPressure}</span>
                  <span className="text-[10px] text-purple-300">mmHg</span>
                </div>
              </div>

              <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 p-2.5">
                <div className="flex items-center gap-1 text-[10px] text-purple-300">
                  <Wind className="h-3 w-3 text-cyan-400" />
                  <span>SPO₂ OXYGEN</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-black text-white">{selectedBed.spO2}%</span>
                  <span className="text-[10px] text-purple-300">sat</span>
                </div>
              </div>

              <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 p-2.5">
                <div className="flex items-center gap-1 text-[10px] text-purple-300">
                  <Thermometer className="h-3 w-3 text-amber-400" />
                  <span>TEMPERATURE</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-black text-white">{selectedBed.temperature}°</span>
                  <span className="text-[10px] text-purple-300">C</span>
                </div>
              </div>
            </div>

            {/* Quick Action Footer: 4. Discharge / Delete Button */}
            <div className="mt-3.5 flex flex-col gap-2">
              <button
                onClick={() => handleDeleteBed(selectedBed.id)}
                className="w-full rounded-xl border border-rose-500/40 bg-rose-500/20 py-2.5 text-center text-xs font-bold text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.25)] hover:bg-rose-500/30 transition flex items-center justify-center gap-2"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                <span>Discharge / Delete Patient</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ================= 2 & 3: ADD PATIENT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-purple-500/30 bg-[#120826]/95 p-6 sm:p-8 shadow-[0_0_50px_rgba(168,85,247,0.25)] text-white">
            <div className="flex items-center justify-between pb-4 border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600/30 border border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white">Admit Patient to ICU Bed</h3>
                  <p className="text-xs text-purple-300/80">Evaluates acuity with Gemini and assigns telemetry bay</p>
                </div>
              </div>
              <button
                onClick={() => !isGeminiEvaluating && setIsModalOpen(false)}
                disabled={isGeminiEvaluating}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:bg-purple-800/40 transition disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isGeminiEvaluating ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-12 w-12 text-purple-400 animate-spin" />
                <h4 className="mt-4 text-base font-bold text-white">Gemini Clinical AI Evaluating Acuity...</h4>
                <p className="mt-1 text-xs text-purple-300/70 max-w-sm">
                  Analyzing vitals and symptomatology to calculate deterioration risk trajectory and allocate ICU bay.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddPatientSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Name</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Rachel Adams"
                      className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/40 px-3.5 py-2.5 text-sm text-white placeholder-purple-400/40 focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Age</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={formAge}
                      onChange={(e) => setFormAge(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/40 px-3.5 py-2.5 text-sm text-white focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Assigned On-Call Doctor */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center justify-between">
                    <span>Assign On-Call Physician</span>
                    <span className="text-[10px] text-purple-400/80">Links patient to doctor telemetry</span>
                  </label>
                  <select
                    value={formDoctorId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setFormDoctorId(id);
                      const doc = doctorsList.find(d => d.id === id);
                      if (doc) setFormDoctorName(doc.name);
                    }}
                    className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/60 px-3.5 py-2.5 text-sm text-white focus:border-purple-400 focus:outline-none"
                  >
                    {doctorsList.map((doc) => (
                      <option key={doc.id} value={doc.id} className="bg-[#1a0c36] text-white">
                        {doc.name} — {doc.specialization} [{doc.status === 'ON_CALL' ? '🟢 ON CALL' : doc.status === 'IN_SURGERY' ? '🟡 IN SURGERY' : '⚪ OFF DUTY'}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-purple-300">HR (bpm)</label>
                    <input
                      type="number"
                      required
                      value={formHR}
                      onChange={(e) => setFormHR(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/40 px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-purple-300">BP Sys (mmHg)</label>
                    <input
                      type="number"
                      required
                      value={formBPSys}
                      onChange={(e) => setFormBPSys(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/40 px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-purple-300">BP Dia (mmHg)</label>
                    <input
                      type="number"
                      required
                      value={formBPDia}
                      onChange={(e) => setFormBPDia(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/40 px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-purple-300">SpO₂ (%)</label>
                    <input
                      type="number"
                      required
                      min="50"
                      max="100"
                      value={formSpO2}
                      onChange={(e) => setFormSpO2(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/40 px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Symptoms</label>
                  <textarea
                    required
                    rows={3}
                    value={formSymptoms}
                    onChange={(e) => setFormSymptoms(e.target.value)}
                    placeholder="e.g. Acute chest tightness, diaphoresis, dyspnea on exertion"
                    className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/40 px-3.5 py-2.5 text-sm text-white placeholder-purple-400/40 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/20">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-purple-500/30 px-4 py-2.5 text-xs font-semibold text-purple-300 hover:bg-purple-900/30 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:brightness-110 transition"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Evaluate with Gemini & Admit</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ICUBedView3D;
