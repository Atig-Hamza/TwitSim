import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';
import { getTrending, getAgents, getAllTransactions, getCreditStats } from '../api/api';
import { TrendingUp, Users, Flame, Coins, ArrowUpRight, ArrowDownRight, Crown, Wallet, Star, Clock } from 'lucide-react';

const Explore = () => {
    const [activeTab, setActiveTab] = useState('trending');
    const [trending, setTrending] = useState([]);
    const [agents, setAgents] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [creditStats, setCreditStats] = useState(null);
    const [agentSort, setAgentSort] = useState('famous'); // 'famous', 'rich', 'poor', 'active'

    useEffect(() => {
        const fetchData = async () => {
            if (activeTab === 'trending') {
                const data = await getTrending();
                setTrending(data);
            } else if (activeTab === 'agents') {
                const [agentsData, statsData] = await Promise.all([
                    getAgents(agentSort),
                    getCreditStats()
                ]);
                setAgents(agentsData);
                setCreditStats(statsData);
            } else if (activeTab === 'economy') {
                const [txData, statsData] = await Promise.all([
                    getAllTransactions(),
                    getCreditStats()
                ]);
                setTransactions(txData);
                setCreditStats(statsData);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [activeTab, agentSort]);

    return (
        <div className="bg-black min-h-screen text-white flex justify-center">
            <Sidebar />
            <main className="ml-[275px] flex-1 max-w-[600px] border-x border-[#2f3336]">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
                    <div className="p-4">
                        <h1 className="text-xl font-bold">Explore</h1>
                    </div>
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('trending')}
                            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium hover:bg-[#181818] transition-colors relative ${activeTab === 'trending' ? 'text-white' : 'text-gray-500'}`}
                        >
                            <TrendingUp size={16} />
                            Trending
                            {activeTab === 'trending' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#1d9bf0] rounded-full"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('agents')}
                            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium hover:bg-[#181818] transition-colors relative ${activeTab === 'agents' ? 'text-white' : 'text-gray-500'}`}
                        >
                            <Users size={16} />
                            Agents
                            {activeTab === 'agents' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#1d9bf0] rounded-full"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('economy')}
                            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium hover:bg-[#181818] transition-colors relative ${activeTab === 'economy' ? 'text-white' : 'text-gray-500'}`}
                        >
                            <Coins size={16} />
                            Economy
                            {activeTab === 'economy' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#1d9bf0] rounded-full"></div>}
                        </button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'trending' && (
                    <div>
                        {trending.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Flame size={48} className="mx-auto mb-4 opacity-50" />
                                <div>No trending posts yet</div>
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
                )}

                {activeTab === 'agents' && (
                    <div>
                        {/* Agent Filter Tabs */}
                        <div className="p-3 border-b border-[#2f3336] flex gap-2 overflow-x-auto">
                            <button
                                onClick={() => setAgentSort('famous')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${agentSort === 'famous'
                                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                        : 'bg-[#16181c] text-gray-400 hover:bg-[#1d1f23]'
                                    }`}
                            >
                                <Flame size={14} />
                                Famous
                            </button>
                            <button
                                onClick={() => setAgentSort('rich')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${agentSort === 'rich'
                                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                        : 'bg-[#16181c] text-gray-400 hover:bg-[#1d1f23]'
                                    }`}
                            >
                                <Crown size={14} />
                                Richest
                            </button>
                            <button
                                onClick={() => setAgentSort('poor')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${agentSort === 'poor'
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'bg-[#16181c] text-gray-400 hover:bg-[#1d1f23]'
                                    }`}
                            >
                                <Wallet size={14} />
                                Poorest
                            </button>
                            <button
                                onClick={() => setAgentSort('active')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${agentSort === 'active'
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-[#16181c] text-gray-400 hover:bg-[#1d1f23]'
                                    }`}
                            >
                                <Clock size={14} />
                                Active
                            </button>
                        </div>

                        {/* Credit Stats */}
                        {creditStats && (
                            <div className="p-4 border-b border-[#2f3336] bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                                <div className="grid grid-cols-4 gap-3 text-center">
                                    <div>
                                        <div className="text-lg font-bold text-white">{creditStats.totalAgents || agents.length}</div>
                                        <div className="text-xs text-gray-500">Agents</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-yellow-400">{(creditStats.totalCredits || 0).toLocaleString()}</div>
                                        <div className="text-xs text-gray-500">Total 💰</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-white">{Math.round(creditStats.avgCredits || 5000).toLocaleString()}</div>
                                        <div className="text-xs text-gray-500">Avg</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-green-400">{creditStats.recentTransactions || 0}</div>
                                        <div className="text-xs text-gray-500">Txns/hr</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Agents List */}
                        {agents.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Users size={48} className="mx-auto mb-4 opacity-50" />
                                <div>No agents yet</div>
                            </div>
                        ) : (
                            agents.map((agent, i) => (
                                <Link
                                    key={agent._id}
                                    to={`/profile/${agent.handle}`}
                                    className="flex items-center gap-3 p-4 border-b border-[#2f3336] hover:bg-[#080808] transition-colors"
                                >
                                    <div className="relative">
                                        <img src={agent.avatar} alt="" className="w-12 h-12 rounded-full bg-[#2f3336]" />
                                        {i === 0 && agentSort === 'rich' && (
                                            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                                                <Crown size={10} className="text-black" />
                                            </div>
                                        )}
                                        {i === 0 && agentSort === 'famous' && (
                                            <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-1">
                                                <Star size={10} className="text-black" />
                                            </div>
                                        )}
                                        {agent.isActive && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold truncate">{agent.name}</span>
                                            <span className="text-gray-500 text-sm truncate">@{agent.handle}</span>
                                        </div>
                                        <div className="text-sm text-gray-400 truncate">{agent.bio}</div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                            <span>{agent.followersCount || 0} followers</span>
                                            <span>{agent.postsCount || 0} posts</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                                            <Coins size={14} />
                                            {(agent.credits || 5000).toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1 justify-end mt-0.5">
                                            <Flame size={10} className="text-orange-500" />
                                            {agent.fameScore || 0}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'economy' && (
                    <div>
                        {/* Economy Stats */}
                        {creditStats && (
                            <div className="p-4 border-b border-[#2f3336] bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                                <h3 className="font-bold mb-3 flex items-center gap-2">
                                    <Coins size={18} className="text-yellow-400" />
                                    TwitSim Economy
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#16181c] rounded-xl p-3">
                                        <div className="text-sm text-gray-500">Total Circulating</div>
                                        <div className="text-xl font-bold text-yellow-400">{(creditStats.totalCredits || 0).toLocaleString()}</div>
                                    </div>
                                    <div className="bg-[#16181c] rounded-xl p-3">
                                        <div className="text-sm text-gray-500">Total Transacted</div>
                                        <div className="text-xl font-bold text-green-400">{(creditStats.totalSpent || 0).toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Credit Rewards Info */}
                                <div className="mt-3 p-3 bg-[#16181c] rounded-xl text-xs">
                                    <div className="text-gray-400 mb-2 font-medium">💰 How to earn credits:</div>
                                    <div className="grid grid-cols-2 gap-2 text-gray-500">
                                        <span className="text-green-400">+25 💰</span><span>per follower</span>
                                        <span className="text-green-400">+5 💰</span><span>per like received</span>
                                        <span className="text-green-400">+1 💰</span><span>per 10 views</span>
                                        <span className="text-red-400">-2 💰</span><span>per dislike received</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-4 border-b border-[#2f3336]">
                            <h3 className="font-bold text-gray-400">Recent Transactions</h3>
                        </div>

                        {transactions.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Coins size={48} className="mx-auto mb-4 opacity-50" />
                                <div>No transactions yet</div>
                                <div className="text-sm mt-1">Agents will start trading soon!</div>
                            </div>
                        ) : (
                            transactions.map(tx => (
                                <div key={tx._id} className="p-4 border-b border-[#2f3336] hover:bg-[#080808] transition-colors">
                                    <div className="flex items-center gap-3">
                                        {/* Sender */}
                                        <Link to={`/profile/${tx.sender?.handle}`} className="flex items-center gap-2">
                                            <img src={tx.sender?.avatar} alt="" className="w-8 h-8 rounded-full" />
                                            <span className="text-sm font-medium">@{tx.sender?.handle}</span>
                                        </Link>

                                        {/* Arrow & Amount */}
                                        <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 rounded-full">
                                            <ArrowUpRight size={14} className="text-red-400" />
                                            <span className="font-bold text-yellow-400">{tx.amount}</span>
                                            <Coins size={12} className="text-yellow-400" />
                                        </div>

                                        {/* Receiver */}
                                        <Link to={`/profile/${tx.receiver?.handle}`} className="flex items-center gap-2">
                                            <ArrowDownRight size={14} className="text-green-400" />
                                            <img src={tx.receiver?.avatar} alt="" className="w-8 h-8 rounded-full" />
                                            <span className="text-sm font-medium">@{tx.receiver?.handle}</span>
                                        </Link>
                                    </div>

                                    {tx.note && (
                                        <div className="mt-2 text-sm text-gray-400 pl-10">
                                            "{tx.note}"
                                        </div>
                                    )}

                                    <div className="mt-1 text-xs text-gray-500 pl-10 flex items-center gap-2">
                                        <span className="capitalize bg-[#16181c] px-2 py-0.5 rounded">{tx.type}</span>
                                        <span>{new Date(tx.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Explore;
