import { NextResponse, NextRequest } from 'next/server';

// Configuration
const FALLBACK_GOLD_PRICE_AED = 561.42;
const FALLBACK_SILVER_PRICE_AED = 8.75;
const FRESH_TTL = 1 * 60 * 1000; // 1 minute (Reduced for user confidence)
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
  console.log(`[GoldAPI] Fetching ${metal} price in ${currency}...`);
  try {
      const res = await fetch(`https://www.goldapi.io/api/${metal}/${currency}`, {
        headers: { 'x-access-token': apiKey },
        next: { revalidate: 60 }, // 60 seconds (Reduced for user confidence)
      });

    if (res.ok) {
      const data = await res.json();
      // GoldAPI returns price per troy ounce; convert to grams (1 troy oz = 31.1035 g)
      if (data && typeof data.price === 'number') {
        const pricePerGram = data.price / 31.1035;
        console.log(`[GoldAPI] ${metal} Success: ${pricePerGram.toFixed(2)} ${currency}/g`);
        return pricePerGram;
      }
    } else {
      const errorText = await res.text();
      console.error(`[GoldAPI] ${metal} Error (${res.status}):`, errorText);
    }
  } catch (error) {
    console.error(`[GoldAPI] ${metal} Network Error:`, error);
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
      console.log('[GoldAPI] Attempting upstream refresh...');
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

        console.log(`[GoldAPI] Cache updated successfully at ${new Date(lastFetchTime).toLocaleTimeString()}`);

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
      } else {
        console.warn('[GoldAPI] Upstream failed, continuing with fallback/cache');
      }
    } catch (err) {
      console.error('[GoldAPI] Failed to update gold price cache:', err);
    }
  } else {
    console.error('[GoldAPI] API Key missing in environment variables!');
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
