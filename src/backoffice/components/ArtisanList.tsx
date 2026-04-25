import React, { useState, useEffect } from "react";

// Liste des fonctions et expertises associées
const fonctionsExpertises: Record<string, string[]> = {
    Plombier: [
        "Fuites",
        "Canalisations",
        "Chauffe-eau",
        "Sanitaires",
        "Pompes",
    ],
    Electricien: [
        "Tableau électrique",
        "Prises",
        "Eclairage",
        "Dépannage",
        "Installation",
    ],
    Maçon: [
        "Fondations",
        "Murs",
        "Dallage",
        "Rénovation",
        "Construction",
        "Réparation",
        "Cimentage",
    ],
    Menuisier: ["Portes", "Fenêtres", "Placards", "Parquet"],
    "Chauffeur VTC": ["VTC", "Transport ponctuel", "Service personnalisé"],
    Photographe: ["Événementiel", "Portrait", "Retouche photo"],
    Graphiste: ["Illustrator", "Canva", "Branding"],
    "Développeur Web": ["Développement web", "Conception", "Intégration"],
    "Développeur Mobile": ["iOS", "Android", "React Native"],
    "Community Manager": [
        "Gestion des réseaux sociaux",
        "Création de contenu",
        "Stratégie digitale",
    ],
    // ...ajoute d'autres fonctions et expertises si besoin...
};

const fonctions = Object.keys(fonctionsExpertises);

// Ajoute la correspondance fonction -> catégorie
const fonctionCategories: Record<string, string> = {
    Plombier: "BTP",
    Electricien: "BTP",
    Maçon: "BTP",
    Menuisier: "BTP",
    "Chauffeur VTC": "Transport",
    Photographe: "Services",
    Graphiste: "Services",
    "Développeur Web": "Informatique",
    "Développeur Mobile": "Informatique",
    "Community Manager": "Informatique",
    // ...ajoute d'autres associations si besoin...
};

const emptyArtisan = {
    id: Number,
    nom: "",
    prenom: "",
    fonction: "",
    region: "",
    categorie: "",
    description: "",
    expertises: [] as string[],
    telephone: "",
    email: "",
    whatsapp: "",
    tarif: "",
    disponibilite: "",
    pays: "",
};

const ArtisanList = () => {
    const [artisans, setArtisans] = useState<any[]>([]);
    const [selectedArtisan, setSelectedArtisan] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [form, setForm] = useState({ ...emptyArtisan });

    // Ajoute un nouvel état pour le mode édition
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch("https://api-msa.mydigifinance.com/professionnels")
            .then((res) => {
                if (!res.ok) throw new Error("Erreur lors du chargement");
                return res.json();
            })
            .then((data) => {
                setArtisans(data.reverse());
                setLoading(false);
            })
            .catch((err) => {
                setError("Impossible de charger les artisans.");
                setLoading(false);
            });
    }, []);

    // Ouvre le modal de modification avec les infos de l'artisan
    const handleEdit = (id: number) => {
        const artisan = artisans.find((a) => a.id === id);
        if (artisan) {
            setForm({
                ...artisan,
                expertises: Array.isArray(artisan.expertises)
                    ? artisan.expertises
                    : [],
            });
            setCreateError(null);
            setEditMode(true);
            setShowCreateModal(true);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Supprimer cet artisan ?")) {
            try {
                const res = await fetch(
                    `https://api-msa.mydigifinance.com/professionnels/${id}`,
                    { method: "DELETE" }
                );
                if (!res.ok) throw new Error("Erreur lors de la suppression");
                setArtisans(artisans.filter((a) => a.id !== id));
            } catch (err) {
                alert("Erreur lors de la suppression.");
            }
        }
    };

    const handleView = (id: number) => {
        const artisan = artisans.find((a) => a.id === id);
        setSelectedArtisan(artisan || null);
    };

    const handleCloseModal = () => {
        setSelectedArtisan(null);
    };

    const handleCreate = () => {
        setForm({ ...emptyArtisan });
        setCreateError(null);
        setEditMode(false);
        setShowCreateModal(true);
    };

    const handleFormChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setForm((prev) => {
            // Si la fonction change, on met à jour la catégorie associée
            if (name === "fonction") {
                return {
                    ...prev,
                    fonction: value,
                    categorie: fonctionCategories[value] || "",
                    expertises: [],
                };
            }
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    const handleExpertisesSelect = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const selected = Array.from(e.target.selectedOptions).map(
            (opt) => opt.value
        );
        setForm((prev) => ({
            ...prev,
            expertises: selected,
        }));
    };

    // Soumission du formulaire (création ou édition)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        setCreateError(null);

        const dataToSend = {
            ...form,
            expertises: form.expertises,
        };

        try {
            let res, updatedArtisan;
            if (editMode && form.id) {
                res = await fetch(
                    `https://api-msa.mydigifinance.com/professionnels/${form.id}`,
                    {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(dataToSend),
                    }
                );
                if (!res.ok) throw new Error("Erreur lors de la modification");
                updatedArtisan = await res.json();
                setArtisans((prev) =>
                    prev.map((a) =>
                        a.id === updatedArtisan.id ? updatedArtisan : a
                    )
                );
            } else {
                res = await fetch(
                    "https://api-msa.mydigifinance.com/professionnels",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(dataToSend),
                    }
                );
                if (!res.ok) throw new Error("Erreur lors de la création");
                updatedArtisan = await res.json();
                setArtisans((prev) => [updatedArtisan, ...prev]);
            }
            setShowCreateModal(false);
            setEditMode(false);
        } catch (err) {
            setCreateError(
                editMode
                    ? "Erreur lors de la modification."
                    : "Erreur lors de la création."
            );
        } finally {
            setCreateLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Liste des Artisans
            </h2>
            <button
                onClick={handleCreate}
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
                Créer un artisan
            </button>
            {loading && (
                <div className="text-center py-8 text-blue-600 font-semibold">
                    Chargement...
                </div>
            )}
            {error && (
                <div className="text-center py-8 text-red-500 font-semibold">
                    {error}
                </div>
            )}
            {!loading && !error && (
                <div className="overflow-x-auto rounded shadow">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr>
                                <th className="px-3 py-2 bg-gray-100 text-left text-xs font-semibold text-gray-700">
                                    Nom
                                </th>
                                <th className="px-3 py-2 bg-gray-100 text-left text-xs font-semibold text-gray-700">
                                    Prénom
                                </th>
                                <th className="px-3 py-2 bg-gray-100 text-left text-xs font-semibold text-gray-700">
                                    Fonction
                                </th>
                                <th className="px-3 py-2 bg-gray-100 text-left text-xs font-semibold text-gray-700">
                                    Expertises
                                </th>
                                <th className="px-3 py-2 bg-gray-100 text-left text-xs font-semibold text-gray-700">
                                    Whatsapp
                                </th>
                                <th className="px-3 py-2 bg-gray-100 text-left text-xs font-semibold text-gray-700">
                                    Pays
                                </th>
                                <th className="px-3 py-2 bg-gray-100 text-left text-xs font-semibold text-gray-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {artisans.map((artisan, idx) => (
                                <tr
                                    key={artisan.id}
                                    className={
                                        idx % 2 === 0
                                            ? "bg-white"
                                            : "bg-gray-50"
                                    }
                                >
                                    <td className="px-3 py-2">{artisan.nom}</td>
                                    <td className="px-3 py-2">
                                        {artisan.prenom}
                                    </td>
                                    <td className="px-3 py-2">
                                        {artisan.fonction}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex flex-wrap gap-1">
                                            {artisan.expertises.map(
                                                (exp: string, i: number) => (
                                                    <span
                                                        key={i}
                                                        className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full"
                                                    >
                                                        {exp}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        {artisan.whatsapp}
                                    </td>
                                    <td className="px-3 py-2">
                                        {artisan.pays}
                                    </td>
                                    <td className="px-3 py-2 flex flex-col gap-2 md:flex-row">
                                        <button
                                            onClick={() =>
                                                handleView(artisan.id)
                                            }
                                            className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                        >
                                            Voir
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleEdit(artisan.id)
                                            }
                                            className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(artisan.id)
                                            }
                                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                        >
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {selectedArtisan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-0 relative animate-fade-in scale-100">
                        <div className="flex items-center justify-between px-6 py-4 rounded-t-2xl bg-blue-600">
                            <h3 className="text-lg font-bold text-white">
                                Détails de l'artisan
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-white hover:text-blue-200 text-2xl font-bold transition"
                                aria-label="Fermer"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                <div>
                                    <span className="font-semibold text-gray-700">
                                        Nom :
                                    </span>
                                    <span className="ml-1 text-gray-800">
                                        {selectedArtisan.nom}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">
                                        Prénom :
                                    </span>
                                    <span className="ml-1 text-gray-800">
                                        {selectedArtisan.prenom}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">
                                        Fonction :
                                    </span>
                                    <span className="ml-1 text-gray-800">
                                        {selectedArtisan.fonction}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">
                                        Région :
                                    </span>
                                    <span className="ml-1 text-gray-800">
                                        {selectedArtisan.region}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">
                                        Catégorie :
                                    </span>
                                    <span className="ml-1 text-gray-800">
                                        {selectedArtisan.categorie}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">
                                        Pays :
                                    </span>
                                    <span className="ml-1 text-gray-800">
                                        {selectedArtisan.pays}
                                    </span>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="font-semibold text-gray-700">
                                        Description :
                                    </span>
                                    <span className="ml-1 text-gray-800">
                                        {selectedArtisan.description}
                                    </span>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="font-semibold text-gray-700">
                                        Expertises :
                                    </span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {selectedArtisan.expertises.map(
                                            (exp: string, i: number) => (
                                                <span
                                                    key={i}
                                                    className="inline-block bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium"
                                                >
                                                    {exp}
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">
                                        Téléphone :
                                    </span>
                                    <span className="ml-1 text-gray-800">
                                        {selectedArtisan.telephone}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">
                                        Email :
                                    </span>
                                    <span className="ml-1 text-gray-800">
                                        {selectedArtisan.email}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">
                                        Whatsapp :
                                    </span>
                                    <span className="ml-1 text-gray-800">
                                        {selectedArtisan.whatsapp}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">
                                        Tarif :
                                    </span>
                                    <span className="ml-1 text-gray-800">
                                        {selectedArtisan.tarif}
                                    </span>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="font-semibold text-gray-700">
                                        Disponibilité :
                                    </span>
                                    <span className="ml-1 text-gray-800">
                                        {selectedArtisan.disponibilite}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de création/modification */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-0 relative animate-fade-in scale-100">
                        <div className="flex items-center justify-between px-6 py-4 rounded-t-2xl bg-blue-600">
                            <h3 className="text-lg font-bold text-white">
                                {editMode
                                    ? "Modifier un artisan"
                                    : "Ajouter un artisan"}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setEditMode(false);
                                }}
                                className="text-white hover:text-blue-200 text-2xl font-bold transition"
                                aria-label="Fermer"
                                disabled={createLoading}
                            >
                                &times;
                            </button>
                        </div>
                        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                <input
                                    className="border rounded px-3 py-2 text-sm"
                                    name="nom"
                                    placeholder="Nom"
                                    value={form.nom}
                                    onChange={handleFormChange}
                                    required
                                />
                                <input
                                    className="border rounded px-3 py-2 text-sm"
                                    name="prenom"
                                    placeholder="Prénom"
                                    value={form.prenom}
                                    onChange={handleFormChange}
                                    required
                                />
                                <select
                                    className="border rounded px-3 py-2 text-sm"
                                    name="fonction"
                                    value={form.fonction}
                                    onChange={handleFormChange}
                                    required
                                >
                                    <option value="">
                                        Sélectionner une fonction
                                    </option>
                                    {fonctions.map((f) => (
                                        <option key={f} value={f}>
                                            {f}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="border rounded px-3 py-2 text-sm"
                                    name="categorie"
                                    value={form.categorie}
                                    onChange={handleFormChange}
                                    required
                                    disabled
                                >
                                    <option value="">
                                        {form.fonction
                                            ? fonctionCategories[form.fonction]
                                            : "Sélectionner une fonction d'abord"}
                                    </option>
                                    {form.fonction && (
                                        <option
                                            value={
                                                fonctionCategories[
                                                    form.fonction
                                                ]
                                            }
                                        >
                                            {fonctionCategories[form.fonction]}
                                        </option>
                                    )}
                                </select>
                                <input
                                    className="border rounded px-3 py-2 text-sm"
                                    name="region"
                                    placeholder="Région"
                                    value={form.region}
                                    onChange={handleFormChange}
                                    required
                                />
                                <input
                                    className="border rounded px-3 py-2 text-sm"
                                    name="pays"
                                    placeholder="Pays"
                                    value={form.pays}
                                    onChange={handleFormChange}
                                    required
                                />
                                <input
                                    className="border rounded px-3 py-2 text-sm"
                                    name="telephone"
                                    placeholder="Téléphone"
                                    value={form.telephone}
                                    onChange={handleFormChange}
                                    required
                                />
                                <input
                                    className="border rounded px-3 py-2 text-sm"
                                    name="email"
                                    placeholder="Email"
                                    value={form.email}
                                    onChange={handleFormChange}
                                    required
                                />
                                <input
                                    className="border rounded px-3 py-2 text-sm"
                                    name="whatsapp"
                                    placeholder="Whatsapp"
                                    value={form.whatsapp}
                                    onChange={handleFormChange}
                                    required
                                />
                                <input
                                    className="border rounded px-3 py-2 text-sm"
                                    name="tarif"
                                    placeholder="Tarif"
                                    value={form.tarif}
                                    onChange={handleFormChange}
                                    required
                                />
                                <input
                                    className="border rounded px-3 py-2 text-sm"
                                    name="disponibilite"
                                    placeholder="Disponibilité"
                                    value={form.disponibilite}
                                    onChange={handleFormChange}
                                    required
                                />
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Expertises
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {form.fonction &&
                                            fonctionsExpertises[
                                                form.fonction
                                            ]?.map((exp) => {
                                                const selected =
                                                    form.expertises.includes(
                                                        exp
                                                    );
                                                return (
                                                    <button
                                                        type="button"
                                                        key={exp}
                                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition
                                                            ${
                                                                selected
                                                                    ? "bg-blue-600 text-white border-blue-600"
                                                                    : "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                                                            }`}
                                                        onClick={() => {
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                expertises:
                                                                    selected
                                                                        ? prev.expertises.filter(
                                                                              (
                                                                                  e: string
                                                                              ) =>
                                                                                  e !==
                                                                                  exp
                                                                          )
                                                                        : [
                                                                              ...prev.expertises,
                                                                              exp,
                                                                          ],
                                                            }));
                                                        }}
                                                    >
                                                        {exp}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                    {form.fonction &&
                                        form.expertises.length === 0 && (
                                            <div className="text-xs text-gray-400 mt-1">
                                                Sélectionnez au moins une
                                                expertise.
                                            </div>
                                        )}
                                </div>
                                <textarea
                                    className="border rounded px-3 py-2 text-sm col-span-1 sm:col-span-2"
                                    name="description"
                                    placeholder="Description"
                                    value={form.description}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>
                            {createError && (
                                <div className="text-red-500 text-sm">
                                    {createError}
                                </div>
                            )}
                            <div className="flex justify-end mt-4">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
                                    disabled={createLoading}
                                >
                                    {createLoading ? "Création..." : "Créer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArtisanList;
