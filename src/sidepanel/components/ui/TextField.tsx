import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'url' | 'month';
  placeholder?: string;
  required?: boolean;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  onKeyDown,
}: TextFieldProps): ReactElement {
  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    onChange(event.target.value);
  }

  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
      <span className="font-medium text-ink-900">
        {label}
        {required && <span className="text-danger-600"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        required={required}
        className="w-full min-w-0 rounded border border-border-subtle px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </label>
  );
}
