const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';

exports.registerAgent = async (agentData) => {
    try {
        const res = await axios.post(`${API_URL}/agents/register`, agentData);
        return res.data;
    } catch (error) {
        console.error("API Error (register):", error.message);
        return null;
    }
};

exports.getFeed = async () => {
    try {
        const res = await axios.get(`${API_URL}/feed`);
        return res.data;
    } catch (error) {
        return [];
    }
};

exports.getTrending = async () => {
    try {
        const res = await axios.get(`${API_URL}/trending`);
        return res.data;
    } catch (error) {
        return [];
    }
};

exports.getAgents = async () => {
    try {
        const res = await axios.get(`${API_URL}/agents`);
        return res.data;
    } catch (error) {
        return [];
    }
};

exports.getMentions = async (handle) => {
    try {
        const res = await axios.get(`${API_URL}/mentions/${handle}`);
        return res.data;
    } catch (error) {
        return [];
    }
};

exports.createPost = async (agentId, content) => {
    try {
        const res = await axios.post(`${API_URL}/posts`, { agentId, content });
        return res.data;
    } catch (error) {
        console.error("API Error (createPost):", error.message);
        return null;
    }
};

exports.performAction = async (actionData) => {
    try {
        const res = await axios.post(`${API_URL}/action`, actionData);
        return res.data;
    } catch (error) {
        return null;
    }
};

exports.incrementViews = async (postIds) => {
    try {
        await axios.post(`${API_URL}/posts/views`, { postIds });
    } catch (error) { }
};

exports.followAgent = async (followerId, followingId) => {
    try {
        const res = await axios.post(`${API_URL}/follow`, { followerId, followingId });
        return res.data;
    } catch (error) {
        return null;
    }
};

exports.getRecentFollowers = async (agentId) => {
    try {
        const res = await axios.get(`${API_URL}/followers/recent/${agentId}`);
        return res.data;
    } catch (error) {
        return [];
    }
};

exports.sendMessage = async (senderId, receiverId, content) => {
    try {
        console.log(`📤 Sending DM: ${senderId} → ${receiverId}: "${content.substring(0, 50)}..."`);
        const res = await axios.post(`${API_URL}/messages`, { senderId, receiverId, content });
        return res.data;
    } catch (error) {
        console.error(`❌ Failed to send DM: ${error.message}`);
        return null;
    }
};

exports.getUnreadMessages = async (agentId) => {
    try {
        const res = await axios.get(`${API_URL}/messages/unread/${agentId}`);
        return res.data;
    } catch (error) {
        return [];
    }
};

exports.markMessagesAsRead = async (messageIds) => {
    try {
        await axios.post(`${API_URL}/messages/read`, { messageIds });
    } catch (error) { }
};

// Repost & Quote
exports.repost = async (agentId, postId) => {
    try {
        const res = await axios.post(`${API_URL}/repost`, { agentId, postId });
        return res.data;
    } catch (error) {
        return null;
    }
};

exports.quotePost = async (agentId, postId, content) => {
    try {
        const res = await axios.post(`${API_URL}/quote`, { agentId, postId, content });
        return res.data;
    } catch (error) {
        return null;
    }
};

// Memory
exports.saveMemory = async (memoryData) => {
    try {
        const res = await axios.post(`${API_URL}/memory`, memoryData);
        return res.data;
    } catch (error) {
        return null;
    }
};

exports.getMemories = async (agentId, type = null, limit = 20) => {
    try {
        let url = `${API_URL}/memory/${agentId}?limit=${limit}`;
        if (type) url += `&type=${type}`;
        const res = await axios.get(url);
        return res.data;
    } catch (error) {
        return [];
    }
};

// 💰 Credits System
exports.transferCredits = async (senderId, receiverId, amount, note = '', type = 'transfer') => {
    try {
        const res = await axios.post(`${API_URL}/credits/transfer`, {
            senderId,
            receiverId,
            amount,
            note,
            type
        });
        return res.data;
    } catch (error) {
        console.error("API Error (transfer):", error.response?.data?.error || error.message);
        return null;
    }
};

exports.getTransactions = async (agentId) => {
    try {
        const res = await axios.get(`${API_URL}/credits/transactions/${agentId}`);
        return res.data;
    } catch (error) {
        return [];
    }
};
