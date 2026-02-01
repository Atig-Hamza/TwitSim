import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';
import { getPost, getPostComments, getPostInteractions } from '../api/api';
import { ArrowLeft, Heart, ThumbsDown, X } from 'lucide-react';

const PostPage = () => {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [interactions, setInteractions] = useState({ likes: [], dislikes: [] });
    const [showModal, setShowModal] = useState(null); // 'likes' | 'dislikes' | null

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [postData, commentData, interactionData] = await Promise.all([
                    getPost(id),
                    getPostComments(id),
                    getPostInteractions(id)
                ]);
                setPost(postData);
                setComments(commentData);
                setInteractions(interactionData);
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [id]);

    const InteractionModal = ({ type, data, onClose }) => (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-[#16181c] rounded-2xl w-full max-w-md max-h-[60vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-[#2f3336]">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        {type === 'likes' ? (
                            <><Heart size={20} className="text-[#f91880]" fill="#f91880" /> Liked by</>
                        ) : (
                            <><ThumbsDown size={20} className="text-[#f97316]" fill="#f97316" /> Disliked by</>
                        )}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-[#2f3336] rounded-full">
                        <X size={20} />
                    </button>
                </div>
                <div className="overflow-y-auto max-h-[50vh]">
                    {data.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No {type} yet</div>
                    ) : (
                        data.map((user, i) => (
                            <Link
                                key={user._id || i}
                                to={`/profile/${user.handle}`}
                                className="flex items-center gap-3 p-4 hover:bg-[#1d1d1d] border-b border-[#2f3336] last:border-0"
                                onClick={onClose}
                            >
                                <img
                                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.handle}`}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full"
                                />
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

                {/* Interactions Summary */}
                <div className="flex gap-4 px-4 py-3 border-b border-[#2f3336]">
                    <button
                        onClick={() => setShowModal('likes')}
                        className="flex items-center gap-2 hover:bg-[#1d1d1d] px-3 py-2 rounded-full transition-colors"
                    >
                        <Heart size={16} className="text-[#f91880]" fill={interactions.likes.length > 0 ? '#f91880' : 'none'} />
                        <span className="text-sm">
                            <span className="font-bold text-white">{interactions.likes.length}</span>
                            <span className="text-gray-500 ml-1">Likes</span>
                        </span>
                    </button>
                    <button
                        onClick={() => setShowModal('dislikes')}
                        className="flex items-center gap-2 hover:bg-[#1d1d1d] px-3 py-2 rounded-full transition-colors"
                    >
                        <ThumbsDown size={16} className="text-[#f97316]" fill={interactions.dislikes.length > 0 ? '#f97316' : 'none'} />
                        <span className="text-sm">
                            <span className="font-bold text-white">{interactions.dislikes.length}</span>
                            <span className="text-gray-500 ml-1">Dislikes</span>
                        </span>
                    </button>
                </div>

                {/* Show who liked/disliked preview */}
                {(interactions.likes.length > 0 || interactions.dislikes.length > 0) && (
                    <div className="px-4 py-3 border-b border-[#2f3336] text-sm">
                        {interactions.likes.length > 0 && (
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex -space-x-2">
                                    {interactions.likes.slice(0, 5).map((user, i) => (
                                        <img
                                            key={user._id || i}
                                            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.handle}`}
                                            alt={user.name}
                                            className="w-6 h-6 rounded-full border-2 border-black"
                                        />
                                    ))}
                                </div>
                                <span className="text-gray-500">
                                    Liked by <span className="text-white font-bold">{interactions.likes[0]?.name}</span>
                                    {interactions.likes.length > 1 && ` and ${interactions.likes.length - 1} others`}
                                </span>
                            </div>
                        )}
                        {interactions.dislikes.length > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {interactions.dislikes.slice(0, 3).map((user, i) => (
                                        <img
                                            key={user._id || i}
                                            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.handle}`}
                                            alt={user.name}
                                            className="w-6 h-6 rounded-full border-2 border-black"
                                        />
                                    ))}
                                </div>
                                <span className="text-gray-500">
                                    Disliked by <span className="text-orange-400 font-bold">{interactions.dislikes[0]?.name}</span>
                                    {interactions.dislikes.length > 1 && ` and ${interactions.dislikes.length - 1} others`}
                                </span>
                            </div>
                        )}
                    </div>
                )}

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

            {/* Modal */}
            {showModal && (
                <InteractionModal
                    type={showModal}
                    data={showModal === 'likes' ? interactions.likes : interactions.dislikes}
                    onClose={() => setShowModal(null)}
                />
            )}
        </div>
    );
};

export default PostPage;
