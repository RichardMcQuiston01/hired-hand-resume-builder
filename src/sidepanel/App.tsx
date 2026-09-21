import { useRef, useState } from 'react';
import type { ReactElement } from 'react';

import { AccordionSection } from './components/AccordionSection';
import { AiPanel } from './components/AiPanel';
import {
  KeywordMatchSection,
  StructuralChecksSection,
} from './components/AtsPanel';
import { ExportPanel } from './components/ExportPanel';
import { ChevronUpIcon } from './components/icons';
import { ImportPanel } from './components/ImportPanel';
import { ProfileBar } from './components/ProfileBar';
import { ResumeForm } from './components/ResumeForm';
import { ResumePreview } from './components/ResumePreview';
import { SettingsPanel } from './components/SettingsPanel';
import { useAiSettings } from './hooks/useAiSettings';
import { useResumeProfiles } from './hooks/useResumeProfiles';

const SCROLL_TOP_THRESHOLD = 200;

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
  const [showGoToTop, setShowGoToTop] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  function handleMainScroll(): void {
    setShowGoToTop((mainRef.current?.scrollTop ?? 0) > SCROLL_TOP_THRESHOLD);
  }

  function scrollToTop(): void {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-surface-100 font-sans text-ink-900">
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
      <div className="relative min-h-0 flex-1">
        <main
          ref={mainRef}
          onScroll={handleMainScroll}
          className="h-full overflow-y-auto"
        >
          <AccordionSection
            title="Resume Editor"
            headerAction={<ImportPanel onImport={importProfile} />}
          >
            <ResumeForm
              resume={activeProfile.resume}
              onChange={updateActiveResume}
            />
          </AccordionSection>

          <AccordionSection title="Resume Preview">
            <ExportPanel resume={activeProfile.resume} />
            <ResumePreview resume={activeProfile.resume} />
          </AccordionSection>

          <AccordionSection title="ATS Check">
            <StructuralChecksSection resume={activeProfile.resume} />
          </AccordionSection>

          <AccordionSection title="Keyword Match">
            <KeywordMatchSection resume={activeProfile.resume} />
          </AccordionSection>

          <AccordionSection title="AI Suggestions">
            <AiPanel
              resume={activeProfile.resume}
              apiKey={apiKey}
              onApplySummary={(summary) => {
                updateActiveResume((resume) => ({ ...resume, summary }));
              }}
            />
          </AccordionSection>
        </main>
        {showGoToTop && (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Go to top"
            title="Go to top"
            className="absolute bottom-4 right-4 rounded-full bg-brand-900 p-2 text-white shadow-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-accent-600"
          >
            <ChevronUpIcon className="h-5 w-5" />
          </button>
        )}
      </div>
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
