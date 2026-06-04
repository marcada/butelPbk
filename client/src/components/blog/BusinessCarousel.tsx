import { API_BASE_URL, SERVER_URL } from '../../services/api';
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Hardcoded data removed


export const BusinessCarousel: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const itemsPerPage = 4;

    useEffect(() => {
        fetch('${API_BASE_URL}/advertisements')
            .then(res => res.json())
            .then(data => {
                const validAds = data.filter((a: any) => a.type_carousel && a.carousel_image_path).map((a: any) => ({
                    id: a.id,
                    name: a.title,
                    category: a.client_name,
                    image: a.carousel_image_path.startsWith('http') ? a.carousel_image_path : `${SERVER_URL}${a.carousel_image_path}`
                }));
                // Duplicate items if not enough to fill carousel loop smoothly
                setBusinesses([...validAds, ...validAds]);
            })
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (businesses.length === 0) return;
        const timer = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(timer);
    }, [currentIndex, businesses]);

    const nextSlide = () => {
        if (businesses.length <= itemsPerPage) return;
        setCurrentIndex((prev) => (prev + 1) % (businesses.length - itemsPerPage + 1));
    };

    const prevSlide = () => {
        if (businesses.length <= itemsPerPage) return;
        setCurrentIndex((prev) => (prev - 1 < 0 ? 0 : prev - 1));
    };

    if (businesses.length === 0) return null;

    return (
        <div className="relative w-full h-56 overflow-hidden bg-white mb-8 group pl-2">
            {/* Controls moved outside or subtle? Keeping internal for now */}

            <div className="relative z-10 container mx-auto h-full flex items-center">
                <div className="flex-1 overflow-hidden">
                    <div
                        className="flex transition-transform duration-500 ease-out gap-6"
                        style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
                    >
                        {businesses.map((biz, idx) => (
                            <div key={`${biz.id}-${idx}`} className="min-w-[23.5%] h-48 relative rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all border border-gray-100 group/card bg-gray-900">
                                <img src={biz.image} alt={biz.name} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110 opacity-80 group-hover/card:opacity-100" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
                                    <h3 className="text-lg font-bold text-white mb-1 leading-tight">{biz.name}</h3>
                                    <p className="text-gray-300 text-xs font-medium uppercase tracking-wide">{biz.category}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-yellow-500 hover:text-black transition-all">
                <ChevronLeft size={24} />
            </button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-yellow-500 hover:text-black transition-all">
                <ChevronRight size={24} />
            </button>
        </div>
    );
};
