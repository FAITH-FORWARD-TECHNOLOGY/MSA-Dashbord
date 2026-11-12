import { useId, useState } from "react";
import { AlertCircle, CheckCircle2, Download, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { telechargerRepartition, useRepartition } from "../hooks/useRepartition";
import { EtatErreur, EtatVide, FOCUS, Squelette } from "../components/statistiques/StatsUi";
import RepartitionTable from "../components/repartition/RepartitionTable";
import EncartSansQuartier from "../components/repartition/EncartSansQuartier";
import MembresQuartierModal from "../components/repartition/MembresQuartierModal";
import { libelleMembres } from "../utils/repartition";

// Vue globale (admin) : membres par pays, commune et quartier.

const CHAMP =
    "block w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

function Carte({ titre, valeur, detail }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-600">{titre}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{valeur}</p>
            {detail && <p className="mt-1 text-xs text-gray-500">{detail}</p>}
        </div>
    );
}

export default function MembresParQuartierPage() {
    const { user } = useAuth();
    const estAdmin = user?.role === "ADMIN";
    // "" = tous les pays ; "0" = pays non renseigné.
    const [paysId, setPaysId] = useState("");
    const { data, loading, error, interdit, recharger } = useRepartition({ paysId }, estAdmin);
    const [cible, setCible] = useState(null);
    const [exportEtat, setExportEtat] = useState({ statut: "repos", message: "" });
    const idPays = useId();

    if ((user && !estAdmin) || interdit) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-10">
                <div role="alert" className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <ShieldAlert className="size-5 shrink-0" aria-hidden="true" />
                    <p>La répartition des membres par quartier est réservée aux administrateurs.</p>
                </div>
            </div>
        );
    }

    const exporter = async () => {
        if (exportEtat.statut === "envoi") return;
        setExportEtat({ statut: "envoi", message: "" });
        try {
            await telechargerRepartition({ paysId });
            setExportEtat({ statut: "ok", message: "Fichier Excel téléchargé." });
        } catch (e) {
            setExportEtat({ statut: "erreur", message: e.message || "Échec de l'export." });
        }
    };
    const enExport = exportEtat.statut === "envoi";
    const paysChoisi = data?.paysDisponibles.find((p) => String(p.id) === paysId);

    return (
        <div className="mx-auto max-w-5xl space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Membres par quartier</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Où habitent les membres actifs, par pays, commune et quartier, et qui n'a pas encore renseigné son quartier. Les comptes désactivés ne sont pas comptés.
                    </p>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                    <button
                        type="button"
                        onClick={exporter}
                        disabled={enExport || !data}
                        aria-busy={enExport}
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-md bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
                    >
                        {enExport ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <Download className="size-4" aria-hidden="true" />
                        )}
                        {enExport ? "Préparation…" : "Exporter Excel"}
                    </button>
                    <div aria-live="polite" className="text-sm">
                        {exportEtat.statut === "ok" && (
                            <span className="inline-flex items-center gap-1.5 text-green-700">
                                <CheckCircle2 className="size-4" aria-hidden="true" />
                                {exportEtat.message}
                            </span>
                        )}
                        {exportEtat.statut === "erreur" && (
                            <span role="alert" className="inline-flex items-center gap-1.5 text-red-600">
                                <AlertCircle className="size-4" aria-hidden="true" />
                                {exportEtat.message}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="sm:max-w-xs">
                <label htmlFor={idPays} className="mb-1 block text-sm text-gray-700">Pays</label>
                <select
                    id={idPays}
                    className={CHAMP}
                    value={paysId}
                    onChange={(e) => setPaysId(e.target.value)}
                    disabled={!data && loading}
                >
                    <option value="">Tous les pays</option>
                    {(data?.paysDisponibles ?? []).map((p) => (
                        <option key={p.id} value={String(p.id)}>
                            {p.nom} ({p.membres})
                        </option>
                    ))}
                    {/* Pays choisi sans membre : l'option reste visible. */}
                    {paysId !== "" && data && !paysChoisi && <option value={paysId}>Pays sélectionné (0)</option>}
                </select>
            </div>

            {loading && !data ? (
                <Squelette lignes={6} />
            ) : error ? (
                <EtatErreur message={error} onReessayer={recharger} />
            ) : !data ? null : (
                <div className={`space-y-5 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Carte
                            titre="Membres actifs"
                            valeur={data.totalMembres}
                            detail={paysChoisi ? paysChoisi.nom : "Tous les pays"}
                        />
                        <Carte
                            titre="Avec un quartier"
                            valeur={data.avecQuartier}
                            detail={`sur ${libelleMembres(data.totalMembres)}`}
                        />
                        <EncartSansQuartier
                            sansQuartier={data.sansQuartier}
                            total={data.totalMembres}
                            onVoirMembres={(c) => setCible(c)}
                        />
                    </div>

                    {data.totalMembres === 0 ? (
                        <EtatVide
                            titre="Aucun membre"
                            message={paysId === "" ? "Aucun compte actif n'est enregistré." : "Aucun membre actif n'habite dans ce pays."}
                        />
                    ) : (
                        <section className="rounded-xl border border-gray-200 bg-white py-4 shadow-sm" aria-labelledby="titre-repartition">
                            <h2 id="titre-repartition" className="px-4 text-sm font-semibold text-gray-900">
                                Répartition par pays, commune et quartier
                            </h2>
                            <p className="px-4 pb-1 text-xs text-gray-500">
                                Triée par nombre de membres. Cliquez sur un quartier pour voir ses membres.
                            </p>
                            <RepartitionTable
                                pays={data.pays}
                                total={data.totalMembres}
                                onVoirMembres={(c) => setCible(c)}
                                legende="Nombre de membres actifs par pays, commune et quartier"
                            />
                        </section>
                    )}
                </div>
            )}

            <MembresQuartierModal cible={cible} paysId={paysId} onFermer={() => setCible(null)} />
        </div>
    );
}
