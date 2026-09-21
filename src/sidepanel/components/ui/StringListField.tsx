import type { ChangeEvent, ReactElement } from 'react';

import { PlusIcon } from '../icons';

interface StringListFieldProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export function StringListField({
  label,
  items,
  onChange,
  placeholder,
}: StringListFieldProps): ReactElement {
  function handleItemChange(
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    onChange(items.map((item, i) => (i === index ? event.target.value : item)));
  }

  function handleRemove(index: number): void {
    onChange(items.filter((_, i) => i !== index));
  }

  function handleAdd(): void {
    onChange([...items, '']);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink-900">{label}</span>
      {items.map((item, index) => (
        // Plain strings have no stable identity, so the index is the key.
        <div key={index} className="flex gap-2">
          <input
            value={item}
            onChange={(event) => {
              handleItemChange(index, event);
            }}
            placeholder={placeholder}
            aria-label={`${label} ${index + 1}`}
            className="min-w-0 flex-1 rounded border border-border-subtle px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="button"
            onClick={() => {
              handleRemove(index);
            }}
            aria-label={`Remove ${label} ${index + 1}`}
            className="text-xs text-danger-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-1 self-end text-xs font-medium text-ink-600 hover:underline"
      >
        <PlusIcon className="h-3 w-3" />
        Add
      </button>
    </div>
  );
}
