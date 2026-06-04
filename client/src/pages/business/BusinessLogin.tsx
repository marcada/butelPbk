import { API_BASE_URL, SERVER_URL } from '../../services/api';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Business {
    id: number;
    name: string;
    image_path: string;
}

export const BusinessLogin: React.FC = () => {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('${API_BASE_URL}/businesses')
            .then(res => res.json())
            .then(data => setBusinesses(data.data || data)) // Handle paginated or flat response
            .catch(err => console.error(err));
    }, []);

    const handleLogin = (id: number) => {
        // In a real app, we would authenticate here.
        // For demo, we just navigate to the dashboard.
        navigate(`/business/${id}/dashboard`);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Business Portal</h1>
                    <p className="text-gray-500">Select your business to manage ads</p>
                </div>

                <div className="space-y-4">
                    {businesses.map(biz => (
                        <button
                            key={biz.id}
                            onClick={() => handleLogin(biz.id)}
                            className="w-full flex items-center p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-xl transition-all group"
                        >
                            <img
                                src={`${SERVER_URL}${biz.image_path}`}
                                alt={biz.name}
                                className="w-12 h-12 rounded-lg object-cover bg-gray-200"
                            />
                            <span className="ml-4 text-lg font-bold text-gray-700 group-hover:text-indigo-700">{biz.name}</span>
                            <span className="ml-auto text-gray-400 group-hover:text-indigo-400">→</span>
                        </button>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <a href="/" className="text-sm text-gray-400 hover:text-gray-600">Back to Home</a>
                </div>
            </div>
        </div>
    );
};
