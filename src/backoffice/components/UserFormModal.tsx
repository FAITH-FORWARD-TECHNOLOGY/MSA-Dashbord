import React, { useState, useEffect } from "react";
import {
    X,
    User,
    Mail,
    Phone,
    Lock,
    Globe,
    MapPin,
    Shield,
} from "lucide-react";
import { Cellule, Pays } from "../types/user";
import { useUsers } from "../hooks/useUsers";
import { usePays } from "../hooks/usePays";
import { useCellules } from "../hooks/useCellules";

type UserFormModalProps = {
    onClose: () => void;
    onSuccess: () => void;
};

const UserFormModal: React.FC<UserFormModalProps> = ({
    onClose,
    onSuccess,
}) => {
    const { createUser } = useUsers();
    const { pays } = usePays();
    const { cellules } = useCellules();

    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        email: "",
        password: "",
        phoneNumber: "",
        paysId: pays.length > 0 ? (pays[0] as any)?.id : 1,
        celluleId: cellules.length > 0 ? (cellules[0] as any)?.id : 0,
        role: "USER",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Initialiser les valeurs par défaut quand les données sont chargées
    useEffect(() => {
        if (pays.length > 0 && cellules.length > 0) {
            setFormData((prev) => ({
                ...prev,
                paysId: prev.paysId === 1 ? (pays[0] as any)?.id : prev.paysId,
                celluleId:
                    prev.celluleId === 1
                        ? (cellules[0] as any)?.id
                        : prev.celluleId,
            }));
        }
    }, [pays, cellules]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                type === "number" || name === "paysId" || name === "celluleId"
                    ? parseInt(value, 10)
                    : value,
        }));
    };

    const isValidEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const validateForm = () => {
        if (!formData.nom.trim()) return "Le nom est requis.";
        if (!formData.email.trim() || !isValidEmail(formData.email))
            return "Un email valide est requis.";
      
        if (isNaN(formData.paysId)) return "Le pays est invalide.";

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        // Filtrer les données pour supprimer les valeurs vides ou null
        const dataToSend = Object.entries(formData).reduce(
            (acc, [key, value]) => {
                // Garder les valeurs qui ne sont pas vides, null, undefined ou des chaînes vides
                if (
                    value !== null &&
                    value !== undefined &&
                    value !== "" &&
                    value !== 0
                ) {
                    acc[key] = value;
                }
                return acc;
            },
            {} as any
        );

        // S'assurer que les champs obligatoires sont présents même s'ils sont 0
        if (formData.paysId !== null && formData.paysId !== undefined) {
            dataToSend.paysId = formData.paysId;
        }
        if (
            formData.celluleId !== null &&
            formData.celluleId !== undefined &&
            formData.celluleId !== 0
        ) {
            dataToSend.celluleId = formData.celluleId;
        }

        console.log("Données envoyées:", dataToSend); // Pour debug

        setIsLoading(true);
        try {
            await createUser(dataToSend);
            onClose();
            onSuccess();
            setFormData({
                nom: "",
                prenom: "",
                email: "",
                password: "",
                paysId: pays.length > 0 ? (pays[0] as any)?.id : 1,
                celluleId: 0,
                phoneNumber: "",
                role: "USER",
            });
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    "Erreur lors de la création de l'utilisateur"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <User className="w-5 h-5 mr-2 text-blue-600" />
                        Créer un utilisateur
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-1" />
                                Nom
                            </label>
                            <input
                                name="nom"
                                type="text"
                                value={formData.nom}
                                onChange={handleChange}
                                required
                                placeholder="Entrez le nom"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-1" />
                                Prénom
                            </label>
                            <input
                                name="prenom"
                                type="text"
                                value={formData.prenom}
                                onChange={handleChange}
                                placeholder="Entrez le prénom"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Mail className="w-4 h-4 inline mr-1" />
                                Email
                            </label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="exemple@email.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Phone className="w-4 h-4 inline mr-1" />
                                Téléphone
                            </label>
                            <input
                                name="phoneNumber"
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                placeholder="+225 XX XX XX XX"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Lock className="w-4 h-4 inline mr-1" />
                                Mot de passe
                            </label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                
                                placeholder="Minimum 6 caractères"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Globe className="w-4 h-4 inline mr-1" />
                                Pays
                            </label>
                            <select
                                name="paysId"
                                value={formData.paysId}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="">Choisir un pays...</option>
                                {pays &&
                                    pays.map((p: any) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nom}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                Cellule
                            </label>
                            <select
                                name="celluleId"
                                value={formData.celluleId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="">Choisir une cellule...</option>
                                {cellules &&
                                    cellules.map((c: any) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}{" "}
                                            {c.leader?.nom
                                                ? `(Leader: ${c.leader.nom})`
                                                : ""}
                                        </option>
                                    ))}
                            </select>
                            {cellules && cellules.length === 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Aucune cellule disponible
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Shield className="w-4 h-4 inline mr-1" />
                                Rôle
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="USER">👤 Utilisateur</option>
                                <option value="ADMIN">🛡️ Admin</option>
                            </select>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading
                                    ? "Création..."
                                    : "Créer l'utilisateur"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserFormModal;
