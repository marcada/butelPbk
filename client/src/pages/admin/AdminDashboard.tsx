import React from 'react';

export const AdminDashboard: React.FC = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium">Total Posts</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">12</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium">Active Events</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">5</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium">Active Ads</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">3</div>
                </div>
            </div>
        </div>
    );
};
