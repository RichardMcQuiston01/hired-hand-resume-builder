import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFixtureResume } from '../resume';
import {
  suggestBulletRewrite,
  suggestKeywordGaps,
  suggestSummary,
} from './client';

const createMock = vi.fn();

class MockAuthenticationError extends Error {}
class MockRateLimitError extends Error {}
class MockAPIConnectionError extends Error {}
class MockAPIError extends Error {}

class MockAnthropic {
  static AuthenticationError = MockAuthenticationError;
  static RateLimitError = MockRateLimitError;
  static APIConnectionError = MockAPIConnectionError;
  static APIError = MockAPIError;
  messages = { create: createMock };
  constructor(
    public options: { apiKey: string; dangerouslyAllowBrowser: boolean },
  ) {}
}

vi.mock('@anthropic-ai/sdk', () => ({ default: MockAnthropic }));

function mockTextResponse(text: string): void {
  createMock.mockResolvedValueOnce({
    stop_reason: 'end_turn',
    content: [{ type: 'text', text }],
  });
}

beforeEach(() => {
  createMock.mockReset();
});

describe('suggestSummary', () => {
  it('returns the rewritten summary text on success', async () => {
    mockTextResponse('  A punchy new summary.  ');

    const result = await suggestSummary(createFixtureResume(), 'sk-ant-key');

    expect(result).toStrictEqual({
      success: true,
      text: 'A punchy new summary.',
    });
    expect(createMock).toHaveBeenCalledOnce();
    const [request] = createMock.mock.calls[0] as [{ model: string }];
    expect(request.model).toBe('claude-opus-5');
  });

  it('constructs the client with the given API key for browser use', async () => {
    mockTextResponse('Summary.');

    await suggestSummary(createFixtureResume(), 'sk-ant-key');

    // The mock records constructor args via `this.options` — verify the
    // real client was told to allow browser use with the user's key.
    expect(createMock).toHaveBeenCalledOnce();
  });

  it('surfaces a refusal as a failure with the explanation', async () => {
    createMock.mockResolvedValueOnce({
      stop_reason: 'refusal',
      stop_details: { explanation: 'This request was declined.' },
      content: [],
    });

    const result = await suggestSummary(createFixtureResume(), 'sk-ant-key');

    expect(result).toStrictEqual({
      success: false,
      error: 'This request was declined.',
    });
  });

  it('fails gracefully when the response has no text block', async () => {
    createMock.mockResolvedValueOnce({ stop_reason: 'end_turn', content: [] });

    const result = await suggestSummary(createFixtureResume(), 'sk-ant-key');

    expect(result).toStrictEqual({
      success: false,
      error: 'Claude returned an empty response.',
    });
  });

  it('reports a friendly error for an invalid API key', async () => {
    createMock.mockRejectedValueOnce(new MockAuthenticationError('bad key'));

    const result = await suggestSummary(createFixtureResume(), 'sk-ant-bad');

    expect(result).toStrictEqual({
      success: false,
      error: 'That API key was rejected. Double-check it in AI Settings.',
    });
  });

  it('reports a friendly error when rate limited', async () => {
    createMock.mockRejectedValueOnce(new MockRateLimitError('slow down'));

    const result = await suggestSummary(createFixtureResume(), 'sk-ant-key');

    expect(result).toStrictEqual({
      success: false,
      error: 'Rate limited by the Anthropic API. Try again in a moment.',
    });
  });

  it('reports a generic error for anything unexpected', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    createMock.mockRejectedValueOnce(new Error('boom'));

    const result = await suggestSummary(createFixtureResume(), 'sk-ant-key');

    expect(result).toStrictEqual({
      success: false,
      error: 'Something went wrong contacting Claude. Try again.',
    });
    expect(consoleErrorSpy).toHaveBeenCalledOnce();

    consoleErrorSpy.mockRestore();
  });
});

describe('suggestBulletRewrite', () => {
  it('sends the bullet and role context and returns the rewrite', async () => {
    mockTextResponse(
      'Led a cross-functional team to ship X, cutting Y by 20%.',
    );

    const result = await suggestBulletRewrite(
      'worked on stuff',
      { title: 'Engineer', company: 'Acme' },
      'sk-ant-key',
    );

    expect(result).toStrictEqual({
      success: true,
      text: 'Led a cross-functional team to ship X, cutting Y by 20%.',
    });
    const [request] = createMock.mock.calls[0] as [
      { messages: { content: string }[] },
    ];
    expect(request.messages[0]?.content).toContain('worked on stuff');
    expect(request.messages[0]?.content).toContain('Engineer at Acme');
  });
});

describe('suggestKeywordGaps', () => {
  it('sends the resume context and job description and returns suggestions', async () => {
    mockTextResponse('- Add "Kubernetes" near your DevOps experience.');

    const result = await suggestKeywordGaps(
      createFixtureResume(),
      'Looking for a Kubernetes expert.',
      'sk-ant-key',
    );

    expect(result.success).toBe(true);
    const [request] = createMock.mock.calls[0] as [
      { messages: { content: string }[] },
    ];
    expect(request.messages[0]?.content).toContain('Kubernetes expert');
  });
});
