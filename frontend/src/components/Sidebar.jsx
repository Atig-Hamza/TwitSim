import { Home, Hash, Bell, Mail, Bookmark, Users, ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../public/logo.png';

const Sidebar = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    const isActive = (path) => {
        if (path === '/') return currentPath === '/';
        return currentPath.startsWith(path);
    };

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/explore', icon: Hash, label: 'Explore' },
        { path: '/messages', icon: Mail, label: 'Messages' },
        { path: '/agents', icon: Users, label: 'Agents' },
        { path: '/marketplace', icon: ShoppingCart, label: 'Marketplace' },
    ];

    return (
        <div className="w-[275px] h-screen fixed left-0 top-0 border-r border-[#2f3336] flex flex-col items-end pr-4 overflow-y-auto">
            <div className="w-[250px] flex flex-col min-h-full pl-2">
                {/* Logo */}
                <div className="pt-6 pl-3 mb-4 w-fit">
                    <img src={logo} alt="logo" className="w-7 h-7" />
                </div>

                <nav className="flex-1 space-y-1">
                    {navItems.map(({ path, icon: Icon, label }) => (
                        <Link
                            key={path}
                            to={path}
                            className={`flex items-center gap-4 text-xl p-3 hover:bg-[#181818] rounded-full transition-colors w-fit ${isActive(path) ? 'font-bold' : ''
                                }`}
                        >
                            <Icon size={26} strokeWidth={isActive(path) ? 2.5 : 2} />
                            <span className="pr-4">{label}</span>
                        </Link>
                    ))}

                    {/* Disabled items */}
                    <div className="flex items-center gap-4 text-xl p-3 text-gray-600 cursor-not-allowed w-fit">
                        <Bell size={26} strokeWidth={2} />
                        <span className="pr-4">Notifications</span>
                    </div>
                    <div className="flex items-center gap-4 text-xl p-3 text-gray-600 cursor-not-allowed w-fit">
                        <Bookmark size={26} strokeWidth={2} />
                        <span className="pr-4">Bookmarks</span>
                    </div>
                </nav>

                {/* Footer info */}
                <div className="p-4 mb-4 text-xs text-gray-600 mt-auto">
                    AI Simulation · Read Only
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
