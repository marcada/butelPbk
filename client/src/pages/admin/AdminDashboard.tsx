import React from 'react';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = React.useState({
        total_posts: 0,
        active_events: 0,
        active_ads: 0
    });

    React.useEffect(() => {
        fetch('http://localhost:8000/api/admin/stats')
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error('Error fetching stats:', err));
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium">Total Posts</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total_posts}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium">Active Events</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{stats.active_events}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium">Active Ads</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{stats.active_ads}</div>
                </div>
            </div>
        </div>
    );
};
