"use client";

import { useState, useEffect } from "react";
import {
  Cpu,
  GraduationCap,
  Terminal,
  Users,
  Brain,
  Mic,
  Search,
  Activity,
  GitBranch,
  Database,
  Zap,
  ShieldCheck,
  Bot,
  Target,
  Command,
  Workflow,
  Lock,
  TrendingUp,
  Mail,
  Phone
} from "lucide-react";
import Background from "@/components/Background";
import Chatbot from "@/components/Chatbot";

export default function Home() {
  const [typingText, setTypingText] = useState("Orchestration");

  // Typing Effect
  useEffect(() => {
    const phrases = ["Orchestration", "Development", "Training", "EduTech"];
    let pIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timeout: NodeJS.Timeout;

    const type = () => {
      const current = phrases[pIdx];
      if (isDeleting) {
        setTypingText(current.substring(0, charIdx - 1));
        charIdx--;
      } else {
        setTypingText(current.substring(0, charIdx + 1));
        charIdx++;
      }

      let speed = isDeleting ? 50 : 150;
      if (!isDeleting && charIdx === current.length) {
        speed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        pIdx = (pIdx + 1) % phrases.length;
        speed = 500;
      }
      timeout = setTimeout(type, speed);
    };

    timeout = setTimeout(type, 1000);
    return () => clearTimeout(timeout);
  }, []);

  // Scroll Reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main>
      <Background />
      <Chatbot />

      <header>
        <a href="#" className="logo">
          <Cpu className="logo-icon" />
          <span className="brand">Belgaum</span><span className="suffix">.ai</span>
        </a>
      </header>

      <section className="hero">
        <div className="coming-soon-badge">
          <span className="badge-dot"></span>
          Launching Early 2026
        </div>
        <h1>
          Enterprise AI <br />
          <span className="gradient-text">{typingText}</span>
        </h1>
        <p className="hero-mission-text reveal">
          We are building a world-class AI ecosystem in Belgaum. From Gen AI & RAG systems to Agentic workflows, the future of intelligence starts here.
        </p>
      </section>

      {/* Core Pillars Grid */}
      <section id="services" className="services-section">
        <div className="container">
          <div className="section-title reveal">
            <h2>Core <span className="gradient-text">Pillars</span></h2>
          </div>

          <div className="services-grid">
            <a href="#edutech" className="service-card card-edu reveal">
              <div className="service-card-inner">
                <div className="icon-box"><GraduationCap /></div>
                <h3>AI Education</h3>
                <p>Modern GenAI frameworks and Institutional RAG systems designed for high-performance academic
                  results.</p>
              </div>
            </a>

            <a href="#development" className="service-card card-dev reveal">
              <div className="service-card-inner">
                <div className="icon-box"><Terminal /></div>
                <h3>AI Development</h3>
                <p>Custom LLM fine-tuning, Agentic workflows, and bespoke architectures for complex business logic.
                </p>
              </div>
            </a>

            <a href="#corporate" className="service-card card-corp reveal">
              <div className="service-card-inner">
                <div className="icon-box"><Users /></div>
                <h3>Corporate Training</h3>
                <p>High-impact workshops on prompt engineering, AI strategy, and leadership-ready orchestration.</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Detailed Section: AI Education */}
      <section id="edutech" className="detail-section">
        <div className="container detail-content">
          <div className="detail-text reveal">
            <h3>AI <span className="gradient-text">Education</span></h3>
            <p>Belgaum.ai is bridging the academic gap with GenAI-native ecosystems. We deploy Retrieval-Augmented
              Generation (RAG) for institutional knowledge and LLM-powered socratic tutors.</p>
            <ul className="feature-list">
              <li><Cpu size={18} /> Institutional GenAI Knowledge Bases</li>
              <li><Mic size={18} /> LLM-Powered Socratic Tutors</li>
              <li><Search size={18} /> Semantic Search for Academic Papers</li>
              <li><Activity size={18} /> RAG-Driven Research Assistance</li>
            </ul>
          </div>
          <div className="reveal">
            <div className="enhanced-card">
              <h4><Brain /> Personalized Learning</h4>
              <ul>
                <li>RAG systems trained on proprietary university curriculum for instant, accurate student
                  support.</li>
                <li>Automated synthetic data generation to create bespoke mock examinations and practice drills.
                </li>
                <li>Multimodal GenAI avatars that adapt to visual, auditory, or text-heavy learning styles.</li>
                <li>Real-time LLM-driven citation and plagiarism cross-referencing for academic integrity.</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="container reveal">
          <div className="tech-stack-preview">
            <span className="tech-tag"><Brain size={14} /> OpenAI o1</span>
            <span className="tech-tag"><Bot size={14} /> Claude 3.5</span>
            <span className="tech-tag"><Cpu size={14} /> Spring AI</span>
            <span className="tech-tag"><Database size={14} /> LlamaIndex</span>
            <span className="tech-tag"><Search size={14} /> NotebookLM</span>
          </div>
        </div>
      </section>

      {/* Detailed Section: AI Development */}
      <section id="development" className="detail-section develoment-section">
        <div className="container detail-content rtl-container">
          <div className="detail-text reveal ltr-text">
            <h3>AI <span className="gradient-text">Development</span></h3>
            <p>We build production-grade agentic systems that operate beyond simple chat interfaces. Our systems
              plan, self-correct, and execute complex industrial workflows autonomously.</p>
            <ul className="feature-list">
              <li><GitBranch size={18} /> Multi-Agent Orchestration (LangGraph)</li>
              <li><Database size={18} /> Advanced RAG with Vector Memory</li>
              <li><Zap size={18} /> Sub-second Inference Optimization</li>
              <li><ShieldCheck size={18} /> Sovereign AI Guardrails</li>
            </ul>
          </div>
          <div className="reveal ltr-text">
            <div className="enhanced-card purple-border">
              <h4><Bot /> Agentic Workflows</h4>
              <ul>
                <li>Autonomous agents designed for goal-oriented task execution without constant human
                  prompting.</li>
                <li>Self-healing execution loops that verify AI outputs against industrial ground truth.</li>
                <li>Multi-step stateful orchestration allowing agents to handle complex operations over long
                  periods.</li>
                <li>Deep integration with legacy CRMs and ERPs through custom-built API connectors.</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="container reveal">
          <div className="tech-stack-preview">
            <span className="tech-tag"><GitBranch size={14} /> LangGraph</span>
            <span className="tech-tag"><Users size={14} /> CrewAI</span>
            <span className="tech-tag"><Mic size={14} /> ElevenLabs</span>
            <span className="tech-tag"><Database size={14} /> Pinecone</span>
            <span className="tech-tag"><Zap size={14} /> FastAPI</span>
          </div>
        </div>
      </section>

      {/* Detailed Section: Corporate Training */}
      <section id="corporate" className="detail-section">
        <div className="container detail-content">
          <div className="detail-text reveal">
            <h3>Corporate <span className="gradient-text">Training</span></h3>
            <p>The workforce is changing. We transform legacy teams into AI-native powerhouses, focusing on
              high-level orchestration skills that can't be automated.</p>
            <ul className="feature-list">
              <li><Target size={18} /> ROI-Driven AI Implementation Labs</li>
              <li><Command size={18} /> Professional Prompt Engineering</li>
              <li><Workflow size={18} /> AI-Augmented Operations Design</li>
              <li><Lock size={18} /> AI Policy & Governance Frameworks</li>
            </ul>
          </div>
          <div className="reveal">
            <div className="enhanced-card emerald-border">
              <h4><TrendingUp /> Upskilling Leaders</h4>
              <ul>
                <li>Empowering executive leadership with AI-driven scenario modeling for better risk management.
                </li>
                <li>Training managers to integrate LLMs into daily administrative and strategic decision
                  workflows.</li>
                <li>Establishing comprehensive AI Governance to handle privacy, ethics, and security in
                  deployment.</li>
                <li>Driving an \"AI-First\" organizational culture through hands-on experimentation labs.</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="container reveal">
          <div className="tech-stack-preview">
            <span className="tech-tag"><Terminal size={14} /> Python / Node.js</span>
            <span className="tech-tag"><Workflow size={14} /> Docker & K8s</span>
            <span className="tech-tag"><Activity size={14} /> Vector Embeddings</span>
            <span className="tech-tag"><Search size={14} /> Perplexity</span>
            <span className="tech-tag"><Lock size={14} /> Glean</span>
          </div>
        </div>
      </section>

      {/* Master Tools Section */}
      <section id="tools" className="detail-section tools-section">
        <div className="container">
          <div className="section-title reveal">
            <h2>The AI <span className="gradient-text">Orchestration Stack</span></h2>
            <p>Our comprehensive toolset for building and deploying future-ready intelligence.</p>
          </div>

          <div className="tools-master-grid">
            <div className="tools-explainer reveal">
              <h5>Tools Used In: GenAI Learning Ecosystem</h5>
              <div className="tools-grid-explained">
                <div className="tool-box-info">
                  <strong>OpenAI o1 / Claude 3.5</strong>
                  <p>State-of-the-art reasoning models used for complex academic problem solving and deep logic analysis.</p>
                </div>
                <div className="tool-box-info">
                  <strong>Spring AI (Java Ecosystem)</strong>
                  <p>Enterprise-grade AI integration for the Java development stack.</p>
                </div>
                <div className="tool-box-info">
                  <strong>LlamaIndex (RAG Framework)</strong>
                  <p>The core engine for indexing institutional libraries into queryable vector knowledge bases.</p>
                </div>
                <div className="tool-box-info">
                  <strong>NotebookLM</strong>
                  <p>Google's grounded research tool for cross-referencing sources with zero hallucination.</p>
                </div>
              </div>
            </div>

            <div className="tools-explainer reveal">
              <h5>Tools Used In: Agentic Orchestration Stack</h5>
              <div className="tools-grid-explained">
                <div className="tool-box-info">
                  <strong>LangGraph & CrewAI</strong>
                  <p>Frameworks for building multi-agent swarms that collaborate on complex tasks.</p>
                </div>
                <div className="tool-box-info">
                  <strong>Voice Bots (Whisper/ElevenLabs)</strong>
                  <p>High-fidelity speech-to-text and voice synthesis for interaction portals.</p>
                </div>
                <div className="tool-box-info">
                  <strong>Pinecone / ChromaDB</strong>
                  <p>Vector databases essential for retrieval and long-term agentic memory.</p>
                </div>
                <div className="tool-box-info">
                  <strong>Next.js & FastAPI</strong>
                  <p>Modern web stack for ultra-low latency knowledge portals.</p>
                </div>
              </div>
            </div>

            <div className="tools-explainer reveal">
              <h5>Tools Used In: Enterprise AI Suite</h5>
              <div className="tools-grid-explained">
                <div className="tool-box-info">
                  <strong>Python / Java / Node.js</strong>
                  <p>Core languages for building scalable backends for proprietary AI.</p>
                </div>
                <div className="tool-box-info">
                  <strong>Docker & Kubernetes</strong>
                  <p>Containerization stack for deploying AI models reliably across clouds.</p>
                </div>
                <div className="tool-box-info">
                  <strong>Vector Embeddings</strong>
                  <p>Models used to transform enterprise data into mathematical vectors.</p>
                </div>
                <div className="tool-box-info">
                  <strong>Perplexity / Glean</strong>
                  <p>Enterprise search tools for discovering proprietary information via natural language.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="logo logo-footer">
                <Cpu className="logo-icon" />
                <span className="brand">Belgaum</span><span className="suffix">.ai</span>
              </div>
              <p className="footer-desc">
                The premier AI startup of Belgaum, India. Bridging the gap between legacy processes and
                autonomous intelligence.
              </p>
            </div>

            <div className="footer-col">
              <h4>Core Pillars</h4>
              <ul className="footer-links">
                <li><a href="#edutech">AI Education</a></li>
                <li><a href="#development">AI Development</a></li>
                <li><a href="#corporate">Corporate Training</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Global Contact</h4>
              <a href="mailto:ask@belgaum.ai" className="contact-link">
                <Mail /> ask@belgaum.ai
              </a>
              <a href="tel:+919845507313" className="contact-link">
                <Phone /> +91 98455 07313 (IN)
              </a>
              <a href="tel:+6586024972" className="contact-link">
                <Phone /> +65 8602 4972 (SG)
              </a>
            </div>

            <div className="footer-col">
              <h4>Locale</h4>
              <p className="footer-locale">
                Belgaum, Karnataka - India<br />
                Sovereign AI Development Hub
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            &copy; 2026 BELGAUM.AI. SYSTEM DEPLOYMENT IN PROGRESS.
          </div>
        </div>
      </footer>
    </main>
  );
}
