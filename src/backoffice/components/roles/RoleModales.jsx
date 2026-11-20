import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
    AlerteErreur,
    BOUTON_DANGER,
    BOUTON_PRIMAIRE,
    BOUTON_SECONDAIRE,
    CHAMP,
    Champ,
    Modale,
} from "../referentiel/ReferentielUi";

// Création ou modification d'un rôle (nom, description ; périmètre à la création d'un rôle d'application).
export function RoleFormModal({ role, type, onFermer, onEnregistrer }) {
    const id = useId();
    const edition = Boolean(role);
    const [nom, setNom] = useState(role?.nom ?? "");
    const [description, setDescription] = useState(role?.description ?? "");
    const [aPerimetre, setAPerimetre] = useState(false);
    const [enCours, setEnCours] = useState(false);
    const [erreur, setErreur] = useState("");
    const [erreurNom, setErreurNom] = useState("");

    const valider = async (e) => {
        e.preventDefault();
        if (!nom.trim()) {
            setErreurNom("Le nom du rôle est obligatoire.");
            return;
        }
        setErreurNom("");
        setErreur("");
        setEnCours(true);
        try {
            await onEnregistrer(
                edition
                    ? { nom: nom.trim(), description: description.trim() }
                    : {
                          nom: nom.trim(),
                          description: description.trim() || undefined,
                          type,
                          ...(type === "APP" ? { aPerimetre } : {}),
                      },
            );
        } catch (err) {
            setErreur(err.message || "Enregistrement impossible.");
            setEnCours(false);
        }
    };

    return (
        <Modale
            ouvert
            titre={edition ? `Modifier le rôle « ${role.nom} »` : "Créer un rôle"}
            sousTitre={type === "APP" ? "Rôle de l'application" : "Rôle du back-office"}
            onFermer={onFermer}
            bloquee={enCours}
            pied={
                <>
                    <button type="button" className={BOUTON_SECONDAIRE} onClick={onFermer} disabled={enCours}>
                        Annuler
                    </button>
                    <button type="submit" form={`${id}-form`} className={BOUTON_PRIMAIRE} disabled={enCours} aria-busy={enCours}>
                        {enCours && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        {edition ? "Enregistrer" : "Créer le rôle"}
                    </button>
                </>
            }
        >
            <form id={`${id}-form`} onSubmit={valider} className="space-y-4" noValidate>
                <Champ id={`${id}-nom`} libelle="Nom du rôle" erreur={erreurNom}>
                    <input
                        id={`${id}-nom`}
                        className={CHAMP}
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        maxLength={80}
                        aria-invalid={Boolean(erreurNom)}
                        aria-describedby={erreurNom ? `${id}-nom-erreur` : undefined}
                        autoFocus
                    />
                </Champ>
                <Champ id={`${id}-desc`} libelle="Description (facultatif)">
                    <textarea
                        id={`${id}-desc`}
                        className={`${CHAMP} h-24`}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={300}
                    />
                </Champ>
                {!edition && type === "APP" && (
                    <label className="flex items-start gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={aPerimetre}
                            onChange={(e) => setAPerimetre(e.target.checked)}
                            className="mt-0.5 size-4 accent-blue-600"
                        />
                        <span>
                            Rôle à périmètre : il s'attribue cellule par cellule (comme « Responsable de cellule »).
                        </span>
                    </label>
                )}
                <AlerteErreur>{erreur}</AlerteErreur>
            </form>
        </Modale>
    );
}

// Duplication : copie des permissions sous un nouveau nom (jamais un rôle système).
export function DupliquerModal({ role, onFermer, onDupliquer }) {
    const id = useId();
    const [nom, setNom] = useState(`${role.nom} (copie)`);
    const [enCours, setEnCours] = useState(false);
    const [erreur, setErreur] = useState("");

    const valider = async (e) => {
        e.preventDefault();
        if (!nom.trim()) {
            setErreur("Le nom du nouveau rôle est obligatoire.");
            return;
        }
        setErreur("");
        setEnCours(true);
        try {
            await onDupliquer(nom.trim());
        } catch (err) {
            setErreur(err.message || "Duplication impossible.");
            setEnCours(false);
        }
    };

    return (
        <Modale
            ouvert
            titre={`Dupliquer « ${role.nom} »`}
            sousTitre="Le nouveau rôle reprend les mêmes permissions et reste modifiable."
            onFermer={onFermer}
            bloquee={enCours}
            pied={
                <>
                    <button type="button" className={BOUTON_SECONDAIRE} onClick={onFermer} disabled={enCours}>
                        Annuler
                    </button>
                    <button type="submit" form={`${id}-form`} className={BOUTON_PRIMAIRE} disabled={enCours} aria-busy={enCours}>
                        {enCours && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        Dupliquer
                    </button>
                </>
            }
        >
            <form id={`${id}-form`} onSubmit={valider} noValidate className="space-y-3">
                <Champ id={`${id}-nom`} libelle="Nom du nouveau rôle">
                    <input id={`${id}-nom`} className={CHAMP} value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80} autoFocus />
                </Champ>
                <AlerteErreur>{erreur}</AlerteErreur>
            </form>
        </Modale>
    );
}

// Suppression ; un rôle encore attribué est refusé : on renvoie vers la liste de ses utilisateurs.
export function SupprimerRoleModal({ role, onFermer, onSupprimer }) {
    const [enCours, setEnCours] = useState(false);
    const [refus, setRefus] = useState(null);
    const [erreur, setErreur] = useState("");

    const confirmer = async () => {
        setEnCours(true);
        setErreur("");
        try {
            await onSupprimer();
        } catch (err) {
            if (err.statut === 409) setRefus(err.message);
            else setErreur(err.message || "Suppression impossible.");
            setEnCours(false);
        }
    };

    const nb = role.nbUtilisateurs ?? 0;
    return (
        <Modale
            ouvert
            titre={`Supprimer le rôle « ${role.nom} »`}
            onFermer={onFermer}
            bloquee={enCours}
            pied={
                <>
                    <button type="button" className={BOUTON_SECONDAIRE} onClick={onFermer} disabled={enCours}>
                        {refus ? "Fermer" : "Annuler"}
                    </button>
                    {!refus && (
                        <button type="button" className={BOUTON_DANGER} onClick={confirmer} disabled={enCours} aria-busy={enCours}>
                            {enCours && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                            Supprimer le rôle
                        </button>
                    )}
                </>
            }
        >
            <div className="space-y-3 text-sm text-gray-700">
                {refus ? (
                    <div className="space-y-2" role="alert">
                        <p className="font-medium text-red-700">{refus}</p>
                        <p>
                            Ce rôle est encore attribué{nb > 0 ? ` à ${nb} utilisateur${nb > 1 ? "s" : ""}` : ""} : réattribuez
                            d'abord ces comptes à un autre rôle, puis recommencez.
                        </p>
                        <Link
                            to={`/users?roleId=${role.id}`}
                            className="inline-block rounded font-medium text-blue-700 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            Voir la liste des utilisateurs de ce rôle
                        </Link>
                    </div>
                ) : (
                    <p>
                        Cette action est définitive.
                        {nb > 0 &&
                            ` Ce rôle est attribué à ${nb} utilisateur${nb > 1 ? "s" : ""} : la suppression sera refusée tant qu'ils n'ont pas un autre rôle.`}
                    </p>
                )}
                <AlerteErreur>{erreur}</AlerteErreur>
            </div>
        </Modale>
    );
}
