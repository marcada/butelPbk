import React, { useState, useEffect } from 'react';
import type { Package } from '../types';
import { Check, MapPin, Store, Upload, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BUSINESS_CATEGORIES = [
    'Ресторан', 'Хотел', 'Маркет', 'Вила', 'Аптека',
    'Кафе-бар', 'Слаткарница', 'Бутик', 'Фризерски Салон',
    'Банка', 'Осигурување', 'Бензинска Пумпа'
];

export const Advertise: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        categories: [] as string[],
        location: '',
        contact_email: '',
        contact_phone: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [adFiles, setAdFiles] = useState<File[]>([]);
    const [adPreviews, setAdPreviews] = useState<string[]>([]);

    useEffect(() => {
        fetch('http://localhost:8000/api/packages')
            .then(res => res.json())
            .then(data => {
                setPackages(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const handleCategoryToggle = (category: string) => {
        setFormData(prev => {
            if (prev.categories.includes(category)) {
                return { ...prev, categories: prev.categories.filter(c => c !== category) };
            } else {
                return { ...prev, categories: [...prev.categories, category] };
            }
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleAdsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setAdFiles(prev => [...prev, ...files]);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setAdPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPackage) return;

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('package_id', selectedPackage.toString());
            data.append('location', formData.location);
            data.append('contact_email', formData.contact_email);
            data.append('contact_phone', formData.contact_phone);

            formData.categories.forEach(cat => data.append('categories[]', cat));

            if (imageFile) {
                data.append('image', imageFile);
            }

            adFiles.forEach(file => {
                data.append('ads[]', file);
            });

            const response = await fetch('http://localhost:8000/api/businesses', {
                method: 'POST',
                body: data,
                // Don't set Content-Type header when using FormData; browser does it automatically with boundary
            });

            if (response.ok) {
                navigate('/directory');
            } else {
                const errData = await response.json();
                console.error(errData);
                alert('Грешка при регистрација. Ве молиме обидете се повторно.');
            }
        } catch (err) {
            console.error('Submission error:', err);
            alert('Грешка при вмрежување.');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Вчитување понуди...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">

                {/* Progress Indicators */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400 border'}`}>
                            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span>
                            Избери Пакет
                        </div>
                        <div className="w-12 h-px bg-gray-300" />
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400 border'}`}>
                            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">2</span>
                            Детали за Бизнисот
                        </div>
                    </div>
                </div>

                {/* STEP 1: Select Package */}
                {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {packages.map(pkg => (
                            <div
                                key={pkg.id}
                                onClick={() => setSelectedPackage(pkg.id)}
                                className={`
                                    relative bg-white rounded-2xl p-6 cursor-pointer transition-all duration-300
                                    ${selectedPackage === pkg.id
                                        ? 'ring-4 ring-indigo-500 shadow-xl scale-105'
                                        : 'hover:shadow-lg border border-gray-100 hover:-translate-y-1'
                                    }
                                `}
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    {selectedPackage === pkg.id && <div className="bg-indigo-600 text-white rounded-full p-1"><Check className="w-4 h-4" /></div>}
                                </div>

                                <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: pkg.color + '20' }}>
                                    <Store className="w-6 h-6" style={{ color: pkg.color }} />
                                </div>

                                <h3 className="text-lg font-black text-gray-900 mb-2">{pkg.name}</h3>
                                <div className="text-3xl font-black text-gray-900 mb-6">€{pkg.price}</div>

                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        {pkg.shows_per_day} прикажувања дневно
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        {pkg.duration} секунди времетраење
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Премиум локации
                                    </li>
                                </ul>

                                <button
                                    className={`w-full py-3 rounded-xl font-bold transition-colors ${selectedPackage === pkg.id ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-900'}`}
                                >
                                    {selectedPackage === pkg.id ? 'Избрано' : 'Избери'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* STEP 2: Business Form */}
                {step === 2 && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        <h2 className="text-2xl font-black text-gray-900 mb-6">Регистрирај го твојот бизнис</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Насловна Слика</label>
                                <div className="flex items-center gap-6">
                                    <div className={`
                                        w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50
                                        ${imagePreview ? 'border-none' : ''}
                                    `}>
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            id="cover-image"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                        <label
                                            htmlFor="cover-image"
                                            className="cursor-pointer bg-white border border-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-50 inline-flex items-center gap-2"
                                        >
                                            <Upload className="w-4 h-4" />
                                            {imageFile ? 'Смени Слика' : 'Прикачи Слика'}
                                        </label>
                                        <p className="text-xs text-gray-500 mt-2">Макс. 10MB. JPG, PNG.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Ads Upload */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Рекламни Материјали (Билборд)</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleAdsChange}
                                    />
                                    <div className="flex flex-col items-center">
                                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                        <p className="font-bold text-gray-700">Прикачи Реклами</p>
                                        <p className="text-xs text-gray-400 mt-1">Изберете повеќе слики за автоматска ротација</p>
                                    </div>
                                    {adPreviews.length > 0 && (
                                        <div className="flex gap-2 mt-4 overflow-x-auto justify-center">
                                            {adPreviews.map((src, idx) => (
                                                <img key={idx} src={src} className="w-16 h-16 object-cover rounded-lg border border-gray-200" alt="ad preview" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Име на Бизнис</label>
                                <input
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Пр. Ресторан Македонија"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Категории</label>
                                <div className="flex flex-wrap gap-2">
                                    {BUSINESS_CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => handleCategoryToggle(cat)}
                                            className={`
                                                px-4 py-2 rounded-lg text-sm font-medium transition-all
                                                ${formData.categories.includes(cat)
                                                    ? 'bg-indigo-600 text-white shadow-md'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                }
                                            `}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                {formData.categories.length === 0 && <p className="text-xs text-red-500 mt-1">Изберете барем една категорија</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Локација (Линк од Google Maps или Адреса)</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="Внесете адреса или Google Maps линк..."
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Email за Контакт</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="contact@business.com"
                                        value={formData.contact_email}
                                        onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Телефон</label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="+389 7X XXX XXX"
                                        value={formData.contact_phone}
                                        onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={formData.categories.length === 0 || !formData.name}
                                className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                            >
                                Потврди и Плати
                            </button>
                        </form>
                    </div>
                )}

                {/* Navigation Buttons for Step 1 */}
                {step === 1 && (
                    <div className="mt-8 flex justify-end">
                        <button
                            disabled={!selectedPackage}
                            onClick={() => setStep(2)}
                            className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Продолжи кон Детали &rarr;
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
