import React, { useState } from "react";
import { Plus } from "lucide-react";
import PaysList from "../components/PaysList";
import PaysFormModal from "../components/PaysFormModal";
import { usePays } from "../hooks/usePays";
import { usePermissions } from "../hooks/usePermissions";

const PagePays = () => {
    const { peut } = usePermissions();
    const [showModal, setShowModal] = useState(false);
    const {
        pays,
        loading,
        error,
        refetch,
        updatePays,
        deletePays,
        createPays,
    } = usePays();

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Gestion des pays
            </h2>

            {peut("bo.pays.creer") && (
                <button
                    className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    onClick={() => setShowModal(true)}
                >
                    Créer un pays
                </button>
            )}

            {loading && <p className="text-blue-600">Chargement...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
                <PaysList
                    pays={pays}
                    onUpdate={updatePays}
                    onDelete={deletePays}
                />
            )}
            {showModal && (
                <PaysFormModal
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

export default PagePays;
