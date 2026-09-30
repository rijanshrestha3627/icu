import React from 'react';
import { Bell, LogOut, Stethoscope, UserPlus } from 'lucide-react';
import { usePatientContext } from '../src/context/PatientContext';

interface HeaderProps {
  title: string;
  userRole: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, userRole, onLogout }) => {
  const { openAddModal, openDoctorModal, doctors } = usePatientContext();
  const onCallCount = doctors.filter(d => d.status === 'ON_CALL').length;

  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur-md sm:px-6 xl:px-8 text-white">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
          <Stethoscope className="h-3.5 w-3.5 text-cyan-400" />
          <span>Clinical Intelligence Command Center</span>
        </div>
        <h2 className="truncate text-lg font-black tracking-tight text-white sm:text-2xl">{title}</h2>
      </div>

      <div className="ml-4 flex items-center gap-3 sm:gap-4">
        {/* Doctors & On-Call Roster Trigger */}
        <button
          onClick={openDoctorModal}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:border-cyan-500/50 transition shadow-sm"
          title="Manage ICU On-Call Physicians and Specialists"
        >
          <Stethoscope className="h-3.5 w-3.5 text-cyan-400" />
          <span className="hidden md:inline">Doctors Roster</span>
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {onCallCount} On-Call
          </span>
        </button>

        {/* Quick Add Patient Button */}
        <button
          onClick={openAddModal}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:brightness-110 transition"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Register Patient</span>
        </button>

        {/* Global Notifications Bell */}
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/60 text-slate-300 transition hover:bg-slate-700 hover:text-white">
          <Bell className="h-4 w-4" />
        </button>

        {/* User Identity Pill */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-800/60 px-3 py-1.5 shadow-sm">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{userRole}</p>
            <p className="flex items-center justify-end gap-1 text-[10px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Session
            </p>
          </div>
          <div className="h-8 w-8 overflow-hidden rounded-xl border border-cyan-500/40 bg-slate-700 shadow-inner flex items-center justify-center font-bold text-xs text-white">
            {userRole.charAt(0)}
          </div>
          <button
            onClick={onLogout}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-500/20 hover:text-rose-300"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
