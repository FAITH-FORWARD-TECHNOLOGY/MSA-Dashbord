import React, { useState } from "react";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Briefcase,
    Download,
} from "lucide-react";

function ActiviteList({ activities }) {
    // États pour la recherche et pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Filtrer les activités selon le terme de recherche
    const filteredActivities = activities.filter(
        (activity) =>
            activity.fonction
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            activity.user?.nom
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            activity.user?.prenom
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            activity.categorie?.nom
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            activity.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.pays?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculer la pagination
    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

    // Réinitialiser la page quand la recherche change
    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    // Fonction d'export Excel
    const exportToExcel = () => {
        // Préparer les données pour l'export
        const dataToExport = filteredActivities.map((activity) => {
            return {
                ID: activity.id,
                Fonction: activity.fonction || "N/A",
                Disponibilité: activity.disponibilite || "N/A",
                "Utilisateur - Nom": activity.user?.nom || "N/A",
                "Utilisateur - Prénom": activity.user?.prenom || "N/A",
                Pays: activity.pays?.nom || "N/A",
                Région: activity.region || "N/A",
                Tarif: activity.tarif || "N/A",
                Téléphone: activity.telephone || "N/A",
                Catégorie: activity.categorie?.nom || "N/A",
                Expertises:
                    activity.expertise?.map((exp) => exp.nom).join(", ") ||
                    "N/A",
                "Date de création": activity.createdAt
                    ? new Date(activity.createdAt).toLocaleDateString("fr-FR")
                    : "N/A",
            };
        });

        // Créer le contenu CSV
        if (dataToExport.length === 0) {
            alert("Aucune donnée à exporter");
            return;
        }

        const headers = Object.keys(dataToExport[0]);
        const csvContent = [
            headers.join(","),
            ...dataToExport.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header];
                        // Échapper les virgules et guillemets dans les valeurs
                        return typeof value === "string" && value.includes(",")
                            ? `"${value.replace(/"/g, '""')}"`
                            : value;
                    })
                    .join(",")
            ),
        ].join("\n");

        // Créer et télécharger le fichier
        const blob = new Blob(["\uFEFF" + csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `activites_export_${new Date().toISOString().split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            {/* Barre de recherche et bouton d'export */}
            <div className="mb-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Rechercher une activité..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>

                    {/* Bouton d'export Excel */}
                    <button
                        onClick={exportToExcel}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                        title="Exporter vers Excel"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter Excel
                    </button>
                </div>
                {searchTerm && (
                    <p className="mt-2 text-sm text-gray-500">
                        {filteredActivities.length} résultat(s) pour "
                        {searchTerm}"
                    </p>
                )}
            </div>

            {/* Liste des activités ou message vide */}
            {activities.length === 0 ? (
                <div className="text-center py-12">
                    <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Aucune activité
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Commencez par créer une nouvelle activité.
                    </p>
                </div>
            ) : filteredActivities.length === 0 ? (
                <div className="text-center py-12">
                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Aucun résultat
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Aucune activité ne correspond à votre recherche.
                    </p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-200 divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                                        Activité
                                    </th>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                                        Utilisateur
                                    </th>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                                        Autres infos
                                    </th>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                                        Catégorie
                                    </th>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                                        Expertises
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedActivities.map((activity) => (
                                    <tr
                                        key={activity.id}
                                        className="hover:bg-gray-50"
                                    >
                                        {/* ACTIVITÉ */}
                                        <td className="px-4 py-2 text-sm text-gray-800">
                                            <div className="font-semibold">
                                                {activity.fonction}
                                            </div>
                                            <div className="text-gray-500 text-xs">
                                                {activity.disponibilite}
                                            </div>
                                        </td>

                                        {/* UTILISATEUR */}
                                        <td className="px-4 py-2 text-sm text-gray-800">
                                            <div>{`${activity.user?.prenom} ${activity.user?.nom}`}</div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                <img
                                                    src={activity.pays?.flag}
                                                    alt="flag"
                                                    className="w-4 h-4 rounded-full"
                                                />
                                                {activity.pays?.nom}
                                            </div>
                                        </td>

                                        {/* AUTRES INFOS */}
                                        <td className="px-4 py-2 text-sm text-gray-800">
                                            <div>📍 {activity.region}</div>
                                            <div>💵 {activity.tarif}</div>
                                            <div>📞 {activity.telephone}</div>
                                        </td>

                                        {/* CATÉGORIE */}
                                        <td className="px-4 py-2 text-sm text-gray-800">
                                            {activity.categorie?.nom}
                                        </td>

                                        {/* EXPERTISE */}
                                        <td className="px-4 py-2 text-sm text-gray-800">
                                            <ul className="list-disc list-inside space-y-1">
                                                {activity.expertise?.map(
                                                    (exp) => (
                                                        <li key={exp.id}>
                                                            {exp.nom}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-md shadow">
                            <div className="flex-1 flex justify-between items-center">
                                <div className="text-sm text-gray-700">
                                    Affichage de{" "}
                                    <span className="font-medium">
                                        {startIndex + 1}
                                    </span>{" "}
                                    à{" "}
                                    <span className="font-medium">
                                        {Math.min(
                                            endIndex,
                                            filteredActivities.length
                                        )}
                                    </span>{" "}
                                    sur{" "}
                                    <span className="font-medium">
                                        {filteredActivities.length}
                                    </span>{" "}
                                    résultats
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() =>
                                            setCurrentPage(currentPage - 1)
                                        }
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                        <span className="sr-only">
                                            Précédent
                                        </span>
                                    </button>

                                    <div className="flex space-x-1">
                                        {Array.from(
                                            { length: totalPages },
                                            (_, i) => i + 1
                                        ).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() =>
                                                    setCurrentPage(page)
                                                }
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                    currentPage === page
                                                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() =>
                                            setCurrentPage(currentPage + 1)
                                        }
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                        <span className="sr-only">Suivant</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}

export default ActiviteList;
