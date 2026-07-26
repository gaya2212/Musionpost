export type PortfolioEmbed =
  | { kind: 'soundcloud'; url: string; src: string }
  | { kind: 'youtube'; url: string; src: string }
  | { kind: 'spotify'; url: string; src: string }
  | { kind: 'link'; url: string };

/** Resolves a raw portfolio URL to an embeddable iframe src where possible, else a plain link. */
export function resolvePortfolioEmbed(url: string): PortfolioEmbed {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'soundcloud.com') {
      return { kind: 'soundcloud', url, src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}` };
    }

    if (host === 'youtube.com' || host === 'youtu.be') {
      const videoId = host === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v');
      if (videoId) {
        return { kind: 'youtube', url, src: `https://www.youtube.com/embed/${videoId}` };
      }
    }

    if (host === 'open.spotify.com') {
      const match = parsed.pathname.match(/^\/(track|album|artist|playlist)\/([a-zA-Z0-9]+)/);
      if (match) {
        return { kind: 'spotify', url, src: `https://open.spotify.com/embed/${match[1]}/${match[2]}` };
      }
    }
  } catch {
    // Not a parseable URL — fall through to plain link.
  }

  return { kind: 'link', url };
}
