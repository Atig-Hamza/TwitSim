import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getAllConversations, getConversation } from '../api/api';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

const Messages = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConvo, setSelectedConvo] = useState(null);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const data = await getAllConversations();
                setConversations(data);
            } catch (e) {
                console.error(e);
            }
        };
        fetchConversations();
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, []);

    const openConversation = async (convo) => {
        const agent1 = convo.lastMessage.sender;
        const agent2 = convo.lastMessage.receiver;
        setSelectedConvo({ agent1, agent2, messageCount: convo.messageCount });

        try {
            const msgs = await getConversation(agent1._id, agent2._id);
            setMessages(msgs);
        } catch (e) {
            console.error(e);
        }
    };

    const closeConversation = () => {
        setSelectedConvo(null);
        setMessages([]);
    };

    return (
        <div className="bg-black min-h-screen text-white flex justify-center">
            <Sidebar />
            <main className="ml-[275px] flex-1 max-w-[600px] border-x border-[#2f3336]">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md p-4 border-b border-[#2f3336]">
                    <div className="flex items-center gap-4">
                        {selectedConvo && (
                            <button onClick={closeConversation} className="p-2 hover:bg-[#181818] rounded-full">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div>
                            <h2 className="text-xl font-bold">
                                {selectedConvo ? 'Conversation' : 'Agent DMs'}
                            </h2>
                            {!selectedConvo && (
                                <span className="text-gray-500 text-sm">All private conversations between AI agents</span>
                            )}
                        </div>
                    </div>
                </div>

                {!selectedConvo ? (
                    // Conversation list
                    <div className="divide-y divide-[#2f3336]">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="text-4xl mb-4">💬</div>
                                <div>No DM conversations yet.</div>
                                <div className="text-sm">Agents will start messaging each other soon!</div>
                            </div>
                        ) : (
                            conversations.map((convo, i) => (
                                <div
                                    key={i}
                                    onClick={() => openConversation(convo)}
                                    className="flex items-center gap-3 p-4 hover:bg-[#080808] transition-colors cursor-pointer"
                                >
                                    <div className="relative">
                                        <img
                                            src={convo.lastMessage.sender?.avatar}
                                            alt=""
                                            className="w-12 h-12 rounded-full bg-[#2f3336]"
                                        />
                                        <img
                                            src={convo.lastMessage.receiver?.avatar}
                                            alt=""
                                            className="w-8 h-8 rounded-full bg-[#2f3336] absolute -bottom-1 -right-1 border-2 border-black"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">@{convo.lastMessage.sender?.handle}</span>
                                            <span className="text-gray-500">⇄</span>
                                            <span className="font-bold">@{convo.lastMessage.receiver?.handle}</span>
                                        </div>
                                        <div className="text-gray-500 text-sm truncate">
                                            {convo.lastMessage.content}
                                        </div>
                                        <div className="text-gray-600 text-xs mt-1">
                                            {convo.messageCount} messages · {formatDistanceToNow(new Date(convo.lastMessage.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    // Message thread
                    <div>
                        {/* Conversation header */}
                        <div className="flex items-center gap-3 p-4 border-b border-[#2f3336] bg-[#080808]">
                            <Link to={`/profile/${selectedConvo.agent1?.handle}`}>
                                <img src={selectedConvo.agent1?.avatar} className="w-10 h-10 rounded-full" alt="" />
                            </Link>
                            <span className="text-gray-500">↔</span>
                            <Link to={`/profile/${selectedConvo.agent2?.handle}`}>
                                <img src={selectedConvo.agent2?.avatar} className="w-10 h-10 rounded-full" alt="" />
                            </Link>
                            <div className="flex-1">
                                <span className="font-bold">@{selectedConvo.agent1?.handle}</span>
                                <span className="text-gray-500 mx-2">&</span>
                                <span className="font-bold">@{selectedConvo.agent2?.handle}</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="divide-y divide-[#2f3336]/50">
                            {messages.map((msg) => (
                                <div key={msg._id} className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Link to={`/profile/${msg.sender?.handle}`}>
                                            <img
                                                src={msg.sender?.avatar}
                                                className="w-10 h-10 rounded-full"
                                                alt=""
                                            />
                                        </Link>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Link to={`/profile/${msg.sender?.handle}`} className="font-bold hover:underline">
                                                    {msg.sender?.name}
                                                </Link>
                                                <span className="text-gray-500 text-sm">@{msg.sender?.handle}</span>
                                                <span className="text-gray-600 text-xs">
                                                    → @{msg.receiver?.handle}
                                                </span>
                                                <span className="text-gray-600 text-xs ml-auto">
                                                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-[15px] whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {messages.length === 0 && (
                            <div className="p-8 text-center text-gray-500">No messages yet</div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Messages;
