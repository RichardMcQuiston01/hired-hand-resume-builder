import type { ReactElement } from 'react';

import type { SkillGroup } from '@hired-hand/resume-core';
import { createBlankSkillGroup } from '@hired-hand/resume-core';
import { RepeatingSection } from '../RepeatingSection';
import { TagInputField } from '../ui/TagInputField';
import { TextField } from '../ui/TextField';

interface SkillsSectionProps {
  groups: SkillGroup[];
  onChange: (groups: SkillGroup[]) => void;
}

export function SkillsSection({
  groups,
  onChange,
}: SkillsSectionProps): ReactElement {
  return (
    <RepeatingSection
      title="Skills"
      items={groups}
      onChange={onChange}
      createItem={createBlankSkillGroup}
      getKey={(group) => group.id}
      addLabel="Add skill group"
      renderItem={(group, onGroupChange) => (
        <>
          <TextField
            label="Category"
            required
            placeholder="Languages"
            value={group.category}
            onChange={(category) => {
              onGroupChange({ ...group, category });
            }}
          />
          <TagInputField
            label="Skills"
            items={group.skills}
            placeholder="TypeScript"
            onChange={(skills) => {
              onGroupChange({ ...group, skills });
            }}
          />
        </>
      )}
    />
  );
}
