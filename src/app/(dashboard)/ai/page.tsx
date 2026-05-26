"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Message { role: "user" | "assistant"; content: string; timestamp: Date }

const SUGGESTED = [
  "How much did I spend on restaurants this month?",
  "What's my current net worth?",
  "Which subscriptions should I consider canceling?",
  "Am I on track with my savings goals?",
  "Where did my spending increase recently?",
  "How long until I'm debt free?",
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your MoneyMap AI assistant. I can answer questions about your spending, budgets, goals, net worth, and more — all based on your actual financial data. What would you like to know?", timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (msg?: string) => {
    const text = msg ?? input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text, timestamp: new Date() }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.response ?? "Sorry, I couldn't generate a response.", timestamp: new Date() }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong. Please try again.", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold">AI Financial Assistant</h2>
          <Badge variant="secondary">Beta</Badge>
        </div>
        <p className="text-sm text-gray-500">Ask questions about your finances. All answers are based on your actual data.</p>
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTED.map((s) => (
            <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-indigo-400 hover:text-indigo-600 transition-colors bg-white dark:bg-gray-900 dark:border-gray-700">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === "user" ? "bg-indigo-600" : "bg-gray-100 dark:bg-gray-800"}`}>
              {msg.role === "user" ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-indigo-600" />}
            </div>
            <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white"}`}>
              <div className="whitespace-pre-wrap leading-relaxed"
                dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }}
              />
              <p className={`mt-1 text-xs ${msg.role === "user" ? "text-indigo-200" : "text-gray-400"}`}>
                {msg.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Bot className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 py-3">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => <span key={i} className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about your finances…"
          className="flex-1"
          disabled={loading}
        />
        <Button onClick={() => send()} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <p className="mt-2 text-xs text-center text-gray-400">MoneyMap AI uses your financial data to answer questions. Not regulated financial advice.</p>
    </div>
  );
}
