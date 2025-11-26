import { create } from 'zustand';

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

export const useStunStore = create<StunStore>((set) => ({
    config: DEFAULT_CONFIG,
    setConfig: (config) => set({ config }),
    resetToDefaults: () => set({ config: DEFAULT_CONFIG }),
}));
