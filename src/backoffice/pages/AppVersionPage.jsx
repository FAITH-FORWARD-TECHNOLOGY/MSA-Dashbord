import React, { useEffect, useMemo, useState } from "react";
import { useAppVersion, VERSION_SETTING_KEYS } from "../hooks/useAppVersion";

// Compare deux versions semver "X.Y.Z" — retourne -1 / 0 / 1.
// Utilisée côté client pour la validation inline (warning si min > latest).
const compareVersions = (a, b) => {
    const pa = a.split(".").map((s) => parseInt(s, 10));
    const pb = b.split(".").map((s) => parseInt(s, 10));
    if (pa.some(isNaN) || pb.some(isNaN)) return 0;
    for (let i = 0; i < 3; i++) {
        const va = pa[i] ?? 0;
        const vb = pb[i] ?? 0;
        if (va < vb) return -1;
        if (va > vb) return 1;
    }
    return 0;
};

// Page admin pour piloter le version check de l'app mobile via la table
// Setting générique. Les 5 clés `app.version.*` / `app.store.*` sont
// exposées comme un formulaire unique pour rester ergonomique côté admin.
const AppVersionPage = () => {
    const { settings, getValue, loading, error, upsertSetting } = useAppVersion();

    const [form, setForm] = useState({
        appVersionRecommended: "",
        appVersionMax: "",
        appVersionReleaseNotes: "",
        appStoreAndroid: "",
        appStoreIos: "",
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    // Synchronise le formulaire quand les settings arrivent du backend.
    useEffect(() => {
        setForm({
            appVersionRecommended: getValue(VERSION_SETTING_KEYS.appVersionRecommended),
            appVersionMax: getValue(VERSION_SETTING_KEYS.appVersionMax),
            appVersionReleaseNotes: getValue(VERSION_SETTING_KEYS.appVersionReleaseNotes),
            appStoreAndroid: getValue(VERSION_SETTING_KEYS.appStoreAndroid),
            appStoreIos: getValue(VERSION_SETTING_KEYS.appStoreIos),
        });
        // getValue est recréée à chaque render mais le contenu de settings
        // est ce qui compte réellement → on dépend de settings.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (message) setMessage("");
    };

    // Validation client avant envoi
    const semverRegex = /^\d+\.\d+\.\d+$/;
    const recommendedValid = semverRegex.test(form.appVersionRecommended);
    const maxValid = semverRegex.test(form.appVersionMax);
    const orderValid =
        recommendedValid &&
        maxValid &&
        compareVersions(form.appVersionMax, form.appVersionRecommended) <= 0;
    const canSave = recommendedValid && maxValid && orderValid && !saving;

    // Timestamp le plus récent parmi les 5 settings affichés.
    const lastUpdatedAt = useMemo(() => {
        const timestamps = Object.values(VERSION_SETTING_KEYS)
            .map((k) => settings[k]?.updatedAt)
            .filter(Boolean)
            .map((s) => new Date(s).getTime());
        return timestamps.length ? new Date(Math.max(...timestamps)) : null;
    }, [settings]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");
        try {
            // Un upsert par clé. On envoie tout en parallèle pour la perf.
            await Promise.all([
                upsertSetting(
                    VERSION_SETTING_KEYS.appVersionRecommended,
                    form.appVersionRecommended.trim(),
                ),
                upsertSetting(
                    VERSION_SETTING_KEYS.appVersionMax,
                    form.appVersionMax.trim(),
                ),
                upsertSetting(
                    VERSION_SETTING_KEYS.appVersionReleaseNotes,
                    form.appVersionReleaseNotes.trim(),
                ),
                upsertSetting(
                    VERSION_SETTING_KEYS.appStoreAndroid,
                    form.appStoreAndroid.trim(),
                ),
                upsertSetting(
                    VERSION_SETTING_KEYS.appStoreIos,
                    form.appStoreIos.trim(),
                ),
            ]);
            setMessage("Configuration enregistrée avec succès");
        } catch (err) {
            setMessage(`Erreur : ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 max-w-2xl">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">
                Configuration de version
            </h2>
            <p className="text-sm text-gray-600 mb-6">
                Pilote l'affichage du modal de mise à jour dans l'app mobile.
                Les utilisateurs sous la version minimale seront forcés de
                mettre à jour.
            </p>

            {loading && <p className="text-blue-600">Chargement...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && (
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4 bg-white p-5 rounded-md shadow-sm border border-gray-200"
                >
                    {/* Dernière version (app.version.recommended) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dernière version disponible *
                        </label>
                        <input
                            type="text"
                            name="appVersionRecommended"
                            value={form.appVersionRecommended}
                            onChange={handleChange}
                            placeholder="1.2.0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Clé Setting : <code>app.version.recommended</code>
                        </p>
                        {!recommendedValid && form.appVersionRecommended && (
                            <p className="text-xs text-red-600 mt-1">
                                Format attendu : X.Y.Z (ex: 1.2.0)
                            </p>
                        )}
                    </div>

                    {/* Version minimale (app.version.max) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Version minimale fonctionnelle *
                        </label>
                        <input
                            type="text"
                            name="appVersionMax"
                            value={form.appVersionMax}
                            onChange={handleChange}
                            placeholder="1.0.0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Clé Setting : <code>app.version.max</code>. Les
                            utilisateurs en-dessous verront un modal bloquant.
                        </p>
                        {!maxValid && form.appVersionMax && (
                            <p className="text-xs text-red-600 mt-1">
                                Format attendu : X.Y.Z
                            </p>
                        )}
                        {recommendedValid && maxValid && !orderValid && (
                            <p className="text-xs text-red-600 mt-1">
                                La version minimale ne peut pas être
                                supérieure à la dernière version.
                            </p>
                        )}
                    </div>

                    {/* Notes de release (optionnelles) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes de release (optionnel)
                        </label>
                        <textarea
                            name="appVersionReleaseNotes"
                            value={form.appVersionReleaseNotes}
                            onChange={handleChange}
                            placeholder="Corrections de bugs et améliorations..."
                            rows="4"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Clé Setting : <code>app.version.release_notes</code>.
                            Affichées dans le modal de mise à jour si renseignées.
                        </p>
                    </div>

                    {/* URL Play Store */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL Play Store (Android)
                        </label>
                        <input
                            type="url"
                            name="appStoreAndroid"
                            value={form.appStoreAndroid}
                            onChange={handleChange}
                            placeholder="https://play.google.com/store/apps/details?id=com.faithforward.msa"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Clé Setting : <code>app.store.android</code>
                        </p>
                    </div>

                    {/* URL App Store */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL App Store (iOS)
                        </label>
                        <input
                            type="url"
                            name="appStoreIos"
                            value={form.appStoreIos}
                            onChange={handleChange}
                            placeholder="https://apps.apple.com/app/idXXXXXXXXX"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Clé Setting : <code>app.store.ios</code>. Laisser
                            vide tant que l'app iOS n'est pas publiée.
                        </p>
                    </div>

                    {/* Affichage de la dernière mise à jour */}
                    {lastUpdatedAt && (
                        <p className="text-xs text-gray-500">
                            Dernière mise à jour :{" "}
                            {lastUpdatedAt.toLocaleString("fr-FR")}
                        </p>
                    )}

                    {/* Message de retour */}
                    {message && (
                        <div
                            className={`p-3 rounded text-sm ${
                                message.startsWith("Erreur")
                                    ? "bg-red-100 border border-red-400 text-red-700"
                                    : "bg-green-100 border border-green-400 text-green-700"
                            }`}
                        >
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!canSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                </form>
            )}
        </div>
    );
};

export default AppVersionPage;
