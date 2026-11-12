import React, { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { AlerteErreur, BOUTON_PRIMAIRE, BOUTON_SECONDAIRE, CHAMP, Champ, Modale } from "./ReferentielUi";
import { creerCommune, modifierCommune } from "../../hooks/useReferentiel";
import { erreurNom, nettoyerNom, NOM_MAX } from "../../utils/referentiel";

// Création ou modification d'une commune : nom et pays.
function Formulaire({ commune, pays, erreurPays, paysParDefaut, onFermer, onEnregistre }) {
    const [nom, setNom] = useState(commune?.nom ?? "");
    const [paysId, setPaysId] = useState(String(commune?.pays?.id ?? paysParDefaut ?? ""));
    const [erreurs, setErreurs] = useState({});
    const [etat, setEtat] = useState({ envoi: false, erreur: "" });
    const idNom = useId();
    const idPays = useId();

    const envoyer = async (e) => {
        e.preventDefault();
        // La modale peut être ouverte depuis un autre formulaire : il ne doit pas être soumis.
        e.stopPropagation();
        const suite = { nom: erreurNom(nom), pays: paysId === "" ? "Choisissez un pays." : "" };
        setErreurs(suite);
        if (suite.nom || suite.pays || etat.envoi) return;
        setEtat({ envoi: true, erreur: "" });
        try {
            const corps = { nom: nettoyerNom(nom), paysId: Number(paysId) };
            const resultat = commune ? await modifierCommune(commune.id, corps) : await creerCommune(corps);
            onEnregistre(resultat, Boolean(commune));
        } catch (err) {
            setEtat({ envoi: false, erreur: err.message || "Enregistrement impossible." });
        }
    };

    return (
        <form onSubmit={envoyer} noValidate className="space-y-4">
            <Champ id={idPays} libelle="Pays" erreur={erreurs.pays || erreurPays}>
                <select
                    id={idPays}
                    className={CHAMP}
                    value={paysId}
                    onChange={(e) => setPaysId(e.target.value)}
                    aria-invalid={Boolean(erreurs.pays)}
                    aria-describedby={erreurs.pays ? `${idPays}-erreur` : undefined}
                >
                    <option value="">Choisir un pays…</option>
                    {pays.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                            {p.nom}
                        </option>
                    ))}
                </select>
            </Champ>
            <Champ id={idNom} libelle="Nom de la commune" erreur={erreurs.nom}>
                <input
                    id={idNom}
                    type="text"
                    className={CHAMP}
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    maxLength={NOM_MAX}
                    autoComplete="off"
                    aria-invalid={Boolean(erreurs.nom)}
                    aria-describedby={erreurs.nom ? `${idNom}-erreur` : undefined}
                />
            </Champ>
            <AlerteErreur>{etat.erreur}</AlerteErreur>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button type="button" className={BOUTON_SECONDAIRE} onClick={onFermer} disabled={etat.envoi}>
                    Annuler
                </button>
                <button type="submit" className={BOUTON_PRIMAIRE} disabled={etat.envoi} aria-busy={etat.envoi}>
                    {etat.envoi && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {commune ? "Enregistrer" : "Créer la commune"}
                </button>
            </div>
        </form>
    );
}

// `cible` : null (fermée), {} (création) ou la commune à modifier.
export default function CommuneFormModal({ cible, pays, erreurPays, paysParDefaut, onFermer, onEnregistre }) {
    const commune = cible?.id ? cible : null;
    return (
        <Modale
            ouvert={cible !== null}
            titre={commune ? "Modifier la commune" : "Ajouter une commune"}
            sousTitre={commune ? commune.nom : "Une commune appartient à un pays."}
            onFermer={onFermer}
        >
            {cible !== null && (
                <Formulaire
                    key={commune?.id ?? "nouvelle"}
                    commune={commune}
                    pays={pays}
                    erreurPays={erreurPays}
                    paysParDefaut={paysParDefaut}
                    onFermer={onFermer}
                    onEnregistre={onEnregistre}
                />
            )}
        </Modale>
    );
}
