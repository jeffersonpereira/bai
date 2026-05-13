"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import PlanGate from "@/app/components/PlanGate";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

interface SessionStatus { status: string; qr: string | null; }

interface Horario {
  id: number;
  dia_semana: number;
  inicio: string;
  fim: string;
  ativo: boolean;
}

interface Config {
  mensagem_fora_horario: string | null;
  intervalo_campanha_seg: number;
  variacao_campanha_seg: number;
}

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const DEFAULT_HORARIOS: Horario[] = DIAS.map((_, i) => ({
  id: 0, dia_semana: i, inicio: "08:00", fim: "18:00", ativo: i < 5,
}));

export default function ConfiguracoesPage() {
  const { user, token } = useAuth();
  const hasWhatsApp = user?.tipo_plano === "pro" || user?.tipo_plano === "premium";

  const [session, setSession] = useState<SessionStatus>({ status: "disconnected", qr: null });
  const [connecting, setConnecting] = useState(false);
  const [sessionError, setSessionError] = useState("");

  const [horarios, setHorarios] = useState<Horario[]>(DEFAULT_HORARIOS);
  const [horLoading, setHorLoading] = useState(true);
  const [horSaving, setHorSaving] = useState(false);

  const [config, setConfig] = useState<Config>({ mensagem_fora_horario: "", intervalo_campanha_seg: 5, variacao_campanha_seg: 3 });
  const [cfgLoading, setCfgLoading] = useState(true);
  const [cfgSaving, setCfgSaving] = useState(false);

  const [success, setSuccess] = useState("");

  const hdrs = useCallback(() => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }), [token]);

  const pollSession = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/session/status`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSession(await res.json());
    } catch { /* ignore */ }
  }, [token]);

  const carregarHorarios = useCallback(async () => {
    if (!token) return;
    setHorLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/horarios`, { headers: hdrs() });
      if (res.ok) {
        const data: Horario[] = await res.json();
        if (data.length > 0) setHorarios(data);
      }
    } finally { setHorLoading(false); }
  }, [token, hdrs]);

  const carregarConfig = useCallback(async () => {
    if (!token) return;
    setCfgLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/config`, { headers: hdrs() });
      if (res.ok) setConfig(await res.json());
    } finally { setCfgLoading(false); }
  }, [token, hdrs]);

  useEffect(() => {
    if (!hasWhatsApp || !token) return;
    pollSession();
    carregarHorarios();
    carregarConfig();
    const iv = setInterval(pollSession, 5000);
    return () => clearInterval(iv);
  }, [hasWhatsApp, token, pollSession, carregarHorarios, carregarConfig]);

  const connect = async () => {
    setConnecting(true); setSessionError(""); setSuccess("");
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/session/start`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const d = await res.json(); setSessionError(d.detail || "Erro ao iniciar sessão."); return; }
      setSession({ status: "connecting", qr: null });
      setTimeout(pollSession, 3000);
    } catch { setSessionError("Erro de conexão."); }
    finally { setConnecting(false); }
  };

  const disconnect = async () => {
    try {
      await fetch(`${API}/api/v1/whatsapp/session`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setSession({ status: "disconnected", qr: null });
      setSuccess("Sessão encerrada.");
    } catch { setSessionError("Erro ao desconectar."); }
  };

  const salvarHorarios = async () => {
    setHorSaving(true); setSuccess("");
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/horarios`, {
        method: "PUT", headers: hdrs(),
        body: JSON.stringify(horarios.map(h => ({ dia_semana: h.dia_semana, inicio: h.inicio, fim: h.fim, ativo: h.ativo }))),
      });
      if (res.ok) setSuccess("Horários salvos com sucesso.");
    } finally { setHorSaving(false); }
  };

  const salvarConfig = async () => {
    setCfgSaving(true); setSuccess("");
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/config`, {
        method: "PUT", headers: hdrs(),
        body: JSON.stringify({ mensagem_fora_horario: config.mensagem_fora_horario || null }),
      });
      if (res.ok) setSuccess("Configurações salvas.");
    } finally { setCfgSaving(false); }
  };

  const updateHorario = (idx: number, field: keyof Horario, value: string | boolean) => {
    setHorarios(h => h.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  if (!hasWhatsApp) {
    return <PlanGate hasFeature={false} featureName="Configurações WhatsApp" requiredPlan="Pro"><></></PlanGate>;
  }

  const isConnected = session.status === "connected";
  const isConnecting = session.status === "connecting" || session.status === "qr_pending";

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-6 py-4 shrink-0">
        <h1 className="text-base font-black text-slate-900">Configurações</h1>
        <p className="text-xs text-slate-400 mt-0.5">Gerencie a conexão e preferências do WhatsApp</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {sessionError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">{sessionError}</p>}
        {success && <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl">{success}</p>}

        {/* Connection */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-slate-800">Conexão WhatsApp</h2>
              <p className="text-xs text-slate-400 mt-0.5">Conecte seu número via QR Code</p>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${isConnected ? "bg-emerald-50 text-emerald-700" : isConnecting ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
              {isConnected ? "Conectado" : isConnecting ? "Conectando..." : "Desconectado"}
            </span>
          </div>

          {session.status === "disconnected" && (
            <button onClick={connect} disabled={connecting} className="w-full py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition">
              {connecting ? "Iniciando..." : "Conectar WhatsApp"}
            </button>
          )}
          {isConnecting && !session.qr && (
            <div className="text-center py-6">
              <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400">Aguardando QR Code...</p>
            </div>
          )}
          {session.qr && (
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500 mb-3">Escaneie com o WhatsApp do seu celular:</p>
              <div className="inline-block p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <img src={session.qr} alt="QR Code" className="w-56 h-56 rounded-xl" />
              </div>
              <p className="text-[10px] text-slate-400 mt-3">WhatsApp → Dispositivos Conectados → Conectar Dispositivo</p>
            </div>
          )}
          {isConnected && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.124 1.523 5.855L.057 23.882l6.192-1.624A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-800">WhatsApp Conectado</p>
                  <p className="text-[10px] text-emerald-600">Sessão ativa e recebendo mensagens</p>
                </div>
              </div>
              <button onClick={disconnect} className="w-full py-2.5 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition">Desconectar</button>
            </div>
          )}
        </div>

        {/* Business hours */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-sm font-black text-slate-800 mb-1">Horário de Atendimento</h2>
          <p className="text-xs text-slate-400 mb-4">Configure quando o atendimento estará disponível</p>
          {horLoading ? (
            <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-2">
              {horarios.map((h, i) => (
                <div key={h.dia_semana} className="flex items-center gap-3">
                  <input type="checkbox" checked={h.ativo} onChange={e => updateHorario(i, "ativo", e.target.checked)} id={`day-${i}`} className="w-4 h-4 accent-emerald-600" />
                  <label htmlFor={`day-${i}`} className="text-xs font-semibold text-slate-600 w-14">{DIAS[h.dia_semana]}</label>
                  <input type="time" value={h.inicio} onChange={e => updateHorario(i, "inicio", e.target.value)} disabled={!h.ativo} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 disabled:opacity-40" />
                  <span className="text-xs text-slate-400">até</span>
                  <input type="time" value={h.fim} onChange={e => updateHorario(i, "fim", e.target.value)} disabled={!h.ativo} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 disabled:opacity-40" />
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <button onClick={salvarHorarios} disabled={horSaving} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition">
              {horSaving ? "Salvando..." : "Salvar Horários"}
            </button>
          </div>
        </div>

        {/* Out of hours message */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-sm font-black text-slate-800 mb-1">Mensagem Fora do Horário</h2>
          <p className="text-xs text-slate-400 mb-3">Enviada automaticamente quando fora do horário de atendimento</p>
          {cfgLoading ? (
            <div className="flex items-center justify-center py-4"><div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <textarea
              rows={3}
              value={config.mensagem_fora_horario ?? ""}
              onChange={e => setConfig(c => ({ ...c, mensagem_fora_horario: e.target.value }))}
              placeholder="Olá! Estamos fora do horário de atendimento. Retornaremos em breve!"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
            />
          )}
          <div className="flex justify-end mt-3">
            <button onClick={salvarConfig} disabled={cfgSaving} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition">
              {cfgSaving ? "Salvando..." : "Salvar Mensagem"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
