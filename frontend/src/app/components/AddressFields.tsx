"use client";
import { useState, useEffect, useCallback } from "react";

const IBGE = "https://servicodados.ibge.gov.br/api/v1/localidades";

export interface AddressValue {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement: string;
}

export const emptyAddress = (): AddressValue => ({
  cep: "", state: "", city: "", neighborhood: "", street: "", number: "", complement: "",
});

export function formatFullAddress(addr: AddressValue): string {
  const parts: string[] = [];
  if (addr.street) parts.push(addr.street);
  if (addr.number) parts.push(addr.number);
  if (addr.complement) parts.push(addr.complement);
  if (addr.neighborhood) parts.push(addr.neighborhood);
  if (addr.city) parts.push(addr.city);
  if (addr.state) parts.push(addr.state);
  if (addr.cep) parts.push(`CEP ${addr.cep}`);
  return parts.join(", ");
}

interface State { id: number; sigla: string; nome: string; }
interface City  { id: number; nome: string; }

interface AddressFieldsProps {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  inputCls?: string;
  labelCls?: string;
  required?: boolean;
}

const defaultInput = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition text-slate-800 placeholder:text-slate-400";
const defaultLabel = "block text-sm font-semibold text-slate-600 mb-1.5";

export default function AddressFields({ value, onChange, inputCls = defaultInput, labelCls = defaultLabel, required = false }: AddressFieldsProps) {
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [citiesLoading, setCitiesLoading] = useState(false);

  useEffect(() => {
    fetch(`${IBGE}/estados?orderBy=nome`)
      .then(r => r.json())
      .then(setStates)
      .catch(() => {});
  }, []);

  const loadCities = useCallback(async (uf: string) => {
    if (!uf) { setCities([]); return; }
    setCitiesLoading(true);
    try {
      const res = await fetch(`${IBGE}/estados/${uf}/municipios?orderBy=nome`);
      setCities(await res.json());
    } catch {
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCities(value.state);
  }, [value.state, loadCities]);

  const set = (fields: Partial<AddressValue>) => onChange({ ...value, ...fields });

  const handleCepChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    set({ cep: formatted });
    setCepError("");

    if (digits.length === 8) {
      setCepLoading(true);
      fetch(`https://viacep.com.br/ws/${digits}/json/`)
        .then(r => r.json())
        .then(data => {
          if (data.erro) {
            setCepError("CEP não encontrado.");
            return;
          }
          onChange({
            ...value,
            cep: formatted,
            state: data.uf ?? value.state,
            city: data.localidade ?? value.city,
            neighborhood: data.bairro ?? value.neighborhood,
            street: data.logradouro ?? value.street,
            complement: data.complemento ?? value.complement,
            number: value.number,
          });
        })
        .catch(() => setCepError("Erro ao consultar CEP."))
        .finally(() => setCepLoading(false));
    }
  };

  return (
    <div className="space-y-4">
      {/* Linha 1: CEP + Estado + Cidade */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className={labelCls}>CEP</label>
          <div className="relative">
            <input
              type="text"
              value={value.cep}
              onChange={e => handleCepChange(e.target.value)}
              className={inputCls}
              placeholder="00000-000"
              maxLength={9}
            />
            {cepLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-500 animate-pulse">buscando...</span>
            )}
          </div>
          {cepError && <p className="mt-1 text-xs text-red-500">{cepError}</p>}
        </div>

        <div>
          <label className={labelCls}>Estado (UF)</label>
          <select
            value={value.state}
            onChange={e => { set({ state: e.target.value, city: "" }); }}
            className={`${inputCls} appearance-none`}
            required={required}
          >
            <option value="">Selecione</option>
            {states.map(s => (
              <option key={s.sigla} value={s.sigla}>{s.sigla} — {s.nome}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>Cidade</label>
          <select
            value={value.city}
            onChange={e => set({ city: e.target.value })}
            className={`${inputCls} appearance-none`}
            required={required}
            disabled={!value.state || citiesLoading}
          >
            <option value="">{citiesLoading ? "Carregando..." : value.state ? "Selecione" : "Selecione o estado primeiro"}</option>
            {cities.map(c => (
              <option key={c.id} value={c.nome}>{c.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Linha 2: Logradouro + Número + Complemento */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
        <div className="col-span-2 md:col-span-3">
          <label className={labelCls}>Logradouro</label>
          <input
            type="text"
            value={value.street}
            onChange={e => set({ street: e.target.value })}
            className={inputCls}
            placeholder="Ex: Av. Paulista"
          />
        </div>
        <div>
          <label className={labelCls}>Número</label>
          <input
            type="text"
            value={value.number}
            onChange={e => set({ number: e.target.value })}
            className={inputCls}
            placeholder="Ex: 1000"
          />
        </div>
        <div>
          <label className={labelCls}>Complemento</label>
          <input
            type="text"
            value={value.complement}
            onChange={e => set({ complement: e.target.value })}
            className={inputCls}
            placeholder="Apto, Sala..."
          />
        </div>
      </div>

      {/* Linha 3: Bairro */}
      <div>
        <label className={labelCls}>Bairro</label>
        <input
          type="text"
          value={value.neighborhood}
          onChange={e => set({ neighborhood: e.target.value })}
          className={inputCls}
          placeholder="Ex: Bela Vista"
          required={required}
        />
      </div>
    </div>
  );
}
