import { NextResponse, NextRequest } from 'next/server';

// Configuration
const FALLBACK_GOLD_PRICE_AED = 561.42;
const FALLBACK_SILVER_PRICE_AED = 3.65;
const FRESH_TTL = 15 * 60 * 1000; // 15 minutes (Gold price doesn't change every second)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20;

// Layered State (In-memory, persistent as long as instance is alive)
let cachedGoldPrice: number = FALLBACK_GOLD_PRICE_AED;
let cachedSilverPrice: number = FALLBACK_SILVER_PRICE_AED;
let lastFetchTime = 0;
let cachedCurrency = 'AED';
let hasSuccessfulFetch = false;

// Rate Limit Store
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function getRateLimitKey(request: NextRequest): string {
  // Try to get IP from headers
  const forward = request.headers.get('x-forwarded-for');
  if (forward) return forward.split(',')[0].trim();
  return 'anonymous-global';
}

function handleRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { count: 0, lastReset: now };

  if (now - entry.lastReset > RATE_LIMIT_WINDOW_MS) {
    entry.count = 1;
    entry.lastReset = now;
  } else {
    entry.count++;
  }

  rateLimitMap.set(key, entry);
  return entry.count > MAX_REQUESTS;
}

async function fetchMetalPrice(metal: 'XAU' | 'XAG', currency: string, apiKey: string) {
  try {
    const res = await fetch(`https://www.goldapi.io/api/${metal}/${currency}`, {
      headers: { 'x-access-token': apiKey },
      next: { revalidate: 900 }, // 15 minutes revalidate at Next.js level
    });

    if (res.ok) {
      const data = await res.json();
      // GoldAPI returns price per troy ounce; convert to grams (1 troy oz = 31.1035 g)
      if (data && typeof data.price === 'number') {
        return data.price / 31.1035;
      }
    }
  } catch (error) {
    console.error(`Error fetching ${metal} price:`, error);
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const currency = searchParams.get('currency')?.toUpperCase() || 'AED';
  const now = Date.now();
  const rateLimitKey = getRateLimitKey(request);

  // 1. Rate Limiting Check
  if (handleRateLimit(rateLimitKey)) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        price_per_gram: cachedGoldPrice, // Return cached value even when limited
        price_per_gram_gold: cachedGoldPrice,
        price_per_gram_silver: cachedSilverPrice,
        currency,
        isStale: true,
        asOf: new Date(lastFetchTime).toISOString(),
      },
      { status: 429 }
    );
  }

  // 2. Layered Cache Check (Freshness)
  const isFresh = now - lastFetchTime < FRESH_TTL && cachedCurrency === currency;

  if (isFresh) {
    return NextResponse.json({
      price_per_gram: cachedGoldPrice,
      price_per_gram_gold: cachedGoldPrice,
      price_per_gram_silver: cachedSilverPrice,
      currency,
      cached: true,
      isStale: false,
      isFallback: !hasSuccessfulFetch,
      asOf: new Date(lastFetchTime).toISOString(),
    });
  }

  // 3. Update Cache from Upstream
  const apiKey = process.env.GOLD_API_KEY;

  if (apiKey) {
    try {
      const [goldPrice, silverPrice] = await Promise.all([
        fetchMetalPrice('XAU', currency, apiKey),
        fetchMetalPrice('XAG', currency, apiKey),
      ]);

      if (goldPrice !== null || silverPrice !== null) {
        if (goldPrice !== null) cachedGoldPrice = goldPrice;
        if (silverPrice !== null) cachedSilverPrice = silverPrice;
        cachedCurrency = currency;
        lastFetchTime = now;
        hasSuccessfulFetch = true;

        return NextResponse.json({
          price_per_gram: cachedGoldPrice,
          price_per_gram_gold: cachedGoldPrice,
          price_per_gram_silver: cachedSilverPrice,
          currency: cachedCurrency,
          cached: false,
          isStale: false,
          isFallback: false,
          asOf: new Date(lastFetchTime).toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to update gold price cache:', err);
    }
  }

  // 4. Graceful Fallback (Failed fetch or no API key)
  // If we have a LKG value, return it as stale. Else return hardcoded as fallback.
  return NextResponse.json({
    price_per_gram: cachedGoldPrice,
    price_per_gram_gold: cachedGoldPrice,
    price_per_gram_silver: cachedSilverPrice,
    currency,
    cached: true,
    isStale: hasSuccessfulFetch, // It's stale if we once had success but now failed
    isFallback: !hasSuccessfulFetch, // It's fallback if we never succeeded
    asOf: lastFetchTime > 0 ? new Date(lastFetchTime).toISOString() : new Date().toISOString(),
    message: !apiKey ? 'API Key missing' : 'Upstream unavailable',
  });
}
