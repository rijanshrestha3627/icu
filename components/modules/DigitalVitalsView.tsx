import React from 'react';
import { VitalsChart } from '../VitalsChart';
import { mockPatients } from '../../services/mockData';

export const DigitalVitalsView: React.FC = () => {
    const patientWithVitals = mockPatients.find(p => p.vitals && p.vitals.length > 0) || mockPatients[0];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <VitalsChart patient={patientWithVitals} />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-srm-darkgray mb-4">Manual Vitals Entry</h3>
                <p className="text-sm text-gray-500 mb-4">For manual recording by nursing staff. Data syncs automatically with EMR.</p>
                <form className="space-y-4 text-sm">
                    <div>
                        <label className="font-medium text-gray-700">Heart Rate (bpm)</label>
                        <input type="number" className="w-full mt-1 p-2 border border-gray-300 rounded-md" placeholder="e.g., 75" />
                    </div>
                     <div>
                        <label className="font-medium text-gray-700">Blood Pressure (Systolic/Diastolic)</label>
                        <div className="flex items-center space-x-2">
                           <input type="number" className="w-full mt-1 p-2 border border-gray-300 rounded-md" placeholder="120" />
                           <span>/</span>
                           <input type="number" className="w-full mt-1 p-2 border border-gray-300 rounded-md" placeholder="80" />
                        </div>
                    </div>
                     <div>
                        <label className="font-medium text-gray-700">SpO2 (%)</label>
                        <input type="number" className="w-full mt-1 p-2 border border-gray-300 rounded-md" placeholder="e.g., 98" />
                    </div>
                     <div>
                        <label className="font-medium text-gray-700">Temperature (°F)</label>
                        <input type="number" step="0.1" className="w-full mt-1 p-2 border border-gray-300 rounded-md" placeholder="e.g., 98.6" />
                    </div>
                    <button type="submit" className="w-full bg-srm-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors">
                        Submit Vitals
                    </button>
                </form>
            </div>
        </div>
    );
};
