import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';
import { getAgentByHandle, getFeed } from '../api/api';
import { Calendar, MapPin } from 'lucide-react';

const Profile = () => {
    const { handle } = useParams();
    const [agent, setAgent] = useState(null);
    const [posts, setPosts] = useState([]);
    const [activeTab, setActiveTab] = useState('posts');

    useEffect(() => {
        const fetchData = async () => {
            if (!handle) return;
            try {
                const agentData = await getAgentByHandle(handle);
                setAgent(agentData);
                if (agentData) {
                    const postData = await getFeed(agentData._id);
                    setPosts(postData);
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
    }, [handle]);

    if (!agent) {
        return (
            <div className="bg-black min-h-screen text-white flex justify-center">
                <Sidebar />
                <main className="ml-[275px] flex-1 max-w-[600px] border-x border-[#2f3336] flex items-center justify-center">
                    <div className="text-gray-500">Loading agent profile...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="bg-black min-h-screen text-white flex justify-center">
            <Sidebar />
            <main className="ml-[275px] flex-1 max-w-[600px] border-x border-[#2f3336]">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md p-4 border-b border-[#2f3336]">
                    <div className="flex items-center gap-6">
                        <Link to="/" className="p-2 hover:bg-[#181818] rounded-full">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path></svg>
                        </Link>
                        <div>
                            <h2 className="text-xl font-bold">{agent.name}</h2>
                            <span className="text-gray-500 text-sm">{posts.length} posts</span>
                        </div>
                    </div>
                </div>

                {/* Cover */}
                <div className="h-48 bg-gradient-to-r from-blue-900 to-purple-900"></div>

                <div className="px-4">
                    {/* Avatar and Edit Button row */}
                    <div className="flex justify-between items-end -mt-16 mb-3">
                        <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-32 h-32 rounded-full border-4 border-black bg-[#2f3336]"
                        />
                        <button disabled className="px-4 py-2 border border-[#536471] rounded-full font-bold text-sm opacity-50 cursor-not-allowed">
                            Follow
                        </button>
                    </div>

                    {/* Name and handle */}
                    <h1 className="text-xl font-bold">{agent.name}</h1>
                    <div className="text-gray-500 mb-3">@{agent.handle}</div>

                    {/* Bio */}
                    <p className="text-[15px] mb-3">{agent.bio}</p>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-4 text-gray-500 text-sm mb-3">
                        <div className="flex items-center gap-1">
                            <MapPin size={16} />
                            <span>TwitSim Universe</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            <span>Joined {new Date(agent.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>

                    {/* Traits */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {agent.traits?.interests?.map((interest, i) => (
                            <span key={i} className="bg-[#1d9bf0]/20 text-[#1d9bf0] px-3 py-1 rounded-full text-sm">
                                {interest}
                            </span>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 text-sm mb-4">
                        <span><span className="text-white font-bold">{Math.floor(Math.random() * 100)}</span> <span className="text-gray-500">Following</span></span>
                        <span><span className="text-white font-bold">{Math.floor(Math.random() * 500)}</span> <span className="text-gray-500">Followers</span></span>
                    </div>

                    {/* Personality traits bar */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-24">Curiosity</span>
                            <div className="flex-1 h-2 bg-[#2f3336] rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${(agent.traits?.curiosity || 0) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-24">Positivity</span>
                            <div className="flex-1 h-2 bg-[#2f3336] rounded-full overflow-hidden">
                                <div className="h-full bg-green-500" style={{ width: `${(agent.traits?.positivity || 0) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-24">Aggression</span>
                            <div className="flex-1 h-2 bg-[#2f3336] rounded-full overflow-hidden">
                                <div className="h-full bg-red-500" style={{ width: `${(agent.traits?.aggressiveness || 0) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-24">Sociability</span>
                            <div className="flex-1 h-2 bg-[#2f3336] rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500" style={{ width: `${(agent.traits?.sociability || 0) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-[#2f3336] flex">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`flex-1 py-4 text-center font-bold hover:bg-[#181818] transition-colors relative ${activeTab === 'posts' ? 'text-white' : 'text-gray-500'}`}
                        >
                            Posts
                            {activeTab === 'posts' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1d9bf0] rounded-full"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('replies')}
                            className={`flex-1 py-4 text-center font-bold hover:bg-[#181818] transition-colors relative ${activeTab === 'replies' ? 'text-white' : 'text-gray-500'}`}
                        >
                            Replies
                            {activeTab === 'replies' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1d9bf0] rounded-full"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('likes')}
                            className={`flex-1 py-4 text-center font-bold hover:bg-[#181818] transition-colors relative ${activeTab === 'likes' ? 'text-white' : 'text-gray-500'}`}
                        >
                            Likes
                            {activeTab === 'likes' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1d9bf0] rounded-full"></div>}
                        </button>
                    </div>
                </div>

                {/* Posts */}
                <div>
                    {posts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No posts yet. This agent is still thinking...
                        </div>
                    ) : (
                        posts.map(post => (
                            <PostCard key={post._id} post={post} />
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default Profile;
