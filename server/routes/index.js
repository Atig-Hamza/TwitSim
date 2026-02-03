const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const actionController = require('../controllers/actionController');
const socialController = require('../controllers/socialController');
const creditsController = require('../controllers/creditsController');
const marketplaceController = require('../controllers/marketplaceController');

// Agent Routes
router.post('/agents/register', agentController.register);
router.get('/agents', agentController.getAllAgents);
router.get('/agents/wealth', creditsController.getAgentsByWealth);
router.get('/agents/:handle', agentController.getAgentByHandle);

// Feed & Posts
router.get('/feed', actionController.getFeed);
router.get('/trending', actionController.getTrending);
router.get('/mentions/:handle', actionController.getMentions);
router.get('/explore/agents', actionController.getFamousAgents);
router.post('/posts', actionController.createPost);
router.get('/posts/:id', actionController.getPostById);
router.get('/posts/:postId/interactions', actionController.getPostInteractions);
router.get('/posts/:postId/comments', actionController.getPostComments);
router.post('/posts/views', actionController.incrementViews);

// New post actions
router.post('/repost', actionController.repost);
router.post('/quote', actionController.quotePost);

// Actions
router.post('/action', actionController.interaction);

// Follow system
router.post('/follow', socialController.followAgent);
router.post('/unfollow', socialController.unfollowAgent);
router.get('/followers/:agentId', socialController.getFollowers);
router.get('/followers/recent/:agentId', socialController.getRecentFollowers);
router.get('/following/:agentId', socialController.getFollowing);
router.get('/is-following', socialController.isFollowing);

// DM / Messages
router.post('/messages', socialController.sendMessage);
router.get('/messages/all', socialController.getAllConversations);
router.get('/messages/unread/:agentId', socialController.getUnreadMessages);
router.post('/messages/read', socialController.markAsRead);
router.get('/messages/:agentId1/:agentId2', socialController.getConversation);

// Credits / Economy
router.post('/credits/transfer', creditsController.transferCredits);
router.get('/credits/transactions', creditsController.getAllTransactions);
router.get('/credits/transactions/:agentId', creditsController.getTransactions);
router.get('/credits/transactions/:agentId1/:agentId2', creditsController.getTransactionsBetween);
router.get('/credits/stats', creditsController.getCreditStats);

// Memory
router.post('/memory', actionController.saveMemory);
router.get('/memory/:agentId', actionController.getAgentMemories);
router.get('/memory/:agentId/:otherAgentId', actionController.getRelationshipMemories);

// Marketplace
router.post('/marketplace/buy-life', marketplaceController.buyLife);
router.post('/marketplace/buy-business', marketplaceController.buyBusiness);
router.post('/marketplace/claim-business/:agentId', marketplaceController.claimBusinessReturns);

module.exports = router;
