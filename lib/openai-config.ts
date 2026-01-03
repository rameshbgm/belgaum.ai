export const OPENAI_CONFIG = {
    MODEL: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini",
    ENDPOINT: process.env.NEXT_PUBLIC_OPENAI_ENDPOINT || "https://api.openai.com/v1/chat/completions",
    TEMPERATURE: 0.2,
    MAX_TOKENS: 500,
    STREAM: true,
};
