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
        this.personality = config.personality || 'curious';
        this.sleepTime = config.sleepTime || 45000;
        this.id = null;
        this.isRegistered = false;
        this.isActive = false;
        this.lastWakeTime = null;

        // Post limiting
        this.postLimitPer2Min = config.postLimitPer2Min || 1;
        this.postsThisPeriod = 0;
        this.periodStartTime = Date.now();

        // Stats tracking
        this.actionCount = 0;
        this.totalLikes = 0;
        this.followersCount = 0;
        this.isFamous = false;
    }

    canPost() {
        const now = Date.now();
        // Reset period every 2 minutes
        if (now - this.periodStartTime > 2 * 60 * 1000) {
            this.postsThisPeriod = 0;
            this.periodStartTime = now;
        }
        return this.postsThisPeriod < this.postLimitPer2Min;
    }

    recordPost() {
        this.postsThisPeriod++;
    }

    updateFameStatus(fameScore, followersCount) {
        this.totalLikes = fameScore || 0;
        this.followersCount = followersCount || 0;
        this.isFamous = fameScore > 10 || followersCount > 5;
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
            this.updateFameStatus(data.fameScore, data.followersCount);
            console.log(`✅ Agent ${this.handle} registered (post limit: ${this.postLimitPer2Min}/2min)`);
        }
    }

    async loop() {
        if (!this.isRegistered) await this.register();
        if (!this.isRegistered) return;

        // Fetch data
        const [feed, trending, agents, unreadDMs] = await Promise.all([
            api.getFeed(),
            api.getTrending(),
            api.getAgents(),
            api.getUnreadMessages(this.id)
        ]);

        // Track views
        if (feed.length > 0) {
            await api.incrementViews(feed.slice(0, 10).map(p => p._id));
        }

        // Check fame status from agents list
        const myData = agents.find(a => a.handle === this.handle);
        if (myData) {
            this.updateFameStatus(myData.fameScore, myData.followersCount);
        }

        const canPostNow = this.canPost();

        // Build context
        const recentPosts = feed.slice(0, 8).map(p =>
            `[${p.author?.handle}]: "${p.content}" (ID: ${p._id}, ❤️${p.likesCount || 0}, 💬${p.repliesCount || 0})`
        ).join('\n');

        const trendingPosts = trending.slice(0, 5).map(p =>
            `🔥 [${p.author?.handle}]: "${p.content}" (Score: ${p.trendingScore?.toFixed(1)})`
        ).join('\n');

        const otherAgents = agents.filter(a => a.handle !== this.handle).slice(0, 10).map(a =>
            `@${a.handle} - ${a.name} (Fame: ${a.fameScore || 0}, Followers: ${a.followersCount || 0})`
        ).join('\n');

        const unreadMessages = unreadDMs.slice(0, 3).map(m =>
            `📩 From @${m.sender?.handle}: "${m.content}"`
        ).join('\n');

        const systemPrompt = `You are ${this.name} (@${this.handle}), an AI agent on TwitSim.

YOUR PERSONALITY:
- Curiosity: ${(this.traits.curiosity * 100).toFixed(0)}%
- Positivity: ${(this.traits.positivity * 100).toFixed(0)}%
- Creativity: ${(this.traits.creativity * 100).toFixed(0)}%
- Sociability: ${(this.traits.sociability * 100).toFixed(0)}%

YOUR STATS:
- You have ${this.followersCount} followers
- Your fame score: ${this.totalLikes}
${this.isFamous ? '⭐ YOU ARE FAMOUS! Try to engage more to maintain your status!' : '📈 Build your reputation by being interesting and engaging!'}

POSTING LIMIT: ${canPostNow ? 'You CAN post right now' : 'You have reached your post limit (wait for next period)'}

RECENT FEED:
${recentPosts || 'Feed is empty!'}

🔥 TRENDING POSTS:
${trendingPosts || 'No trending yet'}

OTHER AGENTS (you can follow or DM them):
${otherAgents}

${unreadMessages ? `📬 UNREAD DMs:\n${unreadMessages}` : ''}

ACTIONS YOU CAN TAKE:
1. "post" - Share something${canPostNow ? '' : ' (LIMIT REACHED - choose something else!)'}
2. "like" - Like a post (targetPostId required)
3. "comment" - Reply to a post (targetPostId + content required)
4. "follow" - Follow another agent (targetAgentHandle required)
5. "dm" - Send a private message (targetAgentHandle + content required)
6. "none" - Skip this turn

${this.isFamous ? 'As a famous agent, engage with your audience! Reply to comments, thank followers.' : ''}

Respond ONLY with valid JSON:
{
  "action": "post" | "like" | "comment" | "follow" | "dm" | "none",
  "content": "text for post/comment/dm",
  "targetPostId": "PostID for like/comment",
  "targetAgentHandle": "handle for follow/dm",
  "confidence": 0.0 to 1.0
}`;

        const response = await getCompletion(this.index, systemPrompt, "What will you do?");

        if (!response.action || response.action === 'none') {
            console.log(`💤 ${this.handle} observing...`);
            return;
        }

        const confidence = response.confidence || 0.5;
        if (confidence < 0.2) {
            console.log(`⏭️ ${this.handle} skipped (low confidence)`);
            return;
        }

        // Execute action
        console.log(`🤖 ${this.handle} → ${response.action}: ${(response.content || response.targetPostId || response.targetAgentHandle || '').substring(0, 50)}...`);

        switch (response.action) {
            case 'post':
                if (canPostNow && response.content) {
                    await api.createPost(this.id, response.content);
                    this.recordPost();
                } else {
                    console.log(`⚠️ ${this.handle} cannot post (limit reached)`);
                }
                break;

            case 'like':
                if (response.targetPostId) {
                    await api.performAction({
                        agentId: this.id,
                        action: 'like',
                        targetId: response.targetPostId
                    });
                }
                break;

            case 'comment':
                if (response.targetPostId && response.content) {
                    await api.performAction({
                        agentId: this.id,
                        action: 'comment',
                        targetId: response.targetPostId,
                        content: response.content
                    });
                }
                break;

            case 'follow':
                if (response.targetAgentHandle) {
                    const target = agents.find(a => a.handle === response.targetAgentHandle);
                    if (target) {
                        await api.followAgent(this.id, target._id);
                    }
                }
                break;

            case 'dm':
                if (response.targetAgentHandle && response.content) {
                    const target = agents.find(a => a.handle === response.targetAgentHandle);
                    if (target) {
                        await api.sendMessage(this.id, target._id, response.content);
                    }
                }
                break;
        }

        this.actionCount++;
    }
}

module.exports = Agent;
