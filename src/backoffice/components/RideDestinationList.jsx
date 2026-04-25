import React, { useState } from "react";
import {
    PenIcon,
    Trash,
    X,
    Search,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Download,
    Church,
    Calendar,
    Users,
} from "lucide-react";
import RideDestinationFormModal from "./RideDestinationFormModal";

// Mapping type → label/icône/couleur pour le badge de chaque ligne du tableau.
// Garder en phase avec l'enum RideDestinationType du backend.
const TYPE_META = {
    lieu_de_culte: { label: "Lieu de culte", Icon: Church, badge: "bg-indigo-100 text-indigo-700" },
    evenement: { label: "Événement", Icon: Calendar, badge: "bg-amber-100 text-amber-700" },
    cellule: { label: "Cellule", Icon: Users, badge: "bg-emerald-100 text-emerald-700" },
};

const TYPE_FILTERS = [
    { value: "all", label: "Tous les types" },
    { value: "lieu_de_culte", label: "Lieu de culte" },
    { value: "evenement", label: "Événement" },
    { value: "cellule", label: "Cellule" },
];

// Tableau des destinations avec recherche, filtre par type, pagination,
// export CSV, toggle actif, édition (via modal) et suppression (avec confirm).
// Les callbacks onXxx viennent du hook useRideDestinations via la page parente.
function RideDestinationList({
    destinations,
    onUpdate,
    onDelete,
    onToggleActive,
}) {
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [rowLoadingId, setRowLoadingId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const filtered = destinations.filter((d) => {
        const matchesType = typeFilter === "all" || d.type === typeFilter;
        const matchesSearch =
            d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.id?.toString().includes(searchTerm);
        return matchesType && matchesSearch;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleTypeFilter = (value) => {
        setTypeFilter(value);
        setCurrentPage(1);
    };

    const exportToCSV = () => {
        if (filtered.length === 0) {
            alert("Aucune donnée à exporter");
            return;
        }
        const rows = filtered.map((d) => ({
            ID: d.id,
            Nom: d.name || "N/A",
            Type: TYPE_META[d.type]?.label ?? d.type ?? "N/A",
            Actif: d.isActive ? "Oui" : "Non",
            Latitude: d.latitude ?? "",
            Longitude: d.longitude ?? "",
            "Date de création": d.createdAt
                ? new Date(d.createdAt).toLocaleDateString("fr-FR")
                : "N/A",
            "Date de mise à jour": d.updatedAt
                ? new Date(d.updatedAt).toLocaleDateString("fr-FR")
                : "N/A",
        }));
        const headers = Object.keys(rows[0]);
        const csv = [
            headers.join(","),
            ...rows.map((r) =>
                headers
                    .map((h) => {
                        const v = r[h];
                        return typeof v === "string" && v.includes(",")
                            ? `"${v.replace(/"/g, '""')}"`
                            : v;
                    })
                    .join(","),
            ),
        ].join("\n");
        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `ride_destinations_${new Date().toISOString().split("T")[0]}.csv`;
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Appelé quand on clique sur le switch Actif d'une ligne.
    // On stocke l'id en "loading" pour griser le switch concerné pendant la requête.
    const handleToggle = async (destination) => {
        setRowLoadingId(destination.id);
        try {
            await onToggleActive(destination.id);
        } catch (err) {
            alert(err.message || "Erreur lors du changement de statut");
        } finally {
            setRowLoadingId(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        setDeleteError("");
        try {
            await onDelete(deleteTarget.id);
            setDeleteTarget(null);
        } catch (err) {
            setDeleteError(err.message || "Erreur lors de la suppression");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Rechercher une destination..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => handleTypeFilter(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {TYPE_FILTERS.map((f) => (
                            <option key={f.value} value={f.value}>
                                {f.label}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={exportToCSV}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                    title="Exporter CSV"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter CSV
                </button>
            </div>

            {destinations.length === 0 ? (
                <div className="text-center py-12">
                    <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Aucune destination
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Commencez par créer une nouvelle destination.
                    </p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Aucun résultat
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Ajuste la recherche ou le filtre.
                    </p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded shadow">
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr>
                                    {[
                                        "Id",
                                        "Nom",
                                        "Type",
                                        "Coords",
                                        "Actif",
                                        "Dernière maj",
                                        "Actions",
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            className="px-3 py-2 bg-gray-100 text-left text-xs font-semibold text-gray-700"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((d, idx) => {
                                    const meta = TYPE_META[d.type];
                                    const Icon = meta?.Icon ?? MapPin;
                                    const hasCoords =
                                        d.latitude !== null &&
                                        d.latitude !== undefined &&
                                        d.longitude !== null &&
                                        d.longitude !== undefined;
                                    return (
                                        <tr
                                            key={d.id}
                                            className={
                                                idx % 2 === 0
                                                    ? "bg-white"
                                                    : "bg-gray-50"
                                            }
                                        >
                                            <td className="px-3 py-2 text-sm text-gray-800">
                                                {d.id}
                                            </td>
                                            <td className="px-3 py-2 text-sm text-gray-900 font-medium">
                                                {d.name}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        meta?.badge ??
                                                        "bg-gray-100 text-gray-700"
                                                    }`}
                                                >
                                                    <Icon size={12} />
                                                    {meta?.label ?? d.type}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-600">
                                                {hasCoords
                                                    ? `${d.latitude}, ${d.longitude}`
                                                    : "—"}
                                            </td>
                                            <td className="px-3 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggle(d)}
                                                    disabled={rowLoadingId === d.id}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 disabled:opacity-60 ${
                                                        d.isActive
                                                            ? "bg-indigo-600"
                                                            : "bg-gray-300"
                                                    }`}
                                                    title={
                                                        d.isActive
                                                            ? "Désactiver"
                                                            : "Activer"
                                                    }
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                                                            d.isActive
                                                                ? "translate-x-6"
                                                                : "translate-x-1"
                                                        }`}
                                                    />
                                                </button>
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-600">
                                                {d.updatedAt
                                                    ? new Date(
                                                          d.updatedAt,
                                                      ).toLocaleDateString("fr-FR")
                                                    : "—"}
                                            </td>
                                            <td className="px-3 py-2 flex gap-2">
                                                <button
                                                    onClick={() => setEditing(d)}
                                                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                                    title="Modifier"
                                                >
                                                    <PenIcon
                                                        className="inline mr-1"
                                                        size={12}
                                                    />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setDeleteTarget(d)
                                                    }
                                                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                                    title="Supprimer"
                                                >
                                                    <Trash
                                                        className="inline mr-1"
                                                        size={12}
                                                    />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

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
                                            startIndex + itemsPerPage,
                                            filtered.length,
                                        )}
                                    </span>{" "}
                                    sur{" "}
                                    <span className="font-medium">
                                        {filtered.length}
                                    </span>{" "}
                                    résultats
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() =>
                                            setCurrentPage(currentPage - 1)
                                        }
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <div className="flex space-x-1">
                                        {Array.from(
                                            { length: totalPages },
                                            (_, i) => i + 1,
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
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {editing && (
                <RideDestinationFormModal
                    destination={editing}
                    onClose={() => setEditing(null)}
                    onSubmit={(payload) => onUpdate(editing.id, payload)}
                />
            )}

            {deleteTarget && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-w-lg mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Confirmer la suppression
                            </h2>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="text-gray-500 hover:text-gray-700"
                                disabled={deleteLoading}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="mb-6">
                            <p className="text-gray-600">
                                Supprimer la destination{" "}
                                <span className="font-semibold text-gray-800">
                                    "{deleteTarget.name}"
                                </span>
                                ?
                            </p>
                            <p className="text-sm text-red-600 mt-2">
                                Cette action est irréversible.
                            </p>
                        </div>
                        {deleteError && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                {deleteError}
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                                disabled={deleteLoading}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? "Suppression..." : "Supprimer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default RideDestinationList;
