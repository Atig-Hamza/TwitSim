import { Heart, MessageCircle, Repeat, Share, BarChart2, ThumbsDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

// Parse content and make @mentions clickable
const ParsedContent = ({ content }) => {
    const navigate = useNavigate();

    if (!content) return null;

    // Split by @mentions
    const parts = content.split(/(@[a-zA-Z0-9_]+)/g);

    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('@')) {
                    const handle = part.slice(1); // Remove @
                    return (
                        <span
                            key={i}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/profile/${handle}`);
                            }}
                            className="text-[#1d9bf0] hover:underline cursor-pointer"
                        >
                            {part}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
};

const PostCard = ({ post, isMain = false }) => {
    const {
        author, content, likesCount, dislikesCount, repliesCount,
        viewsCount, repostsCount, quotesCount, createdAt, _id
    } = post;

    if (isMain) {
        return (
            <div className="p-4 border-b border-[#2f3336]">
                <div className="flex gap-3 items-center mb-4">
                    <Link to={`/profile/${author?.handle}`}>
                        <img
                            src={author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author?.handle}`}
                            alt={author?.name}
                            className="w-10 h-10 rounded-full bg-[#2f3336] hover:opacity-80 transition-opacity"
                        />
                    </Link>
                    <div className="flex flex-col">
                        <Link to={`/profile/${author?.handle}`} className="font-bold text-white text-[15px] hover:underline">
                            {author?.name}
                        </Link>
                        <Link to={`/profile/${author?.handle}`} className="text-gray-500 text-[15px] hover:underline">
                            @{author?.handle}
                        </Link>
                    </div>
                </div>

                <p className="text-white text-[17px] leading-normal whitespace-pre-wrap mb-4">
                    <ParsedContent content={content} />
                </p>

                <div className="text-gray-500 text-[15px] border-b border-[#2f3336] py-3 mb-3">
                    {createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : 'just now'}
                </div>

                <div className="flex gap-6 border-b border-[#2f3336] py-2 mb-3 text-sm flex-wrap">
                    <div><span className="font-bold text-white">{viewsCount || 0}</span> <span className="text-gray-500">Views</span></div>
                    <div className="flex items-center gap-1">
                        <Heart size={14} className="text-[#f91880]" fill={(likesCount || 0) > 0 ? '#f91880' : 'none'} />
                        <span className="font-bold text-white">{likesCount || 0}</span>
                        <span className="text-gray-500">Likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <ThumbsDown size={14} className="text-[#f97316]" fill={(dislikesCount || 0) > 0 ? '#f97316' : 'none'} />
                        <span className="font-bold text-white">{dislikesCount || 0}</span>
                        <span className="text-gray-500">Dislikes</span>
                    </div>
                    <div><span className="font-bold text-white">{repostsCount || 0}</span> <span className="text-gray-500">Reposts</span></div>
                    <div><span className="font-bold text-white">{quotesCount || 0}</span> <span className="text-gray-500">Quotes</span></div>
                    <div><span className="font-bold text-white">{repliesCount || 0}</span> <span className="text-gray-500">Replies</span></div>
                </div>

                <div className="flex justify-around text-gray-500 py-1">
                    <div className="p-2 rounded-full hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] cursor-not-allowed transition-colors">
                        <MessageCircle size={22} />
                    </div>
                    <div className="p-2 rounded-full hover:bg-[#00ba7c]/10 hover:text-[#00ba7c] cursor-not-allowed transition-colors">
                        <Repeat size={22} />
                    </div>
                    <div className="p-2 rounded-full hover:bg-[#f91880]/10 hover:text-[#f91880] cursor-not-allowed transition-colors">
                        <Heart size={22} />
                    </div>
                    <div className="p-2 rounded-full hover:bg-[#f97316]/10 hover:text-[#f97316] cursor-not-allowed transition-colors">
                        <ThumbsDown size={22} />
                    </div>
                    <div className="p-2 rounded-full hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] cursor-not-allowed transition-colors">
                        <BarChart2 size={22} />
                    </div>
                    <div className="p-2 rounded-full hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] cursor-not-allowed transition-colors">
                        <Share size={22} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Link to={`/post/${_id}`} className="block">
            <div className="p-4 border-b border-[#2f3336] hover:bg-[#080808] transition-colors">
                <div className="flex gap-3">
                    <Link to={`/profile/${author?.handle}`} onClick={e => e.stopPropagation()}>
                        <img
                            src={author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author?.handle}`}
                            alt={author?.name}
                            className="w-10 h-10 rounded-full bg-[#2f3336] hover:opacity-80 transition-opacity"
                        />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-[15px]">
                            <Link
                                to={`/profile/${author?.handle}`}
                                onClick={e => e.stopPropagation()}
                                className="font-bold text-white truncate hover:underline"
                            >
                                {author?.name}
                            </Link>
                            <Link
                                to={`/profile/${author?.handle}`}
                                onClick={e => e.stopPropagation()}
                                className="text-gray-500 truncate hover:underline"
                            >
                                @{author?.handle}
                            </Link>
                            <span className="text-gray-500 flex-shrink-0">·</span>
                            <span className="text-gray-500 text-sm hover:underline flex-shrink-0">
                                {createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: false }).replace('about ', '').replace(' minutes', 'm').replace(' hours', 'h').replace(' days', 'd') : 'now'}
                            </span>
                        </div>

                        <p className="text-[#e7e9ea] whitespace-pre-wrap text-[15px] leading-5 mt-0.5 mb-3">
                            <ParsedContent content={content} />
                        </p>

                        <div className="flex justify-between text-gray-500 max-w-[425px] -ml-2">
                            {/* Comments */}
                            <div className="group flex items-center gap-1 hover:text-[#1d9bf0] transition-colors">
                                <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                                    <MessageCircle size={18} />
                                </div>
                                {(repliesCount || 0) > 0 && <span className="text-[13px]">{repliesCount}</span>}
                            </div>
                            {/* Reposts */}
                            <div className="group flex items-center gap-1 hover:text-[#00ba7c] transition-colors">
                                <div className="p-2 rounded-full group-hover:bg-[#00ba7c]/10 transition-colors">
                                    <Repeat size={18} />
                                </div>
                                {(repostsCount || 0) > 0 && <span className="text-[13px]">{repostsCount}</span>}
                            </div>
                            {/* Likes */}
                            <div className="group flex items-center gap-1 hover:text-[#f91880] transition-colors">
                                <div className="p-2 rounded-full group-hover:bg-[#f91880]/10 transition-colors">
                                    <Heart size={18} fill={(likesCount || 0) > 0 ? '#f91880' : 'none'} />
                                </div>
                                <span className="text-[13px]">{likesCount || 0}</span>
                            </div>
                            {/* Dislikes */}
                            <div className="group flex items-center gap-1 hover:text-[#f97316] transition-colors">
                                <div className="p-2 rounded-full group-hover:bg-[#f97316]/10 transition-colors">
                                    <ThumbsDown size={18} fill={(dislikesCount || 0) > 0 ? '#f97316' : 'none'} />
                                </div>
                                <span className="text-[13px]">{dislikesCount || 0}</span>
                            </div>
                            {/* Views */}
                            <div className="group flex items-center gap-1 hover:text-[#1d9bf0] transition-colors">
                                <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                                    <BarChart2 size={18} />
                                </div>
                                {(viewsCount || 0) > 0 && <span className="text-[13px]">{viewsCount}</span>}
                            </div>
                            {/* Share */}
                            <div className="group flex items-center gap-1 hover:text-[#1d9bf0] transition-colors">
                                <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                                    <Share size={18} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default PostCard;
