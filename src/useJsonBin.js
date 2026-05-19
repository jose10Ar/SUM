/**
 * useJsonBin.js
 * Hook para sincronizar estado con JSONBin.io, con fallback a localStorage.
 *
 * Estrategia de sincronización:
 *  - Al montar: intenta cargar desde JSONBin. Si falla, usa localStorage.
 *  - Al cambiar el estado: guarda en localStorage inmediatamente (optimista)
 *    y en JSONBin con debounce de 1.5 s para evitar demasiadas escrituras.
 *  - Si JSONBin no está configurado, funciona como localStorage puro.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { readBin, writeBin } from './jsonbinService';

const DEBOUNCE_MS = 1500;
const CONFIG_KEY = 'sum-jsonbin-config';

/** Lee la configuración guardada (binId + apiKey) */
export function loadJsonBinConfig() {
    try {
        const raw = localStorage.getItem(CONFIG_KEY);
        return raw ? JSON.parse(raw) : { binId: '', apiKey: '' };
    } catch {
        return { binId: '', apiKey: '' };
    }
}

/** Persiste la configuración */
export function saveJsonBinConfig(config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

/**
 * @param {string} localKey   - Clave de localStorage (fallback)
 * @param {any}    fallback    - Valor por defecto
 * @param {object} jsonBinCfg - { binId, apiKey } (puede estar vacío)
 * @returns {{ value, setValue, syncStatus, lastSynced, manualSync }}
 */
export function useJsonBin(localKey, fallback, jsonBinCfg) {
    // --- Estado principal ---
    const [value, setValueState] = useState(() => {
        try {
            const stored = localStorage.getItem(localKey);
            return stored ? JSON.parse(stored) : fallback;
        } catch {
            return fallback;
        }
    });

    // 'idle' | 'syncing' | 'success' | 'error'
    const [syncStatus, setSyncStatus] = useState('idle');
    const [lastSynced, setLastSynced] = useState(null);
    const [syncError, setSyncError] = useState(null);

    const debounceRef = useRef(null);
    const isConfigured = !!(jsonBinCfg?.binId && jsonBinCfg?.apiKey);

    // --- Carga inicial desde JSONBin ---
    useEffect(() => {
        if (!isConfigured) return;

        setSyncStatus('syncing');
        readBin(jsonBinCfg.binId, jsonBinCfg.apiKey)
            .then((remote) => {
                if (Array.isArray(remote) && remote.length > 0) {
                    setValueState(remote);
                    localStorage.setItem(localKey, JSON.stringify(remote));
                }
                setSyncStatus('success');
                setLastSynced(new Date());
                setSyncError(null);
            })
            .catch((err) => {
                console.warn('[JSONBin] Error al cargar datos remotos:', err.message);
                setSyncStatus('error');
                setSyncError(err.message);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jsonBinCfg?.binId, jsonBinCfg?.apiKey]);

    // --- Wrapper de set que actualiza local + programa sync remota ---
    const setValue = useCallback(
        (updater) => {
            setValueState((prev) => {
                const next = typeof updater === 'function' ? updater(prev) : updater;

                // Guardar en localStorage inmediatamente
                localStorage.setItem(localKey, JSON.stringify(next));

                // Programar escritura a JSONBin con debounce
                if (isConfigured) {
                    clearTimeout(debounceRef.current);
                    setSyncStatus('syncing');
                    debounceRef.current = setTimeout(() => {
                        writeBin(jsonBinCfg.binId, jsonBinCfg.apiKey, next)
                            .then(() => {
                                setSyncStatus('success');
                                setLastSynced(new Date());
                                setSyncError(null);
                            })
                            .catch((err) => {
                                console.warn('[JSONBin] Error al guardar:', err.message);
                                setSyncStatus('error');
                                setSyncError(err.message);
                            });
                    }, DEBOUNCE_MS);
                }

                return next;
            });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [localKey, isConfigured, jsonBinCfg?.binId, jsonBinCfg?.apiKey]
    );

    // Sync manual forzada
    const manualSync = useCallback(() => {
        if (!isConfigured) return;
        setSyncStatus('syncing');
        readBin(jsonBinCfg.binId, jsonBinCfg.apiKey)
            .then((remote) => {
                if (Array.isArray(remote)) {
                    setValueState(remote);
                    localStorage.setItem(localKey, JSON.stringify(remote));
                }
                setSyncStatus('success');
                setLastSynced(new Date());
                setSyncError(null);
            })
            .catch((err) => {
                setSyncStatus('error');
                setSyncError(err.message);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConfigured, jsonBinCfg?.binId, jsonBinCfg?.apiKey, localKey]);

    return { value, setValue, syncStatus, lastSynced, syncError, manualSync, isConfigured };
}
