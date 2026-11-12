import React, { useState } from "react";
import UserList from "../components/UserListe";
import UserFormModal from "../components/UserFormModal";
import { useUsers } from "../hooks/useUsers";
import { useAuth } from "../hooks/useAuth";
import QuartierResidenceField from "../components/referentiel/QuartierResidenceField";
import { libelleFiltreQuartier, parametresUtilisateurs } from "../utils/referentiel";

const UsersPage = () => {
    const [showModal, setShowModal] = useState(false);
    const { user } = useAuth();
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
    } = useUsers(parametresUtilisateurs(filtreQuartier));

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Gestion des utilisateurs
            </h2>

            <button
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                onClick={() => setShowModal(true)}
            >
                Créer un utilisateur
            </button>

            {user?.role === "ADMIN" && (
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
                    filtreActif={filtreQuartier !== null}
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
