import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';

import {
  checkResumeStructure,
  matchKeywords,
  type AtsFindingSeverity,
} from '../../lib/ats';
import type { Resume } from '../../lib/resume';
import { TextAreaField } from './ui/TextAreaField';

interface AtsPanelProps {
  resume: Resume;
}

const SEVERITY_STYLES: Record<AtsFindingSeverity, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-border-subtle bg-surface-50 text-ink-900',
};

const MAX_MISSING_KEYWORDS_SHOWN = 20;

/** Structural ATS checks — the "ATS Check" accordion section's body. */
export function StructuralChecksSection({
  resume,
}: AtsPanelProps): ReactElement {
  const findings = useMemo(() => checkResumeStructure(resume), [resume]);

  return findings.length === 0 ? (
    <p aria-live="polite" className="text-sm text-emerald-700">
      No structural issues found.
    </p>
  ) : (
    <ul aria-live="polite" className="flex flex-col gap-1">
      {findings.map((finding) => (
        <li
          key={finding.id}
          className={`rounded border px-2 py-1 text-xs ${SEVERITY_STYLES[finding.severity]}`}
        >
          {finding.message}
        </li>
      ))}
    </ul>
  );
}

/** Job-description keyword matching — the "Keyword Match" accordion
 * section's body. */
export function KeywordMatchSection({ resume }: AtsPanelProps): ReactElement {
  const [jobDescription, setJobDescription] = useState('');

  const keywordResult = useMemo(
    () =>
      jobDescription.trim().length > 0
        ? matchKeywords(resume, jobDescription)
        : null,
    [resume, jobDescription],
  );

  return (
    <div className="flex flex-col gap-2">
      <TextAreaField
        label="Job description"
        value={jobDescription}
        onChange={setJobDescription}
        placeholder="Paste a job description to compare against your resume..."
        rows={5}
      />
      {keywordResult && (
        <div aria-live="polite" className="flex flex-col gap-1 text-sm">
          <p className="font-medium">
            Match score: {keywordResult.score}% ({keywordResult.matched.length}/
            {keywordResult.matched.length + keywordResult.missing.length}{' '}
            keywords)
          </p>
          {keywordResult.missing.length > 0 && (
            <p className="text-ink-600">
              Missing:{' '}
              {keywordResult.missing
                .slice(0, MAX_MISSING_KEYWORDS_SHOWN)
                .join(', ')}
              {keywordResult.missing.length > MAX_MISSING_KEYWORDS_SHOWN
                ? ', …'
                : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
