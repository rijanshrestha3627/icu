import React from 'react';
import type { TriageRisk } from '../types';

interface TriageRiskBadgeProps {
  risk: TriageRisk;
}

export const TriageRiskBadge: React.FC<TriageRiskBadgeProps> = ({ risk }) => {
  const riskColorMap: Record<TriageRisk, string> = {
    High: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    Medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    Low: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${riskColorMap[risk]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${risk === 'High' ? 'bg-rose-500' : risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
      {risk}
    </span>
  );
};
