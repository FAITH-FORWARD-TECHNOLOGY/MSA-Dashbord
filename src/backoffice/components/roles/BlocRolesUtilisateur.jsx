import { Shield } from "lucide-react";
import RolesUtilisateurChamp from "./RolesUtilisateurChamp";

const SELECT =
    "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white";

// Rôle(s) d'une fiche : ancien select USER / ADMIN (serveur sans rôles, ou GET /roles en échec), sinon champ Rôles.
export default function BlocRolesUtilisateur({ rolesActifs, roleForm, cellules, erreurCellules, role, onRoleChange }) {
    if (!rolesActifs || roleForm.repli) {
        return (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Shield className="w-4 h-4 inline mr-1" />
                    Rôle
                </label>
                <select name="role" value={role} onChange={onRoleChange} className={SELECT}>
                    <option value="USER">👤 Utilisateur</option>
                    <option value="ADMIN">🛡️ Admin</option>
                </select>
            </div>
        );
    }
    if (roleForm.chargement && !roleForm.form) {
        return (
            <p className="text-sm text-gray-500" role="status">
                Chargement des rôles…
            </p>
        );
    }
    if (roleForm.erreur) {
        return (
            <p role="alert" className="text-sm text-red-600">
                Rôles indisponibles : {roleForm.erreur}
            </p>
        );
    }
    if (!roleForm.form) return null;
    return (
        <RolesUtilisateurChamp
            roles={roleForm.roles}
            form={roleForm.form}
            onChange={roleForm.setForm}
            cellules={cellules}
            erreurCellules={erreurCellules}
        />
    );
}
