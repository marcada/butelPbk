import React, { useEffect, useState } from 'react';

interface Advertisement {
    id: number;
    client_name: string;
    title: string;
    type_carousel: boolean;
    type_sidebar: boolean;
    type_billboard: boolean;
    carousel_image_path?: string;
    sidebar_image_path?: string;
    billboard_image_path?: string;
}

export const AdminAds: React.FC = () => {
    const [ads, setAds] = useState<Advertisement[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [clientName, setClientName] = useState('');
    const [title, setTitle] = useState('');

    // Type Flags
    const [typeCarousel, setTypeCarousel] = useState(false);
    const [typeSidebar, setTypeSidebar] = useState(false);
    const [typeBillboard, setTypeBillboard] = useState(false);

    // Images
    const [carouselImage, setCarouselImage] = useState<File | null>(null);
    const [sidebarImage, setSidebarImage] = useState<File | null>(null);
    const [billboardImage, setBillboardImage] = useState<File | null>(null);

    const fetchAds = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/advertisements');
            const data = await res.json();
            setAds(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchAds();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('client_name', clientName);
        formData.append('title', title);

        formData.append('type_carousel', typeCarousel ? '1' : '0');
        formData.append('type_sidebar', typeSidebar ? '1' : '0');
        formData.append('type_billboard', typeBillboard ? '1' : '0');

        if (typeCarousel && carouselImage) formData.append('carousel_image', carouselImage);
        if (typeSidebar && sidebarImage) formData.append('sidebar_image', sidebarImage);
        if (typeBillboard && billboardImage) formData.append('billboard_image', billboardImage);

        try {
            const res = await fetch('http://localhost:8000/api/advertisements', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) {
                const err = await res.json();
                console.error(err);
                throw new Error('Failed');
            }

            await fetchAds();
            setShowForm(false);
            // Reset form
            setClientName('');
            setTitle('');
            setTypeCarousel(false);
            setTypeSidebar(false);
            setTypeBillboard(false);
            setCarouselImage(null);
            setSidebarImage(null);
            setBillboardImage(null);
        } catch (err) {
            alert('Error creating ad. Ensure images are selected for checked types.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await fetch(`http://localhost:8000/api/advertisements/${id}`, { method: 'DELETE' });
            fetchAds();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Advertisements</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    {showForm ? 'Cancel' : 'New Advertisement'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-2xl">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Campaign</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                                <input required type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title</label>
                                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>

                        {/* Placements Selection */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-900">Select Placements</label>

                            {/* Carousel Option */}
                            <div className="border border-gray-200 rounded-xl p-4 transition-colors hover:border-indigo-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={typeCarousel} onChange={e => setTypeCarousel(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                                    <span className="font-medium text-gray-900">Website Carousel</span>
                                </label>
                                {typeCarousel && (
                                    <div className="mt-3 pl-8">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Carousel Image (16:9)</label>
                                        <input required type="file" accept="image/*" onChange={e => setCarouselImage(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Option */}
                            <div className="border border-gray-200 rounded-xl p-4 transition-colors hover:border-indigo-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={typeSidebar} onChange={e => setTypeSidebar(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                                    <span className="font-medium text-gray-900">Website Sidebar Banner</span>
                                </label>
                                {typeSidebar && (
                                    <div className="mt-3 pl-8">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Sidebar Image (Square/Vertical)</label>
                                        <input required type="file" accept="image/*" onChange={e => setSidebarImage(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                                    </div>
                                )}
                            </div>

                            {/* Billboard Option */}
                            <div className="border border-gray-200 rounded-xl p-4 transition-colors hover:border-indigo-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={typeBillboard} onChange={e => setTypeBillboard(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                                    <span className="font-medium text-gray-900">Digital Billboard (Street)</span>
                                </label>
                                {typeBillboard && (
                                    <div className="mt-3 pl-8">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Billboard Image (9:16)</label>
                                        <input required type="file" accept="image/*" onChange={e => setBillboardImage(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <button disabled={loading} type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                            {loading ? 'Creating Campaign...' : 'Launch Campaign'}
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ads.map(ad => (
                    <div key={ad.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="p-4 border-b border-gray-50 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-gray-900">{ad.title}</h3>
                                <p className="text-gray-500 text-xs mt-1">{ad.client_name}</p>
                            </div>
                            <button onClick={() => handleDelete(ad.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">Delete</button>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${ad.type_carousel ? 'bg-green-500' : 'bg-gray-200'}`} />
                                <span className={`text-sm ${ad.type_carousel ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>Carousel</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${ad.type_sidebar ? 'bg-green-500' : 'bg-gray-200'}`} />
                                <span className={`text-sm ${ad.type_sidebar ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>Sidebar</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${ad.type_billboard ? 'bg-green-500' : 'bg-gray-200'}`} />
                                <span className={`text-sm ${ad.type_billboard ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>Billboard</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
