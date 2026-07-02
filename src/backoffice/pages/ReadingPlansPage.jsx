import React, { useState } from "react";
import { useReadingPlans } from "../hooks/useReadingPlans";
import ReadingPlanFormModal from "../components/ReadingPlanFormModal";

const SCOPE_LABELS = {
    WHOLE: "Toute la Bible",
    OT: "Ancien Testament",
    NT: "Nouveau Testament",
    SPECIFIC: "Livres specifiques",
};

const ReadingPlansPage = () => {
    const { plans, loading, error, createPlan, updatePlan, setStatus, deletePlan } =
        useReadingPlans();
    const [editing, setEditing] = useState(null); // plan en cours d'edition
    const [creating, setCreating] = useState(false);

    const handleDelete = async (p) => {
        if (!window.confirm(`Supprimer le plan « ${p.title} » ?`)) return;
        try {
            await deletePlan(p.id);
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Plans de lecture
            </h2>

            <button
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
                onClick={() => setCreating(true)}
            >
                Creer un plan
            </button>

            {loading && <p className="text-blue-600">Chargement...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 text-left">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Titre</th>
                                <th className="px-4 py-3 font-semibold">Type</th>
                                <th className="px-4 py-3 font-semibold">Duree</th>
                                <th className="px-4 py-3 font-semibold">Statut</th>
                                <th className="px-4 py-3 font-semibold">Souscrits</th>
                                <th className="px-4 py-3 font-semibold">Termines</th>
                                <th className="px-4 py-3 font-semibold text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {plans.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-6 text-center text-gray-400"
                                    >
                                        Aucun plan. Cliquez sur « Creer un plan ».
                                    </td>
                                </tr>
                            )}
                            {plans.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-800">
                                        {p.title}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {SCOPE_LABELS[p.scope] || p.scope}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {p.durationDays} j
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                p.isActive
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-200 text-gray-600"
                                            }`}
                                        >
                                            {p.isActive ? "Actif" : "Inactif"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {p.subscribedCount ?? 0}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {p.completedCount ?? 0}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                className="text-blue-600 hover:underline"
                                                onClick={() => setEditing(p)}
                                            >
                                                Editer
                                            </button>
                                            <button
                                                className="text-gray-600 hover:underline"
                                                onClick={() =>
                                                    setStatus(p.id, !p.isActive).catch(
                                                        (e) => alert(e.message)
                                                    )
                                                }
                                            >
                                                {p.isActive ? "Desactiver" : "Activer"}
                                            </button>
                                            <button
                                                className="text-red-600 hover:underline"
                                                onClick={() => handleDelete(p)}
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {creating && (
                <ReadingPlanFormModal
                    plan={null}
                    onClose={() => setCreating(false)}
                    onSubmit={(payload) => createPlan(payload)}
                />
            )}
            {editing && (
                <ReadingPlanFormModal
                    plan={editing}
                    onClose={() => setEditing(null)}
                    onSubmit={(payload) => updatePlan(editing.id, payload)}
                />
            )}
        </div>
    );
};

export default ReadingPlansPage;
