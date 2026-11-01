import { useEffect } from 'react';
import { create } from 'zustand';
import { DEFAULT_PROTOCOL, PROTOCOLS, isProtocol } from '@/lib/config';
import type { Protocol } from '@/lib/config';

const PROTOCOL_KEY = 'stablepay_protocol';

interface ProtocolState {
    protocol: Protocol;
    hydrated: boolean;
    setProtocol: (protocol: Protocol) => void;
    hydrate: () => void;
}

const useProtocolStore = create<ProtocolState>((set, get) => ({
    protocol: DEFAULT_PROTOCOL,
    hydrated: false,
    setProtocol: (protocol) => {
        try {
            localStorage.setItem(PROTOCOL_KEY, protocol);
        } catch (e) {
            console.warn('Failed to persist protocol selection:', e);
        }
        set({ protocol, hydrated: true });
    },
    hydrate: () => {
        if (get().hydrated) return;
        let stored: string | null = null;
        try {
            stored = localStorage.getItem(PROTOCOL_KEY);
        } catch (e) {
            console.warn('Failed to load protocol selection:', e);
        }
        set(isProtocol(stored) ? { protocol: stored, hydrated: true } : { hydrated: true });
    },
}));

export function useProtocol() {
    const protocol = useProtocolStore((state) => state.protocol);
    const setProtocol = useProtocolStore((state) => state.setProtocol);
    const hydrate = useProtocolStore((state) => state.hydrate);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    return {
        protocol,
        setProtocol,
        protocolConfig: PROTOCOLS[protocol],
    };
}
