import React, { useState } from 'react';
import { Stethoscope, X, UserPlus, Phone, Mail, CheckCircle2, Sparkles } from 'lucide-react';
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
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]';
      case 'IN_SURGERY':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]';
      case 'OFF_DUTY':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Physician & On-Call Roster</h3>
              <p className="text-xs text-slate-400">Manage attending specialists, on-call assignments, and ICU coverage</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="flex items-center gap-2 rounded-xl bg-cyan-600/20 border border-cyan-500/40 px-3.5 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-600/30 transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>{isRegistering ? 'View Roster' : 'Register Doctor'}</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition"
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
            <form onSubmit={handleRegister} className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>Register Attending Physician</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Doctor Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Robert Chen"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Specialization</label>
                  <input
                    type="text"
                    required
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Critical Care & ECMO Specialist"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Direct Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 234-5678"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Hospital Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="r.chen@srm.hosp"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Current Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DoctorStatus)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="ON_CALL" className="bg-slate-900 text-emerald-400">ON_CALL</option>
                    <option value="IN_SURGERY" className="bg-slate-900 text-amber-400">IN_SURGERY</option>
                    <option value="OFF_DUTY" className="bg-slate-900 text-slate-400">OFF_DUTY</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:brightness-110"
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
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-800/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-black text-white">{doc.name}</h4>
                        <p className="text-xs text-slate-400">{doc.specialization || doc.department}</p>
                      </div>

                      {/* Status Selector */}
                      <select
                        value={doc.status || 'ON_CALL'}
                        onChange={(e) => updateDoctorStatus(doc.id, e.target.value as DoctorStatus)}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-slate-900 cursor-pointer focus:outline-none ${getStatusBadge(doc.status || 'ON_CALL')}`}
                      >
                        <option value="ON_CALL" className="bg-slate-900 text-emerald-400">ON_CALL</option>
                        <option value="IN_SURGERY" className="bg-slate-900 text-amber-400">IN_SURGERY</option>
                        <option value="OFF_DUTY" className="bg-slate-900 text-slate-400">OFF_DUTY</option>
                      </select>
                    </div>

                    <div className="mt-3.5 space-y-1 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-cyan-400" />
                        <span>{doc.phone || '+1 (555) 019-2834'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-cyan-400" />
                        <span>{doc.email}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Assigned In-Patients:</span>
                      <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
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
