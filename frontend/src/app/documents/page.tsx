"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

// ── Constantes ───────────────────────────────────────────────────────────────

const CONTEXTOS = [
  { value: "", label: "Todos" },
  { value: "imovel", label: "Imóvel" },
  { value: "proprietario", label: "Proprietário" },
  { value: "operacional", label: "Operacional" },
];

const TIPOS_POR_CONTEXTO: Record<string, { value: string; label: string }[]> = {
  imovel: [
    { value: "contrato", label: "Contrato" },
    { value: "escritura", label: "Escritura" },
    { value: "matricula", label: "Matrícula" },
    { value: "certidao_onus", label: "Certidão de Ônus" },
    { value: "habite_se", label: "Habite-se" },
    { value: "iptu", label: "IPTU" },
    { value: "planta", label: "Planta Baixa" },
    { value: "laudo", label: "Laudo de Vistoria" },
    { value: "rgi", label: "RGI" },
  ],
  proprietario: [
    { value: "rg", label: "RG" },
    { value: "cpf", label: "CPF" },
    { value: "cnh", label: "CNH" },
    { value: "passaporte", label: "Passaporte" },
    { value: "comprovante_renda", label: "Comprovante de Renda" },
    { value: "declaracao_ir", label: "Declaração IR" },
    { value: "certidao_casamento", label: "Certidão de Casamento" },
    { value: "procuracao", label: "Procuração" },
  ],
  operacional: [
    { value: "template", label: "Template de Contrato" },
    { value: "material_marketing", label: "Material de Marketing" },
    { value: "creci", label: "CRECI" },
    { value: "outros", label: "Outros" },
  ],
};

const TODOS_TIPOS = Object.values(TIPOS_POR_CONTEXTO).flat();

const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  pendente_assinatura: "Pendente Assinatura",
  assinado: "Assinado",
  arquivado: "Arquivado",
};

const STATUS_COLORS: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-600",
  pendente_assinatura: "bg-amber-100 text-amber-800",
  assinado: "bg-green-100 text-green-800",
  arquivado: "bg-blue-100 text-blue-700",
};

const CONTEXTO_COLORS: Record<string, string> = {
  imovel: "bg-purple-100 text-purple-700",
  proprietario: "bg-cyan-100 text-cyan-700",
  operacional: "bg-orange-100 text-orange-700",
};

const VISIBILIDADES = [
  { value: "interno", label: "Interno" },
  { value: "compartilhado", label: "Compartilhado" },
  { value: "publico", label: "Público" },
];

// ── Tipos ────────────────────────────────────────────────────────────────────

interface DocVinculos {
  id: number;
  titulo?: string;
  nome?: string;
  valor_ofertado?: number;
  situacao?: string;
}

interface Documento {
  id: number;
  titulo: string;
  tipo_documento: string;
  contexto: string;
  descricao?: string;
  nome_arquivo?: string;
  url_arquivo?: string;
  tamanho_bytes?: number;
  hash_sha256?: string;
  situacao: string;
  visibilidade: string;
  assinado_digitalmente: boolean;
  validade_em?: string;
  versao_numero: number;
  documento_origem_id?: number;
  total_versoes: number;
  tags?: string[];
  observacoes?: string;
  enviado_por: number;
  imovel_id?: number;
  proprietario_id?: number;
  proposta_id?: number;
  criado_em: string;
  atualizado_em: string;
  remetente?: { id: number; nome: string };
  imovel?: DocVinculos;
  proprietario?: DocVinculos;
  proposta?: DocVinculos;
}

interface FormState {
  titulo: string;
  tipo_documento: string;
  contexto: string;
  descricao: string;
  nome_arquivo: string;
  url_arquivo: string;
  situacao: string;
  visibilidade: string;
  assinado_digitalmente: boolean;
  validade_em: string;
  tags: string;
  observacoes: string;
  imovel_id: string;
  proprietario_id: string;
}

const FORM_VAZIO: FormState = {
  titulo: "", tipo_documento: "contrato", contexto: "imovel",
  descricao: "", nome_arquivo: "", url_arquivo: "",
  situacao: "rascunho", visibilidade: "interno",
  assinado_digitalmente: false, validade_em: "",
  tags: "", observacoes: "", imovel_id: "", proprietario_id: "",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function tiposDisponiveis(contexto: string) {
  return TIPOS_POR_CONTEXTO[contexto] ?? TODOS_TIPOS;
}

function labelTipo(value: string) {
  return TODOS_TIPOS.find((t) => t.value === value)?.label ?? value;
}

function formatBytes(bytes?: number) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function diasParaVencer(validade_em?: string) {
  if (!validade_em) return null;
  const diff = new Date(validade_em).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function DocumentosPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<Documento[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [vencendo, setVencendo] = useState<Documento[]>([]);

  // Filtros
  const [contexto, setContexto] = useState("");
  const [tipo, setTipo] = useState("");
  const [situacao, setSituacao] = useState("");
  const [busca, setBusca] = useState("");

  // Modal criar/editar
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Documento | null>(null);
  const [novaVersaoDe, setNovaVersaoDe] = useState<Documento | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  // Modal versões
  const [versoes, setVersoes] = useState<Documento[] | null>(null);
  const [docVersoes, setDocVersoes] = useState<Documento | null>(null);

  // Listas para selects contextuais
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [proprietarios, setProprietarios] = useState<any[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("bai_token") : null;

  const authHeader = { Authorization: `Bearer ${token}` };

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const p = new URLSearchParams({ limit: "50", skip: "0" });
      if (contexto) p.set("contexto", contexto);
      if (tipo) p.set("tipo_documento", tipo);
      if (situacao) p.set("situacao", situacao);
      const res = await fetch(`${API}/api/v1/documentos/?${p}`, { headers: authHeader });
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) throw new Error("Erro ao carregar documentos");
      const data = await res.json();
      setDocs(data.items);
      setTotal(data.total);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }, [contexto, tipo, situacao]);

  const fetchVencendo = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/documentos/vencendo?dias=30`, { headers: authHeader });
      if (!res.ok) return;
      const data = await res.json();
      setVencendo(data.items ?? []);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchDocs();
    fetchVencendo();
  }, [contexto, tipo, situacao]);

  // ── Filtro local por título ──────────────────────────────────────────────

  const docsFiltrados = busca.trim()
    ? docs.filter((d) => d.titulo.toLowerCase().includes(busca.toLowerCase()))
    : docs;

  // ── Ações Modal ──────────────────────────────────────────────────────────

  const fetchVinculos = useCallback(async () => {
    const [imoveisResult, proprietariosResult] = await Promise.allSettled([
      fetch(`${API}/api/v1/imoveis/user/me`, { headers: authHeader }),
      fetch(`${API}/api/v1/proprietarios/`, { headers: authHeader }),
    ]);
    if (imoveisResult.status === "fulfilled" && imoveisResult.value.ok) {
      const d = await imoveisResult.value.json();
      setImoveis(d.items ?? d);
    }
    if (proprietariosResult.status === "fulfilled" && proprietariosResult.value.ok) {
      const d = await proprietariosResult.value.json();
      setProprietarios(d.items ?? d);
    }
  }, []);

  const abrirCriar = () => {
    setEditando(null);
    setNovaVersaoDe(null);
    setForm({ ...FORM_VAZIO, contexto: contexto || "imovel" });
    fetchVinculos();
    setShowModal(true);
  };

  const abrirEditar = (doc: Documento) => {
    fetchVinculos();
    setEditando(doc);
    setNovaVersaoDe(null);
    setForm({
      titulo: doc.titulo,
      tipo_documento: doc.tipo_documento,
      contexto: doc.contexto,
      descricao: doc.descricao ?? "",
      nome_arquivo: doc.nome_arquivo ?? "",
      url_arquivo: doc.url_arquivo ?? "",
      situacao: doc.situacao,
      visibilidade: doc.visibilidade,
      assinado_digitalmente: doc.assinado_digitalmente,
      validade_em: doc.validade_em ? doc.validade_em.slice(0, 10) : "",
      tags: (doc.tags ?? []).join(", "),
      observacoes: doc.observacoes ?? "",
      imovel_id: doc.imovel_id?.toString() ?? "",
      proprietario_id: doc.proprietario_id?.toString() ?? "",
    });
    setShowModal(true);
  };

  const abrirNovaVersao = (doc: Documento) => {
    fetchVinculos();
    setEditando(null);
    setNovaVersaoDe(doc);
    setForm({
      ...FORM_VAZIO,
      titulo: `${doc.titulo} (v${doc.total_versoes + 1})`,
      tipo_documento: doc.tipo_documento,
      contexto: doc.contexto,
      situacao: "rascunho",
      visibilidade: doc.visibilidade,
      validade_em: doc.validade_em ? doc.validade_em.slice(0, 10) : "",
      imovel_id: doc.imovel_id?.toString() ?? "",
      proprietario_id: doc.proprietario_id?.toString() ?? "",
    });
    setShowModal(true);
  };

  const verVersoes = async (doc: Documento) => {
    try {
      const res = await fetch(`${API}/api/v1/documentos/${doc.id}/versoes`, { headers: authHeader });
      if (!res.ok) return;
      setVersoes(await res.json());
      setDocVersoes(doc);
    } catch { /* silencioso */ }
  };

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const body: Record<string, unknown> = {
        titulo: form.titulo,
        tipo_documento: form.tipo_documento,
        contexto: form.contexto,
        situacao: form.situacao,
        visibilidade: form.visibilidade,
        assinado_digitalmente: form.assinado_digitalmente,
      };
      if (form.descricao) body.descricao = form.descricao;
      if (form.nome_arquivo) body.nome_arquivo = form.nome_arquivo;
      if (form.url_arquivo) body.url_arquivo = form.url_arquivo;
      if (form.validade_em) body.validade_em = new Date(form.validade_em).toISOString();
      if (tags.length) body.tags = tags;
      if (form.observacoes) body.observacoes = form.observacoes;
      if (form.imovel_id) body.imovel_id = parseInt(form.imovel_id);
      if (form.proprietario_id) body.proprietario_id = parseInt(form.proprietario_id);

      let url: string;
      let method: string;
      if (novaVersaoDe) {
        url = `${API}/api/v1/documentos/${novaVersaoDe.id}/nova-versao`;
        method = "POST";
      } else if (editando) {
        url = `${API}/api/v1/documentos/${editando.id}`;
        method = "PATCH";
      } else {
        url = `${API}/api/v1/documentos/`;
        method = "POST";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Erro ao salvar");
      }
      setShowModal(false);
      fetchDocs();
      fetchVencendo();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleRemover = async (id: number) => {
    if (!confirm("Remover este documento?")) return;
    await fetch(`${API}/api/v1/documentos/${id}`, { method: "DELETE", headers: authHeader });
    fetchDocs();
    fetchVencendo();
  };

  // ── Renderização ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Documentos</h1>
            <p className="text-gray-500 text-sm mt-0.5">{total} documento{total !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={abrirCriar}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + Novo Documento
          </button>
        </div>

        {/* Alerta de vencimento */}
        {vencendo.length > 0 && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 font-medium text-sm mb-2">
              Documentos vencendo nos próximos 30 dias ({vencendo.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {vencendo.map((d) => {
                const dias = diasParaVencer(d.validade_em);
                return (
                  <span
                    key={d.id}
                    onClick={() => abrirEditar(d)}
                    className="cursor-pointer bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full hover:bg-amber-200"
                  >
                    {d.titulo} — {dias !== null && dias <= 0 ? "VENCIDO" : `${dias}d`}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Tabs de contexto */}
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
            {CONTEXTOS.map((c) => (
              <button
                key={c.value}
                onClick={() => { setContexto(c.value); setTipo(""); }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  contexto === c.value
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Todos os tipos</option>
            {tiposDisponiveis(contexto).map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            value={situacao}
            onChange={(e) => setSituacao(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white flex-1 min-w-40"
          />
        </div>

        {erro && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{erro}</div>}

        {/* Tabela */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando...</div>
        ) : docsFiltrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">Nenhum documento encontrado</p>
            <button onClick={abrirCriar} className="text-blue-600 text-sm hover:underline">
              Adicionar o primeiro
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Título</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Contexto</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Validade</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Vínculo</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {docsFiltrados.map((doc) => {
                  const dias = diasParaVencer(doc.validade_em);
                  const vencido = dias !== null && dias <= 0;
                  const alertaVencimento = dias !== null && dias <= 30;
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {doc.assinado_digitalmente && (
                            <span title="Assinado digitalmente" className="text-green-500 text-xs">✓</span>
                          )}
                          {doc.titulo}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {doc.nome_arquivo && (
                            <span className="text-gray-400 text-xs">{doc.nome_arquivo}</span>
                          )}
                          {doc.total_versoes > 1 && (
                            <button
                              onClick={() => verVersoes(doc)}
                              className="text-blue-400 text-xs hover:text-blue-600"
                            >
                              v{doc.versao_numero} ({doc.total_versoes} versões)
                            </button>
                          )}
                          {doc.tags && doc.tags.length > 0 && (
                            <span className="text-purple-500 text-xs">#{doc.tags.join(" #")}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{labelTipo(doc.tipo_documento)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONTEXTO_COLORS[doc.contexto] ?? "bg-gray-100 text-gray-600"}`}>
                          {CONTEXTOS.find((c) => c.value === doc.contexto)?.label ?? doc.contexto}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[doc.situacao] ?? "bg-gray-100 text-gray-600"}`}>
                          {STATUS_LABELS[doc.situacao] ?? doc.situacao}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {doc.validade_em ? (
                          <span className={vencido ? "text-red-600 font-medium" : alertaVencimento ? "text-amber-600 font-medium" : "text-gray-500"}>
                            {vencido ? "VENCIDO" : `${dias}d`}
                            <br />
                            <span className="text-gray-400 font-normal">
                              {new Date(doc.validade_em).toLocaleDateString("pt-BR")}
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {doc.imovel?.titulo ?? doc.proprietario?.nome ?? (doc.imovel_id ? `Imóvel #${doc.imovel_id}` : "—")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end items-center">
                          {doc.url_arquivo && (
                            <a
                              href={doc.url_arquivo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700 text-xs"
                            >
                              Ver
                            </a>
                          )}
                          <button
                            onClick={() => abrirNovaVersao(doc)}
                            className="text-gray-400 hover:text-gray-700 text-xs"
                            title="Nova versão"
                          >
                            Nova v.
                          </button>
                          <button
                            onClick={() => abrirEditar(doc)}
                            className="text-gray-500 hover:text-gray-700 text-xs"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleRemover(doc.id)}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Criar / Editar / Nova Versão ──────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-gray-900">
                {novaVersaoDe
                  ? `Nova versão — ${novaVersaoDe.titulo}`
                  : editando
                  ? "Editar Documento"
                  : "Novo Documento"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4">

              {/* Título */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Título *</label>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Ex: Contrato de Compra e Venda"
                />
              </div>

              {/* Contexto + Tipo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contexto *</label>
                  <select
                    value={form.contexto}
                    onChange={(e) => setForm({ ...form, contexto: e.target.value, tipo_documento: tiposDisponiveis(e.target.value)[0]?.value ?? "outros" })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {CONTEXTOS.filter((c) => c.value).map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={form.tipo_documento}
                    onChange={(e) => setForm({ ...form, tipo_documento: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {tiposDisponiveis(form.contexto).map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status + Visibilidade */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.situacao}
                    onChange={(e) => setForm({ ...form, situacao: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {Object.entries(STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Visibilidade</label>
                  <select
                    value={form.visibilidade}
                    onChange={(e) => setForm({ ...form, visibilidade: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {VISIBILIDADES.map((v) => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Validade + Assinado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Validade</label>
                  <input
                    type="date"
                    value={form.validade_em}
                    onChange={(e) => setForm({ ...form, validade_em: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.assinado_digitalmente}
                      onChange={(e) => setForm({ ...form, assinado_digitalmente: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xs font-medium text-gray-700">Assinado digitalmente</span>
                  </label>
                </div>
              </div>

              {/* Vínculo contextual */}
              {form.contexto === "imovel" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Imóvel vinculado *</label>
                  <select
                    required
                    value={form.imovel_id}
                    onChange={(e) => setForm({ ...form, imovel_id: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Selecione um imóvel...</option>
                    {imoveis.map((p: any) => (
                      <option key={p.id} value={p.id}>#{p.id} — {p.titulo || p.title || `Imóvel ${p.id}`}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.contexto === "proprietario" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Proprietário vinculado *</label>
                  <select
                    required
                    value={form.proprietario_id}
                    onChange={(e) => setForm({ ...form, proprietario_id: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Selecione um proprietário...</option>
                    {proprietarios.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nome || p.name || `Proprietário ${p.id}`}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Arquivo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome do arquivo</label>
                  <input
                    value={form.nome_arquivo}
                    onChange={(e) => setForm({ ...form, nome_arquivo: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="contrato.pdf"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">URL do arquivo</label>
                  <input
                    value={form.url_arquivo}
                    onChange={(e) => setForm({ ...form, url_arquivo: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tags (separadas por vírgula)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="venda, urgente, aprovado"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando || !form.titulo}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {salvando ? "Salvando..." : novaVersaoDe ? "Criar Nova Versão" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Histórico de Versões ───────────────────────────────────────── */}
      {versoes && docVersoes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900">Histórico de Versões</h2>
                <p className="text-xs text-gray-500 mt-0.5">{docVersoes.titulo}</p>
              </div>
              <button onClick={() => setVersoes(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-3">
              {versoes.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      v{v.versao_numero} — {v.titulo}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {v.criado_em ? new Date(v.criado_em).toLocaleString("pt-BR") : "—"}
                      {v.remetente && ` · ${v.remetente.nome}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[v.situacao] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[v.situacao] ?? v.situacao}
                    </span>
                    {v.url_arquivo && (
                      <a href={v.url_arquivo} target="_blank" rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 text-xs">
                        Ver
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
