import React from 'react';
import { useSimulationStore } from '../store/simulationStore';

// Removed unused Ad and CITY_BG

export const Scene: React.FC = () => {
    const { displays, activeAd } = useSimulationStore();

    return (
        <div className="relative w-full h-full bg-black overflow-hidden group">
            <img
                src="http://127.0.0.1:8000/slikata.png"
                alt="City Street"
                className="w-full h-full object-cover opacity-100" // Reset opacity to full to see hotspots clearly
            />

            {/* Dark overlay for better visibility */}
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />

            {displays.map(display => (
                <div
                    key={display.id}
                    className="absolute bg-black border-2 border-gray-800 shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden transform transition-all hover:scale-105"
                    style={{
                        left: `${display.x}%`,
                        top: `${display.y}%`,
                        width: `${display.width}%`,
                        height: `${display.height}%`,
                        boxShadow: activeAd ? '0 0 15px rgba(50, 200, 255, 0.3)' : 'none'
                    }}
                >
                    {/* Screen Content */}
                    <div className="w-full h-full relative flex items-center justify-center bg-gray-900 text-white">
                        {activeAd ? (
                            activeAd.type === 'image' ? (
                                <img src={activeAd.content_path} alt={activeAd.name} className="w-full h-full object-cover" />
                            ) : (
                                <div
                                    className="p-1 text-center font-bold leading-tight text-neon-blue flex items-center justify-center h-full w-full break-words whitespace-pre-wrap"
                                    style={{ fontSize: `${Math.max(0.4, display.width / 5)}vw` }} // Dynamic scaling: ~0.7vw for 3.5% width
                                >
                                    {activeAd.content_path}
                                </div>
                            )
                        ) : (
                            <div className="text-xs text-gray-600">OFFLINE</div>
                        )}

                        {/* Glare/Reflection overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10 pointer-events-none" />
                    </div>

                    {/* Stand/Pole visualization (simple line below) - Optional decoration */}
                    < div className="absolute -bottom-[500%] left-1/2 w-2 h-[500%] bg-gray-800 -translate-x-1/2 -z-10" />
                </div>
            ))
            }
        </div >
    );
};
