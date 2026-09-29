
import React from 'react';
import { Examiner } from '../DischargeSummary';
import type { Patient } from '../../types';

export const DischargeSummaryMgmtView: React.FC<{patient: Patient}> = ({ patient }) => {
    return (
         <div className="max-w-2xl mx-auto">
             <div className="bg-white p-6 rounded-xl shadow-sm h-[60vh]">
                <Examiner patient={patient} />
             </div>
        </div>
    );
};
