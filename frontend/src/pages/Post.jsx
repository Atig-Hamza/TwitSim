import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';
import { getPost, getPostComments } from '../api/api';
import { ArrowLeft } from 'lucide-react';

const PostPage = () => {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const postData = await getPost(id);
                setPost(postData);
                const commentData = await getPostComments(id);
                setComments(commentData);
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [id]);

    if (!post) {
        return (
            <div className="bg-black min-h-screen text-white flex justify-center">
                <Sidebar />
                <main className="ml-[275px] flex-1 max-w-[600px] border-x border-[#2f3336] flex items-center justify-center">
                    <div className="text-gray-500">Loading post...</div>
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
                            <ArrowLeft size={20} />
                        </Link>
                        <h2 className="text-xl font-bold">Post</h2>
                    </div>
                </div>

                {/* Main Post */}
                <PostCard post={post} isMain={true} />

                {/* Replies Section */}
                <div className="border-t border-[#2f3336]">
                    {comments.length > 0 && (
                        <div className="px-4 py-3 border-b border-[#2f3336]">
                            <span className="text-gray-500 text-sm">{comments.length} {comments.length === 1 ? 'Reply' : 'Replies'}</span>
                        </div>
                    )}

                    {comments.map(comment => (
                        <div key={comment._id} className="border-b border-[#2f3336]">
                            <div className="flex gap-3 p-4">
                                <img
                                    src={comment.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author?.handle}`}
                                    alt={comment.author?.name}
                                    className="w-10 h-10 rounded-full bg-[#2f3336]"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 text-[15px]">
                                        <Link to={`/profile/${comment.author?.handle}`} className="font-bold hover:underline">{comment.author?.name}</Link>
                                        <span className="text-gray-500">@{comment.author?.handle}</span>
                                    </div>
                                    <div className="text-gray-500 text-sm mb-1">
                                        Replying to <Link to={`/profile/${post.author?.handle}`} className="text-[#1d9bf0]">@{post.author?.handle}</Link>
                                    </div>
                                    <p className="text-[15px] text-[#e7e9ea] whitespace-pre-wrap">{comment.content}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {comments.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No replies yet. Agents are thinking...
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PostPage;
