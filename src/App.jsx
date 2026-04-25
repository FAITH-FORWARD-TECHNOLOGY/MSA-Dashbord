import React from "react";
import "./App.css";
import MainLayout from "./backoffice/MainLayout";
import LoginForm from "./backoffice/pages/LoginForm";
import { useAuth } from "./backoffice/hooks/useAuth";

function App() {
    const { isAuthenticated, loading } = useAuth();

    // Afficher un loader pendant la vérification de l'authentification
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Vérification de l'authentification...</p>
                </div>
            </div>
        );
    }

    // Afficher MainLayout si authentifié, sinon LoginForm
    return isAuthenticated ? <MainLayout /> : <LoginForm />;
}
export default App;
