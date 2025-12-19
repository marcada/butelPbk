import React, { useEffect, useState } from 'react';
import type { Post, Category } from '../../types';

export const AdminPosts: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category_id: '',
        image: null as File | null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchPosts = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/posts');
            const data = await response.json();
            setPosts(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/categories');
            const data = await response.json();
            setCategories(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchCategories();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, image: e.target.files[0] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.image) {
            setError('Image is required');
            setLoading(false);
            return;
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('content', formData.content);
        data.append('category_id', formData.category_id);
        data.append('image', formData.image);

        try {
            const response = await fetch('http://localhost:8000/api/posts', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    // Do NOT set Content-Type, browser sets it for FormData
                },
                body: data,
            });

            if (!response.ok) throw new Error('Failed to create post');

            await fetchPosts();
            setFormData({ title: '', content: '', category_id: '', image: null });
            // Reset file input
            const fileInput = document.getElementById('post-image') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (err) {
            setError('Error creating post');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await fetch(`http://localhost:8000/api/posts/${id}`, { method: 'DELETE' });
            fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Blog Posts</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Post</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                            <input
                                id="post-image"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-indigo-50 file:text-indigo-700
                                    hover:file:bg-indigo-100"
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Post'}
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Image</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Title</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {posts.map((post) => (
                                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <img
                                            src={`http://localhost:8000/storage/${post.image_path}`}
                                            alt={post.title}
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{post.title}</td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                                            {post.category?.name || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {posts.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                        No posts found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
