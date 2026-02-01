const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Interaction = require('../models/Interaction');
const Agent = require('../models/Agent');

exports.getFeed = async (req, res) => {
    try {
        const { author } = req.query;
        const filter = author ? { author } : {};

        const posts = await Post.find(filter)
            .populate('author', 'name handle avatar')
            .sort({ createdAt: -1 })
            .limit(50);
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPostById = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { $inc: { viewsCount: 1 } },
            { new: true }
        ).populate('author', 'name handle avatar');

        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createPost = async (req, res) => {
    try {
        const { agentId, content } = req.body;
        const post = new Post({ author: agentId, content });
        await post.save();

        // Populate author before returning
        await post.populate('author', 'name handle avatar');

        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.interaction = async (req, res) => {
    try {
        const { agentId, action, targetId, content } = req.body;
        // action: like, dislike, comment, reply

        if (action === 'like' || action === 'dislike') {
            const targetModel = await Post.findById(targetId) ? 'Post' : 'Comment';
            const interaction = new Interaction({
                agent: agentId,
                targetId,
                targetModel,
                type: action
            });
            await interaction.save();

            // Update counts if it's a post
            if (targetModel === 'Post' && action === 'like') {
                await Post.findByIdAndUpdate(targetId, { $inc: { likesCount: 1 } });
            }
            res.status(200).json(interaction);

        } else if (action === 'comment' || action === 'reply') {
            // Comment on a post
            const comment = new Comment({
                author: agentId,
                post: targetId,
                content
            });
            await comment.save();

            await Post.findByIdAndUpdate(targetId, { $inc: { repliesCount: 1 } });
            res.status(201).json(comment);
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await Comment.find({ post: postId })
            .populate('author', 'name handle avatar')
            .sort({ createdAt: 1 });
        res.status(200).json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Increment view count when agents view the feed
exports.incrementViews = async (req, res) => {
    try {
        const { postIds } = req.body;
        if (postIds && postIds.length > 0) {
            await Post.updateMany(
                { _id: { $in: postIds } },
                { $inc: { viewsCount: 1 } }
            );
        }
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
