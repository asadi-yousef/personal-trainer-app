"use client";
import React, { useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  suggestions?: { label: string; href: string }[];
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I can help with trainers, bookings, and payments." },
  ]);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const nextHistory = [...messages, { role: "user" as const, content: text }];
    setMessages(nextHistory);
    setSending(true);
    try {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userRole = storedUser ? (JSON.parse(storedUser)?.role || null) : null;
      const res = await fetch("http://127.0.0.1:8000/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: nextHistory.map(m => ({ role: m.role, content: m.content })),
          context: typeof window !== "undefined" ? window.location.pathname : undefined,
          user_role: userRole,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "", suggestions: data.suggestions || [] }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I hit a problem." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        aria-label="Open chat"
        onClick={() => setIsOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-blue-600 text-white shadow-lg px-4 py-3 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        {isOpen ? "×" : "Chat"}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col">
          <div className="p-3 border-b font-semibold">FitConnect Assistant</div>
          <div ref={listRef} className="p-3 space-y-2 overflow-y-auto max-h-80">
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={
                    "inline-block px-3 py-2 rounded-lg " +
                    (m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800")
                  }
                >
                  {m.content}
                </span>
                {m.role === "assistant" && m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.suggestions.map((s, i) => (
                      <a
                        key={i}
                        href={s.href}
                        className="inline-block text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                      >
                        {s.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="text-left">
                <span className="inline-block px-3 py-2 rounded-lg bg-gray-100 text-gray-500">
                  Typing...
                </span>
              </div>
            )}
          </div>
          <div className="p-3 border-t flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
              placeholder="Ask about bookings, trainers, payments..."
              className="flex-1 border rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              disabled={sending}
              onClick={sendMessage}
              className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}



