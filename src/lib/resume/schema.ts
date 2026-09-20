import { z } from 'zod';

/**
 * Bumped whenever a breaking change is made to the resume shape below, so
 * stored/exported resumes can be migrated instead of silently misread.
 */
export const RESUME_SCHEMA_VERSION = 1;

const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Month-precision date (e.g. "2024-06"). Avoids implying a specific day. */
const yearMonthSchema = z
  .string()
  .regex(YEAR_MONTH_PATTERN, 'Expected a date in YYYY-MM format.');

const linkSchema = z.object({
  id: z.uuid(),
  label: z.string().min(1),
  url: z.url(),
});

const contactSchema = z.object({
  fullName: z.string().min(1),
  email: z.email(),
  phone: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  links: z.array(linkSchema).default([]),
});

const experienceEntrySchema = z
  .object({
    id: z.uuid(),
    company: z.string().min(1),
    title: z.string().min(1),
    location: z.string().min(1).optional(),
    startDate: yearMonthSchema,
    endDate: yearMonthSchema.optional(),
    isCurrent: z.boolean(),
    highlights: z.array(z.string().min(1)).min(1),
  })
  .refine((entry) => entry.isCurrent || entry.endDate !== undefined, {
    message: 'endDate is required unless isCurrent is true.',
    path: ['endDate'],
  });

const educationEntrySchema = z.object({
  id: z.uuid(),
  institution: z.string().min(1),
  credential: z.string().min(1),
  location: z.string().min(1).optional(),
  startDate: yearMonthSchema.optional(),
  endDate: yearMonthSchema.optional(),
  isCurrent: z.boolean(),
  highlights: z.array(z.string().min(1)).default([]),
});

const skillGroupSchema = z.object({
  id: z.uuid(),
  category: z.string().min(1),
  skills: z.array(z.string().min(1)).min(1),
});

const certificationEntrySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  issuer: z.string().min(1),
  issueDate: yearMonthSchema.optional(),
  expirationDate: yearMonthSchema.optional(),
  credentialUrl: z.url().optional(),
});

const projectEntrySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  url: z.url().optional(),
  highlights: z.array(z.string().min(1)).default([]),
});

export const resumeSchema = z.object({
  schemaVersion: z.literal(RESUME_SCHEMA_VERSION),
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  contact: contactSchema,
  summary: z.string().min(1).optional(),
  experience: z.array(experienceEntrySchema).default([]),
  education: z.array(educationEntrySchema).default([]),
  skills: z.array(skillGroupSchema).default([]),
  certifications: z.array(certificationEntrySchema).default([]),
  projects: z.array(projectEntrySchema).default([]),
});

const draftLinkSchema = z.object({
  id: z.uuid(),
  label: z.string(),
  url: z.string(),
});

const draftContactSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  location: z.string().optional(),
  links: z.array(draftLinkSchema).default([]),
});

const draftExperienceEntrySchema = z.object({
  id: z.uuid(),
  company: z.string(),
  title: z.string(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
  highlights: z.array(z.string()).default([]),
});

const draftEducationEntrySchema = z.object({
  id: z.uuid(),
  institution: z.string(),
  credential: z.string(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
  highlights: z.array(z.string()).default([]),
});

const draftSkillGroupSchema = z.object({
  id: z.uuid(),
  category: z.string(),
  skills: z.array(z.string()).default([]),
});

const draftCertificationEntrySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  issuer: z.string(),
  issueDate: z.string().optional(),
  expirationDate: z.string().optional(),
  credentialUrl: z.string().optional(),
});

const draftProjectEntrySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string(),
  url: z.string().optional(),
  highlights: z.array(z.string()).default([]),
});

/**
 * A permissive counterpart to `resumeSchema`, for validating in-progress
 * drafts — e.g. what gets round-tripped through storage while the user is
 * still editing. Same shape, but without the business-rule constraints
 * (a real email, non-empty required fields, YYYY-MM dates, ...) that only
 * make sense once the user is done. Use `resumeSchema` / `parseResume` to
 * check whether a resume is actually ready to export.
 */
export const resumeDraftSchema = z.object({
  schemaVersion: z.literal(RESUME_SCHEMA_VERSION),
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  contact: draftContactSchema,
  summary: z.string().optional(),
  experience: z.array(draftExperienceEntrySchema).default([]),
  education: z.array(draftEducationEntrySchema).default([]),
  skills: z.array(draftSkillGroupSchema).default([]),
  certifications: z.array(draftCertificationEntrySchema).default([]),
  projects: z.array(draftProjectEntrySchema).default([]),
});

export type Link = z.infer<typeof linkSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type CertificationEntry = z.infer<typeof certificationEntrySchema>;
export type ProjectEntry = z.infer<typeof projectEntrySchema>;
export type Resume = z.infer<typeof resumeSchema>;

/** Parses and validates a resume, throwing a `z.ZodError` on failure. */
export function parseResume(data: unknown): Resume {
  return resumeSchema.parse(data);
}

/** Parses and validates a resume, returning a result instead of throwing. */
export function safeParseResume(data: unknown): z.ZodSafeParseResult<Resume> {
  return resumeSchema.safeParse(data);
}
