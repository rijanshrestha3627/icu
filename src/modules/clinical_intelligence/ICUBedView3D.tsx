import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import type { Group } from 'three';
import {
  Activity,
  Heart,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  UserPlus,
  RefreshCw,
  X,
  Sparkles,
  Loader2,
  Stethoscope,
  TrendingUp,
  Thermometer,
  Wind,
  Layers,
  LayoutGrid,
  Search,
} from 'lucide-react';
import {
  patientDatabase,
  getPatients,
  getICUBeds,
  getDoctors,
  addPatient,
  deletePatient,
} from '../../services/patientDatabase';
import { calculateTriageRisk } from '../../../services/geminiService';
import { Doctor } from '../../../types';

export type BedStatus = 'Stable' | 'Requires Attention' | 'Critical';

export interface ICUBedData {
  id: string;
  bedCode: string;
  patientId: string;
  name: string;
  age: number;
  gender?: string;
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

const getStatusColor = (
  status: BedStatus
): { hex: string; glow: string; textClass: string; bgClass: string; borderClass: string } => {
  switch (status) {
    case 'Critical':
      return {
        hex: '#f43f5e',
        glow: 'rgba(244, 63, 94, 0.45)',
        textClass: 'text-rose-400',
        bgClass: 'bg-rose-500/20',
        borderClass: 'border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
      };
    case 'Requires Attention':
      return {
        hex: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.45)',
        textClass: 'text-amber-400',
        bgClass: 'bg-amber-500/20',
        borderClass: 'border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
      };
    case 'Stable':
    default:
      return {
        hex: '#10b981',
        glow: 'rgba(16, 185, 129, 0.45)',
        textClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/20',
        borderClass: 'border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
      };
  }
};

/**
 * Procedural 3D ICU Hospital Bed Mesh (Medical Command Center Theme)
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
            color={isSelected ? '#06b6d4' : statusMeta.hex}
            transparent
            opacity={isSelected ? 0.75 : 0.35}
          />
        </mesh>
      )}

      {/* Bed Base Platform */}
      <mesh position={[0, -0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.3, 2.7]} />
        <meshStandardMaterial
          color={isSelected ? '#1e293b' : '#0f172a'}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Modern Medical Mattress */}
      <mesh position={[0, -0.15, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[1.55, 0.32, 2.45]} />
        <meshStandardMaterial
          color={isSelected ? '#ffffff' : '#f1f5f9'}
          roughness={0.35}
        />
      </mesh>

      {/* Articulated Headrest Pillow */}
      <mesh position={[0, 0.15, -0.75]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[1.3, 0.22, 0.65]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>

      {/* Patient Blanket with Clinical Teal/Cyan Accent Trim */}
      <mesh position={[0, 0.05, 0.3]} castShadow>
        <boxGeometry args={[1.5, 0.14, 1.6]} />
        <meshStandardMaterial color="#0e7490" roughness={0.55} />
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
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
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
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
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
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Glowing Screen Display Face */}
        <group ref={monitorGlowRef} position={[-0.05, 1.25, 0.045]} rotation={[0, -0.35, 0]}>
          <mesh>
            <planeGeometry args={[0.58, 0.38]} />
            <meshBasicMaterial color="#042f2e" />
          </mesh>
          {/* Real-time status waveform emitter */}
          <pointLight color={statusMeta.hex} intensity={0.9} distance={1.8} />
        </group>
      </group>

      {/* Floating 3D Telemetry HUD Pill (Medical Command Center Theme) */}
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
              ? 'scale-110 shadow-[0_0_25px_rgba(6,182,212,0.45)]'
              : 'scale-95 opacity-90 hover:scale-100 hover:opacity-100'
          }`}
          style={{ width: '230px' }}
        >
          <div
            className={`overflow-hidden rounded-2xl border backdrop-blur-xl transition-all ${
              isSelected
                ? 'border-cyan-400 bg-slate-900/95 ring-2 ring-cyan-400/50'
                : 'border-slate-700 bg-slate-900/85 hover:border-slate-600'
            }`}
          >
            {/* Bed Code + Status Pill */}
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 bg-slate-950/60">
              <span className="font-mono text-[11px] font-bold tracking-wider text-cyan-400">
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
                  className="rounded-lg p-1 text-rose-300 hover:bg-rose-500/20 transition border border-rose-500/30"
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
                <span className="text-[10px] text-slate-400">
                  {bed.age}y • {bed.gender?.charAt(0) || 'U'}
                </span>
              </div>

              {/* Quick Vitals Row */}
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-slate-950/60 p-2 text-[10px] border border-slate-800">
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
                    <span className="text-[8px] font-normal text-slate-400">BPM</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="font-bold text-white">
                    {bed.spO2}%{' '}
                    <span className="text-[8px] font-normal text-slate-400">SpO₂</span>
                  </span>
                </div>
              </div>

              {/* Click to Select Hint */}
              <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400">
                <span>{bed.room}</span>
                <span className={isSelected ? 'font-bold text-cyan-400' : 'text-slate-500'}>
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
 * 3D Scene Container with Medical Command Center Lighting and Floor
 */
const WardScene: React.FC<{
  beds: ICUBedData[];
  selectedBedId: string;
  onSelectBed: (bedId: string) => void;
  onDeleteBed: (bedId: string) => void;
}> = ({ beds, selectedBedId, onSelectBed, onDeleteBed }) => {
  return (
    <>
      <ambientLight intensity={0.7} color="#f8fafc" />
      <directionalLight
        position={[6, 12, 8]}
        intensity={1.2}
        color="#f1f5f9"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-6, 10, -6]} intensity={0.45} color="#06b6d4" />
      <pointLight position={[0, 8, 0]} intensity={0.7} color="#e0f2fe" distance={22} />

      {/* Floor Plane with Deep Navy/Slate Hospital Vinyl Tone */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.74, 0]}
        receiveShadow
      >
        <planeGeometry args={[36, 26]} />
        <meshStandardMaterial
          color="#0b1120"
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>

      {/* Clinical Grid Lines on Floor */}
      <gridHelper
        args={[36, 36, '#1e293b', 'rgba(6, 182, 212, 0.15)']}
        position={[0, -0.73, 0]}
      />

      {/* 3D Hospital Bed Bays */}
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
 * 2D Clinical Grid Card for High-Density Overview
 */
const ClinicalGridCard: React.FC<{
  bed: ICUBedData;
  isSelected: boolean;
  onSelect: (bedId: string) => void;
  onDelete: (bedId: string) => void;
}> = ({ bed, isSelected, onSelect, onDelete }) => {
  const meta = useMemo(() => getStatusColor(bed.status), [bed.status]);

  return (
    <div
      onClick={() => onSelect(bed.id)}
      className={`group relative cursor-pointer rounded-2xl border transition-all duration-200 ${
        isSelected
          ? 'border-cyan-500 bg-slate-800/90 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500'
          : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-850'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-black tracking-wider text-cyan-400">
            {bed.bedCode}
          </span>
          <span className="text-[11px] text-slate-400">• {bed.room}</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.bgClass} ${meta.textClass} border ${meta.borderClass}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${bed.status === 'Critical' ? 'animate-ping' : ''}`}
              style={{ backgroundColor: meta.hex }}
            />
            {bed.status}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(bed.id);
            }}
            title="Discharge Patient"
            className="rounded-lg p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
              {bed.name}
            </h4>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
              {bed.diagnosis}
            </p>
          </div>
          <span className="text-xs text-slate-400">{bed.age}y</span>
        </div>

        <div className="grid grid-cols-4 gap-2 rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/80 text-center">
          <div>
            <span className="text-[9px] font-bold text-slate-400 block uppercase">HR</span>
            <span className="text-xs font-black text-rose-400">{bed.heartRate}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 block uppercase">NIBP</span>
            <span className="text-xs font-bold text-white">{bed.bloodPressure}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 block uppercase">SpO₂</span>
            <span className="text-xs font-black text-cyan-400">{bed.spO2}%</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Temp</span>
            <span className="text-xs font-bold text-amber-400">{bed.temperature}°C</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 truncate">
            <Stethoscope className="h-3.5 w-3.5 text-teal-400 flex-shrink-0" />
            <span className="truncate">{bed.attendingDoctor}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500">
            Risk {bed.deteriorationRisk}%
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Main ICUBedView3D Component
 * Interactive 3D Bed Digital Twin + 2D Clinical Grid Mode
 */
export const ICUBedView3D: React.FC = () => {
  const [beds, setBeds] = useState<ICUBedData[]>([]);
  const [selectedBedId, setSelectedBedId] = useState<string>('');
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'3d' | 'grid'>('3d');
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Add Patient Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeminiEvaluating, setIsGeminiEvaluating] = useState(false);

  // Form Fields: Name, Age, HR, BP, SpO2, Symptoms, Doctor
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

  // Async data synchronization with central database & doctor rosters
  const refreshBeds = useCallback(async () => {
    try {
      setIsLoading(true);
      await getPatients();
      const [icuList, docs] = await Promise.all([getICUBeds(), getDoctors()]);
      setBeds(icuList);
      setDoctorsList(docs);
      if (docs.length > 0 && !formDoctorId) {
        const onCall = docs.find((d) => d.status === 'ON_CALL') || docs[0];
        setFormDoctorId(onCall.id);
        setFormDoctorName(onCall.name);
      }
      if (icuList.length > 0 && (!selectedBedId || !icuList.some((b) => b.id === selectedBedId))) {
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
    if (beds.length > 0 && !beds.some((b) => b.id === selectedBedId)) {
      setSelectedBedId(beds[0].id);
    }
  }, [beds, selectedBedId]);

  const selectedBed = useMemo(
    () => beds.find((b) => b.id === selectedBedId) || beds[0],
    [beds, selectedBedId]
  );

  const statusMeta = useMemo(
    () => getStatusColor(selectedBed?.status || 'Stable'),
    [selectedBed?.status]
  );

  // Ward summary statistics
  const stats = useMemo(() => {
    const total = beds.length;
    const critical = beds.filter((b) => b.status === 'Critical').length;
    const warning = beds.filter((b) => b.status === 'Requires Attention').length;
    const stable = beds.filter((b) => b.status === 'Stable').length;
    return { total, critical, warning, stable };
  }, [beds]);

  const filteredBeds = useMemo(() => {
    if (!filterSearch.trim()) return beds;
    const q = filterSearch.toLowerCase();
    return beds.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.bedCode.toLowerCase().includes(q) ||
        b.room.toLowerCase().includes(q) ||
        b.diagnosis.toLowerCase().includes(q) ||
        b.attendingDoctor.toLowerCase().includes(q)
    );
  }, [beds, filterSearch]);

  // Discharge / Delete patient
  const handleDeleteBed = async (bedId: string) => {
    const rawId = bedId.startsWith('bed-') ? bedId.replace('bed-', '') : bedId;
    const targetBed = beds.find((b) => b.id === bedId);
    const targetName = targetBed?.name || 'this patient';

    if (!confirm(`Are you sure you want to discharge / delete ${targetName} from the ICU ward?`)) {
      return;
    }

    setBeds((prev) => prev.filter((b) => b.id !== bedId));
    if (selectedBedId === bedId) {
      const nextBed = beds.find((b) => b.id !== bedId);
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

  // Add patient form submission with Gemini evaluation
  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSymptoms.trim()) {
      alert('Please fill out the patient name and symptoms.');
      return;
    }

    const symptomsList = Array.isArray(formSymptoms) 
      ? formSymptoms 
      : typeof formSymptoms === 'string' && formSymptoms.trim() 
      ? formSymptoms.split(',').map((s) => s.trim()) 
      : [];

    setIsGeminiEvaluating(true);
    try {
      const triageResult = await calculateTriageRisk({
        name: formName,
        age: Number(formAge),
        symptoms: symptomsList.join(', '),
        heartRate: Number(formHR),
        bpSys: Number(formBPSys),
        bpDia: Number(formBPDia),
        spO2: Number(formSpO2),
        temperature: 98.6,
        respirationRate: 18,
      });

      const selectedDoc = doctorsList.find((d) => d.id === formDoctorId) || doctorsList[0];
      const docName = selectedDoc ? selectedDoc.name : formDoctorName || 'On-Call Intensivist';

      await addPatient({
        name: formName,
        age: Number(formAge),
        gender: 'Male',
        assignedDoctorId: selectedDoc ? selectedDoc.id : undefined,
        assignedDoctorName: docName,
        symptoms: symptomsList,
        triageAssessment: {
          riskCategory: triageResult.riskCategory,
          deteriorationTrajectory: triageResult.deteriorationTrajectory,
          clinicalSummary: triageResult.clinicalSummary,
          suggestedProtocol: triageResult.suggestedProtocol,
          triageDate: new Date().toISOString(),
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
      await refreshBeds();
    } catch (err: any) {
      alert('Error registering patient: ' + (err?.message || 'Failed'));
    } finally {
      setIsGeminiEvaluating(false);
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-140px)] min-h-[680px] w-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100">
      {/* ================= TOP COMMAND CENTER HUD CONTROLS BAR ================= */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/90 px-6 py-4 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 items-center justify-center">
              <span className="h-2.5 w-2.5 animate-ping rounded-full bg-cyan-400" />
            </span>
            <h2 className="text-base font-black text-white sm:text-lg tracking-tight">
              3D ICU Ward • Interactive Digital Twin & Telemetry
            </h2>
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-400">
              SUPABASE REAL-TIME SYNCHRONIZED
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Real-time interactive 3D digital twin of hospital ICU beds. Click any bed to inspect telemetry, reassess acuity, or reassign doctors.
          </p>
        </div>

        {/* Quick Summary Pill Counters & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs">
            <span className="text-slate-400">ICU Beds:</span>
            <span className="font-bold text-white">{stats.total}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-xs text-rose-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Critical:</span>
            <span className="font-bold">{stats.critical}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-400">
            <Activity className="h-3.5 w-3.5" />
            <span>Attention:</span>
            <span className="font-bold">{stats.warning}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Stable:</span>
            <span className="font-bold">{stats.stable}</span>
          </div>

          {/* View Mode Toggle: 3D Ward vs 2D Clinical Grid */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950/70 p-1">
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                viewMode === '3d'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Interactive 3D Digital Twin View"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>3D Ward</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                viewMode === 'grid'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="2D Clinical Telemetry Grid"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>2D Grid</span>
            </button>
          </div>

          {/* Add Patient Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:brightness-110 transition"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add Patient</span>
          </button>

          {/* Auto rotate toggle (for 3D view) */}
          {viewMode === '3d' && (
            <button
              onClick={() => setIsAutoRotate(!isAutoRotate)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                isAutoRotate
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Toggle camera orbit rotation"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Orbit</span>
            </button>
          )}
        </div>
      </header>

      {/* ================= VIEWPORT AREA ================= */}
      <div className="relative flex-1 overflow-hidden">
        {beds.length === 0 && !isLoading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-base font-bold text-slate-200">No patients currently admitted to ICU Ward</p>
            <p className="mt-1 text-xs text-slate-400">Click "Add Patient" above to admit a patient to an ICU bed.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Patient Now</span>
            </button>
          </div>
        ) : viewMode === '3d' ? (
          /* ================= INTERACTIVE 3D BED CANVAS ================= */
          <Canvas
            camera={{ position: [0, 8.5, 12], fov: 45 }}
            shadows
            dpr={[1, 1.5]}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
          >
            <color attach="background" args={['#0f172a']} />
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
        ) : (
          /* ================= 2D CLINICAL GRID VIEW ================= */
          <div className="h-full overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by name, bed code, room, or doctor..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <span className="text-xs text-slate-400">
                Displaying <strong className="text-white">{filteredBeds.length}</strong> beds
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBeds.map((bed) => (
                <ClinicalGridCard
                  key={bed.id}
                  bed={bed}
                  isSelected={bed.id === selectedBedId}
                  onSelect={setSelectedBedId}
                  onDelete={handleDeleteBed}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bottom Bed Switcher Tabs (Visible in 3D Mode) */}
        {viewMode === '3d' && beds.length > 0 && (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/90 p-1.5 shadow-2xl backdrop-blur-md max-w-[90vw] overflow-x-auto">
            {beds.map((bed) => {
              const meta = getStatusColor(bed.status);
              const isTarget = bed.id === selectedBedId;
              return (
                <button
                  key={bed.id}
                  onClick={() => setSelectedBedId(bed.id)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                    isTarget
                      ? 'border border-cyan-500 bg-cyan-600/30 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: meta.hex }}
                  />
                  <span>{bed.bedCode}</span>
                  <span className="hidden md:inline text-[11px] font-normal text-slate-400">
                    ({bed.name.split(' ')[0]})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ================= FLOATING TELEMETRY SIDE DRAWER ================= */}
        {selectedBed && (
          <aside className="absolute right-4 top-4 z-20 w-84 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-800 bg-slate-900/95 p-5 text-white shadow-2xl backdrop-blur-md">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-cyan-400">
                    {selectedBed.bedCode}
                  </span>
                  <span className="text-xs text-slate-400">• {selectedBed.room}</span>
                </div>
                <h3 className="mt-1 text-lg font-black text-white">{selectedBed.name}</h3>
                <p className="text-xs text-slate-400">
                  {selectedBed.age} yrs • {selectedBed.gender || 'Unknown'} • {selectedBed.diagnosis}
                </p>
              </div>

              {/* Status Pill Badge */}
              <div
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusMeta.bgClass} ${statusMeta.textClass} border ${statusMeta.borderClass}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    selectedBed.status === 'Critical' ? 'animate-ping' : ''
                  }`}
                  style={{ backgroundColor: statusMeta.hex }}
                />
                {selectedBed.status}
              </div>
            </div>

            {/* Deterioration Risk Level Gauge */}
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                  <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                  Deterioration Risk
                </span>
                <span className="font-mono font-bold text-white">
                  {selectedBed.deteriorationRisk}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${selectedBed.deteriorationRisk}%`,
                    backgroundColor: statusMeta.hex,
                  }}
                />
              </div>
            </div>

            {/* Attending Physician */}
            <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs">
              <span className="text-slate-400">Attending Doctor:</span>
              <span className="font-semibold text-teal-400 flex items-center gap-1">
                <Stethoscope className="h-3.5 w-3.5" />
                {selectedBed.attendingDoctor}
              </span>
            </div>

            {/* Real-time Telemetry Monitor Cards */}
            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Heart className="h-3 w-3 text-rose-400" />
                  <span>HEART RATE</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-black text-rose-400">
                    {selectedBed.heartRate}
                  </span>
                  <span className="text-[10px] text-slate-400">BPM</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Activity className="h-3 w-3 text-cyan-400" />
                  <span>NIBP BLOOD PRESS</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-base font-black text-white">
                    {selectedBed.bloodPressure}
                  </span>
                  <span className="text-[10px] text-slate-400">mmHg</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Wind className="h-3 w-3 text-teal-400" />
                  <span>SPO₂ OXYGEN</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-black text-cyan-400">
                    {selectedBed.spO2}%
                  </span>
                  <span className="text-[10px] text-slate-400">sat</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Thermometer className="h-3 w-3 text-amber-400" />
                  <span>TEMPERATURE</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-black text-amber-400">
                    {selectedBed.temperature}°
                  </span>
                  <span className="text-[10px] text-slate-400">C</span>
                </div>
              </div>
            </div>

            {/* Quick Action Footer: Discharge / Delete Button */}
            <div className="mt-3.5 flex flex-col gap-2">
              <button
                onClick={() => handleDeleteBed(selectedBed.id)}
                className="w-full rounded-xl border border-rose-500/40 bg-rose-500/20 py-2.5 text-center text-xs font-bold text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)] hover:bg-rose-500/30 transition flex items-center justify-center gap-2"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                <span>Discharge / Delete Patient</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ================= ADD PATIENT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white">
                    Admit Patient to ICU Bed
                  </h3>
                  <p className="text-xs text-slate-400">
                    Evaluates acuity with Gemini AI and assigns telemetry bay
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isGeminiEvaluating && setIsModalOpen(false)}
                disabled={isGeminiEvaluating}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isGeminiEvaluating ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-12 w-12 text-cyan-400 animate-spin" />
                <h4 className="mt-4 text-base font-bold text-white">
                  Gemini Clinical AI Evaluating Acuity...
                </h4>
                <p className="mt-1 text-xs text-slate-400 max-w-sm">
                  Analyzing vitals and symptomatology to calculate deterioration risk trajectory and allocate ICU bay.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddPatientSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Rachel Adams"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Age
                    </label>
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

                {/* Assigned On-Call Doctor */}
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
                      const doc = doctorsList.find((d) => d.id === id);
                      if (doc) setFormDoctorName(doc.name);
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {doctorsList.map((doc) => (
                      <option key={doc.id} value={doc.id} className="bg-slate-900 text-white">
                        {doc.name} — {doc.specialization} [
                        {doc.status === 'ON_CALL'
                          ? '🟢 ON CALL'
                          : doc.status === 'IN_SURGERY'
                          ? '🟡 IN SURGERY'
                          : '⚪ OFF DUTY'}
                        ]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      HR (bpm)
                    </label>
                    <input
                      type="number"
                      required
                      value={formHR}
                      onChange={(e) => setFormHR(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      BP Sys (mmHg)
                    </label>
                    <input
                      type="number"
                      required
                      value={formBPSys}
                      onChange={(e) => setFormBPSys(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      BP Dia (mmHg)
                    </label>
                    <input
                      type="number"
                      required
                      value={formBPDia}
                      onChange={(e) => setFormBPDia(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      SpO₂ (%)
                    </label>
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
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Symptoms
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formSymptoms}
                    onChange={(e) => setFormSymptoms(e.target.value)}
                    placeholder="e.g. Acute chest tightness, diaphoresis, dyspnea on exertion"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:brightness-110 transition"
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
