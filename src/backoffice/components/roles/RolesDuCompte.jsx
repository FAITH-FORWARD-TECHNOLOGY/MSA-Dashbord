import { useRolesUtilisateur, useCellulesNoms } from "../../hooks/useRoles";
import { libelleRole } from "../../utils/attributionsRoles";

// Rôles d'un compte, sur sa fiche (super admin, serveur à rôles).
export default function RolesDuCompte({ userId }) {
    const { data, loading, error } = useRolesUtilisateur(userId);
    const noms = useCellulesNoms(true);
    return (
        <p className="text-gray-700">
            Rôles :{" "}
            {loading ? (
                <span className="text-gray-500">chargement…</span>
            ) : error ? (
                <span className="text-red-600">indisponibles ({error})</span>
            ) : (data ?? []).length === 0 ? (
                <span className="text-gray-500">aucun</span>
            ) : (
                <span className="font-semibold">{data.map((r) => libelleRole(r, noms)).join(", ")}</span>
            )}
        </p>
    );
}
