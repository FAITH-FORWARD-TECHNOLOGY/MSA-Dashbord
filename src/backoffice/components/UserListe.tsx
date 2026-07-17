import React, { useState } from "react";
import { User } from "../types/user";
import { useNavigate } from "react-router-dom";
import {
    Edit2,
    Trash2,
    Eye,
    User as UserIcon,
    Mail,
    MapPin,
    Search,
    ChevronLeft,
    ChevronRight,
    Download,
    Phone,
    Users as UsersIcon,
} from "lucide-react";
import EditUserModal from "./EditUserModal";

type UserListProps = {
    users: User[];
    onUpdate: (id: number, data: any) => void;
    onDelete: (id: number) => void;
    onView?: (id: number) => void;
};

// Construit la liste compacte de pages à afficher dans la pagination.
// Renvoie des numéros + `null` aux endroits où placer "…".
// Exemples (totalPages=39) :
//   current=1   → [1, 2, 3, 4, 5, null, 39]
//   current=11  → [1, null, 9, 10, 11, 12, 13, null, 39]
//   current=39  → [1, null, 35, 36, 37, 38, 39]
function buildPageList(
    current: number,
    total: number,
): Array<number | null> {
    // En dessous de 8 pages, on peut toutes les afficher.
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: Array<number | null> = [1];
    const start = Math.max(2, current - 2);
    const end = Math.min(total - 1, current + 2);
    if (start > 2) pages.push(null);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push(null);
    pages.push(total);
    return pages;
}

const UserList: React.FC<UserListProps> = ({
    users,
    onUpdate,
    onDelete,
    onView,
}) => {
    const navigate = useNavigate();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // États pour la recherche et pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Filtrer les utilisateurs selon le terme de recherche.
    // - Insensible à la casse.
    // - Insensible aux espaces (utile pour matcher un numéro tapé avec ou
    //   sans espaces : "01 02 03" doit trouver "01 02 03 04" ou "+22501020304").
    const filteredUsers = users.filter((user: any) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        const qDigits = searchTerm.replace(/\s+/g, "");
        const phone = (user?.phoneNumber || "").replace(/\s+/g, "");
        return (
            (user?.nom || "").toLowerCase().includes(q) ||
            (user?.prenom || "").toLowerCase().includes(q) ||
            (user?.email || "").toLowerCase().includes(q) ||
            (user?.pays?.nom || "").toLowerCase().includes(q) ||
            (user?.cellule?.name || "").toLowerCase().includes(q) ||
            (user?.cellule?.code || "").toLowerCase().includes(q) ||
            phone.includes(qDigits)
        );
    });

    // Calculer la pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Réinitialiser la page quand la recherche change
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    // Fonction d'export Excel
    const exportToExcel = () => {
        // Préparer les données pour l'export
        const dataToExport = filteredUsers.map((user) => {
            return {
                ID: user.id,
                Nom: user.nom || "N/A",
                Prénom: user.prenom || "N/A",
                Email: user.email || "N/A",
                Téléphone: user.phoneNumber || "N/A",
                Rôle: user.role || "N/A",
                Pays: user.pays?.nom || "N/A",
                "Code Pays": user.pays?.code || "N/A",
                Cellule: (user as any).cellule?.name || "N/A",
                "Code Cellule": (user as any).cellule?.code || "N/A",
                "Date de création": user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("fr-FR")
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
                        const value = (row as any)[header];
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
            `utilisateurs_export_${new Date().toISOString().split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleDelete = (user: User) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedUser) return;

        setIsLoading(true);
        try {
            await onDelete(selectedUser.id);
            setIsDeleteModalOpen(false);
            setSelectedUser(null);
        } catch (error) {
            console.error("Erreur lors de la suppression:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Barre de recherche et bouton d'export */}
            <div className="mb-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Rechercher un utilisateur..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>

                    {/* Bouton d'export Excel */}
                    <button
                        onClick={exportToExcel}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                        title="Exporter vers Excel"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter Excel
                    </button>
                </div>
                {searchTerm && (
                    <p className="mt-2 text-sm text-gray-500">
                        {filteredUsers.length} résultat(s) pour "{searchTerm}"
                    </p>
                )}
            </div>

            {/* Liste des utilisateurs ou message vide */}
            {users.length === 0 ? (
                <div className="text-center py-12">
                    <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Aucun utilisateur
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Commencez par créer un nouvel utilisateur.
                    </p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Aucun résultat
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Aucun utilisateur ne correspond à votre recherche.
                    </p>
                </div>
            ) : (
                <>
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {paginatedUsers.map((user) => (
                                <li
                                    key={user.id}
                                    className="hover:bg-gray-50 transition-colors duration-150"
                                >
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-start sm:items-center space-x-4 flex-1 min-w-0">
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                        <UserIcon className="h-6 w-6 text-gray-600" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {user.nom}{" "}
                                                            {user.prenom}
                                                        </p>
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                user.role ===
                                                                "ADMIN"
                                                                    ? "bg-purple-100 text-purple-800"
                                                                    : "bg-green-100 text-green-800"
                                                            }`}
                                                        >
                                                            {user.role ===
                                                            "ADMIN"
                                                                ? "🛡️ Admin"
                                                                : "👤 Utilisateur"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1">
                                                        <p className="flex items-center text-sm text-gray-500 min-w-0 max-w-full">
                                                            <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                            <span className="truncate">{user.email}</span>
                                                        </p>
                                                        {user.phoneNumber && (
                                                            <p className="flex items-center text-sm text-gray-500">
                                                                <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                                {user.phoneNumber}
                                                            </p>
                                                        )}
                                                        {(user as any).cellule?.name && (
                                                            <p className="flex items-center text-sm text-gray-500">
                                                                <UsersIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                                {(user as any).cellule.name}
                                                                {(user as any).cellule.code && (
                                                                    <span className="ml-1 text-xs text-gray-400 font-mono">
                                                                        ({(user as any).cellule.code})
                                                                    </span>
                                                                )}
                                                            </p>
                                                        )}
                                                        {user.pays && (
                                                            <p className="flex items-center text-sm text-gray-500">
                                                                <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                                {user.pays.nom}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap flex-shrink-0 pl-14 sm:pl-0">
                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/users/${user.id}`
                                                        )
                                                    }
                                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    Voir
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleEdit(user)
                                                    }
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    <Edit2 className="w-3 h-3 mr-1" />
                                                    Modifier
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(user)
                                                    }
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                >
                                                    <Trash2 className="w-3 h-3 mr-1" />
                                                    Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
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
                                            filteredUsers.length
                                        )}
                                    </span>{" "}
                                    sur{" "}
                                    <span className="font-medium">
                                        {filteredUsers.length}
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
                                        {buildPageList(
                                            currentPage,
                                            totalPages,
                                        ).map((page, idx) =>
                                            page === null ? (
                                                <span
                                                    key={`ellipsis-${idx}`}
                                                    className="relative inline-flex items-center px-2 py-2 text-sm text-gray-400 select-none"
                                                >
                                                    …
                                                </span>
                                            ) : (
                                                <button
                                                    key={page}
                                                    onClick={() =>
                                                        setCurrentPage(page)
                                                    }
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded ${
                                                        currentPage === page
                                                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ),
                                        )}
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

            {/* Modal d'édition */}
            {isEditModalOpen && selectedUser && (
                <EditUserModal
                    user={selectedUser}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedUser(null);
                    }}
                    onSave={async (data) => {
                        await onUpdate(selectedUser.id, data);
                        setIsEditModalOpen(false);
                        setSelectedUser(null);
                    }}
                />
            )}

            {/* Modal de confirmation de suppression */}
            {isDeleteModalOpen && selectedUser && (
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
                                        {selectedUser.nom} {selectedUser.prenom}
                                    </span>{" "}
                                    ? Cette action ne peut pas être annulée.
                                </p>
                            </div>
                            <div className="flex gap-3 px-4 py-3">
                                <button
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setSelectedUser(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-white text-gray-700 text-base font-medium rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? "Suppression..." : "Supprimer"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserList;
