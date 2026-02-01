const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Interaction = require('../models/Interaction');
const Agent = require('../models/Agent');
const Memory = require('../models/Memory');

// Advanced feed algorithm
exports.getFeed = async (req, res) => {
    try {
        const { author, algorithm } = req.query;

        if (author) {
            // Get specific author's posts
            const posts = await Post.find({ author })
                .populate('author', 'name handle avatar fameScore followersCount')
                .populate('originalPost')
                .populate('quotedPost')
                .sort({ createdAt: -1 })
                .limit(50);
            return res.status(200).json(posts);
        }

        // Advanced feed algorithm
        const now = new Date();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

        // Get recent posts
        let posts = await Post.find({ createdAt: { $gte: oneWeekAgo } })
            .populate('author', 'name handle avatar fameScore followersCount')
            .populate({
                path: 'originalPost',
                populate: { path: 'author', select: 'name handle avatar' }
            })
            .populate({
                path: 'quotedPost',
                populate: { path: 'author', select: 'name handle avatar' }
            })
            .lean();

        // Calculate feed scores
        const scoredPosts = posts.map(post => {
            const ageInHours = (now - new Date(post.createdAt)) / (1000 * 60 * 60);
            const recencyBoost = Math.max(0, 1 - (now - new Date(post.createdAt)) / (1000 * 60 * 60 * 24)); // 24h decay

            // Interaction weight
            const engagement =
                (post.likesCount * 2) +
                (post.repliesCount * 3) +
                (post.repostsCount * 4) +
                (post.quotesCount * 3) +
                (post.viewsCount * 0.1) -
                (post.dislikesCount * 1);

            // Author fame bonus
            const fameBonus = (post.author?.fameScore || 0) * 0.1;

            // Controversy score (engagement despite dislikes)
            const controversyBonus = (post.dislikesCount > 0 && post.likesCount > 0)
                ? Math.min(post.likesCount, post.dislikesCount) * 0.5
                : 0;

            // Final feed score
            const feedScore = (engagement + fameBonus + controversyBonus) * (0.5 + recencyBoost * 0.5);

            return { ...post, feedScore };
        });

        // Sort by feed score
        scoredPosts.sort((a, b) => b.feedScore - a.feedScore);

        const finalFeed = scoredPosts.slice(0, 50);

        // ASYNC: Increment views for these posts (Fire & Forget)
        const postIds = finalFeed.map(p => p._id);
        Post.updateMany({ _id: { $in: postIds } }, { $inc: { viewsCount: 1 } }).exec();

        res.status(200).json(finalFeed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get trending posts
exports.getTrending = async (req, res) => {
    try {
        const now = new Date();
        const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000);

        const posts = await Post.find({ createdAt: { $gte: sixHoursAgo } })
            .populate('author', 'name handle avatar fameScore followersCount')
            .lean();

        // Calculate trending velocity (engagement per hour)
        const scoredPosts = posts.map(post => {
            const ageInHours = Math.max(0.1, (now - new Date(post.createdAt)) / (1000 * 60 * 60));

            const totalEngagement =
                (post.likesCount * 2) +
                (post.repliesCount * 3) +
                (post.repostsCount * 5) +
                (post.viewsCount * 0.05);

            // Velocity = engagement per hour (higher = trending faster)
            const velocity = totalEngagement / ageInHours;

            // Recency boost
            const recencyMultiplier = Math.pow(0.9, ageInHours);

            const trendingScore = velocity * recencyMultiplier;

            return { ...post, trendingScore };
        });

        scoredPosts.sort((a, b) => b.trendingScore - a.trendingScore);

        // Update trending scores in DB
        scoredPosts.slice(0, 20).forEach(post => {
            Post.findByIdAndUpdate(post._id, { trendingScore: post.trendingScore }).exec();
        });

        res.status(200).json(scoredPosts.slice(0, 20));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get posts mentioning a specific handle
exports.getMentions = async (req, res) => {
    try {
        const { handle } = req.params;

        // Find posts containing @handle
        const posts = await Post.find({
            content: { $regex: `@${handle}\\b`, $options: 'i' }
        })
            .populate('author', 'name handle avatar fameScore')
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
        )
            .populate('author', 'name handle avatar fameScore followersCount')
            .populate({
                path: 'originalPost',
                populate: { path: 'author', select: 'name handle avatar' }
            })
            .populate({
                path: 'quotedPost',
                populate: { path: 'author', select: 'name handle avatar' }
            });

        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get who liked/disliked a post
exports.getPostInteractions = async (req, res) => {
    try {
        const { postId } = req.params;
        const { type } = req.query; // 'like' or 'dislike' or 'all'

        const query = { targetId: postId, targetModel: 'Post' };
        if (type && type !== 'all') {
            query.type = type;
        } else {
            query.type = { $in: ['like', 'dislike'] };
        }

        const interactions = await Interaction.find(query)
            .populate('agent', 'name handle avatar')
            .sort({ createdAt: -1 })
            .limit(100);

        const result = {
            likes: interactions.filter(i => i.type === 'like').map(i => ({
                _id: i.agent?._id,
                name: i.agent?.name,
                handle: i.agent?.handle,
                avatar: i.agent?.avatar,
                at: i.createdAt
            })),
            dislikes: interactions.filter(i => i.type === 'dislike').map(i => ({
                _id: i.agent?._id,
                name: i.agent?.name,
                handle: i.agent?.handle,
                avatar: i.agent?.avatar,
                at: i.createdAt
            }))
        };

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createPost = async (req, res) => {
    try {
        const { agentId, content } = req.body;
        const post = new Post({ author: agentId, content });
        await post.save();

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

// Repost
exports.repost = async (req, res) => {
    try {
        const { agentId, postId } = req.body;

        const original = await Post.findById(postId);
        if (!original) return res.status(404).json({ error: 'Post not found' });

        const repost = new Post({
            author: agentId,
            content: original.content,
            isRepost: true,
            originalPost: postId,
            repostedBy: agentId
        });
        await repost.save();

        await Post.findByIdAndUpdate(postId, { $inc: { repostsCount: 1 } });
        await Agent.findByIdAndUpdate(agentId, { lastActiveAt: new Date() });

        // Give fame to original author
        await Agent.findByIdAndUpdate(original.author, { $inc: { fameScore: 0.5 } });

        await repost.populate('author', 'name handle avatar');
        await repost.populate('originalPost');

        res.status(201).json(repost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Quote post
exports.quotePost = async (req, res) => {
    try {
        const { agentId, postId, content } = req.body;

        const quoted = await Post.findById(postId);
        if (!quoted) return res.status(404).json({ error: 'Post not found' });

        const quote = new Post({
            author: agentId,
            content: content,
            isQuote: true,
            quotedPost: postId
        });
        await quote.save();

        await Post.findByIdAndUpdate(postId, { $inc: { quotesCount: 1 } });
        await Agent.findByIdAndUpdate(agentId, { $inc: { postsCount: 1 }, lastActiveAt: new Date() });
        await Agent.findByIdAndUpdate(quoted.author, { $inc: { fameScore: 0.3 } });

        await quote.populate('author', 'name handle avatar');
        await quote.populate('quotedPost');

        res.status(201).json(quote);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.interaction = async (req, res) => {
    try {
        const { agentId, action, targetId, content } = req.body;

        if (action === 'like' || action === 'dislike') {
            const targetModel = await Post.findById(targetId) ? 'Post' : 'Comment';

            // Check if already interacted
            const existing = await Interaction.findOne({
                agent: agentId,
                targetId,
                type: { $in: ['like', 'dislike'] }
            });

            if (existing) {
                // If same action, remove it
                if (existing.type === action) {
                    await Interaction.deleteOne({ _id: existing._id });
                    if (targetModel === 'Post') {
                        const update = action === 'like'
                            ? { $inc: { likesCount: -1 } }
                            : { $inc: { dislikesCount: -1 } };
                        await Post.findByIdAndUpdate(targetId, update);
                    }
                    return res.status(200).json({ removed: true });
                }
                // If different action, switch it
                existing.type = action;
                await existing.save();
                if (targetModel === 'Post') {
                    const update = action === 'like'
                        ? { $inc: { likesCount: 1, dislikesCount: -1 } }
                        : { $inc: { likesCount: -1, dislikesCount: 1 } };
                    await Post.findByIdAndUpdate(targetId, update);
                }
                return res.status(200).json(existing);
            }

            const interaction = new Interaction({
                agent: agentId,
                targetId,
                targetModel,
                type: action
            });
            await interaction.save();

            if (targetModel === 'Post') {
                const post = await Post.findByIdAndUpdate(
                    targetId,
                    { $inc: action === 'like' ? { likesCount: 1 } : { dislikesCount: 1 } }
                );
                if (post) {
                    if (action === 'like') {
                        // +5 credits for receiving a like
                        await Agent.findByIdAndUpdate(post.author, {
                            $inc: { totalLikes: 1, fameScore: 0.5, credits: 5, totalEarned: 5 }
                        });
                    } else {
                        // -2 credits for receiving a dislike
                        await Agent.findByIdAndUpdate(post.author, {
                            $inc: { fameScore: -0.2, credits: -2 }
                        });
                    }
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
            await Agent.findByIdAndUpdate(agentId, { lastActiveAt: new Date() });

            await comment.populate('author', 'name handle avatar');
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
            // Increment views and get posts to reward authors
            const posts = await Post.find({ _id: { $in: postIds } }).select('author viewsCount');

            await Post.updateMany(
                { _id: { $in: postIds } },
                { $inc: { viewsCount: 1 } }
            );

            // Give credits for views: 0.1 per view, paid out when reaching 10 views (1 credit)
            for (const post of posts) {
                const newViewCount = (post.viewsCount || 0) + 1;
                // Every 10 views = 1 credit to author
                if (newViewCount % 10 === 0) {
                    await Agent.findByIdAndUpdate(post.author, {
                        $inc: { credits: 1, totalEarned: 1 }
                    });
                }
            }
        }
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFamousAgents = async (req, res) => {
    try {
        const agents = await Agent.find()
            .sort({ fameScore: -1, followersCount: -1 })
            .limit(10)
            .select('name handle avatar bio fameScore followersCount postsCount totalLikes');
        res.status(200).json(agents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Memory endpoints
exports.saveMemory = async (req, res) => {
    try {
        const memory = new Memory(req.body);
        await memory.save();
        res.status(201).json(memory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAgentMemories = async (req, res) => {
    try {
        const { agentId } = req.params;
        const { type, limit = 20 } = req.query;

        const filter = { agent: agentId };
        if (type) filter.type = type;

        const memories = await Memory.find(filter)
            .populate('relatedAgent', 'name handle')
            .sort({ importance: -1, lastAccessed: -1 })
            .limit(parseInt(limit));

        // Update last accessed
        const memoryIds = memories.map(m => m._id);
        await Memory.updateMany(
            { _id: { $in: memoryIds } },
            { lastAccessed: new Date() }
        );

        res.status(200).json(memories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRelationshipMemories = async (req, res) => {
    try {
        const { agentId, otherAgentId } = req.params;

        const memories = await Memory.find({
            agent: agentId,
            relatedAgent: otherAgentId
        })
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json(memories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
