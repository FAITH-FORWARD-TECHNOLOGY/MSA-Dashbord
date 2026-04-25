import React, { useState } from "react";
import { Download } from "lucide-react";
import RideDestinationList from "../components/RideDestinationList";
import RideDestinationFormModal from "../components/RideDestinationFormModal";
import { useRideDestinations } from "../hooks/useRideDestinations";

// Page "Destinations" du dashboard admin.
// Calquée sur CategoriePage pour rester homogène avec le reste du backoffice.
// La modal d'édition est gérée à l'intérieur de la liste (voir RideDestinationList).
const RideDestinationsPage = () => {
    const [showCreate, setShowCreate] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState("");
    const {
        destinations,
        loading,
        error,
        createDestination,
        updateDestination,
        toggleActive,
        deleteDestination,
        syncFromCellules,
    } = useRideDestinations();

    // Bouton "Importer les cellules" : récupère les cellules actives
    // du backend et les crée comme destinations type 'cellule'.
    // Le backend dédoublonne par nom, donc on peut cliquer plusieurs fois
    // sans risque de doublons.
    const handleSync = async () => {
        setSyncing(true);
        setSyncMessage("");
        try {
            const result = await syncFromCellules();
            setSyncMessage(
                `${result.imported ?? 0} cellule(s) importée(s), ${result.skipped ?? 0} ignorée(s) (déjà existantes)`
            );
        } catch (err) {
            setSyncMessage(`Erreur : ${err.message}`);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Gestion des destinations de covoiturage
            </h2>

            {/* Boutons d'action : créer manuellement ou importer depuis les cellules */}
            <div className="flex flex-wrap gap-3 mb-4">
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
                    onClick={() => setShowCreate(true)}
                >
                    Créer une destination
                </button>
                <button
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    onClick={handleSync}
                    disabled={syncing}
                >
                    <Download size={16} />
                    {syncing
                        ? "Import en cours..."
                        : "Importer les cellules"}
                </button>
            </div>

            {/* Message de retour après un import */}
            {syncMessage && (
                <div className="mb-4 p-3 bg-gray-100 border border-gray-300 text-gray-700 rounded text-sm">
                    {syncMessage}
                </div>
            )}

            {loading && <p className="text-blue-600">Chargement...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
                <RideDestinationList
                    destinations={destinations}
                    onUpdate={updateDestination}
                    onDelete={deleteDestination}
                    onToggleActive={toggleActive}
                />
            )}

            {showCreate && (
                <RideDestinationFormModal
                    onClose={() => setShowCreate(false)}
                    onSubmit={createDestination}
                />
            )}
        </div>
    );
};

export default RideDestinationsPage;
