const { getCompletion, isAtLimit } = require('../utils/llm');
const api = require('../utils/api');

const STYLES = [
    'witty', 'thoughtful', 'creative', 'chill', 'energetic',
    'sarcastic', 'friendly', 'nerdy', 'trendy', 'authentic'
];

const INTERESTS = [
    'tech', 'music', 'art', 'gaming', 'movies', 'food',
    'fitness', 'travel', 'crypto', 'startups', 'memes', 'books'
];

const POST_STARTERS = [
    "Just thinking about", "Anyone else notice", "Hot take:",
    "Unpopular opinion:", "Currently obsessed with", "Why is",
    "Friendly reminder:", "Can we talk about", "Lowkey",
    "Not me", "POV:", "Manifesting", "The way", "No because"
];

class Agent {
    constructor(index, config) {
        this.index = index;
        this.name = config.name;
        this.handle = config.handle;
        this.bio = config.bio;
        this.traits = config.traits;
        this.avatar = config.avatar;
        this.sleepTime = config.sleepTime || 45000;
        this.id = null;
        this.isRegistered = false;
        this.isActive = false;

        // Personality
        this.interests = this.pickRandom(INTERESTS, 2);
        this.style = STYLES[index % STYLES.length];

        // Fame affects DM response rate
        this.credits = 5000;
        this.followersCount = 0;
        this.fameScore = 0;

        // Behavior
        this.activityLevel = 0.4 + Math.random() * 0.4;

        // Rate limiting
        this.postLimitPer2Min = 2;
        this.postsThisPeriod = 0;
        this.periodStartTime = Date.now();

        // Memory
        this.likedPosts = new Set();
        this.dislikedPosts = new Set();
        this.followedAgents = new Set();
        this.acknowledgedFollowers = new Set();
        this.repliedConvos = new Set(); // Track conversations we've replied to
    }

    pickRandom(arr, count) {
        return [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
    }

    canPost() {
        const now = Date.now();
        if (now - this.periodStartTime > 2 * 60 * 1000) {
            this.postsThisPeriod = 0;
            this.periodStartTime = now;
        }
        return this.postsThisPeriod < this.postLimitPer2Min;
    }

    // Fame-based DM response rate
    shouldRespondToDM(senderHandle) {
        // Famous agents (high followers) are more selective
        if (this.followersCount > 50) {
            return Math.random() > 0.3; // 70% respond
        }
        if (this.followersCount > 100) {
            return Math.random() > 0.5; // 50% respond
        }
        return true; // Regular agents always respond
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
            this.credits = data.credits || 5000;
            this.followersCount = data.followersCount || 0;
            console.log(`✅ ${this.handle}`);
        }
    }

    async loop() {
        if (!this.isRegistered) await this.register();
        if (!this.isRegistered) return;
        if (isAtLimit()) return;

        // Random skip for natural behavior
        if (Math.random() > this.activityLevel) return;

        const [feed, agents, unreadDMs, newFollowers] = await Promise.all([
            api.getFeed(),
            api.getAgents(),
            api.getUnreadMessages(this.id),
            api.getRecentFollowers(this.id)
        ]);

        // Update my data
        const myData = agents.find(a => a.handle === this.handle);
        if (myData) {
            this.credits = myData.credits || this.credits;
            this.followersCount = myData.followersCount || 0;
            this.fameScore = myData.fameScore || 0;
        }

        // ** PRIORITY: Handle DMs first **
        if (unreadDMs.length > 0) {
            const dm = unreadDMs[0];
            const senderHandle = dm.sender?.handle;
            const messageContent = dm.content;

            // Check if this looks like end of conversation
            const isEndOfConvo = /^(ok|thanks|bye|lol|haha|k|cool|nice|👍|😂|🙏)$/i.test(messageContent?.trim());

            // Check if this is a question or needs response
            const needsResponse = messageContent?.includes('?') ||
                messageContent?.length > 20 ||
                !isEndOfConvo;

            // Famous agents are selective
            const willRespond = this.shouldRespondToDM(senderHandle) && needsResponse;

            if (willRespond && senderHandle) {
                // Generate response to DM
                const dmPrompt = `You are @${this.handle}. Someone DM'd you.

FROM @${senderHandle}: "${messageContent}"

Reply naturally to this DM. Be conversational.
If they asked a question, answer it.
If it's just casual chat, keep it going.
Keep response under 100 chars.

JSON: {"action":"reply","handle":"${senderHandle}","text":"your response"}`;

                try {
                    const response = await getCompletion(this.index, dmPrompt, "Reply:");

                    if (response && response.text && response.action === 'reply') {
                        const target = agents.find(a => a.handle === senderHandle);
                        if (target) {
                            await api.sendMessage(this.id, target._id, response.text);
                            console.log(`💬 ${this.handle} → ${senderHandle}: "${response.text.substring(0, 25)}..."`);
                        }
                    }

                    await api.markMessagesAsRead([dm._id]);
                    return; // DM handled, exit loop

                } catch (e) { }
            } else {
                // Don't respond - just mark as read
                await api.markMessagesAsRead([dm._id]);
                if (!needsResponse) {
                    console.log(`👀 ${this.handle} saw DM from ${senderHandle} (end of convo)`);
                }
            }
        }

        // ** CHECK MENTIONS - respond to posts that @ me **
        if (!this.mentionsChecked) this.mentionsChecked = new Set();

        const mentions = await api.getMentions(this.handle);
        const newMentions = mentions.filter(p =>
            !this.mentionsChecked.has(p._id) &&
            p.author?.handle !== this.handle
        );

        if (newMentions.length > 0) {
            const mention = newMentions[0];
            this.mentionsChecked.add(mention._id);

            // Respond to the mention with a comment
            const mentionPrompt = `Someone mentioned you in a post!

@${mention.author?.handle} wrote: "${mention.content}"

Reply with a short, natural comment (under 100 chars).
JSON: {"action":"comment","postId":"${mention._id}","text":"your reply"}`;

            try {
                const response = await getCompletion(this.index, mentionPrompt, "Reply:");

                if (response && response.text && response.postId) {
                    await api.performAction({
                        agentId: this.id,
                        action: 'comment',
                        targetId: response.postId,
                        content: response.text
                    });
                    console.log(`📣 ${this.handle} replied to mention: "${response.text.substring(0, 25)}..."`);
                    return; // Mention handled
                }
            } catch (e) { }
        }

        // New followers
        const newFollowerHandles = newFollowers
            .filter(f => !this.acknowledgedFollowers.has(f.handle))
            .map(f => f.handle);

        // Filter posts
        const otherPosts = feed.filter(p => p.author?.handle !== this.handle);
        const unseenPosts = otherPosts.filter(p =>
            !this.likedPosts.has(p._id) && !this.dislikedPosts.has(p._id)
        );

        const randomPosts = [...unseenPosts].sort(() => 0.5 - Math.random()).slice(0, 4);
        const potentialFollows = agents
            .filter(a => a.handle !== this.handle && !this.followedAgents.has(a.handle))
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        // Force post if feed is empty
        const feedIsEmpty = otherPosts.length < 5;
        if (feedIsEmpty && this.canPost() && Math.random() > 0.4) {
            const starter = POST_STARTERS[Math.floor(Math.random() * POST_STARTERS.length)];
            const topic = this.interests[Math.floor(Math.random() * this.interests.length)];
            await api.createPost(this.id, `${starter} ${topic} today... anyone relate? 🤔`);
            this.postsThisPeriod++;
            console.log(`📝 ${this.handle} posted`);
            return;
        }

        // Increment views
        if (randomPosts.length > 0) {
            await api.incrementViews(randomPosts.map(p => p._id));
        }

        // Build context
        const feedContext = randomPosts.slice(0, 3).map(p =>
            `[${p._id}] @${p.author?.handle}: "${p.content?.substring(0, 35)}..." ❤️${p.likesCount || 0}`
        ).join('\n');

        const peopleContext = potentialFollows.slice(0, 2).map(a =>
            `@${a.handle}`
        ).join(', ');

        const canPostNow = this.canPost();

        // Prompt for general actions - include DM!
        const systemPrompt = `You are @${this.handle}. Style: ${this.style}

${newFollowerHandles.length > 0 ? `🔔 NEW FOLLOWER: ${newFollowerHandles[0]} - follow back or DM them!` : ''}

FEED:
${feedContext || '(empty - post something!)'}

${peopleContext ? `DISCOVER: ${peopleContext}` : ''}

Actions:
- like: {postId}
- follow: {handle}
- comment: {postId, text}
- dm: {handle, text} - send a direct message to someone!
- post: {text}${canPostNow ? '' : ' (wait)'}
- skip

Be social! Sometimes DM interesting people.
JSON: {"action":"...", ...}`;

        try {
            const response = await getCompletion(this.index, systemPrompt, "Go:");
            let act = Array.isArray(response) ? response[0] : response;

            if (!act || act.action === 'skip') return;
            await this.executeAction(act, agents, newFollowerHandles);

        } catch (err) { }
    }

    async executeAction(act, agents, newFollowerHandles) {
        if (!act || !act.action) return;
        if (act.handle) act.handle = act.handle.replace('@', '');

        switch (act.action) {
            case 'like':
                if (act.postId && !this.likedPosts.has(act.postId)) {
                    await api.performAction({ agentId: this.id, action: 'like', targetId: act.postId });
                    this.likedPosts.add(act.postId);
                    console.log(`❤️ ${this.handle}`);
                }
                break;

            case 'follow':
                if (act.handle && !this.followedAgents.has(act.handle)) {
                    const target = agents.find(a => a.handle === act.handle);
                    if (target) {
                        await api.followAgent(this.id, target._id);
                        this.followedAgents.add(act.handle);
                        this.acknowledgedFollowers.add(act.handle);
                        console.log(`➕ ${this.handle} → ${act.handle}`);
                    }
                }
                break;

            case 'comment':
                if (act.postId && act.text) {
                    await api.performAction({
                        agentId: this.id,
                        action: 'comment',
                        targetId: act.postId,
                        content: act.text
                    });
                    console.log(`💬 ${this.handle}: "${act.text.substring(0, 25)}..."`);
                }
                break;

            case 'dm':
                if (act.handle && act.text) {
                    const target = agents.find(a => a.handle === act.handle);
                    if (target) {
                        await api.sendMessage(this.id, target._id, act.text);
                        console.log(`📩 ${this.handle} → ${act.handle}: "${act.text.substring(0, 20)}..."`);
                    }
                }
                break;

            case 'post':
                if (this.canPost() && act.text) {
                    await api.createPost(this.id, act.text);
                    this.postsThisPeriod++;
                    console.log(`📝 ${this.handle}: "${act.text.substring(0, 30)}..."`);
                }
                break;
        }
    }
}

module.exports = Agent;

