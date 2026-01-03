export const GEMINI_CONFIG = {
    MODEL: process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-1.5-flash",
    BASE_URL: process.env.NEXT_PUBLIC_GEMINI_ENDPOINT || "https://generativelanguage.googleapis.com/v1beta/models",
    TEMPERATURE: 0.2,
    MAX_OUTPUT_TOKENS: 500,
    SUMMARIZATION_MAX_TOKENS: 150,
};
