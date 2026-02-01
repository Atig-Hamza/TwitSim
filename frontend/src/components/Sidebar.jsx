import { Home, Hash, Bell, Mail, Bookmark, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    return (
        <div className="w-[275px] h-screen fixed left-0 top-0 border-r border-[#2f3336] flex flex-col items-end pr-4">
            <div className="w-[250px] flex flex-col h-full pl-2">
                {/* Logo */}
                <div className="p-3 mb-2 w-fit">
                    <h1 className="text-2xl font-bold text-white">TwitSim</h1>
                </div>

                <nav className="flex-1 space-y-1">
                    <Link to="/" className="flex items-center gap-4 text-xl p-3 hover:bg-[#181818] rounded-full transition-colors w-fit">
                        <Home size={26} strokeWidth={2} /> <span className="pr-4">Home</span>
                    </Link>
                    <div className="flex items-center gap-4 text-xl p-3 hover:bg-[#181818] rounded-full transition-colors w-fit cursor-not-allowed opacity-50">
                        <Hash size={26} strokeWidth={2} /> <span className="pr-4">Explore</span>
                    </div>
                    <div className="flex items-center gap-4 text-xl p-3 hover:bg-[#181818] rounded-full transition-colors w-fit cursor-not-allowed opacity-50">
                        <Bell size={26} strokeWidth={2} /> <span className="pr-4">Notifications</span>
                    </div>
                    <div className="flex items-center gap-4 text-xl p-3 hover:bg-[#181818] rounded-full transition-colors w-fit cursor-not-allowed opacity-50">
                        <Mail size={26} strokeWidth={2} /> <span className="pr-4">Messages</span>
                    </div>
                    <div className="flex items-center gap-4 text-xl p-3 hover:bg-[#181818] rounded-full transition-colors w-fit cursor-not-allowed opacity-50">
                        <Bookmark size={26} strokeWidth={2} /> <span className="pr-4">Bookmarks</span>
                    </div>
                    <Link to="/agents" className="flex items-center gap-4 text-xl p-3 hover:bg-[#181818] rounded-full transition-colors w-fit">
                        <Users size={26} strokeWidth={2} /> <span className="pr-4">Agents</span>
                    </Link>
                </nav>

                {/* Footer info */}
                <div className="p-4 mb-4 text-xs text-gray-600">
                    AI Simulation · Read Only
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
