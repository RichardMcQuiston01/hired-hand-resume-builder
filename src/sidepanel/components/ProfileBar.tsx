import { useState } from 'react';
import type { ChangeEvent, ReactElement } from 'react';

import type { ResumeProfile } from '../hooks/useResumeProfiles';
import { CopyIcon, PencilIcon, PlusIcon, TrashIcon, UndoIcon } from './icons';

const ICON_BUTTON_CLASS =
  'shrink-0 rounded p-1.5 text-ink-600 hover:bg-surface-200 hover:text-ink-900 disabled:cursor-not-allowed disabled:text-ink-400 disabled:hover:bg-transparent';

interface ProfileBarProps {
  profiles: ResumeProfile[];
  activeProfile: ResumeProfile;
  onSelect: (profileId: string) => void;
  onCreate: () => void;
  onDuplicate: (profileId: string) => void;
  onRename: (profileId: string, name: string) => void;
  onDelete: (profileId: string) => void;
  canUndo: boolean;
  onUndo: () => void;
}

export function ProfileBar({
  profiles,
  activeProfile,
  onSelect,
  onCreate,
  onDuplicate,
  onRename,
  onDelete,
  canUndo,
  onUndo,
}: ProfileBarProps): ReactElement {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(activeProfile.name);

  function handleSelect(event: ChangeEvent<HTMLSelectElement>): void {
    onSelect(event.target.value);
  }

  function startRenaming(): void {
    setDraftName(activeProfile.name);
    setIsRenaming(true);
  }

  function commitRename(): void {
    onRename(activeProfile.id, draftName);
    setIsRenaming(false);
  }

  function cancelRenaming(): void {
    setIsRenaming(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface-50 p-3">
      {isRenaming ? (
        <input
          autoFocus
          value={draftName}
          onChange={(event) => {
            setDraftName(event.target.value);
          }}
          onBlur={commitRename}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commitRename();
            } else if (event.key === 'Escape') {
              cancelRenaming();
            }
          }}
          aria-label="Resume profile name"
          className="flex-1 rounded border border-border-subtle px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      ) : (
        <select
          value={activeProfile.id}
          onChange={handleSelect}
          className="flex-1 rounded border border-border-subtle px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Active resume profile"
        >
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        disabled={!canUndo}
        onClick={onUndo}
        title="Undo"
        aria-label="Undo"
        className={ICON_BUTTON_CLASS}
      >
        <UndoIcon />
      </button>
      <button
        type="button"
        onClick={startRenaming}
        title="Rename"
        aria-label="Rename"
        className={ICON_BUTTON_CLASS}
      >
        <PencilIcon />
      </button>
      <button
        type="button"
        onClick={onCreate}
        title="New"
        aria-label="New"
        className={`${ICON_BUTTON_CLASS} text-accent-600 hover:text-accent-700`}
      >
        <PlusIcon />
      </button>
      <button
        type="button"
        onClick={() => {
          onDuplicate(activeProfile.id);
        }}
        title="Duplicate"
        aria-label="Duplicate"
        className={ICON_BUTTON_CLASS}
      >
        <CopyIcon />
      </button>
      <button
        type="button"
        disabled={profiles.length <= 1}
        onClick={() => {
          onDelete(activeProfile.id);
        }}
        title="Delete"
        aria-label="Delete"
        className={`${ICON_BUTTON_CLASS} text-danger-600 hover:bg-danger-100 hover:text-danger-600`}
      >
        <TrashIcon />
      </button>
    </div>
  );
}
