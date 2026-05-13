"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/components/ui/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pendente:       { label: "Pendente",       color: "bg-amber-100 text-amber-700 border-amber-200" },
  visualizada:    { label: "Visualizada",    color: "bg-blue-100 text-blue-700 border-blue-200" },
  encaminhada:    { label: "Encaminhada",    color: "bg-purple-100 text-purple-700 border-purple-200" },
  aceita:         { label: "Aceita",         color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  recusada:       { label: "Recusada",       color: "bg-red-100 text-red-500 border-red-200" },
  contraproposta: { label: "Contraproposta", color: "bg-slate-100 text-slate-600 border-slate-200" },
};

const PAYMENT_LABEL: Record<string, string> = {
  avista:        "À Vista",
  financiamento: "Financiamento",
  misto:         "Misto",
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

function WAIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.124 1.523 5.855L.057 23.882l6.192-1.624A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.882 9.882 0 01-5.042-1.382l-.361-.214-3.737.979 1.001-3.649-.235-.374A9.859 9.859 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z" />
    </svg>
  );
}

export default function PropostasPage() {
  const { token, user } = useAuth();
  const { success, error: toastError } = useToast();

  const isBuyer = user?.role === "user";

  const [proposals, setProposals] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const limit = 20;

  const [showNewModal, setShowNewModal] = useState(false);
  const [newProposal, setNewProposal] = useState({
    imovel_id: "",
    nome_comprador: "",
    email_comprador: "",
    telefone_comprador: "",
    valor_ofertado: "",
  });
  const [submittingNew, setSubmittingNew] = useState(false);

  const fetchProposals = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const endpoint = isBuyer ? "/api/v1/propostas/mine" : "/api/v1/propostas/";
      const params = new URLSearchParams({
        skip: String((page - 1) * limit),
        limit: String(limit),
        ...(filterStatus ? { situacao: filterStatus } : {}),
      });
      const res = await fetch(`${API}${endpoint}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProposals(data.items ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterStatus, token, isBuyer]);

  const submitNewProposal = async () => {
    if (!newProposal.imovel_id || !newProposal.valor_ofertado) return;
    setSubmittingNew(true);
    try {
      const res = await fetch(`${API}/api/v1/propostas/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          imovel_id: parseInt(newProposal.imovel_id),
          nome_comprador: newProposal.nome_comprador || null,
          email_comprador: newProposal.email_comprador || null,
          telefone_comprador: newProposal.telefone_comprador || null,
          valor_ofertado: parseFloat(newProposal.valor_ofertado),
        }),
      });
      if (res.ok) {
        success("Proposta criada com sucesso!");
        setShowNewModal(false);
        setNewProposal({ imovel_id: "", nome_comprador: "", email_comprador: "", telefone_comprador: "", valor_ofertado: "" });
        fetchProposals();
      } else {
        const data = await res.json();
        const detail = data.detail;
        const msg = Array.isArray(detail)
          ? detail.map((e: any) => e.msg).join(" | ")
          : typeof detail === "string" ? detail : "Erro ao criar proposta";
        toastError(msg);
      }
    } catch {
      toastError("Erro de conexão.");
    } finally {
      setSubmittingNew(false);
    }
  };

  const decide = async (id: number, situacao: string) => {
    try {
      const res = await fetch(`${API}/api/v1/propostas/${id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ situacao }),
      });
      if (res.ok) {
        success(`Proposta ${situacao === "aceita" ? "aceita" : "recusada"} com sucesso!`);
        fetchProposals();
      } else {
        toastError("Erro ao atualizar proposta.");
      }
    } catch {
      toastError("Erro de conexão.");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Propostas</h1>
          <p className="text-slate-500 font-medium mt-1">
            {isBuyer ? "Propostas que você enviou para imóveis." : "Propostas recebidas nos seus imóveis."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          {!isBuyer && (
            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition shrink-0"
            >
              + Nova Proposta
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {[
          { label: "Total", count: total, color: "text-slate-700" },
          { label: "Pendentes", count: proposals.filter(p => p.situacao === "pendente").length, color: "text-amber-600" },
          { label: "Aceitas", count: proposals.filter(p => p.situacao === "aceita").length, color: "text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 px-5 py-4 shadow-sm">
            <div className={`text-2xl font-black ${s.color}`}>{s.count}</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-semibold text-lg">Nenhuma proposta encontrada</p>
          <p className="text-sm mt-1">{filterStatus ? "Tente remover o filtro de status." : isBuyer ? "Você ainda não enviou propostas." : "Nenhuma proposta recebida ainda."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => {
            const s = STATUS_MAP[p.situacao] ?? { label: p.situacao, color: "bg-slate-100 text-slate-500 border-slate-200" };
            const isPending = p.situacao === "pendente";
            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-6 bg-white transition ${isPending ? "border-amber-200 shadow-amber-50 shadow-sm" : "border-slate-100 shadow-sm"}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Property link */}
                    {p.imovel && (
                      <Link
                        href={`/properties/${p.imovel_id}`}
                        className="text-xs font-bold text-blue-600 hover:underline mb-2 block truncate"
                      >
                        {p.imovel.titulo}
                        {p.imovel.cidade && <span className="text-slate-400 font-normal"> · {p.imovel.cidade}</span>}
                      </Link>
                    )}

                    {/* Buyer + status */}
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      <span className="font-bold text-slate-900">{p.nome_comprador}</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${s.color}`}>
                        {s.label}
                      </span>
                    </div>

                    {/* Values */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-3">
                      <div>
                        <span className="text-slate-400 text-xs block">Valor ofertado</span>
                        <span className="font-black text-xl text-slate-900">{fmt(p.valor_ofertado)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Pagamento</span>
                        <span className="font-semibold text-slate-700">
                          {PAYMENT_LABEL[p.forma_pagamento] ?? p.forma_pagamento}
                          {p.percentual_financiamento && (
                            <span className="text-slate-400 text-xs font-normal ml-1">({p.percentual_financiamento}%)</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {p.condicoes && (
                      <p className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg mb-2">
                        <span className="font-bold">Condições:</span> {p.condicoes}
                      </p>
                    )}
                    {p.mensagem && (
                      <p className="text-xs text-slate-500 italic">"{p.mensagem}"</p>
                    )}
                    <div className="text-[10px] text-slate-400 mt-2">{fmtDate(p.criado_em)}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0 min-w-[160px]">
                    {p.telefone_comprador && !isBuyer && (
                      <a
                        href={`https://wa.me/55${p.telefone_comprador.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                      >
                        <WAIcon />
                        Contatar
                      </a>
                    )}
                    {isPending && !isBuyer && (
                      <>
                        <button
                          onClick={() => decide(p.id, "aceita")}
                          className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition"
                        >
                          Aceitar
                        </button>
                        <button
                          onClick={() => decide(p.id, "recusada")}
                          className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition"
                        >
                          Recusar
                        </button>
                      </>
                    )}
                    {isPending && isBuyer && (
                      <button
                        onClick={() => decide(p.id, "recusada")}
                        className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition"
                      >
                        Cancelar proposta
                      </button>
                    )}
                    {p.imovel && (
                      <Link
                        href={`/properties/${p.imovel_id}`}
                        className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition text-center"
                      >
                        Ver imóvel
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Nova Proposta ── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">Nova Proposta</h2>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">ID do Imóvel *</label>
                <input
                  type="number"
                  value={newProposal.imovel_id}
                  onChange={(e) => setNewProposal(p => ({ ...p, imovel_id: e.target.value }))}
                  placeholder="Ex: 42"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Valor Ofertado (R$) *</label>
                <input
                  type="number"
                  value={newProposal.valor_ofertado}
                  onChange={(e) => setNewProposal(p => ({ ...p, valor_ofertado: e.target.value }))}
                  placeholder="Ex: 350000"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Nome do Comprador</label>
                <input
                  type="text"
                  value={newProposal.nome_comprador}
                  onChange={(e) => setNewProposal(p => ({ ...p, nome_comprador: e.target.value }))}
                  placeholder="Ex: João Silva"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">E-mail do Comprador</label>
                <input
                  type="email"
                  value={newProposal.email_comprador}
                  onChange={(e) => setNewProposal(p => ({ ...p, email_comprador: e.target.value }))}
                  placeholder="Ex: joao@email.com"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Telefone do Comprador</label>
                <input
                  type="tel"
                  value={newProposal.telefone_comprador}
                  onChange={(e) => setNewProposal(p => ({ ...p, telefone_comprador: e.target.value }))}
                  placeholder="Ex: 11999998888"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={submitNewProposal}
                disabled={submittingNew || !newProposal.imovel_id || !newProposal.valor_ofertado}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
              >
                {submittingNew ? "Enviando..." : "Criar Proposta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-sm font-semibold text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
