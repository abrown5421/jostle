import type { TopicDefinition } from './types.js';

const PARAM_PATTERN = /\{(\w+)\}/g;

function extractParamNames(pattern: string): string[] {
  return [...pattern.matchAll(PARAM_PATTERN)].map(([, name]) => name);
}

function buildMatcher(pattern: string): RegExp {
  const source = pattern.replace(PARAM_PATTERN, (_, name: string) => `(?<${name}>[^:]+)`);
  return new RegExp(`^${source}$`);
}

export function defineTopic<TParams extends Record<string, string>, TPayload>(
  pattern: string
): TopicDefinition<TParams, TPayload> {
  const paramNames = extractParamNames(pattern);
  const matcher = buildMatcher(pattern);

  const channel = (params: TParams): string =>
    paramNames.reduce((resolved, name) => resolved.replace(`{${name}}`, encodeURIComponent(params[name])), pattern);

  const match = (value: string): TParams | undefined => {
    const result = matcher.exec(value);
    return result?.groups ? (result.groups as TParams) : undefined;
  };

  return { pattern, channel, match };
}
