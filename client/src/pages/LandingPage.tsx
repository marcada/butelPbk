import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { Scene } from '../components/Scene';
import { TimeControls } from '../components/TimeControls';
import { api } from '../services/api';
import { 
    TrendingUp, Wallet, Users, BarChart2, Lock, Unlock, Layers,
    Clock, ShieldAlert, CheckCircle2, XCircle
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
    const [weekdayStart, setWeekdayStart] = useState<string>('07:00'); // Default start time
    const [weekdayEnd, setWeekdayEnd] = useState<string>('01:00'); // Default end time
    const [weekendStart, setWeekendStart] = useState<string>('07:00'); // Default start time
    const [weekendEnd, setWeekendEnd] = useState<string>('03:00'); // Default end time
    const [shareholders, setShareholders] = useState<Shareholder[]>([
        { id: 1, name: 'MARCADA', percentage: 60, locked: false },
        { id: 2, name: 'Investitor', percentage: 20, locked: false },
        { id: 3, name: 'OGj', percentage: 20, locked: false }
    ]);
    const [calcLoading, setCalcLoading] = useState(true);

    // Scroll state for background animations
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Intersection Observer for scroll reveal animations
    useEffect(() => {
        if (calcLoading) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, { threshold: 0.05 });

        const reveals = document.querySelectorAll('.reveal');
        reveals.forEach(el => observer.observe(el));

        return () => {
            reveals.forEach(el => observer.unobserve(el));
        };
    }, [packages, calcLoading]);

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

    // Dynamic Working Hours Calculation
    const getHoursDiff = (start: string, end: string) => {
        const startHour = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);
        if (endHour > startHour) {
            return endHour - startHour;
        } else if (endHour < startHour) {
            return (24 - startHour) + endHour;
        } else {
            return 24; // If start and end are equal, represent a full 24h cycle
        }
    };

    const weekdayHours = getHoursDiff(weekdayStart, weekdayEnd);
    const weekendHours = getHoursDiff(weekendStart, weekendEnd);

    // Dynamic Network Occupancy
    const maxSpotsWeekday = Math.floor((weekdayHours * 3600) / 20);
    const maxSpotsWeekend = Math.floor((weekendHours * 3600) / 20);

    const soldShowings = packages.reduce((sum, pkg) => {
        const count = clientCounts[pkg.id] || 0;
        return sum + (count * pkg.shows_per_day);
    }, 0);

    const occupancyWeekday = maxSpotsWeekday > 0 ? Math.min(100, Math.round((soldShowings / maxSpotsWeekday) * 100)) : 0;
    const occupancyWeekend = maxSpotsWeekend > 0 ? Math.min(100, Math.round((soldShowings / maxSpotsWeekend) * 100)) : 0;

    const occupancy = Math.max(occupancyWeekday, occupancyWeekend);
    const totalActiveClients = Object.values(clientCounts).reduce((sum, val) => sum + val, 0);

    const minAllowedMaxSpots = Math.min(maxSpotsWeekday, maxSpotsWeekend);
    const isLimitReached = soldShowings >= minAllowedMaxSpots;

    // Calculator calculations
    const totalMonthlyRevenue = packages.reduce((sum, pkg) => {
        const count = clientCounts[pkg.id] || 0;
        return sum + (pkg.price * count);
    }, 0);

    const totalYearlyRevenue = totalMonthlyRevenue * 12;
    const netProfitMonthly = Math.max(0, totalMonthlyRevenue - expenses);
    const netProfitYearly = netProfitMonthly * 12;

    const handleClientChange = (pkgId: number, value: number) => {
        setClientCounts(prev => {
            const currentVal = prev[pkgId] || 0;
            if (value <= currentVal) {
                return { ...prev, [pkgId]: value };
            }

            // Calculate target showings
            const targetCounts = { ...prev, [pkgId]: value };
            const targetSold = packages.reduce((sum, pkg) => {
                const count = targetCounts[pkg.id] || 0;
                return sum + (count * pkg.shows_per_day);
            }, 0);

            if (targetSold > minAllowedMaxSpots) {
                // Find capacity left by other packages
                const otherSold = packages.reduce((sum, pkg) => {
                    if (pkg.id === pkgId) return sum;
                    const count = prev[pkg.id] || 0;
                    return sum + (count * pkg.shows_per_day);
                }, 0);

                const targetPkg = packages.find(p => p.id === pkgId);
                if (!targetPkg) return prev;

                const maxClients = Math.floor((minAllowedMaxSpots - otherSold) / targetPkg.shows_per_day);
                const safeValue = Math.max(currentVal, maxClients);
                return { ...prev, [pkgId]: safeValue };
            }

            return targetCounts;
        });
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
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden relative">
            
            {/* 1. Global Floating Background Shapes */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute inset-0 cyber-grid opacity-30" />
                <div className="absolute inset-0 cyber-grid-dense opacity-20" />
                
                {/* Parallax drifting glows */}
                <div 
                    className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse-soft"
                    style={{ transform: `translate3d(0, ${scrollY * 0.15}px, 0)` }}
                />
                <div 
                    className="absolute top-[35%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-500/10 blur-[130px] animate-float-slow"
                    style={{ transform: `translate3d(0, ${-scrollY * 0.08}px, 0)` }}
                />
                <div 
                    className="absolute bottom-[-10%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-pink-500/5 blur-[110px] animate-float-reverse"
                    style={{ transform: `translate3d(0, ${scrollY * 0.05}px, 0)` }}
                />
            </div>

            {/* Header / Navbar */}
            <nav className="border-b border-slate-900/60 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <TrendingUp className="w-5 h-5 text-white relative z-10 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-250 to-slate-400">
                                DOOH SMART
                            </span>
                            <span className="text-[9px] text-indigo-400 tracking-widest font-black uppercase">Билборди</span>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-450">
                        <a href="#about" className="hover:text-white transition-colors duration-200 relative group py-2">
                            За Проектот
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
                        </a>
                        <a href="#simulation" className="hover:text-white transition-colors duration-200 relative group py-2">
                            Симулација
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
                        </a>
                        <a href="#packages" className="hover:text-white transition-colors duration-200 relative group py-2">
                            Пакети
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
                        </a>
                        <a href="#calculator" className="hover:text-white transition-colors duration-200 relative group py-2">
                            Калкулатор
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
                        </a>
                        <a href="#profit" className="hover:text-white transition-colors duration-200 relative group py-2">
                            Профит
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
                        </a>
                        <a href="/blog" className="text-indigo-400 hover:text-white transition-all duration-300 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-900/50 px-5 py-2 rounded-full shadow-lg shadow-indigo-950/50 hover:shadow-indigo-500/10">
                            Градски Блог
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                    <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/40 px-4.5 py-2 rounded-full text-xs font-bold text-indigo-300 uppercase tracking-wider shadow-lg shadow-indigo-950/50">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                        ✨ Дигитално Надворешно Рекламирање (DOOH)
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight text-white reveal reveal-scale">
                        Автоматизирана Мрежа на <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-[0_2px_15px_rgba(99,102,241,0.2)]">
                            Паметни Дигитални Билборди
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed reveal reveal-scale reveal-delay-100">
                        Револуционерна <strong>DOOH (Digital Out-of-Home / Дигитално надворешно рекламирање)</strong> платформа која ги поврзува физичките билборди со локалните бизниси преку автоматско купување, 3D симулација во реално време и паметен систем за распределба на профитот. Модерни паметни ЛЕД екрани низ градот кои овозможуваат таргетирано емитување и инстант реклами.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4 reveal reveal-scale reveal-delay-200">
                        <a href="#simulation" className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.03] active:scale-[0.98]">
                            Почни Симулација во Живо
                        </a>
                        <a href="#calculator" className="w-full sm:w-auto bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-800/80 font-bold px-8 py-4 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.98] shadow-lg">
                            Пресметај Заработка
                        </a>
                    </div>
                </div>
            </section>

            {/* Problem & Solution Section */}
            <section id="about" className="py-24 max-w-7xl mx-auto px-6 border-t border-slate-900/60 relative z-10">
                <div className="text-center mb-20 space-y-4 reveal reveal-scale">
                    <h2 className="text-3xl md:text-5xl font-black text-white">Проблемот и Нашето Решение</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-base font-semibold">Како го трансформираме застарениот пазар за надворешен маркетинг преку автоматизација и дигитализација.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                    {/* The Problem */}
                    <div className="premium-card premium-card-danger rounded-3xl p-8 md:p-12 relative overflow-hidden group reveal reveal-left">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl" />
                        <h3 className="text-2xl font-black text-rose-400 mb-8 flex items-center gap-3">
                            <span className="w-2.5 h-8 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                            Проблемот со класичните реклами
                        </h3>
                        <ul className="space-y-8 text-slate-300 font-medium">
                            <li className="flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-rose-950/60 border border-rose-900/40 flex items-center justify-center shrink-0">
                                    <XCircle className="w-4 h-4 text-rose-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1.5 text-base">Скапо и Бавно поставување</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">Печатење, лепење и замена на плакати бара денови и високи логистички/физички трошоци.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-rose-950/60 border border-rose-900/40 flex items-center justify-center shrink-0">
                                    <XCircle className="w-4 h-4 text-rose-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1.5 text-base">Нема временско таргетирање</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">Рекламите стојат непроменети со недели, без разлика дали е раздвижен утрински шпиц или 3 часот по полноќ.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-rose-950/60 border border-rose-900/40 flex items-center justify-center shrink-0">
                                    <XCircle className="w-4 h-4 text-rose-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1.5 text-base">Непристапно за локалните бизниси</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">Агенциите бараат големи договори на долг рок, правејќи го надворешниот маркетинг недостижен за малите локали.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Our Solution */}
                    <div className="premium-card premium-card-success rounded-3xl p-8 md:p-12 relative overflow-hidden group reveal reveal-right">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
                        <h3 className="text-2xl font-black text-emerald-400 mb-8 flex items-center gap-3">
                            <span className="w-2.5 h-8 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            Паметната DOOH Алтернатива
                        </h3>
                        <ul className="space-y-8 text-slate-300 font-medium">
                            <li className="flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-emerald-950/60 border border-emerald-900/40 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1.5 text-base">Инстантна промена во реално време</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">Дигиталните ЛЕД екрани овозможуваат веднаш да ја прикачите и промените вашата реклама преку веб.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-emerald-950/60 border border-emerald-900/40 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1.5 text-base">Динамичко временско таргетирање</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">Автоматско менување на рекламите во клучните делови од денот кога фреквенцијата на целната публика е најголема.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-emerald-950/60 border border-emerald-900/40 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1.5 text-base">Целосно отворен и достапен систем</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">Бизнисите купуваат флексибилни пакети согласно нивниот буџет и имаат целосна self-service контрола.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Live Billboard Simulation Section */}
            <section id="simulation" className="py-24 max-w-7xl mx-auto px-6 border-t border-slate-900/60 relative z-10">
                <div className="text-center mb-16 space-y-4 reveal reveal-scale">
                    <h2 className="text-3xl md:text-5xl font-black text-white">Интерактивен Контролен Панел</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-base">Следете ја работата и емитувањето на рекламите на билбордите низ градот во реално време.</p>
                </div>

                <div className="max-w-5xl mx-auto space-y-6 reveal reveal-scale">
                    {/* Futuristic Dashboard Frame */}
                    <div className="premium-card rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
                        {/* Top Bar of the Console */}
                        <div className="bg-slate-950/80 px-6 py-4 flex items-center justify-between border-b border-slate-900">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest ml-4">System Core: live_viewport_3D</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-900/50 text-[10px] font-mono font-bold text-emerald-400 animate-pulse">
                                    ONLINE
                                </span>
                            </div>
                        </div>
                        
                        {/* 3D Scene Viewport */}
                        <div className="aspect-[5376/3072] w-full relative bg-slate-950">
                            <Scene />
                        </div>

                        {/* Bottom Status Information */}
                        <div className="bg-slate-950/90 border-t border-slate-900 p-6 grid md:grid-cols-3 gap-6 items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-indigo-950/50 border border-indigo-900/40 flex items-center justify-center shrink-0">
                                    <Clock className="w-5.5 h-5.5 text-indigo-400" />
                                </div>
                                <div>
                                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Време во Симулацијата</span>
                                    <span className="font-mono text-white text-base font-extrabold neon-glow-indigo">
                                        {currentTime ? currentTime.toLocaleTimeString() : '00:00:00'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-emerald-950/50 border border-emerald-900/40 flex items-center justify-center shrink-0">
                                    <Layers className="w-5.5 h-5.5 text-emerald-400" />
                                </div>
                                <div>
                                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Активен Рекламен Спот</span>
                                    <span className="font-bold text-emerald-400 text-sm block truncate max-w-[200px]">
                                        {activeAd ? activeAd.name : 'Иницијализација...'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 text-right">
                                <span className="text-[10px] text-slate-500 font-mono font-bold">FPS: 60 | ENGINE: WEBGL2</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Packages Presentation Section */}
            {packages.length > 0 && (
                <section id="packages" className="py-24 max-w-7xl mx-auto px-6 border-t border-slate-900/60 relative z-10">
                    <div className="text-center mb-20 space-y-4 reveal reveal-scale">
                        <div className="inline-flex items-center gap-2 bg-indigo-950/50 border border-indigo-900/50 px-4 py-1.5 rounded-full text-xs font-bold text-indigo-450 uppercase tracking-wider">
                            <Layers className="w-3.5 h-3.5 text-indigo-450" /> Маркетинг Понуда
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white">Флексибилни Рекламни Пакети</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-base">
                            Изберете ја фреквенцијата која одговара на вашите цели. Рекламите се емитуваат синхронизирано низ целата дигитална мрежа.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {packages.map((pkg, idx) => {
                            const freqText = pkg.name === 'Basic' ? '48 минути' : pkg.name === 'Pro' ? '24 минути' : '12 минути';
                            return (
                                <div 
                                    key={pkg.id} 
                                    className="premium-card rounded-3xl p-8 relative overflow-hidden group flex flex-col justify-between reveal reveal-scale"
                                    style={{ transitionDelay: `${idx * 100}ms` }}
                                >
                                    {/* Radial glow based on color */}
                                    <div 
                                        className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-555 pointer-events-none" 
                                        style={{ backgroundColor: pkg.color }}
                                    />
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <span 
                                                className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full" 
                                                style={{ backgroundColor: `${pkg.color}15`, color: pkg.color, border: `1px solid ${pkg.color}30` }}
                                            >
                                                {pkg.name} ПАКЕТ
                                            </span>
                                            <div className="mt-5 flex items-baseline">
                                                <span className="text-4xl font-black text-white">€{pkg.price}</span>
                                                <span className="text-sm font-bold text-slate-500 ml-2">/ месечно</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 border-t border-slate-900/60 pt-6">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-450 font-semibold">Дневни Емитувања:</span>
                                                <span className="font-extrabold text-white font-mono">{pkg.shows_per_day} пати</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-455 font-semibold">Времетраење на спот:</span>
                                                <span className="font-extrabold text-white font-mono">{pkg.duration} сек.</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-450 font-semibold">Фреквенција на појавување:</span>
                                                <span className="font-extrabold text-indigo-400">секои {freqText}*</span>
                                            </div>
                                        </div>

                                        <ul className="space-y-3.5 pt-4 text-xs font-semibold text-slate-400">
                                            <li className="flex items-center gap-2">
                                                <span className="text-emerald-500 text-sm">✓</span> Синхронизирано на сите локации
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-emerald-500 text-sm">✓</span> Автоматско емитување во живо
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-emerald-500 text-sm">✓</span> Детален извештај за импресии
                                            </li>
                                            {pkg.name !== 'Basic' && (
                                                <li className="flex items-center gap-2">
                                                    <span className="text-emerald-500 text-sm">✓</span> Брза промена на видео креатива
                                                </li>
                                            )}
                                            {pkg.name === 'Enterprise' && (
                                                <li className="flex items-center gap-2">
                                                    <span className="text-emerald-500 text-sm">✓</span> Приоритетна поддршка 24/7
                                                </li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-slate-900/60">
                                        <a 
                                            href="#calculator" 
                                            className="block text-center w-full py-3.5 rounded-xl border border-slate-800 hover:border-indigo-500/50 text-xs font-black uppercase tracking-wider text-slate-350 hover:text-white transition-all bg-slate-950/40 hover:bg-indigo-950/20"
                                        >
                                            Избери во Калкулатор
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-8 text-center text-xs text-slate-500 font-semibold">
                        * Пресметаната фреквенција на појавување зависи од прилагоденото работно време во калкулаторот подолу.
                    </div>
                </section>
            )}

            {/* Revenue Calculator Section */}
            <section id="calculator" className="py-24 max-w-7xl mx-auto px-6 border-t border-slate-900/60 relative z-10">
                <div className="text-center mb-16 space-y-4 reveal reveal-scale">
                    <h2 className="text-3xl md:text-5xl font-black text-white">Симулатор за Приходи и Оптимизација</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-base font-semibold">Прилагодете ги параметрите на активни клиенти за да ја симулирате исполнетоста и заработката.</p>
                </div>

                {calcLoading ? (
                    <div className="text-center text-slate-500 py-10 font-bold">Се вчитаат податоците за калкулаторот...</div>
                ) : (
                    <div className="space-y-8">
                        {/* Dynamic Time controls - Row before the main card */}
                        <div className="premium-card rounded-3xl p-6 md:p-8 grid md:grid-cols-2 gap-8 items-center reveal reveal-scale">
                            {/* Column 1: Weekday */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <Clock className="w-5 h-5 text-indigo-400" />
                                    <h4 className="text-base font-extrabold text-white">
                                        Работни Денови (Понеделник - Петок)
                                    </h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Вклучување</span>
                                        <select
                                            value={weekdayStart}
                                            onChange={(e) => setWeekdayStart(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white font-mono font-bold"
                                        >
                                            {Array.from({ length: 24 }, (_, i) => {
                                                const hr = i.toString().padStart(2, '0');
                                                return <option key={hr} value={`${hr}:00`}>{hr}:00</option>;
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Исклучување</span>
                                        <select
                                            value={weekdayEnd}
                                            onChange={(e) => setWeekdayEnd(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white font-mono font-bold"
                                        >
                                            {Array.from({ length: 24 }, (_, i) => {
                                                const hr = i.toString().padStart(2, '0');
                                                return <option key={hr} value={`${hr}:00`}>{hr}:00</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>
                                <div className="text-xs text-indigo-300 font-bold flex justify-between items-center bg-indigo-950/20 px-4 py-2.5 rounded-xl border border-indigo-900/30">
                                    <span>Активни часови на ротација:</span>
                                    <span className="text-white font-black font-mono">{weekdayHours} часа ({maxSpotsWeekday} слота)</span>
                                </div>
                            </div>

                            {/* Column 2: Weekend */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <Clock className="w-5 h-5 text-purple-400" />
                                    <h4 className="text-base font-extrabold text-white">
                                        Викенди (Сабота - Недела)
                                    </h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Вклучување</span>
                                        <select
                                            value={weekendStart}
                                            onChange={(e) => setWeekendStart(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white font-mono font-bold"
                                        >
                                            {Array.from({ length: 24 }, (_, i) => {
                                                const hr = i.toString().padStart(2, '0');
                                                return <option key={hr} value={`${hr}:00`}>{hr}:00</option>;
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Исклучување</span>
                                        <select
                                            value={weekendEnd}
                                            onChange={(e) => setWeekendEnd(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white font-mono font-bold"
                                        >
                                            {Array.from({ length: 24 }, (_, i) => {
                                                const hr = i.toString().padStart(2, '0');
                                                return <option key={hr} value={`${hr}:00`}>{hr}:00</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>
                                <div className="text-xs text-purple-300 font-bold flex justify-between items-center bg-purple-950/20 px-4 py-2.5 rounded-xl border border-purple-900/30">
                                    <span>Активни часови на ротација:</span>
                                    <span className="text-white font-black font-mono">{weekendHours} часа ({maxSpotsWeekend} слота)</span>
                                </div>
                            </div>
                        </div>

                        {/* Main Interactive Grid */}
                        <div className="grid lg:grid-cols-12 gap-8 items-start">
                            
                            {/* Left Side: Client configuration sliders */}
                            <div className="lg:col-span-6 space-y-6 reveal reveal-left">
                                <div className="premium-card rounded-3xl p-8 space-y-8 shadow-xl">
                                    <h3 className="text-lg font-black text-white border-b border-slate-900 pb-4 flex items-center gap-2.5">
                                        <BarChart2 className="w-5 h-5 text-indigo-400" />
                                        Конфигурација на клиенти во мрежата
                                    </h3>

                                    <div className="space-y-6.5">
                                        {packages.map(pkg => (
                                            <div key={pkg.id} className="space-y-3 bg-slate-950/20 p-5 rounded-2xl border border-slate-900/50">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pkg.color }} />
                                                        <span className="font-extrabold text-white text-base">
                                                            {pkg.name} Пакет
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-400">
                                                        €{pkg.price} / мес.
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-5">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="50"
                                                        step="1"
                                                        value={clientCounts[pkg.id] || 0}
                                                        onChange={(e) => handleClientChange(pkg.id, Number(e.target.value))}
                                                        className="flex-1"
                                                    />
                                                    <span className="w-8 text-right font-black text-white text-lg font-mono">
                                                        {clientCounts[pkg.id] || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Operational Expenses */}
                                    <div className="pt-6 border-t border-slate-900/80 space-y-4">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            МЕСЕЧНИ ОПЕРАТИВНИ РАСХОДИ (ВКУПНО ВО €)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3 text-slate-505 font-bold">€</span>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white font-mono font-bold shadow-inner"
                                                value={expenses}
                                                onChange={(e) => setExpenses(Math.max(0, Number(e.target.value)))}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                                            * Напомена: Трошоците за електрична енергија и интернет не се пресметани во оваа сума бидејќи моментално не можеме прецизно да ги предвидиме. Зборуваме само за маркетинг и основни оперативни расходи.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Network Occupancy Gauge & Financial outputs */}
                            <div className="lg:col-span-6 space-y-6 reveal reveal-right">
                                
                                {/* Capacity Indicator Card */}
                                <div className="premium-card rounded-3xl p-8 shadow-xl space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Капацитет и Исполнетост</span>
                                            <span className="text-xs text-slate-505 font-semibold">Искористеност на расположливите рекламни слотови</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-3xl font-black text-indigo-400 font-mono neon-glow-indigo">{occupancy}%</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-900 shadow-inner">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 shadow-lg ${
                                                    occupancy > 85 ? 'bg-gradient-to-r from-rose-500 to-red-400 shadow-rose-950/50' :
                                                    occupancy > 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-amber-950/50' :
                                                    'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-emerald-950/50'
                                                }`}
                                                style={{ width: `${occupancy}%` }}
                                            />
                                        </div>

                                        {isLimitReached && (
                                            <div className="text-rose-500 font-black text-xs animate-pulse tracking-widest text-center py-3 bg-rose-950/20 border border-rose-900/30 rounded-xl uppercase flex items-center justify-center gap-2">
                                                <ShieldAlert className="w-4 h-4 text-rose-500" />
                                                ДОСТИГНАТ МАКСИМАЛЕН КАПАЦИТЕТ НА МРЕЖАТА!
                                            </div>
                                        )}

                                        <div className="space-y-3 pt-3 border-t border-slate-900/80 text-xs font-semibold text-slate-400">
                                            <div className="flex justify-between">
                                                <span>Вкупно активни клиенти:</span>
                                                <strong className="text-white font-mono">{totalActiveClients}</strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Вкупен број на прикажувања дневно:</span>
                                                <strong className="text-white font-mono">{soldShowings} пати</strong>
                                            </div>
                                            <div className="flex justify-between text-[11px] text-slate-500">
                                                <span>Максимум во работни денови:</span>
                                                <strong className="font-mono">{maxSpotsWeekday} слота ({weekdayHours}ч.)</strong>
                                            </div>
                                            <div className="flex justify-between text-[11px] text-slate-500">
                                                <span>Максимум за викенди:</span>
                                                <strong className="font-mono">{maxSpotsWeekend} слота ({weekendHours}ч.)</strong>
                                            </div>
                                            <div className="flex justify-between items-center pt-3 border-t border-slate-900/80">
                                                <span>Статус на ресурси:</span>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    occupancy > 85 ? 'bg-rose-950/80 text-rose-400 border border-rose-900/30' :
                                                    occupancy > 50 ? 'bg-amber-950/80 text-amber-400 border border-amber-900/30' :
                                                    'bg-emerald-950/80 text-emerald-400 border border-emerald-900/30'
                                                }`}>
                                                    {occupancy > 85 ? 'Речиси полна' : occupancy > 50 ? 'Оптимална' : 'Слободна'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Summaries */}
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="premium-card rounded-3xl p-8 flex flex-col justify-between shadow-xl">
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Месечен Приход</span>
                                            <div className="text-3xl font-black text-white mt-2">€{Math.round(totalMonthlyRevenue).toLocaleString()}</div>
                                        </div>
                                        <span className="text-xs text-indigo-400 font-bold block mt-6 border-t border-slate-900/60 pt-4 font-mono">
                                            €{Math.round(totalYearlyRevenue).toLocaleString()} / год.
                                        </span>
                                    </div>

                                    <div className="premium-card rounded-3xl p-8 flex flex-col justify-between shadow-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900/60 via-indigo-950/40 to-slate-950/40">
                                        <div>
                                            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest block mb-1">Нето Профит</span>
                                            <div className="text-3xl font-black text-emerald-400 mt-2 neon-glow-emerald">€{Math.round(netProfitMonthly).toLocaleString()}</div>
                                        </div>
                                        <span className="text-xs text-indigo-300 font-bold block mt-6 border-t border-indigo-500/20 pt-4 font-mono">
                                            €{Math.round(netProfitYearly).toLocaleString()} / год.
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Future Scaling Strategy Flowchart Alert */}
                        <div className="bg-gradient-to-r from-indigo-950/50 via-slate-900/60 to-purple-950/50 border border-indigo-500/25 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center gap-6 relative overflow-hidden reveal reveal-scale">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                                <TrendingUp className="w-7 h-7 text-white" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-lg font-black text-white flex items-center gap-2">
                                    🚀 Паметно Скалирање: Автоматска Географска Зонска Поделба
                                </h4>
                                <p className="text-slate-400 text-sm leading-relaxed font-semibold">
                                    Кога исполнетоста на мрежата ќе достигне 100%, не е потребен нов скап хардвер! Системот автоматски преминува во режим на <strong>Географски Зони</strong>. Билбордите се разделуваат на N зони, со што капацитетот на рекламен простор инстантно се множи за N пати. Ова веднаш го мултиплицира капацитетот на рекламен простор за N пати (каде N е бројот на зони), со што остваруваме дополнителни приходоносни слотови без потреба од нови инвестиции во хардвер.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Profit Sharing Section */}
            <section id="profit" className="py-24 max-w-7xl mx-auto px-6 border-t border-slate-900/60 mb-20 relative z-10">
                <div className="text-center mb-16 space-y-4 reveal reveal-scale">
                    <h2 className="text-3xl md:text-5xl font-black text-white">Интерактивна Поделба на Профит</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-base font-semibold">Симулирајте ја поделбата на нето заработката помеѓу партнерите. Искористете ја опцијата за заклучување за фиксирање вредности.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-10 items-start">
                    {/* Left: Shareholder sliders with lock state */}
                    <div className="lg:col-span-6 bg-slate-900/40 premium-card rounded-3xl p-8 space-y-8 reveal reveal-left">
                        <h3 className="text-lg font-black text-white border-b border-slate-900 pb-4 flex items-center gap-2.5">
                            <Users className="w-5 h-5 text-indigo-400" />
                            Процентуална Распределба на Партнери
                        </h3>
                        
                        <div className="space-y-6.5">
                            {shareholders.map(partner => {
                                const otherUnlockedCount = shareholders.filter(s => s.id !== partner.id && !s.locked).length;
                                const isSliderDisabled = partner.locked || otherUnlockedCount === 0;

                                return (
                                    <div key={partner.id} className="space-y-3.5 bg-slate-950/20 p-5 rounded-2xl border border-slate-900/50">
                                        <div className="flex justify-between items-center">
                                            <span className="font-extrabold text-white text-base">{partner.name}</span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => toggleShareholderLock(partner.id)}
                                                    className={`p-1.5 rounded-lg border transition-all duration-200 ${partner.locked ? 'bg-indigo-950/80 border-indigo-500/40 text-indigo-455 shadow-md shadow-indigo-950/50' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-350'}`}
                                                    title={partner.locked ? "Отклучи вредност" : "Заклучи вредност"}
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
                                                className={`flex-1 ${isSliderDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Earnings calculation cards */}
                    <div className="lg:col-span-6 space-y-6 reveal reveal-right">
                        <div className="premium-card rounded-3xl p-8 space-y-8 shadow-xl">
                            <h3 className="text-lg font-black text-white border-b border-slate-900 pb-4 flex items-center gap-2.5">
                                <Wallet className="w-5 h-5 text-emerald-450" />
                                Динамична Распределба на Нето Заработка (€)
                            </h3>

                            <div className="space-y-6.5">
                                {shareholders.map(partner => {
                                    const partnerMonthlyShare = Math.round((netProfitMonthly * partner.percentage) / 100);
                                    const partnerYearlyShare = Math.round((netProfitYearly * partner.percentage) / 100);

                                    return (
                                        <div key={partner.id} className="space-y-2.5">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-slate-300">{partner.name} дел ({partner.percentage}%)</span>
                                                <div className="text-right">
                                                    <span className="font-mono font-black text-emerald-400 text-lg neon-glow-emerald">€{partnerMonthlyShare.toLocaleString()} / мес.</span>
                                                    <span className="block text-xs text-slate-500 font-semibold">€{partnerYearlyShare.toLocaleString()} / год.</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900 shadow-inner">
                                                <div 
                                                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
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
            <footer className="border-t border-slate-900 py-14 text-center text-xs text-slate-500 bg-slate-950 relative z-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <span className="font-semibold">© 2026 DOOH Smart Billboards. Сите права се задржани.</span>
                    <div className="flex gap-8 font-bold">
                        <a href="/" className="hover:text-white transition-colors">Почетна</a>
                        <a href="/admin" className="hover:text-slate-400 hover:text-white transition-colors">CMS Администрација</a>
                        <a href="/business/login" className="hover:text-slate-450 hover:text-white transition-colors">Бизнис Портал</a>
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
