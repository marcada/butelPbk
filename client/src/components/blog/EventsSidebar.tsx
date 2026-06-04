import { API_BASE_URL, SERVER_URL } from '../../services/api';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import type { Event } from '../../types';

export const EventsSidebar: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        fetch('${API_BASE_URL}/events')
            .then(res => res.json())
            .then(data => setEvents(data))
            .catch(err => console.error("Failed to load events", err));
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const month = date.toLocaleString('default', { month: 'short' });
        const day = date.getDate();
        const time = date.toLocaleString('default', { hour: 'numeric', minute: '2-digit', hour12: true });
        return { month, day, time };
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 h-fit sticky top-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Upcoming Events
            </h3>

            <div className="space-y-6">
                {events.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm">No upcoming events.</div>
                ) : (
                    events.map((event) => {
                        const { month, day, time } = formatDate(event.date);
                        return (
                            <div key={event.id} className="group cursor-pointer">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center justify-center bg-indigo-50 rounded-lg p-2 min-w-[60px] text-indigo-700 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                        <span className="text-sm">{month}</span>
                                        <span className="text-xl">{day}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                                            {event.title}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                            <Clock className="w-3 h-3" />
                                            <span>{time}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                            <MapPin className="w-3 h-3" />
                                            <span>{event.location}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100 mt-4 w-full" />
                            </div>
                        );
                    })
                )}
            </div>

            <button className="w-full mt-6 py-3 px-4 bg-indigo-50 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-600 hover:text-white transition-all duration-300 text-sm">
                View All Events
            </button>
        </div>
    );
};
