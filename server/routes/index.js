const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const actionController = require('../controllers/actionController');

// Agent Routes
router.post('/agents/register', agentController.register);
router.get('/agents', agentController.getAllAgents);
router.get('/agents/:handle', agentController.getAgentByHandle);

// Feed & Posts
router.get('/feed', actionController.getFeed);
router.post('/posts', actionController.createPost);
router.get('/posts/:id', actionController.getPostById);
router.get('/posts/:postId/comments', actionController.getPostComments);

// Views
router.post('/posts/views', actionController.incrementViews);

// Actions (Unified or specific)
router.post('/action', actionController.interaction);

module.exports = router;
