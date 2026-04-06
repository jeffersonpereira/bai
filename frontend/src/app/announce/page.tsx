"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CurrencyInput from "@/app/components/ui/CurrencyInput";
import NumberMaskInput from "@/app/components/ui/NumberMaskInput";

export default function AnnouncePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [owners, setOwners] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<{url: string, media_type: string}[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    valor_aluguel: "",
    listing_type: "venda",
    property_type: "apartamento",
    city: "",
    neighborhood: "",
    state: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    garage_spaces: "",
    financing_eligible: false,
    description: "",
    image_url: "",
    actual_owner_id: "",
    commission_percentage: "",
    full_address: "",
  });
  const [atributosExtras, setAtributosExtras] = useState({
    piscina: false,
    varanda: false,
    academia: false,
    churrasqueira: false,
    portaria_24h: false,
    elevador: false,
    pet_friendly: false,
    mobiliado: false,
    ar_condicionado: false,
    energia_solar: false,
  });
  const [availability, setAvailability] = useState<{day_of_week: number, start_time: string, end_time: string}[]>([]);
  const [showQuickOwner, setShowQuickOwner] = useState(false);
  const [quickOwner, setQuickOwner] = useState({ name: "", phone: "", email: "" });
  const [priceAnalysis, setPriceAnalysis] = useState<any>(null);
  const [analyzingPrice, setAnalyzingPrice] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem("bai_token");
      if (!token) { router.push("/login"); return; }
      try {
        const res = await fetch(`${API}/api/v1/crm/owners?limit=1000`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOwners(data.items || data);
        }
      } catch (err) { console.error(err); }
    };
    fetchInitialData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    if (["price", "area", "city", "neighborhood", "bedrooms", "listing_type"].includes(name)) {
      setPriceAnalysis(null);
    }
  };

  const handleQuickOwnerSave = async () => {
    if (!quickOwner.name) return;
    const token = localStorage.getItem("bai_token");
    const payload: any = { name: quickOwner.name };
    if (quickOwner.phone) payload.phone = quickOwner.phone;
    if (quickOwner.email) payload.email = quickOwner.email;

    try {
      const res = await fetch(`${API}/api/v1/crm/owners`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newOwner = await res.json();
        setOwners(prev => [...prev, newOwner]);
        setFormData(prev => ({ ...prev, actual_owner_id: String(newOwner.id) }));
        setShowQuickOwner(false);
        setQuickOwner({ name: "", phone: "", email: "" });
      }
    } catch (err) { console.error(err); }
  };

  const handleAnalyzePrice = async () => {
    const price = parseFloat(formData.price);
    const area = parseFloat(formData.area);
    if (!price || !area || !formData.city) return;
    setAnalyzingPrice(true);
    try {
      const res = await fetch(`${API}/api/v1/properties/price-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price,
          area,
          city: formData.city || null,
          neighborhood: formData.neighborhood || null,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          listing_type: formData.listing_type,
        }),
      });
      if (res.ok) setPriceAnalysis(await res.json());
    } catch (err) { console.error(err); }
    finally { setAnalyzingPrice(false); }
  };

  const handleAddMedia = (type: string) => setMediaItems([...mediaItems, { url: "", media_type: type }]);
  const handleMediaChange = (index: number, url: string) => {
    const updated = [...mediaItems];
    updated[index].url = url;
    setMediaItems(updated);
  };
  const handleRemoveMedia = (index: number) => {
    const updated = [...mediaItems];
    updated.splice(index, 1);
    setMediaItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const token = localStorage.getItem("bai_token");
    if (!token) { router.push("/login"); return; }

    try {
      const atributosAtivos = Object.fromEntries(
        Object.entries(atributosExtras).filter(([, v]) => v)
      );
      const res = await fetch(`${API}/api/v1/properties/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          valor_aluguel: formData.valor_aluguel ? parseFloat(formData.valor_aluguel) : null,
          area: formData.area ? parseFloat(formData.area) : null,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
          garage_spaces: formData.garage_spaces ? parseInt(formData.garage_spaces) : 0,
          financing_eligible: formData.financing_eligible,
          actual_owner_id: formData.actual_owner_id ? parseInt(formData.actual_owner_id) : null,
          commission_percentage: formData.commission_percentage ? parseFloat(formData.commission_percentage) : null,
          full_address: formData.full_address || null,
          state: formData.state || null,
          atributos_extras: Object.keys(atributosAtivos).length > 0 ? atributosAtivos : null,
          media: mediaItems.filter(m => m.url.trim() !== ""),
          availability_windows: availability
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Erro ao publicar anúncio");
      }

      setSuccess(true);
      setTimeout(() => router.push("/search"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const labelCls = "block text-sm font-semibold text-slate-600 mb-1.5";
  const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition text-slate-800 placeholder:text-slate-400";
  const selectCls = inputCls + " appearance-none";
  const sectionCls = "bg-slate-50 rounded-2xl p-6 space-y-5";

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Anuncie seu Imóvel</h1>
        <p className="text-slate-500 text-sm">Preencha os dados abaixo para publicar no marketplace BAI.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}
      {success && (
        <div className="mb-6 bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm font-medium border border-emerald-100 flex items-center gap-2">
          <span>✓</span> Imóvel publicado com sucesso! Redirecionando...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Informações Básicas */}
        <div className={sectionCls}>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Informações Básicas</h2>
          <div>
            <label className={labelCls}>Título do Anúncio</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required className={inputCls} placeholder="Ex: Apartamento Moderno no Centro" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className={labelCls}>Tipo de Negócio</label>
              <select name="listing_type" value={formData.listing_type} onChange={handleChange} className={selectCls}>
                <option value="venda">Venda</option>
                <option value="aluguel">Aluguel</option>
                <option value="ambos">Venda e Aluguel</option>
                <option value="temporada">Temporada</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className={labelCls}>Tipo de Imóvel</label>
              <select name="property_type" value={formData.property_type} onChange={handleChange} className={selectCls}>
                <option value="apartamento">Apartamento</option>
                <option value="casa">Casa</option>
                <option value="terreno">Terreno</option>
                <option value="comercial">Comercial</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className={labelCls}>Preço (R$)</label>
              <CurrencyInput value={formData.price} onChange={(val) => { setFormData({...formData, price: val !== undefined ? String(val) : ""}); setPriceAnalysis(null); }} required className={inputCls} placeholder="0,00" />
            </div>
          </div>
          {(formData.listing_type === "ambos" || formData.listing_type === "aluguel") && (
            <div>
              <label className={labelCls}>Valor de Aluguel (R$/mês)</label>
              <CurrencyInput value={formData.valor_aluguel} onChange={(val) => setFormData({...formData, valor_aluguel: val !== undefined ? String(val) : ""})} className={inputCls} placeholder="0,00" />
            </div>
          )}
          {formData.price && formData.area && formData.city && (
            <div>
              <button
                type="button"
                onClick={handleAnalyzePrice}
                disabled={analyzingPrice}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2 transition disabled:opacity-50"
              >
                {analyzingPrice ? "Analisando..." : "📊 Analisar preço vs. mercado"}
              </button>
              {priceAnalysis && priceAnalysis.status === "ok" && (
                <div className={`mt-3 p-4 rounded-2xl border flex items-start gap-3 ${
                  priceAnalysis.signal === "acima" ? "bg-red-50 border-red-100" :
                  priceAnalysis.signal === "abaixo" ? "bg-emerald-50 border-emerald-100" :
                  "bg-blue-50 border-blue-100"
                }`}>
                  <span className="text-xl mt-0.5">
                    {priceAnalysis.signal === "acima" ? "⚠️" : priceAnalysis.signal === "abaixo" ? "✅" : "📊"}
                  </span>
                  <div>
                    <p className={`text-sm font-black ${
                      priceAnalysis.signal === "acima" ? "text-red-700" :
                      priceAnalysis.signal === "abaixo" ? "text-emerald-700" :
                      "text-blue-700"
                    }`}>
                      {priceAnalysis.signal === "acima"
                        ? `Preço ${priceAnalysis.variation_pct}% acima do mercado`
                        : priceAnalysis.signal === "abaixo"
                        ? `Preço ${Math.abs(priceAnalysis.variation_pct)}% abaixo do mercado`
                        : "Preço dentro da média de mercado"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Seu preço/m²: <strong>R$ {priceAnalysis.my_price_per_m2.toLocaleString("pt-BR")}</strong> · Média local: <strong>R$ {priceAnalysis.avg_price_per_m2.toLocaleString("pt-BR")}</strong> · {priceAnalysis.comparables_count} imóveis comparados
                    </p>
                  </div>
                </div>
              )}
              {priceAnalysis && priceAnalysis.status === "insufficient_data" && (
                <p className="mt-2 text-xs text-slate-400">{priceAnalysis.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Localização */}
        <div className={sectionCls}>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Localização</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className={labelCls}>Cidade</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} required className={inputCls} placeholder="Ex: São Paulo" />
            </div>
            <div className="md:col-span-1">
              <label className={labelCls}>Bairro</label>
              <input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleChange} required className={inputCls} placeholder="Ex: Jardins" />
            </div>
            <div className="md:col-span-1">
              <label className={labelCls}>Estado (UF)</label>
              <input type="text" name="state" value={formData.state} onChange={handleChange} className={inputCls} placeholder="Ex: SP" maxLength={2} />
            </div>
          </div>
          <div className="pt-2">
            <label className={labelCls}>Endereço Completo (para visualização no mapa)</label>
            <input type="text" name="full_address" value={formData.full_address} onChange={handleChange} className={inputCls} placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP" />
          </div>
        </div>

        {/* Detalhes */}
        <div className={sectionCls}>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Detalhes do Imóvel</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Área (m²)</label>
              <NumberMaskInput value={formData.area} onChange={(val) => setFormData({...formData, area: val !== undefined ? String(val) : ""})} suffix=" m²" className={inputCls} placeholder="0 m²" />
            </div>
            <div>
              <label className={labelCls}>Quartos</label>
              <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className={inputCls} placeholder="0" min="0" />
            </div>
            <div>
              <label className={labelCls}>Banheiros</label>
              <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className={inputCls} placeholder="0" min="0" />
            </div>
            <div>
              <label className={labelCls}>Vagas</label>
              <input type="number" name="garage_spaces" value={formData.garage_spaces} onChange={handleChange} className={inputCls} placeholder="0" min="0" />
            </div>
          </div>
        </div>

        {/* Atributos e Diferenciais */}
        <div className={sectionCls}>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Atributos e Diferenciais</h2>
          <p className="text-xs text-slate-400 -mt-2">Marque os recursos disponíveis no imóvel.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.keys(atributosExtras) as Array<keyof typeof atributosExtras>).map((key) => {
              const labels: Record<string, string> = {
                piscina: "Piscina", varanda: "Varanda/Sacada", academia: "Academia",
                churrasqueira: "Churrasqueira", portaria_24h: "Portaria 24h", elevador: "Elevador",
                pet_friendly: "Pet Friendly", mobiliado: "Mobiliado",
                ar_condicionado: "Ar-condicionado", energia_solar: "Energia Solar",
              };
              return (
                <label key={key} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${atributosExtras[key] ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  <input
                    type="checkbox"
                    checked={atributosExtras[key]}
                    onChange={() => setAtributosExtras(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold">{labels[key]}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Comercial & CRM */}
        <div className={sectionCls}>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Comercial & CRM</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-600">Proprietário (Cliente CRM)</label>
                <button 
                  type="button" 
                  onClick={() => setShowQuickOwner(!showQuickOwner)}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition"
                >
                  {showQuickOwner ? "× Cancelar" : "+ Novo Rápido"}
                </button>
              </div>
              
              {showQuickOwner ? (
                <div className="bg-white border-2 border-dashed border-blue-100 p-4 rounded-xl space-y-3 animate-in fade-in zoom-in duration-200">
                  <input 
                    type="text" 
                    placeholder="Nome completo" 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                    value={quickOwner.name}
                    onChange={e => setQuickOwner({...quickOwner, name: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Telefone" 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                      value={quickOwner.phone}
                      onChange={e => setQuickOwner({...quickOwner, phone: e.target.value})}
                    />
                    <button 
                      type="button" 
                      onClick={handleQuickOwnerSave}
                      className="bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition"
                    >
                      Salvar e Selecionar
                    </button>
                  </div>
                </div>
              ) : (
                <select name="actual_owner_id" value={formData.actual_owner_id} onChange={handleChange} className={selectCls}>
                  <option value="">Nenhum — gestão direta</option>
                  {owners.map(owner => (
                    <option key={owner.id} value={owner.id}>{owner.name} ({owner.document || 'Sem doc'})</option>
                  ))}
                </select>
              )}
              <p className="mt-1.5 text-xs text-slate-400">Vincule um dono para gerenciar no CRM.</p>
            </div>
            <div className="flex flex-col justify-end pb-1">
              <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-3 rounded-xl hover:border-blue-200 transition-colors cursor-pointer group">
                <input 
                  type="checkbox" 
                  id="financing_eligible" 
                  name="financing_eligible" 
                  checked={formData.financing_eligible} 
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="financing_eligible" className="text-sm font-semibold text-slate-700 cursor-pointer group-hover:text-blue-600 transition-colors">
                  Aceita Financiamento Bancário
                </label>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Comissão (%)</label>
              <NumberMaskInput decimalScale={1} suffix=" %" value={formData.commission_percentage} onChange={(val) => setFormData({...formData, commission_percentage: val !== undefined ? String(val) : ""})} className={inputCls} placeholder="Ex: 6,0 %" />
            </div>
          </div>
        </div>

{/* Disponibilidade para Visitas */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Disponibilidade para Visitas</h2>
            <button 
              type="button" 
              onClick={() => setAvailability([...availability, { day_of_week: 1, start_time: "09:00", end_time: "17:00" }])}
              className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
            >
              + Adicionar Janela
            </button>
          </div>
          
          {availability.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 p-8 rounded-xl text-center">
              <p className="text-xs text-slate-400">Nenhuma janela de visita definida. <br/>Buyers poderão solicitar qualquer horário.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availability.map((window, idx) => (
                <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-left-2 duration-200">
                  <select 
                    value={window.day_of_week} 
                    onChange={e => {
                      const updated = [...availability];
                      updated[idx].day_of_week = parseInt(e.target.value);
                      setAvailability(updated);
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value={1}>Segunda</option>
                    <option value={2}>Terça</option>
                    <option value={3}>Quarta</option>
                    <option value={4}>Quinta</option>
                    <option value={5}>Sexta</option>
                    <option value={6}>Sábado</option>
                    <option value={0}>Domingo</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <input 
                      type="time" 
                      value={window.start_time} 
                      onChange={e => {
                        const updated = [...availability];
                        updated[idx].start_time = e.target.value;
                        setAvailability(updated);
                      }}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-32"
                    />
                    <span className="text-slate-400">até</span>
                    <input 
                      type="time" 
                      value={window.end_time} 
                      onChange={e => {
                        const updated = [...availability];
                        updated[idx].end_time = e.target.value;
                        setAvailability(updated);
                      }}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-32"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setAvailability(availability.filter((_, i) => i !== idx))} 
                    className="text-slate-300 hover:text-red-500 transition px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mídia */}
        <div className={sectionCls}>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Imagens e Vídeos</h2>
          <div>
            <label className={labelCls}>URL da Imagem de Capa</label>
            <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} className={inputCls} placeholder="https://..." />
            <p className="mt-1.5 text-xs text-slate-400">Esta será a imagem em destaque nas listagens.</p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-600">Mídias Adicionais</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleAddMedia('image')} className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">+ Foto</button>
                <button type="button" onClick={() => handleAddMedia('video')} className="text-xs font-bold bg-violet-50 text-violet-600 px-3 py-1.5 rounded-lg hover:bg-violet-100 transition">+ Vídeo</button>
                <button type="button" onClick={() => handleAddMedia('document')} className="text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition">+ Documento</button>
              </div>
            </div>
            {mediaItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-lg">{item.media_type === 'video' ? '🎬' : '📸'}</span>
                <input
                  type="text"
                  value={item.url}
                  onChange={e => handleMediaChange(idx, e.target.value)}
                  className={`flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition ${item.media_type === 'document' ? 'border-emerald-100' : ''}`}
                  placeholder={`URL ${item.media_type === 'video' ? 'do Vídeo (YouTube...)' : item.media_type === 'document' ? 'do Documento (PDF...)' : 'da Imagem'}`}
                />
                <button type="button" onClick={() => handleRemoveMedia(idx)} className="text-slate-300 hover:text-red-400 text-xl px-1.5 transition">×</button>
              </div>
            ))}
          </div>

          <div>
            <label className={labelCls}>Descrição Detalhada</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className={inputCls + " resize-none"} placeholder="Conte mais sobre o imóvel..."></textarea>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3.5 rounded-xl text-white font-bold text-base transition-all ${loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 hover:shadow-lg'}`}
        >
          {loading ? "Publicando..." : "Publicar Anúncio"}
        </button>
      </form>
    </div>
  );
}
