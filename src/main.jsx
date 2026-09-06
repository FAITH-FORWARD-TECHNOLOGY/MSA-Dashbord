import { StrictMode } from "react";
import { ENV_LABEL } from "./backoffice/config/environment";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import MainLayout from "./backoffice/MainLayout.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import UsersPage from "./backoffice/pages/UsersPage.jsx";
import UserProfil from "./backoffice/pages/UserProfil.jsx";
import CategoriePage from "./backoffice/pages/CategoriePage.jsx";
import PagePays from "./backoffice/pages/PagePays.jsx";
import ActivitePage from "./backoffice/pages/ActivitePage.jsx";
import CellulePage from "./backoffice/pages/CellulePage.jsx";
import CelluleDetail from "./backoffice/pages/CelluleDetail.jsx";
import LoginForm from "./backoffice/pages/LoginForm.jsx";
// Nouvelle page pour gérer les destinations de covoiturage côté admin.
import RideDestinationsPage from "./backoffice/pages/RideDestinationsPage.jsx";
// Page de configuration de version pour piloter le modal de MAJ mobile.
import AppVersionPage from "./backoffice/pages/AppVersionPage.jsx";
import CommunicationPage from "./backoffice/pages/CommunicationPage.jsx";
// Plans de lecture + verset du jour (pilotage du module Bible mobile).
import ReadingPlansPage from "./backoffice/pages/ReadingPlansPage.jsx";
import DailyVersePage from "./backoffice/pages/DailyVersePage.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                index: true,
                element: <UsersPage />,
            },
            {
                path: "users",
                element: <UsersPage />,
            },
            {
                path: "users/:id",
                element: <UserProfil />,
            },
            {
                path: "categorie",
                element: <CategoriePage />,
            },
            {
                path: "pays",
                element: <PagePays />,
            },
            {
                path: "activites",
                element: <ActivitePage />,
            },
            {
                path: "cellules",
                element: <CellulePage />,
            },
            {
                path: "cellules/:id",
                element: <CelluleDetail />,
            },
            // Route "/destinations" → CRUD covoiturage (lien dans le Header).
            {
                path: "destinations",
                element: <RideDestinationsPage />,
            },
            // Route "/app-version" → configuration du système de MAJ mobile.
            {
                path: "app-version",
                element: <AppVersionPage />,
            },
            // Plans de lecture (CRUD admin du module Bible mobile).
            {
                path: "reading-plans",
                element: <ReadingPlansPage />,
            },
            // Verset du jour (pool + override par date).
            {
                path: "daily-verse",
                element: <DailyVersePage />,
            },
            // Module Communication : mediatheque + directs (liens YouTube).
            {
                path: "communication",
                element: <CommunicationPage />,
            },
            {
                path: "login",
                element: <LoginForm />,
            },
        ],
    },
]);

// Titre de l'onglet : suffixe l'environnement pour distinguer les instances
// ouvertes cote a cote dans le navigateur.
if (ENV_LABEL) document.title = `${document.title} — ${ENV_LABEL}`;

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
