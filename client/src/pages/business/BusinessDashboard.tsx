import { API_BASE_URL, SERVER_URL } from '../../services/api';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { EditAdModal } from '../../components/business/EditAdModal';

interface Ad {
    id: number;
    title: string;
    client_name: string;
    type_carousel: boolean;
    type_billboard: boolean;
    type_sidebar: boolean;
    carousel_image_path?: string;
    sidebar_image_path?: string;
    billboard_image_path?: string;
}

export const BusinessDashboard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [ads, setAds] = useState<Ad[]>([]);
    const [businessName, setBusinessName] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingAd, setEditingAd] = useState<Ad | null>(null);

    // Fetch Business & Ads
    useEffect(() => {
        // Fetch Business Info check
        fetch(`${API_BASE_URL}/businesses/${id}`)
            .then(res => res.json())
            .then(data => setBusinessName(data.name))
            .catch(console.error);

        fetchAds();
    }, [id]);

    const fetchAds = () => {
        // In real app: fetch(`/api/businesses/${id}/ads`)
        // For demo: fetch all ads and filter by client_name == businessName OR business_id
        // Since we added business_id to ads table earlier, we SHOULD use it.
        // But let's check if the API returns all ads for now.
        fetch('${API_BASE_URL}/advertisements')
            .then(res => res.json())
            .then(data => {
                // Filter by business_id if available logic exists, or client_name match
                // We'll rely on client_name matching businessName for now or just filter by ID if we add it to the API response
                // Actually, let's filter by business_id if the ad has it!
                const myAds = data.filter((a: any) => String(a.business_id) === String(id));
                setAds(myAds);
            })
            .catch(console.error);
    };

    const handleDelete = async (adId: number) => {
        if (!confirm("Are you sure you want to delete this ad?")) return;
        try {
            await fetch(`${API_BASE_URL}/advertisements/${adId}`, { method: 'DELETE' });
            fetchAds(); // Refresh
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="text-xl font-bold text-indigo-600">
                    {businessName ? `${businessName} Portal` : 'Business Portal'}
                </div>
                <div className="flex gap-4">
                    <Link to="/street-preview" className="text-gray-500 hover:text-indigo-600 font-medium">View Simulator</Link>
                    <Link to="/business/login" className="text-gray-500 hover:text-red-600 font-medium">Logout</Link>
                </div>
            </nav>

            <main className="container mx-auto px-8 py-10">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold mb-2">My Campaigns</h1>
                        <p className="text-gray-500">Manage your active advertisements</p>
                    </div>
                    <button
                        onClick={() => { setEditingAd(null); setShowModal(true); }}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                    >
                        + Create New Ad
                    </button>
                </div>

                {ads.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
                        <div className="text-gray-400 mb-4 text-5xl">📢</div>
                        <h3 className="text-xl font-bold mb-2">No Active Ads</h3>
                        <p className="text-gray-500 mb-6">Start promoting your business today.</p>
                        <button onClick={() => { setEditingAd(null); setShowModal(true); }} className="text-indigo-600 font-bold hover:underline">Create your first ad</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ads.map(ad => (
                            <div key={ad.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                                <div className="h-48 bg-gray-100 relative">
                                    {/* Show one of the images */}
                                    <img
                                        src={`${SERVER_URL}${ad.billboard_image_path || ad.carousel_image_path || ad.sidebar_image_path}`}
                                        alt={ad.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        {ad.type_billboard && <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">Billboard</span>}
                                        {ad.type_carousel && <span className="bg-purple-600/90 text-white text-xs px-2 py-1 rounded">Web</span>}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-bold text-lg mb-1">{ad.title}</h3>
                                    <p className="text-xs text-gray-500 mb-4">Created: Today</p>
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => { setEditingAd(ad); setShowModal(true); }}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-bold text-sm transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ad.id)}
                                            className="px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold text-sm transition"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {showModal && (
                <EditAdModal
                    businessId={Number(id)}
                    businessName={businessName}
                    ad={editingAd}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); fetchAds(); }}
                />
            )}
        </div>
    );
};
