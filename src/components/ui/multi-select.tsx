// src/components/ui/multi-select.tsx
'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <div className="relative">
      <div
        onClick={() => setOpen(!open)}
        className="flex min-h-10 w-full cursor-pointer items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        <div className="flex flex-wrap gap-1">
          {selected.length === 0 && <span className="text-gray-500">{placeholder}</span>}
          {selected.map((value) => {
            const opt = options.find((o) => o.value === value);
            return (
              <span
                key={value}
                className="flex items-center gap-1 rounded bg-[rgb(var(--color-primary))] px-2 py-1 text-xs text-white"
              >
                {opt?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(value);
                  }}
                />
              </span>
            );
          })}
        </div>
      </div>

      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="h-4 w-4 rounded border-gray-300 text-[rgb(var(--color-primary))]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}