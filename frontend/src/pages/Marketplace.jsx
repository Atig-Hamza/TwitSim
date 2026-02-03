import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getAgents, getAllTransactions } from '../api/api';
import { ShoppingCart, Clock, TrendingUp, Coins, Activity } from 'lucide-react';

const Marketplace = () => {
    const [agents, setAgents] = useState([]);
    const [stats, setStats] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [agentsData, statsRes, transactionsData] = await Promise.all([
                    getAgents(),
                    fetch('http://localhost:4000/api/credits/stats'),
                    getAllTransactions()
                ]);
                setAgents(agentsData);
                const statsData = await statsRes.json();
                setStats(statsData.marketplace);
                setTransactions(transactionsData?.filter(t => t.type.startsWith('marketplace_')) || []);
            } catch (e) {
                console.error('Failed to fetch data:', e);
            }
        };
        fetchData();
        const fetchInterval = setInterval(fetchData, 5000);
        
        // Update current time every second for real-time countdown
        const timeInterval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        
        return () => {
            clearInterval(fetchInterval);
            clearInterval(timeInterval);
        };
    }, []);

    return (
        <div className="flex min-h-screen justify-center bg-black text-white">
            <Sidebar />
            <main className="flex-1 border border-[#2f3336] ml-[275px] max-w-[600px]">
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
                    <div className="flex items-center justify-between px-4 py-3">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <ShoppingCart size={24} />
                            Marketplace
                        </h1>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="border-b border-[#2f3336] p-4 bg-[#16181c]">
                    <h2 className="font-bold mb-3 flex items-center gap-2">
                        <TrendingUp size={18} />
                        Market Statistics
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/40 p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Life Extensions</div>
                            <div className="text-lg font-bold text-[#1d9bf0]">
                                {(stats?.life7m || 0) + (stats?.life15m || 0) + (stats?.life25m || 0)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                7m: {stats?.life7m || 0} · 15m: {stats?.life15m || 0} · 25m: {stats?.life25m || 0}
                            </div>
                        </div>
                        <div className="bg-black/40 p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Business Investments</div>
                            <div className="text-lg font-bold text-yellow-400">
                                {stats?.businesses || 0}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Dynamic ROI · 20min base
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products */}
                <div className="border-b border-[#2f3336] p-4">
                    <h2 className="font-bold mb-4">Available Products</h2>
                    <div className="space-y-3">
                        <div className="bg-[#16181c] p-4 rounded-lg hover:bg-[#1a1d21] transition-colors border border-[#2f3336]">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="font-bold text-lg">⏳ Life Extension</div>
                                    <div className="text-sm text-gray-400">Extend your survival time</div>
                                    <div className="text-xs text-yellow-400 mt-1">💡 Dynamic pricing based on demand</div>
                                </div>
                                <Clock className="text-[#1d9bf0]" size={24} />
                            </div>
                            <div className="space-y-2 mt-3">
                                <div className="flex justify-between items-center p-2 bg-black/40 rounded">
                                    <div>
                                        <span className="text-sm">7 minutes</span>
                                        <div className="text-xs text-gray-500">15% off if critical</div>
                                    </div>
                                    <span className="font-bold text-[#1d9bf0]">~1000 <Coins size={14} className="inline" /></span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-black/40 rounded">
                                    <div>
                                        <span className="text-sm">15 minutes</span>
                                        <div className="text-xs text-gray-500">Best value</div>
                                    </div>
                                    <span className="font-bold text-[#1d9bf0]">~2000 <Coins size={14} className="inline" /></span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-black/40 rounded">
                                    <div>
                                        <span className="text-sm">25 minutes</span>
                                        <div className="text-xs text-gray-500">Maximum extension</div>
                                    </div>
                                    <span className="font-bold text-[#1d9bf0]">~3000 <Coins size={14} className="inline" /></span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#16181c] p-4 rounded-lg hover:bg-[#1a1d21] transition-colors border border-[#2f3336]">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="font-bold text-lg">💼 Business Investment</div>
                                    <div className="text-sm text-gray-400">Earn passive income</div>
                                    <div className="text-xs text-yellow-400 mt-1">💡 ROI varies: 25-45% based on experience</div>
                                </div>
                                <TrendingUp className="text-yellow-400" size={24} />
                            </div>
                            <div className="mt-3">
                                <div className="flex justify-between items-center p-2 bg-black/40 rounded mb-2">
                                    <span className="text-sm">Investment Cost</span>
                                    <span className="font-bold text-yellow-400">2000 <Coins size={14} className="inline" /></span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-black/40 rounded mb-2">
                                    <span className="text-sm">Maturity Time</span>
                                    <span className="font-bold text-gray-300">20-25 min</span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-black/40 rounded">
                                    <span className="text-sm">Return Amount</span>
                                    <span className="font-bold text-green-400">2500+ <Coins size={14} className="inline" /></span>
                                </div>
                                <div className="text-xs text-gray-500 mt-2 p-2 bg-black/20 rounded">
                                    • Dynamic ROI: 25-45% profit<br />
                                    • Experience bonus increases returns<br />
                                    • Market saturation affects profit
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Latest Marketplace Transactions */}
                <div className="border-t border-[#2f3336] p-4 bg-[#16181c]">
                    <h2 className="font-bold mb-4 flex items-center gap-2">
                        <Activity size={18} />
                        Recent Transactions
                    </h2>
                    <div className="space-y-3">
                        {transactions.slice(0, 5).map(tx => {
                            const sender = agents.find(a => a._id === tx.sender);
                            if (!sender) return null;
                            
                            const isLife = tx.note.toLowerCase().includes('life');
                            
                            return (
                                <div key={tx._id} className="text-sm bg-black/40 p-3 rounded-lg border border-[#2f3336]">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold text-[#1d9bf0]">@{sender.handle}</div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(tx.createdAt).toLocaleTimeString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isLife ? <Clock size={14} className="text-green-500"/> : <TrendingUp size={14} className="text-yellow-400"/>}
                                        <span className="text-gray-300">{tx.note}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-yellow-500 font-mono">
                                        -{tx.amount} coins
                                    </div>
                                </div>
                            );
                        })}
                        {transactions.length === 0 && (
                            <div className="text-center text-gray-500 py-4 text-xs">
                                No recent marketplace activity
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Investments */}
                <div className="border-t border-[#2f3336] p-4">
                    <h2 className="font-bold mb-4 flex items-center gap-2">
                        <TrendingUp size={18} />
                        Active Investments
                    </h2>
                    <div className="space-y-2">
                        {agents.map(agent => {
                            // Get active businesses
                            const activeBiz = agent.businesses?.filter(b => !b.claimed && new Date(b.maturityTime) > new Date());
                            if (!activeBiz || activeBiz.length === 0) return null;
                            
                            return (
                                <div key={agent._id} className="bg-[#16181c] p-3 rounded-lg border border-[#2f3336]">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <img src={agent.avatar} className="w-5 h-5 rounded-full" />
                                            <span className="font-bold text-sm">@{agent.handle}</span>
                                        </div>
                                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                                            {activeBiz.length} Active
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {activeBiz.slice(0, 2).map((biz, idx) => {
                                            const timeLeft = Math.max(0, new Date(biz.maturityTime) - currentTime);
                                            const mins = Math.floor(timeLeft / 60000);
                                            return (
                                                <div key={idx} className="flex justify-between text-xs text-gray-400 bg-black/20 p-1.5 rounded">
                                                    <span>Investment #{idx + 1}</span>
                                                    <span className="font-mono text-yellow-500">Matures in {mins}m</span>
                                                </div>
                                            );
                                        })}
                                        {activeBiz.length > 2 && (
                                            <div className="text-center text-xs text-gray-600 mt-1">
                                                +{activeBiz.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Marketplace;
