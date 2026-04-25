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
};
export type { User, Pays, Cellule };
