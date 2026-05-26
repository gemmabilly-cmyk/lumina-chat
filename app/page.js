"use client";
import { useState, useRef, useEffect } from "react";

const STORAGE_KEY = "lumina_data";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { projects: [{ id: "default", name: "General", chats: [] }], activeChatId: null, activeProjectId: "default" };
  } catch { return { projects: [{ id: "default", name: "General", chats: [] }], activeChatId: null, activeProjectId: "default" }; }
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

export default function Home() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (unlocked) setData(loadData());
  }, [unlocked]);

  useEffect(() => {
    if (data) saveData(data);
  }, [data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data]);

  const activeProject = data?.projects.find(p => p.id === data.activeProjectId);
  const activeChat = activeProject?.chats.find(c => c.id === data?.activeChatId);

  const newChat = () => {
    const chat = { id: genId(), name: "New chat", messages: [], createdAt: Date.now() };
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === prev.activeProjectId ? { ...p, chats: [chat, ...p.chats] } : p),
      activeChatId: chat.id
    }));
    setSidebarOpen(false);
  };

  const selectChat = (chatId) => {
    setData(prev => ({ ...prev, activeChatId: chatId }));
    setSidebarOpen(false);
  };

  const deleteChat = (chatId) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === prev.activeProjectId ? { ...p, chats: p.chats.filter(c => c.id !== chatId) } : p),
      activeChatId: prev.activeChatId === chatId ? null : prev.activeChatId
    }));
  };

  const addProject = () => {
    if (!newProjectName.trim()) return;
    const project = { id: genId(), name: newProjectName.trim(), chats: [] };
    setData(prev => ({ ...prev, projects: [...prev.projects, project], activeProjectId: project.id, activeChatId: null }));
    setNewProjectName("");
    setShowNewProject(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || !data) return;
    
    let chatId = data.activeChatId;
    let isNewChat = false;
    
    if (!chatId) {
      const chat = { id: genId(), name: text.slice(0, 30), messages: [], createdAt: Date.now() };
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === prev.activeProjectId ? { ...p, chats: [chat, ...p.chats] } : p),
        activeChatId: chat.id
      }));
      chatId = chat.id;
      isNewChat = true;
    }

    const userMsg = { role: "user", content: text };
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === prev.activeProjectId ? {
        ...p, chats: p.chats.map(c => c.id === chatId ? { ...c, messages: [...c.messages, userMsg], name: c.messages.length === 0 ? text.slice(0, 30) : c.name } : c)
      } : p)
    }));
    setInput("");
    setLoading(true);

    const currentMessages = isNewChat ? [userMsg] : [...(activeChat?.messages || []), userMsg];

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMessages }),
      });
      const d = await response.json();
      const assistantMsg = { role: "assistant", content: d.reply };
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === prev.activeProjectId ? {
          ...p, chats: p.chats.map(c => c.id === chatId ? { ...c, messages: [...c.messages, assistantMsg] } : c)
        } : p)
      }));
    } catch {
      const errMsg = { role: "assistant", content: "Something went wrong. Try again." };
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === prev.activeProjectId ? {
          ...p, chats: p.chats.map(c => c.id === chatId ? { ...c, messages: [...c.messages, errMsg] } : c)
        } : p)
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); unlocked ? sendMessage() : handleUnlock(); }
  };

  const handleUnlock = () => {
    if (password === "lumina2026") { setUnlocked(true); setError(false); }
    else setError(true);
  };

  if (!unlocked) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #0a0a0f 0%, #0d0d1a 100%)", fontFamily: "Georgia, serif", padding: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>✦</div>
        <h1 style={{ color: "#c4b5fd", fontSize: 28, letterSpacing: "0.1em", marginBottom: 8, fontVariant: "small-caps" }}>Lumina</h1>
        <p style={{ color: "rgba(196,181,253,0.4)", fontSize: 14, marginBottom: 32 }}>Enter your access password</p>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} placeholder="Password" style={{ background: "rgba(255,255,255,0.05)", border: error ? "1px solid #f87171" : "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", color: "#e2deff", fontSize: 16, width: "100%", maxWidth: 300, outline: "none", marginBottom: 8, fontFamily: "Georgia, serif", textAlign: "center" }} />
        {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>Incorrect password</p>}
        <button onClick={handleUnlock} style={{ marginTop: 8, width: "100%", maxWidth: 300, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7c3aed, #5b21b6)", color: "#fff", fontSize: 16, cursor: "pointer", fontFamily: "Georgia, serif" }}>Enter Lumina</button>
        <p style={{ color: "rgba(196,181,253,0.3)", fontSize: 12, marginTop: 24, textAlign: "center" }}>Purchase access at beacons.ai/gemma1410</p>
      </div>
    );
  }

  if (!data) return <div style={{ height: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c4b5fd" }}>Loading...</div>;

  return (
    <div style={{ height: "100vh", display: "flex", background: "linear-gradient(160deg, #0a0a0f 0%, #0d0d1a 100%)", fontFamily: "Georgia, serif", color: "#e2deff" }}>
      
      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div style={{ width: 280, background: "#0d0d1a", borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ padding: "16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#c4b5fd", fontSize: 16, fontVariant: "small-caps", letterSpacing: "0.1em" }}>✦ Lumina</span>
              <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>

            <button onClick={newChat} style={{ margin: "12px", padding: "10px", borderRadius: 10, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(124,58,237,0.15)", color: "#c4b5fd", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif" }}>+ New Chat</button>

            <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
              {data.projects.map(project => (
                <div key={project.id}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 8px 4px" }}>
                    <button onClick={() => setData(prev => ({ ...prev, activeProjectId: project.id, activeChatId: null }))} style={{ background: "none", border: "none", color: data.activeProjectId === project.id ? "#c4b5fd" : "rgba(196,181,253,0.4)", cursor: "pointer", fontSize: 12, letterSpacing: "0.1em", fontFamily: "Georgia, serif" }}>
                      📁 {project.name.toUpperCase()}
                    </button>
                  </div>
                  {data.activeProjectId === project.id && project.chats.map(chat => (
                    <div key={chat.id} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                      <button onClick={() => selectChat(chat.id)} style={{ flex: 1, textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none", background: data.activeChatId === chat.id ? "rgba(124,58,237,0.2)" : "none", color: data.activeChatId === chat.id ? "#c4b5fd" : "rgba(196,181,253,0.6)", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {chat.name || "New chat"}
                      </button>
                      <button onClick={() => deleteChat(chat.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 12, padding: "4px" }}>🗑</button>
                    </div>
                  ))}
                </div>
              ))}

              {showNewProject ? (
                <div style={{ padding: "8px" }}>
                  <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Project name" onKeyDown={e => e.key === "Enter" && addProject()} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px", color: "#e2deff", fontSize: 13, outline: "none", fontFamily: "Georgia, serif", boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    <button onClick={addProject} style={{ flex: 1, padding: "6px", borderRadius: 6, border: "none", background: "rgba(124,58,237,0.3)", color: "#c4b5fd", cursor: "pointer", fontSize: 12 }}>Add</button>
                    <button onClick={() => setShowNewProject(false)} style={{ flex: 1, padding: "6px", borderRadius: 6, border: "none", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12 }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowNewProject(true)} style={{ width: "100%", padding: "8px", background: "none", border: "none", color: "rgba(196,181,253,0.3)", cursor: "pointer", fontSize: 12, textAlign: "left", fontFamily: "Georgia, serif" }}>+ New Project</button>
              )}
            </div>
          </div>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)" }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: "rgba(196,181,253,0.6)", cursor: "pointer", fontSize: 18, padding: "0 4px 0 0" }}>☰</button>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "radial-gradient(circle, #a78bfa, #7c3aed)", boxShadow: "0 0 8px rgba(167,139,250,0.6)" }} />
          <span style={{ fontSize: 20, letterSpacing: "0.15em", color: "#c4b5fd", fontVariant: "small-caps" }}>Lumina</span>
          <button onClick={newChat} style={{ marginLeft: "auto", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 8, color: "#c4b5fd", cursor: "pointer", fontSize: 12, padding: "4px 10px", fontFamily: "Georgia, serif" }}>+ New</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px" }}>
          {!activeChat || activeChat.messages.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: "20vh", color: "rgba(196,181,253,0.4)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
              <p style={{ fontSize: 20, letterSpacing: "0.05em" }}>How can I help you?</p>
            </div>
          ) : (
            activeChat.messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 14 }}>
                <div style={{ maxWidth: "78%", background: msg.role === "user" ? "linear-gradient(135deg, #4c1d95, #6d28d9)" : "rgba(255,255,255,0.06)", border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "11px 15px", fontSize: 15, lineHeight: 1.65, color: msg.role === "user" ? "#ede9fe" : "#d4d0f0" }}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 14 }}>
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px 18px 18px 4px", padding: "14px 18px", display: "flex", gap: 5 }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", display: "inline-block", animation: "bounce 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: "12px 16px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "10px 12px" }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Message Lumina…" rows={1} style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e2deff", fontSize: 15, resize: "none", fontFamily: "Georgia, serif", lineHeight: 1.6, caretColor: "#a78bfa" }} />
            <button onClick={sendMessage} disabled={!input.trim() || loading} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: input.trim() && !loading ? "linear-gradient(135deg, #7c3aed, #5b21b6)" : "rgba(255,255,255,0.06)", color: input.trim() && !loading ? "#fff" : "rgba(255,255,255,0.2)", cursor: input.trim() && !loading ? "pointer" : "default", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-5px); } }
        textarea::placeholder { color: rgba(196,181,253,0.3); }
      `}</style>
    </div>
  );
}
