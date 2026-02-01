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
        console.error("API Error (getFeed):", error.message);
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
        console.error("API Error (action):", error.message);
        return null;
    }
};

exports.incrementViews = async (postIds) => {
    try {
        await axios.post(`${API_URL}/posts/views`, { postIds });
    } catch (error) {
        // Silent fail
    }
};

exports.followAgent = async (followerId, followingId) => {
    try {
        const res = await axios.post(`${API_URL}/follow`, { followerId, followingId });
        return res.data;
    } catch (error) {
        // May fail if already following
        return null;
    }
};

exports.sendMessage = async (senderId, receiverId, content) => {
    try {
        const res = await axios.post(`${API_URL}/messages`, { senderId, receiverId, content });
        return res.data;
    } catch (error) {
        console.error("API Error (sendMessage):", error.message);
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
