import { useId, useState } from "react";
import { Shield } from "lucide-react";
import { CHAMP } from "../referentiel/ReferentielUi";
import { APP, BACKOFFICE, roleMembre } from "../../utils/attributionsRoles";

// Cases des cellules d'un rôle à périmètre.
function ChoixCellules({ cellules, valeur, onChange, idGroupe }) {
    const [recherche, setRecherche] = useState("");
    const visibles = cellules.filter((c) => c.name?.toLowerCase().includes(recherche.trim().toLowerCase()));
    const choisies = new Set(valeur.map(Number));
    return (
        <div className="mt-2 rounded-md border border-gray-300 bg-white">
            <input
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher une cellule"
                aria-label="Rechercher une cellule"
                className="block w-full rounded-t-md border-b border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div id={idGroupe} role="group" aria-label="Cellules du rôle" className="max-h-40 overflow-y-auto p-1">
                {visibles.length === 0 && <p className="px-2 py-1.5 text-sm text-gray-500">Aucune cellule.</p>}
                {visibles.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 focus-within:bg-blue-50">
                        <input
                            type="checkbox"
                            checked={choisies.has(Number(c.id))}
                            onChange={() =>
                                onChange(
                                    choisies.has(Number(c.id)) ? valeur.filter((v) => Number(v) !== Number(c.id)) : [...valeur, Number(c.id)],
                                )
                            }
                            className="size-4 accent-blue-600"
                        />
                        {c.name}
                    </label>
                ))}
            </div>
        </div>
    );
}

// Champ « Rôles » d'une fiche utilisateur : rôle de l'application (+ cellules), rôle du back-office.
export default function RolesUtilisateurChamp({ roles, form, onChange, cellules, erreurCellules }) {
    const id = useId();
    const rolesApp = roles.filter((r) => r.type === APP);
    const rolesBo = roles.filter((r) => r.type === BACKOFFICE);
    const roleApp = roles.find((r) => r.id === form.appRoleId);
    const membre = roleMembre(roles);

    return (
        <fieldset className="space-y-4 rounded-md border border-gray-200 p-3">
            <legend className="flex items-center px-1 text-sm font-medium text-gray-700">
                <Shield className="mr-1 inline h-4 w-4" aria-hidden="true" />
                Rôles
            </legend>

            <div>
                <label htmlFor={`${id}-app`} className="mb-1 block text-sm font-medium text-gray-700">
                    Rôle de l'application
                </label>
                <select
                    id={`${id}-app`}
                    className={CHAMP}
                    value={form.appRoleId ?? ""}
                    onChange={(e) => {
                        const roleId = e.target.value === "" ? null : Number(e.target.value);
                        onChange({ ...form, appRoleId: roleId, appCellules: [] });
                    }}
                >
                    {rolesApp.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.nom}
                            {r.aPerimetre ? " (par cellule)" : ""}
                        </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                    {membre ? `« ${membre.nom} » est attribué automatiquement si aucun autre rôle n'est choisi.` : ""}
                </p>
                {roleApp?.aPerimetre && (
                    <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700" id={`${id}-cel`}>
                            Cellule{form.appCellules.length > 1 ? "s" : ""} du rôle « {roleApp.nom} »
                        </p>
                        <p className="text-xs text-gray-500">Cochez la ou les cellules où ce rôle s'applique.</p>
                        <ChoixCellules cellules={cellules} valeur={form.appCellules} idGroupe={`${id}-cel-liste`} onChange={(c) => onChange({ ...form, appCellules: c })} />
                        {erreurCellules && (
                            <p role="alert" className="mt-1 text-sm text-red-600">
                                {erreurCellules}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div>
                <label htmlFor={`${id}-bo`} className="mb-1 block text-sm font-medium text-gray-700">
                    Rôle du back-office
                </label>
                <select
                    id={`${id}-bo`}
                    className={CHAMP}
                    value={form.boRoleId ?? ""}
                    onChange={(e) => onChange({ ...form, boRoleId: e.target.value === "" ? null : Number(e.target.value) })}
                >
                    <option value="">Aucun accès au back-office</option>
                    {rolesBo.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.nom}
                        </option>
                    ))}
                </select>
            </div>

            {form.conservees.length > 0 && (
                <p className="text-xs text-gray-500">
                    {form.conservees.length} autre{form.conservees.length > 1 ? "s" : ""} attribution{form.conservees.length > 1 ? "s" : ""} conservée
                    {form.conservees.length > 1 ? "s" : ""} telle{form.conservees.length > 1 ? "s" : ""} quelle{form.conservees.length > 1 ? "s" : ""}.
                </p>
            )}
        </fieldset>
    );
}
