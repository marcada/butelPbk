import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { Scene } from '../components/Scene';
import { TimeControls } from '../components/TimeControls';
import { 
    Upload, TrendingUp, Wallet, Users, 
    CheckCircle, AlertTriangle, Loader2, BarChart2 
} from 'lucide-react';
import type { Package } from '../types';

interface Shareholder {
    id: number;
    name: string;
    percentage: number;
}

export const LandingPage: React.FC = () => {
    // Simulation store connection
    const { isPlaying, togglePlay, currentTime, activeAd } = useSimulationStore();

    // 1. Calculator states
    const [packages, setPackages] = useState<Package[]>([]);
    const [clientCounts, setClientCounts] = useState<Record<number, number>>({});
    const [expenses, setExpenses] = useState<number>(3000); // Default expenses
    const [shareholders, setShareholders] = useState<Shareholder[]>([
        { id: 1, name: 'Самет', percentage: 50 },
        { id: 2, name: 'Радован', percentage: 50 }
    ]);
    const [calcLoading, setCalcLoading] = useState(true);

    // 2. Upload Ad states
    const [clientName, setClientName] = useState('');
    const [adTitle, setAdTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState('');

    // Fetch packages for calculator
    useEffect(() => {
        // Auto-play simulation on mount so billboard is active immediately
        if (!isPlaying) {
            togglePlay();
        }

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
    const totalMonthlyRevenue = packages.reduce((sum, pkg) => {
        const count = clientCounts[pkg.id] || 0;
        return sum + (pkg.price * count);
    }, 0);

    const totalYearlyRevenue = totalMonthlyRevenue * 12;
    const netProfitMonthly = Math.max(0, totalMonthlyRevenue - expenses);
    const netProfitYearly = netProfitMonthly * 12;

    const handleClientChange = (pkgId: number, value: number) => {
        setClientCounts(prev => ({ ...prev, [pkgId]: value }));
    };

    const handleShareholderPctChange = (id: number, value: number) => {
        const targetPct = Math.min(100, Math.max(0, value));
        setShareholders(prev => {
            const updated = prev.map(s => s.id === id ? { ...s, percentage: targetPct } : s);
            // Auto balance the other shareholder to make it 100%
            const other = updated.find(s => s.id !== id);
            if (other) {
                other.percentage = Math.max(0, 100 - targetPct);
            }
            return [...updated];
        });
    };

    // Upload Ad Handler
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setUploadError('');
        }
    };

    const handleUploadAd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientName || !adTitle || !selectedFile) {
            setUploadError('Ве молам пополнете ги сите полиња.');
            return;
        }

        setUploading(true);
        setUploadError('');
        setUploadSuccess(false);

        const formData = new FormData();
        formData.append('client_name', clientName);
        formData.append('title', adTitle);
        formData.append('type_billboard', '1');
        formData.append('type_carousel', '1');
        formData.append('type_sidebar', '0');
        formData.append('billboard_image', selectedFile);

        try {
            const res = await fetch('http://localhost:8000/api/advertisements', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                throw new Error('Неуспешно качување на рекламата.');
            }

            setUploadSuccess(true);
            setClientName('');
            setAdTitle('');
            setSelectedFile(null);
            
            // Clear success message after 4s
            setTimeout(() => setUploadSuccess(false), 4000);
        } catch (err: any) {
            setUploadError(err.message || 'Се случи грешка.');
        } finally {
            setUploading(false);
        }
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

            {/* Live Billboard Simulation & Image Uploader */}
            <section id="simulation" className="py-24 max-w-7xl mx-auto px-6 border-t border-slate-900">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white">Интерактивна Симулација на Билборди во Градот</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">Погледнете ја ротацијата на рекламите во реално време или прикачете своја слика за веднаш да ја тестирате на екраните.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* Left side: Aspect-ratio locked 3D simulation */}
                    <div className="lg:col-span-8 space-y-4">
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

                    {/* Right side: Ad Uploader Form */}
                    <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-indigo-400" />
                            Прикачи Нова Реклама
                        </h3>
                        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                            Прикачете реклама во живо. По успешното зачувување на бекендот, сликата автоматски ќе влезе во симулаторот за презентација.
                        </p>

                        <form onSubmit={handleUploadAd} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Име на Бизнис / Клиент</label>
                                <input
                                    type="text"
                                    placeholder="на пр. Ресторан Gino"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Наслов на Рекламата</label>
                                <input
                                    type="text"
                                    placeholder="на пр. Летен Попуст 20%"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white"
                                    value={adTitle}
                                    onChange={(e) => setAdTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Избери Слика за Билборд</label>
                                <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-950 transition-colors relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                        required
                                    />
                                    <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                                    <span className="text-xs text-slate-400 block truncate">
                                        {selectedFile ? selectedFile.name : 'Прикачи слика (JPG, PNG)'}
                                    </span>
                                </div>
                            </div>

                            {uploadError && (
                                <div className="bg-rose-950/20 border border-rose-900/50 text-rose-400 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    {uploadError}
                                </div>
                            )}

                            {uploadSuccess && (
                                <div className="bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 shrink-0" />
                                    Рекламата е успешно додадена во ротација!
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Се зачувува...
                                    </>
                                ) : (
                                    'Активирај на Билбордите'
                                )}
                            </button>
                        </form>
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

                                <div className="pt-6 border-t border-slate-800 space-y-4">
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
                        <div className="lg:col-span-6 space-y-6">
                            {/* Summary Cards */}
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Вкупен Месечен Приход</span>
                                    <div className="text-3xl font-black text-white">€{totalMonthlyRevenue.toLocaleString()}</div>
                                    <span className="text-xs text-indigo-400 font-semibold block mt-1">€{totalYearlyRevenue.toLocaleString()} / годишно</span>
                                </div>

                                <div className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border border-indigo-500/20 p-6 rounded-3xl shadow-2xl">
                                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider block mb-1">Нето Месечен Профит</span>
                                    <div className="text-3xl font-black text-white">€{netProfitMonthly.toLocaleString()}</div>
                                    <span className="text-xs text-indigo-300 font-semibold block mt-1">€{netProfitYearly.toLocaleString()} / годишно</span>
                                </div>
                            </div>

                            {/* Shareholder Distribution */}
                            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
                                <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-400" />
                                    Распределба на Нето Профит
                                </h3>

                                <div className="space-y-6">
                                    {shareholders.map(partner => (
                                        <div key={partner.id} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-slate-300">{partner.name} (Косопственик)</span>
                                                <span className="font-bold text-emerald-400 text-lg">
                                                    €{Math.round((netProfitMonthly * partner.percentage) / 100).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    step="5"
                                                    value={partner.percentage}
                                                    onChange={(e) => handleShareholderPctChange(partner.id, Number(e.target.value))}
                                                    className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                                />
                                                <span className="w-12 text-right font-bold text-slate-200">{partner.percentage}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Profit Sharing Section (Placeholder) */}
            <section id="profit" className="py-24 max-w-7xl mx-auto px-6 border-t border-slate-900 mb-20">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white">Поделба на Профит</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">Детален преглед на распределбата на приходите.</p>
                </div>

                <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-12 text-center max-w-3xl mx-auto relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                    <Wallet className="w-12 h-12 text-indigo-500/40 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Наскоро достапно</h3>
                    <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                        Оваа секција ќе биде дополнително развиена со детални модели за распределба на нето профитот, паметни договори (smart contracts) и интеграции со трансакциски сметки.
                    </p>
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
