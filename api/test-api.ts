import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Test if we can make internal API calls
    const baseUrl = `https://${req.headers.host}`;

    // Try to call our ping endpoint internally
    const pingResponse = await fetch(`${baseUrl}/api/ping`);
    const pingData = await pingResponse.text();

    return res.status(200).json({
      success: true,
      message: 'Internal API test',
      baseUrl,
      pingStatus: pingResponse.status,
      pingData: pingData.substring(0, 200), // First 200 chars
      host: req.headers.host
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}