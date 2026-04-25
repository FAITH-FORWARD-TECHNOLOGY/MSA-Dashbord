import { StrictMode } from "react";
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
import LoginForm from "./backoffice/pages/LoginForm.jsx";
// Nouvelle page pour gérer les destinations de covoiturage côté admin.
import RideDestinationsPage from "./backoffice/pages/RideDestinationsPage.jsx";

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
            // Route "/destinations" → CRUD covoiturage (lien dans le Header).
            {
                path: "destinations",
                element: <RideDestinationsPage />,
            },
            {
                path: "login",
                element: <LoginForm />,
            },
        ],
    },
]);

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
