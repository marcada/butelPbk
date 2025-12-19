import React, { useState, useEffect } from 'react';
import { Trash2, Image as ImageIcon } from 'lucide-react';
import type { Ad } from '../../types';

// Extend Ad type locally if needed until main types updated, or assume it matches.
// Actually checking types/index.ts, Ad interface has: id, name, type, content_path, duration.
// The API returns Advertisement model which has: id, client_name, title, package_type, web_image_path, billboard_image_path.
// We should probably define a specific interface for this admin view or update types. 
// For now let's define locally to avoid conflicts.

interface Advertisement {
    id: number;
    client_name: string;
    title: string;
    package_type: string;
    web_image_path?: string;
    billboard_image_path?: string;
    business_id?: number;
    created_at: string;
}

export const AdminAds: React.FC = () => {
    const [ads, setAds] = useState<Advertisement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:8000/api/advertisements')
            .then(res => res.json())
            .then(data => {
                setAds(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Дали сте сигурни дека сакате да ја избришете оваа реклама?')) return;

        try {
            const res = await fetch(`http://localhost:8000/api/advertisements/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setAds(ads.filter(a => a.id !== id));
            } else {
                alert('Грешка при бришење.');
            }
        } catch (err) {
            console.error(err);
            alert('Грешка при бришење.');
        }
    };

    if (loading) return <div className="p-8">Вчитување...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Реклами ({ads.length})</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ads.map(ad => (
                    <div key={ad.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
                        <div className="aspect-[9/16] bg-gray-100 relative">
                            {ad.billboard_image_path ? (
                                <img
                                    src={`http://localhost:8000${ad.billboard_image_path}`}
                                    alt={ad.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <ImageIcon className="w-12 h-12" />
                                </div>
                            )}

                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => handleDelete(ad.id)}
                                    className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transform hover:scale-110 transition-all"
                                >
                                    <Trash2 className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-gray-900 truncate">{ad.client_name}</h3>
                            <p className="text-sm text-gray-500 truncate">{ad.title}</p>
                            <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                                {ad.package_type}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
