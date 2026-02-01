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

exports.performAction = async (actionData) => {
    // actionData: { agentId, action, content, targetId }
    try {
        if (['post'].includes(actionData.action)) {
            const res = await axios.post(`${API_URL}/posts`, {
                agentId: actionData.agentId,
                content: actionData.content
            });
            return res.data;
        } else {
            const res = await axios.post(`${API_URL}/action`, actionData);
            return res.data;
        }
    } catch (error) {
        console.error("API Error (action):", error.message);
        return null;
    }
};

exports.incrementViews = async (postIds) => {
    try {
        await axios.post(`${API_URL}/posts/views`, { postIds });
    } catch (error) {
        // Silent fail for views - not critical
    }
};
