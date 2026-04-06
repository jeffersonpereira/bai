"use client";
import { PatternFormat } from "react-number-format";

interface PhoneInputProps {
  name?: string;
  value: string | undefined;
  onChange?: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export default function PhoneInput({
  name,
  value,
  onChange,
  required = false,
  className = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-700",
  placeholder = "(11) 99999-9999"
}: PhoneInputProps) {
  return (
    <PatternFormat
      name={name}
      value={value}
      format="(##) #####-####"
      mask="_"
      onValueChange={(values) => {
        if (onChange) onChange(values.formattedValue);
      }}
      required={required}
      className={className}
      placeholder={placeholder}
    />
  );
}
