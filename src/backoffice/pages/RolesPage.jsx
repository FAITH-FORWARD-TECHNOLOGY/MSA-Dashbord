import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Copy, Info, KeyRound, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { EtatErreur, EtatVide, Squelette } from "../components/statistiques/StatsUi";
import {
    Annonce,
    BOUTON_LIGNE,
    BOUTON_LIGNE_DANGER,
    BOUTON_PRIMAIRE,
    ENTETE_TABLEAU,
    Pastille,
} from "../components/referentiel/ReferentielUi";
import { BASCULE_FAITE, MESSAGE_BASCULE } from "../config/bascule.js";
import { modificationPossible, suppressionInterdite, aPourCle, CLE_RESPONSABLE_CELLULE } from "../utils/attributionsRoles.js";
import AlerteSuperAdmins from "../components/roles/AlerteSuperAdmins";
import { DupliquerModal, RoleFormModal, SupprimerRoleModal } from "../components/roles/RoleModales";
import {
    creerRole,
    dupliquerRole,
    modifierRole,
    supprimerRole,
    useListeRoles,
} from "../hooks/useRoles";

const ONGLETS = [
    { type: "APP", libelle: "Rôles de l'application" },
    { type: "BACKOFFICE", libelle: "Rôles du back-office" },
];

const EXPLICATION_SYSTEME =
    "Rôle système : il ne peut être ni modifié ni supprimé. Dupliquez-le pour obtenir un rôle modifiable.";

const EXPLICATION_RESPONSABLE =
    "Rôle de départ : il peut être renommé mais pas supprimé, car l'application s'appuie sur lui.";

// Pluriel de « utilisateur » dans la colonne du nombre de comptes.
const libelleNb = (n) => `${n} utilisateur${n > 1 ? "s" : ""}`;

function ActionVerrouillee({ icone, libelle, role, explication = EXPLICATION_SYSTEME }) {
    const Icone = icone;
    // Bouton grisé + explication lue par les lecteurs d'écran.
    return (
        <button
            type="button"
            className={BOUTON_LIGNE}
            disabled
            title={explication}
            aria-label={`${libelle} le rôle ${role.nom} : indisponible, ${explication}`}
        >
            <Icone className="size-4" aria-hidden="true" />
            <span className="hidden xl:inline">{libelle}</span>
        </button>
    );
}

export default function RolesPage() {
    const navigate = useNavigate();
    const idOnglets = useId();
    const [type, setType] = useState("APP");
    const { data, loading, error, recharger } = useListeRoles(type);
    // Rôles du back-office pour l'alerte, quel que soit l'onglet ouvert.
    const boRoles = useListeRoles("BACKOFFICE");
    // Modale ouverte : { mode: "creer" | "modifier" | "dupliquer" | "supprimer", role? }.
    const [modale, setModale] = useState(null);
    const [annonce, setAnnonce] = useState("");
    const roles = Array.isArray(data) ? data : [];
    const aDesSysteme = roles.some((r) => r.systeme);

    const fermer = () => setModale(null);
    const termine = (message) => {
        setModale(null);
        setAnnonce(message);
        recharger();
        boRoles.recharger();
    };

    const surToucheOnglets = (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const suivant = ONGLETS.find((o) => o.type !== type);
        setType(suivant.type);
        document.getElementById(`${idOnglets}-${suivant.type}`)?.focus();
    };

    return (
        <div className="mx-auto max-w-5xl space-y-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Rôles et permissions</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Un rôle regroupe des permissions. Il s'attribue ensuite aux utilisateurs depuis leur fiche.
                    </p>
                </div>
                <button type="button" className={`${BOUTON_PRIMAIRE} whitespace-nowrap`} onClick={() => setModale({ mode: "creer" })}>
                    <Plus className="size-4" aria-hidden="true" />
                    Créer un rôle
                </button>
            </div>

            <AlerteSuperAdmins roles={boRoles.data} />

            <div role="tablist" aria-label="Type de rôle" className="flex gap-2 border-b border-gray-200" onKeyDown={surToucheOnglets}>
                {ONGLETS.map((o) => {
                    const actif = o.type === type;
                    return (
                        <button
                            key={o.type}
                            id={`${idOnglets}-${o.type}`}
                            type="button"
                            role="tab"
                            aria-selected={actif}
                            aria-controls={`${idOnglets}-panneau`}
                            tabIndex={actif ? 0 : -1}
                            onClick={() => {
                                setType(o.type);
                                setAnnonce("");
                            }}
                            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                actif ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            {o.libelle}
                        </button>
                    );
                })}
            </div>

            <Annonce message={annonce} />

            {type === "BACKOFFICE" && !BASCULE_FAITE && (
                <p role="note" className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                    <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>
                        <strong>{MESSAGE_BASCULE}.</strong> Ces rôles peuvent être créés et paramétrés, mais seul « Super admin »
                        peut être attribué avant la bascule.
                    </span>
                </p>
            )}

            <div id={`${idOnglets}-panneau`} role="tabpanel" aria-labelledby={`${idOnglets}-${type}`}>
                {loading && !data ? (
                    <Squelette lignes={4} />
                ) : error ? (
                    <EtatErreur message={error} onReessayer={recharger} />
                ) : roles.length === 0 ? (
                    <EtatVide titre="Aucun rôle" message="Créez un premier rôle avec le bouton « Créer un rôle »." />
                ) : (
                    <div className={`overflow-x-auto rounded bg-white shadow ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
                        <table className="min-w-full text-sm">
                            <caption className="sr-only">Liste des rôles</caption>
                            <thead className={ENTETE_TABLEAU}>
                                <tr>
                                    <th scope="col" className="px-4 py-2">Nom</th>
                                    <th scope="col" className="px-3 py-2">Type</th>
                                    <th scope="col" className="px-3 py-2 text-right">Utilisateurs</th>
                                    <th scope="col" className="px-4 py-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {roles.map((r) => (
                                    <tr key={r.id}>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium text-gray-900">{r.nom}</span>
                                                {r.systeme && (
                                                    <span title={EXPLICATION_SYSTEME}>
                                                        <Pastille ton="ambre">
                                                            <Lock className="mr-1 size-3" aria-hidden="true" />
                                                            Système
                                                        </Pastille>
                                                    </span>
                                                )}
                                                {r.aPerimetre && <Pastille ton="gris">Par cellule</Pastille>}
                                            </div>
                                            {r.description && <p className="mt-0.5 text-xs text-gray-500">{r.description}</p>}
                                        </td>
                                        <td className="px-3 py-3 text-gray-700">{r.type === "APP" ? "Application" : "Back-office"}</td>
                                        <td className="px-3 py-3 text-right tabular-nums">
                                            <Link
                                                to={`/users?roleId=${r.id}`}
                                                className="rounded text-blue-700 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                                aria-label={`${libelleNb(r.nbUtilisateurs ?? 0)} : voir la liste pour le rôle ${r.nom}`}
                                            >
                                                {r.nbUtilisateurs ?? 0}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap justify-end gap-2">
                                                <button
                                                    type="button"
                                                    className={BOUTON_LIGNE}
                                                    onClick={() => navigate(`/roles/${r.id}`)}
                                                    aria-label={`${r.systeme ? "Voir" : "Modifier"} les permissions du rôle ${r.nom}`}
                                                >
                                                    <KeyRound className="size-4" aria-hidden="true" />
                                                    <span className="hidden xl:inline">Permissions</span>
                                                </button>
                                                {!modificationPossible(r) ? (
                                                    <ActionVerrouillee icone={Pencil} libelle="Modifier" role={r} />
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className={BOUTON_LIGNE}
                                                        onClick={() => setModale({ mode: "modifier", role: r })}
                                                        aria-label={`Modifier le rôle ${r.nom}`}
                                                    >
                                                        <Pencil className="size-4" aria-hidden="true" />
                                                        <span className="hidden xl:inline">Modifier</span>
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className={BOUTON_LIGNE}
                                                    onClick={() => setModale({ mode: "dupliquer", role: r })}
                                                    aria-label={`Dupliquer le rôle ${r.nom}`}
                                                >
                                                    <Copy className="size-4" aria-hidden="true" />
                                                    <span className="hidden xl:inline">Dupliquer</span>
                                                </button>
                                                {suppressionInterdite(r) ? (
                                                    <ActionVerrouillee
                                                        icone={Trash2}
                                                        libelle="Supprimer"
                                                        role={r}
                                                        explication={aPourCle(r, CLE_RESPONSABLE_CELLULE) ? EXPLICATION_RESPONSABLE : EXPLICATION_SYSTEME}
                                                    />
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className={BOUTON_LIGNE_DANGER}
                                                        onClick={() => setModale({ mode: "supprimer", role: r })}
                                                        aria-label={`Supprimer le rôle ${r.nom}`}
                                                    >
                                                        <Trash2 className="size-4" aria-hidden="true" />
                                                        <span className="hidden xl:inline">Supprimer</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {aDesSysteme && !error && (
                    <p className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                        <Lock className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
                        Les rôles « Système » sont verrouillés : ni modification ni suppression. Pour partir de l'un d'eux,
                        utilisez « Dupliquer ».
                    </p>
                )}
            </div>

            {modale?.mode === "creer" && (
                <RoleFormModal
                    type={type}
                    onFermer={fermer}
                    onEnregistrer={async (corps) => {
                        const cree = await creerRole(corps);
                        termine(`Rôle « ${corps.nom} » créé.`);
                        if (cree?.id) navigate(`/roles/${cree.id}`);
                    }}
                />
            )}
            {modale?.mode === "modifier" && (
                <RoleFormModal
                    role={modale.role}
                    type={type}
                    onFermer={fermer}
                    onEnregistrer={async (corps) => {
                        await modifierRole(modale.role.id, corps);
                        termine(`Rôle « ${corps.nom} » modifié.`);
                    }}
                />
            )}
            {modale?.mode === "dupliquer" && (
                <DupliquerModal
                    role={modale.role}
                    onFermer={fermer}
                    onDupliquer={async (nom) => {
                        const copie = await dupliquerRole(modale.role.id, nom);
                        termine(`Rôle « ${nom} » créé à partir de « ${modale.role.nom} ».`);
                        if (copie?.id) navigate(`/roles/${copie.id}`);
                    }}
                />
            )}
            {modale?.mode === "supprimer" && (
                <SupprimerRoleModal
                    role={modale.role}
                    onFermer={fermer}
                    onSupprimer={async () => {
                        await supprimerRole(modale.role.id);
                        termine(`Rôle « ${modale.role.nom} » supprimé.`);
                    }}
                />
            )}
        </div>
    );
}
