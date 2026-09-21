import { useState } from 'react';
import type { KeyboardEvent, ReactElement } from 'react';

import { createBlankLink, type Link } from '../../lib/resume';
import { CheckboxIcon, PencilIcon, PlusIcon } from './icons';
import { TextField } from './ui/TextField';

interface LinksFieldProps {
  links: Link[];
  onChange: (links: Link[]) => void;
}

/**
 * Renders each saved link as a compact chip (checkbox to save/collapse,
 * pencil to edit again) instead of the always-expanded card `RepeatingSection`
 * uses, since a resume can carry several links and most stay unchanged once
 * entered.
 */
export function LinksField({ links, onChange }: LinksFieldProps): ReactElement {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
    () =>
      new Set(links.filter((link) => link.url.trim()).map((link) => link.id)),
  );

  function updateLink(index: number, next: Link): void {
    onChange(links.map((link, i) => (i === index ? next : link)));
  }

  function removeLink(index: number): void {
    onChange(links.filter((_, i) => i !== index));
  }

  function addLink(): void {
    onChange([...links, createBlankLink()]);
  }

  function collapse(link: Link): void {
    if (!link.url.trim()) {
      return;
    }
    setCollapsedIds((prev) => new Set(prev).add(link.id));
  }

  function expand(id: string): void {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function handleUrlKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    link: Link,
  ): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      collapse(link);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink-900">Links</span>
      {links.map((link, index) => {
        if (collapsedIds.has(link.id)) {
          return (
            <div
              key={link.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border-subtle px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-ink-900">
                {link.label ? `${link.label}: ${link.url}` : link.url}
              </span>
              <button
                type="button"
                onClick={() => {
                  expand(link.id);
                }}
                aria-label={`Edit link ${index + 1}`}
                className="shrink-0 rounded p-1 text-ink-600 hover:bg-surface-200 hover:text-ink-900"
              >
                <PencilIcon />
              </button>
            </div>
          );
        }

        return (
          <div
            key={link.id}
            className="flex flex-col gap-2 rounded-md border border-border-subtle p-3"
          >
            <div className="flex items-end gap-3">
              <TextField
                label="Label"
                value={link.label}
                placeholder="LinkedIn"
                onChange={(label) => {
                  updateLink(index, { ...link, label });
                }}
              />
              <TextField
                label="URL"
                type="url"
                value={link.url}
                placeholder="https://..."
                onChange={(url) => {
                  updateLink(index, { ...link, url });
                }}
                onKeyDown={(event) => {
                  handleUrlKeyDown(event, link);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  collapse(link);
                }}
                title="Save link"
                aria-label={`Save link ${index + 1}`}
                className="shrink-0 rounded p-1 text-ink-600 hover:bg-surface-200 hover:text-brand-500"
              >
                <CheckboxIcon />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                removeLink(index);
              }}
              aria-label={`Remove link ${index + 1}`}
              className="self-start text-xs text-danger-600 hover:underline"
            >
              Remove
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={addLink}
        className="flex items-center gap-1 self-end rounded bg-accent-600 px-3 py-1 text-sm font-medium text-on-accent hover:bg-accent-700"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Add link
      </button>
    </div>
  );
}
