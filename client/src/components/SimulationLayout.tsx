import React, { useEffect, useState } from 'react';
import { Scene } from './Scene';
import { TimeControls } from './TimeControls';
import { AdminPanel } from './AdminPanel';
import { api } from '../services/api';
import { useSimulationStore } from '../store/simulationStore';

export const SimulationLayout: React.FC = () => {
    const { setFiles } = useSimulationStore();
    const [showAdmin, setShowAdmin] = useState(false);

    useEffect(() => {
        // Init Load
        api.init().then(data => {
            setFiles(data.displays);
        }).catch(err => console.error("Failed to init", err));
    }, []);

    return (
        <div className="flex flex-col h-screen w-screen bg-black text-white overflow-hidden">
            {/* Top Left: Clock & Controls */}
            <div className="absolute top-6 left-6 z-50 flex items-center gap-6 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl">
                <ClockDisplay />
                <div className="h-8 w-px bg-white/20" />
                <SimulationControls />
            </div>
            {/* Top Bar */}
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={() => setShowAdmin(true)}
                    className="bg-gray-800/80 hover:bg-gray-700 backdrop-blur px-4 py-2 rounded-full border border-gray-600 text-sm font-bold shadow-lg"
                >
                    ⚙️ Admin Panel
                </button>
            </div>

            {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

            <div className="flex-1 relative">
                <Scene />
            </div>

            <div className="h-0 overflow-hidden">
                <TimeControls />
            </div>
        </div>
    );
};

import { format } from 'date-fns';
import { Play, Pause, FastForward } from 'lucide-react';

const ClockDisplay: React.FC = () => {
    const { currentTime } = useSimulationStore();
    return (
        <div>
            <div className="text-4xl font-black tracking-widest font-mono text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                {format(currentTime, 'HH:mm:ss')}
            </div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Simulation Time</div>
        </div>
    );
};

const SimulationControls: React.FC = () => {
    const { isPlaying, togglePlay, setSpeed, playbackSpeed } = useSimulationStore();

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={togglePlay}
                className={`p-3 rounded-xl transition-all ${isPlaying ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-green-600 hover:bg-green-500 text-white'} shadow-lg`}
                title={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>

            <button
                onClick={() => setSpeed(playbackSpeed === 1 ? 10 : 1)}
                className={`p-3 rounded-xl transition-all flex items-center gap-2 font-bold ${playbackSpeed > 1 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                title="Fast Forward"
            >
                <FastForward size={20} fill="currentColor" />
                <span className="text-xs">{playbackSpeed > 1 ? `${playbackSpeed}x` : '1x'}</span>
            </button>
        </div>
    );
};
