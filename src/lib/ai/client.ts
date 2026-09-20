import type Anthropic from '@anthropic-ai/sdk';

import type { Resume } from '../resume';

// Suggestions are short, single-turn rewrites, not agentic work — low
// effort keeps latency and cost down without hurting quality here.
const MODEL = 'claude-opus-5';

export interface AiSuggestionSuccess {
  success: true;
  text: string;
}

export interface AiSuggestionFailure {
  success: false;
  error: string;
}

export type AiSuggestionResult = AiSuggestionSuccess | AiSuggestionFailure;

function describeAnthropicError(
  anthropicClient: typeof Anthropic,
  error: unknown,
): string {
  if (error instanceof anthropicClient.AuthenticationError) {
    return 'That API key was rejected. Double-check it in AI Settings.';
  }
  if (error instanceof anthropicClient.RateLimitError) {
    return 'Rate limited by the Anthropic API. Try again in a moment.';
  }
  if (error instanceof anthropicClient.APIConnectionError) {
    return 'Could not reach the Anthropic API. Check your connection.';
  }
  if (error instanceof anthropicClient.APIError) {
    return `Anthropic API error: ${error.message}`;
  }
  console.error('Unexpected error calling the Anthropic API.', error);
  return 'Something went wrong contacting Claude. Try again.';
}

async function runSuggestion(
  apiKey: string,
  system: string,
  userPrompt: string,
  maxTokens: number,
): Promise<AiSuggestionResult> {
  // The Anthropic SDK is only needed once the user actually triggers an AI
  // suggestion, so it's loaded lazily rather than bundled into the main
  // side panel chunk every user pays for on load.
  const { default: anthropicClient } = await import('@anthropic-ai/sdk');

  try {
    // Client-side use with a user-supplied key is the intended pattern here
    // — there is no backend for this extension to call through instead.
    const client = new anthropicClient({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      output_config: { effort: 'low' },
      system,
      messages: [{ role: 'user', content: userPrompt }],
    });

    if (response.stop_reason === 'refusal') {
      return {
        success: false,
        error:
          response.stop_details?.explanation ??
          'Claude declined to respond to this request.',
      };
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock) {
      return { success: false, error: 'Claude returned an empty response.' };
    }

    return { success: true, text: textBlock.text.trim() };
  } catch (error: unknown) {
    return {
      success: false,
      error: describeAnthropicError(anthropicClient, error),
    };
  }
}

function describeResumeContext(resume: Resume): string {
  const mostRecentRole = resume.experience[0];
  const skills = resume.skills.flatMap((group) => group.skills).filter(Boolean);

  return [
    resume.contact.fullName ? `Candidate: ${resume.contact.fullName}` : null,
    mostRecentRole
      ? `Most recent role: ${mostRecentRole.title || 'Unknown title'} at ${mostRecentRole.company || 'Unknown company'}`
      : null,
    skills.length > 0 ? `Skills: ${skills.join(', ')}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

/** Suggests a rewritten professional summary for the given resume. */
export async function suggestSummary(
  resume: Resume,
  apiKey: string,
): Promise<AiSuggestionResult> {
  const system =
    'You are an expert resume writer. Rewrite resume summaries to be concise, ' +
    'concrete, and ATS-friendly: plain text, no markdown, no bullet points, ' +
    '2-4 sentences. Respond with only the rewritten summary text, nothing else.';
  const userPrompt = [
    describeResumeContext(resume),
    resume.summary
      ? `Current summary:\n${resume.summary}`
      : 'There is no summary yet — write one from the context above.',
  ]
    .filter((line): line is string => line !== null && line.length > 0)
    .join('\n\n');

  return runSuggestion(apiKey, system, userPrompt, 512);
}

/** Suggests a rewritten version of a single resume highlight/bullet. */
export async function suggestBulletRewrite(
  bulletText: string,
  roleContext: { title?: string; company?: string },
  apiKey: string,
): Promise<AiSuggestionResult> {
  const system =
    'You are an expert resume writer. Rewrite a single resume bullet point to ' +
    'start with a strong action verb, quantify impact where plausible without ' +
    'fabricating numbers, and stay under 30 words. Respond with only the ' +
    'rewritten bullet text, nothing else — no leading bullet character.';
  const role = [roleContext.title, roleContext.company]
    .filter(Boolean)
    .join(' at ');
  const userPrompt = [
    role ? `Role: ${role}` : null,
    `Bullet to improve:\n${bulletText}`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n\n');

  return runSuggestion(apiKey, system, userPrompt, 256);
}

/**
 * Suggests concrete, honest ways to close keyword gaps between the resume
 * and a target job description.
 */
export async function suggestKeywordGaps(
  resume: Resume,
  jobDescription: string,
  apiKey: string,
): Promise<AiSuggestionResult> {
  const system =
    'You are an ATS and resume-optimization expert. Given a resume and a job ' +
    'description, identify the most important keywords or skills from the job ' +
    'description that are missing or underrepresented in the resume, and ' +
    'suggest specific, honest ways to naturally work them in — never invent ' +
    "experience the candidate doesn't have. Respond with a short plain-text " +
    'list (each item starting with "- "), at most 6 items.';
  const userPrompt = [
    describeResumeContext(resume),
    resume.summary ? `Summary:\n${resume.summary}` : null,
    `Job description:\n${jobDescription}`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n\n');

  return runSuggestion(apiKey, system, userPrompt, 1024);
}
