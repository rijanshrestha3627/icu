import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Patient } from '../types';

interface VitalsChartProps {
  patient: Patient;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-white text-xs">
        <p className="font-bold text-cyan-400 mb-1.5">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="font-medium text-[11px] leading-tight">
            {entry.name}: <span className="font-bold text-white">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const VitalsChart: React.FC<VitalsChartProps> = ({ patient }) => {
  const validVitals = Array.isArray(patient?.vitals) ? patient.vitals : [];

  if (validVitals.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-400">
        <h4 className="text-sm font-bold text-white mb-1">Vitals Telemetry Chart</h4>
        <p className="text-xs text-slate-500">No historical readings recorded yet for {patient?.name || 'this patient'}. Log vitals using the form above.</p>
      </div>
    );
  }

  // Take the most recent entries and reverse for chronological left-to-right display
  const chartData = [...validVitals].slice(0, 10).reverse().map((v) => {
    let timeStr = 'Now';
    try {
      if (v.timestamp) {
        timeStr = new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch {}

    const sys = typeof v.bloodPressure?.systolic === 'number'
      ? v.bloodPressure.systolic
      : (v as any).bp_systolic || patient.bp_systolic || 120;

    const dia = typeof v.bloodPressure?.diastolic === 'number'
      ? v.bloodPressure.diastolic
      : (v as any).bp_diastolic || patient.bp_diastolic || 80;

    return {
      time: timeStr,
      temperature: v.temperature ?? 37.0,
      heartRate: v.heartRate ?? patient.heart_rate_bpm ?? 75,
      bp_systolic: sys,
      bp_diastolic: dia,
      respirationRate: v.respirationRate ?? patient.respiration_rate ?? 16,
    };
  });

  const latestEntry = validVitals[0];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-white">Continuous Hemodynamic & Vitals Trend</h4>
          <p className="text-[11px] text-slate-400">Multi-parameter telemetry trends across hospital monitoring intervals</p>
        </div>
        {latestEntry?.timestamp && (
          <span className="font-mono text-[10px] text-cyan-400 border border-slate-800 rounded-lg px-2 py-1 bg-slate-950/60">
            Latest: {new Date(latestEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.6} />
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis 
              stroke="#64748b" 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              yAxisId="left"
              domain={['auto', 'auto']}
            />
            <YAxis 
              stroke="#f43f5e" 
              tick={{ fill: '#fb7185', fontSize: 11 }}
              orientation="right"
              yAxisId="right"
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#cbd5e1', fontSize: '11px', paddingTop: '8px' }}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="heartRate" 
              name="Heart Rate (bpm)" 
              stroke="#10b981" 
              activeDot={{ r: 6 }} 
              strokeWidth={2}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="bp_systolic" 
              name="BP Systolic (mmHg)" 
              stroke="#f43f5e" 
              strokeWidth={2}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="bp_diastolic" 
              name="BP Diastolic (mmHg)" 
              stroke="#06b6d4" 
              strokeWidth={2}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="temperature" 
              name="Temp (°C)" 
              stroke="#f59e0b" 
              strokeWidth={2}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="respirationRate" 
              name="Resp Rate (/min)" 
              stroke="#0d9488" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VitalsChart;