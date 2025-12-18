import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export const AdminLayout: React.FC = () => {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname.startsWith(path)
            ? 'bg-indigo-50 text-indigo-600'
            : 'text-gray-600 hover:bg-gray-50';
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex text-sm">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10">
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <span className="text-xl font-extrabold text-indigo-600 tracking-tight">CMS Admin</span>
                </div>
                <nav className="p-4 space-y-1">
                    <Link to="/admin" className={`flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${location.pathname === '/admin' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                        Dashboard
                    </Link>
                    <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Content</div>
                    <Link to="/admin/posts" className={`flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${isActive('/admin/posts')}`}>
                        Blog Posts
                    </Link>
                    <Link to="/admin/categories" className={`flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${isActive('/admin/categories')}`}>
                        Categories
                    </Link>
                    <Link to="/admin/events" className={`flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${isActive('/admin/events')}`}>
                        Events
                    </Link>

                    <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Tools</div>
                    <Link to="/admin/simulator" className={`flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${isActive('/admin/simulator')}`}>
                        Симулатор на Приходи
                    </Link>



                    <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Advertising</div>
                    <Link to="/admin/ads" className={`flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${isActive('/admin/ads')}`}>
                        Advertisements
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 p-8">
                <Outlet />
            </main>
        </div>
    );
};
