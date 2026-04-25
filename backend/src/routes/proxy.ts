import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

// Only proxy from Instagram/Facebook CDN — prevents arbitrary URL fetching
const ALLOWED_HOSTS = [
  /^scontent[^.]*\.cdninstagram\.com$/,
  /^scontent[^.]*\.fbcdn\.net$/,
  /^cdninstagram\.com$/,
  /^instagram\.com$/,
];

function isAllowed(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && ALLOWED_HOSTS.some((re) => re.test(u.hostname));
  } catch {
    return false;
  }
}

// GET /api/proxy/image?url=<encoded>
// Public endpoint — whitelist is the security layer; rate limiting applied globally.
router.get('/image', async (req: Request, res: Response): Promise<void> => {
  const raw = typeof req.query.url === 'string' ? decodeURIComponent(req.query.url) : '';

  if (!raw) {
    res.status(400).json({ error: 'Missing url' });
    return;
  }

  if (!isAllowed(raw)) {
    res.status(403).json({ error: 'URL not allowed' });
    return;
  }

  try {
    const upstream = await fetch(raw, {
      headers: {
        // No Referer — avoids hotlink protection on Instagram CDN
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
        'Accept': 'image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      res.status(upstream.status).end();
      return;
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    const buf = Buffer.from(await upstream.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buf.length);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h — thumbnails rarely change
    res.send(buf);
  } catch {
    res.status(502).end();
  }
});

export default router;
