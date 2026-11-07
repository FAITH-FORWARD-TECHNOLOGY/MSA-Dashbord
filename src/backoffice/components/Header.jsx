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
    BellIcon,
    ChevronDownIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
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
            { name: "Statistiques", href: "/statistiques" },
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

const userNavigation = [{ name: "Deconexion", href: "#" }];

const AVATAR =
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

// Anneau de focus clavier sur fond sombre.
const FOCUS_SOMBRE =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800";

function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
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
                                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">
                                        JH
                                    </span>
                                </div>
                                <span className="font-semibold text-lg hidden sm:block">
                                    JobHubs
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
                                {navigation.map((group) => {
                                    const groupActive = isActiveGroup(group);
                                    return (
                                        <Menu
                                            as="div"
                                            key={group.name}
                                            className="relative"
                                        >
                                            <MenuButton
                                                className={classNames(
                                                    groupActive
                                                        ? "bg-gray-900 text-white"
                                                        : "text-gray-300 hover:bg-gray-700 hover:text-white data-open:bg-gray-700 data-open:text-white",
                                                    "group inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                                                    FOCUS_SOMBRE
                                                )}
                                            >
                                                {group.name}
                                                <ChevronDownIcon
                                                    aria-hidden="true"
                                                    className="size-4 opacity-70 transition-transform duration-150 group-data-open:rotate-180"
                                                />
                                                {groupActive && (
                                                    <span className="sr-only">
                                                        {" "}
                                                        (section courante)
                                                    </span>
                                                )}
                                            </MenuButton>

                                            <MenuItems
                                                transition
                                                className="absolute left-0 z-20 mt-2 w-52 origin-top-left rounded-lg bg-white py-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none transition data-closed:scale-95 data-closed:opacity-0 data-enter:duration-150 data-enter:ease-out data-leave:duration-100 data-leave:ease-in"
                                            >
                                                {group.items.map((item) => {
                                                    const isActive =
                                                        isActivePath(item.href);
                                                    return (
                                                        <MenuItem key={item.href}>
                                                            <Link
                                                                to={item.href}
                                                                aria-current={
                                                                    isActive
                                                                        ? "page"
                                                                        : undefined
                                                                }
                                                                className={classNames(
                                                                    isActive
                                                                        ? "border-indigo-500 bg-indigo-50 font-semibold text-indigo-700 data-focus:bg-indigo-100"
                                                                        : "border-transparent text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900",
                                                                    "block border-l-2 px-4 py-2 text-sm data-focus:outline-none"
                                                                )}
                                                            >
                                                                {item.name}
                                                            </Link>
                                                        </MenuItem>
                                                    );
                                                })}
                                            </MenuItems>
                                        </Menu>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6">
                            {/* Notifications */}
                            <button
                                type="button"
                                className={`relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white transition-colors duration-150 ${FOCUS_SOMBRE}`}
                            >
                                <span className="absolute -inset-1.5" />
                                <span className="sr-only">
                                    Voir les notifications
                                </span>
                                <BellIcon
                                    aria-hidden="true"
                                    className="size-6"
                                />
                                {/* Badge de notification */}
                                <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-gray-800">
                                    <span className="sr-only">
                                        Nouvelles notifications
                                    </span>
                                </span>
                            </button>

                            {/* Profile dropdown */}
                            <Menu as="div" className="relative ml-3">
                                <MenuButton
                                    className={`relative flex max-w-xs items-center rounded-full bg-gray-800 text-sm ${FOCUS_SOMBRE}`}
                                >
                                    <span className="absolute -inset-1.5" />
                                    <span className="sr-only">
                                        Ouvrir le menu utilisateur
                                    </span>
                                    <img
                                        alt=""
                                        src={AVATAR}
                                        className="size-8 rounded-full ring-2 ring-transparent hover:ring-indigo-500 transition-shadow duration-150"
                                    />
                                    <div className="absolute -bottom-1 -right-1 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-gray-800">
                                        <span className="sr-only">
                                            En ligne
                                        </span>
                                    </div>
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
                    {navigation.map((group, index) => (
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
                        <div className="shrink-0 relative">
                            <img
                                alt=""
                                src={AVATAR}
                                className="size-10 rounded-full ring-2 ring-indigo-500"
                            />
                            <div className="absolute -bottom-1 -right-1 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-gray-900"></div>
                        </div>
                        <div className="ml-3">
                            <div className="text-base/5 font-medium text-white">
                                {user?.nom} {user?.prenom}
                            </div>
                            <div className="text-sm font-medium text-gray-400">
                                {user?.email}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="relative ml-auto shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                        >
                            <span className="absolute -inset-1.5" />
                            <span className="sr-only">
                                Voir les notifications
                            </span>
                            <BellIcon aria-hidden="true" className="size-6" />
                            <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-gray-800"></span>
                        </button>
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
