import ActivityDetailModal from "../components/Activitydetail";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit2, Trash2, Power, PowerOff } from "lucide-react";
import AddActivityModal from "../components/AddActivityForm";
import EditUserModal from "../components/EditUserModal";
import EditActivityModal from "../components/EditActivityModal";
import { API_BASE_URL } from "../config/api";

export default function UserProfil() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showActivityDetail, setShowActivityDetail] = useState(false);

    // Modales pour les actions sur l'utilisateur (Modifier / Supprimer / Activer-Désactiver)
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isToggleOpen, setIsToggleOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState("");

    // Modales pour les actions sur une activité de l'utilisateur
    const [activityToEdit, setActivityToEdit] = useState(null);
    const [activityToToggle, setActivityToToggle] = useState(null);
    const [activityToDelete, setActivityToDelete] = useState(null);

    async function fetchUser() {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${id}`);
            if (!res.ok) throw new Error("Erreur lors du chargement du profil");
            const data = await res.json();
            setUser(data);
        } catch (err) {
            setError(err.message || "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUser();
    }, [id]);

    const handleActivityClick = (activity) => {
        setSelectedActivity(activity);
        setShowActivityDetail(true);
    };

    const closeActivityDetail = () => {
        setShowActivityDetail(false);
        setSelectedActivity(null);
    };

    // Modifier — appelle POST /users/:id (même endpoint que la liste utilisateurs)
    const handleSaveEdit = async (data) => {
        setActionLoading(true);
        setActionError("");
        try {
            const res = await fetch(`${API_BASE_URL}/users/${id}`, {
                method: "POST",
                headers: {
                    accept: "*/*",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            if (!res.ok)
                throw new Error(`Erreur ${res.status}: ${res.statusText}`);
            await fetchUser();
            setIsEditOpen(false);
        } catch (err) {
            setActionError(err.message || "Erreur lors de la modification");
            throw err;
        } finally {
            setActionLoading(false);
        }
    };

    // Activer / Désactiver — toggle isActive via le même endpoint update
    const handleToggleActive = async () => {
        if (!user) return;
        setActionLoading(true);
        setActionError("");
        try {
            const res = await fetch(`${API_BASE_URL}/users/${id}`, {
                method: "POST",
                headers: {
                    accept: "*/*",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ isActive: !user.isActive }),
            });
            if (!res.ok)
                throw new Error(`Erreur ${res.status}: ${res.statusText}`);
            await fetchUser();
            setIsToggleOpen(false);
        } catch (err) {
            setActionError(err.message || "Erreur lors du changement d'état");
        } finally {
            setActionLoading(false);
        }
    };

    // Supprimer — DELETE puis redirection vers la liste
    const handleDelete = async () => {
        setActionLoading(true);
        setActionError("");
        try {
            const res = await fetch(`${API_BASE_URL}/users/${id}/delete`, {
                method: "DELETE",
                headers: {
                    accept: "*/*",
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok)
                throw new Error(`Erreur ${res.status}: ${res.statusText}`);
            navigate("/users");
        } catch (err) {
            setActionError(err.message || "Erreur lors de la suppression");
        } finally {
            setActionLoading(false);
        }
    };

    // Toggle isActive d'une activité — PATCH /activites/:id
    const handleToggleActivity = async () => {
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
            await fetchUser();
            setActivityToToggle(null);
        } catch (err) {
            setActionError(err.message || "Erreur lors du changement d'état");
        } finally {
            setActionLoading(false);
        }
    };

    // Suppression d'une activité — DELETE /activites/:id
    const handleDeleteActivity = async () => {
        if (!activityToDelete) return;
        setActionLoading(true);
        setActionError("");
        try {
            const res = await fetch(
                `${API_BASE_URL}/activites/${activityToDelete.id}`,
                { method: "DELETE" },
            );
            if (!res.ok) throw new Error(`Erreur ${res.status}`);
            await fetchUser();
            setActivityToDelete(null);
        } catch (err) {
            setActionError(err.message || "Erreur lors de la suppression");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-6 text-center">Chargement...</div>;
    if (error)
        return <div className="p-6 text-center text-red-600">{error}</div>;
    if (!user)
        return <div className="p-6 text-center">Utilisateur non trouvé</div>;

    const isActive = user.isActive !== false;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            {/* Infos utilisateur + actions */}
            <section className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-6">
                        <img
                            src={user.pays?.flag}
                            alt={user.pays?.nom}
                            className="w-16 h-10 object-cover rounded border"
                        />
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-bold">
                                    {user.prenom} {user.nom}
                                </h1>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        isActive
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                    }`}
                                >
                                    {isActive ? "Actif" : "Désactivé"}
                                </span>
                            </div>
                            <p className="text-gray-700">
                                Email : {user.email}
                            </p>
                            <p className="text-gray-700">
                                Pays : {user.pays?.nom} ({user.pays?.code})
                            </p>
                            <p className="text-gray-700">
                                Rôle :{" "}
                                <span className="font-semibold">
                                    {user.role}
                                </span>
                            </p>
                            <p className="text-gray-500 text-sm">
                                Inscrit le :{" "}
                                {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Boutons d'action — alignés sur le pattern de UserListe.tsx */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setIsEditOpen(true)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Edit2 className="w-4 h-4 mr-1.5" />
                            Modifier
                        </button>
                        <button
                            onClick={() => setIsToggleOpen(true)}
                            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                isActive
                                    ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
                                    : "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                            }`}
                        >
                            {isActive ? (
                                <>
                                    <PowerOff className="w-4 h-4 mr-1.5" />
                                    Désactiver
                                </>
                            ) : (
                                <>
                                    <Power className="w-4 h-4 mr-1.5" />
                                    Activer
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setIsDeleteOpen(true)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Supprimer
                        </button>
                    </div>
                </div>

                {actionError && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                        {actionError}
                    </div>
                )}
            </section>

            {/* Activités */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Activités ({user.Activite?.length || 0})
                    </h2>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition-colors flex items-center gap-2"
                    >
                        <span className="text-xl">+</span>
                        Ajouter une activité
                    </button>
                </div>

                {(!user.Activite || user.Activite.length === 0) && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-gray-500 text-lg">
                            Aucune activité pour cet utilisateur.
                        </p>
                    </div>
                )}

                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {user.Activite?.map((act) => (
                        <div
                            key={act.id}
                            onClick={() => handleActivityClick(act)}
                            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer transform transition-all duration-200 hover:shadow-xl border border-gray-100 flex flex-col"
                        >
                            {/* Header de la carte */}
                            <div className="flex items-start justify-between mb-4 gap-2">
                                <div className="flex items-center gap-3 min-w-0">
                                    {act.logo && (
                                        <img
                                            src={act.logo}
                                            alt={act.marque}
                                            className="w-12 h-12 object-cover rounded-lg border flex-shrink-0"
                                        />
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                                            {act.fonction}
                                        </h3>
                                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                            {act.categorie?.nom}
                                        </span>
                                    </div>
                                </div>
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                        (act.isActive ?? true)
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                    }`}
                                >
                                    {(act.isActive ?? true)
                                        ? "Actif"
                                        : "Désactivé"}
                                </span>
                            </div>

                            {/* Infos principales */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 text-sm">
                                        🏢
                                    </span>
                                    <span className="text-gray-900 font-medium">
                                        {act.marque}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 text-sm">
                                        📍
                                    </span>
                                    <span className="text-gray-700">
                                        {act.region}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 text-sm">
                                        💰
                                    </span>
                                    <span className="text-gray-700">
                                        {act.tarif}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 text-sm">
                                        📞
                                    </span>
                                    <span className="text-gray-700">
                                        {act.telephone}
                                    </span>
                                </div>
                            </div>

                            {/* Expertises (aperçu) */}
                            {act.expertise && act.expertise.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex flex-wrap gap-1">
                                        {act.expertise
                                            .slice(0, 2)
                                            .map((exp) => (
                                                <span
                                                    key={exp.id}
                                                    className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                                                >
                                                    {exp.nom}
                                                </span>
                                            ))}
                                        {act.expertise.length > 2 && (
                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                                +{act.expertise.length - 2}{" "}
                                                autres
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Footer avec boutons d'action (stopPropagation pour
                                 ne pas déclencher l'ouverture du détail) */}
                            <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-between gap-1">
                                <span className="text-xs text-gray-400">
                                    Cliquer la carte pour les détails
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActivityToEdit(act);
                                        }}
                                        title="Modifier"
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActivityToToggle(act);
                                        }}
                                        title={
                                            (act.isActive ?? true)
                                                ? "Désactiver"
                                                : "Activer"
                                        }
                                        className={`p-1.5 rounded ${
                                            (act.isActive ?? true)
                                                ? "text-amber-600 hover:bg-amber-50"
                                                : "text-emerald-600 hover:bg-emerald-50"
                                        }`}
                                    >
                                        {(act.isActive ?? true) ? (
                                            <PowerOff className="w-4 h-4" />
                                        ) : (
                                            <Power className="w-4 h-4" />
                                        )}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActivityToDelete(act);
                                        }}
                                        title="Supprimer"
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Modal d'ajout d'activité */}
            {showModal && (
                <AddActivityModal
                    userId={id}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        fetchUser();
                        setShowModal(false);
                    }}
                />
            )}

            {/* Modal de détails d'activité */}
            {showActivityDetail && (
                <ActivityDetailModal
                    activity={selectedActivity}
                    onClose={closeActivityDetail}
                />
            )}

            {/* Modal Modifier — réutilise le composant EditUserModal */}
            {isEditOpen && (
                <EditUserModal
                    user={user}
                    onClose={() => setIsEditOpen(false)}
                    onSave={handleSaveEdit}
                />
            )}

            {/* Modal de confirmation Activer/Désactiver */}
            {isToggleOpen && (
                <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div
                                className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
                                    isActive ? "bg-amber-100" : "bg-emerald-100"
                                }`}
                            >
                                {isActive ? (
                                    <PowerOff className="h-6 w-6 text-amber-600" />
                                ) : (
                                    <Power className="h-6 w-6 text-emerald-600" />
                                )}
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mt-5">
                                {isActive
                                    ? "Désactiver l'utilisateur"
                                    : "Activer l'utilisateur"}
                            </h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    {isActive
                                        ? "L'utilisateur ne pourra plus se connecter à l'application tant qu'il n'aura pas été réactivé."
                                        : "L'utilisateur pourra de nouveau se connecter à l'application."}
                                </p>
                            </div>
                            <div className="flex gap-3 px-4 py-3">
                                <button
                                    onClick={() => setIsToggleOpen(false)}
                                    className="flex-1 px-4 py-2 bg-white text-gray-700 text-base font-medium rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleToggleActive}
                                    disabled={actionLoading}
                                    className={`flex-1 px-4 py-2 text-white text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        isActive
                                            ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
                                            : "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                                    }`}
                                >
                                    {actionLoading
                                        ? "..."
                                        : isActive
                                        ? "Désactiver"
                                        : "Activer"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmation de suppression */}
            {isDeleteOpen && (
                <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mt-5">
                                Supprimer l'utilisateur
                            </h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Êtes-vous sûr de vouloir supprimer
                                    l'utilisateur{" "}
                                    <span className="font-medium">
                                        {user.nom} {user.prenom}
                                    </span>{" "}
                                    ? Cette action ne peut pas être annulée.
                                </p>
                            </div>
                            <div className="flex gap-3 px-4 py-3">
                                <button
                                    onClick={() => setIsDeleteOpen(false)}
                                    className="flex-1 px-4 py-2 bg-white text-gray-700 text-base font-medium rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading
                                        ? "Suppression..."
                                        : "Supprimer"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal d'édition d'une activité */}
            {activityToEdit && (
                <EditActivityModal
                    activity={activityToEdit}
                    onClose={() => setActivityToEdit(null)}
                    onSuccess={() => {
                        fetchUser();
                        setActivityToEdit(null);
                    }}
                />
            )}

            {/* Confirmation activer/désactiver d'une activité */}
            {activityToToggle && (
                <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div
                                className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
                                    (activityToToggle.isActive ?? true)
                                        ? "bg-amber-100"
                                        : "bg-emerald-100"
                                }`}
                            >
                                {(activityToToggle.isActive ?? true) ? (
                                    <PowerOff className="h-6 w-6 text-amber-600" />
                                ) : (
                                    <Power className="h-6 w-6 text-emerald-600" />
                                )}
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mt-5">
                                {(activityToToggle.isActive ?? true)
                                    ? "Désactiver l'activité"
                                    : "Activer l'activité"}
                            </h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    {(activityToToggle.isActive ?? true)
                                        ? "L'activité ne sera plus visible côté mobile tant qu'elle n'aura pas été réactivée."
                                        : "L'activité redeviendra visible côté mobile."}
                                </p>
                            </div>
                            <div className="flex gap-3 px-4 py-3">
                                <button
                                    onClick={() => setActivityToToggle(null)}
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-white text-gray-700 text-base font-medium rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleToggleActivity}
                                    disabled={actionLoading}
                                    className={`flex-1 px-4 py-2 text-white text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        (activityToToggle.isActive ?? true)
                                            ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
                                            : "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                                    }`}
                                >
                                    {actionLoading
                                        ? "..."
                                        : (activityToToggle.isActive ?? true)
                                        ? "Désactiver"
                                        : "Activer"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation suppression d'une activité */}
            {activityToDelete && (
                <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mt-5">
                                Supprimer l'activité
                            </h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Êtes-vous sûr de vouloir supprimer
                                    l'activité{" "}
                                    <span className="font-medium">
                                        {activityToDelete.fonction}
                                    </span>{" "}
                                    ? Cette action ne peut pas être annulée.
                                </p>
                            </div>
                            <div className="flex gap-3 px-4 py-3">
                                <button
                                    onClick={() => setActivityToDelete(null)}
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-white text-gray-700 text-base font-medium rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleDeleteActivity}
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading
                                        ? "Suppression..."
                                        : "Supprimer"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
