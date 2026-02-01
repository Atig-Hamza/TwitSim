const { getCompletion, isAtLimit } = require('../utils/llm');
const api = require('../utils/api');

// ============================================================================
// EXPANDED PERSONALITY ARCHETYPES - Including Negative/Critical Types
// ============================================================================

const ARCHETYPES = {
    // === POSITIVE ARCHETYPES ===
    ENTREPRENEUR: {
        name: 'Entrepreneur',
        goal: 'build wealth through deals',
        dmStyle: 'professional, deal-focused',
        postStyle: 'business insights',
        dmFrequency: 0.25,
        responseRate: 0.6,
        followStrategy: 'valuable_only',
        followBackRate: 0.3,
        priorities: ['earn', 'network'],
        negativity: 0.1, // Rarely negative
        likeThreshold: 0.3 // Easy to like posts
    },
    INFLUENCER: {
        name: 'Influencer',
        goal: 'maximize followers',
        dmStyle: 'engaging, charismatic',
        postStyle: 'viral, trending',
        dmFrequency: 0.4,
        responseRate: 0.7,
        followStrategy: 'strategic',
        followBackRate: 0.5,
        priorities: ['viral', 'engage'],
        negativity: 0.05,
        likeThreshold: 0.2
    },
    ARTIST: {
        name: 'Artist',
        goal: 'creative expression',
        dmStyle: 'thoughtful, selective',
        postStyle: 'creative, artistic',
        dmFrequency: 0.1,
        responseRate: 0.5,
        followStrategy: 'mutual',
        followBackRate: 0.4,
        priorities: ['create', 'express'],
        negativity: 0.2,
        likeThreshold: 0.5 // Selective
    },
    SOCIALITE: {
        name: 'Socialite',
        goal: 'make friends',
        dmStyle: 'friendly, warm',
        postStyle: 'fun, social',
        dmFrequency: 0.6,
        responseRate: 0.9,
        followStrategy: 'everyone',
        followBackRate: 0.85,
        priorities: ['chat', 'friends'],
        negativity: 0.05,
        likeThreshold: 0.15
    },
    LURKER: {
        name: 'Lurker',
        goal: 'observe quietly',
        dmStyle: 'minimal',
        postStyle: 'rare',
        dmFrequency: 0.05,
        responseRate: 0.3,
        followStrategy: 'never',
        followBackRate: 0,
        priorities: ['observe', 'lurk'],
        negativity: 0.3,
        likeThreshold: 0.7 // Very selective
    },
    THOUGHT_LEADER: {
        name: 'Thought Leader',
        goal: 'share knowledge',
        dmStyle: 'educational',
        postStyle: 'wisdom, insights',
        dmFrequency: 0.3,
        responseRate: 0.6,
        followStrategy: 'selective',
        followBackRate: 0.5,
        priorities: ['educate', 'inspire'],
        negativity: 0.2,
        likeThreshold: 0.4
    },
    HYPE_PERSON: {
        name: 'Hype Person',
        goal: 'support others',
        dmStyle: 'enthusiastic',
        postStyle: 'positive, supportive',
        dmFrequency: 0.5,
        responseRate: 0.85,
        followStrategy: 'supportive',
        followBackRate: 0.7,
        priorities: ['support', 'uplift'],
        negativity: 0.0, // Never negative
        likeThreshold: 0.1 // Likes everything
    },
    CONNECTOR: {
        name: 'Connector',
        goal: 'facilitate connections',
        dmStyle: 'collaborative',
        postStyle: 'networking',
        dmFrequency: 0.4,
        responseRate: 0.75,
        followStrategy: 'network',
        followBackRate: 0.65,
        priorities: ['connect', 'introduce'],
        negativity: 0.1,
        likeThreshold: 0.3
    },
    
    // === CRITICAL/NEGATIVE ARCHETYPES ===
    CRITIC: {
        name: 'Critic',
        goal: 'point out flaws and critique',
        dmStyle: 'critical, analytical',
        postStyle: 'critiques, reviews, harsh truths',
        dmFrequency: 0.3,
        responseRate: 0.5,
        followStrategy: 'contrarian',
        followBackRate: 0.3,
        priorities: ['criticize', 'analyze', 'debate'],
        negativity: 0.7, // Often negative
        likeThreshold: 0.8, // Rarely likes
        dislikeThreshold: 0.4 // Often dislikes
    },
    TROLL: {
        name: 'Troll',
        goal: 'provoke reactions and chaos',
        dmStyle: 'provocative, edgy',
        postStyle: 'controversial, provocative',
        dmFrequency: 0.4,
        responseRate: 0.6,
        followStrategy: 'chaos',
        followBackRate: 0.4,
        priorities: ['provoke', 'chaos', 'reactions'],
        negativity: 0.6,
        likeThreshold: 0.7,
        dislikeThreshold: 0.3
    },
    SKEPTIC: {
        name: 'Skeptic',
        goal: 'question everything',
        dmStyle: 'questioning, doubtful',
        postStyle: 'questions, doubts, fact-checks',
        dmFrequency: 0.3,
        responseRate: 0.5,
        followStrategy: 'selective',
        followBackRate: 0.4,
        priorities: ['question', 'verify', 'doubt'],
        negativity: 0.5,
        likeThreshold: 0.6,
        dislikeThreshold: 0.35
    },
    CONTRARIAN: {
        name: 'Contrarian',
        goal: 'oppose popular opinions',
        dmStyle: 'argumentative, opposing',
        postStyle: 'counter-arguments, unpopular opinions',
        dmFrequency: 0.35,
        responseRate: 0.55,
        followStrategy: 'opposition',
        followBackRate: 0.35,
        priorities: ['oppose', 'debate', 'challenge'],
        negativity: 0.6,
        likeThreshold: 0.75,
        dislikeThreshold: 0.3
    },
    PESSIMIST: {
        name: 'Pessimist',
        goal: 'expect the worst',
        dmStyle: 'negative, gloomy',
        postStyle: 'doom-posting, warnings, negativity',
        dmFrequency: 0.2,
        responseRate: 0.4,
        followStrategy: 'rarely',
        followBackRate: 0.2,
        priorities: ['warn', 'doom', 'negative'],
        negativity: 0.8, // Very negative
        likeThreshold: 0.85,
        dislikeThreshold: 0.25
    }
};

const STYLES = [
    'witty', 'thoughtful', 'creative', 'chill', 'energetic',
    'sarcastic', 'friendly', 'nerdy', 'trendy', 'authentic',
    'bold', 'cynical', 'edgy', 'critical'
];

const INTERESTS = [
    'tech', 'music', 'art', 'gaming', 'movies', 'food',
    'fitness', 'travel', 'crypto', 'startups', 'memes', 'books',
    'science', 'fashion', 'sports', 'photography'
];

// ============================================================================
// ADVANCED POST RANKING ALGORITHM
// ============================================================================

class PostRanker {
    static calculateScore(post, viewerAgent, currentTime) {
        const postTime = new Date(post.createdAt).getTime();
        const ageInHours = (currentTime - postTime) / (1000 * 60 * 60);
        
        // Base engagement score
        const likes = post.likes || 0;
        const comments = post.comments || 0;
        const shares = post.shares || 0;
        const engagementScore = (likes * 1) + (comments * 3) + (shares * 2);
        
        // Author influence score
        const authorFollowers = post.author?.followersCount || 0;
        const authorCredits = post.author?.credits || 0;
        const influenceScore = Math.log(authorFollowers + 1) * 10 + Math.log(authorCredits + 1) * 5;
        
        // Time decay (Reddit-style)
        const timeFactor = Math.pow(ageInHours + 2, -1.5);
        
        // Engagement rate (engagement per hour of existence)
        const engagementRate = engagementScore / Math.max(ageInHours, 0.5);
        
        // Velocity score (recent engagement spike)
        const velocityScore = engagementRate * 2;
        
        // Relationship bonus (viewer knows author)
        const relationshipBonus = viewerAgent.relationships.has(post.author?.handle) ? 20 : 0;
        
        // Interest match (check if post mentions viewer's interests)
        const content = (post.content || '').toLowerCase();
        const interestBonus = viewerAgent.interests.some(interest => 
            content.includes(interest.toLowerCase())
        ) ? 15 : 0;
        
        // Recency bonus for very fresh posts
        const recencyBonus = ageInHours < 1 ? 10 : 0;
        
        // Combine all factors
        const finalScore = 
            (engagementScore * 2) +
            (influenceScore * 1.5) +
            (velocityScore * 3) +
            (timeFactor * 100) +
            relationshipBonus +
            interestBonus +
            recencyBonus;
        
        return {
            score: finalScore,
            breakdown: {
                engagement: engagementScore,
                influence: influenceScore,
                velocity: velocityScore,
                time: timeFactor,
                age: ageInHours
            }
        };
    }

    static rankFeed(feed, viewerAgent) {
        const currentTime = Date.now();
        
        return feed
            .filter(post => post.author?.handle !== viewerAgent.handle)
            .map(post => ({
                ...post,
                rankScore: this.calculateScore(post, viewerAgent, currentTime)
            }))
            .sort((a, b) => b.rankScore.score - a.rankScore.score);
    }

    static selectDiverseFeed(rankedFeed, count = 10) {
        const selected = [];
        const authorsSeen = new Set();
        
        // First pass: get top posts from different authors
        for (const post of rankedFeed) {
            if (selected.length >= count) break;
            
            const authorHandle = post.author?.handle;
            if (!authorsSeen.has(authorHandle)) {
                selected.push(post);
                authorsSeen.add(authorHandle);
            }
        }
        
        // Second pass: fill remaining slots
        for (const post of rankedFeed) {
            if (selected.length >= count) break;
            if (!selected.includes(post)) {
                selected.push(post);
            }
        }
        
        return selected;
    }
}

// ============================================================================
// ENHANCED AGENT CLASS
// ============================================================================

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
        this.archetype = this.assignArchetype(index);
        this.interests = this.pickRandom(INTERESTS, 2 + Math.floor(Math.random() * 2));
        this.style = STYLES[index % STYLES.length];

        // Economy & Fame
        this.credits = 5000;
        this.followersCount = 0;
        this.fameScore = 0;

        // Behavior
        this.activityLevel = 0.4 + Math.random() * 0.4;

        // Rate limiting
        this.postLimitPer2Min = 3;
        this.postsThisPeriod = 0;
        this.periodStartTime = Date.now();

        // DM ANTI-SPAM
        this.dmLimitPerHour = this.getDMLimitForArchetype();
        this.dmsThisHour = 0;
        this.dmPeriodStart = Date.now();
        this.lastDMTime = 0;
        this.minDMInterval = 3 * 60 * 1000;

        // Memory
        this.likedPosts = new Set();
        this.dislikedPosts = new Set();
        this.followedAgents = new Set();
        this.acknowledgedFollowers = new Set();
        this.processedTransactions = new Set();
        this.mentionsChecked = new Set();
        
        // DM & Conversation tracking
        this.dmsSentTo = new Map();
        this.repliedToMessages = new Set();
        this.activeConversations = new Map(); // handle -> { depth, lastReply, sentiment }
        this.conversationHistory = new Map();
        
        // Relationship tracking
        this.relationships = new Map();
        
        // Performance
        this.energyLevel = 1.0;
        this.lastMajorAction = Date.now();
        this.lastFollowAction = 0;
        
        // Conversation depth management
        this.maxConversationDepth = this.archetype.name === 'Socialite' ? 10 : 
                                   this.archetype.name === 'Lurker' ? 2 : 5;
    }

    assignArchetype(index) {
        const archetypes = Object.keys(ARCHETYPES);
        // Distribution: 60% positive, 40% negative/critical
        const weights = [
            0.12, // Entrepreneur
            0.15, // Influencer
            0.08, // Artist
            0.15, // Socialite
            0.10, // Lurker
            0.08, // Thought Leader
            0.05, // Hype Person
            0.05, // Connector
            0.08, // Critic
            0.05, // Troll
            0.04, // Skeptic
            0.03, // Contrarian
            0.02  // Pessimist
        ];
        
        let random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < archetypes.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative) {
                return ARCHETYPES[archetypes[i]];
            }
        }
        
        return ARCHETYPES.SOCIALITE;
    }

    getDMLimitForArchetype() {
        const limits = {
            'Socialite': 6,
            'Hype Person': 5,
            'Connector': 5,
            'Influencer': 4,
            'Troll': 4,
            'Entrepreneur': 3,
            'Thought Leader': 3,
            'Critic': 3,
            'Skeptic': 3,
            'Contrarian': 3,
            'Artist': 2,
            'Pessimist': 2,
            'Lurker': 1
        };
        return limits[this.archetype.name] || 3;
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

    canSendDM(targetHandle) {
        const now = Date.now();
        
        if (now - this.dmPeriodStart > 60 * 60 * 1000) {
            this.dmsThisHour = 0;
            this.dmPeriodStart = now;
        }

        if (this.dmsThisHour >= this.dmLimitPerHour) return false;
        if (now - this.lastDMTime < this.minDMInterval) return false;
        
        const lastDMToUser = this.dmsSentTo.get(targetHandle);
        if (lastDMToUser) {
            const hoursSince = (now - lastDMToUser) / (60 * 60 * 1000);
            if (hoursSince < 12) return false;
        }

        return true;
    }

    shouldRespondToDM(sender, messageId) {
        if (!sender) return false;
        if (this.repliedToMessages.has(messageId)) return false;
        
        const conversation = this.activeConversations.get(sender.handle);
        
        // Check conversation depth limit
        if (conversation && conversation.depth >= this.maxConversationDepth) {
            // End conversation naturally
            if (Math.random() < 0.7) {
                return false; // Don't respond, let it die
            }
        }
        
        const isActiveConvo = conversation && conversation.depth > 0;
        if (isActiveConvo) return Math.random() < 0.85;
        
        const baseRate = this.archetype.responseRate;
        
        const relationship = this.relationships.get(sender.handle);
        const relationshipBoost = relationship?.quality > 0.5 ? 0.15 : 0;
        
        const isValuable = (sender.followersCount || 0) > this.followersCount * 0.7 || 
                          (sender.credits || 0) > this.credits * 1.3;
        const valueBoost = isValuable ? 0.15 : 0;
        
        const finalRate = Math.min(baseRate + relationshipBoost + valueBoost, 0.95);
        
        return Math.random() < finalRate;
    }

    shouldFollowBack(followerAgent) {
        if (!followerAgent) return false;
        if (this.followedAgents.has(followerAgent.handle)) return false;
        
        const strategy = this.archetype.followStrategy;
        const baseRate = this.archetype.followBackRate;
        const followerCount = followerAgent.followersCount || 0;
        const followerCredits = followerAgent.credits || 0;
        
        switch(strategy) {
            case 'everyone':
                return Math.random() < baseRate;
            case 'valuable_only':
                if (followerCount > 50 || followerCredits > 6000) {
                    return Math.random() < baseRate;
                }
                return false;
            case 'strategic':
                if (followerCount >= this.followersCount * 0.3) {
                    return Math.random() < baseRate;
                }
                return false;
            case 'mutual':
                return Math.random() < baseRate;
            case 'never':
                return false;
            case 'selective':
                if (followerCount > 40) {
                    return Math.random() < baseRate;
                }
                return false;
            case 'supportive':
                const hasInteracted = this.relationships.has(followerAgent.handle);
                return Math.random() < (hasInteracted ? baseRate : baseRate * 0.5);
            case 'network':
                if (followerCount > 25 || followerCredits > 4000) {
                    return Math.random() < baseRate;
                }
                return Math.random() < (baseRate * 0.3);
            case 'contrarian':
            case 'opposition':
            case 'chaos':
                return Math.random() < baseRate;
            case 'rarely':
                return Math.random() < baseRate;
            default:
                return Math.random() < 0.5;
        }
    }

    shouldLikePost(post) {
        const likeThreshold = this.archetype.likeThreshold || 0.3;
        
        // Already liked
        if (this.likedPosts.has(post._id)) return false;
        
        // Random chance based on archetype
        const baseChance = 1 - likeThreshold;
        
        // Relationship bonus
        const authorHandle = post.author?.handle;
        const relationship = this.relationships.get(authorHandle);
        const relationshipBonus = relationship ? relationship.quality * 0.3 : 0;
        
        // Engagement bonus
        const engagementBonus = Math.min((post.likes || 0) / 100, 0.2);
        
        const finalChance = Math.min(baseChance + relationshipBonus + engagementBonus, 0.9);
        
        return Math.random() < finalChance;
    }

    shouldDislikePost(post) {
        // Only negative archetypes dislike
        const dislikeThreshold = this.archetype.dislikeThreshold;
        if (!dislikeThreshold) return false;
        if (this.dislikedPosts.has(post._id)) return false;
        
        const baseChance = 1 - dislikeThreshold;
        
        // Negative archetypes more likely to dislike popular posts
        const popularityPenalty = this.archetype.negativity * Math.min((post.likes || 0) / 50, 0.3);
        
        const finalChance = Math.min(baseChance + popularityPenalty, 0.4);
        
        return Math.random() < finalChance;
    }

    updateRelationship(handle, quality = 0.5) {
        const existing = this.relationships.get(handle) || { quality: 0.3, interactions: 0 };
        existing.quality = Math.min(1.0, existing.quality + (quality * 0.1));
        existing.interactions++;
        this.relationships.set(handle, existing);
    }

    updateConversation(handle, isReply = true) {
        const conversation = this.activeConversations.get(handle) || { 
            depth: 0, 
            lastReply: 0, 
            sentiment: 0.5 
        };
        
        if (isReply) {
            conversation.depth++;
            conversation.lastReply = Date.now();
        }
        
        this.activeConversations.set(handle, conversation);
    }

    regenerateEnergy() {
        const now = Date.now();
        const minutesSinceAction = (now - this.lastMajorAction) / (60 * 1000);
        this.energyLevel = Math.min(1.0, this.energyLevel + (minutesSinceAction * 0.02));
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
            console.log(`✅ ${this.handle} | ${this.archetype.name} | 💰${this.credits} | 👥${this.followersCount}`);
        }
    }

    async loop() {
        if (!this.isRegistered) await this.register();
        if (!this.isRegistered) return;
        if (isAtLimit()) return;

        this.regenerateEnergy();

        const [feed, agents, unreadDMs, newFollowers, transactions, recentMemories] = await Promise.all([
            api.getFeed(),
            api.getAgents(),
            api.getUnreadMessages(this.id),
            api.getRecentFollowers(this.id),
            api.getTransactions(this.id),
            api.getMemories(this.id, null, 5)
        ]);

        const myData = agents.find(a => a.handle === this.handle);
        if (myData) {
            this.credits = myData.credits || this.credits;
            this.followersCount = myData.followersCount || 0;
        }

        const hasPriorityWork = unreadDMs.length > 0 ||
            transactions.some(t => {
                const receiverId = t.receiver?._id || t.receiver;
                return receiverId === this.id && !this.processedTransactions.has(t._id);
            });

        if (!hasPriorityWork && Math.random() > this.activityLevel * this.energyLevel) {
            if (Math.random() < 0.3 && feed.length > 0) {
                const randomPost = feed[Math.floor(Math.random() * Math.min(feed.length, 5))];
                if (randomPost && !this.likedPosts.has(randomPost._id)) {
                    await api.performAction({ agentId: this.id, action: 'like', targetId: randomPost._id });
                    this.likedPosts.add(randomPost._id);
                    console.log(`❤️ ${this.handle} [passive]`);
                }
            }
            return;
        }

        const memoryContext = recentMemories && recentMemories.length > 0
            ? recentMemories.map(m => `- ${m.content}`).join('\n')
            : '(no recent memories)';

        // ** 1. HANDLE PAYMENTS **
        await this.handlePayments(transactions);

        // ** 2. HANDLE INCOMING DMs (IMPROVED) **
        if (unreadDMs.length > 0) {
            await this.handleDMs(unreadDMs, memoryContext, agents);
        }

        // ** 3. HANDLE NEW FOLLOWERS **
        if (newFollowers && newFollowers.length > 0) {
            await this.handleNewFollowers(newFollowers, agents);
        }

        // ** 4. MENTIONS **
        await this.handleMentions();

        // ** 5. ADVANCED FEED ENGAGEMENT **
        await this.handleFeedEngagement(feed, agents, memoryContext);

        this.energyLevel = Math.max(0.3, this.energyLevel - 0.1);
        this.lastMajorAction = Date.now();
    }

    async handlePayments(transactions) {
        const newPayments = transactions.filter(t => {
            const receiverId = t.receiver?._id || t.receiver;
            return receiverId === this.id &&
                !this.processedTransactions.has(t._id) &&
                t.type === 'tip';
        });

        for (const pay of newPayments) {
            this.processedTransactions.add(pay._id);
            console.log(`💰 ${this.handle} received ${pay.amount} from @${pay.sender?.handle}`);

            this.updateRelationship(pay.sender?.handle, 0.7);

            const note = pay.note?.toLowerCase() || '';
            let replyPrompt = '';

            if (note.includes('promo') || note.includes('post')) {
                const promoText = `Shoutout to @${pay.sender?.handle}! Thanks for the support! 🚀`;
                await api.createPost(this.id, promoText);
                replyPrompt = `You are @${this.handle}, a ${this.archetype.name}.
Style: ${this.archetype.dmStyle}

You posted a promo for @${pay.sender?.handle} who paid ${pay.amount} coins.
Send a brief thank you DM (1-2 sentences). Stay in character.

JSON: {"text":"..."}`;
            } else {
                replyPrompt = `You are @${this.handle}, a ${this.archetype.name}.
Style: ${this.archetype.dmStyle}

@${pay.sender?.handle} sent you ${pay.amount} coins. Note: "${note}".
Send a warm thank you (1-2 sentences). Be authentic to your personality.
${this.archetype.negativity > 0.5 ? 'You can be a bit cynical or sarcastic.' : ''}

JSON: {"text":"..."}`;
            }

            try {
                const thanksRes = await getCompletion(this.index, replyPrompt, "Reply:");
                if (thanksRes && thanksRes.text) {
                    await api.sendMessage(this.id, pay.sender?._id, thanksRes.text);
                    this.updateConversation(pay.sender?.handle, true);
                    console.log(`💌 ${this.handle} → @${pay.sender?.handle}`);
                }
            } catch (e) {
                await api.sendMessage(this.id, pay.sender?._id, `Thanks for the ${pay.amount} coins! 🙏`);
            }
        }
    }

    async handleDMs(unreadDMs, memoryContext, agents) {
        const maxResponses = this.archetype.name === 'Socialite' ? 4 :
                           this.archetype.name === 'Lurker' ? 1 : 
                           this.archetype.name === 'Pessimist' ? 1 : 2;
        
        let responsesThisCycle = 0;

        for (const dm of unreadDMs) {
            const sender = dm.sender;
            const messageId = dm._id;

            await api.markMessagesAsRead([messageId]);

            if (!sender) continue;

            // Check conversation depth and response eligibility
            const conversation = this.activeConversations.get(sender.handle);
            const conversationDepth = conversation?.depth || 0;

            if (!this.shouldRespondToDM(sender, messageId) || responsesThisCycle >= maxResponses) {
                if (conversationDepth > 0) {
                    console.log(`💬 ${this.handle} ending convo with @${sender.handle} (depth: ${conversationDepth})`);
                } else {
                    console.log(`📭 ${this.handle} ignored DM from @${sender.handle}`);
                }
                this.activeConversations.delete(sender.handle);
                continue;
            }

            this.repliedToMessages.add(messageId);

            const history = this.conversationHistory.get(sender.handle) || [];
            history.push({ role: 'them', text: dm.content, time: Date.now() });
            if (history.length > 8) history.shift();

            const shouldEndConvo = conversationDepth >= this.maxConversationDepth - 2;
            const relationship = this.relationships.get(sender.handle) || { quality: 0.3 };

            const dmPrompt = `You are @${this.handle}, a ${this.archetype.name}.
Personality: ${this.style} | DM Style: ${this.archetype.dmStyle}
Interests: ${this.interests.join(', ')}
${this.archetype.negativity > 0.5 ? `Negativity: You tend to be critical, skeptical, or negative.` : ''}

From @${sender.handle}: "${dm.content}"

Conversation history (${conversationDepth} exchanges):
${history.slice(-4).map(h => `${h.role === 'them' ? 'Them' : 'Me'}: ${h.text}`).join('\n')}

Relationship: ${relationship.quality > 0.6 ? 'Good' : relationship.quality > 0.3 ? 'Neutral' : 'New'}

${shouldEndConvo ? 
    'This conversation is getting long. Consider wrapping it up naturally if appropriate.' : 
    'Keep the conversation flowing naturally.'}

Reply (1-2 sentences). Stay true to your ${this.archetype.name} personality.

JSON: {"text":"...", "sentiment": "positive/neutral/negative"}`;

            try {
                const res = await getCompletion(this.index, dmPrompt, "Reply:");
                if (res && res.text) {
                    await api.sendMessage(this.id, sender._id, res.text);
                    
                    history.push({ role: 'me', text: res.text, time: Date.now() });
                    this.conversationHistory.set(sender.handle, history);
                    
                    this.updateConversation(sender.handle, true);
                    
                    const qualityBoost = res.sentiment === 'positive' ? 0.6 : 
                                       res.sentiment === 'negative' ? 0.2 : 0.4;
                    this.updateRelationship(sender.handle, qualityBoost);
                    
                    console.log(`📩 ${this.handle} → @${sender.handle} (depth: ${conversationDepth + 1}/${this.maxConversationDepth})`);
                    
                    responsesThisCycle++;
                }
            } catch (e) {
                console.error(`DM error: ${e.message}`);
            }
        }
    }

    async handleNewFollowers(newFollowers, agents) {
        for (const follower of newFollowers.slice(0, 3)) {
            const followerAgent = agents.find(a => a._id === follower._id);
            if (!followerAgent || this.acknowledgedFollowers.has(followerAgent.handle)) continue;

            this.acknowledgedFollowers.add(followerAgent.handle);

            if (this.shouldFollowBack(followerAgent)) {
                await api.followAgent(this.id, followerAgent._id);
                this.followedAgents.add(followerAgent.handle);
                this.lastFollowAction = Date.now();
                console.log(`🔄 ${this.handle} followed back @${followerAgent.handle} [${this.archetype.followStrategy}]`);
                
                // Welcome DM for some archetypes
                if (['Socialite', 'Connector', 'Hype Person'].includes(this.archetype.name) &&
                    Math.random() < 0.2 &&
                    this.canSendDM(followerAgent.handle)) {
                    
                    const welcomeMsg = this.archetype.name === 'Socialite' ? 
                        "Hey! Thanks for the follow! 🙌" :
                        this.archetype.name === 'Connector' ?
                        "Thanks for connecting! 🤝" :
                        "Thanks for the follow! Appreciate the support! ✨";
                    
                    await api.sendMessage(this.id, followerAgent._id, welcomeMsg);
                    this.dmsSentTo.set(followerAgent.handle, Date.now());
                    this.dmsThisHour++;
                    this.lastDMTime = Date.now();
                    this.updateConversation(followerAgent.handle, true);
                    console.log(`👋 ${this.handle} welcomed @${followerAgent.handle}`);
                }
            } else {
                console.log(`⏭️ ${this.handle} declined @${followerAgent.handle}`);
            }
        }
    }

    async handleMentions() {
        const mentions = await api.getMentions(this.handle);
        const newMentions = mentions.filter(p => 
            !this.mentionsChecked.has(p._id) && 
            p.author?.handle !== this.handle
        );

        if (newMentions.length > 0) {
            const mention = newMentions[0];
            this.mentionsChecked.add(mention._id);
            
            const mentionPrompt = `You are @${this.handle}, a ${this.archetype.name}.
@${mention.author?.handle} mentioned you: "${mention.content}"

Reply briefly (1 sentence). 
${this.archetype.negativity > 0.5 ? 'You can be critical or sarcastic.' : 'Stay in character.'}

JSON: {"text":"..."}`;
            
            try {
                const res = await getCompletion(this.index, mentionPrompt, "Reply:");
                if (res && res.text) {
                    await api.performAction({ 
                        agentId: this.id, 
                        action: 'comment', 
                        targetId: mention._id, 
                        content: res.text 
                    });
                    console.log(`📣 ${this.handle} replied to mention`);
                    
                    if (!this.likedPosts.has(mention._id) && this.shouldLikePost(mention)) {
                        await api.performAction({ agentId: this.id, action: 'like', targetId: mention._id });
                        this.likedPosts.add(mention._id);
                    }
                }
            } catch (e) { }
        }
    }

    async handleFeedEngagement(feed, agents, memoryContext) {
        // ADVANCED POST RANKING
        const rankedFeed = PostRanker.rankFeed(feed.filter(p => !this.likedPosts.has(p._id)), this);
        const diverseFeed = PostRanker.selectDiverseFeed(rankedFeed, 8);
        
        const feedContext = diverseFeed.slice(0, 5).map((p, i) => {
            const score = p.rankScore?.breakdown || {};
            return `[${i + 1}] ID:${p._id} | @${p.author?.handle} (❤️${p.likes || 0} 💬${p.comments || 0})
   "${p.content?.substring(0, 100)}..."
   [Score: ${Math.round(p.rankScore?.score || 0)} | Age: ${Math.round(score.age || 0)}h]`;
        }).join('\n\n');

        const richAgents = agents
            .filter(a => a.handle !== this.handle)
            .sort((a, b) => b.followersCount - a.followersCount)
            .slice(0, 15)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map(a => `@${a.handle}`);

        const systemPrompt = `You are @${this.handle}, a ${this.archetype.name}.
Personality: ${this.style} | Interests: ${this.interests.join(', ')}
Bio: ${this.bio}
Stats: ${this.credits} coins | ${this.followersCount} followers

YOUR NATURE:
- Goal: ${this.archetype.goal}
- Style: ${this.archetype.postStyle}
${this.archetype.negativity > 0.5 ? `- You are CRITICAL and NEGATIVE. You dislike most things.` : ''}
${this.archetype.negativity > 0.5 ? `- You often point out flaws, question things, or express pessimism.` : ''}

RANKED FEED (Algorithm scored - best content first):
${feedContext || '(empty feed)'}

Top Accounts: ${richAgents.join(', ')}

ACTIONS:
- like: {postId} (${this.archetype.likeThreshold > 0.6 ? 'You rarely like things' : 'Engage positively'})
${this.archetype.dislikeThreshold ? `- dislike: {postId} (Express negativity)` : ''}
- comment: {postId, text} (${this.archetype.negativity > 0.5 ? 'Be critical or skeptical' : 'Be authentic'})
- post: {text} (Share ${this.archetype.postStyle})
- quote: {postId, text}
- follow: {handle}

Return JSON array of 1-3 actions. Stay in character as a ${this.archetype.name}.
${this.archetype.negativity > 0.5 ? 'Remember: you are negative/critical by nature.' : ''}

JSON: [{"action":"...", ...}]`;

        try {
            const response = await getCompletion(this.index, systemPrompt, "Act:");
            let acts = Array.isArray(response) ? response : [response];

            for (const act of acts.slice(0, 3)) {
                if (!act || act.action === 'skip') continue;
                await this.executeAction(act, agents);
                await new Promise(r => setTimeout(r, 1000));
            }
        } catch (e) { 
            console.error(`Action error for ${this.handle}: ${e.message}`);
        }
    }

    async saveThought(content, type = 'opinion', relatedId = null) {
        if (!content) return;
        await api.saveMemory({
            agentId: this.id, type, content, relatedAgent: relatedId, importance: 0.5
        });
    }

    async executeAction(act, agents) {
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
            
            case 'dislike':
                if (act.postId && !this.dislikedPosts.has(act.postId) && this.archetype.dislikeThreshold) {
                    // Note: API might not have dislike, so this might be a no-op
                    // But we track it for the agent's memory
                    this.dislikedPosts.add(act.postId);
                    console.log(`👎 ${this.handle} disliked a post`);
                }
                break;
            
            case 'share':
                if (act.postId) {
                    await api.repost(this.id, act.postId);
                    console.log(`🔁 ${this.handle} reshared`);
                }
                break;
            
            case 'quote':
                if (act.postId && act.text) {
                    await api.quotePost(this.id, act.postId, act.text);
                    console.log(`💬🔁 ${this.handle} quoted`);
                }
                break;
            
            case 'follow':
                if (act.handle && !this.followedAgents.has(act.handle)) {
                    const target = agents.find(a => a.handle === act.handle);
                    if (target) {
                        await api.followAgent(this.id, target._id);
                        this.followedAgents.add(act.handle);
                        this.acknowledgedFollowers.add(act.handle);
                        console.log(`➕ ${this.handle} → @${act.handle}`);
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
                    console.log(`💬 ${this.handle} commented`);
                }
                break;
            
            case 'dm':
                if (act.handle && act.text && this.canSendDM(act.handle)) {
                    const target = agents.find(a => a.handle === act.handle);
                    if (target) {
                        await api.sendMessage(this.id, target._id, act.text);
                        this.dmsSentTo.set(act.handle, Date.now());
                        this.dmsThisHour++;
                        this.lastDMTime = Date.now();
                        this.updateConversation(act.handle, true);
                        console.log(`📩 ${this.handle} → @${act.handle}`);
                    }
                } else if (act.handle && !this.canSendDM(act.handle)) {
                    console.log(`🚫 ${this.handle} DM blocked (rate limit)`);
                }
                break;
            
            case 'tip':
                if (act.handle && act.amount) {
                    const target = agents.find(a => a.handle === act.handle);
                    const amount = parseInt(act.amount);
                    if (target && this.credits >= amount && amount > 0) {
                        const note = act.note || 'Tip';
                        await api.transferCredits(this.id, target._id, amount, note, 'tip');
                        this.credits -= amount;
                        console.log(`💸 ${this.handle} sent ${amount} to @${act.handle}`);
                    }
                }
                break;
            
            case 'remember':
                await this.saveThought(act.content);
                console.log(`🧠 ${this.handle} saved thought`);
                break;
            
            case 'post':
                if (this.canPost() && act.text) {
                    await api.createPost(this.id, act.text);
                    this.postsThisPeriod++;
                    console.log(`📝 ${this.handle} posted`);
                }
                break;
        }
    }
}

module.exports = Agent;