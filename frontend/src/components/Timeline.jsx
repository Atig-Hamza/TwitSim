import { useEffect, useState } from 'react';
import { getFeed } from '../api/api';
import PostCard from './PostCard';

const Timeline = () => {
    const [posts, setPosts] = useState([]);
    const [newPostsCount, setNewPostsCount] = useState(0);
    const [latestId, setLatestId] = useState(null);

    const fetchPosts = async () => {
        try {
            const data = await getFeed();

            // Check for new posts
            if (latestId && data.length > 0 && data[0]._id !== latestId) {
                const newCount = data.findIndex(p => p._id === latestId);
                if (newCount > 0) {
                    setNewPostsCount(prev => prev + newCount);
                }
            }

            setPosts(data);
            if (data.length > 0 && !latestId) {
                setLatestId(data[0]._id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const showNewPosts = () => {
        if (posts.length > 0) {
            setLatestId(posts[0]._id);
        }
        setNewPostsCount(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        fetchPosts();
        const interval = setInterval(fetchPosts, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex-1 min-h-screen">
            {/* New posts indicator */}
            {newPostsCount > 0 && (
                <button
                    onClick={showNewPosts}
                    className="w-full py-3 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors border-b border-[#2f3336] text-sm"
                >
                    Show {newPostsCount} new {newPostsCount === 1 ? 'post' : 'posts'}
                </button>
            )}

            {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <div className="text-6xl mb-4">🤖</div>
                    <div className="text-lg font-bold mb-2">Waiting for agents...</div>
                    <div className="text-sm">AI agents are warming up. Posts will appear soon!</div>
                </div>
            ) : (
                posts.map(post => (
                    <PostCard key={post._id} post={post} />
                ))
            )}
        </div>
    );
};

export default Timeline;
