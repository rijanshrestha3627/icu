import React from 'react';

export const PatientReportsView: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-srm-darkgray">Patient Reports</h3>
                <p className="text-gray-500 mt-1">Comprehensive reports and analytics for your patients.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h4 className="font-semibold text-lg text-srm-darkgray mb-2">Report Generation</h4>
                    <p className="text-gray-600 mb-4">Generate detailed reports for individual patients or department-wide analytics.</p>
                    <button className="bg-srm-blue text-white font-medium py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors">
                        Generate Report
                    </button>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h4 className="font-semibold text-lg text-srm-darkgray mb-2">Export Data</h4>
                    <p className="text-gray-600 mb-4">Export patient data in various formats for research or administrative purposes.</p>
                    <button className="bg-srm-blue text-white font-medium py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors">
                        Export Data
                    </button>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h4 className="font-semibold text-lg text-srm-darkgray mb-2">Report Templates</h4>
                    <p className="text-gray-600 mb-4">Use predefined templates for common report types.</p>
                    <button className="bg-srm-blue text-white font-medium py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors">
                        View Templates
                    </button>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h4 className="font-semibold text-lg text-srm-darkgray mb-4">Recent Reports</h4>
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                            <p className="font-medium">Cardiology Department Summary</p>
                            <p className="text-sm text-gray-500">Generated 2 hours ago</p>
                        </div>
                        <button className="text-srm-blue hover:underline">View</button>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                            <p className="font-medium">Patient Outcome Analysis</p>
                            <p className="text-sm text-gray-500">Generated yesterday</p>
                        </div>
                        <button className="text-srm-blue hover:underline">View</button>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                            <p className="font-medium">Treatment Efficacy Report</p>
                            <p className="text-sm text-gray-500">Generated 3 days ago</p>
                        </div>
                        <button className="text-srm-blue hover:underline">View</button>
                    </div>
                </div>
            </div>
        </div>
    );
};