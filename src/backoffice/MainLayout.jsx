import Header from "./components/Header";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { usePermissions } from "./hooks/usePermissions";
import { navigation } from "./config/navigation";
import { premiereRoute, routeAutorisee } from "./utils/permissions";

const MESSAGE_REFUS = "Vous n'avez pas accès à cette page.";

// Message de refus en tête de page ; role="alert" pour les lecteurs d'écran.
function BandeauRefus({ message }) {
    return (
        <div
            role="alert"
            className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
            {message}
        </div>
    );
}

export default function MainLayout() {
    const location = useLocation();
    const acces = usePermissions();
    const refus = location.state?.refus === true;
    let contenu = <Outlet />;

    if (!routeAutorisee(acces, location.pathname)) {
        // Permissions de /auth/moi encore attendues : pas de redirection prématurée.
        contenu = acces.chargement ? (
            <p className="text-sm text-gray-500" role="status">Chargement…</p>
        ) : (
            <Navigate to="/" replace state={{ refus: true }} />
        );
    } else if (location.pathname === "/") {
        // Accueil = liste des utilisateurs ; sans ce droit, première page accessible.
        const cible = premiereRoute(navigation, acces);
        if (!acces.peut("bo.utilisateurs.voir")) {
            contenu = cible ? (
                <Navigate to={cible} replace state={{ refus }} />
            ) : (
                <BandeauRefus message="Aucun module n'est disponible pour votre compte. Contactez un super admin." />
            );
        }
    }

    return (
        <div className="min-h-full">
            <Header />
            <main>
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {refus && <BandeauRefus message={MESSAGE_REFUS} />}
                    {contenu}
                </div>
            </main>
        </div>
    );
}
