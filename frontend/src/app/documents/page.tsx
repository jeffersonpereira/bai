"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

const DOC_TYPES = [
  { value: "contrato", label: "Contrato" },
  { value: "escritura", label: "Escritura" },
  { value: "procuração", label: "Procuração" },
  { value: "rgi", label: "RGI" },
  { value: "laudo", label: "Laudo" },
  { value: "cnh", label: "CNH" },
  { value: "comprovante_renda", label: "Comprovante de Renda" },
  { value: "outros", label: "Outros" },
];

const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  pendente_assinatura: "Pendente Assinatura",
  assinado: "Assinado",
  arquivado: "Arquivado",
};

const STATUS_COLORS: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-700",
  pendente_assinatura: "bg-yellow-100 text-yellow-800",
  assinado: "bg-green-100 text-green-800",
  arquivado: "bg-blue-100 text-blue-800",
};

interface Document {
  id: number;
  title: string;
  doc_type: string;
  description?: string;
  file_name?: string;
  file_url?: string;
  status: string;
  property_id?: number;
  proposal_id?: number;
  notes?: string;
  created_at: string;
  uploader?: { id: number; name: string };
  property?: { id: number; title: string };
  proposal?: { id: number; proposed_price: number; status: string };
}

export default function DocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [form, setForm] = useState({
    title: "", doc_type: "contrato", description: "", file_name: "",
    file_url: "", status: "rascunho", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("bai_token") : null;

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50", skip: "0" });
      if (filterType) params.set("doc_type", filterType);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`${API}/api/v1/documents/?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) throw new Error("Erro ao carregar documentos");
      const data = await res.json();
      setDocs(data.items);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchDocs();
  }, [filterType, filterStatus]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", doc_type: "contrato", description: "", file_name: "", file_url: "", status: "rascunho", notes: "" });
    setShowModal(true);
  };

  const openEdit = (doc: Document) => {
    setEditing(doc);
    setForm({
      title: doc.title, doc_type: doc.doc_type, description: doc.description ?? "",
      file_name: doc.file_name ?? "", file_url: doc.file_url ?? "",
      status: doc.status, notes: doc.notes ?? "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        ...form,
        description: form.description || undefined,
        file_name: form.file_name || undefined,
        file_url: form.file_url || undefined,
        notes: form.notes || undefined,
      };
      const url = editing ? `${API}/api/v1/documents/${editing.id}` : `${API}/api/v1/documents/`;
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Erro ao salvar");
      }
      setShowModal(false);
      fetchDocs();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este documento?")) return;
    await fetch(`${API}/api/v1/documents/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchDocs();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documentos e Contratos</h1>
            <p className="text-gray-500 text-sm mt-1">{total} documento{total !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
            + Novo Documento
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Todos os tipos</option>
            {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando...</div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">Nenhum documento encontrado</p>
            <button onClick={openCreate} className="text-blue-600 text-sm hover:underline">Adicionar o primeiro</button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Título</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Imóvel</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Data</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{doc.title}</div>
                      {doc.file_name && <div className="text-gray-400 text-xs">{doc.file_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {DOC_TYPES.find((t) => t.value === doc.doc_type)?.label ?? doc.doc_type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[doc.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {STATUS_LABELS[doc.status] ?? doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {doc.property?.title ?? (doc.property_id ? `#${doc.property_id}` : "—")}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 text-xs">
                            Ver
                          </a>
                        )}
                        <button onClick={() => openEdit(doc)} className="text-gray-500 hover:text-gray-700 text-xs">Editar</button>
                        <button onClick={() => handleDelete(doc.id)} className="text-red-400 hover:text-red-600 text-xs">Remover</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editing ? "Editar Documento" : "Novo Documento"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Título *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex: Contrato de Compra e Venda" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo *</label>
                  <select value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome do arquivo</label>
                  <input value={form.file_name} onChange={(e) => setForm({ ...form, file_name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="contrato.pdf" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">URL do arquivo</label>
                  <input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.title}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
