export function classifyError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  const statusCode = (error as { statusCode?: number })?.statusCode;

  return {
    isPayloadTooLarge:
      statusCode === 413 ||
      message.includes('payload') ||
      message.includes('too large') ||
      message.includes('413') ||
      message.includes('FUNCTION_PAYLOAD_TOO_LARGE') ||
      message.includes('Request Entity Too Large'),
    isRateLimited: statusCode === 429 || message.includes('rate limit'),
    isAuthError:
      statusCode === 401 || message.includes('authentication') || message.includes('API key'),
    message,
  };
}

export function getProcessingErrorMessage(error: unknown): string {
  const { isPayloadTooLarge, isRateLimited, message } = classifyError(error);

  if (isPayloadTooLarge) return 'File too large. Try compressing it.';
  if (isRateLimited) return 'Rate limit exceeded. Please try again.';
  return `Processing failed: ${message}`;
}
