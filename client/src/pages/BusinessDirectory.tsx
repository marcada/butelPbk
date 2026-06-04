import React, { useState, useEffect } from 'react';
import type { Business } from '../types';
import { MapPin, Phone, Mail, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const ALL_CATEGORIES = [
    'Сте', 'Ресторан', 'Хотел', 'Маркет', 'Вила', 'Аптека',
    'Кафе-бар', 'Слаткарница', 'Бутик', 'Фризерски Салон',
    'Банка', 'Осигурување', 'Бензинска Пумпа'
];

export const BusinessDirectory: React.FC = () => {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [filterCategory, setFilterCategory] = useState('Сте');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:8000/api/businesses')
            .then(res => res.json())
            .then(data => {
                setBusinesses(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const filteredBusinesses = filterCategory === 'Сте'
        ? businesses
        : businesses.filter(b => b.categories.includes(filterCategory));

    if (loading) return <div className="p-8 text-center text-gray-500">Вчитување бизниси...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Регистар на Бизниси</h1>
                            <p className="text-gray-500 mt-1">Откријте ги најдобрите локации во градот</p>
                        </div>
                        <Link to="/advertise" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-colors">
                            + Додади Твој Бизнис
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="mt-8 flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                        {ALL_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`
                                    whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all
                                    ${filterCategory === cat
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }
                                `}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBusinesses.map(business => (
                        <div key={business.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                            {/* Image Header */}
                            <div className="h-48 bg-gray-100 relative overflow-hidden">
                                {business.image_path ? (
                                    <img
                                        src={`http://localhost:8000${business.image_path}`}
                                        alt={business.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                        <ImageIcon className="w-12 h-12 mb-2" />
                                        <span className="text-xs font-medium uppercase">Нема Слика</span>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 flex gap-1">
                                    {business.categories.slice(0, 2).map(cat => (
                                        <span key={cat} className="text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm text-gray-800 px-2 py-1 rounded shadow-sm">
                                            {cat}
                                        </span>
                                    ))}
                                    {business.categories.length > 2 && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm text-gray-800 px-2 py-1 rounded shadow-sm">
                                            +{business.categories.length - 2}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{business.name}</h3>

                                <div className="space-y-3 text-sm text-gray-600 mb-6">
                                    {business.location && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                                            <span className="line-clamp-2">{business.location}</span>
                                        </div>
                                    )}
                                    {business.contact_phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            {business.contact_phone}
                                        </div>
                                    )}
                                    {business.contact_email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            {business.contact_email}
                                        </div>
                                    )}
                                </div>

                                {business.package && (
                                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                                        <span className="text-xs font-semibold text-gray-400 uppercase">Пакет</span>
                                        <span
                                            className="text-xs font-bold px-2 py-1 rounded"
                                            style={{ backgroundColor: business.package.color + '20', color: business.package.color }}
                                        >
                                            {business.package.name}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {filteredBusinesses.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400">
                            Нема пронајдено бизниси во оваа категорија.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
