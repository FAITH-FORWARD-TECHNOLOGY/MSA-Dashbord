import React, { useState } from "react";
import {
    Trash2,
    Pencil,
    Plus,
    ExternalLink,
    RefreshCw,
    Wand2,
} from "lucide-react";
import { useCommunication } from "../hooks/useCommunication";

// Page "Communication" du back-office : médiathèque (vidéos) et directs.
// Chaque contenu = un lien YouTube saisi ici ; l'app mobile ouvre ce lien.

const emptyAnnouncement = {
    title: "",
    rubriqueId: "",
    dateLabel: "",
    description: "",
    programUrl: "",
    publishedAt: "",
    isActive: true,
    sortOrder: 0,
};

const emptyRubrique = {
    name: "",
    description: "",
    icon: "",
    sortOrder: 0,
    isActive: true,
};

const emptyVideo = {
    title: "",
    speaker: "",
    rubriqueId: "",
    youtubeUrl: "",
    duration: "",
    dateLabel: "",
    description: "",
    isActive: true,
    sortOrder: 0,
};

const emptyLive = {
    title: "",
    speaker: "",
    youtubeUrl: "",
    isLive: false,
    scheduledAt: "",
    isActive: true,
};

// <input type="datetime-local"> <-> ISO 8601
const toLocalInput = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toIso = (local) => (local ? new Date(local).toISOString() : null);

const CommunicationPage = () => {
    const {
        videos,
        lives,
        loading,
        error,
        refresh,
        createVideo,
        updateVideo,
        deleteVideo,
        createLive,
        updateLive,
        deleteLive,
        rubriques,
        announcements,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        createRubrique,
        updateRubrique,
        deleteRubrique,
        resolveLink,
    } = useCommunication();

    const [tab, setTab] = useState("videos");
    const [form, setForm] = useState(null); // {kind, data, id}
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [resolving, setResolving] = useState(false);
    const [preview, setPreview] = useState(null); // miniature + infos resolues

    const openCreate = (kind) => {
        setPreview(null);
        setFormError("");
        setForm({
            kind,
            id: null,
            data:
                kind === "videos"
                    ? { ...emptyVideo }
                    : kind === "lives"
                      ? { ...emptyLive }
                      : kind === "announcements"
                        ? { ...emptyAnnouncement }
                        : { ...emptyRubrique },
        });
    };

    const openEdit = (kind, row) => {
        setPreview(null);
        setFormError("");
        setForm({
            kind,
            id: row.id,
            data:
                kind === "videos"
                    ? { ...emptyVideo, ...row, rubriqueId: row.rubriqueId ?? "" }
                    : kind === "lives"
                      ? {
                            ...emptyLive,
                            ...row,
                            scheduledAt: toLocalInput(row.scheduledAt),
                        }
                      : kind === "announcements"
                        ? {
                              ...emptyAnnouncement,
                              ...row,
                              rubriqueId: row.rubriqueId ?? "",
                              publishedAt: toLocalInput(row.publishedAt),
                          }
                        : { ...emptyRubrique, ...row },
        });
    };

    // Interroge YouTube (oEmbed + page publique) pour remplir le formulaire.
    const handleResolve = async () => {
        const url = form?.data?.youtubeUrl?.trim();
        if (!url) return;
        setResolving(true);
        setFormError("");
        try {
            const meta = await resolveLink(url);
            setPreview(meta);
            setForm((f) => ({
                ...f,
                data: {
                    ...f.data,
                    title: meta.title || f.data.title,
                    speaker: meta.author || f.data.speaker,
                    ...(f.kind === "videos" && meta.duration
                        ? { duration: meta.duration }
                        : {}),
                },
            }));
        } catch (err) {
            setFormError(err.message || "Impossible de lire ce lien");
        } finally {
            setResolving(false);
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError("");
        try {
            const { kind, id, data } = form;
            if (kind === "videos") {
                const payload = {
                    title: data.title,
                    speaker: data.speaker,
                    rubriqueId: data.rubriqueId ? Number(data.rubriqueId) : null,
                    youtubeUrl: data.youtubeUrl,
                    duration: data.duration || undefined,
                    dateLabel: data.dateLabel || undefined,
                    description: data.description || undefined,
                    isActive: data.isActive,
                    sortOrder: Number(data.sortOrder) || 0,
                };
                await (id ? updateVideo(id, payload) : createVideo(payload));
            } else if (kind === "lives") {
                const payload = {
                    title: data.title,
                    speaker: data.speaker,
                    youtubeUrl: data.youtubeUrl,
                    isLive: data.isLive,
                    scheduledAt: data.isLive ? null : toIso(data.scheduledAt),
                    isActive: data.isActive,
                };
                await (id ? updateLive(id, payload) : createLive(payload));
            } else if (kind === "announcements") {
                const payload = {
                    title: data.title,
                    rubriqueId: data.rubriqueId ? Number(data.rubriqueId) : null,
                    dateLabel: data.dateLabel || undefined,
                    description: data.description,
                    programUrl: data.programUrl || undefined,
                    publishedAt: data.publishedAt
                        ? toIso(data.publishedAt)
                        : undefined,
                    isActive: data.isActive,
                    sortOrder: Number(data.sortOrder) || 0,
                };
                await (id
                    ? updateAnnouncement(id, payload)
                    : createAnnouncement(payload));
            } else {
                const payload = {
                    name: data.name,
                    description: data.description || undefined,
                    icon: data.icon || undefined,
                    sortOrder: Number(data.sortOrder) || 0,
                    isActive: data.isActive,
                };
                await (id ? updateRubrique(id, payload) : createRubrique(payload));
            }
            setForm(null);
        } catch (err) {
            // Message du backend, ex. lien YouTube invalide.
            setFormError(err.message || "Échec de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (kind, row) => {
        const label = row.title || row.name;
        const extra =
            kind === "rubriques"
                ? " Les vidéos rattachées resteront dans la médiathèque, sans rubrique."
                : "";
        if (!window.confirm(`Supprimer « ${label} » ?${extra}`)) return;
        try {
            await (kind === "videos"
                ? deleteVideo(row.id)
                : kind === "lives"
                  ? deleteLive(row.id)
                  : kind === "announcements"
                    ? deleteAnnouncement(row.id)
                    : deleteRubrique(row.id));
        } catch (err) {
            window.alert(err.message || "Suppression impossible");
        }
    };

    const set = (k, v) => setForm((f) => ({ ...f, data: { ...f.data, [k]: v } }));

    const rows =
        tab === "videos"
            ? videos
            : tab === "lives"
              ? lives
              : tab === "announcements"
                ? announcements
                : rubriques;

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">
                Module Communication
            </h2>
            <p className="text-sm text-gray-500 mb-6">
                Chaque contenu est un lien YouTube. Formes acceptées :
                <code className="mx-1">youtube.com/watch?v=…</code>,
                <code className="mx-1">youtu.be/…</code>,
                <code className="mx-1">youtube.com/live/…</code> ou l’identifiant seul.
            </p>

            <div className="flex flex-wrap gap-3 mb-4">
                <button
                    className={`px-4 py-2 rounded text-sm font-medium transition ${tab === "videos" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
                    onClick={() => setTab("videos")}
                >
                    Médiathèque ({videos.length})
                </button>
                <button
                    className={`px-4 py-2 rounded text-sm font-medium transition ${tab === "lives" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
                    onClick={() => setTab("lives")}
                >
                    Directs ({lives.length})
                </button>
                <button
                    className={`px-4 py-2 rounded text-sm font-medium transition ${tab === "announcements" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
                    onClick={() => setTab("announcements")}
                >
                    Annonces ({announcements.length})
                </button>
                <button
                    className={`px-4 py-2 rounded text-sm font-medium transition ${tab === "rubriques" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
                    onClick={() => setTab("rubriques")}
                >
                    Rubriques ({rubriques.length})
                </button>
                <div className="flex-1" />
                <button
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition text-sm font-medium flex items-center gap-2"
                    onClick={refresh}
                >
                    <RefreshCw size={16} /> Rafraîchir
                </button>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2"
                    onClick={() => openCreate(tab)}
                >
                    <Plus size={16} />
                    {tab === "videos"
                        ? "Ajouter une vidéo"
                        : tab === "lives"
                          ? "Ajouter un direct"
                          : tab === "announcements"
                            ? "Ajouter une annonce"
                            : "Ajouter une rubrique"}
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>
            )}

            {loading ? (
                <p className="text-gray-500">Chargement…</p>
            ) : rows.length === 0 ? (
                <p className="text-gray-500">Aucun contenu pour le moment.</p>
            ) : (
                <div className="overflow-x-auto bg-white rounded shadow">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="text-left p-3">
                                    {tab === "rubriques" ? "Nom" : "Titre"}
                                </th>
                                <th className="text-left p-3">
                                    {tab === "rubriques"
                                        ? "Description"
                                        : "Intervenant"}
                                </th>
                                <th className="text-left p-3">
                                    {tab === "videos" || tab === "announcements"
                                        ? "Rubrique"
                                        : tab === "lives"
                                          ? "Diffusion"
                                          : "Vidéos"}
                                </th>
                                <th className="text-left p-3">
                                    {tab === "rubriques"
                                        ? "Ordre"
                                        : tab === "announcements"
                                          ? "Publiée le"
                                          : "Lien"}
                                </th>
                                <th className="text-left p-3">Actif</th>
                                <th className="text-right p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-t border-gray-100">
                                    <td className="p-3 font-medium text-gray-800">
                                        {r.title || r.name}
                                    </td>
                                    <td className="p-3 text-gray-600">
                                        {tab === "announcements"
                                            ? (r.description || "").slice(0, 60) +
                                              ((r.description || "").length > 60 ? "…" : "")
                                            : r.speaker || r.description || "—"}
                                    </td>
                                    <td className="p-3 text-gray-600">
                                        {tab === "videos"
                                            ? (r.rubrique?.name ?? "—")
                                            : tab === "lives"
                                              ? r.isLive
                                                  ? "En direct"
                                                  : r.scheduledAt
                                                    ? new Date(r.scheduledAt).toLocaleString("fr-FR")
                                                    : "—"
                                              : `${r._count?.videos ?? 0} vidéo(s)`}
                                    </td>
                                    <td className="p-3">
                                        {tab === "rubriques" ? (
                                            <span className="text-gray-600">{r.sortOrder}</span>
                                        ) : tab === "announcements" ? (
                                            <span className="text-gray-600">
                                                {r.publishedAt
                                                    ? new Date(r.publishedAt).toLocaleDateString("fr-FR")
                                                    : "—"}
                                            </span>
                                        ) : (
                                            <a
                                                href={r.youtubeUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                            >
                                                Ouvrir <ExternalLink size={13} />
                                            </a>
                                        )}
                                    </td>
                                    <td className="p-3">{r.isActive ? "Oui" : "Non"}</td>
                                    <td className="p-3 text-right whitespace-nowrap">
                                        <button
                                            className="p-2 text-gray-600 hover:text-blue-600"
                                            onClick={() => openEdit(tab, r)}
                                            title="Modifier"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            className="p-2 text-gray-600 hover:text-red-600"
                                            onClick={() => remove(tab, r)}
                                            title="Supprimer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {form && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <form
                        onSubmit={submit}
                        className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
                    >
                        <h3 className="text-lg font-bold mb-4 text-gray-800">
                            {form.id ? "Modifier" : "Ajouter"}{" "}
                            {form.kind === "videos"
                                ? "une vidéo"
                                : form.kind === "lives"
                                  ? "un direct"
                                  : form.kind === "announcements"
                                    ? "une annonce"
                                    : "une rubrique"}
                        </h3>

                        {formError && (
                            <div className="mb-3 p-3 bg-red-50 text-red-700 rounded text-sm">
                                {formError}
                            </div>
                        )}

                        {form.kind === "rubriques" ? (
                            <>
                                <label className="block mb-3">
                                    <span className="text-sm text-gray-700">Nom</span>
                                    <input
                                        required
                                        className="mt-1 w-full border rounded p-2"
                                        value={form.data.name}
                                        onChange={(e) => set("name", e.target.value)}
                                    />
                                </label>
                                <label className="block mb-3">
                                    <span className="text-sm text-gray-700">Description</span>
                                    <input
                                        className="mt-1 w-full border rounded p-2"
                                        value={form.data.description}
                                        onChange={(e) =>
                                            set("description", e.target.value)
                                        }
                                    />
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="block mb-3">
                                        <span className="text-sm text-gray-700">
                                            Icône (nom Material)
                                        </span>
                                        <input
                                            placeholder="music_note"
                                            className="mt-1 w-full border rounded p-2"
                                            value={form.data.icon}
                                            onChange={(e) => set("icon", e.target.value)}
                                        />
                                    </label>
                                    <label className="block mb-3">
                                        <span className="text-sm text-gray-700">
                                            Ordre d’affichage
                                        </span>
                                        <input
                                            type="number"
                                            className="mt-1 w-full border rounded p-2"
                                            value={form.data.sortOrder}
                                            onChange={(e) =>
                                                set("sortOrder", e.target.value)
                                            }
                                        />
                                    </label>
                                </div>
                            </>
                        ) : (
                        <>
                        <label className="block mb-3">
                            <span className="text-sm text-gray-700">Titre</span>
                            <input
                                required
                                className="mt-1 w-full border rounded p-2"
                                value={form.data.title}
                                onChange={(e) => set("title", e.target.value)}
                            />
                        </label>

                        <label className="block mb-3">
                            <span className="text-sm text-gray-700">Intervenant</span>
                            <input
                                required
                                className="mt-1 w-full border rounded p-2"
                                value={form.data.speaker}
                                onChange={(e) => set("speaker", e.target.value)}
                            />
                        </label>

                        <label className="block mb-2">
                            <span className="text-sm text-gray-700">Lien YouTube</span>
                            <input
                                required
                                placeholder="https://www.youtube.com/watch?v=…"
                                className="mt-1 w-full border rounded p-2"
                                value={form.data.youtubeUrl}
                                onChange={(e) => set("youtubeUrl", e.target.value)}
                            />
                        </label>
                        <button
                            type="button"
                            onClick={handleResolve}
                            disabled={resolving || !form.data.youtubeUrl}
                            className="mb-3 px-3 py-2 rounded bg-gray-100 text-gray-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            <Wand2 size={15} />
                            {resolving
                                ? "Lecture du lien…"
                                : "Récupérer titre, chaîne et durée"}
                        </button>

                        {preview && (
                            <div className="mb-4 flex gap-3 items-start bg-gray-50 rounded p-3">
                                {preview.thumbnailUrl && (
                                    <img
                                        src={preview.thumbnailUrl}
                                        alt=""
                                        className="w-32 rounded"
                                    />
                                )}
                                <div className="text-sm">
                                    <p className="font-medium text-gray-800">
                                        {preview.title || "Titre indisponible"}
                                    </p>
                                    <p className="text-gray-600">{preview.author}</p>
                                    <p className="text-gray-500">
                                        {preview.duration
                                            ? `Durée : ${preview.duration}`
                                            : "Durée indisponible — à saisir à la main"}
                                    </p>
                                </div>
                            </div>
                        )}

                        {form.kind === "videos" ? (
                            <>
                                <label className="block mb-3">
                                    <span className="text-sm text-gray-700">Rubrique</span>
                                    <select
                                        className="mt-1 w-full border rounded p-2"
                                        value={form.data.rubriqueId}
                                        onChange={(e) =>
                                            set("rubriqueId", e.target.value)
                                        }
                                    >
                                        <option value="">Sans rubrique</option>
                                        {rubriques.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="block mb-3">
                                        <span className="text-sm text-gray-700">Durée</span>
                                        <input
                                            placeholder="1:42:18"
                                            className="mt-1 w-full border rounded p-2"
                                            value={form.data.duration}
                                            onChange={(e) => set("duration", e.target.value)}
                                        />
                                    </label>
                                    <label className="block mb-3">
                                        <span className="text-sm text-gray-700">Date affichée</span>
                                        <input
                                            placeholder="16 août 2026"
                                            className="mt-1 w-full border rounded p-2"
                                            value={form.data.dateLabel}
                                            onChange={(e) => set("dateLabel", e.target.value)}
                                        />
                                    </label>
                                </div>
                                <label className="block mb-3">
                                    <span className="text-sm text-gray-700">Description</span>
                                    <textarea
                                        rows={3}
                                        className="mt-1 w-full border rounded p-2"
                                        value={form.data.description}
                                        onChange={(e) => set("description", e.target.value)}
                                    />
                                </label>
                            </>
                        ) : (
                            <>
                                <label className="flex items-center gap-2 mb-3">
                                    <input
                                        type="checkbox"
                                        checked={form.data.isLive}
                                        onChange={(e) => set("isLive", e.target.checked)}
                                    />
                                    <span className="text-sm text-gray-700">
                                        Diffusion en cours (affiché en haut de l’écran Directs)
                                    </span>
                                </label>
                                {!form.data.isLive && (
                                    <label className="block mb-3">
                                        <span className="text-sm text-gray-700">
                                            Début prévu — sert aux rappels de l’application
                                        </span>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="mt-1 w-full border rounded p-2"
                                            value={form.data.scheduledAt}
                                            onChange={(e) => set("scheduledAt", e.target.value)}
                                        />
                                    </label>
                                )}
                            </>
                        )}

                        </>
                        )}

                        <label className="flex items-center gap-2 mb-5">
                            <input
                                type="checkbox"
                                checked={form.data.isActive}
                                onChange={(e) => set("isActive", e.target.checked)}
                            />
                            <span className="text-sm text-gray-700">
                                {form.kind === "rubriques"
                                    ? "Rubrique visible dans l’application"
                                    : "Visible dans l’application"}
                            </span>
                        </label>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                className="px-4 py-2 rounded bg-gray-200 text-gray-700 text-sm font-medium"
                                onClick={() => setForm(null)}
                                disabled={saving}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
                                disabled={saving}
                            >
                                {saving ? "Enregistrement…" : "Enregistrer"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CommunicationPage;
