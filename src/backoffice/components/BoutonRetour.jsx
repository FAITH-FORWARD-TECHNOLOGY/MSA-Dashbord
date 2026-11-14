import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { FOCUS } from "./statistiques/StatsUi";
import { cibleRetour } from "../utils/retour";

// Bouton Retour des pages de détail : revient d'où l'on vient, sinon vers `repli`.
export default function BoutonRetour({ repli, libelle = "Retour" }) {
    const navigate = useNavigate();
    const { key } = useLocation();
    return (
        <button
            type="button"
            onClick={() => navigate(cibleRetour(key, repli))}
            className={`inline-flex items-center rounded text-sm text-gray-600 hover:text-gray-900 ${FOCUS}`}
        >
            <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
            {libelle}
        </button>
    );
}
