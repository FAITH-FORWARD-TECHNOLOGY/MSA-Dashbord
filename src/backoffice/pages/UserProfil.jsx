import ActivityDetailModal from "../components/Activitydetail";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AddActivityModal from "../components/AddActivityForm";
export default function UserProfil() {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showActivityDetail, setShowActivityDetail] = useState(false);

    async function fetchUser() {
        try {
            const res = await fetch(
                `https://api-msa.mydigifinance.com/users/${id}`
            );
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

    if (loading) return <div className="p-6 text-center">Chargement...</div>;
    if (error)
        return <div className="p-6 text-center text-red-600">{error}</div>;
    if (!user)
        return <div className="p-6 text-center">Utilisateur non trouvé</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            {/* Infos utilisateur */}
            <section className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-6">
                <img
                    src={user.pays?.flag}
                    alt={user.pays?.nom}
                    className="w-16 h-10 object-cover rounded border"
                />
                <div>
                    <h1 className="text-2xl font-bold">
                        {user.prenom} {user.nom}
                    </h1>
                    <p className="text-gray-700">Email : {user.email}</p>
                    <p className="text-gray-700">
                        Pays : {user.pays?.nom} ({user.pays?.code})
                    </p>
                    <p className="text-gray-700">
                        Rôle :{" "}
                        <span className="font-semibold">{user.role}</span>
                    </p>
                    <p className="text-gray-500 text-sm">
                        Inscrit le :{" "}
                        {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                </div>
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
                            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border border-gray-100"
                        >
                            {/* Header de la carte */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {act.logo && (
                                        <img
                                            src={act.logo}
                                            alt={act.marque}
                                            className="w-12 h-12 object-cover rounded-lg border"
                                        />
                                    )}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                                            {act.fonction}
                                        </h3>
                                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                            {act.categorie?.nom}
                                        </span>
                                    </div>
                                </div>
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

                            {/* Footer avec indicateur de clic */}
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    Cliquer pour plus de détails
                                </span>
                                <span className="text-blue-600 text-sm">→</span>
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
        </div>
    );
}
