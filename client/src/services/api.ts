import axios from 'axios';
import type { Ad, Display } from '../types';
import { format } from 'date-fns';

// Fully dynamic runtime URL resolution to prevent build-time static stripping
let apiUrl = 'http://localhost:8000/api';

if (typeof window !== 'undefined') {
    // If the port is not our local Vite dev server port (5177), and we are not on localhost/127.0.0.1, use dynamic origin
    if (window.location.port !== '5177' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        apiUrl = `${window.location.origin}/api`;
    }
}

export const API_BASE_URL = apiUrl;
export const SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

export const api = {
    init: async () => {
        const response = await client.get('/init');
        return response.data as { displays: Display[], server_time: string };
    },

    getActiveAd: async (date: Date) => {
        const timeStr = format(date, 'HH:mm:ss');
        const dateStr = format(date, 'yyyy-MM-dd');
        const response = await client.get(`/active-ad`, {
            params: {
                timestamp: timeStr,
                date: dateStr
            }
        });
        return response.data.ad as Ad | null;
    }
};
