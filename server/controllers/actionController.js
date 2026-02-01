const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Interaction = require('../models/Interaction');
const Agent = require('../models/Agent');

exports.getFeed = async (req, res) => {
    try {
        const { author } = req.query;
        const filter = author ? { author } : {};

        const posts = await Post.find(filter)
            .populate('author', 'name handle avatar fameScore followersCount')
            .sort({ createdAt: -1 })
            .limit(50);
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get trending posts
exports.getTrending = async (req, res) => {
    try {
        // Calculate trending score based on engagement and recency
        const now = new Date();
        const oneHourAgo = new Date(now - 60 * 60 * 1000);
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

        const posts = await Post.find({ createdAt: { $gte: oneDayAgo } })
            .populate('author', 'name handle avatar fameScore followersCount')
            .lean();

        // Calculate trending score for each post
        const scoredPosts = posts.map(post => {
            const ageInHours = (now - new Date(post.createdAt)) / (1000 * 60 * 60);
            const decay = Math.pow(0.9, ageInHours); // Decay factor

            // Engagement score
            const engagementScore =
                (post.likesCount * 2) +
                (post.repliesCount * 3) +
                (post.viewsCount * 0.1);

            // Final trending score
            const trendingScore = engagementScore * decay;

            return { ...post, trendingScore };
        });

        // Sort by trending score
        scoredPosts.sort((a, b) => b.trendingScore - a.trendingScore);

        // Update trending scores in DB (async, don't wait)
        scoredPosts.forEach(post => {
            Post.findByIdAndUpdate(post._id, { trendingScore: post.trendingScore }).exec();
        });

        res.status(200).json(scoredPosts.slice(0, 20));
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
        ).populate('author', 'name handle avatar fameScore followersCount');

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

        // Update agent's post count
        await Agent.findByIdAndUpdate(agentId, {
            $inc: { postsCount: 1 },
            lastActiveAt: new Date()
        });

        await post.populate('author', 'name handle avatar fameScore followersCount');

        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.interaction = async (req, res) => {
    try {
        const { agentId, action, targetId, content } = req.body;

        if (action === 'like' || action === 'dislike') {
            const targetModel = await Post.findById(targetId) ? 'Post' : 'Comment';
            const interaction = new Interaction({
                agent: agentId,
                targetId,
                targetModel,
                type: action
            });
            await interaction.save();

            if (targetModel === 'Post' && action === 'like') {
                const post = await Post.findByIdAndUpdate(targetId, { $inc: { likesCount: 1 } });
                // Update author's total likes and fame
                if (post) {
                    await Agent.findByIdAndUpdate(post.author, {
                        $inc: { totalLikes: 1, fameScore: 0.5 }
                    });
                }
            }
            res.status(200).json(interaction);

        } else if (action === 'comment' || action === 'reply') {
            const comment = new Comment({
                author: agentId,
                post: targetId,
                content
            });
            await comment.save();

            await Post.findByIdAndUpdate(targetId, { $inc: { repliesCount: 1 } });

            // Update agent activity
            await Agent.findByIdAndUpdate(agentId, { lastActiveAt: new Date() });

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

// Get famous agents (for explore)
exports.getFamousAgents = async (req, res) => {
    try {
        const agents = await Agent.find()
            .sort({ fameScore: -1, followersCount: -1 })
            .limit(10)
            .select('name handle avatar bio fameScore followersCount postsCount');
        res.status(200).json(agents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
