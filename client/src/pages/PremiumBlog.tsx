import React, { useState, useEffect } from 'react';
import { BusinessCarousel } from '../components/blog/BusinessCarousel';
import { EventsSidebar } from '../components/blog/EventsSidebar';
import type { Post } from '../types';

export const PremiumBlog: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:8000/api/posts')
            .then(res => res.json())
            .then(data => {
                setPosts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load posts", err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Top Navigation Placeholder */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        CITY PULSE
                    </div>
                    <div className="flex gap-6 text-sm font-semibold text-gray-600">
                        <a href="#" className="hover:text-indigo-600 transition-colors">News</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Business</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Culture</a>
                        <a href="/street-preview" className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors">
                            Live Street View
                        </a>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-8">
                {/* Top Banner (Ads/Partner Carousel) */}
                <BusinessCarousel />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-16 items-start">
                    {/* Left Sidebar: Events - Sticky */}
                    <div className="lg:col-span-3 sticky top-24">
                        <EventsSidebar />
                    </div>

                    {/* Center: Blog Content (6 cols) */}
                    <div className="lg:col-span-6 space-y-12">
                        {loading ? (
                            <div className="text-center py-10 text-gray-500">Loading articles...</div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">No articles found.</div>
                        ) : (
                            posts.map(post => (
                                <article key={post.id} className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                                    <div className="relative overflow-hidden">
                                        <img
                                            src={`http://localhost:8000/storage/${post.image_path}`}
                                            alt={post.title}
                                            className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        {post.category && (
                                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-indigo-600 uppercase tracking-widest shadow-sm">
                                                {post.category.name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-8">
                                        <h1 className="text-3xl font-extrabold text-gray-900 mt-2 mb-4 leading-tight group-hover:text-indigo-600 transition-colors">
                                            {post.title}
                                        </h1>
                                        <p className="text-gray-600 leading-relaxed text-lg mb-6 line-clamp-3">
                                            {post.content}
                                        </p>
                                        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                                    ?
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    <p className="font-bold text-gray-900 text-sm">Author</p>
                                                    <p>{new Date(post.created_at).toLocaleDateString()} • 5 min read</p>
                                                </div>
                                            </div>
                                            <button className="text-indigo-600 font-bold text-sm hover:text-indigo-800 flex items-center gap-1 transition-colors">
                                                Read Article →
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>

                    {/* Right Sidebar: Ads (3 cols) - Sticky */}
                    <div className="lg:col-span-3 space-y-8 sticky top-24">
                        <AdSpace />
                        <NewsletterBox />
                        {/* End Right Sidebar */}
                    </div>
                </div>
            </main>
        </div>
    );
};

const AdSpace: React.FC = () => {
    const [ad, setAd] = useState<any>(null);

    useEffect(() => {
        fetch('http://localhost:8000/api/advertisements')
            .then(res => res.json())
            .then(data => {
                // Get a random sidebar ad
                const validAds = data.filter((a: any) => a.type_sidebar && a.sidebar_image_path);
                if (validAds.length > 0) {
                    setAd(validAds[Math.floor(Math.random() * validAds.length)]);
                }
            })
            .catch(err => console.error("Failed to load ad", err));
    }, []);

    if (!ad) return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden h-96 flex items-center justify-center text-gray-400">
            <span>Ad Space Available</span>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-gray-100 px-3 py-1 rounded-bl-xl text-[10px] font-bold text-gray-400 tracking-wider z-10">ADVERTISEMENT</div>
            <div className="w-full mt-4 rounded-2xl overflow-hidden relative shadow-inner aspect-[9/10]">
                <img
                    src={ad.sidebar_image_path.startsWith('http') ? ad.sidebar_image_path : `http://localhost:8000${ad.sidebar_image_path}`}
                    alt={ad.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="font-bold text-lg leading-tight">{ad.title}</h3>
                    <p className="text-xs opacity-80">{ad.client_name}</p>
                </div>
            </div>
        </div>
    );
};

const NewsletterBox: React.FC = () => {
    return (
        <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-20 -translate-y-1/2 translate-x-1/2" />
            <h4 className="text-xl font-bold mb-3 relative z-10">Stay Connected</h4>
            <p className="text-gray-400 text-sm mb-6 relative z-10 leading-relaxed">Join 15,000+ subscribers for the latest city news and exclusive offers.</p>
            <div className="space-y-3 relative z-10">
                <input type="email" placeholder="email@example.com" className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-gray-500 transition-all" />
                <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-900/50">
                    Subscribe Now
                </button>
            </div>
        </div>
    );
};
