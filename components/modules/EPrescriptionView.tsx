import React from 'react';
import { usePatientContext } from '../../src/context/PatientContext';

export const EPrescriptionView: React.FC = () => {
    const { patients, activePatient } = usePatientContext();
    const patient = activePatient || patients[0] || {
        name: 'No active patient',
        clinicalNotes: 'Please select or admit a patient from the database.',
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl text-white backdrop-blur-md">
                <h3 className="text-lg font-bold text-white mb-4">Consultation & Admitting Notes</h3>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm h-96 overflow-y-auto">
                    <p className="font-bold text-cyan-400">Patient: {patient.name}</p>
                    <pre className="whitespace-pre-wrap font-sans mt-3 text-xs leading-relaxed text-slate-300">
                        {patient.clinicalNotes || (patient as any).clinical_notes || 'No clinical notes recorded.'}
                    </pre>
                </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl text-white backdrop-blur-md">
                <h3 className="text-lg font-bold text-white mb-4">Create Dynamic E-Prescription</h3>
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        alert(`E-Prescription synchronized for ${patient.name} via Central Clinical Intelligence.`);
                    }} 
                    className="space-y-4 text-sm"
                >
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Medication</label>
                        <input type="text" className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none" placeholder="Search for medication (e.g., Augmentin, Norepinephrine)" />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Dosage</label>
                        <input type="text" className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none" placeholder="e.g., 625mg or 0.1 mcg/kg/min" />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Frequency</label>
                        <select className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white focus:border-cyan-400 focus:outline-none">
                            <option value="OD" className="bg-slate-900">Once a day (OD)</option>
                            <option value="BD" className="bg-slate-900">Twice a day (BD)</option>
                            <option value="TDS" className="bg-slate-900">Three times a day (TDS)</option>
                            <option value="PRN" className="bg-slate-900">As needed (PRN)</option>
                            <option value="CONT" className="bg-slate-900">Continuous IV Infusion</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Duration</label>
                        <input type="text" className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none" placeholder="e.g., 7 days or continuous" />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Notes for Pharmacist</label>
                        <textarea className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none" rows={2} placeholder="Clinical instruction or administration precaution"></textarea>
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:brightness-110 transition">
                        Finalize & Send to Pharmacy
                    </button>
                </form>
            </div>
        </div>
    );
};
export default EPrescriptionView;