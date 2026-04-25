import React, { useEffect, useState } from "react";
import ActiviteList from "../components/ActiviteList";

function ActivitePage() {
    const [activites, setActivites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const fetchActivites = async () => {
        try {
            const res = await fetch(
                "https://api-msa.mydigifinance.com/activites"
            );
            if (!res.ok)
                throw new Error("Erreur lors du chargement des catégories");
            const data = await res.json();
            setActivites(data.reverse());
        } catch (err) {
            setError("Échec du chargement des catégories");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchActivites();
    }, []);
    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Gestion des activites
            </h2>

            {loading && <p className="text-blue-600">Chargement...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && <ActiviteList activities={activites} />}
        </div>
    );
}

export default ActivitePage;
