/**
 * Resolves and rewrites the destination URL for ephemeral PR environments.
 * If a corresponding X-{Service}-PR header is present, the URL is rewritten
 * to point to the Cloud Run ephemeral instance for that PR.
 */
export function rewriteUrlForPr(
  originalUrl: string | undefined,
  headers: Record<string, string | string[] | undefined>,
  services: { name: string; baseUrl: string; headerKey: string }[],
  cloudRunSuffix: string,
): string | undefined {
  if (!originalUrl) return originalUrl;

  let rewrittenUrl = originalUrl;

  for (const service of services) {
    const prNumber = headers[service.headerKey];
    if (prNumber && typeof prNumber === 'string' && rewrittenUrl.includes(service.baseUrl)) {
      rewrittenUrl = rewrittenUrl.replace(
        service.baseUrl,
        `https://${service.name}-pr-${prNumber}${cloudRunSuffix}`
      );
    }
  }

  return rewrittenUrl;
}
