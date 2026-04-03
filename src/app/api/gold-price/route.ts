import { NextResponse, NextRequest } from 'next/server';

const FALLBACK_GOLD_PRICE_AED = 561.42;
const FALLBACK_SILVER_PRICE_AED = 3.65;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

let cachedGoldPrice: number = FALLBACK_GOLD_PRICE_AED;
let cachedSilverPrice: number = FALLBACK_SILVER_PRICE_AED;
let lastFetchTime = 0;
let cachedCurrency = 'AED';

async function fetchMetalPrice(metal: 'XAU' | 'XAG', currency: string, apiKey: string) {
  try {
    const res = await fetch(`https://www.goldapi.io/api/${metal}/${currency}`, {
      headers: {
        'x-access-token': apiKey,
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      // GoldAPI returns price per troy ounce; convert to grams (1 troy oz = 31.1035 g)
      return data.price / 31.1035;
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

  if (now - lastFetchTime < CACHE_DURATION && cachedCurrency === currency) {
    return NextResponse.json(
      { 
        price_per_gram: cachedGoldPrice, 
        price_per_gram_gold: cachedGoldPrice, 
        price_per_gram_silver: cachedSilverPrice, 
        currency, 
        cached: true 
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  }

  const apiKey = process.env.GOLD_API_KEY;

  if (apiKey) {
    const [goldPrice, silverPrice] = await Promise.all([
      fetchMetalPrice('XAU', currency, apiKey),
      fetchMetalPrice('XAG', currency, apiKey),
    ]);

    if (goldPrice !== null || silverPrice !== null) {
      if (goldPrice !== null) cachedGoldPrice = goldPrice;
      if (silverPrice !== null) cachedSilverPrice = silverPrice;
      cachedCurrency = currency;
      lastFetchTime = now;

      return NextResponse.json(
        {
          price_per_gram: cachedGoldPrice,
          price_per_gram_gold: cachedGoldPrice,
          price_per_gram_silver: cachedSilverPrice,
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
  }

  // Fallback behavior
  if (lastFetchTime === 0 || cachedCurrency !== currency) {
    lastFetchTime = now - CACHE_DURATION + 60000;
  }

  return NextResponse.json({
    price_per_gram: cachedCurrency === currency ? cachedGoldPrice : FALLBACK_GOLD_PRICE_AED,
    price_per_gram_gold: cachedCurrency === currency ? cachedGoldPrice : FALLBACK_GOLD_PRICE_AED,
    price_per_gram_silver: cachedCurrency === currency ? cachedSilverPrice : FALLBACK_SILVER_PRICE_AED,
    currency,
    cached: true,
    last_updated: new Date(lastFetchTime).toISOString(),
  });
}
