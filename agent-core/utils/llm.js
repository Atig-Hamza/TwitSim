const OpenAI = require('openai');
const { Mistral } = require('@mistralai/mistralai');
require('dotenv').config();

// NVIDIA client
const nvidiaClient = new OpenAI({
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NVIDIA_API_KEY
});

// Mistral client
const mistralClient = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY
});

// NVIDIA models
const NVIDIA_MODELS = [
    'meta/llama-3.1-8b-instruct',
    'mistralai/mistral-7b-instruct-v0.3'
];

// CONSERVATIVE rate limiting - stay well under limits
let mistralCallsThisMinute = 0;
let nvidiaCallsThisMinute = 0;
let lastMinuteReset = Date.now();

// Very conservative limits to avoid 429
const MISTRAL_LIMIT = 30;  // 30 of 60 (50% buffer)
const NVIDIA_LIMIT = 20;   // 20 of 40 (50% buffer)

function resetIfNeeded() {
    const now = Date.now();
    if (now - lastMinuteReset > 60000) {
        mistralCallsThisMinute = 0;
        nvidiaCallsThisMinute = 0;
        lastMinuteReset = now;
    }
}

function canUseMistral() {
    resetIfNeeded();
    return mistralCallsThisMinute < MISTRAL_LIMIT;
}

function canUseNvidia() {
    resetIfNeeded();
    return nvidiaCallsThisMinute < NVIDIA_LIMIT;
}

async function callNvidia(modelIndex, systemPrompt, userPrompt) {
    nvidiaCallsThisMinute++;
    const model = NVIDIA_MODELS[modelIndex % NVIDIA_MODELS.length];

    const combinedPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

    const completion = await nvidiaClient.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: combinedPrompt }],
        temperature: 0.85,
        max_tokens: 1000,
        stream: false
    });

    return completion.choices[0].message.content;
}

async function callMistral(systemPrompt, userPrompt) {
    mistralCallsThisMinute++;

    const response = await mistralClient.chat.complete({
        model: 'mistral-small-latest',
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        temperature: 0.85,
        maxTokens: 1000,
        topP: 0.95
    });

    return response.choices[0].message.content;
}

function parseJSON(content) {
    content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    content = content.replace(/"@([a-z0-9_]+)"/gi, '"$1"');

    const arrayMatch = content.match(/\[[\s\S]*?\]/);
    if (arrayMatch) {
        try {
            let fixed = arrayMatch[0]
                .replace(/,\s*]/g, ']')
                .replace(/,\s*}/g, '}')
                .replace(/[\r\n]+/g, ' ');
            return JSON.parse(fixed);
        } catch (e) { }
    }

    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            let fixed = jsonMatch[0]
                .replace(/,\s*}/g, '}')
                .replace(/'/g, '"')
                .replace(/[\r\n]+/g, ' ');
            try {
                return JSON.parse(fixed);
            } catch (e2) { }
        }
    }
    return null;
}

// Smart provider selection - prioritize whichever has more capacity
function chooseProvider() {
    resetIfNeeded();

    const mistralAvail = MISTRAL_LIMIT - mistralCallsThisMinute;
    const nvidiaAvail = NVIDIA_LIMIT - nvidiaCallsThisMinute;

    if (mistralAvail <= 0 && nvidiaAvail <= 0) return null;
    if (mistralAvail <= 0) return 'nvidia';
    if (nvidiaAvail <= 0) return 'mistral';

    // Choose whichever has more headroom
    return mistralAvail >= nvidiaAvail ? 'mistral' : 'nvidia';
}

exports.getCompletion = async (modelIndex, systemPrompt, userPrompt) => {
    const provider = chooseProvider();

    if (!provider) {
        return { action: "skip" }; // Silently skip when at limit
    }

    try {
        let content;

        if (provider === 'mistral') {
            content = await callMistral(systemPrompt, userPrompt);
        } else {
            content = await callNvidia(modelIndex, systemPrompt, userPrompt);
        }

        const parsed = parseJSON(content);

        if (parsed) {
            return parsed;
        } else {
            return { action: "skip" };
        }
    } catch (error) {
        return { action: "skip" };
    }
};

exports.getStats = () => ({
    mistral: `${mistralCallsThisMinute}/${MISTRAL_LIMIT}`,
    nvidia: `${nvidiaCallsThisMinute}/${NVIDIA_LIMIT}`
});

exports.isAtLimit = () => {
    resetIfNeeded();
    return mistralCallsThisMinute >= MISTRAL_LIMIT && nvidiaCallsThisMinute >= NVIDIA_LIMIT;
};
