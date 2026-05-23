import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

// Les 5 clés Setting consommées par l'app mobile pour le version check.
// Mêmes noms que DigiFinance pour cohérence cross-projet (cf. seeder
// DigiFinance + version_check_service.dart). La clé release_notes est
// spécifique à MSA — DigiFinance ne l'utilise pas.
export const VERSION_SETTING_KEYS = {
    appVersionMax: 'app.version.max',
    appVersionRecommended: 'app.version.recommended',
    appStoreAndroid: 'app.store.android',
    appStoreIos: 'app.store.ios',
    appVersionReleaseNotes: 'app.version.release_notes',
};

// Hook qui charge tous les settings et expose les valeurs liées à la
// version, plus un helper d'upsert par clé. Le backend gère upsert dans
// un seul endpoint PUT /settings (cf. setting.controller.ts).
export function useAppVersion() {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${API_BASE_URL}/settings`);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des paramètres');
            }
            const list = await response.json();
            // Convertit [{key, value, updatedAt}, ...] → { key: {value, updatedAt} }
            const map = {};
            for (const row of list) {
                map[row.key] = { value: row.value, updatedAt: row.updatedAt };
            }
            setSettings(map);
        } catch (err) {
            setError(err.message || 'Échec du chargement');
        } finally {
            setLoading(false);
        }
    }, []);

    // Upsert d'une seule clé. Appelé une fois par champ modifié.
    const upsertSetting = useCallback(async (key, value) => {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'PUT',
            headers: { accept: '*/*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value: value ?? '' }),
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.message || `Erreur ${response.status}`);
        }
        const updated = await response.json();
        setSettings((prev) => ({
            ...prev,
            [updated.key]: { value: updated.value, updatedAt: updated.updatedAt },
        }));
        return updated;
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Helper de lecture par clé (chaîne vide par défaut).
    const getValue = (key) => settings[key]?.value ?? '';

    return {
        settings,
        getValue,
        loading,
        error,
        refetch: fetchSettings,
        upsertSetting,
    };
}
