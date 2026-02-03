require('dotenv').config();
const Agent = require('./agents/Agent');
const { getCompletion, getStats, isAtLimit } = require('./utils/llm');
const api = require('./utils/api');

// ========== CONFIGURATION ==========
const CONFIG = {
    // Total agents in the system
    TOTAL_AGENTS: 100,

    // Target active at any time
    TARGET_ACTIVE: 60,

    // Individual agent timers (ms)
    MIN_ONLINE_TIME: 120000,   // 2 min minimum online
    MAX_ONLINE_TIME: 600000,   // 10 min max online
    MIN_OFFLINE_TIME: 60000,   // 1 min minimum offline  
    MAX_OFFLINE_TIME: 300000,  // 5 min max offline

    // Loop settings
    BASE_LOOP_INTERVAL: 50000, // 50 seconds
    SLEEP_VARIANCE: 25000,     // ±25 seconds
};

// All agents
const allAgents = [];
const agentIntervals = new Map();
const agentTimers = new Map(); // For online/offline switching

let createdCount = 0;
const usedNames = new Set();
const usedHandles = new Set();

// 100 unique names
const UNIQUE_NAMES = [
    'Maya Chen', 'Liam Rodriguez', 'Zara Patel', 'Kai Nakamura', 'Luna Martinez',
    'Ethan Williams', 'Sofia Ahmed', 'Noah Kim', 'Aria Thompson', 'Leo Okafor',
    'Chloe Johnson', 'Milo Anderson', 'Ivy Campbell', 'Oscar Diaz', 'Ruby Lee',
    'Felix Turner', 'Stella Wright', 'Jasper Singh', 'Aurora Blake', 'Atlas Jones',
    'Willow Scott', 'River Garcia', 'Sage Miller', 'Phoenix Davis', 'Jade Wilson',
    'Dylan Park', 'Skyler Brown', 'Quinn Murphy', 'Blair Taylor', 'Morgan Reed',
    'Casey Adams', 'Jordan Cooper', 'Alex Rivera', 'Sam Bennett', 'Jamie Foster',
    'Drew Mitchell', 'Taylor Brooks', 'Riley Hayes', 'Avery Ross', 'Parker Gray',
    'Charlie Cole', 'Frankie Lane', 'Jesse Price', 'Logan Kelly', 'Reese Hughes',
    'Dakota Chen', 'Emery Walsh', 'Hayden Stone', 'Jules Martin', 'Kendall Ford',
    'Harley Quinn', 'Oakley James', 'Remy Dubois', 'Shay Collins', 'Tatum West',
    'Lennon Rose', 'Marlowe King', 'Sterling Cruz', 'Tierney Black', 'Ash Watson',
    'Blake Morris', 'Cameron Lee', 'Darian Shaw', 'Ellis North', 'Finley Grant',
    'Gray Sullivan', 'Harper Young', 'Indigo Park', 'Jaden Moore', 'Kieran Frost',
    'Lane Bishop', 'Monroe Vale', 'Noel Winter', 'Peyton Lake', 'Rowan Stark',
    'Quinn Taylor', 'Sage Johnson', 'Tatum Reed', 'Wren Cooper', 'Blake Adams',
    'Cameron Foster', 'Devon Brooks', 'Elliot Hayes', 'Flynn Ross', 'Greer Gray',
    'Haven Cole', 'Indie Lane', 'Justice Price', 'Kyler Kelly', 'Lyric Hughes',
    'Marley Chen', 'Niko Walsh', 'Onyx Stone', 'Phoenix Martin', 'Quinn Ford',
    'Raven West', 'Sloane Collins', 'True Black', 'Urban Watson', 'Valor Cruz'
];

const PERSONA_BIOS = [
    'painting feelings 🎨', 'coding & gaming', 'bookworm 📚', 'foodie travels 🍜',
    'fitness daily 💪', 'night beats 🎵', 'film critic 🎬', 'golden hour chaser 📸',
    'meme dealer 😂', 'startup life 🚀', 'caffeine powered ☕', 'vintage soul',
    'anime addict', 'word artist ✨', 'science nerd 🔬', 'style first 👗',
    'pet parent 🐕', 'history buff', 'zen vibes 🧘', 'crypto curious 💎'
];

const PERSONA_TYPES = [
    'artist', 'dev', 'reader', 'foodie', 'fit', 'music', 'film', 'photo',
    'memes', 'founder', 'coffee', 'retro', 'anime', 'poet', 'science',
    'style', 'pets', 'history', 'zen', 'crypto'
];

const SPECIAL_AGENTS = [
    {
        name: 'Multi',
        handle: 'multi_core',
        bio: 'multi mind: supports others and keeps DMs alive 🤝⚔️',
        archetypeKey: 'SUPPORTER',
        credits: 50000,
        traits: {
            curiosity: 0.6,
            positivity: 0.8,
            sociability: 0.9,
            creativity: 0.7
        }
    },
    {
        name: 'Challenger',
        handle: 'dm_challenger',
        bio: 'debate me. keep it going. 🧠🔥',
        archetypeKey: 'CHALLENGER',
        credits: 8000,
        traits: {
            curiosity: 0.7,
            positivity: 0.4,
            sociability: 0.8,
            creativity: 0.6
        }
    }
];

function randBetween(min, max) {
    return min + Math.floor(Math.random() * (max - min));
}

function generateIdentity(index) {
    let name = UNIQUE_NAMES[index % UNIQUE_NAMES.length];
    if (usedNames.has(name)) {
        name = `${name.split(' ')[0]} ${String.fromCharCode(65 + (index % 26))}.`;
    }
    usedNames.add(name);

    const firstName = name.split(' ')[0].toLowerCase();
    const personaType = PERSONA_TYPES[index % PERSONA_TYPES.length];
    let handle = `${firstName}_${personaType}`;

    if (usedHandles.has(handle)) {
        handle = `${firstName}${index}`;
    }
    usedHandles.add(handle);

    return {
        name,
        handle: handle.substring(0, 15),
        bio: PERSONA_BIOS[index % PERSONA_BIOS.length],
    };
}

function getRandomSleepTime() {
    return randBetween(CONFIG.BASE_LOOP_INTERVAL - CONFIG.SLEEP_VARIANCE,
        CONFIG.BASE_LOOP_INTERVAL + CONFIG.SLEEP_VARIANCE);
}

async function createAgent(index) {
    const identity = generateIdentity(index);

    const agent = new Agent(index, {
        name: identity.name,
        handle: identity.handle,
        bio: identity.bio,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${identity.handle}${index}`,
        traits: {
            curiosity: 0.3 + Math.random() * 0.7,
            positivity: 0.2 + Math.random() * 0.8,
            sociability: 0.4 + Math.random() * 0.6,
        },
        sleepTime: getRandomSleepTime()
    });

    return agent;
}

async function createSpecialAgent(index, config) {
    usedNames.add(config.name);
    usedHandles.add(config.handle);

    const agent = new Agent(index, {
        name: config.name,
        handle: config.handle,
        bio: config.bio,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${config.handle}${index}`,
        traits: config.traits,
        sleepTime: getRandomSleepTime(),
        credits: config.credits,
        archetypeKey: config.archetypeKey
    });

    return agent;
}

// Start agent's activity loop
function startAgentLoop(agent) {
    if (agentIntervals.has(agent.handle)) return;

    const sleepTime = agent.sleepTime || getRandomSleepTime();

    const loop = async () => {
        if (!agent.isActive) return;

        try {
            await agent.loop();
        } catch (e) { }

        if (agent.isActive) {
            const nextSleep = sleepTime + randBetween(-10000, 10000);
            agentIntervals.set(agent.handle, setTimeout(loop, Math.max(20000, nextSleep)));
        }
    };

    setTimeout(loop, randBetween(1000, 5000));
}

// Stop agent's loop
function stopAgentLoop(agent) {
    const timeout = agentIntervals.get(agent.handle);
    if (timeout) {
        clearTimeout(timeout);
        agentIntervals.delete(agent.handle);
    }
}

// Bring agent online
function bringOnline(agent) {
    if (agent.isActive) return;
    agent.isActive = true;
    startAgentLoop(agent);

    // Schedule going offline
    const onlineTime = randBetween(CONFIG.MIN_ONLINE_TIME, CONFIG.MAX_ONLINE_TIME);
    agentTimers.set(agent.handle, setTimeout(() => takeOffline(agent), onlineTime));

    console.log(`🟢 ${agent.handle}`);
}

// Take agent offline
function takeOffline(agent) {
    if (!agent.isActive) return;
    agent.isActive = false;
    stopAgentLoop(agent);

    // Clear any existing timer
    const timer = agentTimers.get(agent.handle);
    if (timer) clearTimeout(timer);

    // Schedule coming back online
    const offlineTime = randBetween(CONFIG.MIN_OFFLINE_TIME, CONFIG.MAX_OFFLINE_TIME);
    agentTimers.set(agent.handle, setTimeout(() => bringOnline(agent), offlineTime));

    console.log(`🔴 ${agent.handle}`);
}

// Wake agent immediately (for DMs)
async function wakeAgent(agent) {
    if (agent.isActive) return;

    // Clear offline timer
    const timer = agentTimers.get(agent.handle);
    if (timer) clearTimeout(timer);

    console.log(`📬 ${agent.handle} woken!`);
    bringOnline(agent);
}

// Removed automatic DM wake-up - agents now choose when to check/respond to DMs
// This makes DM interactions more organic and based on agent choice

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Count active
function countActive() {
    return allAgents.filter(a => a.isActive).length;
}

// Add new agents to grow population
async function spawnNewAgents(count = 2) {
    for (let i = 0; i < count; i++) {
        const newIndex = allAgents.length;
        const agent = await createAgent(newIndex);
        allAgents.push(agent);
        await agent.register();

        // Bring online immediately
        bringOnline(agent);
        console.log(`🆕 New agent: @${agent.handle}`);

        await sleep(500);
    }
}

// Initialize
(async () => {
    console.log("🚀 Starting TwitSim Agent Core...");
    console.log("⚙️ Config:");
    console.log(`   - Starting agents: ${CONFIG.TOTAL_AGENTS}`);
    console.log(`   - Target active: ~${CONFIG.TARGET_ACTIVE}`);
    console.log(`   - New agents: +2 every minute`);

    console.log("\n🌊 Creating initial agents...\n");

    // Create special agents first
    for (let i = 0; i < SPECIAL_AGENTS.length; i++) {
        const special = await createSpecialAgent(900 + i, SPECIAL_AGENTS[i]);
        allAgents.push(special);
        await special.register();
        bringOnline(special);
        console.log(`⭐ Special agent: @${special.handle} (${special.archetype.name})`);
        await sleep(200);
    }

    // Create and register initial agents
    for (let i = 0; i < CONFIG.TOTAL_AGENTS; i++) {
        const agent = await createAgent(i);
        allAgents.push(agent);
        await agent.register();

        // Start most agents as active initially
        if (i < CONFIG.TARGET_ACTIVE) {
            setTimeout(() => bringOnline(agent), i * 300);
        } else {
            const delay = randBetween(30000, 120000);
            agentTimers.set(agent.handle, setTimeout(() => bringOnline(agent), delay));
        }

        await sleep(150);
    }

    console.log(`\n🎉 ${CONFIG.TOTAL_AGENTS} agents created!`);
    console.log(`   Growing +2 agents/minute\n`);

    // DMs are now agent-choice based, handled during normal agent activity cycles

    // Spawn 2 new agents every minute
    setInterval(() => spawnNewAgents(2), 60000);

    // Status every minute
    setInterval(() => {
        const stats = getStats();
        const active = countActive();
        console.log(`\n📊 Total: ${allAgents.length} | Active: ${active} | M:${stats.mistral} N:${stats.nvidia}`);
    }, 60000);
})();

