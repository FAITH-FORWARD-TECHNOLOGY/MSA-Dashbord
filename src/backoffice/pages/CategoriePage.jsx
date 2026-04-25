import React, { useState } from "react";
import { Plus } from "lucide-react";
import CategorieList from "../components/CategorieList";
import CategorieFormModal from "../components/CategorieFormModal";
import { useCategories } from "../hooks/useCategories";

const CategoriePage = () => {
    const [showModal, setShowModal] = useState(false);
    const {
        categories,
        loading,
        error,
        refetch,
        updateCategorie,
        deleteCategorie,
        createCategorie,
    } = useCategories();

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Gestion des categories
            </h2>

            <button
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                onClick={() => setShowModal(true)}
            >
                Créer une categorie
            </button>

            {loading && <p className="text-blue-600">Chargement...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
                <CategorieList
                    categorie={categories}
                    onCategorieUpdate={updateCategorie}
                    onCategorieDelete={deleteCategorie}
                />
            )}
            {showModal && (
                <CategorieFormModal
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

export default CategoriePage;
