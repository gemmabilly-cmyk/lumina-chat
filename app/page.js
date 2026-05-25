"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleUnlock = () => {
    if (password === "lumina2026") {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      unlocked ? sendMessage() : handleUnlock();
    }
  };

  if (!unlocked) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg, #0a0a0f 0%, #0d0d1a 100%)",
        fontFamily: "Georgia, serif", padding: 24
      }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>✦</div>
        <h1 style={{ color: "#c4b5fd", fontSize: 28, letterSpacing: "0.1em", marginBottom: 8, fontVariant: "small-caps" }}>Lumina</h1>
        <p style={{ color: "rgba(196,181,253,0.4)", fontSize: 14, marginBottom: 32 }}>Enter your access password</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Password"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: error ? "1px solid #f87171" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: "12px 16px",
            color: "#e2deff", fontSize: 16, width: "100%",
            maxWidth: 300, outline: "none", marginBottom: 8,
            fontFamily: "Georgia, serif", textAlign: "center"
          }}
        />
        {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>Incorrect password</p>}
        <button
          onClick={handleUnlock}
          style={{
            marginTop: 8, width: "100%", maxWidth: 300,
            padding: "12px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
            color: "#fff", fontSize: 16, cursor: "pointer",
            fontFamily: "Georgia, serif"
          }}
        >
          Enter Lumina
        </button>
        <p style={{ color: "rgba(196,181,253,0.3)", fontSize: 12, marginTop: 24, textAlign: "center" }}>
          Purchase access at beacons.ai/gemma1410
        </p>
      </div>
    );
  }

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "linear-gradient(160deg, #0a0a0f 0%, #0d0d1a 100%)",
      fontFamily: "Georgia, serif", color: "#e2deff"
    }}>
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(255,255,255,0.03)"
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: "radial-gradient(circle, #a78bfa, #7c3aed)",
          boxShadow: "0 0 8px rgba(167,139,250,0.6)"
        }} />
        <span style={{ fontSize: 20, letterSpacing: "0.15em", color: "#c4b5fd", fontVariant: "small-caps" }}>
          Lumina
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "20vh", color: "rgba(196,181,253,0.4)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
            <p style={{ fontSize: 20, letterSpacing: "0.05em" }}>How can I help you?</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            marginBottom: 14
          }}>
            <div style={{
              maxWidth: "78%",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #4c1d95, #6d28d9)"
                : "rgba(255,255,255,0.06)",
              border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "11px 15px", fontSize: 15, lineHeight: 1.65,
              color: msg.role === "user" ? "#ede9fe" : "#d4d0f0"
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 14 }}>
            <div style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px 18px 18px 4px",
              padding: "14px 18px", display: "flex", gap: 5
            }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  width: 7, height: 7, borderRadius: "50%", background: "#a78bfa",
                  display: "inline-block",
                  animation: "bounce 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{
        padding: "12px 16px 24px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.3)"
      }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 10,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16, padding: "10px 12px"
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Lumina…"
            rows={1}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "#e2deff", fontSize: 15, resize: "none",
              fontFamily: "Georgia, serif", lineHeight: 1.6,
              caretColor: "#a78bfa"
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              width: 34, height: 34, borderRadius: "50%", border: "none",
              background: input.trim() && !loading
                ? "linear-gradient(135deg, #7c3aed, #5b21b6)"
                : "rgba(255,255,255,0.06)",
              color: input.trim() && !loading ? "#fff" : "rgba(255,255,255,0.2)",
              cursor: input.trim() && !loading ? "pointer" : "default",
              fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: input.trim() && !loading ? "0 2px 12px rgba(124,58,237,0.4)" : "none"
            }}
          >↑</button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
        textarea::placeholder { color: rgba(196,181,253,0.3); }
      `}</style>
    </div>
  );
}
