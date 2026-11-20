import { AlertTriangle } from "lucide-react";
import { alerteSuperAdmins } from "../../utils/journalRoles";

// Alerte « moins de 2 super admins » ; `roles` = GET /roles?type=BACKOFFICE.
export default function AlerteSuperAdmins({ roles }) {
    if (!alerteSuperAdmins(roles)) return null;
    return (
        <div role="alert" className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
            <p className="text-sm">
                <strong>Moins de 2 super admins.</strong> Il est recommandé d'en avoir au moins deux : si le seul
                super admin perd l'accès, plus personne ne peut gérer les rôles.
            </p>
        </div>
    );
}
