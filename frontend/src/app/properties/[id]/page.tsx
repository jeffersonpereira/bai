"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import PhoneInput from "@/app/components/ui/PhoneInput";
import { useToast } from "@/app/components/ui/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Property {
  id: number;
  title: string;
  price: number;
  city: string | null;
  neighborhood: string | null;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  garage_spaces: number | null;
  description: string | null;
  full_address: string | null;
  image_url: string | null;
  source: string | null;
  source_url: string | null;
  listing_type: string | null;
  property_type: string | null;
  created_at: string;
  owner_id: number | null;
  owner: { name: string; role: string; phone: string | null; creci: string | null } | null;
  media: { media_type: string; url: string }[];
  market_score?: number | null;
}

interface VisitSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition text-xl font-bold"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

// ─── Visit modal ──────────────────────────────────────────────────────────────

function VisitModal({
  propertyId,
  availability,
  defaultName,
  defaultPhone,
  onClose,
}: {
  propertyId: string;
  availability: VisitSlot[];
  defaultName: string;
  defaultPhone: string;
  onClose: () => void;
}) {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({ visitor_name: defaultName, visitor_phone: defaultPhone, visit_date: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("bai_token");
      const res = await fetch(`${API}/api/v1/appointments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          property_id: Number(propertyId),
          visitor_name: form.visitor_name,
          visitor_phone: form.visitor_phone,
          visit_date: new Date(form.visit_date).toISOString(),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Erro ao agendar");
      setDone(true);
      success("Visita agendada! Aguarde a confirmação do corretor.");
      setTimeout(onClose, 2500);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Erro ao agendar visita");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-8">
        <h3 className="text-2xl font-black text-slate-900 mb-1">Agendar Visita</h3>
        <p className="text-slate-500 text-sm mb-6">O corretor confirmará o horário com você pelo WhatsApp.</p>

        {done ? (
          <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl text-center font-bold border border-emerald-100">
            Solicitação enviada! Aguarde o contato do corretor.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {availability.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-[10px] font-black tracking-widest text-blue-600 uppercase mb-2">Horários disponíveis</p>
                <div className="flex flex-wrap gap-2">
                  {availability.map((a, i) => (
                    <span key={i} className="bg-white px-3 py-1.5 rounded-lg text-[10px] font-bold text-blue-700 border border-blue-100">
                      {DAY_LABELS[a.day_of_week]}: {a.start_time.slice(0, 5)}h–{a.end_time.slice(0, 5)}h
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nome completo</label>
              <input required type="text" className="input-base" value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">WhatsApp</label>
              <PhoneInput required className="input-base" value={form.visitor_phone} onChange={(v) => setForm({ ...form, visitor_phone: v })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Data e hora sugerida</label>
              <input required type="datetime-local" className="input-base" value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value })} />
            </div>
            <button type="submit" disabled={submitting} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black py-4 rounded-xl transition shadow-lg shadow-blue-600/20">
              {submitting ? "Enviando..." : "Confirmar Agendamento"}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}

// ─── Proposal modal ───────────────────────────────────────────────────────────

function ProposalModal({
  propertyId,
  propertyPrice,
  defaultName,
  defaultEmail,
  defaultPhone,
  onClose,
}: {
  propertyId: string;
  propertyPrice: number;
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
  onClose: () => void;
}) {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({
    proposed_price: String(propertyPrice),
    payment_method: "financiamento",
    financing_percentage: "80",
    conditions: "",
    message: "",
    buyer_name: defaultName,
    buyer_email: defaultEmail,
    buyer_phone: defaultPhone,
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("bai_token");
      const body = {
        property_id: Number(propertyId),
        proposed_price: Number(form.proposed_price),
        payment_method: form.payment_method,
        financing_percentage: form.payment_method !== "avista" ? Number(form.financing_percentage) : null,
        conditions: form.conditions || null,
        message: form.message || null,
        buyer_name: form.buyer_name,
        buyer_email: form.buyer_email || null,
        buyer_phone: form.buyer_phone || null,
      };
      const res = await fetch(`${API}/api/v1/proposals/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Erro ao enviar proposta");
      setDone(true);
      success("Proposta enviada! O corretor analisará em breve.");
      setTimeout(onClose, 2500);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Erro ao enviar proposta");
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const proposed = Number(form.proposed_price) || 0;
  const diff = proposed - propertyPrice;
  const diffPct = propertyPrice > 0 ? ((diff / propertyPrice) * 100).toFixed(1) : "0";

  return (
    <Modal onClose={onClose}>
      <div className="p-8">
        <h3 className="text-2xl font-black text-slate-900 mb-1">Fazer Proposta</h3>
        <p className="text-slate-500 text-sm mb-6">Sua proposta será encaminhada diretamente ao corretor responsável.</p>

        {done ? (
          <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl text-center font-bold border border-emerald-100">
            Proposta enviada com sucesso! Acompanhe o status no seu painel.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Price */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Valor da proposta</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                <input
                  required
                  type="number"
                  min={1}
                  step={1000}
                  className="input-base pl-10"
                  value={form.proposed_price}
                  onChange={(e) => setForm({ ...form, proposed_price: e.target.value })}
                />
              </div>
              {proposed > 0 && (
                <p className={`text-xs mt-1.5 font-semibold ${diff < 0 ? "text-emerald-600" : diff > 0 ? "text-amber-600" : "text-slate-400"}`}>
                  {diff === 0 ? "Igual ao preço pedido" : `${diff < 0 ? "▼" : "▲"} ${Math.abs(Number(diffPct))}% em relação a ${fmt(propertyPrice)}`}
                </p>
              )}
            </div>

            {/* Payment method */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Forma de pagamento</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: "avista", label: "À Vista" },
                  { val: "financiamento", label: "Financiamento" },
                  { val: "misto", label: "Misto" },
                ].map(({ val, label }) => (
                  <label
                    key={val}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-xs font-bold transition select-none ${
                      form.payment_method === val
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={val}
                      checked={form.payment_method === val}
                      onChange={() => setForm({ ...form, payment_method: val })}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Financing % */}
            {form.payment_method !== "avista" && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  % a financiar ({form.financing_percentage}%)
                </label>
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={form.financing_percentage}
                  onChange={(e) => setForm({ ...form, financing_percentage: e.target.value })}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                  <span>10%</span>
                  <span className="font-bold text-blue-600">{fmt((proposed * Number(form.financing_percentage)) / 100)} financiado</span>
                  <span>90%</span>
                </div>
              </div>
            )}

            {/* Conditions */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Condições especiais <span className="normal-case font-normal">(opcional)</span></label>
              <input
                type="text"
                placeholder="Ex: prazo de 30 dias para desocupação, reformas incluídas..."
                className="input-base"
                value={form.conditions}
                onChange={(e) => setForm({ ...form, conditions: e.target.value })}
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mensagem ao corretor <span className="normal-case font-normal">(opcional)</span></label>
              <textarea
                rows={3}
                placeholder="Apresente-se e explique seu interesse..."
                className="input-base resize-none"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>

            {/* Contact */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Seus dados de contato</p>
              <input required type="text" placeholder="Nome completo" className="input-base bg-white" value={form.buyer_name} onChange={(e) => setForm({ ...form, buyer_name: e.target.value })} />
              <input type="email" placeholder="E-mail (opcional)" className="input-base bg-white" value={form.buyer_email} onChange={(e) => setForm({ ...form, buyer_email: e.target.value })} />
              <PhoneInput required className="input-base bg-white" value={form.buyer_phone} onChange={(v) => setForm({ ...form, buyer_phone: v })} />
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black py-4 rounded-xl transition shadow-lg shadow-blue-600/20">
              {submitting ? "Enviando..." : "Enviar Proposta"}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const propertyId = resolvedParams.id;
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [imovel, setImovel] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; email: string; phone: string; role: string; plan_type?: string } | null>(null);
  const [availability, setAvailability] = useState<VisitSlot[]>([]);
  const [matchingBuyers, setMatchingBuyers] = useState<{ user_id: number; name: string; email: string; phone: string; match_score: number; profile: { city: string; neighborhood: string; financing_approved: boolean } }[]>([]);

  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [favStatus, setFavStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    const load = async () => {
      try {
        const [propRes, availRes] = await Promise.all([
          fetch(`${API}/api/v1/properties/${propertyId}`),
          fetch(`${API}/api/v1/properties/${propertyId}/availability`),
        ]);
        if (!propRes.ok) throw new Error("Imóvel não encontrado");
        const prop: Property = await propRes.json();
        setImovel(prop);
        if (availRes.ok) setAvailability(await availRes.json());

        const token = localStorage.getItem("bai_token");
        if (token) {
          const userRes = await fetch(`${API}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (userRes.ok) {
            const user = await userRes.json();
            setCurrentUser(user);
            if (["agency", "broker", "admin"].includes(user.role) || prop.owner_id === user.id) {
              const buyersRes = await fetch(`${API}/api/v1/match/buyers/${propertyId}`, { headers: { Authorization: `Bearer ${token}` } });
              if (buyersRes.ok) setMatchingBuyers(await buyersRes.json());
            }
          }
        }

        // Registrar visualização silenciosamente
        fetch(`${API}/api/v1/properties/${propertyId}/view`, { method: "POST" }).catch(() => {});

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [propertyId]);

  const handleFavorite = async () => {
    const token = localStorage.getItem("bai_token");
    if (!token) { router.push("/login"); return; }
    setFavStatus("saving");
    try {
      const res = await fetch(`${API}/api/v1/favorites/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ property_id: Number(propertyId) }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Erro");
      setFavStatus("saved");
      success("Imóvel salvo nos favoritos!");
    } catch (err: unknown) {
      setFavStatus("error");
      toastError(err instanceof Error ? err.message : "Não foi possível salvar");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="skeleton h-6 w-32 mb-6 rounded-lg" />
        <div className="skeleton rounded-3xl h-[60vh] mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton h-8 w-2/3 rounded-xl" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-4/5 rounded" />
          </div>
          <div className="skeleton rounded-3xl h-96" />
        </div>
      </div>
    );
  }

  if (error || !imovel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-bold text-lg mb-4">{error ?? "Imóvel não encontrado"}</p>
          <Link href="/search" className="text-blue-600 hover:underline font-medium">← Voltar à busca</Link>
        </div>
      </div>
    );
  }

  const images = [imovel.image_url, ...(imovel.media?.filter((m) => m.media_type === "image").map((m) => m.url) ?? [])].filter(Boolean) as string[];
  const videos = imovel.media?.filter((m) => m.media_type === "video").map((m) => m.url) ?? [];
  const fmtPrice = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(imovel.price);
  const isBroker = currentUser && ["agency", "broker", "admin"].includes(currentUser.role);

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/search" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium mb-6 transition text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Voltar aos resultados
        </Link>

        {/* ── Image gallery ── */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 mb-12">
          <div className="relative h-[55vh] bg-slate-200">
            <img
              src={images[activeImageIndex] ?? "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80"}
              alt={imovel.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex flex-wrap gap-2 mb-3">
                {imovel.source && (
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {imovel.source}
                  </span>
                )}
                {imovel.listing_type && (
                  <span className="bg-white/20 backdrop-blur text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/30">
                    {imovel.listing_type === "venda" ? "Venda" : "Aluguel"}
                  </span>
                )}
                {imovel.neighborhood && (
                  <span className="bg-white/20 backdrop-blur text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/30">
                    {imovel.neighborhood}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-lg">{imovel.title}</h1>
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto bg-slate-900 hide-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`flex-shrink-0 w-28 h-18 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? "border-blue-500 opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* ── Body ── */}
          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* ── Left column ── */}
              <div className="lg:col-span-2 space-y-10">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Área", value: imovel.area ? `${imovel.area}m²` : "—", icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                    )},
                    { label: "Quartos", value: imovel.bedrooms ?? "—", icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    )},
                    { label: "Banheiros", value: imovel.bathrooms ?? "—", icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )},
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                      <span className="text-slate-400 mb-2">{icon}</span>
                      <span className="text-xl font-black text-slate-900">{value}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <div>
                  <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-blue-600 rounded-full" />
                    Sobre este imóvel
                  </h2>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {imovel.description ?? "Nenhuma descrição disponível para este anúncio."}
                  </p>
                </div>

                {/* Map */}
                {imovel.full_address && (
                  <div className="pt-8 border-t border-slate-100">
                    <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                      <span className="w-1 h-5 bg-red-500 rounded-full" />
                      Localização
                    </h2>
                    <div className="w-full h-72 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(imovel.full_address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        allowFullScreen
                        title="Mapa"
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 max-w-xs truncate">
                        {imovel.full_address}
                      </div>
                    </div>
                  </div>
                )}

                {/* Analytics / Market Score (Freemium Paywall) */}
                {(isBroker || (currentUser && imovel.owner_id === currentUser.id)) && (
                  <div className="pt-8 border-t border-slate-100">
                    <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                       <span className="w-1 h-5 bg-purple-600 rounded-full" />
                       Análise de Inteligência (Market Score)
                    </h2>
                    
                    {(!currentUser?.plan_type || currentUser.plan_type === 'free') ? (
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative overflow-hidden">
                        <div className="blur-md pointer-events-none select-none opacity-40">
                          <p className="font-bold text-slate-700">Market Score: 85/100</p>
                          <p className="text-sm mt-2">Imóvel apresenta excelente oportunidade de liquidez. O preço está otimizado para a região com alta probabilidade de venda em 30 dias.</p>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 bg-white/20 backdrop-blur-[2px]">
                          <div className="bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3 shadow-sm border border-purple-200">
                            Recurso Premium
                          </div>
                          <p className="text-slate-800 text-sm font-bold mb-4 max-w-md">
                            Assine um plano premium para visualizar o Market Score do imóvel e obter predições detalhadas de vendas.
                          </p>
                          <Link href="/dashboard/settings/plan" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-sm text-sm">
                            Desbloquear Análise
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 shadow-sm">
                        <div className="flex items-end gap-3 mb-2">
                          <div className="text-4xl font-black text-purple-700">{imovel.market_score || 'N/A'}</div>
                          <div className="text-sm font-bold text-purple-600 uppercase tracking-widest pb-1">Pontuação de Mercado</div>
                        </div>
                        <p className="text-purple-800 text-sm font-medium leading-relaxed">
                          Baseado em nossa IA e dados de mercado atualizados, este imóvel recebeu uma nota de atratividade que avalia preço, região, liquidez e atributos extras.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Availability */}
                {availability.length > 0 && (
                  <div className="pt-8 border-t border-slate-100">
                    <h2 className="text-lg font-black text-blue-600 mb-4 flex items-center gap-2">
                      <span className="w-1 h-5 bg-blue-600 rounded-full" />
                      Disponibilidade para visitas
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availability.map((a, i) => (
                        <div key={i} className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">
                              {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][a.day_of_week]}
                            </div>
                            <div className="text-[10px] text-blue-600 font-bold">
                              {a.start_time.slice(0,5)}–{a.end_time.slice(0,5)}h
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {videos.length > 0 && (
                  <div className="pt-8 border-t border-slate-100">
                    <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                      <span className="w-1 h-5 bg-indigo-600 rounded-full" />
                      Vídeos
                    </h2>
                    {videos.map((vid, idx) => {
                      const isYT = vid.includes("youtube.com") || vid.includes("youtu.be");
                      const embedUrl = isYT
                        ? vid.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/").split("&")[0]
                        : vid;
                      return isYT ? (
                        <iframe key={idx} className="w-full aspect-video rounded-2xl border border-slate-100" src={embedUrl} allowFullScreen title={`Vídeo ${idx + 1}`} />
                      ) : (
                        <a key={idx} href={vid} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-indigo-50 text-indigo-700 p-5 rounded-2xl font-bold hover:bg-indigo-100 transition border border-indigo-100">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          Assistir vídeo externo
                        </a>
                      );
                    })}
                  </div>
                )}

                {/* Matching buyers (broker view) */}
                {isBroker && matchingBuyers.length > 0 && (
                  <div className="pt-8 border-t border-slate-100">
                    <h2 className="text-lg font-black text-emerald-600 mb-2 flex items-center gap-2">
                      <span className="w-1 h-5 bg-emerald-500 rounded-full" />
                      Compradores com match ({matchingBuyers.length})
                    </h2>
                    <p className="text-slate-500 text-sm mb-5">Perfis de busca alinhados com este imóvel.</p>
                    <div className="grid gap-3">
                      {matchingBuyers.map((b) => (
                        <div key={b.user_id} className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-900">{b.name ?? "Usuário"}</span>
                              <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">{b.match_score}% match</span>
                              {b.profile.financing_approved && (
                                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Crédito aprovado</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {[b.profile.city, b.profile.neighborhood].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                          {b.phone && (
                            <a
                              href={`https://wa.me/55${b.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100 text-xs text-slate-400 font-medium">
                  Publicado em {new Date(imovel.created_at).toLocaleDateString("pt-BR")}
                  {imovel.source && <> via <strong>{imovel.source}</strong></>}
                </div>
              </div>

              {/* ── Sidebar ── */}
              <div className="lg:col-span-1">
                <div className="bg-slate-900 rounded-3xl p-7 text-white sticky top-24 shadow-2xl shadow-slate-900/20 overflow-hidden">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-600/15 blur-3xl rounded-full pointer-events-none" />

                  <div className="relative z-10 space-y-5">
                    {/* Price */}
                    <div>
                      <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                        {imovel.listing_type === "aluguel" ? "Aluguel mensal" : "Valor do imóvel"}
                      </div>
                      <div className="text-3xl font-black tracking-tight">{fmtPrice}</div>
                    </div>

                    <div className="border-t border-white/10 pt-5 space-y-3">
                      {/* PRIMARY — Schedule visit */}
                      <button
                        onClick={() => setShowVisitModal(true)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Agendar Visita
                      </button>

                      {/* SECONDARY — Make proposal */}
                      <button
                        onClick={() => setShowProposalModal(true)}
                        className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black py-4 rounded-2xl transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Fazer Proposta
                      </button>

                      {/* TERTIARY — Save */}
                      <button
                        onClick={handleFavorite}
                        disabled={favStatus === "saved" || favStatus === "saving"}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                      >
                        <svg className={`w-4 h-4 ${favStatus === "saved" ? "fill-red-400 text-red-400" : "fill-none"}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        {favStatus === "saved" ? "Salvo!" : favStatus === "saving" ? "Salvando..." : "Salvar nos favoritos"}
                      </button>
                    </div>

                    {/* Owner info */}
                    {imovel.owner ? (
                      <div className="border-t border-white/10 pt-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-sm font-black shrink-0">
                            {imovel.owner.name?.[0] ?? "C"}
                          </div>
                          <div>
                            <div className="font-bold text-sm leading-tight">{imovel.owner.name}</div>
                            <div className="text-[10px] uppercase font-bold text-blue-400 tracking-widest">
                              {imovel.owner.role === "broker" ? "Corretor" : imovel.owner.role === "agency" ? "Imobiliária" : "Responsável"}
                              {imovel.owner.creci && ` · CRECI ${imovel.owner.creci}`}
                            </div>
                          </div>
                        </div>
                        {imovel.owner.phone && (
                          <a
                            href={`https://wa.me/55${imovel.owner.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-900/20"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                            Falar no WhatsApp
                          </a>
                        )}
                      </div>
                    ) : imovel.source_url && (
                      <div className="border-t border-white/10 pt-5">
                        <p className="text-xs text-slate-400 leading-relaxed mb-3">
                          Imóvel indexado de <span className="text-blue-400 font-bold">{imovel.source}</span>. Nosso time pode ajudá-lo a negociar com segurança.
                        </p>
                        <a
                          href={imovel.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                        >
                          Ver no site original
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showVisitModal && (
        <VisitModal
          propertyId={propertyId}
          availability={availability}
          defaultName={currentUser?.name ?? ""}
          defaultPhone={currentUser?.phone ?? ""}
          onClose={() => setShowVisitModal(false)}
        />
      )}
      {showProposalModal && (
        <ProposalModal
          propertyId={propertyId}
          propertyPrice={imovel.price}
          defaultName={currentUser?.name ?? ""}
          defaultEmail={currentUser?.email ?? ""}
          defaultPhone={currentUser?.phone ?? ""}
          onClose={() => setShowProposalModal(false)}
        />
      )}
    </>
  );
}
