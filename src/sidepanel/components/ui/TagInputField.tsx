import { useState } from 'react';
import type { KeyboardEvent, ReactElement } from 'react';

interface TagInputFieldProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

/** A tag-cloud input: type a value, then Enter or the checkbox adds it as a
 * removable chip. Used for flat string lists (e.g. skills) instead of one
 * text input per entry. */
export function TagInputField({
  label,
  items,
  onChange,
  placeholder,
}: TagInputFieldProps): ReactElement {
  const [draft, setDraft] = useState('');

  function addTag(): void {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    onChange([...items, trimmed]);
    setDraft('');
  }

  function removeTag(index: number): void {
    onChange(items.filter((_, i) => i !== index));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  }

  // Older data (or a stale draft) can carry blank entries; never render
  // those as a chip.
  const tags = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.trim());

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink-900">{label}</span>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map(({ item, index }) => (
            <li
              key={index}
              className="flex items-center gap-1 rounded-full bg-brand-100 px-2 py-1 text-xs font-medium text-brand-900"
            >
              {item}
              <button
                type="button"
                onClick={() => {
                  removeTag(index);
                }}
                aria-label={`Remove ${label} ${item}`}
                className="rounded-full text-brand-700 hover:text-danger-600"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-2">
        <input
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={`Add ${label}`}
          className="min-w-0 flex-1 rounded border border-border-subtle px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <label className="flex shrink-0 flex-col items-center gap-1 text-xs text-ink-600">
          Add
          <input
            type="checkbox"
            checked={false}
            onChange={addTag}
            aria-label={`Add ${label} to list`}
            className="h-4 w-4 rounded border-border-subtle text-brand-500 focus:ring-2 focus:ring-brand-500"
          />
        </label>
      </div>
    </div>
  );
}
