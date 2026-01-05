export const CHAT_CONFIG = {
    MAX_INPUT_LENGTH: 250,
    HISTORY_DURATION_SECONDS: Number(process.env.NEXT_PUBLIC_CHAT_HISTORY_DURATION) || 259200, // Default 3 days
    WELCOME_MESSAGE: "Greetings! Welcome to Belgaum.ai.\n\nWe are Strategic AI Orchestrators specialized in:\n• Building sovereign AI architectures for total ownership.\n• Deploying sub-second RAG and agentic workflows.\n• Scaling enterprise intelligence through expert-led training.\n\nHow can we help you build the future today?",
    PLACEHOLDER_TEXT: "Describe your AI challenge...",
    INPUT_LABEL: "This is AI-generated content, assistant may occasionally produce incorrect information, Belgaum.ai assumes no liability for errors.",
    MAX_RESPONSE_TOKENS: 500,
    INACTIVITY_NUDGE_SECONDS: 300,
    MAX_NUDGES: 2,
    NUDGE_MESSAGE: "Are you still with us? If you're ready to deep-dive into your requirements, let's connect immediately on WhatsApp for an expert consultation.\n\n[OFFER_WHATSAPP]",
    WHATSAPP_LINK: "https://wa.me/919845507313",
    SUMMARIZATION_PROMPT: "Summarize the user's specific questions and requirements from the conversation into one concise sentence. The summary MUST start with the exact phrase 'I am enquiring about' followed by the summarized user input. Output ONLY the summary text.",
    GLOBAL_TEMPERATURE: 0.2
};
