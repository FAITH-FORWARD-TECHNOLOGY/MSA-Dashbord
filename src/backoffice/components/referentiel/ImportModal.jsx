import React, { useId, useRef, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { FOCUS } from "../statistiques/StatsUi";
import {
    AlerteErreur,
    BOUTON_EXPORT,
    BOUTON_PRIMAIRE,
    BOUTON_SECONDAIRE,
    ENTETE_TABLEAU,
    Modale,
    Pastille,
} from "./ReferentielUi";
import { envoyerImport, telechargerModele, telechargerRapport } from "../../hooks/useReferentiel";
import {
    classeLigne,
    CLASSE_A_CREER,
    CLASSE_DOUBLON,
    CLASSE_ERREUR,
    CLASSE_EXISTANT,
    compteursImport,
    erreurFichier,
    IMPORTS,
    libelleStatutLigne,
    libelleValidation,
    lignesVisibles,
} from "../../utils/referentiel";

// Import d'un fichier en trois temps : choix et vérification, aperçu, rapport final.

const TON_CLASSE = { [CLASSE_A_CREER]: "vert", [CLASSE_EXISTANT]: "gris", [CLASSE_DOUBLON]: "ambre", [CLASSE_ERREUR]: "rouge" };
const TON_COMPTEUR = {
    vert: "border-green-200 bg-green-50 text-green-900",
    gris: "border-gray-200 bg-gray-50 text-gray-800",
    ambre: "border-amber-200 bg-amber-50 text-amber-900",
    rouge: "border-red-200 bg-red-50 text-red-900",
};

// Compteurs cliquables : filtrent le tableau des lignes.
function Compteurs({ compteurs, classe, onClasse }) {
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {compteurs.map((c) => (
                <button
                    key={c.classe}
                    type="button"
                    onClick={() => onClasse(classe === c.classe ? "" : c.classe)}
                    aria-pressed={classe === c.classe}
                    className={`rounded-lg border px-3 py-2 text-left ${TON_COMPTEUR[c.ton]} ${classe === c.classe ? "ring-2 ring-blue-500" : ""} ${FOCUS}`}
                >
                    <span className="block text-2xl font-bold tabular-nums">{c.nombre}</span>
                    <span className="block text-sm">{c.libelle}</span>
                </button>
            ))}
        </div>
    );
}

function TableauLignes({ lignes, avecQuartier, legende, termine }) {
    if (lignes.length === 0) {
        return <p className="rounded-md bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">Aucune ligne dans cette catégorie.</p>;
    }
    return (
        <div className="max-h-72 overflow-auto rounded-md border border-gray-200">
            <table className="min-w-full text-sm">
                <caption className="sr-only">{legende}</caption>
                <thead className="sticky top-0">
                    <tr className={ENTETE_TABLEAU}>
                        <th scope="col" className="px-3 py-2">Ligne</th>
                        <th scope="col" className="px-3 py-2">Pays</th>
                        <th scope="col" className="px-3 py-2">Commune</th>
                        {avecQuartier && <th scope="col" className="px-3 py-2">Quartier</th>}
                        <th scope="col" className="px-3 py-2">Résultat</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {lignes.map((l) => (
                        <tr key={l.ligne} className="align-top">
                            <td className="px-3 py-2 tabular-nums text-gray-500">{l.ligne}</td>
                            <td className="px-3 py-2 text-gray-800">{l.pays || "—"}</td>
                            <td className="px-3 py-2 text-gray-800">{l.commune || "—"}</td>
                            {avecQuartier && <td className="px-3 py-2 text-gray-800">{l.quartier || "—"}</td>}
                            <td className="px-3 py-2">
                                <Pastille ton={TON_CLASSE[classeLigne(l)]}>{libelleStatutLigne(l, termine)}</Pastille>
                                {l.raison && <p className="mt-1 text-xs text-gray-600">{l.raison}</p>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Contenu({ type, onFermer, onImporte, onOccupe }) {
    const regle = IMPORTS[type];
    const [fichier, setFichier] = useState(null);
    const [erreur, setErreur] = useState("");
    // etape : "choix", "apercu" ou "rapport" ; action : requête en cours.
    const [etape, setEtape] = useState("choix");
    const [action, setAction] = useState("");
    const [resultat, setResultat] = useState(null);
    const [classe, setClasse] = useState("");
    const champ = useRef(null);
    const idFichier = useId();
    const occupe = action !== "";

    const lancer = async (nom, operation) => {
        if (occupe) return;
        setAction(nom);
        setErreur("");
        try {
            await operation();
        } catch (err) {
            setErreur(err.message || "Opération impossible.");
        } finally {
            setAction("");
        }
    };

    const choisir = (f) => {
        setFichier(f ?? null);
        setErreur(f ? erreurFichier(f, type) : "");
    };

    const verifier = () => {
        const probleme = erreurFichier(fichier, type);
        if (probleme) {
            setErreur(probleme);
            return;
        }
        lancer("apercu", async () => {
            setResultat(await envoyerImport(type, fichier, { apercu: true }));
            setClasse("");
            setEtape("apercu");
        });
    };

    // Import définitif : la modale ne se ferme pas avant le rapport.
    const importer = () =>
        lancer("import", async () => {
            onOccupe(true);
            try {
                const r = await envoyerImport(type, fichier, { apercu: false });
                setResultat(r);
                setClasse("");
                setEtape("rapport");
                onImporte(r);
            } finally {
                onOccupe(false);
            }
        });

    const recommencer = () => {
        setEtape("choix");
        setResultat(null);
        setFichier(null);
        setErreur("");
    };

    if (etape === "choix") {
        return (
            <div className="space-y-4">
                <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
                    <li>
                        Téléchargez le modèle et remplissez les colonnes{" "}
                        <span className="font-medium">{regle.colonnes.join(", ")}</span>.
                    </li>
                    <li>Choisissez votre fichier : il est vérifié avant tout enregistrement.</li>
                    <li>Validez l'aperçu pour importer.</li>
                </ol>
                <button
                    type="button"
                    className={BOUTON_SECONDAIRE}
                    onClick={() => lancer("modele", () => telechargerModele(type))}
                    disabled={occupe}
                    aria-busy={action === "modele"}
                >
                    {action === "modele" ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                        <Download className="size-4" aria-hidden="true" />
                    )}
                    Télécharger le modèle
                </button>
                <div>
                    <label htmlFor={idFichier} className="mb-1 block text-sm font-medium text-gray-700">
                        Fichier {regle.formats}
                    </label>
                    <input
                        id={idFichier}
                        ref={champ}
                        type="file"
                        accept={regle.extensions.join(",")}
                        onChange={(e) => choisir(e.target.files?.[0])}
                        aria-describedby={`${idFichier}-aide`}
                        className={`block w-full rounded-md border border-gray-300 bg-white text-sm text-gray-800 file:mr-3 file:h-10 file:border-0 file:bg-gray-100 file:px-3 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 ${FOCUS}`}
                    />
                    <p id={`${idFichier}-aide`} className="mt-1 text-xs text-gray-500">
                        2 Mo et 5 000 lignes au plus. Les {regle.nom}s déjà existant{regle.feminin ? "e" : ""}s sont ignoré
                        {regle.feminin ? "e" : ""}s.
                    </p>
                </div>
                <AlerteErreur>{erreur}</AlerteErreur>
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <button type="button" className={BOUTON_SECONDAIRE} onClick={onFermer} disabled={occupe}>
                        Annuler
                    </button>
                    <button
                        type="button"
                        className={BOUTON_PRIMAIRE}
                        onClick={verifier}
                        disabled={occupe || !fichier}
                        aria-busy={action === "apercu"}
                    >
                        {action === "apercu" ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <Upload className="size-4" aria-hidden="true" />
                        )}
                        {action === "apercu" ? "Vérification…" : "Vérifier le fichier"}
                    </button>
                </div>
            </div>
        );
    }

    const termine = etape === "rapport";
    const resume = resultat?.resume ?? {};
    const lignes = lignesVisibles(resultat?.lignes, classe);

    return (
        <div className="space-y-4">
            <div aria-live="polite">
                {termine ? (
                    <p className="flex items-start gap-2 text-sm font-medium text-green-700">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        Import terminé.
                    </p>
                ) : (
                    <p className="flex items-start gap-2 text-sm text-gray-700">
                        <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-gray-500" aria-hidden="true" />
                        <span className="min-w-0 break-words">
                            Aperçu de <span className="font-medium">{fichier?.name}</span> : rien n'est encore enregistré.
                        </span>
                    </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    {resume.lignesLues ?? 0} ligne{(resume.lignesLues ?? 0) > 1 ? "s" : ""} lue
                    {(resume.lignesLues ?? 0) > 1 ? "s" : ""}
                    {resume.lignesVides > 0 && ` · ${resume.lignesVides} ligne${resume.lignesVides > 1 ? "s" : ""} vide${resume.lignesVides > 1 ? "s" : ""} ignorée${resume.lignesVides > 1 ? "s" : ""}`}
                </p>
            </div>
            <Compteurs compteurs={compteursImport(resume, type, termine, resultat?.lignes)} classe={classe} onClasse={setClasse} />
            <TableauLignes
                lignes={lignes}
                avecQuartier={type === "quartiers"}
                termine={termine}
                legende={termine ? "Résultat de l'import, ligne par ligne" : "Aperçu de l'import, ligne par ligne"}
            />
            <AlerteErreur>{erreur}</AlerteErreur>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                {termine ? (
                    <>
                        <button type="button" className={BOUTON_SECONDAIRE} onClick={onFermer}>
                            Fermer
                        </button>
                        {resultat?.rapport && (
                            <button type="button" className={BOUTON_EXPORT} onClick={() => telechargerRapport(resultat.rapport)}>
                                <Download className="size-4" aria-hidden="true" />
                                Télécharger le rapport
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        <button type="button" className={BOUTON_SECONDAIRE} onClick={recommencer} disabled={occupe}>
                            Changer de fichier
                        </button>
                        <button
                            type="button"
                            className={BOUTON_PRIMAIRE}
                            onClick={importer}
                            disabled={occupe || (resume.importes ?? 0) === 0}
                            aria-busy={action === "import"}
                        >
                            {action === "import" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                            {action === "import" ? "Import en cours…" : libelleValidation(resume, type)}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// `type` : "communes" ou "quartiers" ; `onImporte` reçoit le résultat de l'import définitif.
export default function ImportModal({ ouvert, type, onFermer, onImporte }) {
    const regle = IMPORTS[type];
    const [occupe, setOccupe] = useState(false);
    return (
        <Modale
            ouvert={ouvert}
            bloquee={occupe}
            titre={`Importer des ${regle.nom}s`}
            sousTitre={`Fichier ${regle.formats}`}
            onFermer={onFermer}
            large
        >
            {ouvert && <Contenu type={type} onFermer={onFermer} onImporte={onImporte} onOccupe={setOccupe} />}
        </Modale>
    );
}
