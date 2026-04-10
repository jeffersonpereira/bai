"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";

interface ChatMessage {
  id: number;
  direction: "inbound" | "outbound";
  body: string;
  timestamp: string;
}

interface ChatLead {
  id: number;
  name: string;
  phone: string;
  is_bot_paused: boolean;
  messages: ChatMessage[];
}

export default function ChatOmnichannel() {
  const { token, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState<ChatLead[]>([]);
  const [activeLead, setActiveLead] = useState<ChatLead | null>(null);
  const [inputText, setInputText] = useState("");

  const mockLeads: ChatLead[] = [
    {
      id: 1, 
      name: "João Silva", 
      phone: "5511999999999", 
      is_bot_paused: false,
      messages: [
        { id: 1, direction: "inbound", body: "Gostaria de agendar uma visita", timestamp: new Date().toISOString() },
        { id: 2, direction: "outbound", body: "Perfeito! Já registrei o interesse de visita.", timestamp: new Date().toISOString() }
      ]
    }
  ];

  useEffect(() => {
    // Polling API integration would go here
    setLeads(mockLeads);
  }, []);

  const toggleBot = async () => {
    if (!activeLead) return;
    
    // API call to toggle bot
    const newStatus = !activeLead.is_bot_paused;
    setActiveLead({...activeLead, is_bot_paused: newStatus});
    
    setLeads(leads.map(l => l.id === activeLead.id ? {...l, is_bot_paused: newStatus} : l));
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !activeLead) return;

    // Add optimistic message
    const newMsg: ChatMessage = {
      id: Date.now(),
      direction: "outbound",
      body: inputText,
      timestamp: new Date().toISOString()
    };
    
    // Update local state
    const updatedLead = {
      ...activeLead,
      messages: [...activeLead.messages, newMsg]
    };
    setActiveLead(updatedLead);
    setLeads(leads.map(l => l.id === activeLead.id ? updatedLead : l));
    setInputText("");

    // API Call to POST /api/v1/whatsapp/send (which you would need to create or call Node directly through proxy)
    // await fetch(..., { method: 'POST', body: JSON.stringify({ phone: activeLead.phone, message: inputText }) })
  };

  if (authLoading) return <div className="p-20 text-center animate-pulse">Carregando Chat...</div>;

  return (
    <div className="container mx-auto max-w-7xl h-[calc(100vh-100px)] py-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex h-full">
        
        {/* LEADS LIST (Sidebar) */}
        <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-black text-slate-800">Inbox Whatsapp</h2>
            <p className="text-xs text-slate-500 mt-1">Integração Omnichannel em Tempo Real</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {leads.map(lead => (
              <div 
                key={lead.id} 
                onClick={() => setActiveLead(lead)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition flex items-center gap-3 ${activeLead?.id === lead.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-100'}`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                  {lead.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-sm">{lead.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{lead.phone}</p>
                </div>
                {lead.is_bot_paused ? (
                  <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded font-bold uppercase">Humano</span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded font-bold uppercase">IA Ativa</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col bg-white">
          {activeLead ? (
            <>
              {/* Header do Chat */}
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                    {activeLead.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">{activeLead.name}</h2>
                    <p className="text-xs text-slate-500">{activeLead.phone}</p>
                  </div>
                </div>
                <button 
                  onClick={toggleBot}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition shadow-sm ${activeLead.is_bot_paused ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                >
                  {activeLead.is_bot_paused ? '▶ Retomar IA' : '⏸ Assumir Conversa'}
                </button>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {activeLead.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${msg.direction === 'outbound' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                      {msg.body}
                      <div className={`text-[10px] mt-1 text-right ${msg.direction === 'outbound' ? 'text-blue-200' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex items-end gap-2">
                  <textarea 
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Digite sua mensagem (use Assumir Conversa para evitar choque com a IA)..."
                    className="flex-1 resize-none bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl p-4 text-sm font-medium outline-none transition"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button 
                    onClick={sendMessage}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transition"
                  >
                    <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <p className="font-bold text-lg text-slate-500">Selecione uma conversa</p>
              <p className="text-sm mt-2 max-w-sm">Acompanhe as qualificações feitas pela Inteligência Artificial ou assuma a conversa para fechamento corporativo.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
