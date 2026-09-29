
import React from 'react';
import { mockPatients, mockBillItems } from '../../services/mockData';

export const HospitalBillingView: React.FC = () => {
    const patient = mockPatients[0];
    const totalAmount = mockBillItems.reduce((acc, item) => acc + item.amount, 0);

    return (
        <div className="bg-white rounded-xl shadow-sm max-w-4xl mx-auto">
            <div className="p-6 border-b">
                <h3 className="text-xl font-semibold text-srm-darkgray">Patient Billing Summary</h3>
                <div className="flex justify-between text-sm mt-2">
                    <div>
                        <p className="font-bold">{patient.name}</p>
                        <p className="text-gray-500">Patient ID: {patient.id}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Admission Date: 2024-07-21</p>
                        <p className="text-gray-500">Discharge Date: 2024-07-23</p>
                    </div>
                </div>
            </div>
            <div className="p-6">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase">
                        <tr>
                            <th className="py-2">Description</th>
                            <th className="py-2">Department</th>
                            <th className="py-2 text-right">Amount (USD)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockBillItems.map(item => (
                            <tr key={item.id} className="border-b">
                                <td className="py-3 font-medium">{item.description}</td>
                                <td className="py-3 text-gray-600">{item.department}</td>
                                <td className="py-3 text-right font-mono">${item.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold">
                            <td colSpan={2} className="py-4 text-right text-lg">Total Due</td>
                            <td className="py-4 text-right text-lg font-mono">${totalAmount.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                 <button className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 text-sm">
                    Process Insurance Claim
                </button>
                <button className="bg-srm-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 text-sm">
                    Generate Final Invoice
                </button>
            </div>
        </div>
    );
};