import React from "react";
import { EtatVide } from "./StatsUi";
import { dateLongue, pluriel } from "./format";

// Onglet Présents : par cellule, puis par jour, la liste des présents.

// Membres en bleu, invités en ambre (mêmes teintes que la courbe Évolution).
const TEINTES = {
    membre: "bg-blue-50 text-blue-800",
    invite: "bg-amber-50 text-amber-800",
};

const PASTILLE = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

// "Martin", "Jean" -> "JM"
const initiales = (prenom, nom) =>
    `${(prenom ?? "").trim().charAt(0)}${(nom ?? "").trim().charAt(0)}`.toUpperCase() || "?";

function Avatar({ personne }) {
    return (
        <span
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${personne.invite ? TEINTES.invite : TEINTES.membre}`}
            aria-hidden="true"
        >
            {initiales(personne.prenom, personne.nom)}
        </span>
    );
}

function Jour({ jour }) {
    const presents = jour.presents ?? [];
    const invites = presents.filter((p) => p.invite).length;
    return (
        <div className="border-t border-gray-100 pt-3">
            <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-medium text-gray-800 first-letter:uppercase">
                    {dateLongue(jour.date)}
                </h4>
                <span className={`${PASTILLE} ${TEINTES.membre}`}>
                    {pluriel(presents.length, "présent")}
                </span>
                {invites > 0 && (
                    <span className={`${PASTILLE} ${TEINTES.invite}`}>
                        {pluriel(invites, "invité")}
                    </span>
                )}
            </div>
            <ul className="mt-2 grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {presents.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <Avatar personne={p} />
                        <span className="min-w-0 truncate">
                            <span className="font-medium uppercase">{p.nom}</span>{" "}
                            {p.prenom}
                        </span>
                        {p.invite && (
                            <span className={`${PASTILLE} ${TEINTES.invite}`}>Invité</span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function PresentsTab({ data }) {
    const cellules = data?.cellules ?? [];
    const avecPresents = cellules.filter((c) => (c.jours ?? []).length > 0);

    if (avecPresents.length === 0) {
        return (
            <EtatVide
                titre="Aucune présence enregistrée sur la période"
                message="Élargissez la période ou choisissez une autre cellule."
            />
        );
    }

    return (
        <div className="space-y-4">
            {avecPresents.map((c) => (
                <section
                    key={c.id}
                    className="bg-white rounded shadow p-4"
                    aria-labelledby={`presents-${c.id}`}
                >
                    <h3 id={`presents-${c.id}`} className="font-semibold text-gray-800 mb-3">
                        {c.name}
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            {pluriel(c.jours.length, "jour avec présences", "jours avec présences")}
                        </span>
                    </h3>
                    <div className="space-y-3">
                        {c.jours.map((j) => (
                            <Jour key={j.date} jour={j} />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
