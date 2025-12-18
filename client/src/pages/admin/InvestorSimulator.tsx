import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Package } from '../../types';

export const InvestorSimulator: React.FC = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [clientCounts, setClientCounts] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);

    // Operating Hours State
    const [startTime, setStartTime] = useState("07:00");
    const [endTime, setEndTime] = useState("00:00");

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/packages');
            const data: Package[] = await res.json();
            setPackages(data);

            const initialCounts: Record<number, number> = {};
            data.forEach(pkg => {
                initialCounts[pkg.id] = 0;
            });
            setClientCounts(prev => ({ ...initialCounts, ...prev }));
            setLoading(false);

        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleClientChange = (id: number, count: number) => {
        setClientCounts(prev => ({ ...prev, [id]: count }));
    };

    const handlePackageUpdate = async (pkg: Package, field: keyof Package, value: string | number) => {
        const updatedPackages = packages.map(p => p.id === pkg.id ? { ...p, [field]: value } : p);
        setPackages(updatedPackages);

        try {
            await fetch(`http://localhost:8000/api/packages/${pkg.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });
        } catch (err) {
            console.error("Failed to update package", err);
        }
    };

    // --- Calculations ---

    const getSecondsFromTime = (time: string) => {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return (hours || 0) * 3600 + (minutes || 0) * 60;
    };

    // Calculate total available seconds in the configuration window
    const startSeconds = getSecondsFromTime(startTime);
    let endSeconds = getSecondsFromTime(endTime);

    // Handle midnight crossing or full day logic
    if (endSeconds <= startSeconds) {
        endSeconds += 24 * 3600;
    }

    // Explicitly define totalAvailableSeconds before usage
    const totalAvailableSeconds = endSeconds - startSeconds;

    let totalDailySecondsUsed = 0;
    let totalMonthlyRevenue = 0;

    const breakdown = packages.map(pkg => {
        const count = clientCounts[pkg.id] || 0;
        const dailySecondsPerClient = pkg.shows_per_day * pkg.duration;
        const totalDailySeconds = dailySecondsPerClient * count;

        const monthlyRevenue = pkg.price * count;

        totalDailySecondsUsed += totalDailySeconds;
        totalMonthlyRevenue += monthlyRevenue;

        return {
            ...pkg,
            count,
            dailySecondsPerClient,
            totalDailySeconds,
            monthlyRevenue
        };
    });

    const capacityUsed = totalAvailableSeconds > 0 ? (totalDailySecondsUsed / totalAvailableSeconds) * 100 : 0;
    const totalYearlyRevenue = totalMonthlyRevenue * 12;
    const revenuePerDisplayMonthly = totalMonthlyRevenue / 50;

    // Charts Data
    const revenueData = breakdown.filter(b => b.monthlyRevenue > 0).map(b => ({
        name: b.name,
        value: b.monthlyRevenue,
        color: b.color
    }));

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Simulator...</div>;

    if (packages.length === 0 && !loading) {
        return (
            <div className="p-8">
                <h2 className="text-xl font-bold mb-4">No Packages Found</h2>
                <button onClick={async () => {
                    const defaults = [
                        { name: 'Basic', displays_per_showing: 50, duration: 20, shows_per_day: 20, price: 1500, color: '#94a3b8' },
                        { name: 'Standard', displays_per_showing: 50, duration: 20, shows_per_day: 40, price: 2500, color: '#3b82f6' },
                        { name: 'Premium', displays_per_showing: 50, duration: 20, shows_per_day: 80, price: 4500, color: '#8b5cf6' },
                    ];
                    for (const p of defaults) {
                        await fetch('http://localhost:8000/api/packages', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(p)
                        });
                    }
                    fetchPackages();
                }} className="bg-indigo-600 text-white px-4 py-2 rounded">Seed Default Packages</button>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Revenue Simulator</h1>
                    <p className="text-gray-500 mt-1">Real-time financial estimation tool</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase">Operating Hours:</span>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 w-24 text-center"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 w-24 text-center"
                        />
                        <span className="text-xs font-medium text-gray-400 ml-2 bg-gray-100 px-2 py-1 rounded">
                            {(totalAvailableSeconds / 3600).toFixed(1)}h
                        </span>
                    </div>

                    <div className="h-8 w-px bg-gray-300" />

                    <button onClick={() => setClientCounts({})} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">Reset</button>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-8">
                {/* LEFT: Inputs (Packages & Clients) */}
                <div className="col-span-12 lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-bold text-gray-900">Configuration</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {packages.map(pkg => (
                                <div key={pkg.id} className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pkg.color }} />
                                            <input
                                                className="font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 w-32"
                                                value={pkg.name}
                                                onChange={(e) => handlePackageUpdate(pkg, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-400">€</span>
                                            <input
                                                type="number"
                                                className="font-bold text-indigo-600 bg-indigo-50 rounded px-2 py-1 w-20 text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={pkg.price}
                                                onChange={(e) => handlePackageUpdate(pkg, 'price', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Shows/Day</label>
                                            <input
                                                type="number"
                                                className="w-full text-sm font-medium border-gray-200 rounded-lg"
                                                value={pkg.shows_per_day}
                                                onChange={(e) => handlePackageUpdate(pkg, 'shows_per_day', Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Duration (s)</label>
                                            <input
                                                type="number"
                                                className="w-full text-sm font-medium border-gray-200 rounded-lg text-gray-400 bg-gray-50"
                                                value={pkg.duration}
                                                readOnly
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-bold text-gray-700">Active Clients</label>
                                            <span className="text-2xl font-black text-gray-900">{clientCounts[pkg.id] || 0}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="50"
                                            step="1"
                                            value={clientCounts[pkg.id] || 0}
                                            onChange={(e) => handleClientChange(pkg.id, Number(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Results & Visualization */}
                <div className="col-span-12 lg:col-span-7 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl">
                            <div className="text-gray-400 text-sm font-medium mb-1">Total Monthly Revenue</div>
                            <div className="text-4xl font-black tracking-tight">€{totalMonthlyRevenue.toLocaleString()}</div>
                            <div className="text-indigo-400 text-sm mt-2 font-medium">€{totalYearlyRevenue.toLocaleString()} / year</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="text-gray-500 text-sm font-medium mb-1">Network Capacity Used</div>
                            <div className={`text-4xl font-black tracking-tight ${capacityUsed > 100 ? 'text-red-500' : 'text-gray-900'}`}>
                                {capacityUsed.toFixed(1)}%
                            </div>
                            <div className="text-gray-400 text-sm mt-2 font-medium">
                                {totalDailySecondsUsed.toLocaleString()} / {totalAvailableSeconds.toLocaleString()} sec
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="text-gray-500 text-xs font-bold uppercase mb-4">Revenue Mix</div>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={revenueData}
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {revenueData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number | undefined) => value ? `€${value.toLocaleString()}` : ''} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="text-gray-500 text-xs font-bold uppercase mb-4">Revenue Per Display</div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">€{Math.round(revenuePerDisplayMonthly).toLocaleString()}</div>
                            <div className="text-xs text-gray-400">Monthly Avg per Screen</div>

                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <div className="text-3xl font-bold text-gray-900 mb-1">€{Math.round(revenuePerDisplayMonthly * 12).toLocaleString()}</div>
                                <div className="text-xs text-gray-400">Yearly Avg per Screen</div>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Package</th>
                                    <th className="px-6 py-3 font-semibold text-right">Clients</th>
                                    <th className="px-6 py-3 font-semibold text-right">Price</th>
                                    <th className="px-6 py-3 font-semibold text-right">Monthly Rev</th>
                                    <th className="px-6 py-3 font-semibold text-right">% Share</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {breakdown.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">{item.count}</td>
                                        <td className="px-6 py-4 text-right text-gray-500">€{item.price.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">€{item.monthlyRevenue.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-gray-400">
                                            {totalMonthlyRevenue > 0 ? ((item.monthlyRevenue / totalMonthlyRevenue) * 100).toFixed(1) : 0}%
                                        </td>
                                    </tr>
                                ))}
                                {breakdown.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No data available</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
