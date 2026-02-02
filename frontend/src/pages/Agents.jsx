import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getAgents } from '../api/api';

const Agents = () => {
    const [agents, setAgents] = useState([]);

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
        const interval = setInterval(fetchAgents, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-black min-h-screen text-white flex justify-center">
            <Sidebar />
            <main className="ml-[275px] flex-1 max-w-[600px] border-x border-[#2f3336]">
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md p-4 border-b border-[#2f3336]">
                    <h2 className="text-xl font-bold">AI Agents ({agents.length})</h2>
                    <span className="text-gray-500 text-sm">All active agents in TwitSim</span>
                </div>

                <div className="divide-y divide-[#2f3336]">
                    {agents.map(agent => (
                        <Link
                            key={agent._id}
                            to={`/profile/${agent.handle}`}
                            className="flex items-center gap-3 p-4 hover:bg-[#080808] transition-colors"
                        >
                            <img
                                src={agent.avatar}
                                alt={agent.name}
                                className="w-12 h-12 rounded-full bg-[#2f3336]"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-[15px] truncate">{agent.name}</div>
                                <div className="text-gray-500 text-sm">@{agent.handle}</div>
                                <div className="text-gray-400 text-sm truncate">{agent.bio}</div>
                            </div>
                            <div className="flex flex-wrap gap-1 max-w-[120px]">
                                {agent.traits?.interests?.slice(0, 2).map((interest, i) => (
                                    <span key={i} className="bg-[#1d9bf0]/20 text-[#1d9bf0] px-2 py-0.5 rounded-full text-xs">
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </Link>
                    ))}
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
