import { NextResponse } from 'next/server';

const FALLBACK_PRICE_AED = 286.45; // Update periodically — ~24K gold per gram in AED
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

let cachedPrice: number = FALLBACK_PRICE_AED;
let lastFetchTime = 0;

export async function GET() {
  const now = Date.now();

  if (now - lastFetchTime < CACHE_DURATION) {
    return NextResponse.json({ price_per_gram: cachedPrice, currency: 'AED', cached: true });
  }

  const apiKey = process.env.GOLD_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch('https://www.goldapi.io/api/XAU/AED', {
        headers: { 'x-access-token': apiKey },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = await res.json();
        // GoldAPI returns price per troy ounce; convert to grams (1 troy oz = 31.1035 g)
        cachedPrice = data.price / 31.1035;
        lastFetchTime = now;
        return NextResponse.json({
          price_per_gram: cachedPrice,
          currency: 'AED',
          cached: false,
          last_updated: new Date(lastFetchTime).toISOString(),
        });
      }
    } catch {
      // Fall through to cached/fallback price
    }
  }

  // No API key or fetch failed — use last cached value (or fallback on cold start)
  if (lastFetchTime === 0) lastFetchTime = now;
  return NextResponse.json({
    price_per_gram: cachedPrice,
    currency: 'AED',
    cached: true,
    last_updated: new Date(lastFetchTime).toISOString(),
  });
}
