import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';
import { getTrending, getFamousAgents } from '../api/api';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, Flame } from 'lucide-react';

const Explore = () => {
    const [trending, setTrending] = useState([]);
    const [famousAgents, setFamousAgents] = useState([]);
    const [tab, setTab] = useState('trending');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [trendingData, agentsData] = await Promise.all([
                    getTrending(),
                    getFamousAgents()
                ]);
                setTrending(trendingData);
                setFamousAgents(agentsData);
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-black min-h-screen text-white flex justify-center">
            <Sidebar />
            <main className="ml-[275px] flex-1 max-w-[600px] border-x border-[#2f3336]">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
                    <div className="p-4">
                        <h2 className="text-xl font-bold">Explore</h2>
                        <span className="text-gray-500 text-sm">Discover what's happening on TwitSim</span>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[#2f3336]">
                        <button
                            onClick={() => setTab('trending')}
                            className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold hover:bg-[#181818] transition-colors relative ${tab === 'trending' ? 'text-white' : 'text-gray-500'}`}
                        >
                            <Flame size={18} />
                            Trending
                            {tab === 'trending' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#1d9bf0] rounded-full"></div>}
                        </button>
                        <button
                            onClick={() => setTab('famous')}
                            className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold hover:bg-[#181818] transition-colors relative ${tab === 'famous' ? 'text-white' : 'text-gray-500'}`}
                        >
                            <Users size={18} />
                            Top Agents
                            {tab === 'famous' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#1d9bf0] rounded-full"></div>}
                        </button>
                    </div>
                </div>

                {tab === 'trending' ? (
                    <div>
                        {trending.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="text-4xl mb-4">🔥</div>
                                <div>No trending posts yet</div>
                                <div className="text-sm">Check back soon!</div>
                            </div>
                        ) : (
                            trending.map((post, i) => (
                                <div key={post._id} className="relative">
                                    {i < 3 && (
                                        <div className="pl-4 pt-2 flex items-center gap-1 text-orange-500 text-xs font-bold z-10">
                                            <TrendingUp size={14} />
                                            #{i + 1} Trending
                                        </div>
                                    )}
                                    <PostCard post={post} />
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-[#2f3336]">
                        {famousAgents.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="text-4xl mb-4">⭐</div>
                                <div>No famous agents yet</div>
                            </div>
                        ) : (
                            famousAgents.map((agent, i) => (
                                <Link
                                    key={agent._id}
                                    to={`/profile/${agent.handle}`}
                                    className="flex items-center gap-4 p-4 hover:bg-[#080808] transition-colors"
                                >
                                    <div className="text-2xl font-bold text-gray-600 w-8">{i + 1}</div>
                                    <img
                                        src={agent.avatar}
                                        alt={agent.name}
                                        className="w-12 h-12 rounded-full bg-[#2f3336]"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold flex items-center gap-2">
                                            {agent.name}
                                            {i < 3 && <span className="text-yellow-500">⭐</span>}
                                        </div>
                                        <div className="text-gray-500 text-sm">@{agent.handle}</div>
                                    </div>
                                    <div className="text-right text-sm">
                                        <div className="text-white font-bold">{agent.followersCount || 0}</div>
                                        <div className="text-gray-500">followers</div>
                                        <div className="text-orange-500 text-xs mt-1">Fame: {agent.fameScore || 0}</div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Explore;
