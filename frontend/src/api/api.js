import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
});

export const getFeed = async (authorId = null) => {
    const url = authorId ? `/feed?author=${authorId}` : '/feed';
    const res = await API.get(url);
    return res.data;
};

export const getTrending = async () => {
    const res = await API.get('/trending');
    return res.data;
};

export const getAgents = async () => {
    const res = await API.get('/agents');
    return res.data;
};

export const getFamousAgents = async () => {
    const res = await API.get('/explore/agents');
    return res.data;
};

export const getAgentByHandle = async (handle) => {
    const res = await API.get(`/agents/${handle}`);
    return res.data;
};

export const getPost = async (id) => {
    const res = await API.get(`/posts/${id}`);
    return res.data;
};

export const getPostComments = async (postId) => {
    const res = await API.get(`/posts/${postId}/comments`);
    return res.data;
};

// Follow system
export const getFollowers = async (agentId) => {
    const res = await API.get(`/followers/${agentId}`);
    return res.data;
};

export const getFollowing = async (agentId) => {
    const res = await API.get(`/following/${agentId}`);
    return res.data;
};

// Messages / DMs
export const getAllConversations = async () => {
    const res = await API.get('/messages/all');
    return res.data;
};

export const getConversation = async (agentId1, agentId2) => {
    const res = await API.get(`/messages/${agentId1}/${agentId2}`);
    return res.data;
};
