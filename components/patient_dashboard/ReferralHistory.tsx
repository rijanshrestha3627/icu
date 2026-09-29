
import React from 'react';
import type { PatientReferral } from '../../types';

interface ReferralHistoryProps {
  referrals: PatientReferral[];
}

export const ReferralHistory: React.FC<ReferralHistoryProps> = ({ referrals }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-srm-darkgray mb-4">Referral History</h3>
      {referrals.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-gray-700 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Referred To</th>
                <th scope="col" className="px-6 py-3">Specialty</th>
                <th scope="col" className="px-6 py-3">Reason</th>
                <th scope="col" className="px-6 py-3">Referring Doctor</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((ref) => (
                <tr key={ref.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{ref.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{ref.referredTo}</td>
                  <td className="px-6 py-4">{ref.specialty}</td>
                  <td className="px-6 py-4">{ref.reason}</td>
                  <td className="px-6 py-4">{ref.doctor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">No referrals on record.</p>
      )}
    </div>
  );
};
