import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { Scene } from '../components/Scene';
import { TimeControls } from '../components/TimeControls';
import { api } from '../services/api';
import { 
    TrendingUp, Wallet, Users, BarChart2, Lock, Unlock 
} from 'lucide-react';
import type { Package } from '../types';

interface Shareholder {
    id: number;
    name: string;
    percentage: number;
    locked: boolean;
}

export const LandingPage: React.FC = () => {
    // Simulation store connection
    const { currentTime, activeAd } = useSimulationStore();

    // 1. Calculator states
    const [packages, setPackages] = useState<Package[]>([]);
    const [clientCounts, setClientCounts] = useState<Record<number, number>>({});
    const [expenses, setExpenses] = useState<number>(3000); // Default expenses
    const [workingHours, setWorkingHours] = useState<number>(24); // Default 24 hours
    const [occupancy, setOccupancy] = useState<number>(100); // Default 100% occupancy
    const [shareholders, setShareholders] = useState<Shareholder[]>([
        { id: 1, name: 'MARCADA', percentage: 60, locked: false },
        { id: 2, name: 'Investitor', percentage: 20, locked: false },
        { id: 3, name: 'OGj', percentage: 20, locked: false }
    ]);
    const [calcLoading, setCalcLoading] = useState(true);

    // Fetch packages and initialize displays for simulation
    useEffect(() => {
        // Reset simulation parameters to defaults on mount/refresh
        const store = useSimulationStore.getState();
        store.setTime(new Date(new Date().setHours(7, 30, 0, 0))); // Reset back to 07:30:00
        store.setSpeed(3); // Run at 3x speed by default
        if (!store.isPlaying) {
            store.togglePlay(); // Ensure it starts playing automatically
        }

        // Fetch displays to initialize billboard simulation
        api.init()
            .then(data => {
                // Access setFiles directly from state or use store function
                useSimulationStore.getState().setFiles(data.displays);
            })
            .catch(err => {
                console.error("Failed to fetch displays", err);
            });

        fetch('http://localhost:8000/api/packages')
            .then(res => res.json())
            .then((data: Package[]) => {
                setPackages(data);
                const initialCounts: Record<number, number> = {};
                data.forEach(pkg => {
                    initialCounts[pkg.id] = pkg.name === 'Basic' ? 8 : pkg.name === 'Pro' ? 5 : 2; // Default counts for demo
                });
                setClientCounts(initialCounts);
                setCalcLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch packages", err);
                setCalcLoading(false);
            });
    }, []);

    // Calculator calculations
    const baseMonthlyRevenue = packages.reduce((sum, pkg) => {
        const count = clientCounts[pkg.id] || 0;
        return sum + (pkg.price * count);
    }, 0);

    // Apply network occupancy and working hours multipliers
    const totalMonthlyRevenue = baseMonthlyRevenue * (occupancy / 100) * (workingHours / 24);

    const totalYearlyRevenue = totalMonthlyRevenue * 12;
    const netProfitMonthly = Math.max(0, totalMonthlyRevenue - expenses);
    const netProfitYearly = netProfitMonthly * 12;

    const handleClientChange = (pkgId: number, value: number) => {
        setClientCounts(prev => ({ ...prev, [pkgId]: value }));
    };

    const handleShareholderPctChange = (id: number, value: number) => {
        setShareholders(prev => {
            // Find target partner
            const targetIdx = prev.findIndex(s => s.id === id);
            if (targetIdx === -1 || prev[targetIdx].locked) return prev;

            // Unlocked other partners
            const otherUnlocked = prev.filter(s => s.id !== id && !s.locked);
            
            // Total percentage of locked partners
            const lockedSum = prev.filter(s => s.locked).reduce((sum, s) => sum + s.percentage, 0);
            
            // Clamp target percentage so it doesn't exceed the capacity left by locked partners
            const maxAllowed = 100 - lockedSum;
            const targetPct = Math.min(maxAllowed, Math.max(0, value));

            // If there are no other unlocked partners, we can't distribute the difference, so we ignore
            if (otherUnlocked.length === 0) {
                return prev;
            }

            // Distribute remaining sum among other unlocked partners
            const remainingToDistribute = 100 - targetPct - lockedSum;

            let updated = prev.map(s => {
                if (s.id === id) {
                    return { ...s, percentage: targetPct };
                }
                return s;
            });

            if (otherUnlocked.length === 1) {
                // Single unlocked partner takes all of remaining
                const singleId = otherUnlocked[0].id;
                updated = updated.map(s => s.id === singleId ? { ...s, percentage: remainingToDistribute } : s);
            } else if (otherUnlocked.length === 2) {
                // Two unlocked partners, distribute proportionally to their old percentages
                const other1 = otherUnlocked[0];
                const other2 = otherUnlocked[1];
                const totalOld = other1.percentage + other2.percentage;

                if (totalOld === 0) {
                    // Split equally if both were 0
                    const splitVal = remainingToDistribute / 2;
                    updated = updated.map(s => {
                        if (s.id === other1.id || s.id === other2.id) {
                            return { ...s, percentage: Number(splitVal.toFixed(1)) };
                        }
                        return s;
                    });
                } else {
                    const ratio1 = other1.percentage / totalOld;
                    const val1 = remainingToDistribute * ratio1;
                    const val2 = remainingToDistribute * (1 - ratio1);
                    updated = updated.map(s => {
                        if (s.id === other1.id) return { ...s, percentage: Number(val1.toFixed(1)) };
                        if (s.id === other2.id) return { ...s, percentage: Number(val2.toFixed(1)) };
                        return s;
                    });
                }
            }

            // Let's do a quick pass to make sure they sum up to exactly 100
            const totalSum = updated.reduce((sum, s) => sum + s.percentage, 0);
            const delta = 100 - totalSum;
            if (delta !== 0) {
                // Adjust the first unlocked other partner by the rounding delta
                const adjustTarget = otherUnlocked.find(s => s.id !== id);
                if (adjustTarget) {
                    updated = updated.map(s => s.id === adjustTarget.id ? { ...s, percentage: Number((s.percentage + delta).toFixed(1)) } : s);
                }
            }

            return updated;
        });
    };

    const toggleShareholderLock = (id: number) => {
        setShareholders(prev => prev.map(s => s.id === id ? { ...s, locked: !s.locked } : s));
    };



    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
            
            {/* Header / Navbar */}
            <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                            DOOH SMART
                        </span>
                    </div>
                    <div className="flex items-center gap-8 text-sm font-semibold text-slate-400">
                        <a href="#about" className="hover:text-white transition-colors">За Проектот</a>
                        <a href="#simulation" className="hover:text-white transition-colors">Симулација</a>
                        <a href="#calculator" className="hover:text-white transition-colors">Калкулатор</a>
                        <a href="#profit" className="hover:text-white transition-colors">Профит</a>
                        <a href="/blog" className="text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-950/30 border border-indigo-900/50 px-4 py-2 rounded-full">
                            Градски Блог
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative py-24 md:py-32 flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-40 left-1/3 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                    <div className="inline-flex items-center gap-2 bg-indigo-950/50 border border-indigo-900/50 px-4 py-1.5 rounded-full text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        ✨ Иднина на Надворешно Рекламирање
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-white">
                        Автоматизирана Мрежа на <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                            Паметни Дигитални Билборди
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                        Револуционерна DOOH платформа која ги поврзува физичките билборди со локалните бизниси преку автоматска купување, 3D симулација во реално време и паметен систем за распределба на профитот.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <a href="#simulation" className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]">
                            Почни Симулација во Живо
                        </a>
                        <a href="#calculator" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 font-bold px-8 py-4 rounded-xl transition-all hover:scale-[1.02]">
                            Пресметај Заработка
                        </a>
                    </div>
                </div>
            </section>

            {/* Problem & Solution Section (Што е проблемот, што нудиме) */}
            <section id="about" className="py-24 max-w-7xl mx-auto px-6 border-t border-slate-900">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white">Проблемот и Нашето Решение</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">Како го трансформираме застарениот пазар за надворешен маркетинг.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* The Problem */}
                    <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-8 md:p-12 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl" />
                        <h3 className="text-2xl font-bold text-rose-400 mb-6 flex items-center gap-3">
                            <span className="w-2 h-8 bg-rose-500 rounded-full" />
                            Проблемот со класичните реклами
                        </h3>
                        <ul className="space-y-6 text-slate-300 font-medium">
                            <li className="flex gap-4">
                                <span className="text-rose-500 text-lg font-bold">✕</span>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Скапо и Бавно поставување</h4>
                                    <p className="text-sm text-slate-400">Печатење, лепење и замена на рекламите на билбордите бара денови и високи логистички трошоци.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-rose-500 text-lg font-bold">✕</span>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Нема временско таргетирање</h4>
                                    <p className="text-sm text-slate-400">Рекламите стојат исти без разлика дали е 8 наутро во густ сообраќај или 3 часот по полноќ.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-rose-500 text-lg font-bold">✕</span>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Непристапно за локалните бизниси</h4>
                                    <p className="text-sm text-slate-400">Агенциите бараат договори на долг рок, правејќи го надворешниот маркетинг прескап за малите локали.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Our Solution */}
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 md:p-12 relative overflow-hidden group shadow-xl shadow-indigo-950/10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
                        <h3 className="text-2xl font-bold text-emerald-400 mb-6 flex items-center gap-3">
                            <span className="w-2 h-8 bg-emerald-500 rounded-full" />
                            Паметната DOOH Алтернатива
                        </h3>
                        <ul className="space-y-6 text-slate-300 font-medium">
                            <li className="flex gap-4">
                                <span className="text-emerald-500 text-lg font-bold">✓</span>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Инстантна промена во реално време</h4>
                                    <p className="text-sm text-slate-400">Дигиталните ЛЕД екрани овозможуваат веднаш да ја прикачите и промените вашата реклама преку веб.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-emerald-500 text-lg font-bold">✓</span>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Динамични и „Паметни“ термини</h4>
                                    <p className="text-sm text-slate-400">Автоматски ротации по временски зони (утрински термин за пекари, вечер за кафулиња/брендови).</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-emerald-500 text-lg font-bold">✓</span>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Целосно отворен и достапен систем</h4>
                                    <p className="text-sm text-slate-400">Бизнисите купуваат флексибилни пакети согласно нивниот буџет и имаат целосна self-service контрола.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Live Billboard Simulation */}
            <section id="simulation" className="py-24 max-w-7xl mx-auto px-6 border-t border-slate-900">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white">Интерактивна Симулација на Билборди во Градот</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">Погледнете ја ротацијата на нашите реклами на билбордите низ градот во реално време.</p>
                </div>

                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Aspect-ratio locked 3D simulation */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden aspect-[5376/3072] w-full relative shadow-2xl">
                        <Scene />
                    </div>
                    {/* Playback indicator & details */}
                    <div className="bg-slate-900/50 border border-slate-900/60 p-5 rounded-2xl flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="font-bold uppercase tracking-wider text-xs text-slate-400">Симулатор Термин:</span>
                            </div>
                            <span className="font-mono text-white text-base font-semibold">
                                {currentTime ? currentTime.toLocaleTimeString() : '00:00:00'}
                            </span>
                        </div>
                        <div className="text-slate-400 text-xs font-semibold">
                            Активна Реклама: <span className="text-indigo-400 font-bold">{activeAd ? activeAd.name : 'Нема'}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Revenue Calculator Section */}
            <section id="calculator" className="py-24 max-w-7xl mx-auto px-6 border-t border-slate-900">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white">Калкулатор на Приходи за Инвеститори</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">Прилагодете ги параметрите на активни клиенти и пресметајте ја проценката за заработка и профит од мрежата.</p>
                </div>

                {calcLoading ? (
                    <div className="text-center text-slate-500 py-10">Се вчитаат податоците за пакетите...</div>
                ) : (
                    <div className="grid lg:grid-cols-12 gap-8 items-start">
                        {/* Left Column: Input Sliders */}
                        <div className="lg:col-span-6 space-y-6">
                            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-8">
                                <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-4 flex items-center gap-2">
                                    <BarChart2 className="w-5 h-5 text-indigo-400" />
                                    Конфигурација на претплатници
                                </h3>

                                <div className="space-y-8">
                                    {packages.map(pkg => (
                                        <div key={pkg.id} className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pkg.color }} />
                                                    <span className="font-bold text-white text-base">{pkg.name} Пакет</span>
                                                </div>
                                                <span className="text-sm font-semibold text-indigo-400">
                                                    €{pkg.price} / месечно
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="50"
                                                    step="1"
                                                    value={clientCounts[pkg.id] || 0}
                                                    onChange={(e) => handleClientChange(pkg.id, Number(e.target.value))}
                                                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                />
                                                <span className="w-10 text-right font-bold text-white text-lg">
                                                    {clientCounts[pkg.id] || 0}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-slate-800 space-y-6">
                                    {/* Работно време */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Работно Време (часови дневно)</label>
                                            <span className="font-mono font-bold text-indigo-400 text-sm">{workingHours} часа</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="1"
                                                max="24"
                                                step="1"
                                                value={workingHours}
                                                onChange={(e) => setWorkingHours(Number(e.target.value))}
                                                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                            <span className="w-10 text-right font-bold text-white text-base">{workingHours}h</span>
                                        </div>
                                    </div>

                                    {/* Исполнетост на мрежа */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Исполнетост на Мрежа (%)</label>
                                            <span className="font-mono font-bold text-indigo-400 text-sm">{occupancy}%</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="5"
                                                value={occupancy}
                                                onChange={(e) => setOccupancy(Number(e.target.value))}
                                                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                            <span className="w-10 text-right font-bold text-white text-base">{occupancy}%</span>
                                        </div>
                                    </div>

                                    {/* Месечни Оперативни Расходи */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Месечни Оперативни Расходи (Вкупно во €)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white font-mono font-bold"
                                            value={expenses}
                                            onChange={(e) => setExpenses(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Earnings Summary */}
                        <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-6">
                            {/* Summary Cards */}
                            <div className="grid sm:grid-cols-2 gap-6 h-full">
                                <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col justify-between">
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Вкупен Месечен Приход</span>
                                        <div className="text-4xl font-black text-white mt-2">€{Math.round(totalMonthlyRevenue).toLocaleString()}</div>
                                    </div>
                                    <span className="text-sm text-indigo-400 font-semibold block mt-4 border-t border-slate-800/50 pt-3">€{Math.round(totalYearlyRevenue).toLocaleString()} / годишно</span>
                                </div>

                                <div className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border border-indigo-500/20 p-8 rounded-3xl shadow-2xl flex flex-col justify-between">
                                    <div>
                                        <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider block mb-1">Нето Месечен Профит</span>
                                        <div className="text-4xl font-black text-white mt-2">€{Math.round(netProfitMonthly).toLocaleString()}</div>
                                    </div>
                                    <span className="text-sm text-indigo-300 font-semibold block mt-4 border-t border-indigo-500/20 pt-3">€{Math.round(netProfitYearly).toLocaleString()} / годишно</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Profit Sharing Section */}
            <section id="profit" className="py-24 max-w-7xl mx-auto px-6 border-t border-slate-900 mb-20">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white">Поделба на Профит</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">Интерактивна поделба на нето заработката помеѓу партнерите со опција за заклучување на полињата.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Shareholder sliders with lock state */}
                    <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6">
                        <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-400" />
                            Процентуална Распределба
                        </h3>
                        <div className="space-y-6">
                            {shareholders.map(partner => {
                                // Count how many other unlocked partners there are
                                const otherUnlockedCount = shareholders.filter(s => s.id !== partner.id && !s.locked).length;
                                const isSliderDisabled = partner.locked || otherUnlockedCount === 0;

                                return (
                                    <div key={partner.id} className="space-y-2 bg-slate-950/40 p-5 rounded-2xl border border-slate-900/50">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-white text-base">{partner.name}</span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => toggleShareholderLock(partner.id)}
                                                    className={`p-1.5 rounded-lg border transition-all ${partner.locked ? 'bg-indigo-950/80 border-indigo-500/30 text-indigo-400' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                                                    title={partner.locked ? "Отклучи ја вредноста" : "Заклучи ја вредноста"}
                                                >
                                                    {partner.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                </button>
                                                <span className="font-mono font-black text-indigo-400 text-lg">{partner.percentage}%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="1"
                                                value={partner.percentage}
                                                disabled={isSliderDisabled}
                                                onChange={(e) => handleShareholderPctChange(partner.id, Number(e.target.value))}
                                                className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-500 ${isSliderDisabled ? 'opacity-30 cursor-not-allowed bg-slate-900' : 'bg-slate-800'}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Earnings calculation cards */}
                    <div className="lg:col-span-6 space-y-6">
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
                            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-4 flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-emerald-400" />
                                Динамична Распределба на Нето Заработка (€)
                            </h3>

                            <div className="space-y-5">
                                {shareholders.map(partner => {
                                    const partnerMonthlyShare = Math.round((netProfitMonthly * partner.percentage) / 100);
                                    const partnerYearlyShare = Math.round((netProfitYearly * partner.percentage) / 100);

                                    return (
                                        <div key={partner.id} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-slate-300">{partner.name} дел ({partner.percentage}%)</span>
                                                <div className="text-right">
                                                    <span className="font-mono font-black text-emerald-400 text-lg">€{partnerMonthlyShare.toLocaleString()} / мес.</span>
                                                    <span className="block text-xs text-slate-500 font-semibold">€{partnerYearlyShare.toLocaleString()} / год.</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                                                <div 
                                                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-350"
                                                    style={{ width: `${partner.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-900 py-12 text-center text-xs text-slate-600 bg-slate-950">
                <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span>© 2026 DOOH Smart Billboards. Сите права се задржани.</span>
                    <div className="flex gap-6">
                        <a href="/" className="hover:text-slate-400">Почетна</a>
                        <a href="/admin" className="hover:text-slate-400">CMS Администрација</a>
                        <a href="/business/login" className="hover:text-slate-400">Бизнис Портал</a>
                    </div>
                </div>
            </footer>

            {/* Hidden TimeControls to run the simulation ticker */}
            <div className="h-0 w-0 overflow-hidden hidden">
                <TimeControls />
            </div>
        </div>
    );
};
