import type { ChangeEvent, ReactElement } from 'react';

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: CheckboxFieldProps): ReactElement {
  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    onChange(event.target.checked);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-ink-900">
      <input type="checkbox" checked={checked} onChange={handleChange} />
      {label}
    </label>
  );
}
