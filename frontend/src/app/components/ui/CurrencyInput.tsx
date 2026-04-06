"use client";
import { useState, useEffect } from "react";
import { NumericFormat } from "react-number-format";

interface CurrencyInputProps {
  name?: string;
  value: number | string | undefined;
  onChange?: (value: number | undefined) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export default function CurrencyInput({
  name,
  value,
  onChange,
  required = false,
  className = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-700",
  placeholder = "R$ 0,00"
}: CurrencyInputProps) {
  const [numericValue, setNumericValue] = useState<number | undefined>(
    typeof value === "string" ? parseFloat(value) : value
  );

  // Sincroniza se o valor prop mudar (ex: ao limpar filtros)
  useEffect(() => {
    setNumericValue(typeof value === "string" ? parseFloat(value) : value);
  }, [value]);

  return (
    <>
      {name && <input type="hidden" name={name} value={numericValue !== undefined && !isNaN(numericValue) ? numericValue : ""} />}
      <NumericFormat
        value={value}
        onValueChange={(values) => {
          setNumericValue(values.floatValue);
          if (onChange) onChange(values.floatValue);
        }}
        thousandSeparator="."
        decimalSeparator=","
        prefix="R$ "
        decimalScale={2}
        fixedDecimalScale={true}
        allowNegative={false}
        required={required}
        className={className}
        placeholder={placeholder}
      />
    </>
  );
}
