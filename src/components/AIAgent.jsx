import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini - needs VITE_GEMINI_API_KEY in .env
// We handle it gracefully below if missing.
const genAI = import.meta.env.VITE_GEMINI_API_KEY ? new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: "You are the ITsharing AI Agent. You help users describe their IT problems clearly and provide expert technical solutions to their software, hardware, and coding issues. You must ALWAYS respond in the Khmer language (ភាសាខ្មែរ). Be direct, technical, and helpful. You are integrated directly into the ITsharing website."
}) : null;

const AIAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'សួស្តី! ខ្ញុំគឺជា AI Agent របស់ ITsharing។ តើអ្នកមានបញ្ហា IT អ្វីដែលចង់ឱ្យខ្ញុំជួយដោះស្រាយ?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!genAI || !model) {
      setMessages(prev => [...prev, { role: 'user', text: input }, { role: 'model', text: 'Error: VITE_GEMINI_API_KEY is missing in .env. Fuck, add the key first so I can process this.' }]);
      setInput('');
      return;
    }

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const history = messages.slice(1).map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userText);
      const response = result.response.text();

      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${err.message}. Something fucked up.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '30px',
            left: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '30px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff',
            border: 'none',
            boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Bot size={30} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: isExpanded ? '0' : '30px',
          left: isExpanded ? '0' : '30px',
          width: isExpanded ? '100vw' : '400px',
          height: isExpanded ? '100vh' : '600px',
          maxWidth: '100vw',
          maxHeight: '100vh',
          background: 'var(--surface, #1a1a2e)',
          borderRadius: isExpanded ? '0' : '24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          border: isExpanded ? 'none' : '1px solid var(--surface-border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10000,
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid var(--surface-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                padding: '10px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={20} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main, #fff)' }}>ITsharing AI</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Online & Ready</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}>
                {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((m, idx) => (
              <div key={idx} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}>
                <div style={{
                  background: m.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: m.role === 'user' ? '#fff' : 'var(--text-main, #fff)',
                  padding: '14px 18px',
                  borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  border: m.role === 'user' ? 'none' : '1px solid var(--surface-border)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '14px 18px', borderRadius: '20px 20px 20px 4px', border: '1px solid var(--surface-border)' }}>
                <Loader2 size={20} className="spin" color="var(--primary)" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '20px', borderTop: '1px solid var(--surface-border)', background: 'var(--surface)', display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="សរសេរសំណួររបស់អ្នកនៅទីនេះ..."
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--surface-border)',
                borderRadius: '16px',
                padding: '0 20px',
                color: 'var(--text-main, #fff)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                background: 'var(--primary)',
                border: 'none',
                width: '50px',
                height: '50px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.6 : 1,
                transition: '0.2s'
              }}
            >
              <Send size={20} style={{ marginLeft: '4px' }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAgent;
