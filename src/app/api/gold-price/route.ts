import { NextResponse, NextRequest } from 'next/server';

const FALLBACK_PRICE_AED = 561.42; // Update periodically — ~24K gold per gram in AED
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

let cachedPrice: number = FALLBACK_PRICE_AED;
let lastFetchTime = 0;
let cachedCurrency = 'AED';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const currency = searchParams.get('currency')?.toUpperCase() || 'AED';
  const now = Date.now();

  if (now - lastFetchTime < CACHE_DURATION && cachedCurrency === currency) {
    return NextResponse.json(
      { price_per_gram: cachedPrice, currency, cached: true },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  }

  const apiKey = process.env.GOLD_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch(`https://www.goldapi.io/api/XAU/${currency}`, {
        headers: { 
          'x-access-token': apiKey,
        },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = await res.json();
        // GoldAPI returns price per troy ounce; convert to grams (1 troy oz = 31.1035 g)
        cachedPrice = data.price / 31.1035;
        cachedCurrency = currency;
        lastFetchTime = now;
        return NextResponse.json(
          {
            price_per_gram: cachedPrice,
            currency: cachedCurrency,
            cached: false,
            last_updated: new Date(lastFetchTime).toISOString(),
          },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
          }
        );
      }
    } catch {
      // Fall through to cached/fallback price
    }
  }

  // If we reach here, the API failed or no key is set.
  // Instead of caching the failure for a full hour, we set the fetch time to 0
  // or a temporary retry window so it attempts again on the next load.
  // We'll cache for just 1 minute locally to avoid spamming on heavy failure loops.
  
  if (lastFetchTime === 0 || cachedCurrency !== currency) {
     // Prevent absolute spam but retry soon
     lastFetchTime = now - CACHE_DURATION + 60000; 
  }

  return NextResponse.json({
    price_per_gram: cachedCurrency === currency ? cachedPrice : FALLBACK_PRICE_AED, // Avoid returning wrong currency cached price
    currency,
    cached: true,
    last_updated: new Date(lastFetchTime).toISOString(),
  });
}
