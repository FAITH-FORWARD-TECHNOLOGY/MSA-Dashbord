import {
    Disclosure,
    DisclosureButton,
    DisclosurePanel,
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
} from "@headlessui/react";
import {
    Bars3Icon,
    ChevronDownIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ENV_LABEL, ENV_BADGE_CLASS } from "../config/environment";

// Navigation groupée par thème : un menu déroulant par groupe.
const navigation = [
    {
        name: "Membres",
        items: [
            { name: "Utilisateurs", href: "/users" },
            { name: "Cellules", href: "/cellules" },
            { name: "Membres par quartier", href: "/membres-par-quartier", adminOnly: true },
            { name: "Statistiques", href: "/statistiques" },
            { name: "Export des données", href: "/export-donnees", adminOnly: true },
        ],
    },
    {
        name: "Contenus",
        items: [
            { name: "Activités", href: "/activites" },
            { name: "Catégories", href: "/categorie" },
            { name: "Pays", href: "/pays" },
            { name: "Destinations", href: "/destinations" },
        ],
    },
    {
        name: "Module Bible",
        items: [
            { name: "Plans", href: "/reading-plans" },
            { name: "Verset du jour", href: "/daily-verse" },
            { name: "Communication", href: "/communication" },
        ],
    },
    {
        name: "Configuration",
        items: [{ name: "Version App", href: "/app-version" }],
    },
];

const userNavigation = [{ name: "Déconnexion", href: "#" }];

// Initiales de l'utilisateur connecté, à la place d'une photo.
function initiales(user) {
    const i = `${user?.prenom?.[0] ?? ""}${user?.nom?.[0] ?? ""}`.toUpperCase();
    return i || "?";
}

function Avatar({ user, className = "size-8 text-xs" }) {
    return (
        <span
            aria-hidden="true"
            className={`inline-flex items-center justify-center rounded-full bg-[#0955FF] font-semibold text-white ${className}`}
        >
            {initiales(user)}
        </span>
    );
}

// Anneau de focus clavier sur fond sombre.
const FOCUS_SOMBRE =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800";

function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}

// Un seul groupe ouvert à la fois : l'ouverture d'un groupe ferme les autres.
const NAV_OPEN_EVENT = "nav-group-open";

// Groupe de navigation : s'ouvre au survol de la souris, au toucher et au clavier.
function NavGroup({ group, active, isActivePath }) {
    const [open, setOpen] = useState(false);
    const closeTimer = useRef(null);
    const rootRef = useRef(null);
    const buttonRef = useRef(null);
    const lastPointer = useRef("");
    const panelRef = useRef(null);
    const focusOnOpen = useRef(null);
    const panelId = useId();
    const { pathname } = useLocation();

    // Fermé après chaque navigation.
    useEffect(() => setOpen(false), [pathname]);
    useEffect(() => () => clearTimeout(closeTimer.current), []);
    useEffect(() => {
        const onOtherOpen = (e) => {
            if (e.detail !== panelId) {
                clearTimeout(closeTimer.current);
                if (panelRef.current?.contains(document.activeElement)) {
                    buttonRef.current?.focus();
                }
                setOpen(false);
            }
        };
        window.addEventListener(NAV_OPEN_EVENT, onOtherOpen);
        return () => window.removeEventListener(NAV_OPEN_EVENT, onOtherOpen);
    }, [panelId]);
    useEffect(() => {
        if (open) {
            window.dispatchEvent(
                new CustomEvent(NAV_OPEN_EVENT, { detail: panelId })
            );
        }
    }, [open, panelId]);
    // Ouvert : un toucher/clic hors du groupe ou Échap n'importe où ferme.
    useEffect(() => {
        if (!open) return undefined;
        const onDown = (e) => {
            if (!rootRef.current?.contains(e.target)) setOpen(false);
        };
        const onEscape = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("pointerdown", onDown);
        document.addEventListener("keydown", onEscape);
        return () => {
            document.removeEventListener("pointerdown", onDown);
            document.removeEventListener("keydown", onEscape);
        };
    }, [open]);
    // Focus demandé au clavier, appliqué une fois le panneau affiché.
    useEffect(() => {
        if (open && focusOnOpen.current !== null) {
            focusLink(focusOnOpen.current);
            focusOnOpen.current = null;
        }
    });

    const show = () => {
        clearTimeout(closeTimer.current);
        setOpen(true);
    };
    // Court délai pour tolérer un passage hors de la zone.
    const hideSoon = () => {
        clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => {
            // Ne ferme pas sous le focus clavier d'un lien.
            if (!panelRef.current?.contains(document.activeElement)) {
                setOpen(false);
            }
        }, 150);
    };

    const links = () => [...(panelRef.current?.querySelectorAll("a") ?? [])];
    const focusLink = (index) => {
        const all = links();
        all[(index + all.length) % all.length]?.focus();
    };

    const onKeyDown = (e) => {
        const all = links();
        const current = all.indexOf(document.activeElement);
        if (e.key === "Escape" && open) {
            e.preventDefault();
            setOpen(false);
            buttonRef.current?.focus();
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (open) {
                focusLink(current + 1);
            } else {
                focusOnOpen.current = 0;
                show();
            }
        } else if (e.key === "ArrowUp" && current !== -1) {
            e.preventDefault();
            focusLink(current - 1);
        }
    };

    return (
        <div
            ref={rootRef}
            className="relative"
            // Souris uniquement : au toucher, c'est le tap qui ouvre.
            onPointerEnter={(e) => e.pointerType === "mouse" && show()}
            onPointerLeave={(e) => e.pointerType === "mouse" && hideSoon()}
            onKeyDown={onKeyDown}
            // Sortie au clavier (Tab) ; les clics extérieurs sont gérés à part.
            onBlur={(e) => {
                if (
                    e.relatedTarget &&
                    !e.currentTarget.contains(e.relatedTarget)
                ) {
                    setOpen(false);
                }
            }}
        >
            <button
                ref={buttonRef}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onPointerDown={(e) => {
                    lastPointer.current = e.pointerType;
                }}
                // La souris a déjà ouvert au survol : son clic ne referme pas.
                onClick={(e) => {
                    clearTimeout(closeTimer.current);
                    const souris =
                        e.detail > 0 && lastPointer.current === "mouse";
                    lastPointer.current = "";
                    setOpen((o) => (souris ? true : !o));
                }}
                className={classNames(
                    active
                        ? "bg-gray-900 text-white"
                        : open
                          ? "bg-gray-700 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white",
                    "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                    FOCUS_SOMBRE
                )}
            >
                {group.name}
                <ChevronDownIcon
                    aria-hidden="true"
                    className={classNames(
                        open ? "rotate-180" : "",
                        "size-4 opacity-70 transition-transform duration-150"
                    )}
                />
                {active && <span className="sr-only"> (section courante)</span>}
            </button>

            {/* pt-2 plutôt que mt-2 : pas de trou entre bouton et panneau. */}
            <div
                id={panelId}
                ref={panelRef}
                className={classNames(
                    open
                        ? "visible opacity-100 translate-y-0"
                        : "invisible opacity-0 -translate-y-1 pointer-events-none",
                    "absolute left-0 top-full z-20 pt-2 transition-[opacity,translate] duration-150 ease-out"
                )}
            >
                <ul className="w-52 rounded-lg bg-white py-1.5 shadow-lg ring-1 ring-black/5">
                    {group.items.map((item) => {
                        const isActive = isActivePath(item.href);
                        return (
                            <li key={item.href}>
                                <Link
                                    to={item.href}
                                    onClick={() => setOpen(false)}
                                    aria-current={isActive ? "page" : undefined}
                                    className={classNames(
                                        isActive
                                            ? "border-indigo-500 bg-indigo-50 font-semibold text-indigo-700 hover:bg-indigo-100 focus-visible:bg-indigo-100"
                                            : "border-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:bg-gray-100 focus-visible:text-gray-900",
                                        "block border-l-2 px-4 py-2 text-sm focus:outline-none"
                                    )}
                                >
                                    {item.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

function Header() {
    const location = useLocation();
    const { user, logout } = useAuth();

    // Lien actif : la page courante est le lien ou une de ses sous-pages.
    const isActivePath = (href) => {
        if (href === "/") {
            return location.pathname === "/";
        }
        return location.pathname.startsWith(href);
    };

    // Liens réservés aux admins masqués pour les autres comptes.
    const navigationVisible = navigation
        .map((g) => ({
            ...g,
            items: g.items.filter((i) => !i.adminOnly || user?.role === "ADMIN"),
        }))
        .filter((g) => g.items.length > 0);

    const isActiveGroup = (group) =>
        group.items.some((item) => isActivePath(item.href));

    const handleLogout = () => {
        logout();
        window.location.href = "/login";
    };

    return (
        <Disclosure as="nav" className="bg-gray-800 shadow-lg">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center">
                        <div className="shrink-0">
                            <Link
                                to="/"
                                className={`flex items-center space-x-2 rounded-md text-white hover:text-gray-300 transition-colors ${FOCUS_SOMBRE}`}
                            >
                                <span className="flex size-9 items-center justify-center rounded-lg bg-white p-0.5">
                                    <img
                                        src="/msa-logo.png"
                                        alt=""
                                        className="size-full object-contain"
                                    />
                                </span>
                                <span className="font-semibold text-lg hidden sm:block">
                                    MSA Back-office
                                </span>
                                {ENV_LABEL && (
                                    <span
                                        className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wide ${ENV_BADGE_CLASS}`}
                                        title="Environnement de test — ce n'est pas la production"
                                    >
                                        {ENV_LABEL}
                                    </span>
                                )}
                            </Link>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-8 flex items-center gap-1">
                                {navigationVisible.map((group) => {
                                    const groupActive = isActiveGroup(group);
                                    return (
                                        <NavGroup
                                            key={group.name}
                                            group={group}
                                            active={groupActive}
                                            isActivePath={isActivePath}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6">

                            {/* Profile dropdown */}
                            <Menu as="div" className="relative">
                                <MenuButton
                                    className={`relative flex max-w-xs items-center rounded-full bg-gray-800 text-sm ${FOCUS_SOMBRE}`}
                                >
                                    <span className="absolute -inset-1.5" />
                                    <span className="sr-only">
                                        Ouvrir le menu utilisateur
                                    </span>
                                    <Avatar user={user} />
                                </MenuButton>

                                <MenuItems
                                    transition
                                    className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-xl bg-white py-2 shadow-xl ring-1 ring-black/5 transition focus:outline-none data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
                                >
                                    {/* User Info */}
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-sm font-medium text-gray-900">
                                            {user?.nom} {user?.prenom}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {user?.email}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {user?.role}
                                        </p>
                                    </div>

                                    {userNavigation.map((item) => (
                                        <MenuItem key={item.name}>
                                            {item.href === "#" ? (
                                                <button
                                                    onClick={handleLogout}
                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 data-focus:bg-indigo-50 data-focus:text-indigo-900 data-focus:outline-hidden transition-colors duration-200"
                                                >
                                                    {item.name}
                                                </button>
                                            ) : (
                                                <Link
                                                    to={item.href}
                                                    className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-indigo-50 data-focus:text-indigo-900 data-focus:outline-hidden transition-colors duration-200"
                                                >
                                                    {item.name}
                                                </Link>
                                            )}
                                        </MenuItem>
                                    ))}
                                </MenuItems>
                            </Menu>
                        </div>
                    </div>
                    <div className="-mr-2 flex md:hidden">
                        {/* Mobile menu button */}
                        <DisclosureButton
                            className={`group relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-150 ${FOCUS_SOMBRE}`}
                        >
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">
                                Ouvrir le menu principal
                            </span>
                            <Bars3Icon
                                aria-hidden="true"
                                className="block size-6 group-data-open:hidden"
                            />
                            <XMarkIcon
                                aria-hidden="true"
                                className="hidden size-6 group-data-open:block"
                            />
                        </DisclosureButton>
                    </div>
                </div>
            </div>

            {/* Mobile menu : mêmes groupes, en sections titrées */}
            <DisclosurePanel className="md:hidden bg-gray-900 border-t border-gray-700">
                <div className="space-y-4 px-2 pt-3 pb-4 sm:px-3">
                    {navigationVisible.map((group, index) => (
                        <section
                            key={group.name}
                            aria-labelledby={`nav-mobile-${index}`}
                        >
                            <h3
                                id={`nav-mobile-${index}`}
                                className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-500"
                            >
                                {group.name}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = isActivePath(item.href);
                                    return (
                                        <DisclosureButton
                                            key={item.href}
                                            as={Link}
                                            to={item.href}
                                            aria-current={
                                                isActive ? "page" : undefined
                                            }
                                            className={classNames(
                                                isActive
                                                    ? "border-indigo-500 bg-gray-800 text-white"
                                                    : "border-transparent text-gray-300 hover:bg-gray-700 hover:text-white",
                                                "block rounded-md border-l-4 px-3 py-2 text-base font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                                            )}
                                        >
                                            {item.name}
                                        </DisclosureButton>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Mobile user section */}
                <div className="border-t border-gray-700 pt-4 pb-3">
                    <div className="flex items-center px-5">
                        <Avatar user={user} className="size-10 text-sm" />
                        <div className="ml-3">
                            <div className="text-base/5 font-medium text-white">
                                {user?.nom} {user?.prenom}
                            </div>
                            <div className="text-sm font-medium text-gray-400">
                                {user?.email}
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 space-y-1 px-2">
                        {userNavigation.map((item) => (
                            <DisclosureButton
                                key={item.name}
                                as={item.href === "#" ? "button" : Link}
                                to={item.href !== "#" ? item.href : undefined}
                                onClick={
                                    item.href === "#" ? handleLogout : undefined
                                }
                                className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                {item.name}
                            </DisclosureButton>
                        ))}
                    </div>
                </div>
            </DisclosurePanel>
        </Disclosure>
    );
}

export default Header;
