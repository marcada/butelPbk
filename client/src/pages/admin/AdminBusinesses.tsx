import React, { useState, useEffect } from 'react';
import { Package, Trash2, Search, Store } from 'lucide-react';
import type { Business } from '../../types';

export const AdminBusinesses: React.FC = () => {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const fetchBusinesses = () => {
        fetch('http://localhost:8000/api/businesses')
            .then(res => res.json())
            .then(data => {
                setBusinesses(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Дали сте сигурни дека сакате да го избришете овој бизнис? Ова ќе ги избрише и сите поврзани реклами.')) return;

        try {
            const res = await fetch(`http://localhost:8000/api/businesses/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setBusinesses(businesses.filter(b => b.id !== id));
            } else {
                alert('Грешка при бришење.');
            }
        } catch (err) {
            console.error(err);
            alert('Грешка при бришење.');
        }
    };

    const filteredBusinesses = businesses.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8">Вчитување...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Бизниси ({businesses.length})</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Пребарај..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Бизнис</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Категории</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пакет</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Локација</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Акција</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredBusinesses.map(business => (
                            <tr key={business.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            {business.image_path ? (
                                                <img className="h-10 w-10 rounded-lg object-cover" src={`http://localhost:8000${business.image_path}`} alt="" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                    <Store className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{business.name}</div>
                                            <div className="text-xs text-gray-500">{business.contact_email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-wrap gap-1">
                                        {business.categories.slice(0, 2).map(cat => (
                                            <span key={cat} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                {cat}
                                            </span>
                                        ))}
                                        {business.categories.length > 2 && <span className="text-xs text-gray-500">+{business.categories.length - 2}</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {business.package && (
                                        <span
                                            className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                                            style={{ backgroundColor: business.package.color + '20', color: business.package.color }}
                                        >
                                            {business.package.name}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                                    {business.location}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleDelete(business.id)}
                                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
