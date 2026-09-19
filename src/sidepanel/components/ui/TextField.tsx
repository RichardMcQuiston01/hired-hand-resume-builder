import type { ChangeEvent, ReactElement } from 'react';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'url' | 'month';
  placeholder?: string;
  required?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
}: TextFieldProps): ReactElement {
  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    onChange(event.target.value);
  }

  return (
    <label className="flex flex-1 flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className="rounded border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
      />
    </label>
  );
}
