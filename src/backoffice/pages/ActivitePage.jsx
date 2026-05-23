import React, { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import ActiviteList from "../components/ActiviteList";
import AddActivityModal from "../components/AddActivityForm";
import EditActivityModal from "../components/EditActivityModal";
import { API_BASE_URL } from "../config/api";

// Page admin des activités : liste + actions CRUD (ajouter, modifier,
// activer/désactiver, supprimer). Les modals d'ajout et d'édition vivent
// ici (au niveau de la page) pour partager le state — la liste ne sait
// que rendre les lignes et déclencher des callbacks.
function ActivitePage() {
    const [activites, setActivites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // États des modals/actions
    const [showAddModal, setShowAddModal] = useState(false);
    const [activityToEdit, setActivityToEdit] = useState(null);
    const [activityToDelete, setActivityToDelete] = useState(null);
    const [activityToToggle, setActivityToToggle] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState("");

    const fetchActivites = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const res = await fetch(`${API_BASE_URL}/activites`);
            if (!res.ok)
                throw new Error("Erreur lors du chargement des activités");
            const data = await res.json();
            setActivites(data.reverse());
        } catch (err) {
            setError("Échec du chargement des activités");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActivites();
    }, [fetchActivites]);

    // Toggle isActive — PATCH /activites/:id
    const handleConfirmToggle = async () => {
        if (!activityToToggle) return;
        setActionLoading(true);
        setActionError("");
        try {
            const next = !(activityToToggle.isActive ?? true);
            const res = await fetch(
                `${API_BASE_URL}/activites/${activityToToggle.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isActive: next }),
                },
            );
            if (!res.ok) throw new Error(`Erreur ${res.status}`);
            await fetchActivites();
            setActivityToToggle(null);
        } catch (err) {
            setActionError(err.message || "Erreur lors du changement d'état");
        } finally {
            setActionLoading(false);
        }
    };

    // Suppression — DELETE /activites/:id
    const handleConfirmDelete = async () => {
        if (!activityToDelete) return;
        setActionLoading(true);
        setActionError("");
        try {
            const res = await fetch(
                `${API_BASE_URL}/activites/${activityToDelete.id}`,
                { method: "DELETE" },
            );
            if (!res.ok) throw new Error(`Erreur ${res.status}`);
            await fetchActivites();
            setActivityToDelete(null);
        } catch (err) {
            setActionError(err.message || "Erreur lors de la suppression");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    Gestion des activités
                </h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter une activité
                </button>
            </div>

            {loading && <p className="text-blue-600">Chargement...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {actionError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
                    {actionError}
                </div>
            )}

            {!loading && !error && (
                <ActiviteList
                    activities={activites}
                    onEdit={(a) => setActivityToEdit(a)}
                    onToggle={(a) => setActivityToToggle(a)}
                    onDelete={(a) => setActivityToDelete(a)}
                />
            )}

            {/* Modal d'ajout */}
            {showAddModal && (
                <AddActivityModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        fetchActivites();
                        setShowAddModal(false);
                    }}
                />
            )}

            {/* Modal d'édition */}
            {activityToEdit && (
                <EditActivityModal
                    activity={activityToEdit}
                    onClose={() => setActivityToEdit(null)}
                    onSuccess={() => {
                        fetchActivites();
                        setActivityToEdit(null);
                    }}
                />
            )}

            {/* Confirmation activer/désactiver */}
            {activityToToggle && (
                <ConfirmDialog
                    icon="toggle"
                    title={
                        activityToToggle.isActive ?? true
                            ? "Désactiver l'activité"
                            : "Activer l'activité"
                    }
                    message={
                        activityToToggle.isActive ?? true
                            ? "L'activité ne sera plus visible côté mobile tant qu'elle n'aura pas été réactivée."
                            : "L'activité redeviendra visible côté mobile."
                    }
                    confirmLabel={
                        activityToToggle.isActive ?? true
                            ? "Désactiver"
                            : "Activer"
                    }
                    confirmColor={
                        activityToToggle.isActive ?? true ? "amber" : "emerald"
                    }
                    onCancel={() => setActivityToToggle(null)}
                    onConfirm={handleConfirmToggle}
                    loading={actionLoading}
                />
            )}

            {/* Confirmation suppression */}
            {activityToDelete && (
                <ConfirmDialog
                    icon="trash"
                    title="Supprimer l'activité"
                    message={
                        <>
                            Êtes-vous sûr de vouloir supprimer l'activité{" "}
                            <strong>{activityToDelete.fonction}</strong> de{" "}
                            <strong>
                                {activityToDelete.user?.prenom}{" "}
                                {activityToDelete.user?.nom}
                            </strong>{" "}
                            ? Cette action ne peut pas être annulée.
                        </>
                    }
                    confirmLabel="Supprimer"
                    confirmColor="red"
                    onCancel={() => setActivityToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    loading={actionLoading}
                />
            )}
        </div>
    );
}

// Petit dialog de confirmation générique pour Activer/Désactiver/Supprimer.
// Inline ici parce qu'utilisé deux fois seulement dans la page — pas la peine
// d'en faire un composant partagé tant qu'il n'est pas utile ailleurs.
function ConfirmDialog({
    icon,
    title,
    message,
    confirmLabel,
    confirmColor,
    onCancel,
    onConfirm,
    loading,
}) {
    const colorClasses = {
        red: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
        amber: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
        emerald: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500",
    };
    return (
        <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                    <h3 className="text-lg font-medium text-gray-900 mt-1">
                        {title}
                    </h3>
                    <div className="mt-2 px-4 py-2">
                        <p className="text-sm text-gray-600">{message}</p>
                    </div>
                    <div className="flex gap-3 px-4 py-3">
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 px-4 py-2 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses[confirmColor]}`}
                        >
                            {loading ? "..." : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ActivitePage;
