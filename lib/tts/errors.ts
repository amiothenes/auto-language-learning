export class VoiceNotConfiguredError extends Error {}

export class RateLimitExceededError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super('Rate limit exceeded');
  }
}
