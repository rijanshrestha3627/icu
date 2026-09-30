import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Stethoscope } from 'lucide-react';
import type { View, NavItemType } from '../types';
import { navStructure } from '../navigation';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const NavItem: React.FC<{
  item: NavItemType;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  const { icon: Icon, label } = item;

  return (
    <motion.li whileHover={{ x: 3 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
      <button
        onClick={onClick}
        className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all duration-200 ${
          isActive
            ? 'bg-cyan-500/15 text-white border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
        }`}
      >
        <span
          className={`mr-3 flex h-7 w-7 items-center justify-center rounded-lg border transition ${
            isActive
              ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-400'
              : 'border-slate-800 bg-slate-900/60 text-slate-400'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="flex-1 truncate">{label}</span>
      </button>
    </motion.li>
  );
};

const NavCategory: React.FC<{
  category: string;
  icon: React.ElementType<any>;
  children: React.ReactNode;
}> = ({ category, icon: Icon, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 transition hover:text-white"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800/80 border border-slate-700/60">
            <Icon className="h-3 w-3 text-cyan-400" />
          </span>
          <span className="truncate">{category}</span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
      </button>
      {isOpen && <div className="mt-1 space-y-1 border-l border-slate-800 pl-3">{children}</div>}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-900/95 text-white backdrop-blur-md">
      {/* Brand Header */}
      <div className="flex h-20 flex-col items-center justify-center border-b border-slate-800 bg-slate-950/60 px-4 text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-teal-700 text-base font-black shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-400/40">
            N
          </div>
          <div>
            <h1 className="text-base font-black tracking-[0.16em] text-white">NEURONEXUS</h1>
            <span className="block text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-400">
              ICU Clinical Intelligence
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
        <ul className="space-y-4">
          {navStructure.map(({ category, icon, items }) => (
            <li key={category}>
              <NavCategory category={category} icon={icon}>
                <ul className="space-y-1 py-1">
                  {items.map(item => (
                    <NavItem
                      key={item.id}
                      item={item}
                      isActive={activeView === item.id}
                      onClick={() => setActiveView(item.id)}
                    />
                  ))}
                </ul>
              </NavCategory>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer System Pill */}
      <div className="border-t border-slate-800 p-3.5 bg-slate-950/70">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-bold text-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            Gemini 1.5 Flash
          </span>
          <span className="font-mono text-[10px] text-cyan-400">Active Engine</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
