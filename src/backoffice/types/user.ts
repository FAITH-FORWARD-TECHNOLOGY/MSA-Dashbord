type Pays = {
    id: number;
    nom: string;
    code: string;
    flag: string;
    createdAt: string;
    updatedAt: string;
};
type Cellule = {
    id: number;
    name: string;
    leaderPersonId: number;
    locationDesc: string;
    locationLink: string;
    startTime: string;
    contactPhone: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

// Attribution de rôle affichée dans la liste des comptes (serveur à rôles).
type RoleUtilisateur = {
    id: number;
    nom: string;
    type: string;
    celluleId?: number | null;
};

type User = {
    id: number;
    nom: string;
    prenom: string;
    role: string;
    email: string;
    phoneNumber?: string;
    paysId: number;
    celluleId?: number;
    createdAt: string;
    updatedAt: string;
    pays: Pays;
    roles?: RoleUtilisateur[];
};
export type { User, Pays, Cellule, RoleUtilisateur };
