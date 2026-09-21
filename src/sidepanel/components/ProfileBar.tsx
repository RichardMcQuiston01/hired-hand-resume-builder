import { useState } from 'react';
import type { ChangeEvent, ReactElement } from 'react';

import type { ResumeProfile } from '../hooks/useResumeProfiles';

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
        className="text-xs font-medium text-ink-600 hover:underline disabled:cursor-not-allowed disabled:text-ink-400 disabled:no-underline"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={startRenaming}
        className="text-xs font-medium text-ink-600 hover:underline"
      >
        Rename
      </button>
      <button
        type="button"
        onClick={onCreate}
        className="text-xs font-medium text-accent-600 hover:underline"
      >
        New
      </button>
      <button
        type="button"
        onClick={() => {
          onDuplicate(activeProfile.id);
        }}
        className="text-xs font-medium text-ink-600 hover:underline"
      >
        Duplicate
      </button>
      <button
        type="button"
        disabled={profiles.length <= 1}
        onClick={() => {
          onDelete(activeProfile.id);
        }}
        className="text-xs font-medium text-danger-600 hover:underline disabled:cursor-not-allowed disabled:text-ink-400 disabled:no-underline"
      >
        Delete
      </button>
    </div>
  );
}
