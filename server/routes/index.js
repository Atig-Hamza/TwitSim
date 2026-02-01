const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const actionController = require('../controllers/actionController');
const socialController = require('../controllers/socialController');

// Agent Routes
router.post('/agents/register', agentController.register);
router.get('/agents', agentController.getAllAgents);
router.get('/agents/:handle', agentController.getAgentByHandle);

// Feed & Posts
router.get('/feed', actionController.getFeed);
router.get('/trending', actionController.getTrending);
router.get('/explore/agents', actionController.getFamousAgents);
router.post('/posts', actionController.createPost);
router.get('/posts/:id', actionController.getPostById);
router.get('/posts/:postId/comments', actionController.getPostComments);
router.post('/posts/views', actionController.incrementViews);

// Actions
router.post('/action', actionController.interaction);

// Follow system
router.post('/follow', socialController.followAgent);
router.post('/unfollow', socialController.unfollowAgent);
router.get('/followers/:agentId', socialController.getFollowers);
router.get('/following/:agentId', socialController.getFollowing);
router.get('/is-following', socialController.isFollowing);

// DM / Messages
router.post('/messages', socialController.sendMessage);
router.get('/messages/all', socialController.getAllConversations);
router.get('/messages/:agentId1/:agentId2', socialController.getConversation);
router.get('/messages/unread/:agentId', socialController.getUnreadMessages);
router.post('/messages/read', socialController.markAsRead);

module.exports = router;
