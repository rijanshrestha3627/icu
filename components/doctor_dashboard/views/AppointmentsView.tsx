import React, { useState } from 'react';
import type { Patient } from '../../../types';

interface AppointmentsViewProps {
    patients?: Patient[];
    onPatientSelect?: (patient: Patient) => void;
}

// Mock appointment data - in a real app this would come from an API
const mockAppointments = [
    {
        id: '1',
        patientId: 'PID001',
        patientName: 'John Doe',
        date: '2024-07-22',
        time: '09:00 AM',
        type: 'Follow-up',
        status: 'Confirmed'
    },
    {
        id: '2',
        patientId: 'PID002',
        patientName: 'Jane Smith',
        date: '2024-07-22',
        time: '10:30 AM',
        type: 'Consultation',
        status: 'Pending'
    },
    {
        id: '3',
        patientId: 'PID003',
        patientName: 'Robert Johnson',
        date: '2024-07-22',
        time: '02:00 PM',
        type: 'Routine Check',
        status: 'Confirmed'
    }
];

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({ patients = [], onPatientSelect }) => {
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [type, setType] = useState('Consultation');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPatientId && date && time) {
            // In a real application, this would call an API to schedule the appointment
            console.log('Appointment scheduled for patient:', selectedPatientId, 'Date:', date, 'Time:', time, 'Type:', type);
            setIsSubmitted(true);
            // Reset form after submission
            setSelectedPatientId('');
            setDate('');
            setTime('');
            setType('Consultation');
            // Hide success message after 3 seconds
            setTimeout(() => setIsSubmitted(false), 3000);
        }
    };

    const handleViewPatient = (patientId: string) => {
        if (onPatientSelect && patients) {
            const patient = patients.find(p => p.id === patientId);
            if (patient) {
                onPatientSelect(patient);
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Confirmed': return 'bg-green-100 text-green-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-srm-darkgray">Appointments Schedule</h3>
                <p className="text-gray-500 mt-1">Manage and view your upcoming appointments and consultations.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                    <h4 className="font-semibold text-lg text-srm-darkgray mb-4">Upcoming Appointments</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3">Patient</th>
                                    <th className="px-4 py-3">Date & Time</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockAppointments.map((appointment) => (
                                    <tr key={appointment.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{appointment.patientName}</td>
                                        <td className="px-4 py-3">{appointment.date}, {appointment.time}</td>
                                        <td className="px-4 py-3">{appointment.type}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getStatusColor(appointment.status)}`}>
                                                {appointment.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button 
                                                onClick={() => handleViewPatient(appointment.patientId)}
                                                className="text-srm-blue hover:underline"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h4 className="font-semibold text-lg text-srm-darkgray mb-4">Schedule New Appointment</h4>
                        {isSubmitted && (
                            <div className="mb-4 p-3 bg-green-100 text-green-800 text-sm font-semibold rounded-md">
                                Appointment scheduled successfully!
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                                <select 
                                    value={selectedPatientId} 
                                    onChange={(e) => setSelectedPatientId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-srm-blue"
                                    required
                                >
                                    <option value="">Select a patient</option>
                                    {patients.map(patient => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.name} (ID: {patient.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input 
                                    type="date" 
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-srm-blue"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                <input 
                                    type="time" 
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-srm-blue"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select 
                                    value={type} 
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-srm-blue"
                                >
                                    <option value="Consultation">Consultation</option>
                                    <option value="Follow-up">Follow-up</option>
                                    <option value="Routine Check">Routine Check</option>
                                    <option value="Procedure">Procedure</option>
                                    <option value="Emergency">Emergency</option>
                                    <option value="Screening">Screening</option>
                                </select>
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-srm-blue text-white font-medium py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
                            >
                                Schedule Appointment
                            </button>
                        </form>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h4 className="font-semibold text-lg text-srm-darkgray mb-4">Today's Summary</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Appointments</span>
                                <span className="font-medium">8</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Completed</span>
                                <span className="font-medium text-green-600">3</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Pending</span>
                                <span className="font-medium text-yellow-600">2</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Cancelled</span>
                                <span className="font-medium text-red-600">1</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};