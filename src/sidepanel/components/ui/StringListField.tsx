import type { ChangeEvent, ReactElement } from 'react';

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
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {items.map((item, index) => (
        // Plain strings have no stable identity, so the index is the key.
        <div key={index} className="flex gap-2">
          <input
            value={item}
            onChange={(event) => {
              handleItemChange(index, event);
            }}
            placeholder={placeholder}
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              handleRemove(index);
            }}
            className="text-xs text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="self-start text-xs font-medium text-slate-600 hover:underline"
      >
        + Add
      </button>
    </div>
  );
}
