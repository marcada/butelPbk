// No changes needed here, just verifying content
export interface Display {
    id: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Ad {
    id: number;
    name: string;
    type: 'image' | 'text';
    content_path: string;
    duration: number;
}

export interface SimulationState {
    currentTime: Date;
    isPlaying: boolean;
    playbackSpeed: number; // 1, 10, 50, 100
    displays: Display[];
    activeAd: Ad | null;

    // Actions
    setFiles: (displays: Display[]) => void;
    togglePlay: () => void;
    setSpeed: (speed: number) => void;
    updateTime: (ms: number) => void;
    setActiveAd: (ad: Ad | null) => void;
    // Helper to jump to specific time
    setTime: (date: Date) => void;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
}

export interface Post {
    id: number;
    title: string;
    slug: string;
    content: string;
    image_path: string;
    category_id: number;
    category?: Category;
    created_at: string;
}

export interface Event {
    id: number;
    title: string;
    description: string;
    date: string;
    location: string;
    image_path: string;
    created_at: string;
}
