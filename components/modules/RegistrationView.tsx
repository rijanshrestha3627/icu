
import React from 'react';
import { mockAppointments } from '../../services/mockData';
// FIX: Import Appointment type to correctly type the status handler.
import type { Appointment } from '../../types';

const CalendarDay: React.FC<{ day: string, date: number, isToday?: boolean }> = ({ day, date, isToday }) => (
    <div className={`p-2 border-r border-b ${isToday ? 'bg-srm-lightblue' : 'bg-white'}`}>
        <p className={`text-xs ${isToday ? 'font-bold text-srm-blue' : 'text-gray-500'}`}>{day}</p>
        <p className={`text-lg font-semibold ${isToday ? 'text-srm-blue' : 'text-gray-800'}`}>{date}</p>
    </div>
);

export const RegistrationView: React.FC = () => {
    // FIX: Updated getStatusColor to handle all possible appointment statuses.
    const getStatusColor = (status: Appointment['status']) => {
        switch (status) {
            case 'Confirmed': return 'bg-green-100 text-green-800';
            case 'PendingApproval': return 'bg-yellow-100 text-yellow-800';
            case 'PendingDoctorAssignment': return 'bg-blue-100 text-blue-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div>
                    <h3 className="text-xl font-semibold text-srm-darkgray">Upcoming Appointments</h3>
                    <div className="bg-white rounded-xl shadow-sm mt-4 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-xs text-gray-700 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">Time</th>
                                    <th className="px-6 py-3">Patient</th>
                                    <th className="px-6 py-3">Doctor</th>
                                    <th className="px-6 py-3">Department</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockAppointments.map(appt => (
                                    <tr key={appt.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium">{appt.time}</td>
                                        <td className="px-6 py-4">{appt.patientName}</td>
                                        <td className="px-6 py-4">{appt.doctor}</td>
                                        <td className="px-6 py-4">{appt.department}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appt.status)}`}>
                                                {/* FIX: Format status for better readability */}
                                                {appt.status.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div>
                     <h3 className="text-xl font-semibold text-srm-darkgray">Weekly Schedule</h3>
                     <div className="grid grid-cols-7 border-t border-l border-gray-200 mt-4 rounded-lg overflow-hidden shadow-sm">
                        <CalendarDay day="Mon" date={18} />
                        <CalendarDay day="Tue" date={19} />
                        <CalendarDay day="Wed" date={20} />
                        <CalendarDay day="Thu" date={21} isToday />
                        <CalendarDay day="Fri" date={22} />
                        <CalendarDay day="Sat" date={23} />
                        <CalendarDay day="Sun" date={24} />
                     </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-srm-darkgray mb-4">Book New Appointment</h3>
                <form className="space-y-4 text-sm">
                    <div>
                        <label className="font-medium text-gray-700">Patient Name</label>
                        <input type="text" className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-srm-blue focus:border-srm-blue" placeholder="e.g., John Doe"/>
                    </div>
                     <div>
                        <label className="font-medium text-gray-700">Department</label>
                        <select className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-srm-blue focus:border-srm-blue bg-white">
                            <option>Cardiology</option>
                            <option>Neurology</option>
                            <option>Orthopedics</option>
                            <option>Pediatrics</option>
                        </select>
                    </div>
                     <div>
                        <label className="font-medium text-gray-700">Date & Time</label>
                        <input type="datetime-local" className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-srm-blue focus:border-srm-blue"/>
                    </div>
                    <button type="submit" className="w-full bg-srm-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors">
                        Book Appointment
                    </button>
                </form>
            </div>
        </div>
    );
};
