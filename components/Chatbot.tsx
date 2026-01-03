"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Minimize2, Send, X, Clock, User, Cpu } from "lucide-react";
import { saveMessage, getMessages, clearOldMessages, ChatMessage } from "@/lib/db";
import { KNOWLEDGE_BASE } from "@/data/knowledge-base";

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [currentTime, setCurrentTime] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Update Clock
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    // Load chat on mount and check memory on open
    useEffect(() => {
        loadChat();
    }, [isOpen]);

    const loadChat = async () => {
        // Clear messages older than 5 minutes
        await clearOldMessages(5);
        const history = await getMessages();

        if (history.length === 0) {
            const welcome: ChatMessage = {
                role: "assistant",
                content: "Welcome to Belgaum.ai! We are here to orchestrate your AI journey. How can we help you build the future today?",
                timestamp: Date.now(),
            };
            await saveMessage(welcome);
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
        if (!input.trim() || isTyping || input.length > 250) return;

        const userQuery = input;
        const userMessage: ChatMessage = {
            role: "user",
            content: userQuery,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
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
        const systemPrompt = `
      ${KNOWLEDGE_BASE}
      
      Additional Instructions:
      - Strictly follow the guardrails in the knowledge base.
      - Use conversational history for context.
      - Answer ONLY from the knowledge base.
      - Output ONLY plain text paragraphs. No markdown bolding, hashtags, or asterisks.
      - LIMIT: Keep responses concise, ideally under 500 characters.
    `;

        const updateStreamingContent = (chunk: string) => {
            if (!chunk) return;
            setIsTyping(false);
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                    lastMsg.content += chunk;
                } else {
                    newMessages.push({
                        role: 'assistant',
                        content: chunk,
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
                        model: model,
                        stream: true,
                        temperature: 0.7,
                        max_tokens: 200,
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
                        generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
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
                setIsTyping(false);
                updateStreamingContent("Gemini Connection Error.");
            }
        }

        setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') saveMessage(lastMsg);
            return prev;
        });
        setIsTyping(false);
    };

    return (
        <>
            <div className={`chat-overlay ${isOpen ? "open" : ""}`} onClick={() => setIsOpen(false)} />
            <div className="chatbot-widget">
                <div className={`chat-window ${isOpen ? "open" : ""}`}>
                    <div className="chat-header">
                        <div className="chat-header-info">
                            <span className="chat-header-title">Belgaum.ai Support</span>
                            <span className="chat-header-clock"><Clock size={10} /> {currentTime}</span>
                        </div>
                        <div className="chat-controls">
                            <button className="chat-control-btn" onClick={() => setIsOpen(false)} aria-label="Minimize" title="Minimize">
                                <Minimize2 size={18} />
                            </button>
                            <button className="chat-control-btn close-btn" onClick={() => setIsOpen(false)} aria-label="Close" title="Close">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {messages.map((m, i) => (
                            <div key={i} className={`message ${m.role}`}>
                                <div className="message-icon">
                                    {m.role === 'assistant' ? <Cpu size={18} /> : <User size={18} />}
                                </div>
                                <div className="message-text">{m.content}</div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="message assistant thinking-dots">
                                <div className="message-icon"><Cpu size={18} /></div>
                                <div className="message-text">Thinking<span>.</span><span>.</span><span>.</span></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="chat-anchor" />
                    </div>

                    <div className="chat-input-area">
                        <div className="chat-input-row">
                            <input
                                type="text"
                                className="chat-input"
                                placeholder="Describe your AI challenge..."
                                value={input}
                                maxLength={250}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            />
                            <button
                                className="chat-send-btn"
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping || input.length > 250}
                                aria-label="Send Message"
                                title={input.length >= 250 ? "Message limit reached" : "Send Message"}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <div className="input-info">
                            <span className="input-label">Strategic AI Assistant</span>
                            <span
                                className="input-count"
                                style={{
                                    '--count-color': `rgb(${Math.min(255, (input.length / 250) * 255 * 2)}, ${Math.min(255, (1 - input.length / 250) * 255 * 2)}, 0)`,
                                    fontWeight: input.length > 230 ? 'bold' : 'normal'
                                } as React.CSSProperties}
                            >
                                ({input.length}/250)
                            </span>
                        </div>
                    </div>
                </div>

                <button className="chat-button" onClick={() => setIsOpen(!isOpen)} aria-label="Open Chat" title="Open Chat">
                    {isOpen ? <X size={30} /> : <MessageCircle size={30} />}
                </button>
            </div>
        </>
    );
}
