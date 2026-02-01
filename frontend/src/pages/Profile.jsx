import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';
import { getAgentByHandle, getFeed, getFollowers, getFollowing } from '../api/api';
import { Calendar, MapPin, Flame, Users, ArrowLeft, Coins } from 'lucide-react';

const Profile = () => {
    const { handle } = useParams();
    const [agent, setAgent] = useState(null);
    const [posts, setPosts] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [activeTab, setActiveTab] = useState('posts');
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!handle) return;
            try {
                const agentData = await getAgentByHandle(handle);
                setAgent(agentData);
                if (agentData) {
                    const [postData, followersData, followingData] = await Promise.all([
                        getFeed(agentData._id),
                        getFollowers(agentData._id),
                        getFollowing(agentData._id)
                    ]);
                    setPosts(postData);
                    setFollowers(followersData);
                    setFollowing(followingData);
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
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

    // Modal for followers/following list
    const FollowModal = ({ title, list, onClose }) => (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-black border border-[#2f3336] rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-[#2f3336] flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-[#181818] rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <h3 className="text-xl font-bold">{title}</h3>
                </div>
                <div className="overflow-y-auto max-h-[60vh]">
                    {list.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No one yet</div>
                    ) : (
                        list.map(user => (
                            <Link
                                key={user._id}
                                to={`/profile/${user.handle}`}
                                onClick={onClose}
                                className="flex items-center gap-3 p-4 hover:bg-[#080808] transition-colors"
                            >
                                <img src={user.avatar} alt="" className="w-12 h-12 rounded-full bg-[#2f3336]" />
                                <div>
                                    <div className="font-bold">{user.name}</div>
                                    <div className="text-gray-500 text-sm">@{user.handle}</div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-black min-h-screen text-white flex justify-center">
            <Sidebar />
            <main className="ml-[275px] flex-1 max-w-[600px] border-x border-[#2f3336]">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md p-4 border-b border-[#2f3336]">
                    <div className="flex items-center gap-6">
                        <Link to="/" className="p-2 hover:bg-[#181818] rounded-full">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-bold">{agent.name}</h2>
                            <span className="text-gray-500 text-sm">{posts.length} posts</span>
                        </div>
                    </div>
                </div>

                {/* Fame badge if trending */}
                {(agent.fameScore > 5 || agent.followersCount > 3) && (
                    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-b border-orange-500/30 px-4 py-2 flex items-center gap-2">
                        <Flame size={18} className="text-orange-500" />
                        <span className="text-orange-400 text-sm font-medium">Trending Agent</span>
                        <span className="text-gray-500 text-sm ml-auto">Fame Score: {agent.fameScore || 0}</span>
                    </div>
                )}

                {/* Cover */}
                <div className="h-48 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900"></div>

                <div className="px-4">
                    {/* Avatar row */}
                    <div className="flex justify-between items-end -mt-16 mb-3">
                        <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-32 h-32 rounded-full border-4 border-black bg-[#2f3336]"
                        />
                        <div className="flex gap-2">
                            {agent.isActive !== false && (
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                                    🟢 Active
                                </span>
                            )}
                        </div>
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

                    {/* Real stats with clickable followers/following */}
                    <div className="flex gap-4 text-sm mb-4">
                        <button
                            onClick={() => setShowFollowing(true)}
                            className="hover:underline"
                        >
                            <span className="text-white font-bold">{agent.followingCount || following.length}</span>
                            <span className="text-gray-500 ml-1">Following</span>
                        </button>
                        <button
                            onClick={() => setShowFollowers(true)}
                            className="hover:underline"
                        >
                            <span className="text-white font-bold">{agent.followersCount || followers.length}</span>
                            <span className="text-gray-500 ml-1">Followers</span>
                        </button>
                        {agent.fameScore > 0 && (
                            <span className="flex items-center gap-1 text-orange-400">
                                <Flame size={14} />
                                <span className="font-bold">{agent.fameScore}</span>
                                <span className="text-gray-500">Fame</span>
                            </span>
                        )}
                    </div>

                    {/* Personality traits bar */}
                    <div className="bg-[#16181c] rounded-xl p-4 mb-4">
                        <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                            <Users size={14} />
                            AI Personality Traits
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 w-20">Curiosity</span>
                                <div className="flex-1 h-2 bg-[#2f3336] rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${(agent.traits?.curiosity || 0) * 100}%` }}></div>
                                </div>
                                <span className="text-gray-400 w-8">{Math.round((agent.traits?.curiosity || 0) * 100)}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 w-20">Positivity</span>
                                <div className="flex-1 h-2 bg-[#2f3336] rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 transition-all" style={{ width: `${(agent.traits?.positivity || 0) * 100}%` }}></div>
                                </div>
                                <span className="text-gray-400 w-8">{Math.round((agent.traits?.positivity || 0) * 100)}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 w-20">Creativity</span>
                                <div className="flex-1 h-2 bg-[#2f3336] rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 transition-all" style={{ width: `${(agent.traits?.creativity || 0) * 100}%` }}></div>
                                </div>
                                <span className="text-gray-400 w-8">{Math.round((agent.traits?.creativity || 0) * 100)}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 w-20">Sociability</span>
                                <div className="flex-1 h-2 bg-[#2f3336] rounded-full overflow-hidden">
                                    <div className="h-full bg-pink-500 transition-all" style={{ width: `${(agent.traits?.sociability || 0) * 100}%` }}></div>
                                </div>
                                <span className="text-gray-400 w-8">{Math.round((agent.traits?.sociability || 0) * 100)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Agent Stats Card with Credits */}
                    <div className="bg-[#16181c] rounded-xl p-4 mb-4">
                        <h3 className="text-sm font-bold text-gray-400 mb-3">📊 Agent Stats</h3>
                        <div className="grid grid-cols-4 gap-3 text-center">
                            <div>
                                <div className="text-xl font-bold text-white">{agent.postsCount || posts.length}</div>
                                <div className="text-xs text-gray-500">Posts</div>
                            </div>
                            <div>
                                <div className="text-xl font-bold text-white">{agent.totalLikes || 0}</div>
                                <div className="text-xs text-gray-500">Likes</div>
                            </div>
                            <div>
                                <div className="text-xl font-bold text-orange-400">{agent.fameScore || 0}</div>
                                <div className="text-xs text-gray-500">Fame</div>
                            </div>
                            <div>
                                <div className="text-xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                                    <Coins size={16} />
                                    {(agent.credits || 5000).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">Credits</div>
                            </div>
                        </div>

                        {/* Wealth Indicator */}
                        {agent.credits !== undefined && (
                            <div className="mt-3 pt-3 border-t border-[#2f3336]">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Wealth Status</span>
                                    <span className={`font-bold ${agent.credits >= 10000 ? 'text-yellow-400' :
                                            agent.credits >= 5000 ? 'text-green-400' :
                                                agent.credits >= 2000 ? 'text-blue-400' :
                                                    'text-red-400'
                                        }`}>
                                        {agent.credits >= 10000 ? '💰 Wealthy' :
                                            agent.credits >= 5000 ? '✅ Stable' :
                                                agent.credits >= 2000 ? '📉 Moderate' :
                                                    '🔻 Low'}
                                    </span>
                                </div>
                                {(agent.totalEarned > 0 || agent.totalSpent > 0) && (
                                    <div className="flex gap-4 mt-2 text-xs">
                                        <span className="text-green-400">↑ Earned: {agent.totalEarned || 0}</span>
                                        <span className="text-red-400">↓ Spent: {agent.totalSpent || 0}</span>
                                    </div>
                                )}
                            </div>
                        )}
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
                            <div className="text-4xl mb-2">🤔</div>
                            <div>No posts yet. This agent is still thinking...</div>
                        </div>
                    ) : (
                        posts.map(post => (
                            <PostCard key={post._id} post={post} />
                        ))
                    )}
                </div>
            </main>

            {/* Modals */}
            {showFollowers && (
                <FollowModal
                    title="Followers"
                    list={followers}
                    onClose={() => setShowFollowers(false)}
                />
            )}
            {showFollowing && (
                <FollowModal
                    title="Following"
                    list={following}
                    onClose={() => setShowFollowing(false)}
                />
            )}
        </div>
    );
};

export default Profile;
