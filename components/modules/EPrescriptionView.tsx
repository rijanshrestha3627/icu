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
            <div className="rounded-2xl border border-purple-500/25 bg-[#120826]/90 p-6 shadow-[0_0_30px_rgba(168,85,247,0.15)] text-white backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-4">Consultation & Admitting Notes</h3>
                <div className="rounded-xl border border-purple-500/20 bg-purple-950/40 p-4 text-sm h-96 overflow-y-auto">
                    <p className="font-bold text-purple-300">Patient: {patient.name}</p>
                    <pre className="whitespace-pre-wrap font-sans mt-3 text-xs leading-relaxed text-purple-100/90">
                        {patient.clinicalNotes || (patient as any).clinical_notes || 'No clinical notes recorded.'}
                    </pre>
                </div>
            </div>
            <div className="rounded-2xl border border-purple-500/25 bg-[#120826]/90 p-6 shadow-[0_0_30px_rgba(168,85,247,0.15)] text-white backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-4">Create Dynamic E-Prescription</h3>
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        alert(`E-Prescription synchronized for ${patient.name} via Central Clinical Intelligence.`);
                    }} 
                    className="space-y-4 text-sm"
                >
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-purple-300">Medication</label>
                        <input type="text" className="w-full mt-1 p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/50 text-white placeholder-purple-400/40 focus:border-purple-400 focus:outline-none" placeholder="Search for medication (e.g., Augmentin, Norepinephrine)" />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-purple-300">Dosage</label>
                        <input type="text" className="w-full mt-1 p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/50 text-white placeholder-purple-400/40 focus:border-purple-400 focus:outline-none" placeholder="e.g., 625mg or 0.1 mcg/kg/min" />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-purple-300">Frequency</label>
                        <select className="w-full mt-1 p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/60 text-white focus:border-purple-400 focus:outline-none">
                            <option value="OD" className="bg-[#15092c]">Once a day (OD)</option>
                            <option value="BD" className="bg-[#15092c]">Twice a day (BD)</option>
                            <option value="TDS" className="bg-[#15092c]">Three times a day (TDS)</option>
                            <option value="PRN" className="bg-[#15092c]">As needed (PRN)</option>
                            <option value="CONT" className="bg-[#15092c]">Continuous IV Infusion</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-purple-300">Duration</label>
                        <input type="text" className="w-full mt-1 p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/50 text-white placeholder-purple-400/40 focus:border-purple-400 focus:outline-none" placeholder="e.g., 7 days or continuous" />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-purple-300">Notes for Pharmacist</label>
                        <textarea className="w-full mt-1 p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/50 text-white placeholder-purple-400/40 focus:border-purple-400 focus:outline-none" rows={2} placeholder="Clinical instruction or administration precaution"></textarea>
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:brightness-110 transition">
                        Finalize & Send to Pharmacy
                    </button>
                </form>
            </div>
        </div>
    );
};
export default EPrescriptionView;