"use client";
import { useState, KeyboardEvent } from "react";

interface RegionTagsInputProps {
  value: string;
  name?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  suggestions?: string[];
}

export default function RegionTagsInput({ value, name, onChange, placeholder = "Ex: Centro", suggestions = [] }: RegionTagsInputProps) {
  const tags = value ? value.split(",").map(t => t.trim()).filter(Boolean) : [];
  const [inputValue, setInputValue] = useState("");

  const addTag = (tag: string) => {
    const newTag = tag.trim();
    if (newTag && !tags.includes(newTag)) {
      const newTags = [...tags, newTag];
      const newValue = newTags.join(",");
      if (onChange) onChange(newValue);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue.trim());
    }
    setInputValue("");
  };

  const removeTag = (indexToRemove: number) => {
    const newTags = tags.filter((_, index) => index !== indexToRemove);
    const newValue = newTags.join(",");
    if (onChange) onChange(newValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
      setInputValue("");
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="w-full relative group">
      {/* Hidden input for native form submissions */}
      {name && <input type="hidden" name={name} value={tags.join(",")} />}
      
      <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/50 focus-within:bg-white transition-all duration-300 cursor-text min-h-[56px] shadow-sm group-hover:border-slate-300">
        {tags.map((tag, idx) => (
          <span key={idx} className="flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-black px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm animate-in fade-in zoom-in duration-200">
            {tag.toUpperCase()}
            <button 
              type="button" 
              onClick={() => removeTag(idx)} 
              className="hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center rounded-full w-4 h-4 text-[10px]"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="flex-1 min-w-[140px] bg-transparent outline-none text-slate-800 font-semibold px-2 py-1 placeholder:text-slate-400 placeholder:font-medium"
          placeholder={tags.length === 0 ? placeholder : "Adicionar outro..."}
          list="region-suggestions"
        />
        {suggestions.length > 0 && (
          <datalist id="region-suggestions">
            {suggestions.map((sg, idx) => (
              <option key={idx} value={sg} />
            ))}
          </datalist>
        )}
      </div>
      <div className="flex justify-between items-center mt-2 px-1">
        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
          {tags.length > 0 ? `${tags.length} selecionado(s)` : "Nenhuma região selecionada"}
        </p>
        <p className="text-[9px] text-slate-300 font-bold italic">ENTER para inserir</p>
      </div>
    </div>
  );
}
