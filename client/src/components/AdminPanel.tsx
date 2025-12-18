import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { Ad } from '../types';

interface TimeZone {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    multiplier: string;
}

// Add Campaign Interface first (inside existing types or here)
interface Campaign {
    id: number;
    ad: Ad;
    time_zones: TimeZone[];
    start_date: string;
    end_date: string;
    appearances_total: number;
}

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [ads, setAds] = useState<Ad[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [timeZones, setTimeZones] = useState<TimeZone[]>([]);
    const [activeTab, setActiveTab] = useState<'createAd' | 'createCampaign' | 'list'>('list');

    // Forms
    const [adName, setAdName] = useState('');
    const [adType, setAdType] = useState<'image' | 'text'>('image');
    const [adContent, setAdContent] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Campaign Form
    const [selectedAdId, setSelectedAdId] = useState<number>(0);
    const [appearances, setAppearances] = useState(100);
    const [selectedZones, setSelectedZones] = useState<number[]>([]);

    useEffect(() => {
        fetchData();
        fetchCampaigns();
    }, []);

    const fetchData = async () => {
        try {
            const [adsRes, tzRes] = await Promise.all([
                axios.get('http://127.0.0.1:8000/api/admin/ads'),
                axios.get('http://127.0.0.1:8000/api/admin/time-zones')
            ]);
            setAds(adsRes.data);
            setTimeZones(tzRes.data);
        } catch (e) { console.error(e); }
    };

    const fetchCampaigns = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/admin/campaigns');
            setCampaigns(res.data);
        } catch (e) { console.error(e); }
    };

    const handleCreateAd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', adName);
            formData.append('type', adType);
            formData.append('duration', '10');

            if (adType === 'text') {
                formData.append('content_path', adContent);
            } else if (selectedFile) {
                formData.append('image', selectedFile);
            } else {
                formData.append('content_path', adContent);
            }

            await axios.post('http://127.0.0.1:8000/api/admin/ads', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert("Ad Created!");
            fetchData();
            setAdName(''); setAdContent(''); setSelectedFile(null);
        } catch (e) {
            alert("Error creating Ad");
        }
    };

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedAdId) { alert("Please select an Ad first."); return; }
        if (selectedZones.length === 0) { alert("Please select at least one Time Zone."); return; }

        try {
            await axios.post('http://127.0.0.1:8000/api/admin/campaigns', {
                ad_id: selectedAdId,
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0],
                appearances_total: appearances,
                time_zone_ids: selectedZones
            });
            alert("Campaign Created Successfully!");
            fetchCampaigns(); // Refresh list
            setActiveTab('list'); // Switch to list view
        } catch (e: any) {
            alert("Error creating Campaign: " + (e.response?.data?.message || "Unknown Error"));
        }
    };

    return (
        <div className="fixed top-0 right-0 bottom-0 w-[500px] bg-gray-900/95 text-white shadow-2xl border-l border-gray-700 flex flex-col z-50 transform transition-transform">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                <h2 className="text-2xl font-bold text-neon-blue">Admin Panel</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="p-4 bg-gray-800 flex justify-around">
                <button onClick={() => setActiveTab('list')} className={`pb-2 border-b-2 ${activeTab === 'list' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400'}`}>Campaigns</button>
                <button onClick={() => setActiveTab('createAd')} className={`pb-2 border-b-2 ${activeTab === 'createAd' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400'}`}>New Ad</button>
                <button onClick={() => setActiveTab('createCampaign')} className={`pb-2 border-b-2 ${activeTab === 'createCampaign' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400'}`}>Schedule</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'list' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg mb-4">Active Campaigns</h3>
                        {campaigns.length === 0 && <p className="text-gray-500">No campaigns yet.</p>}
                        {campaigns.map(c => (
                            <div key={c.id} className="bg-gray-800 p-4 rounded border border-gray-700">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-blue-400">{c.ad?.name}</span>
                                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">{c.start_date}</span>
                                </div>
                                <div className="text-sm text-gray-400 mb-2">
                                    Zones: {c.time_zones?.map(tz => tz.name).join(', ')}
                                </div>
                                {c.ad?.type === 'image' && (
                                    <img src={c.ad.content_path} alt="preview" className="h-16 rounded object-cover border border-gray-600" />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'createAd' && (
                    <form onSubmit={handleCreateAd} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400">Ad Name</label>
                            <input value={adName} onChange={e => setAdName(e.target.value)} className="w-full bg-black/30 border border-gray-600 p-2 rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400">Type</label>
                            <select value={adType} onChange={e => setAdType(e.target.value as any)} className="w-full bg-black/30 border border-gray-600 p-2 rounded">
                                <option value="image">Image</option>
                                <option value="text">Text</option>
                            </select>
                        </div>

                        {adType === 'image' && (
                            <div className="bg-black/20 p-4 rounded border border-gray-600">
                                <label className="block text-sm text-gray-400 mb-2">Upload Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                    className="w-full text-sm text-gray-400"
                                />
                                <div className="text-center my-2 text-xs text-gray-500">OR URL</div>
                                <input
                                    value={adContent}
                                    onChange={e => setAdContent(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-black/30 border border-gray-600 p-2 rounded"
                                />
                            </div>
                        )}

                        {adType === 'text' && (
                            <div>
                                <label className="block text-sm text-gray-400">Text Content</label>
                                <textarea value={adContent} onChange={e => setAdContent(e.target.value)} className="w-full bg-black/30 border border-gray-600 p-2 rounded h-24" required />
                            </div>
                        )}
                        <button type="submit" className="w-full bg-green-600 py-2 rounded font-bold hover:bg-green-700">Create Ad</button>
                    </form>
                )}

                {activeTab === 'createCampaign' && (
                    <form onSubmit={handleCreateCampaign} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400">Select Ad</label>
                            <select onChange={e => setSelectedAdId(Number(e.target.value))} className="w-full bg-black/30 border border-gray-600 p-2 rounded">
                                <option value="">Select Ad...</option>
                                {ads.map(ad => <option key={ad.id} value={ad.id}>{ad.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400">Total Appearances</label>
                            <input type="number" value={appearances} onChange={e => setAppearances(Number(e.target.value))} className="w-full bg-black/30 border border-gray-600 p-2 rounded" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Target Time Zones</label>
                            <div className="space-y-2 bg-black/20 p-4 rounded">
                                {timeZones.map(tz => (
                                    <label key={tz.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={selectedZones.includes(tz.id)}
                                            onChange={e => {
                                                if (e.target.checked) setSelectedZones([...selectedZones, tz.id]);
                                                else setSelectedZones(selectedZones.filter(id => id !== tz.id));
                                            }}
                                            className="accent-blue-500"
                                        />
                                        <span>{tz.name} <span className="text-xs text-gray-500">({tz.start_time}-{tz.end_time})</span></span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-purple-600 py-2 rounded font-bold hover:bg-purple-700">Launch Campaign</button>
                    </form>
                )}
            </div>
        </div>
    );
};
