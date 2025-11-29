import { create } from "zustand";

export interface IceServerConfig {
    urls: string;
    username?: string;
    credential?: string;
}

export interface StunConfig {
    iceServers: IceServerConfig[];
}

interface StunStore {
    config: StunConfig;
    setConfig: (config: StunConfig) => void;
    resetToDefaults: () => void;
}

const STORAGE_KEY = "stunConfig";

const DEFAULT_CONFIG: StunConfig = {
    iceServers: [
        { urls: "stun:relay1.expressturn.com:3480" },
        {
            urls: "turn:relay1.expressturn.com:3480?transport=tcp",
            username: "000000002079469016",
            credential: "tfkqDXh0R7OgxGs3h9V6HcJ4mjo=",
        },
    ],
};

const loadConfig = (): StunConfig => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_CONFIG;
        return JSON.parse(raw);
    } catch {
        return DEFAULT_CONFIG;
    }
};

export const useStunStore = create<StunStore>((set) => ({
    config: loadConfig(),

    setConfig: (config) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        set({ config });
    },

    resetToDefaults: () => {
        localStorage.removeItem(STORAGE_KEY);
        set({ config: DEFAULT_CONFIG });
    },
}));
