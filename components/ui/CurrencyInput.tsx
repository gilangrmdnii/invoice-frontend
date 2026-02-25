'use client';

import { useState, useCallback } from 'react';

function formatRupiah(value: number): string {
  if (!value && value !== 0) return '';
  return new Intl.NumberFormat('id-ID').format(value);
}

function parseRupiah(str: string): number {
  const cleaned = str.replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder,
  required,
  min,
  max,
  className = '',
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(() =>
    value ? formatRupiah(value) : ''
  );

  const handleFocus = useCallback(() => {
    setFocused(true);
    setDisplayValue(value ? String(value) : '');
  }, [value]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    setDisplayValue(value ? formatRupiah(value) : '');
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (focused) {
        // Only allow digits when focused
        const cleaned = raw.replace(/[^\d]/g, '');
        setDisplayValue(cleaned);
        onChange(cleaned ? parseInt(cleaned, 10) : 0);
      } else {
        const num = parseRupiah(raw);
        setDisplayValue(formatRupiah(num));
        onChange(num);
      }
    },
    [focused, onChange]
  );

  return (
    <input
      type="text"
      inputMode="numeric"
      required={required}
      value={focused ? displayValue : value ? formatRupiah(value) : ''}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      min={min}
      max={max}
      className={className}
    />
  );
}
