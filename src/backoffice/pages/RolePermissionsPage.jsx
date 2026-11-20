import { useEffect, useMemo, useState } from "react";
import { useBlocker, useParams } from "react-router-dom";
import { Loader2, Lock, Save } from "lucide-react";
import BoutonRetour from "../components/BoutonRetour";
import PermissionsGrille from "../components/roles/PermissionsGrille";
import { EtatErreur, Squelette } from "../components/statistiques/StatsUi";
import { AlerteErreur, Annonce, BOUTON_PRIMAIRE, Pastille } from "../components/referentiel/ReferentielUi";
import { enregistrerPermissions, useCatalogue, useRole } from "../hooks/useRoles";
import { rafraichirPermissions } from "../hooks/usePermissions";
import {
    corpsPermissions,
    modulesDuType,
    modulesSansVoir,
    porteeParDefaut,
    selectionDepuisRole,
} from "../utils/rolesEdition";

const memeSelection = (a, b) => {
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every((k) => k in b && a[k] === b[k]);
};

export default function RolePermissionsPage() {
    const { id } = useParams();
    const role = useRole(id);
    const catalogue = useCatalogue();
    const [selection, setSelection] = useState({});
    const [initiale, setInitiale] = useState({});
    const [enCours, setEnCours] = useState(false);
    const [erreur, setErreur] = useState("");
    const [annonce, setAnnonce] = useState("");

    useEffect(() => {
        if (!role.data) return;
        const s = selectionDepuisRole(role.data.permissions);
        setSelection(s);
        setInitiale(s);
    }, [role.data]);

    const modules = useMemo(
        () => (role.data ? modulesDuType(catalogue.data?.modules, role.data.type) : []),
        [catalogue.data, role.data],
    );
    const modifie = !memeSelection(selection, initiale);
    const verrouille = Boolean(role.data?.systeme);

    // Modifications non enregistrées : confirmation avant de quitter la page, et avant de fermer l'onglet.
    const aPerdre = modifie && !verrouille;
    const blocage = useBlocker(aPerdre);
    useEffect(() => {
        if (blocage.state !== "blocked") return;
        if (window.confirm("Des modifications ne sont pas enregistrées. Quitter la page et les perdre ?")) blocage.proceed();
        else blocage.reset();
    }, [blocage]);
    useEffect(() => {
        if (!aPerdre) return undefined;
        const avantFermeture = (e) => e.preventDefault();
        window.addEventListener("beforeunload", avantFermeture);
        return () => window.removeEventListener("beforeunload", avantFermeture);
    }, [aPerdre]);

    const enregistrer = async () => {
        setErreur("");
        setAnnonce("");
        const manquants = modulesSansVoir(modules, selection);
        if (manquants.length > 0) {
            setErreur(`Cochez « Voir » pour : ${manquants.join(", ")}.`);
            return;
        }
        setEnCours(true);
        try {
            await enregistrerPermissions(role.data.id, corpsPermissions(selection));
            setInitiale(selection);
            setAnnonce("Permissions enregistrées.");
            // Mon propre rôle a pu changer : le menu se met à jour.
            rafraichirPermissions();
        } catch (err) {
            setErreur(err.message || "Enregistrement impossible.");
        } finally {
            setEnCours(false);
        }
    };

    if ((role.loading && !role.data) || (catalogue.loading && !catalogue.data)) {
        return <div className="mx-auto max-w-5xl"><Squelette lignes={6} /></div>;
    }
    if (role.error || catalogue.error) {
        return (
            <div className="mx-auto max-w-5xl space-y-4">
                <BoutonRetour repli="/roles" />
                <EtatErreur
                    message={role.error || catalogue.error}
                    onReessayer={() => {
                        role.recharger();
                        catalogue.recharger();
                    }}
                />
            </div>
        );
    }

    const r = role.data;
    return (
        <div className="mx-auto max-w-5xl space-y-5 pb-24">
            <BoutonRetour repli="/roles" />
            <div>
                <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">{r.nom}</h1>
                    <Pastille ton="gris">{r.type === "APP" ? "Application" : "Back-office"}</Pastille>
                    {verrouille && (
                        <Pastille ton="ambre">
                            <Lock className="mr-1 size-3" aria-hidden="true" />
                            Système
                        </Pastille>
                    )}
                </div>
                {r.description && <p className="mt-1 text-sm text-gray-600">{r.description}</p>}
            </div>

            {verrouille && (
                <p role="note" className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    Rôle système : ses permissions sont affichées en lecture seule. Dupliquez-le depuis la liste pour en
                    créer une variante modifiable.
                </p>
            )}
            {!verrouille && r.type === "BACKOFFICE" && (
                <p className="text-sm text-gray-600">
                    Au back-office, « Voir » est obligatoire : sans lui, les autres permissions du module sont désactivées.
                </p>
            )}

            {modules.length === 0 ? (
                <p className="text-sm text-gray-600">Le catalogue ne contient aucune permission pour ce type de rôle.</p>
            ) : (
                <PermissionsGrille
                    modules={modules}
                    selection={selection}
                    onChange={(s) => {
                        setSelection(s);
                        setAnnonce("");
                    }}
                    lectureSeule={verrouille}
                    porteeDefaut={porteeParDefaut(r)}
                />
            )}

            {!verrouille && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
                    <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1 space-y-1">
                            <AlerteErreur>{erreur}</AlerteErreur>
                            <Annonce message={annonce} />
                            {modifie && !erreur && <p className="text-sm text-amber-800">Modifications non enregistrées.</p>}
                        </div>
                        <button type="button" className={BOUTON_PRIMAIRE} onClick={enregistrer} disabled={enCours || !modifie} aria-busy={enCours}>
                            {enCours ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                            Enregistrer les permissions
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
