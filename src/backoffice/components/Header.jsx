import {
    Disclosure,
    DisclosureButton,
    DisclosurePanel,
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
} from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const user = {
    name: "Tom Cook",
    email: "tom@example.com",
    imageUrl:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
};

const navigation = [
    { name: "Utilisateurs", href: "/users" },
    { name: "Activites", href: "/activites" },
    { name: "Catégorie", href: "/categorie" },
    { name: "Pays", href: "/pays" },
    { name: "Cellules", href: "/cellules" },
    // Nouveau lien pour la page CRUD des destinations de covoiturage.
    { name: "Destinations", href: "/destinations" },
];

const userNavigation = [{ name: "Deconexion", href: "#" }];

function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}

function Header() {
    const location = useLocation();
    const { user, logout } = useAuth();

    // Fonction pour vérifier si un lien est actif
    const isActivePath = (href) => {
        // Si c'est la page d'accueil, vérifier exactement
        if (href === "/") {
            return location.pathname === "/";
        }
        // Pour les autres pages, vérifier si le chemin commence par le href
        return location.pathname.startsWith(href);
    };

    const handleLogout = () => {
        logout();
        window.location.href = "/login";
    };

    return (
        <Disclosure as="nav" className="bg-gray-800 shadow-lg">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center">
                        <div className="shrink-0">
                            <Link
                                to="/"
                                className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">
                                        JH
                                    </span>
                                </div>
                                <span className="font-semibold text-lg hidden sm:block">
                                    JobHubs
                                </span>
                            </Link>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                {navigation.map((item) => {
                                    const isActive = isActivePath(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            aria-current={
                                                isActive ? "page" : undefined
                                            }
                                            className={classNames(
                                                isActive
                                                    ? "bg-gray-900 text-white border-b-2 border-indigo-500"
                                                    : "text-gray-300 hover:bg-gray-700 hover:text-white",
                                                "rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105"
                                            )}
                                        >
                                            {item.name}
                                            {isActive && (
                                                <span className="ml-2 inline-block w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                                            )}
                                        </Link>
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
                                className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden transition-colors duration-200 hover:scale-110"
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
                                <MenuButton className="relative flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 transition-all duration-200 hover:scale-110">
                                    <span className="absolute -inset-1.5" />
                                    <span className="sr-only">
                                        Ouvrir le menu utilisateur
                                    </span>
                                    <img
                                        alt=""
                                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                        className="size-8 rounded-full ring-2 ring-transparent hover:ring-indigo-500 transition-all duration-200"
                                    />
                                    <div className="absolute -bottom-1 -right-1 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-gray-800">
                                        <span className="sr-only">
                                            En ligne
                                        </span>
                                    </div>
                                </MenuButton>

                                <MenuItems
                                    transition
                                    className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-xl bg-white py-2 shadow-xl ring-1 ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
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
                        <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden transition-all duration-200">
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">
                                Ouvrir le menu principal
                            </span>
                            <Bars3Icon
                                aria-hidden="true"
                                className="block size-6 group-data-open:hidden transition-transform duration-200"
                            />
                            <XMarkIcon
                                aria-hidden="true"
                                className="hidden size-6 group-data-open:block transition-transform duration-200"
                            />
                        </DisclosureButton>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <DisclosurePanel className="md:hidden bg-gray-900 border-t border-gray-700">
                <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
                    {navigation.map((item) => {
                        const isActive = isActivePath(item.href);
                        return (
                            <DisclosureButton
                                key={item.name}
                                as={Link}
                                to={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={classNames(
                                    isActive
                                        ? "bg-gray-800 text-white border-l-4 border-indigo-500"
                                        : "text-gray-300 hover:bg-gray-700 hover:text-white",
                                    "block rounded-md px-3 py-2 text-base font-medium transition-all duration-200"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    {item.name}
                                    {isActive && (
                                        <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                                    )}
                                </div>
                            </DisclosureButton>
                        );
                    })}
                </div>

                {/* Mobile user section */}
                <div className="border-t border-gray-700 pt-4 pb-3">
                    <div className="flex items-center px-5">
                        <div className="shrink-0 relative">
                            <img
                                alt=""
                                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                className="size-10 rounded-full ring-2 ring-indigo-500"
                            />
                            <div className="absolute -bottom-1 -right-1 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-gray-900"></div>
                        </div>
                        <div className="ml-3">
                            <div className="text-base/5 font-medium text-white">
                                {user?.name}
                            </div>
                            <div className="text-sm font-medium text-gray-400">
                                {user?.email}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="relative ml-auto shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden transition-all duration-200"
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
                                className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200"
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
