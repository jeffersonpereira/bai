"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import PlanGate from "@/app/components/PlanGate";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

interface Message {
  id: number;
  jid_conversa: string;
  direcao: "entrada" | "saida";
  conteudo: string;
  enviado_em: string;
}

interface SessionStatus {
  status: string;
  qr: string | null;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function fmtPhone(jid: string) {
  const num = jid.split("@")[0];
  return num.length === 13
    ? `+${num.slice(0, 2)} (${num.slice(2, 4)}) ${num.slice(4, 9)}-${num.slice(9)}`
    : `+${num}`;
}

export default function WhatsAppPage() {
  const { token, user } = useAuth();
  const hasWhatsApp = user?.tipo_plano === "pro" || user?.tipo_plano === "premium";

  const [session, setSession] = useState<SessionStatus>({ status: "disconnected", qr: null });
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<string[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [msgText, setMsgText] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMsgIdRef = useRef<number | null>(null);

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const pollSession = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/session/status`, { headers: headers() });
      if (res.ok) setSession(await res.json());
    } catch { /* ignore */ }
  }, [token, headers]);

  // Always load ALL messages; derive chats list from them.
  // When activeChat is set, we also show only its messages via filter at render.
  const loadAllMessages = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/messages?limit=200`, { headers: headers() });
      if (!res.ok) return;
      const msgs: Message[] = await res.json();
      const sorted = [...msgs].reverse(); // oldest → newest
      setMessages(sorted);
      // Preserve order of first appearance (most recent conversation first)
      const seen = new Set<string>();
      const uniqueJids: string[] = [];
      for (const m of msgs) { // msgs is newest-first from API
        if (!seen.has(m.jid_conversa)) {
          seen.add(m.jid_conversa);
          uniqueJids.push(m.jid_conversa);
        }
      }
      setChats(uniqueJids);
    } catch { /* ignore */ }
  }, [token, headers]);

  const activeMessages = useMemo(
    () => messages.filter(m => !activeChat || m.jid_conversa === activeChat),
    [messages, activeChat]
  );

  useEffect(() => {
    if (!token || !hasWhatsApp) return;
    pollSession();
    loadAllMessages();
    const interval = setInterval(() => {
      pollSession();
      loadAllMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [token, hasWhatsApp, pollSession, loadAllMessages]);

  // Scroll to bottom when switching chat
  useEffect(() => {
    lastMsgIdRef.current = null;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat]);

  // Scroll to bottom only when a new message arrives
  useEffect(() => {
    const lastMsg = activeMessages.at(-1);
    if (!lastMsg) return;
    if (lastMsg.id !== lastMsgIdRef.current) {
      lastMsgIdRef.current = lastMsg.id;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages]);

  const connect = async () => {
    setConnecting(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/session/start`, {
        method: "POST",
        headers: headers(),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.detail || "Erro ao iniciar sessão.");
        return;
      }
      setSession({ status: "connecting", qr: null });
      setTimeout(pollSession, 3000);
    } catch { setError("Erro de conexão."); }
    finally { setConnecting(false); }
  };

  const disconnect = async () => {
    try {
      await fetch(`${API}/api/v1/whatsapp/session`, {
        method: "DELETE",
        headers: headers(),
      });
      setSession({ status: "disconnected", qr: null });
      setChats([]);
      setMessages([]);
      setActiveChat(null);
    } catch { /* ignore */ }
  };

  const sendMessage = async () => {
    if (!activeChat || !msgText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/send`, {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ to: activeChat, text: msgText.trim() }),
      });
      if (res.ok) {
        setMsgText("");
        await loadAllMessages();
      } else {
        const d = await res.json();
        setError(d.detail || "Erro ao enviar mensagem.");
      }
    } catch { setError("Erro de conexão."); }
    finally { setSending(false); }
  };

  const isConnected = session.status === "connected";
  const isConnecting = session.status === "connecting" || session.status === "qr_pending";

  if (!hasWhatsApp) {
    return (
      <PlanGate hasFeature={false} featureName="WhatsApp Business" requiredPlan="Pro">
        <></>
      </PlanGate>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 shrink-0 bg-white border-r border-slate-100 flex flex-col">
        {/* Connection status */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-slate-900">WhatsApp</h2>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
              isConnected ? "bg-emerald-50 text-emerald-700"
              : isConnecting ? "bg-amber-50 text-amber-700"
              : "bg-slate-100 text-slate-500"
            }`}>
              {isConnected ? "Conectado" : isConnecting ? "Conectando..." : "Desconectado"}
            </span>
          </div>

          {session.status === "disconnected" && (
            <button
              onClick={connect}
              disabled={connecting}
              className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {connecting ? "Iniciando..." : "Conectar WhatsApp"}
            </button>
          )}

          {isConnecting && !session.qr && (
            <p className="text-xs text-slate-400 text-center py-2">Aguardando QR Code...</p>
          )}

          {session.qr && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-2 text-center">Escaneie com seu WhatsApp:</p>
              <img src={session.qr} alt="QR Code WhatsApp" className="w-full rounded-xl border border-slate-200" />
            </div>
          )}

          {isConnected && (
            <button
              onClick={disconnect}
              className="w-full py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition"
            >
              Desconectar
            </button>
          )}
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 mt-8">
              <p>Nenhuma conversa ainda.</p>
              <p className="mt-1">Mensagens recebidas aparecerão aqui.</p>
            </div>
          ) : chats.map(jid => {
            const lastMsg = messages.filter(m => m.jid_conversa === jid).at(-1);
            return (
              <button
                key={jid}
                onClick={() => setActiveChat(jid)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 transition ${activeChat === jid ? "bg-blue-50" : "hover:bg-slate-50"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">
                    {jid.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{fmtPhone(jid)}</p>
                    {lastMsg && (
                      <p className="text-xs text-slate-400 truncate">
                        {lastMsg.direcao === "saida" ? "Você: " : ""}{lastMsg.conteudo}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {error && (
          <div className="px-4 pt-3">
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>
          </div>
        )}

        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <div>
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.124 1.523 5.855L.057 23.882l6.192-1.624A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.882 9.882 0 01-5.042-1.382l-.361-.214-3.737.979 1.001-3.649-.235-.374A9.859 9.859 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z"/>
                </svg>
              </div>
              <p className="font-bold text-slate-600 text-lg mb-1">
                {isConnected ? "Selecione uma conversa" : "Conecte seu WhatsApp"}
              </p>
              <p className="text-slate-400 text-sm">
                {isConnected
                  ? "Clique em uma conversa na lista à esquerda para começar."
                  : "Clique em 'Conectar WhatsApp' e escaneie o QR Code."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-slate-100 px-5 py-3 flex items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveChat(null)}
                className="text-slate-400 hover:text-slate-600 transition mr-1"
                title="Voltar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">
                {activeChat.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{fmtPhone(activeChat)}</p>
                <p className="text-[10px] text-slate-400">WhatsApp</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {activeMessages.length === 0 ? (
                <p className="text-center text-xs text-slate-400 mt-8">Nenhuma mensagem nesta conversa.</p>
              ) : activeMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.direcao === "saida" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                    msg.direcao === "saida"
                      ? "bg-emerald-600 text-white rounded-br-sm"
                      : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm shadow-sm"
                  }`}>
                    <p className="leading-relaxed">{msg.conteudo}</p>
                    <p className={`text-[10px] mt-1 ${msg.direcao === "saida" ? "text-emerald-200" : "text-slate-400"} text-right`}>
                      {fmtTime(msg.enviado_em)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-slate-100 px-4 py-3 flex items-center gap-3 shrink-0">
              <input
                type="text"
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Escreva uma mensagem..."
                disabled={!isConnected}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!msgText.trim() || sending || !isConnected}
                className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
