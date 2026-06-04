import axios from 'axios';
import type { Ad, Display } from '../types';
import { format } from 'date-fns';

export const SERVER_URL = (import.meta.env.VITE_API_URL as string)?.replace(/\/api\/?$/, '') || 'http://localhost:8000';
export const API_BASE_URL = `${SERVER_URL}/api`;

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
