import { useId, useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    Download,
    Loader2,
    ShieldAlert,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { telechargerExport } from "../hooks/useStatistiques";
import { FOCUS } from "../components/statistiques/StatsUi";

// Export brut (admin) : cellules, utilisateurs et présences avec leurs clés.

const CHAMP =
    "block w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

const PERIODES = [
    { mois: 3, libelle: "3 derniers mois" },
    { mois: 6, libelle: "6 derniers mois" },
    { mois: 12, libelle: "12 derniers mois" },
];

const ONGLETS = [
    ["Infos", "période, volumes et liaisons entre les onglets"],
    ["Cellules", "toutes les cellules, avec responsable_user_id"],
    ["Utilisateurs", "tous les comptes, avec cellule_id d'appartenance"],
    ["Présences", "présences de la période, avec user_id et cellule_id"],
    ["Présences détaillées", "les mêmes présences, liaisons déjà faites (noms, cellules, statut)"],
];

const ymd = (d) => d.toISOString().slice(0, 10);

/// Période glissante en UTC, bornes incluses, sans dépasser un an.
function periode(mois) {
    const au = new Date();
    const du = new Date(au);
    du.setUTCMonth(du.getUTCMonth() - mois);
    du.setUTCDate(du.getUTCDate() + 1);
    return { du: ymd(du), au: ymd(au) };
}

const frDate = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export default function ExportDonneesPage() {
    const { user } = useAuth();
    const [dates, setDates] = useState(() => periode(6));
    const [etat, setEtat] = useState({ statut: "repos", message: "" });
    const idDu = useId();
    const idAu = useId();
    const enCours = etat.statut === "envoi";

    if (user && user.role !== "ADMIN") {
        return (
            <div className="max-w-3xl mx-auto px-4 py-10">
                <div role="alert" className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <ShieldAlert className="size-5 shrink-0" aria-hidden="true" />
                    <p>L'export des données est réservé aux administrateurs.</p>
                </div>
            </div>
        );
    }

    const datesInvalides = !dates.du || !dates.au || dates.au < dates.du;

    const telecharger = async () => {
        if (datesInvalides || enCours) return;
        setEtat({ statut: "envoi", message: "" });
        try {
            await telechargerExport(
                "/export-donnees",
                { du: dates.du, au: dates.au },
                undefined,
                `export-donnees-msa_${dates.du}_${dates.au}.xlsx`
            );
            setEtat({
                statut: "ok",
                message: `Export du ${frDate(dates.du)} au ${frDate(dates.au)} téléchargé.`,
            });
        } catch (e) {
            setEtat({ statut: "erreur", message: e.message || "Échec de l'export." });
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900">Export des données</h1>
            <p className="mt-1 text-sm text-gray-600">
                Un fichier Excel avec les cellules, les utilisateurs et les présences de la période, reliés par leurs identifiants.
            </p>

            <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="titre-periode">
                <h2 id="titre-periode" className="text-sm font-semibold text-gray-900">Période des présences</h2>
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Périodes rapides">
                    {PERIODES.map((p) => {
                        const actif = JSON.stringify(periode(p.mois)) === JSON.stringify(dates);
                        return (
                            <button
                                key={p.mois}
                                type="button"
                                aria-pressed={actif}
                                onClick={() => setDates(periode(p.mois))}
                                className={`h-9 rounded-full border px-4 text-sm font-medium transition-colors ${FOCUS} ${
                                    actif
                                        ? "border-blue-600 bg-blue-50 text-blue-700"
                                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                {p.libelle}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor={idDu} className="block text-sm text-gray-700 mb-1">Du</label>
                        <input
                            id={idDu}
                            type="date"
                            className={CHAMP}
                            value={dates.du}
                            max={dates.au}
                            onChange={(e) => setDates((d) => ({ ...d, du: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label htmlFor={idAu} className="block text-sm text-gray-700 mb-1">Au</label>
                        <input
                            id={idAu}
                            type="date"
                            className={CHAMP}
                            value={dates.au}
                            min={dates.du}
                            onChange={(e) => setDates((d) => ({ ...d, au: e.target.value }))}
                        />
                    </div>
                </div>
                {datesInvalides && (
                    <p role="alert" className="mt-2 text-sm text-red-600">
                        Choisissez une date de début antérieure à la date de fin (un an maximum).
                    </p>
                )}
            </section>

            <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="titre-contenu">
                <h2 id="titre-contenu" className="text-sm font-semibold text-gray-900">Contenu du fichier</h2>
                <ul className="mt-3 space-y-1.5 text-sm text-gray-700">
                    {ONGLETS.map(([nom, detail]) => (
                        <li key={nom}>
                            <span className="font-medium text-gray-900">{nom}</span> — {detail}
                        </li>
                    ))}
                </ul>
                <p className="mt-3 text-xs text-gray-500">
                    Les présences annulées sont exclues, comme dans le tableau Suivi. Aucun mot de passe ni coordonnée de domicile n'est exporté.
                </p>
            </section>

            <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <ShieldAlert className="size-5 shrink-0" aria-hidden="true" />
                <p>
                    Ce fichier contient des données personnelles (noms, emails, téléphones). Gardez-le dans l'équipe et ne le diffusez pas.
                </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                    type="button"
                    onClick={telecharger}
                    disabled={datesInvalides || enCours}
                    className={`inline-flex h-11 items-center gap-2 rounded-lg bg-green-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
                >
                    {enCours ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                        <Download className="size-4" aria-hidden="true" />
                    )}
                    {enCours ? "Préparation du fichier…" : "Télécharger l'export Excel"}
                </button>
                <div aria-live="polite" className="text-sm">
                    {etat.statut === "ok" && (
                        <span className="inline-flex items-center gap-1.5 text-green-700">
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                            {etat.message}
                        </span>
                    )}
                    {etat.statut === "erreur" && (
                        <span role="alert" className="inline-flex items-center gap-1.5 text-red-600">
                            <AlertCircle className="size-4" aria-hidden="true" />
                            {etat.message}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
