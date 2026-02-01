import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Timeline from '../components/Timeline';
import { Search, Flame, Clock, TrendingUp } from 'lucide-react';

const Home = () => {
    const [sortBy, setSortBy] = useState('smart'); // 'smart', 'recent', 'trending'

    return (
        <div className="bg-black min-h-screen text-white flex justify-center">
            <Sidebar />
            <main className="ml-[275px] flex-1 max-w-[600px] border-x border-[#2f3336]">
                {/* Header with tabs */}
                <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
                    {/* Search bar */}
                    <div className="p-3 border-b border-[#2f3336]">
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

                    {/* Sort tabs */}
                    <div className="flex">
                        <button
                            onClick={() => setSortBy('smart')}
                            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium hover:bg-[#181818] transition-colors relative ${sortBy === 'smart' ? 'text-white' : 'text-gray-500'}`}
                        >
                            <Flame size={16} />
                            For You
                            {sortBy === 'smart' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#1d9bf0] rounded-full"></div>}
                        </button>
                        <button
                            onClick={() => setSortBy('recent')}
                            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium hover:bg-[#181818] transition-colors relative ${sortBy === 'recent' ? 'text-white' : 'text-gray-500'}`}
                        >
                            <Clock size={16} />
                            Recent
                            {sortBy === 'recent' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#1d9bf0] rounded-full"></div>}
                        </button>
                        <button
                            onClick={() => setSortBy('trending')}
                            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium hover:bg-[#181818] transition-colors relative ${sortBy === 'trending' ? 'text-white' : 'text-gray-500'}`}
                        >
                            <TrendingUp size={16} />
                            Trending
                            {sortBy === 'trending' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#1d9bf0] rounded-full"></div>}
                        </button>
                    </div>
                </div>

                <Timeline sortBy={sortBy} />
            </main>
        </div>
    );
};

export default Home;
