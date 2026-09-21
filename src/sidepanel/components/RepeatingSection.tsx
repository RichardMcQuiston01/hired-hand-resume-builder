import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

interface CollapsibleConfig<TItem> {
  /** Whether the entry has enough filled in to collapse to a summary. */
  isComplete: (item: TItem) => boolean;
  /** Content shown in the collapsed summary row. */
  renderSummary: (item: TItem) => ReactNode;
}

interface RepeatingSectionProps<TItem> {
  title: string;
  items: TItem[];
  onChange: (items: TItem[]) => void;
  createItem: () => TItem;
  getKey: (item: TItem) => string;
  renderItem: (item: TItem, onItemChange: (item: TItem) => void) => ReactNode;
  addLabel?: string;
  /**
   * Opt-in Save/Edit collapse behavior: a saved entry collapses to a
   * one-line summary with an Edit button, instead of always showing the
   * full form. Used by Experience/Education, which tend to accumulate many
   * entries; not applied to sections that weren't asked for it.
   */
  collapsible?: CollapsibleConfig<TItem>;
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
  collapsible,
}: RepeatingSectionProps<TItem>): ReactElement {
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(
    () =>
      new Set(
        collapsible ? items.filter(collapsible.isComplete).map(getKey) : [],
      ),
  );

  function handleItemChange(index: number, item: TItem): void {
    onChange(items.map((existing, i) => (i === index ? item : existing)));
  }

  function handleRemove(index: number): void {
    onChange(items.filter((_, i) => i !== index));
  }

  function handleAdd(): void {
    onChange([...items, createItem()]);
  }

  function handleSave(key: string, item: TItem): void {
    if (!collapsible?.isComplete(item)) {
      return;
    }
    setCollapsedKeys((prev) => new Set(prev).add(key));
  }

  function handleEdit(key: string): void {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-ink-900">{title}</h2>
      {items.map((item, index) => {
        const key = getKey(item);

        if (collapsible && collapsedKeys.has(key)) {
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-2 rounded-md border border-border-subtle px-3 py-2"
            >
              <div className="min-w-0 flex-1 text-sm text-ink-900">
                {collapsible.renderSummary(item)}
              </div>
              <button
                type="button"
                onClick={() => {
                  handleEdit(key);
                }}
                aria-label={`Edit ${title} entry ${index + 1}`}
                className="shrink-0 text-xs font-medium text-ink-600 hover:underline"
              >
                Edit
              </button>
            </div>
          );
        }

        return (
          <div
            key={key}
            className="flex flex-col gap-2 rounded-md border border-border-subtle p-3"
          >
            {renderItem(item, (next) => {
              handleItemChange(index, next);
            })}
            <div className="flex items-center gap-3">
              {collapsible && (
                <button
                  type="button"
                  disabled={!collapsible.isComplete(item)}
                  onClick={() => {
                    handleSave(key, item);
                  }}
                  className="rounded bg-accent-600 px-2 py-1 text-xs font-medium text-on-accent hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-surface-200 disabled:text-ink-400"
                >
                  Save
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  handleRemove(index);
                }}
                aria-label={`Remove ${title} entry ${index + 1}`}
                className="text-xs text-danger-600 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={handleAdd}
        className="self-start rounded bg-accent-600 px-3 py-1 text-sm font-medium text-on-accent hover:bg-accent-700"
      >
        {addLabel}
      </button>
    </section>
  );
}
