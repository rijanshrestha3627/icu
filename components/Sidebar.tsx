import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
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
            ? 'bg-purple-600/30 text-white border border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.35)] backdrop-blur-md'
            : 'text-purple-200/80 hover:bg-purple-950/40 hover:text-white'
        }`}
      >
        <span
          className={`mr-3 flex h-7 w-7 items-center justify-center rounded-lg border transition ${
            isActive
              ? 'border-purple-400 bg-purple-500/30 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
              : 'border-purple-500/20 bg-purple-950/40 text-purple-300'
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
        className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-purple-300 transition hover:text-white"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-900/40 border border-purple-500/30">
            <Icon className="h-3 w-3 text-purple-300" />
          </span>
          <span className="truncate">{category}</span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-purple-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
      </button>
      {isOpen && <div className="mt-1 space-y-1 border-l border-purple-500/20 pl-3">{children}</div>}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-purple-500/20 bg-[#0c051d]/85 text-white backdrop-blur-2xl">
      {/* Brand Header */}
      <div className="flex h-20 flex-col items-center justify-center border-b border-purple-500/20 bg-gradient-to-r from-purple-950 via-[#180838] to-purple-950 px-4 text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-base font-black shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-purple-300/40">
            N
          </div>
          <div>
            <h1 className="text-base font-black tracking-[0.16em] text-white">NEURONEXUS</h1>
            <span className="block text-[9px] font-bold uppercase tracking-[0.22em] text-purple-300/90">
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
      <div className="border-t border-purple-500/20 p-3.5 bg-[#090314]/80">
        <div className="flex items-center justify-between text-[11px] text-purple-300/80">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            Gemini 1.5 Flash
          </span>
          <span className="font-mono text-[10px] text-purple-400">Active Engine</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
