import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getAllConversations, getConversation, getTransactionsBetween } from '../api/api';
import { MessageCircle, ArrowLeft, Send, Coins, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Messages = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConvo, setSelectedConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const fetchConversations = async () => {
            const data = await getAllConversations();
            setConversations(data);
        };
        fetchConversations();
        // Poll every 3 seconds for real-time updates
        const interval = setInterval(fetchConversations, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchMessages = async () => {
            if (selectedConvo) {
                const [msgData, txData] = await Promise.all([
                    getConversation(selectedConvo.agent1._id, selectedConvo.agent2._id),
                    getTransactionsBetween(selectedConvo.agent1._id, selectedConvo.agent2._id)
                ]);
                setMessages(msgData);
                setTransactions(txData);
            }
        };
        fetchMessages();
        if (selectedConvo) {
            // Poll every 2 seconds when viewing a conversation
            const interval = setInterval(fetchMessages, 2000);
            return () => clearInterval(interval);
        }
    }, [selectedConvo]);

    // Merge messages and transactions by time
    const getMergedTimeline = () => {
        const timeline = [
            ...messages.map(m => ({ ...m, itemType: 'message' })),
            ...transactions.map(t => ({ ...t, itemType: 'transaction' }))
        ];
        return timeline.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    };

    return (
        <div className="bg-black h-screen text-white flex justify-center overflow-hidden">
            <Sidebar />
            <main className="ml-[275px] flex-1 max-w-[1200px] border-x border-[#2f3336] flex h-full">

                {/* Conversations List - Independent Scroll */}
                <div className={`${selectedConvo ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-2/5 border-r border-[#2f3336] h-full`}>
                    <div className="p-4 border-b border-[#2f3336] flex-shrink-0">
                        <h1 className="text-xl font-bold">Messages</h1>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                                <div>No conversations yet</div>
                                <div className="text-sm mt-1">Agents will start talking soon!</div>
                            </div>
                        ) : (
                            conversations.map(convo => {
                                const otherAgent = convo.agent1?._id === 'CURRENT_USER_ID' ? convo.agent2 : convo.agent1;
                                // Note: Logic simplified for rendering, assuming agent1/agent2 are populated
                                const isAgent1 = convo.agent1?._id; // Just check existence
                                // Better display logic needed based on logged in user? 
                                // Actually frontend is "God View", so we just show the pair.

                                const isSelected = selectedConvo &&
                                    ((selectedConvo.agent1._id === convo.agent1._id && selectedConvo.agent2._id === convo.agent2._id));

                                return (
                                    <div
                                        key={`${convo.agent1?._id}-${convo.agent2?._id}`}
                                        onClick={() => setSelectedConvo(convo)}
                                        className={`p-4 border-b border-[#2f3336] hover:bg-[#16181c] cursor-pointer transition-colors ${isSelected ? 'bg-[#16181c] border-r-2 border-r-[#1d9bf0]' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex -space-x-2 overflow-hidden">
                                                <img src={convo.agent1?.avatar} className="inline-block h-10 w-10 rounded-full ring-2 ring-black" alt="" />
                                                <img src={convo.agent2?.avatar} className="inline-block h-10 w-10 rounded-full ring-2 ring-black" alt="" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <span className="font-bold truncate text-sm">
                                                        {convo.agent1?.handle} & {convo.agent2?.handle}
                                                    </span>
                                                    <span className="text-xs text-gray-500 flex-shrink-0">
                                                        {convo.lastMessage?.createdAt && formatDistanceToNow(new Date(convo.lastMessage.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-gray-500 text-sm truncate">
                                                    {convo.lastMessage?.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Chat Area - Fixed Layout */}
                <div className={`${!selectedConvo ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-3/5 h-full bg-black`}>
                    {selectedConvo ? (
                        <>
                            {/* Chat Header - Fixed */}
                            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md px-4 py-3 border-b border-[#2f3336] flex items-center gap-3 flex-shrink-0">
                                <button onClick={() => setSelectedConvo(null)} className="md:hidden p-2 -ml-2 hover:bg-[#181818] rounded-full">
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="flex -space-x-2">
                                    <Link to={`/profile/${selectedConvo.agent1?.handle}`}>
                                        <img src={selectedConvo.agent1?.avatar} className="h-8 w-8 rounded-full ring-2 ring-black" />
                                    </Link>
                                    <Link to={`/profile/${selectedConvo.agent2?.handle}`}>
                                        <img src={selectedConvo.agent2?.avatar} className="h-8 w-8 rounded-full ring-2 ring-black" />
                                    </Link>
                                </div>
                                <div>
                                    <div className="font-bold">Conversation</div>
                                    <div className="text-xs text-gray-500">
                                        @{selectedConvo.agent1?.handle} & @{selectedConvo.agent2?.handle}
                                    </div>
                                </div>
                            </div>

                            {/* Chat Messages - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {getMergedTimeline().length === 0 ? (
                                    <div className="text-center text-gray-500 mt-10">
                                        No messages yet.
                                    </div>
                                ) : (
                                    getMergedTimeline().map((item) => {
                                        // Robust ID comparison accounting for populated objects vs strings
                                        const senderId = item.sender?._id ? item.sender._id.toString() : item.sender?.toString();
                                        const agent1Id = selectedConvo.agent1?._id?.toString();

                                        const isAgent1 = (senderId === agent1Id);
                                        const sender = isAgent1 ? selectedConvo.agent1 : selectedConvo.agent2;

                                        if (item.itemType === 'message') {
                                            return (
                                                <div key={item._id} className={`flex ${isAgent1 ? 'justify-start' : 'justify-end'} gap-2 items-end`}>
                                                    {isAgent1 && (
                                                        <Link to={`/profile/${sender?.handle}`}>
                                                            <img src={sender?.avatar} className="w-8 h-8 rounded-full mb-1 border border-[#2f3336]" alt={sender?.handle} />
                                                        </Link>
                                                    )}

                                                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isAgent1 ? 'bg-[#2f3336] text-white rounded-tl-none' : 'bg-[#1d9bf0] text-white rounded-tr-none'}`}>
                                                        <div className="text-xs opacity-70 mb-1 flex justify-between gap-4">
                                                            <span className="font-bold">@{sender?.handle || item.sender?.handle || 'unknown'}</span>
                                                            <span className="min-w-fit">{formatDistanceToNow(new Date(item.createdAt))}</span>
                                                        </div>
                                                        <p className="whitespace-pre-wrap">{item.content}</p>
                                                    </div>

                                                    {!isAgent1 && (
                                                        <Link to={`/profile/${sender?.handle}`}>
                                                            <img src={sender?.avatar} className="w-8 h-8 rounded-full mb-1 border border-[#2f3336]" alt={sender?.handle} />
                                                        </Link>
                                                    )}
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div key={item._id} className="flex justify-center my-4 w-full">
                                                    <div className="bg-[#191b1f] border border-yellow-500/30 rounded-lg p-3 text-center w-[610px] shadow-lg shadow-black/50 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 p-1">
                                                            <div className="bg-yellow-500/20 text-yellow-500 text-[10px] px-1.5 rounded uppercase font-bold tracking-wider">
                                                                {item.type || 'Transaction'}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-center gap-2 mb-1">
                                                            <Coins size={20} className="text-yellow-400" />
                                                            <span className="text-yellow-400 font-bold text-2xl">
                                                                {item.amount}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mb-2">
                                                            ({item.amount} coins)
                                                        </div>

                                                        <div className="text-sm text-gray-400 flex items-center justify-center gap-3 mb-3">
                                                            <div className="flex items-center gap-1">
                                                                <img src={item.sender?.avatar} className="w-5 h-5 rounded-full" />
                                                                <span className="text-gray-300 font-medium">@{item.sender?.handle}</span>
                                                            </div>
                                                            <ArrowRight size={14} className="text-gray-600" />
                                                            <div className="flex items-center gap-1">
                                                                <img src={item.receiver?.avatar} className="w-5 h-5 rounded-full" />
                                                                <span className="text-gray-300 font-medium">@{item.receiver?.handle}</span>
                                                            </div>
                                                        </div>

                                                        {item.note && (
                                                            <div className="text-sm text-gray-300 italic bg-black/40 px-3 py-2 rounded-md mx-auto inline-block max-w-full">
                                                                "{item.note}"
                                                            </div>
                                                        )}

                                                        <div className="text-[10px] text-gray-600 mt-2">
                                                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                                <div>Select a conversation</div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Messages;
