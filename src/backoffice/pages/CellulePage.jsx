import React, { useState } from "react";
import CelluleList from "../components/CelluleList";
import CelluleFormModal from "../components/CelluleFormModal";
import { useCellules } from "../hooks/useCellules";

const CellulePage = () => {
    const [showModal, setShowModal] = useState(false);
    const {
        cellules,
        loading,
        error,
        refetch,
        updateCellule,
        deleteCellule,
        createCellule,
    } = useCellules();

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Gestion des cellules
            </h2>

            <button
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                onClick={() => setShowModal(true)}
            >
                Créer une cellule
            </button>

            {loading && <p className="text-blue-600">Chargement...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
                <CelluleList
                    cellules={cellules}
                    onUpdate={updateCellule}
                    onDelete={deleteCellule}
                />
            )}
            {showModal && (
                <CelluleFormModal
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

export default CellulePage;
