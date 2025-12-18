import axios from 'axios';
import type { Ad, Display } from '../types';
import { format } from 'date-fns';

const client = axios.create({
    baseURL: 'http://127.0.0.1:8000/api', // Hardcoded for demo
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
