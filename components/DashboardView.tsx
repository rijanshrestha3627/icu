import React from 'react';
import type { Patient } from '../types';
import { mockPatients, mockBedOccupancyData, mockAdmissionData } from '../services/mockData';
import { TriageRiskBadge } from './TriageRiskBadge';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, LineChart, Line } from 'recharts';

interface DashboardProps {
    onPatientSelect: (patient: Patient) => void;
}

export const DashboardView: React.FC<DashboardProps> = ({ onPatientSelect }) => {
    const highRiskPatients = mockPatients.filter(p => p.triageInfo.risk === 'High').slice(0, 5);

    return (
        <div className="space-y-8">
            <section>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-srm-darkgray mb-4">Bed Occupancy Rate (%)</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={mockBedOccupancyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                                    <Tooltip cursor={{fill: 'rgba(230, 240, 246, 0.5)'}} />
                                    <Bar dataKey="occupancy" fill="#005A9C" name="Occupancy" unit="%" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                     <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-srm-darkgray mb-4">Patient Flow (Last 7 Days)</h3>
                        <div className="h-64 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={mockAdmissionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="admissions" stroke="#3182CE" strokeWidth={2} name="Admissions" />
                                    <Line type="monotone" dataKey="discharges" stroke="#38A169" strokeWidth={2} name="Discharges" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>
            
            <section>
                <h3 className="text-xl font-semibold mb-4 text-srm-darkgray">High-Risk Patients (Triage)</h3>
                 <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase tracking-wider">
                            <tr>
                                <th scope="col" className="px-6 py-3">Patient Name</th>
                                <th scope="col" className="px-6 py-3">Age</th>
                                <th scope="col" className="px-6 py-3">Chief Complaint</th>
                                <th scope="col" className="px-6 py-3">Risk Level</th>
                                <th scope="col" className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {highRiskPatients.map((patient) => (
                                <tr key={patient.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{patient.name}</td>
                                    <td className="px-6 py-4">{patient.age}</td>
                                    <td className="px-6 py-4">{patient.triageInfo.chiefComplaint}</td>
                                    <td className="px-6 py-4"><TriageRiskBadge risk={patient.triageInfo.risk} /></td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => onPatientSelect(patient)} className="font-medium text-srm-blue hover:underline">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};