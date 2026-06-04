import React, { useEffect } from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { api } from '../services/api';
import { Play, Pause } from 'lucide-react';
import { format } from 'date-fns';

export const TimeControls: React.FC = () => {
    const {
        currentTime, isPlaying, playbackSpeed,
        togglePlay, setSpeed, updateTime, setActiveAd,
        setTime
    } = useSimulationStore();

    useEffect(() => {
        let interval: any;

        if (isPlaying) {
            interval = setInterval(() => {
                // Advance time: 1 real second = 1 second * speed
                // We run loop every 1000ms / speed to make UI smooth? No, run at 100ms
                // Amount to add = 100ms * speed
                const step = 100 * playbackSpeed;
                updateTime(step);
            }, 100);
        }

        return () => clearInterval(interval);
    }, [isPlaying, playbackSpeed, updateTime]);

    // Fetch active ad every simulated 10 minutes OR when time changes significantly?
    // Better: Fetch every X real seconds based on current time
    // For demo simplicity, let's fetch every 1 real second if playing, 
    // or useEffect on currentTime with debounce.

    // Fetch active ad logic
    useEffect(() => {
        const fetchAd = async () => {
            try {
                const ad = await api.getActiveAd(currentTime);
                setActiveAd(ad);
            } catch (e) {
                console.error(e);
            }
        };

        // Determine fetch interval based on playback speed
        // If speed is 1x, fetch every 1s. If 10x, fetch every 200ms? 
        // Actually, we just need to ensuring we sample often enough to catch the 20s transition.
        // Let's just run a fixed interval of 1 second (1000ms real time). 
        // Even at 500x speed, 1 real second = 500 simulated seconds, so we might skip ads, but that's expected.
        // For normal demo (1x-10x), 1s polling is fine.

        fetchAd(); // Fetch immediately on mount/update? No, prevent double fetch.

        const interval = setInterval(fetchAd, 1000);
        return () => clearInterval(interval);
    }, [currentTime]); // Wait, if we depend on currentTime, we re-create interval every 100ms.
    // BUG FIX: Remove currentTime dependency. Let the interval handle getting the *ref* to currentTime?
    // React state `currentTime` is closed over. We need a way to access latest.
    // Actually, simply depending on `Math.floor(currentTime.getTime() / 5000)` ?
    // Or just run interval independent of currentTime updates, but pass current `useSimulationStore.getState().currentTime`?
    // But we are inside a component.

    // BETTER APPROACH:
    // Update fetch only when the "20s slot" changes?
    // Calculated from currentTime.

    const timeSlot = Math.floor(currentTime.getTime() / 20000); // Change every 20s

    useEffect(() => {
        const fetchAd = async () => {
            try {
                const ad = await api.getActiveAd(currentTime);
                setActiveAd(ad);
            } catch (e) {
                console.error(e);
            }
        };
        fetchAd();
    }, [timeSlot]); // Only re-run when we cross a 20s boundary!

    return (
        <div className="bg-gray-900 border-t border-gray-800 p-4 flex items-center justify-between text-white shadow-2xl">
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Simulated Time</div>
                    <div className="text-4xl font-mono font-bold text-blue-400">
                        {format(currentTime, 'HH:mm:ss')}
                    </div>
                    <div className="text-sm text-gray-500">{format(currentTime, 'yyyy-MM-dd')}</div>
                </div>

                <div className="h-10 w-px bg-gray-700 mx-2" />

                <div className="flex items-center gap-2">
                    <button
                        onClick={togglePlay}
                        className={`p-4 rounded-full transition-colors ${isPlaying ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                    </button>

                    <div className="flex bg-gray-800 rounded-lg p-1 ml-4 border border-gray-700">
                        {[1, 10, 50, 100, 500].map(speed => (
                            <button
                                key={speed}
                                onClick={() => setSpeed(speed)}
                                className={`px-3 py-1 rounded text-sm font-bold transition-all ${playbackSpeed === speed ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                            >
                                {speed}x
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <button onClick={() => setTime(new Date(currentTime.setHours(8, 0, 0, 0)))} className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 text-sm">Jump to Morning</button>
                <button onClick={() => setTime(new Date(currentTime.setHours(18, 0, 0, 0)))} className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 text-sm">Jump to Evening</button>
            </div>
        </div>
    );
};
