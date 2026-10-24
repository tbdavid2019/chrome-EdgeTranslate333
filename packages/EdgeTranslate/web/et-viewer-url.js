/**
 * Parse the viewer URL without decoding values a second time. URLSearchParams
 * already decodes each query value once, which preserves encoded query values
 * such as signed URL parameters.
 */
export function normalizeViewerUrl(href) {
  const url = new URL(href);
  const params = url.searchParams;
  let file = params.get("file");
  const source = params.get("source");
  let recoveredLegacyBlob = false;

  // Older builds replaced cross-origin files with in-memory blobs. Those URLs
  // stop working after a reload, so restore the original source directly.
  if (file?.startsWith("blob:") && source) {
    try {
      const sourceUrl = new URL(source);
      if (["http:", "https:", "file:"].includes(sourceUrl.protocol)) {
        file = source;
        params.set("file", source);
        recoveredLegacyBlob = true;
      }
    } catch {
      // Leave an invalid legacy source untouched so PDF.js can report it.
    }
  }

  return {
    href: url.href,
    file,
    source,
    recoveredLegacyBlob,
  };
}
