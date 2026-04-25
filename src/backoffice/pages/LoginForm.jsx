import React, { useState } from "react";
import {
    Eye,
    EyeOff,
    Lock,
    Mail,
    Loader2,
    Shield,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const LoginForm = ({ onLogin }) => {
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));

        // Effacer l'erreur lors de la saisie
        if (error) setError("");
    };

    const validateForm = () => {
        if (!form.email.trim()) {
            setError("L'adresse email est requise");
            return false;
        }
        if (!form.email.includes("@")) {
            setError("Veuillez entrer une adresse email valide");
            return false;
        }
        if (!form.password) {
            setError("Le mot de passe est requis");
            return false;
        }
        return true;
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError("");

        try {
            const result = await login(form.email, form.password);

            if (result.success) {
                // Notifier le composant parent de la connexion réussie
                if (onLogin) {
                    onLogin(true);
                }

                // Rediriger vers la page principale
                navigate("/users");
            }
        } catch (err) {
            setError(err.message || "Erreur de connexion. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleLogin(e);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
            {/* Arrière-plan animé */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            {/* Formulaire de connexion */}
            <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/20">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        JobHubs Admin
                    </h1>
                    <p className="text-indigo-200">
                        Connectez-vous à votre espace d'administration
                    </p>
                </div>

                {/* Message d'erreur */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center space-x-3 backdrop-blur-sm">
                        <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
                        <p className="text-red-200 text-sm">{error}</p>
                    </div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleLogin} className="space-y-6">
                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-indigo-200">
                            Adresse email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-300" />
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                onKeyPress={handleKeyPress}
                                placeholder="Entrez votre adresse email"
                                disabled={loading}
                                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Mot de passe */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-indigo-200">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-300" />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                onKeyPress={handleKeyPress}
                                placeholder="Entrez votre mot de passe"
                                disabled={loading}
                                className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-300 hover:text-white transition-colors disabled:opacity-50"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Se souvenir de moi */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) =>
                                    setRememberMe(e.target.checked)
                                }
                                disabled={loading}
                                className="w-4 h-4 text-indigo-600 bg-white/10 border-white/20 rounded focus:ring-indigo-500 focus:ring-2 disabled:opacity-50"
                            />
                            <span className="text-sm text-indigo-200">
                                Se souvenir de moi
                            </span>
                        </label>
                        <button
                            type="button"
                            className="text-sm text-indigo-300 hover:text-white transition-colors"
                            disabled={loading}
                        >
                            Mot de passe oublié ?
                        </button>
                    </div>

                    {/* Bouton de connexion */}
                    <button
                        type="submit"
                        disabled={
                            loading || !form.email.trim() || !form.password
                        }
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Connexion en cours...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center space-x-2">
                                <CheckCircle className="w-5 h-5" />
                                <span>Se connecter</span>
                            </div>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginForm;
