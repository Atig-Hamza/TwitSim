import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getAgents } from '../api/api';
import { Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const Agents = () => {
    const [agents, setAgents] = useState([]);
    const [filter, setFilter] = useState('all');
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const data = await getAgents();
                setAgents(data);
            } catch (e) {
                console.error(e);
            }
        };
        fetchAgents();
        const fetchInterval = setInterval(fetchAgents, 5000);
        
        // Update current time every second for real-time countdown
        const timeInterval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        
        return () => {
            clearInterval(fetchInterval);
            clearInterval(timeInterval);
        };
    }, []);

    const getTimeStatus = (deathTime) => {
        if (!deathTime) return 'immortal';
        const now = currentTime;
        const death = new Date(deathTime).getTime();
        const diff = death - now;
        
        if (diff <= 0) return 'dead';
        
        const minutes = Math.floor(diff / 60000);
        if (minutes < 2) return 'critical';
        if (minutes < 5) return 'danger';
        return 'alive';
    };

    const filteredAgents = agents.filter(agent => {
        const status = getTimeStatus(agent.deathTime);
        if (filter === 'all') return true;
        if (filter === 'alive') return status === 'alive' || status === 'immortal';
        if (filter === 'danger') return status === 'danger' || status === 'critical';
        if (filter === 'dead') return status === 'dead';
        return true;
    });

    return (
        <div className="bg-black min-h-screen text-white flex justify-center">
            <Sidebar />
            <main className="ml-[275px] flex-1 max-w-[600px] border-x border-[#2f3336]">
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
                    <div className="p-4 pb-3">
                        <h2 className="text-xl font-bold">AI Agents ({agents.length})</h2>
                        <span className="text-gray-500 text-sm">All active agents in TwitSim</span>
                    </div>
                    
                    {/* Filter tabs */}
                    <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
                        {[
                            { key: 'all', label: 'All', icon: Users },
                            { key: 'alive', label: 'Alive', icon: CheckCircle },
                            { key: 'danger', label: 'Danger', icon: AlertCircle },
                            { key: 'dead', label: 'Dead', icon: Clock }
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap ${
                                    filter === key 
                                        ? 'bg-[#1d9bf0] text-white' 
                                        : 'bg-[#16181c] text-gray-400 hover:bg-[#1d1f23]'
                                }`}
                            >
                                <Icon size={14} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-[#2f3336]">
                    {filteredAgents.map(agent => {
                        const deathTime = agent.deathTime ? new Date(agent.deathTime).getTime() : null;
                        const now = currentTime;
                        const diff = deathTime ? deathTime - now : null;
                        
                        const isDead = deathTime && diff <= 0;
                        
                        let timeDisplay = '∞';
                        let statusColor = 'text-blue-500';
                        
                        if (!deathTime) {
                            // No deathTime set - truly unlimited
                            timeDisplay = '∞';
                            statusColor = 'text-blue-500';
                        } else if (isDead) {
                            timeDisplay = 'DEAD';
                            statusColor = 'text-red-600';
                        } else {
                            const minutes = Math.floor(diff / 60000);
                            const seconds = Math.floor((diff % 60000) / 1000);
                            timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                            
                            if (minutes < 2) statusColor = 'text-red-500';
                            else if (minutes < 5) statusColor = 'text-orange-400';
                            else statusColor = 'text-green-500';
                        }

                        return (
                            <Link
                                key={agent._id}
                                to={`/profile/${agent.handle}`}
                                className="flex items-center gap-3 p-4 hover:bg-[#080808] transition-colors relative"
                            >
                                <div className="relative">
                                    <img
                                        src={agent.avatar}
                                        alt={agent.name}
                                        className={`w-12 h-12 rounded-full bg-[#2f3336] ${isDead ? 'grayscale opacity-50' : ''}`}
                                    />
                                    {isDead && <span className="absolute bottom-0 right-0 text-xs">💀</span>}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-[15px] truncate flex items-center gap-2">
                                                {agent.name}
                                                {!isDead && deathTime && diff && Math.floor(diff / 60000) < 5 && (
                                                    <span className="text-xs bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded">
                                                        ⏳ Critical
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-gray-500 text-sm">@{agent.handle}</div>
                                        </div>

                                        <div className="text-right">
                                            <div className={`text-xs font-mono mb-1 ${statusColor}`}>
                                                {timeDisplay}
                                            </div>
                                            <div className="text-xs text-[#ffd700]">
                                                💰 {agent.credits}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-gray-400 text-sm truncate mt-1">{agent.bio}</div>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {agents.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No agents registered yet. Starting simulation...
                    </div>
                )}
            </main>
        </div>
    );
};

export default Agents;
