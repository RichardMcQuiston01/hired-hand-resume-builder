import type { ReactElement, ReactNode } from 'react';

interface RepeatingSectionProps<TItem> {
  title: string;
  items: TItem[];
  onChange: (items: TItem[]) => void;
  createItem: () => TItem;
  getKey: (item: TItem) => string;
  renderItem: (item: TItem, onItemChange: (item: TItem) => void) => ReactNode;
  addLabel?: string;
}

/**
 * Shared "list of entries with Add/Remove" scaffolding used by every
 * repeatable resume section (experience, education, skills,
 * certifications, projects) — each supplies its own field layout via
 * `renderItem`.
 */
export function RepeatingSection<TItem>({
  title,
  items,
  onChange,
  createItem,
  getKey,
  renderItem,
  addLabel = '+ Add',
}: RepeatingSectionProps<TItem>): ReactElement {
  function handleItemChange(index: number, item: TItem): void {
    onChange(items.map((existing, i) => (i === index ? item : existing)));
  }

  function handleRemove(index: number): void {
    onChange(items.filter((_, i) => i !== index));
  }

  function handleAdd(): void {
    onChange([...items, createItem()]);
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {items.map((item, index) => (
        <div
          key={getKey(item)}
          className="flex flex-col gap-2 rounded-md border border-slate-200 p-3"
        >
          {renderItem(item, (next) => {
            handleItemChange(index, next);
          })}
          <button
            type="button"
            onClick={() => {
              handleRemove(index);
            }}
            aria-label={`Remove ${title} entry ${index + 1}`}
            className="self-start text-xs text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="self-start rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        {addLabel}
      </button>
    </section>
  );
}
