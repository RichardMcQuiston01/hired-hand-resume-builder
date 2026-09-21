import { useState } from 'react';
import type { ReactElement } from 'react';

import { AiPanel } from './components/AiPanel';
import { AtsPanel } from './components/AtsPanel';
import { ExportPanel } from './components/ExportPanel';
import { ImportPanel } from './components/ImportPanel';
import { ProfileBar } from './components/ProfileBar';
import { ResumeForm } from './components/ResumeForm';
import { ResumePreview } from './components/ResumePreview';
import { SettingsPanel } from './components/SettingsPanel';
import { useAiSettings } from './hooks/useAiSettings';
import { useResumeProfiles } from './hooks/useResumeProfiles';

export function App(): ReactElement {
  const {
    profiles,
    activeProfile,
    canUndo,
    selectProfile,
    createProfile,
    importProfile,
    duplicateProfile,
    renameProfile,
    deleteProfile,
    updateActiveResume,
    undoActiveResume,
  } = useResumeProfiles();
  const { apiKey, saveApiKey, forgetApiKey } = useAiSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex h-screen w-full flex-col bg-surface-100 font-sans text-ink-900">
      <header className="flex items-center justify-between gap-2 bg-brand-900 p-3 text-white">
        <h1 className="min-w-0 truncate font-display text-lg font-semibold tracking-wide">
          Hired Hand: Resume Builder
        </h1>
        <button
          type="button"
          aria-label="Settings"
          aria-expanded={isSettingsOpen}
          onClick={() => {
            setIsSettingsOpen((open) => !open);
          }}
          className="shrink-0 rounded p-1 text-brand-100 hover:bg-brand-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-accent-600"
        >
          <GearIcon />
        </button>
      </header>
      {isSettingsOpen && (
        <SettingsPanel
          apiKey={apiKey}
          onSaveApiKey={saveApiKey}
          onForgetApiKey={forgetApiKey}
        />
      )}
      <ProfileBar
        profiles={profiles}
        activeProfile={activeProfile}
        onSelect={selectProfile}
        onCreate={() => {
          createProfile('Untitled resume');
        }}
        onDuplicate={duplicateProfile}
        onRename={renameProfile}
        onDelete={deleteProfile}
        canUndo={canUndo}
        onUndo={undoActiveResume}
      />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:flex-1 lg:border-r lg:border-border-subtle">
            <ResumeForm
              resume={activeProfile.resume}
              onChange={updateActiveResume}
            />
          </div>
          <div className="lg:flex-1">
            <ResumePreview resume={activeProfile.resume} />
          </div>
        </div>
        <ImportPanel onImport={importProfile} />
        <ExportPanel resume={activeProfile.resume} />
        <AtsPanel resume={activeProfile.resume} />
        <AiPanel
          resume={activeProfile.resume}
          apiKey={apiKey}
          onApplySummary={(summary) => {
            updateActiveResume((resume) => ({ ...resume, summary }));
          }}
        />
      </main>
    </div>
  );
}

function GearIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path
        fillRule="evenodd"
        d="M11.078 2.25c.917 0 1.699.663 1.85 1.567l.091.549a.798.798 0 0 0 .517.62c.294.107.564.256.812.437a.798.798 0 0 0 .805.078l.518-.225a1.875 1.875 0 0 1 2.309.808l.911 1.578a1.875 1.875 0 0 1-.44 2.42l-.435.354a.798.798 0 0 0-.29.749c.02.16.031.323.031.489s-.01.328-.031.489a.798.798 0 0 0 .29.749l.435.354a1.875 1.875 0 0 1 .44 2.42l-.911 1.578a1.875 1.875 0 0 1-2.309.808l-.518-.225a.798.798 0 0 0-.805.078 4.99 4.99 0 0 1-.812.437.798.798 0 0 0-.517.62l-.09.549a1.875 1.875 0 0 1-1.851 1.567H8.923a1.875 1.875 0 0 1-1.85-1.567l-.091-.549a.798.798 0 0 0-.517-.62 4.98 4.98 0 0 1-.812-.437.798.798 0 0 0-.805-.078l-.518.225a1.875 1.875 0 0 1-2.309-.808l-.911-1.578a1.875 1.875 0 0 1 .44-2.42l.435-.354a.798.798 0 0 0 .29-.749 4.99 4.99 0 0 1 0-.978.798.798 0 0 0-.29-.749l-.435-.354a1.875 1.875 0 0 1-.44-2.42l.911-1.578a1.875 1.875 0 0 1 2.309-.808l.518.225a.798.798 0 0 0 .805-.078c.248-.181.518-.33.812-.437a.798.798 0 0 0 .517-.62l.09-.549A1.875 1.875 0 0 1 8.923 2.25h2.155ZM10 13.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
