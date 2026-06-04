import { API_BASE_URL, SERVER_URL } from '../../services/api';
import React, { useState, useEffect } from 'react';

interface Props {
    businessId: number;
    businessName: string;
    ad: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const EditAdModal: React.FC<Props> = ({ businessId, businessName, ad, onClose, onSuccess }) => {
    const isEditing = !!ad;
    const [title, setTitle] = useState('');
    const [types, setTypes] = useState({
        billboard: true,
        carousel: true,
        sidebar: false
    });
    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        billboard: null,
        carousel: null,
        sidebar: null
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (ad) {
            setTitle(ad.title);
            setTypes({
                billboard: !!ad.type_billboard,
                carousel: !!ad.type_carousel,
                sidebar: !!ad.type_sidebar
            });
        }
    }, [ad]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('client_name', businessName); // Ensure consistency
        formData.append('title', title);
        formData.append('business_id', String(businessId));

        formData.append('type_billboard', types.billboard ? '1' : '0');
        formData.append('type_carousel', types.carousel ? '1' : '0');
        formData.append('type_sidebar', types.sidebar ? '1' : '0');

        if (files.billboard) formData.append('billboard_image', files.billboard);
        if (files.carousel) formData.append('carousel_image', files.carousel);
        if (files.sidebar) formData.append('sidebar_image', files.sidebar);

        // For updates, we use POST with _method=PUT to handle multipart/form-data correctly in Laravel?
        // Actually, standard Laravel resource might struggle with PUT + File. 
        // Best practice: POST to /update/{id} or POST with _method field.

        const url = isEditing
            ? `${API_BASE_URL}/advertisements/${ad.id}?_method=PUT`
            : `${API_BASE_URL}/advertisements`;

        try {
            const res = await fetch(url, {
                method: 'POST', // Always POST for file uploads
                body: formData
            });

            if (res.ok) {
                onSuccess();
            } else {
                alert("Failed to save ad");
                console.error(await res.text());
            }
        } catch (err) {
            console.error(err);
            alert("Error saving ad");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Campaign' : 'Create New Campaign'}</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Campaign Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g., Summer Special"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700">Placements & Images</label>

                        {/* Billboard */}
                        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                            <div className="flex items-center gap-3 mb-3">
                                <input
                                    type="checkbox"
                                    checked={types.billboard}
                                    onChange={e => setTypes({ ...types, billboard: e.target.checked })}
                                    className="w-5 h-5 rounded text-indigo-600"
                                />
                                <span className="font-bold">Digital Billboard (Vertical)</span>
                            </div>
                            {types.billboard && (
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setFiles({ ...files, billboard: e.target.files?.[0] || null })}
                                        className="text-sm text-gray-500 w-full"
                                        // Required only if creating fresh
                                        required={!isEditing}
                                    />
                                    {isEditing && ad.billboard_image_path && (
                                        <p className="text-xs text-gray-400 mt-1">Current: {ad.billboard_image_path.split('/').pop()}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Carousel */}
                        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                            <div className="flex items-center gap-3 mb-3">
                                <input
                                    type="checkbox"
                                    checked={types.carousel}
                                    onChange={e => setTypes({ ...types, carousel: e.target.checked })}
                                    className="w-5 h-5 rounded text-indigo-600"
                                />
                                <span className="font-bold">Web Carousel (Horizontal)</span>
                            </div>
                            {types.carousel && (
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setFiles({ ...files, carousel: e.target.files?.[0] || null })}
                                        className="text-sm text-gray-500 w-full"
                                        required={!isEditing}
                                    />
                                    {isEditing && ad.carousel_image_path && (
                                        <p className="text-xs text-gray-400 mt-1">Current: {ad.carousel_image_path.split('/').pop()}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-lg disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Campaign'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
