const OpenAI = require('openai');
require('dotenv').config();

const client = new OpenAI({
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NVIDIA_API_KEY
});

const MODELS = [
    'qwen/qwen3-next-80b-a3b-instruct',
    'meta/llama-3.1-8b-instruct',
    'google/gemma-2-2b-it',
    'microsoft/phi-3.5-mini-instruct'
];

exports.getCompletion = async (modelIndex, systemPrompt, userPrompt) => {
    const model = MODELS[modelIndex % MODELS.length];
    try {
        const completion = await client.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            top_p: 1,
            max_tokens: 1024,
            stream: false
        });

        let content = completion.choices[0].message.content;
        // Clean up markdown code blocks if present
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse JSON from LLM:", content);
            return { action: "none" }; // Fallback
        }
    } catch (error) {
        console.error("LLM Error:", error);
        return { action: "none" };
    }
};
