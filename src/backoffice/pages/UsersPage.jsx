import React, { useState } from "react";
import UserList from "../components/UserListe";
import UserFormModal from "../components/UserFormModal";
import { useUsers } from "../hooks/useUsers";

const UsersPage = () => {
    const [showModal, setShowModal] = useState(false);
    const {
        users,
        loading,
        error,
        refetch,
        updateUser,
        deleteUser,
        createUser,
    } = useUsers();

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

            {loading && <p className="text-blue-600">Chargement...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
                <UserList
                    users={users}
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
