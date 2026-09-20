import type { ReactElement } from 'react';

import { AtsPanel } from './components/AtsPanel';
import { ProfileBar } from './components/ProfileBar';
import { ResumeForm } from './components/ResumeForm';
import { ResumePreview } from './components/ResumePreview';
import { useResumeProfiles } from './hooks/useResumeProfiles';

export function App(): ReactElement {
  const {
    profiles,
    activeProfile,
    canUndo,
    selectProfile,
    createProfile,
    duplicateProfile,
    renameProfile,
    deleteProfile,
    updateActiveResume,
    undoActiveResume,
  } = useResumeProfiles();

  return (
    <div className="flex h-screen w-full flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200 p-3">
        <h1 className="text-lg font-semibold">Hired Hand: Resume Builder</h1>
      </header>
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
          <div className="lg:flex-1 lg:border-r lg:border-slate-200">
            <ResumeForm
              resume={activeProfile.resume}
              onChange={updateActiveResume}
            />
          </div>
          <div className="lg:flex-1">
            <ResumePreview resume={activeProfile.resume} />
          </div>
        </div>
        <AtsPanel resume={activeProfile.resume} />
      </main>
    </div>
  );
}
