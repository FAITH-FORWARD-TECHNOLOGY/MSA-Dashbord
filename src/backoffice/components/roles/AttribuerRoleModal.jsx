import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { AlerteErreur, BOUTON_PRIMAIRE, BOUTON_SECONDAIRE, CHAMP, Champ, Modale } from "../referentiel/ReferentielUi";
import { EtatErreur } from "../statistiques/StatsUi";
import { attribuerEnMasse, useListeRoles } from "../../hooks/useRoles";
import { useCellules } from "../../hooks/useCellules";
import { messageDernierSuperAdmin } from "../../utils/attributionsRoles";

// Attribution en masse : un rôle (et une cellule s'il est à périmètre) pour les comptes cochés.
export default function AttribuerRoleModal({ userIds, onFermer, onTermine }) {
    const id = useId();
    const roles = useListeRoles(undefined);
    const { cellules } = useCellules();
    const [roleId, setRoleId] = useState("");
    const [celluleId, setCelluleId] = useState("");
    const [enCours, setEnCours] = useState(false);
    const [erreur, setErreur] = useState("");
    const [bilan, setBilan] = useState(null);

    const liste = roles.data ?? [];
    const role = liste.find((r) => String(r.id) === roleId);
    const n = userIds.length;

    const valider = async (e) => {
        e.preventDefault();
        if (!role) {
            setErreur("Choisissez un rôle.");
            return;
        }
        if (role.aPerimetre && !celluleId) {
            setErreur(`Choisissez la cellule du rôle « ${role.nom} ».`);
            return;
        }
        setErreur("");
        setEnCours(true);
        try {
            setBilan(await attribuerEnMasse(role.id, userIds, role.aPerimetre ? Number(celluleId) : undefined));
        } catch (err) {
            setErreur(messageDernierSuperAdmin(err.message) || "Attribution impossible.");
        } finally {
            setEnCours(false);
        }
    };

    const ferme = () => {
        if (bilan) onTermine();
        else onFermer();
    };

    return (
        <Modale
            ouvert
            titre="Attribuer un rôle"
            sousTitre={`${n} utilisateur${n > 1 ? "s" : ""} sélectionné${n > 1 ? "s" : ""}`}
            onFermer={ferme}
            bloquee={enCours}
            pied={
                bilan ? (
                    <button type="button" className={BOUTON_PRIMAIRE} onClick={ferme}>
                        Terminer
                    </button>
                ) : (
                    <>
                        <button type="button" className={BOUTON_SECONDAIRE} onClick={onFermer} disabled={enCours}>
                            Annuler
                        </button>
                        <button type="submit" form={`${id}-form`} className={BOUTON_PRIMAIRE} disabled={enCours || roles.loading || Boolean(roles.error)} aria-busy={enCours}>
                            {enCours && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                            Attribuer
                        </button>
                    </>
                )
            }
        >
            {bilan ? (
                <div className="space-y-3 text-sm text-gray-700" role="status">
                    <p className="font-medium text-green-700">
                        {bilan.attribues} compte{bilan.attribues > 1 ? "s" : ""} mis à jour.
                    </p>
                    {bilan.ignores?.length > 0 && (
                        <div>
                            <p className="font-medium text-amber-800">
                                {bilan.ignores.length} ignoré{bilan.ignores.length > 1 ? "s" : ""} :
                            </p>
                            <ul className="mt-1 list-disc pl-5">
                                {bilan.ignores.map((i) => (
                                    <li key={i.id}>
                                        Compte {i.id} : {i.raison}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : roles.error ? (
                <EtatErreur message={roles.error} onReessayer={roles.recharger} />
            ) : (
                <form id={`${id}-form`} onSubmit={valider} noValidate className="space-y-4">
                    <Champ id={`${id}-role`} libelle="Rôle à attribuer">
                        <select
                            id={`${id}-role`}
                            className={CHAMP}
                            value={roleId}
                            disabled={roles.loading}
                            onChange={(e) => {
                                setRoleId(e.target.value);
                                setCelluleId("");
                            }}
                        >
                            <option value="">{roles.loading ? "Chargement…" : "Choisir un rôle…"}</option>
                            <optgroup label="Application">
                                {liste.filter((r) => r.type === "APP").map((r) => (
                                    <option key={r.id} value={r.id}>{r.nom}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Back-office">
                                {liste.filter((r) => r.type === "BACKOFFICE").map((r) => (
                                    <option key={r.id} value={r.id}>{r.nom}</option>
                                ))}
                            </optgroup>
                        </select>
                    </Champ>
                    {role?.aPerimetre && (
                        <Champ id={`${id}-cel`} libelle="Cellule du rôle" aide="Ce rôle s'applique à une cellule.">
                            <select id={`${id}-cel`} className={CHAMP} value={celluleId} onChange={(e) => setCelluleId(e.target.value)}>
                                <option value="">Choisir une cellule…</option>
                                {cellules.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </Champ>
                    )}
                    <AlerteErreur>{erreur}</AlerteErreur>
                </form>
            )}
        </Modale>
    );
}
