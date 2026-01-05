"use client";

import { useState, useEffect, useRef } from "react";
import { saveMessage, getMessages, clearOldMessages, ChatMessage } from "@/lib/db";
import { CHAT_CONFIG } from "@/lib/chat-config";
import { OPENAI_CONFIG } from "@/lib/openai-config";
import { GEMINI_CONFIG } from "@/lib/gemini-config";
import { SYSTEM_PROMPT } from "@/data/prompts";
import { auditChatInteraction } from "@/lib/db-actions";
import { Fingerprint, MessageCircle, Minimize2, Send, X, User, Cpu, Download } from "lucide-react";

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [lastUserMessageTime, setLastUserMessageTime] = useState(Date.now());
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [nudgeCount, setNudgeCount] = useState(0);
    const [sessionId, setSessionId] = useState("");
    const [lastUserRequest, setLastUserRequest] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const nudgeTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    // Inactivity Nudge Logic
    useEffect(() => {
        if (!isOpen || isTyping || messages.length < 6) return; // Wait for at least 3 exchanges

        if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);

        nudgeTimerRef.current = setTimeout(async () => {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
                if (nudgeCount >= CHAT_CONFIG.MAX_NUDGES - 1) {
                    // Final nudge / Disconnect
                    const disconnectMsg: ChatMessage = {
                        role: 'assistant',
                        content: "I've been waiting for a while. To protect your data, I'm clearing this conversation and closing the session. Please reach out when you're ready to build!",
                        timestamp: Date.now()
                    };
                    setMessages([disconnectMsg]);
                    await saveMessage(disconnectMsg);

                    setTimeout(async () => {
                        const db = await import('@/lib/db');
                        const database = await db.initDB();
                        await database.clear('messages');
                        setMessages([]);
                        setIsOpen(false);
                        setNudgeCount(0);
                    }, 3000);
                } else {
                    const nudgeMsg: ChatMessage = {
                        role: 'assistant',
                        content: CHAT_CONFIG.NUDGE_MESSAGE,
                        timestamp: Date.now()
                    };
                    setMessages(prev => [...prev, nudgeMsg]);
                    setNudgeCount(prev => prev + 1);
                    await saveMessage(nudgeMsg);
                }
            }
        }, CHAT_CONFIG.INACTIVITY_NUDGE_SECONDS * 1000);

        return () => {
            if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
        };
    }, [messages, isOpen, isTyping, nudgeCount]);

    // Load chat on mount
    useEffect(() => {
        if (isOpen) {
            loadChat();
            // Get or create session ID
            let sid = sessionStorage.getItem("belgaum_ai_sid");
            if (!sid) {
                sid = `sid_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
                sessionStorage.setItem("belgaum_ai_sid", sid);
            }
            setSessionId(sid);
        }
    }, [isOpen]);


    const loadChat = async () => {
        // Clear messages older than defined threshold
        await clearOldMessages(CHAT_CONFIG.HISTORY_DURATION_SECONDS);
        const history = await getMessages();

        if (history.length === 0) {
            const welcome: ChatMessage = {
                role: "assistant",
                content: CHAT_CONFIG.WELCOME_MESSAGE,
                timestamp: Date.now(),
            };
            await saveMessage(welcome);
            // Audit the Initial Welcome (no user query yet)
            setMessages([welcome]);
        } else {
            setMessages(history);
        }
    };

    // Auto Scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping || input.length > CHAT_CONFIG.MAX_INPUT_LENGTH) return;

        const userQuery = input;
        const userMessage: ChatMessage = {
            role: "user",
            content: userQuery,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLastUserMessageTime(Date.now());
        setNudgeCount(0);
        setLastUserRequest(userQuery); // Store for auditing with response
        await saveMessage(userMessage);

        setIsTyping(true);

        try {
            await fetchAssistantStreamingResponse(userQuery, [...messages, userMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            setIsTyping(false);
        }
    };

    const fetchAssistantStreamingResponse = async (userQuery: string, fullHistory: ChatMessage[]) => {
        const provider = process.env.NEXT_PUBLIC_LLM_PROVIDER || "gemini";
        const systemPrompt = SYSTEM_PROMPT;
        let fullContent = "";

        const updateStreamingContent = (chunk: string) => {
            if (!chunk) return;
            setIsTyping(false);
            fullContent += chunk;

            setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                    newMessages[newMessages.length - 1] = {
                        ...lastMsg,
                        content: fullContent
                    };
                } else {
                    newMessages.push({
                        role: 'assistant',
                        content: fullContent,
                        timestamp: Date.now(),
                    });
                }
                return newMessages;
            });
        };

        if (provider === "openai") {
            const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
            const model = process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini";
            const endpoint = process.env.NEXT_PUBLIC_OPENAI_ENDPOINT || "https://api.openai.com/v1/chat/completions";

            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: OPENAI_CONFIG.MODEL,
                        stream: OPENAI_CONFIG.STREAM,
                        temperature: OPENAI_CONFIG.TEMPERATURE,
                        max_tokens: OPENAI_CONFIG.MAX_TOKENS,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            ...fullHistory.map(m => ({ role: m.role, content: m.content })),
                        ]
                    })
                });

                const reader = res.body?.getReader();
                const decoder = new TextDecoder();

                while (reader) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const rawChunk = decoder.decode(value);
                    const lines = rawChunk.split('\n');
                    for (const line of lines) {
                        if (line.trim().startsWith('data: ')) {
                            const dataStr = line.trim().substring(6);
                            if (dataStr === '[DONE]') break;
                            try {
                                const data = JSON.parse(dataStr);
                                const text = data.choices[0]?.delta?.content || "";
                                updateStreamingContent(text);
                            } catch (e) { }
                        }
                    }
                }
            } catch (err) {
                console.error("[OpenAI] API Error:", err);
                setIsTyping(false);
                updateStreamingContent("OpenAI Connection Error.");
            }
        } else {
            // Gemini Streaming Logic
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            const model = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-1.5-flash";
            const baseUrl = process.env.NEXT_PUBLIC_GEMINI_ENDPOINT || "https://generativelanguage.googleapis.com/v1beta/models";
            const endpoint = `${baseUrl}/${model}:streamGenerateContent?key=${apiKey}`;

            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [...fullHistory.map(m => ({
                            role: m.role === 'user' ? 'user' : 'model',
                            parts: [{ text: m.content }]
                        }))],
                        systemInstruction: { parts: [{ text: systemPrompt }] },
                        generationConfig: {
                            temperature: GEMINI_CONFIG.TEMPERATURE,
                            maxOutputTokens: GEMINI_CONFIG.MAX_OUTPUT_TOKENS
                        }
                    })
                });

                const reader = res.body?.getReader();
                const decoder = new TextDecoder();

                let buffer = "";
                while (reader) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    let startIdx = 0;
                    while ((startIdx = buffer.indexOf('{', 0)) !== -1) {
                        let bracketCount = 0;
                        let endIdx = -1;
                        for (let i = startIdx; i < buffer.length; i++) {
                            if (buffer[i] === '{') bracketCount++;
                            else if (buffer[i] === '}') {
                                bracketCount--;
                                if (bracketCount === 0) {
                                    endIdx = i;
                                    break;
                                }
                            }
                        }

                        if (endIdx !== -1) {
                            const objStr = buffer.substring(startIdx, endIdx + 1);
                            try {
                                const obj = JSON.parse(objStr);
                                const text = obj.candidates?.[0]?.content?.parts?.[0]?.text || "";
                                updateStreamingContent(text);
                            } catch (e) { }
                            buffer = buffer.substring(endIdx + 1);
                        } else {
                            break;
                        }
                    }
                }
            } catch (err) {
                console.error("[Gemini] API Error:", err);
                setIsTyping(false);
                updateStreamingContent("Gemini Connection Error.");
            }
        }

        if (fullContent) {
            const assistantMsg: ChatMessage = {
                role: 'assistant',
                content: fullContent,
                timestamp: Date.now(),
            };
            await saveMessage(assistantMsg);

            // Audit the Pair (Request + Response)
            auditChatInteraction(
                sessionStorage.getItem("belgaum_ai_sid") || "unidentified",
                userQuery,
                fullContent
            ).catch((err: any) => console.error("MySQL Audit Error:", err));
        }
        setIsTyping(false);
    };

    const fetchConversationSummary = async () => {
        const provider = process.env.NEXT_PUBLIC_LLM_PROVIDER || "gemini";
        // TOON (Token Optimized Output Notation) - Saving tokens with compact prefixes
        const convText = messages.map(m => `${m.role[0].toUpperCase()}:${m.content}`).join("\n");
        const prompt = `${CHAT_CONFIG.SUMMARIZATION_PROMPT}\n\nCONV:\n${convText}`;

        try {
            if (provider === "openai") {
                const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
                const endpoint = process.env.NEXT_PUBLIC_OPENAI_ENDPOINT || "https://api.openai.com/v1/chat/completions";
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({
                        model: OPENAI_CONFIG.MODEL,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.2,
                        max_tokens: 150
                    })
                });
                const data = await res.json();
                return data.choices[0]?.message?.content || "";
            } else {
                const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
                const model = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-1.5-flash";
                const endpoint = `${process.env.NEXT_PUBLIC_GEMINI_ENDPOINT || "https://generativelanguage.googleapis.com/v1beta/models"}/${model}:generateContent?key=${apiKey}`;
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.2, maxOutputTokens: 150 }
                    })
                });
                const data = await res.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            }
        } catch (e) {
            console.error("Summary error:", e);
            return "Hi Belgaum.ai, I am interested in your AI orchestration solutions.";
        }
    };

    const handleWhatsAppClick = async () => {
        setIsSummarizing(true);
        let summary = await fetchConversationSummary();
        setIsSummarizing(false);

        // Ensure the message always starts with the required phrase
        const prefix = "I am enquiring about ";
        if (!summary.toLowerCase().startsWith("i am enquiring about")) {
            summary = prefix + summary;
        }

        const encodedMsg = encodeURIComponent(summary.trim());

        // Deep linking for mobile, Web for desktop
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Extract phone number from config (removing non-digits)
        const phoneNumber = CHAT_CONFIG.WHATSAPP_LINK.replace(/\D/g, '');

        if (isMobile) {
            window.location.href = `https://wa.me/${phoneNumber}?text=${encodedMsg}`;
        } else {
            window.open(`https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMsg}`, "_blank");
        }
    };

    const formatMessageTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleString([], {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const handleDownloadChat = () => {
        const chatText = messages.map(m => {
            const time = formatMessageTime(m.timestamp);
            const role = m.role === 'user' ? 'User' : 'Assistant';
            return `[${time}] ${role}:\n${m.content}\n${'-'.repeat(40)}\n`;
        }).join('\n');

        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `belgaum_ai_chat_${sessionId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className={`chat-overlay ${isOpen ? "open" : ""}`} onClick={() => setIsOpen(false)} />
            <div className="chatbot-widget">
                <div className={`chat-window ${isOpen ? "open" : ""}`}>
                    <div className="chat-header" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                        <div className="chat-header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div className="chat-header-info">
                                <span className="chat-header-title">Belgaum.ai Support</span>
                                <div className="chat-header-session" style={{ fontSize: '9px', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '-2px' }}>
                                    <Fingerprint size={9} /> {sessionId}
                                </div>
                            </div>
                            <div className="chat-controls">
                                <button className="chat-control-btn" onClick={handleDownloadChat} aria-label="Download Chat" title="Download History">
                                    <Download size={18} />
                                </button>
                                <button className="chat-control-btn close-btn" onClick={() => setIsOpen(false)} aria-label="Close Chat" title="Close">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="chat-header-warning" style={{ fontSize: '0.6rem', opacity: 0.7, marginTop: '8px', lineHeight: '1.2', textAlign: 'center', width: '100%' }}>
                            {CHAT_CONFIG.INPUT_LABEL}
                        </div>
                    </div>

                    <div className="chat-messages">
                        {messages.map((m, i) => {
                            const hasWhatsApp = m.role === 'assistant' && m.content.includes("[OFFER_WHATSAPP]");
                            const cleanContent = m.content.replace("[OFFER_WHATSAPP]", "").trim();

                            return (
                                <div key={i} className={`message ${m.role}`}>
                                    <div className="message-icon">
                                        {m.role === 'assistant' ? <Cpu size={18} /> : <User size={18} />}
                                    </div>
                                    <div className="message-content-wrapper">
                                        <div className="message-text">{cleanContent}</div>
                                        {hasWhatsApp && (
                                            <button
                                                className="whatsapp-button"
                                                onClick={handleWhatsAppClick}
                                                disabled={isSummarizing}
                                                title="Connect on WhatsApp"
                                            >
                                                {isSummarizing ? (
                                                    <div className="loader-mini" />
                                                ) : (
                                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                    </svg>
                                                )}
                                                <span>{isSummarizing ? "Analyzing History..." : "Tap to WhatsApp Connect"}</span>
                                            </button>
                                        )}
                                        <div className="message-time">
                                            {formatMessageTime(m.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {isTyping && (
                            <div className="message assistant thinking-dots">
                                <div className="message-icon"><Cpu size={18} /></div>
                                <div className="message-text">Thinking<span>.</span><span>.</span><span>.</span></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="chat-anchor" />
                    </div>

                    <div className="chat-input-area">
                        <form
                            className="chat-input-row"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                        >
                            <div className="material-input-container">
                                <input
                                    type="text"
                                    className="material-input-field"
                                    placeholder={CHAT_CONFIG.PLACEHOLDER_TEXT}
                                    value={input}
                                    maxLength={CHAT_CONFIG.MAX_INPUT_LENGTH}
                                    onChange={(e) => setInput(e.target.value)}
                                    enterKeyHint="send"
                                />
                                <button
                                    type="submit"
                                    className="combined-send-btn"
                                    disabled={!input.trim() || isTyping || input.length > CHAT_CONFIG.MAX_INPUT_LENGTH}
                                    aria-label="Send Message"
                                    title={input.length >= CHAT_CONFIG.MAX_INPUT_LENGTH ? "Message limit reached" : "Send Message"}
                                >
                                    <Send size={18} />
                                </button>
                                <fieldset className="material-input-border">
                                    <legend className="material-input-legend">
                                        <span className="count-text">{CHAT_CONFIG.MAX_INPUT_LENGTH - input.length}</span>
                                    </legend>
                                </fieldset>
                            </div>
                        </form>
                    </div>
                </div>

                {!isOpen && (
                    <button className="chat-button" onClick={() => setIsOpen(true)} aria-label="Open Chat" title="Open Chat">
                        <MessageCircle size={30} />
                    </button>
                )}
            </div>
        </>
    );
}
