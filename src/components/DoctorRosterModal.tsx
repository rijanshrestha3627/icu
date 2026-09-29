import React, { useState } from 'react';
import { Stethoscope, X, UserPlus, Phone, Mail, CheckCircle2, ShieldAlert, Clock, Sparkles } from 'lucide-react';
import { usePatientContext } from '../context/PatientContext';
import type { Doctor, DoctorStatus } from '../../types';

interface DoctorRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DoctorRosterModal: React.FC<DoctorRosterModalProps> = ({ isOpen, onClose }) => {
  const { doctors, addDoctor, updateDoctorStatus, patients } = usePatientContext();

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('Critical Care & Cardiology');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<DoctorStatus>('ON_CALL');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addDoctor({
      name: name.trim().startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`,
      specialization: specialization.trim(),
      department: specialization.trim(),
      phone: phone.trim() || '+1 (555) 019-2834',
      email: email.trim() || `doc_${Date.now()}@srm.hosp`,
      status,
    });

    setName('');
    setPhone('');
    setEmail('');
    setIsRegistering(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const getStatusBadge = (st: DoctorStatus) => {
    switch (st) {
      case 'ON_CALL':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
      case 'IN_SURGERY':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
      case 'OFF_DUTY':
      default:
        return 'bg-purple-900/30 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-purple-500/30 bg-[#120826]/95 p-6 sm:p-8 shadow-[0_0_60px_rgba(168,85,247,0.3)] text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-600/30 border border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Physician & On-Call Roster</h3>
              <p className="text-xs text-purple-300/80">Manage attending specialists, on-call assignments, and ICU coverage</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="flex items-center gap-2 rounded-xl bg-purple-600/40 border border-purple-400/40 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple-600/60 transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>{isRegistering ? 'View Roster' : 'Register Doctor'}</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:bg-purple-800/40 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            <span>Doctor registered and synced with Supabase roster!</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          {isRegistering ? (
            /* Register Doctor Form */
            <form onSubmit={handleRegister} className="space-y-4 rounded-2xl border border-purple-500/20 bg-purple-950/30 p-5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>Register Attending Physician</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Doctor Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Robert Chen"
                    className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/50 p-2.5 text-xs text-white placeholder-purple-400/40 focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Specialization</label>
                  <input
                    type="text"
                    required
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Critical Care & ECMO Specialist"
                    className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/50 p-2.5 text-xs text-white placeholder-purple-400/40 focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Direct Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 234-5678"
                    className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/50 p-2.5 text-xs text-white placeholder-purple-400/40 focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Hospital Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="r.chen@srm.hosp"
                    className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/50 p-2.5 text-xs text-white placeholder-purple-400/40 focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Current Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DoctorStatus)}
                    className="mt-1 w-full rounded-xl border border-purple-500/30 bg-purple-950/70 p-2.5 text-xs text-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="ON_CALL" className="bg-[#180a32] text-emerald-300">ON_CALL</option>
                    <option value="IN_SURGERY" className="bg-[#180a32] text-amber-300">IN_SURGERY</option>
                    <option value="OFF_DUTY" className="bg-[#180a32] text-purple-300">OFF_DUTY</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="rounded-xl border border-purple-500/30 px-4 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-900/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:brightness-110"
                >
                  Save Doctor to Supabase
                </button>
              </div>
            </form>
          ) : (
            /* Doctors List Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map((doc) => {
                const assignedCount = patients.filter(
                  (p) => p.assigned_doctor_id === doc.id || p.assignedDoctorId === doc.id || p.assigned_doctor_name === doc.name
                ).length;

                return (
                  <div
                    key={doc.id}
                    className="rounded-2xl border border-purple-500/25 bg-[#140a2c]/80 p-4 transition-all hover:border-purple-400/50 hover:bg-[#180d35]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-black text-white">{doc.name}</h4>
                        <p className="text-xs text-purple-300/90">{doc.specialization || doc.department}</p>
                      </div>

                      {/* Status Selector */}
                      <select
                        value={doc.status || 'ON_CALL'}
                        onChange={(e) => updateDoctorStatus(doc.id, e.target.value as DoctorStatus)}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-purple-950/70 cursor-pointer focus:outline-none ${getStatusBadge(doc.status || 'ON_CALL')}`}
                      >
                        <option value="ON_CALL" className="bg-[#1a0c36] text-emerald-300">ON_CALL</option>
                        <option value="IN_SURGERY" className="bg-[#1a0c36] text-amber-300">IN_SURGERY</option>
                        <option value="OFF_DUTY" className="bg-[#1a0c36] text-purple-300">OFF_DUTY</option>
                      </select>
                    </div>

                    <div className="mt-3.5 space-y-1 text-xs text-purple-200/80">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-purple-400" />
                        <span>{doc.phone || '+1 (555) 019-2834'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-purple-400" />
                        <span>{doc.email}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-purple-500/20 flex items-center justify-between text-[11px]">
                      <span className="text-purple-300/70">Assigned In-Patients:</span>
                      <span className="font-bold text-white bg-purple-950/80 px-2 py-0.5 rounded-lg border border-purple-500/30">
                        {assignedCount} Active
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorRosterModal;
