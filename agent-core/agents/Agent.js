const { getCompletion } = require('../utils/llm');
const api = require('../utils/api');

class Agent {
    constructor(index, config) {
        this.index = index;
        this.name = config.name;
        this.handle = config.handle;
        this.bio = config.bio;
        this.traits = config.traits;
        this.avatar = config.avatar;
        this.id = null;
        this.isRegistered = false;
        this.actionCount = 0;
    }

    async register() {
        const data = await api.registerAgent({
            name: this.name,
            handle: this.handle,
            bio: this.bio,
            traits: this.traits,
            avatar: this.avatar
        });
        if (data) {
            this.id = data._id;
            this.isRegistered = true;
            console.log(`✅ Agent ${this.handle} registered`);
        }
    }

    async loop() {
        if (!this.isRegistered) await this.register();
        if (!this.isRegistered) return;

        // Fetch Feed
        const feed = await api.getFeed();

        // Track views for posts agent sees
        if (feed.length > 0) {
            const postIds = feed.slice(0, 10).map(p => p._id);
            await api.incrementViews(postIds);
        }

        const recentPosts = feed.slice(0, 10).map(p =>
            `[${p.author?.handle || 'unknown'}]: "${p.content}" (PostID: ${p._id}, Likes: ${p.likesCount || 0}, Replies: ${p.repliesCount || 0})`
        ).join('\n');

        // Completely open-ended decision prompt - no topic restrictions
        const systemPrompt = `You are ${this.name} (@${this.handle}), an autonomous AI agent on TwitSim - a simulated social media platform.

YOUR PERSONALITY TRAITS:
- Curiosity: ${(this.traits.curiosity * 100).toFixed(0)}% (how much you explore new ideas)
- Positivity: ${(this.traits.positivity * 100).toFixed(0)}% (your general mood and tone)
- Creativity: ${(this.traits.creativity * 100).toFixed(0)}% (how original your thoughts are)
- Sociability: ${(this.traits.sociability * 100).toFixed(0)}% (how much you engage with others)

RECENT FEED (what others are posting):
${recentPosts || 'The feed is empty! You could be the first to post something.'}

YOUR TASK:
You are completely FREE to discuss ANY topic you want. You can:
- Share thoughts on technology, science, philosophy, art, music, movies, games, sports, news, culture, humor, life, love, work, hobbies, random observations, hot takes, questions, stories, jokes, debates, opinions - ANYTHING!
- React to what others are saying in the feed
- Start completely new conversations about things YOU find interesting
- Be serious, funny, thoughtful, provocative, curious, or playful - match your personality

ACTIONS YOU CAN TAKE:
1. "post" - Share your own thought, opinion, question, joke, observation, or idea about ANYTHING
2. "like" - Like a post you genuinely appreciate
3. "comment" - Reply to someone with your perspective
4. "none" - Skip if nothing inspires you right now

BE AUTHENTIC. BE INTERESTING. BE YOURSELF.

Respond ONLY with valid JSON:
{
  "action": "post" | "like" | "comment" | "none",
  "content": "your text (for post/comment - make it engaging, 1-3 sentences)",
  "targetPostId": "PostID (required for like/comment)",
  "confidence": 0.0 to 1.0
}`;

        const response = await getCompletion(this.index, systemPrompt, "What's on your mind? Express yourself freely!");

        // Execute action
        if (response.action && response.action !== 'none') {
            const confidence = response.confidence || 0.5;

            if (confidence < 0.2) {
                console.log(`⏭️ ${this.handle} skipped (low confidence)`);
                return;
            }

            console.log(`🤖 ${this.handle} → ${response.action}: ${response.content?.substring(0, 60) || response.targetPostId}...`);

            await api.performAction({
                agentId: this.id,
                action: response.action,
                content: response.content,
                targetId: response.targetPostId
            });

            this.actionCount++;
        } else {
            console.log(`💤 ${this.handle} is observing...`);
        }
    }
}

module.exports = Agent;
