import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, X } from "lucide-react";
import { usePrayerCategories } from "../hooks/usePrayerCategories";
import { Squelette } from "../components/statistiques/StatsUi";
import { moveId } from "../utils/announcements";
import {
    ARCHIVAGE_MAX,
    ARCHIVAGE_MIN,
    LIBELLE_MAX,
    delaiModifiable,
    estVerrouillee,
    validerJours,
    validerLibelle,
} from "../utils/prayerCategories";

const FOCUS =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1";
const iconBtn = `p-2 text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-600 rounded ${FOCUS}`;
const inputClass = `px-3 py-2 border border-gray-300 rounded-md ${FOCUS}`;
const primaryBtn = `px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 ${FOCUS}`;

// Page admin : catégories des sujets de prière + délai d'archivage automatique.
const PrayerCategoriesPage = () => {
    const {
        categories, jours, loading, error,
        recharger, creer, modifier, reordonner, enregistrerJours,
    } = usePrayerCategories();

    const [nouveau, setNouveau] = useState("");
    const [editId, setEditId] = useState(null);
    const [editLibelle, setEditLibelle] = useState("");
    const [message, setMessage] = useState(null); // { type: "ok" | "erreur", texte }
    const [busy, setBusy] = useState(false);
    const [erreurAjout, setErreurAjout] = useState(""); // erreur affichée sous le champ d'ajout

    const [joursSaisis, setJoursSaisis] = useState(null);
    const delaiOk = delaiModifiable(jours, loading);
    const valeurJours = joursSaisis ?? (jours === null ? "" : String(jours));
    const erreurJours = delaiOk ? validerJours(valeurJours) : "";

    // Focus rendu au bouton crayon quand le renommage se ferme.
    const crayons = useRef({});
    const [focusCrayon, setFocusCrayon] = useState(null);
    useEffect(() => {
        if (focusCrayon !== null && editId === null) {
            crayons.current[focusCrayon]?.focus();
            setFocusCrayon(null);
        }
    }, [focusCrayon, editId]);
    const fermerEdition = (id) => {
        setEditId(null);
        setFocusCrayon(id);
    };

    const executer = async (action, succes, surErreur) => {
        setBusy(true);
        setMessage(null);
        try {
            await action();
            if (succes) setMessage({ type: "ok", texte: succes });
            return true;
        } catch (err) {
            if (surErreur) surErreur(err.message);
            else setMessage({ type: "erreur", texte: err.message });
            return false;
        } finally {
            setBusy(false);
        }
    };

    const ajouter = async (e) => {
        e.preventDefault();
        setErreurAjout("");
        const err = validerLibelle(nouveau);
        if (err) {
            setMessage(null);
            return setErreurAjout(err);
        }
        if (await executer(() => creer(nouveau.trim()), "Catégorie créée.", setErreurAjout)) {
            setNouveau("");
        }
    };

    const commencerEdition = (c) => {
        setEditId(c.id);
        setEditLibelle(c.libelle);
        setMessage(null);
    };

    const validerEdition = async (c) => {
        const err = validerLibelle(editLibelle);
        if (err) return setMessage({ type: "erreur", texte: err });
        if (editLibelle.trim() === c.libelle) return fermerEdition(c.id);
        if (await executer(() => modifier(c.id, { libelle: editLibelle.trim() }), "Catégorie renommée.")) {
            fermerEdition(c.id);
        }
    };

    const deplacer = (c, delta) => {
        const ids = moveId(categories.map((x) => x.id), c.id, delta);
        if (ids) executer(() => reordonner(ids));
    };

    const basculer = (c) =>
        executer(() => modifier(c.id, { actif: !c.actif }));

    const sauverJours = async (e) => {
        e.preventDefault();
        if (!delaiOk || erreurJours) return;
        if (await executer(() => enregistrerJours(valeurJours.trim()), "Délai d'archivage enregistré.")) {
            setJoursSaisis(null);
        }
    };

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Sujets de prière</h2>
            <p className="text-sm text-gray-600 mb-6">
                Catégories proposées dans l'app et délai d'archivage automatique.
                Une catégorie n'est jamais supprimée : désactivez-la pour la
                retirer de l'app (les sujets existants la conservent).
            </p>

            <div role="status" aria-live="polite" className="mb-4 min-h-6">
                {message && (
                    <p className={message.type === "ok" ? "text-green-700" : "text-red-600"}>
                        {message.texte}
                    </p>
                )}
            </div>

            <section aria-labelledby="titre-archivage" className="bg-white p-5 rounded-md shadow-sm border border-gray-200 mb-6">
                <h3 id="titre-archivage" className="text-lg font-semibold text-gray-800 mb-3">
                    Archivage automatique
                </h3>
                <form onSubmit={sauverJours}>
                    <label htmlFor="prieres-jours" className="block text-sm font-medium text-gray-700 mb-1">
                        Archiver automatiquement les sujets après N jours
                    </label>
                    <div className="flex items-stretch gap-3">
                        <input
                            id="prieres-jours"
                            type="number"
                            inputMode="numeric"
                            min={ARCHIVAGE_MIN}
                            max={ARCHIVAGE_MAX}
                            step={1}
                            value={valeurJours}
                            onChange={(e) => setJoursSaisis(e.target.value)}
                            aria-invalid={erreurJours ? "true" : "false"}
                            aria-describedby="prieres-jours-aide"
                            className={`w-32 ${inputClass}`}
                            disabled={!delaiOk}
                        />
                        <button type="submit" className={primaryBtn} disabled={busy || !delaiOk || Boolean(erreurJours)}>
                            Enregistrer
                        </button>
                    </div>
                </form>
                {!loading && jours === null && (
                    <p className="text-sm text-red-600 mt-2" role="alert">
                        Délai actuel non chargé : modification impossible.{" "}
                        <button type="button" onClick={recharger} className={`underline ${FOCUS}`}>
                            Réessayer
                        </button>
                    </p>
                )}
                <p id="prieres-jours-aide" className={`text-xs mt-2 ${erreurJours ? "text-red-600" : "text-gray-500"}`}>
                    {erreurJours || `Entre ${ARCHIVAGE_MIN} et ${ARCHIVAGE_MAX} jours (30 par défaut). Calculé à l'affichage dans l'app.`}
                </p>
            </section>

            <section aria-labelledby="titre-categories" className="bg-white p-5 rounded-md shadow-sm border border-gray-200">
                <h3 id="titre-categories" className="text-lg font-semibold text-gray-800 mb-3">
                    Catégories
                </h3>

                <form onSubmit={ajouter} className="mb-5">
                    <label htmlFor="prieres-nouvelle" className="block text-sm font-medium text-gray-700 mb-1">
                        Nouvelle catégorie
                    </label>
                    <div className="flex flex-wrap items-stretch gap-3">
                        <input
                            id="prieres-nouvelle"
                            type="text"
                            maxLength={LIBELLE_MAX}
                            value={nouveau}
                            onChange={(e) => setNouveau(e.target.value)}
                            placeholder="Ex. : Jeunesse"
                            aria-invalid={erreurAjout ? "true" : "false"}
                            aria-describedby={erreurAjout ? "prieres-nouvelle-erreur" : undefined}
                            className={`w-64 ${inputClass}`}
                        />
                        <button type="submit" className={primaryBtn} disabled={busy || !nouveau.trim()}>
                            Ajouter
                        </button>
                    </div>
                    {erreurAjout && (
                        <p id="prieres-nouvelle-erreur" role="alert" className="mt-2 text-sm text-red-600">
                            {erreurAjout}
                        </p>
                    )}
                </form>

                {loading && <Squelette lignes={3} />}
                {error && !loading && (
                    <div role="alert" className="text-red-600">
                        <p>{error}</p>
                        <button type="button" onClick={recharger} className={`mt-2 underline ${FOCUS}`}>
                            Réessayer
                        </button>
                    </div>
                )}
                {!loading && !error && categories.length === 0 && (
                    <p className="text-gray-600">Aucune catégorie pour le moment.</p>
                )}

                {!loading && !error && categories.length > 0 && (
                    <ul className="divide-y divide-gray-200" aria-label="Catégories de sujets de prière">
                        {categories.map((c, index) => {
                            const verrou = estVerrouillee(c);
                            const enEdition = editId === c.id;
                            return (
                                <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                                    <span className="w-6 text-gray-600" aria-hidden="true">{index + 1}</span>
                                    <div className="flex-1 min-w-48">
                                        {enEdition ? (
                                            <form
                                                onSubmit={(e) => { e.preventDefault(); validerEdition(c); }}
                                                className="flex items-center gap-2"
                                            >
                                                <label htmlFor={`cat-${c.id}-libelle`} className="sr-only">
                                                    Nouveau libellé de « {c.libelle} »
                                                </label>
                                                <input
                                                    id={`cat-${c.id}-libelle`}
                                                    autoFocus
                                                    type="text"
                                                    maxLength={LIBELLE_MAX}
                                                    value={editLibelle}
                                                    onChange={(e) => setEditLibelle(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Escape" && fermerEdition(c.id)}
                                                    className={`w-56 ${inputClass}`}
                                                />
                                                <button type="submit" className={iconBtn} disabled={busy}
                                                    aria-label={`Valider le nouveau libellé de « ${c.libelle} »`} title="Valider">
                                                    <Check size={16} aria-hidden="true" />
                                                </button>
                                                <button type="button" className={iconBtn} onClick={() => fermerEdition(c.id)}
                                                    aria-label="Annuler le renommage" title="Annuler">
                                                    <X size={16} aria-hidden="true" />
                                                </button>
                                            </form>
                                        ) : (
                                            <>
                                                <span className={`font-medium ${c.actif ? "text-gray-800" : "text-gray-500"}`}>
                                                    {c.libelle}
                                                </span>
                                                <span className="ml-2 text-xs text-gray-500">
                                                    clé : <code>{c.cle}</code>
                                                </span>
                                                {verrou && (
                                                    <span className="ml-2 text-xs text-gray-500">(verrouillée)</span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${
                                            c.actif ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                        {c.actif ? "Active" : "Désactivée"}
                                    </span>
                                    <div className="whitespace-nowrap">
                                        <button type="button" className={iconBtn} onClick={() => deplacer(c, -1)}
                                            disabled={busy || index === 0}
                                            aria-label={`Monter « ${c.libelle} »`} title="Monter">
                                            <ArrowUp size={16} aria-hidden="true" />
                                        </button>
                                        <button type="button" className={iconBtn} onClick={() => deplacer(c, 1)}
                                            disabled={busy || index === categories.length - 1}
                                            aria-label={`Descendre « ${c.libelle} »`} title="Descendre">
                                            <ArrowDown size={16} aria-hidden="true" />
                                        </button>
                                        <button type="button" ref={(el) => { crayons.current[c.id] = el; }} className={iconBtn} onClick={() => commencerEdition(c)}
                                            disabled={busy || verrou || enEdition}
                                            aria-label={verrou ? `« ${c.libelle} » ne peut pas être renommée` : `Renommer « ${c.libelle} »`}
                                            title={verrou ? "Verrouillée" : "Renommer"}>
                                            <Pencil size={16} aria-hidden="true" />
                                        </button>
                                        <button type="button"
                                            className={`px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 ${FOCUS}`}
                                            onClick={() => basculer(c)}
                                            disabled={busy || verrou}
                                            aria-label={`${c.actif ? "Désactiver" : "Activer"} « ${c.libelle} »`}>
                                            {c.actif ? "Désactiver" : "Activer"}
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default PrayerCategoriesPage;
