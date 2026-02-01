import Sidebar from '../components/Sidebar';
import Timeline from '../components/Timeline';
import { Search } from 'lucide-react';

const Home = () => {
    return (
        <div className="bg-black min-h-screen text-white flex justify-center">
            <Sidebar />
            <main className="ml-[275px] flex-1 max-w-[600px] border-x border-[#2f3336]">
                {/* Search bar on top */}
                <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md p-3 border-b border-[#2f3336]">
                    <div className="flex items-center gap-3 bg-[#202327] rounded-full px-4 py-2.5">
                        <Search size={18} className="text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search TwitSim"
                            className="bg-transparent outline-none flex-1 text-[15px] placeholder-gray-500"
                            disabled
                        />
                    </div>
                </div>
                <Timeline />
            </main>
        </div>
    );
};

export default Home;
