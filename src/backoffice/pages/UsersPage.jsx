import React, { useState } from "react";
import UserList from "../components/UserListe";
import UserFormModal from "../components/UserFormModal";
import { useUsers } from "../hooks/useUsers";
import { useSearchParams } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import { useListeRoles } from "../hooks/useRoles";
import QuartierResidenceField from "../components/referentiel/QuartierResidenceField";
import { libelleFiltreQuartier, parametresUtilisateurs } from "../utils/referentiel";

const UsersPage = () => {
    const [showModal, setShowModal] = useState(false);
    const { peut, nouveau, superAdmin } = usePermissions();
    // Filtre « Rôle » (super admin, serveur à rôles) ; ?roleId= vient de la liste des rôles.
    const [params, setParams] = useSearchParams();
    const roleId = params.get("roleId") ?? "";
    const filtreRoleActif = nouveau && superAdmin;
    const roles = useListeRoles(undefined, filtreRoleActif);
    // Filtre « Quartier » (admin) : quartier choisi, SANS_QUARTIER ou null.
    const [filtreQuartier, setFiltreQuartier] = useState(null);
    const {
        users,
        loading,
        error,
        refetch,
        updateUser,
        deleteUser,
        createUser,
    } = useUsers({
        ...parametresUtilisateurs(filtreQuartier),
        ...(filtreRoleActif && roleId ? { roleId } : {}),
    });

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Gestion des utilisateurs
            </h2>

            {peut("bo.utilisateurs.creer") && (
                <button
                    className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    onClick={() => setShowModal(true)}
                >
                    Créer un utilisateur
                </button>
            )}

            {filtreRoleActif && (
                <div className="mb-4 sm:max-w-md">
                    <label htmlFor="filtre-role" className="mb-1 block text-sm text-gray-700">
                        Rôle
                    </label>
                    <select
                        id="filtre-role"
                        value={roleId}
                        onChange={(e) => {
                            const suivant = new URLSearchParams(params);
                            if (e.target.value) suivant.set("roleId", e.target.value);
                            else suivant.delete("roleId");
                            setParams(suivant, { replace: true });
                        }}
                        className="block w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Tous les rôles</option>
                        {(roles.data ?? []).map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.nom} ({r.type === "APP" ? "application" : "back-office"})
                            </option>
                        ))}
                    </select>
                    {roles.error && <p className="mt-1 text-sm text-red-600">{roles.error}</p>}
                </div>
            )}

            {peut("bo.quartiers.voir") && (
                <div className="mb-4 sm:max-w-md">
                    <QuartierResidenceField
                        value={filtreQuartier}
                        onChange={setFiltreQuartier}
                        libelle="Quartier"
                        classeLibelle="mb-1 block text-sm text-gray-700"
                        placeholder="Tous les quartiers"
                        filtre
                        icone={false}
                    />
                    <p className="mt-1 text-sm text-gray-500" aria-live="polite">
                        {filtreQuartier && !loading && !error
                            ? `${users.length} utilisateur${users.length > 1 ? "s" : ""} : ${libelleFiltreQuartier(filtreQuartier)}`
                            : ""}
                    </p>
                </div>
            )}

            {loading && <p className="text-blue-600">Chargement...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
                <UserList
                    users={users}
                    filtreActif={filtreQuartier !== null || (filtreRoleActif && roleId !== "")}
                    onRefresh={refetch}
                    onUpdate={updateUser}
                    onDelete={deleteUser}
                    onView={(id) => console.log("Voir user", id)}
                />
            )}
            {showModal && (
                <UserFormModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        refetch();
                    }}
                />
            )}
        </div>
    );
};

export default UsersPage;
