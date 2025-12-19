import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Package } from '../../types';
import { Plus, Trash2, Users, Wallet } from 'lucide-react';

interface Shareholder {
    id: number;
    name: string;
    percentage: number;
    isLocked?: boolean;
}

export const InvestorSimulator: React.FC = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [clientCounts, setClientCounts] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);

    // Operating Hours State
    const [startTime, setStartTime] = useState("07:00");
    const [endTime, setEndTime] = useState("00:00");

    // Expenses & Shareholders State
    const [expenses, setExpenses] = useState<number>(0);
    const [shareholders, setShareholders] = useState<Shareholder[]>([
        { id: 1, name: 'Самет', percentage: 50, isLocked: false },
        { id: 2, name: 'Радован', percentage: 50, isLocked: false }
    ]);

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

    const [showAddModal, setShowAddModal] = useState(false);
    const [newPartnerName, setNewPartnerName] = useState('');

    // Shareholder Actions & Logic
    const recalculatePercentages = (currentShareholders: Shareholder[]): Shareholder[] => {
        const lockedShareholders = currentShareholders.filter(s => s.isLocked);
        const unlockedShareholders = currentShareholders.filter(s => !s.isLocked);

        const lockedTotal = lockedShareholders.reduce((sum, s) => sum + s.percentage, 0);
        const remainingPercentage = Math.max(0, 100 - lockedTotal);

        if (unlockedShareholders.length === 0) return currentShareholders;

        const sharePerPerson = remainingPercentage / unlockedShareholders.length;

        return currentShareholders.map(s => {
            if (s.isLocked) return s;
            return { ...s, percentage: Number(sharePerPerson.toFixed(1)) };
        });
    };

    const addShareholder = (name: string) => {
        const newId = Math.max(0, ...shareholders.map(s => s.id)) + 1;
        const newShareholder = { id: newId, name: name || `Партнер ${newId}`, percentage: 0, isLocked: false };

        const newList = [...shareholders, newShareholder];
        setShareholders(recalculatePercentages(newList));
        setShowAddModal(false);
        setNewPartnerName('');
    };

    const removeShareholder = (id: number) => {
        const newList = shareholders.filter(s => s.id !== id);
        setShareholders(recalculatePercentages(newList));
    };

    const toggleLock = (id: number) => {
        setShareholders(shareholders.map(s => s.id === id ? { ...s, isLocked: !s.isLocked } : s));
    };

    const updateShareholderPercentage = (id: number, value: number) => {
        // Find the partner
        const partner = shareholders.find(s => s.id === id);
        if (!partner) return;

        // If locked, just update and don't redistribute others (or maybe warn?)
        // Better UX: Temporarily lock this one for the calculation, or assume manual override acts like a lock action

        // Strategy: Update this partner's %. Then redistribute REAMAINING among OTHER UNLOCKED partners.
        // If this partner was unlocked, we assume for this specific action it stays fixed at the new value.

        const newPercentage = Math.min(100, Math.max(0, value));

        let newList = shareholders.map(s => s.id === id ? { ...s, percentage: newPercentage } : s);

        // Now redistribute others who are NOT locked and NOT the current one being edited
        const fixedTotal = newList.filter(s => s.isLocked || s.id === id).reduce((sum, s) => sum + s.percentage, 0);
        const othersToDistribute = newList.filter(s => !s.isLocked && s.id !== id);

        if (othersToDistribute.length > 0) {
            const remaining = Math.max(0, 100 - fixedTotal);
            const perPerson = remaining / othersToDistribute.length;

            newList = newList.map(s => {
                if (s.isLocked || s.id === id) return s;
                return { ...s, percentage: Number(perPerson.toFixed(1)) };
            });
        }

        setShareholders(newList);
    };

    const updateShareholderName = (id: number, name: string) => {
        setShareholders(shareholders.map(s => s.id === id ? { ...s, name } : s));
    };

    // --- Calculations ---
    const getSecondsFromTime = (time: string) => {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return (hours || 0) * 3600 + (minutes || 0) * 60;
    };

    const startSeconds = getSecondsFromTime(startTime);
    let endSeconds = getSecondsFromTime(endTime);

    if (endSeconds <= startSeconds) {
        endSeconds += 24 * 3600;
    }

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

    // Net Profit Calculations
    const netProfitMonthly = totalMonthlyRevenue - expenses;
    const netProfitYearly = netProfitMonthly * 12;

    const shareholderDistribution = shareholders.map(s => ({
        ...s,
        amount: (netProfitMonthly * s.percentage) / 100
    }));

    // Charts Data
    const revenueData = breakdown.filter(b => b.monthlyRevenue > 0).map(b => ({
        name: b.name,
        value: b.monthlyRevenue,
        color: b.color
    }));

    const profitData = shareholderDistribution.filter(s => s.amount > 0).map((s, index) => ({
        name: s.name,
        value: s.amount,
        color: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][index % 5]
    }));

    if (loading) return <div className="p-8 text-center text-gray-500">Се вчитува симулаторот...</div>;

    if (packages.length === 0 && !loading) {
        return (
            <div className="p-8">
                <h2 className="text-xl font-bold mb-4">Не се пронајдени пакети</h2>
                <button onClick={async () => {
                    const defaults = [
                        { name: 'Основен', displays_per_showing: 50, duration: 20, shows_per_day: 20, price: 1500, color: '#94a3b8' },
                        { name: 'Стандард', displays_per_showing: 50, duration: 20, shows_per_day: 40, price: 2500, color: '#3b82f6' },
                        { name: 'Премиум', displays_per_showing: 50, duration: 20, shows_per_day: 80, price: 4500, color: '#8b5cf6' },
                    ];
                    for (const p of defaults) {
                        await fetch('http://localhost:8000/api/packages', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(p)
                        });
                    }
                    fetchPackages();
                }} className="bg-indigo-600 text-white px-4 py-2 rounded">Вчитај Стандардни Пакети</button>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Симулатор на Приходи</h1>
                    <p className="text-gray-500 mt-1">Алатка за финансиска проценка во реално време</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase">Работно Време:</span>
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
                            {(totalAvailableSeconds / 3600).toFixed(1)}ч
                        </span>
                    </div>

                    <div className="h-8 w-px bg-gray-300" />

                    <button onClick={() => setClientCounts({})} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">Ресетирај</button>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-8">
                {/* LEFT: Inputs (Packages & Clients) */}
                <div className="col-span-12 lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-bold text-gray-900">Конфигурација</h3>
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
                                            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Прикажувања/Ден</label>
                                            <input
                                                type="number"
                                                className="w-full text-sm font-medium border-gray-200 rounded-lg"
                                                value={pkg.shows_per_day}
                                                onChange={(e) => handlePackageUpdate(pkg, 'shows_per_day', Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Времетраење (сек)</label>
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
                                            <label className="text-sm font-bold text-gray-700">Активни Клиенти</label>
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
                            <div className="text-gray-400 text-sm font-medium mb-1">Вкупен Месечен Приход</div>
                            <div className="text-4xl font-black tracking-tight">€{totalMonthlyRevenue.toLocaleString()}</div>
                            <div className="text-indigo-400 text-sm mt-2 font-medium">€{totalYearlyRevenue.toLocaleString()} / година</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="text-gray-500 text-sm font-medium mb-1">Искористеност на Мрежата</div>
                            <div className={`text-4xl font-black tracking-tight ${capacityUsed > 100 ? 'text-red-500' : 'text-gray-900'}`}>
                                {capacityUsed.toFixed(1)}%
                            </div>
                            <div className="text-gray-400 text-sm mt-2 font-medium">
                                {totalDailySecondsUsed.toLocaleString()} / {totalAvailableSeconds.toLocaleString()} сек
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="text-gray-500 text-xs font-bold uppercase mb-4">Структура на Приходи</div>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
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
                            <div className="text-gray-500 text-xs font-bold uppercase mb-4">Приход по Дисплеј</div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">€{Math.round(revenuePerDisplayMonthly).toLocaleString()}</div>
                            <div className="text-xs text-gray-400">Месечен Просек по Екран</div>

                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <div className="text-3xl font-bold text-gray-900 mb-1">€{Math.round(revenuePerDisplayMonthly * 12).toLocaleString()}</div>
                                <div className="text-xs text-gray-400">Годишен Просек по Екран</div>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Пакет</th>
                                    <th className="px-6 py-3 font-semibold text-right">Клиенти</th>
                                    <th className="px-6 py-3 font-semibold text-right">Цена</th>
                                    <th className="px-6 py-3 font-semibold text-right">Месечен Приход</th>
                                    <th className="px-6 py-3 font-semibold text-right">% Удел</th>
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
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Нема достапни податоци</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* DIVIDER */}
                <div className="col-span-12 py-4">
                    <div className="w-full h-px bg-gray-200" />
                </div>

                {/* NEW SECTION: Profit & Distribution */}
                <div className="col-span-12 grid grid-cols-12 gap-8">
                    {/* Expenses & Shareholders Input */}
                    <div className="col-span-12 lg:col-span-6 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-bold text-gray-900">Расходи и Партнери</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Expenses Input */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Месечни Расходи (Вкупно)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                                        <input
                                            type="number"
                                            className="w-full pl-8 pr-4 py-2 border-gray-200 rounded-lg text-lg font-bold text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={expenses}
                                            onChange={(e) => setExpenses(Number(e.target.value))}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* Shareholders */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Партнери за Распределба
                                        </label>
                                        <button
                                            onClick={() => setShowAddModal(true)}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded transition-colors"
                                        >
                                            <Plus className="w-3 h-3" /> Додади
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {shareholders.map(s => (
                                            <div key={s.id} className="flex gap-2 items-center group">
                                                <input
                                                    className="flex-1 text-sm border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="Име"
                                                    value={s.name}
                                                    onChange={(e) => updateShareholderName(s.id, e.target.value)}
                                                />
                                                <div className="relative w-24">
                                                    <input
                                                        type="number"
                                                        className={`w-full pr-6 text-sm border-gray-200 rounded-lg text-right focus:ring-indigo-500 focus:border-indigo-500 ${s.isLocked ? 'bg-gray-50 text-gray-500' : ''}`}
                                                        placeholder="0"
                                                        value={s.percentage}
                                                        onChange={(e) => updateShareholderPercentage(s.id, Number(e.target.value))}
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                                                </div>

                                                <button
                                                    onClick={() => toggleLock(s.id)}
                                                    className={`p-2 rounded-lg transition-colors ${s.isLocked ? 'text-indigo-600 bg-indigo-50' : 'text-gray-300 hover:text-gray-500'}`}
                                                    title={s.isLocked ? "Отклучи процент" : "Заклучи процент"}
                                                >
                                                    {s.isLocked ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => removeShareholder(s.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Validation Message */}
                                        {Math.abs(shareholders.reduce((acc, curr) => acc + curr.percentage, 0) - 100) > 0.1 && (
                                            <div className="text-xs text-amber-600 font-medium bg-amber-50 px-3 py-2 rounded">
                                                Внимание: Вкупниот процент на распределба е {shareholders.reduce((acc, curr) => acc + curr.percentage, 0).toFixed(1)}% (треба да е 100%)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profit Visualization */}
                    <div className="col-span-12 lg:col-span-6 space-y-6">
                        {/* Net Profit Card */}
                        <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 text-white p-6 rounded-2xl shadow-xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-indigo-200 text-sm font-medium mb-1">Нето Месечен Профит</div>
                                    <div className="text-4xl font-black tracking-tight">€{netProfitMonthly.toLocaleString()}</div>
                                    <div className="text-indigo-300 text-xs mt-2 font-medium">После одбивање на расходи (€{expenses.toLocaleString()})</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-indigo-200 text-xs font-medium mb-1">Годишен Профит</div>
                                    <div className="text-xl font-bold">€{netProfitYearly.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Distribution Chart */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[300px]">
                            <div className="text-gray-500 text-xs font-bold uppercase mb-4">Распределба на Профит</div>
                            <div className="flex-1 flex gap-6">
                                <div className="w-1/2 h-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                                        <PieChart>
                                            <Pie
                                                data={profitData}
                                                innerRadius={40}
                                                outerRadius={70}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {profitData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number | undefined) => value ? `€${value.toLocaleString()}` : ''} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-1/2 flex flex-col justify-center space-y-3">
                                    {shareholderDistribution.map((s, index) => (
                                        <div key={s.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][index % 5] }} />
                                                <span className="font-medium text-gray-700">{s.name} ({s.percentage}%)</span>
                                            </div>
                                            <span className="font-bold text-gray-900">€{s.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 transform transition-all">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center">
                            <h2 className="text-2xl font-black mb-2">Нов Партнер</h2>
                            <p className="text-indigo-100 text-sm">Внесете го името на новиот партнер. Системот автоматски ќе ги ребалансира процентите согласно заклучените вредности.</p>
                        </div>
                        <div className="p-8">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Име и Презиме</label>
                            <input
                                autoFocus
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg mb-6"
                                placeholder="Внеси име на партнер"
                                value={newPartnerName}
                                onChange={(e) => setNewPartnerName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addShareholder(newPartnerName)}
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Откажи
                                </button>
                                <button
                                    onClick={() => addShareholder(newPartnerName)}
                                    className="flex-1 py-3 font-bold bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all"
                                >
                                    Додади Партнер
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
