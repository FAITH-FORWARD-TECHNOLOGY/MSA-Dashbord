import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    MapPin,
    Phone,
    Clock,
    Hash,
    Users as UsersIcon,
    Calendar,
    Mail,
    Eye,
    ExternalLink,
    Search,
} from "lucide-react";
import { API_BASE_URL } from "../config/api";

// Catégories d'ancienneté basées sur User.createdAt (proxy de la date
// d'adhésion : on n'a pas de date « rejoint la cellule » distincte).
// Bornes en jours, inclusif sur min, exclusif sur max ; null = pas de borne.
const SENIORITY_BUCKETS = [
    { value: "all", label: "Toutes ancienneté", min: null, max: null },
    { value: "lt1m", label: "Moins d'1 mois", min: 0, max: 30 },
    { value: "1to3m", label: "1 à 3 mois", min: 30, max: 90 },
    { value: "3to6m", label: "3 à 6 mois", min: 90, max: 180 },
    { value: "6to12m", label: "6 à 12 mois", min: 180, max: 365 },
    { value: "gt1y", label: "Plus d'1 an", min: 365, max: null },
];

function daysSince(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

function seniorityLabel(days) {
    if (days == null) return null;
    if (days < 30) return `${days} j`;
    if (days < 365) return `${Math.floor(days / 30)} mois`;
    const y = Math.floor(days / 365);
    const m = Math.floor((days % 365) / 30);
    return m > 0 ? `${y} an${y > 1 ? "s" : ""} ${m} mois` : `${y} an${y > 1 ? "s" : ""}`;
}

// Page de détail d'une cellule (route /cellules/:id).
// Affiche : infos de la cellule + liste des utilisateurs qui en sont membres.
// Backend :
//   - GET /cellules/:id/details
//   - GET /cellules/users/:id
const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function CelluleDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [cellule, setCellule] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [seniorityBucket, setSeniorityBucket] = useState("all");
    const [sortBy, setSortBy] = useState("nom"); // nom | recent | ancien

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [detailRes, usersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/cellules/${id}/details`),
                fetch(`${API_BASE_URL}/cellules/users/${id}`),
            ]);

            if (!detailRes.ok) {
                throw new Error(`Détails: ${detailRes.status}`);
            }
            if (!usersRes.ok) {
                throw new Error(`Utilisateurs: ${usersRes.status}`);
            }

            const detailBody = await detailRes.json();
            const usersBody = await usersRes.json();

            setCellule(detailBody?.data ?? null);
            setUsers(
                Array.isArray(usersBody?.data) ? usersBody.data : [],
            );
        } catch (err) {
            setError(err.message || "Erreur lors du chargement");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredUsers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        const bucket = SENIORITY_BUCKETS.find((b) => b.value === seniorityBucket);
        const list = users.filter((u) => {
            if (term) {
                const haystack = [u.nom, u.prenom, u.email, u.phoneNumber]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                if (!haystack.includes(term)) return false;
            }
            if (bucket && (bucket.min != null || bucket.max != null)) {
                const days = daysSince(u.createdAt);
                if (days == null) return false;
                if (bucket.min != null && days < bucket.min) return false;
                if (bucket.max != null && days >= bucket.max) return false;
            }
            return true;
        });

        if (sortBy === "recent" || sortBy === "ancien") {
            list.sort((a, b) => {
                const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return sortBy === "recent" ? db - da : da - db;
            });
        }
        return list;
    }, [users, searchTerm, seniorityBucket, sortBy]);

    if (loading) {
        return <div className="p-6 text-center text-blue-600">Chargement…</div>;
    }
    if (error) {
        return (
            <div className="p-6 text-center text-red-600">
                Impossible de charger la cellule : {error}
            </div>
        );
    }
    if (!cellule) {
        return <div className="p-6 text-center">Cellule introuvable.</div>;
    }

    const meetingDays = Array.isArray(cellule.meetingDays)
        ? cellule.meetingDays
        : [];
    const meetingDaysLabel = meetingDays.length
        ? meetingDays.map((d) => DAYS_FR[d - 1] ?? `?${d}`).join(", ")
        : "—";

    const activeUsers = users.filter((u) => u.isActive !== false);
    const inactiveUsers = users.filter((u) => u.isActive === false);

    return (
        <div className="p-4 max-w-6xl mx-auto space-y-6">
            {/* Retour */}
            <button
                type="button"
                onClick={() => navigate("/cellules")}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour à la liste des cellules
            </button>

            {/* Infos cellule */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {cellule.name}
                        </h1>
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                            {cellule.code && (
                                <span className="inline-flex items-center font-mono text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                    <Hash className="w-3 h-3 mr-1" />
                                    {cellule.code}
                                </span>
                            )}
                            <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    cellule.isActive
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                }`}
                            >
                                {cellule.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <InfoRow icon={MapPin} label="Localisation">
                        <span className="text-gray-700">
                            {cellule.locationDesc || "—"}
                        </span>
                        {cellule.locationLink && (
                            <a
                                href={cellule.locationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:underline inline-flex items-center"
                            >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Voir sur Maps
                            </a>
                        )}
                    </InfoRow>
                    <InfoRow icon={Phone} label="Contact">
                        {cellule.contactPhone ? (
                            <a
                                href={`tel:${cellule.contactPhone}`}
                                className="text-blue-600 hover:underline"
                            >
                                {cellule.contactPhone}
                            </a>
                        ) : (
                            <span className="text-gray-500">—</span>
                        )}
                    </InfoRow>
                    <InfoRow icon={Clock} label="Heure de début">
                        <span className="text-gray-700">
                            {cellule.startTime || "—"}
                        </span>
                    </InfoRow>
                    <InfoRow icon={Calendar} label="Jours de réunion">
                        <span className="text-gray-700">{meetingDaysLabel}</span>
                    </InfoRow>
                </div>
            </section>

            {/* Liste des utilisateurs */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <UsersIcon className="w-5 h-5 mr-2 text-blue-600" />
                            Membres ({filteredUsers.length}
                            {filteredUsers.length !== users.length
                                ? ` / ${users.length}`
                                : ""}
                            )
                        </h2>
                        {inactiveUsers.length > 0 && (
                            <span className="text-xs text-gray-500">
                                {activeUsers.length} actif{activeUsers.length > 1 ? "s" : ""}
                                {" · "}
                                {inactiveUsers.length} désactivé
                                {inactiveUsers.length > 1 ? "s" : ""}
                            </span>
                        )}
                    </div>

                    {/* Filtres */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Rechercher (nom, email, téléphone…)"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <select
                            value={seniorityBucket}
                            onChange={(e) => setSeniorityBucket(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            title="Filtrer par ancienneté"
                        >
                            {SENIORITY_BUCKETS.map((b) => (
                                <option key={b.value} value={b.value}>
                                    {b.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            title="Trier"
                        >
                            <option value="nom">Trier par nom (A→Z)</option>
                            <option value="recent">Plus récents d'abord</option>
                            <option value="ancien">Plus anciens d'abord</option>
                        </select>
                    </div>
                </div>

                {users.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        Aucun utilisateur n'est rattaché à cette cellule.
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        Aucun membre ne correspond aux filtres.
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {filteredUsers.map((u) => (
                            <li
                                key={u.id}
                                className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        <UsersIcon className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {u.nom} {u.prenom}
                                            </p>
                                            {u.role === "ADMIN" && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    Admin
                                                </span>
                                            )}
                                            {u.isActive === false && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                    Désactivé
                                                </span>
                                            )}
                                            {(() => {
                                                const days = daysSince(u.createdAt);
                                                const label = seniorityLabel(days);
                                                if (!label) return null;
                                                return (
                                                    <span
                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                                                        title={`Ancienneté basée sur la date de création du compte (${new Date(u.createdAt).toLocaleDateString("fr-FR")})`}
                                                    >
                                                        {label}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-0.5 text-xs text-gray-500">
                                            {u.email && (
                                                <span className="inline-flex items-center">
                                                    <Mail className="w-3 h-3 mr-1" />
                                                    {u.email}
                                                </span>
                                            )}
                                            {u.phoneNumber && (
                                                <span className="inline-flex items-center">
                                                    <Phone className="w-3 h-3 mr-1" />
                                                    {u.phoneNumber}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/users/${u.id}`)}
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 flex-shrink-0"
                                >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Voir
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

// Petit composant utilitaire pour aligner icone + label + valeur dans les
// blocs d'info — évite la répétition de markup.
function InfoRow({ icon: Icon, label, children }) {
    return (
        <div className="flex items-start gap-2">
            <Icon className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                    {label}
                </div>
                <div className="mt-0.5 text-sm">{children}</div>
            </div>
        </div>
    );
}
