import { NextResponse } from 'next/server';

// Gold Price API Route with Caching
// Using a mock value as fallback if no API key is provided
let cachedPrice: number | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function GET() {
  const now = Date.now();
  
  if (cachedPrice && now - lastFetchTime < CACHE_DURATION) {
    return NextResponse.json({ price_per_gram: cachedPrice, currency: 'AED', cached: true });
  }

  try {
    const apiKey = process.env.GOLD_API_KEY;
    
    if (apiKey) {
      // In a real implementation, we would fetch from GoldAPI.io or similar
      // const res = await fetch('https://www.goldapi.io/api/XAU/AED', {
      //   headers: { 'x-access-token': apiKey }
      // });
      // const data = await res.json();
      // cachedPrice = data.price / 31.1035; // Convert from Troy Ounce to Gram
      
      // Mocking 24K Gold Price in AED (approx ~285 AED/g)
      cachedPrice = 286.45; 
      lastFetchTime = now;
    } else {
      // Fallback to a reasonable default if no key
      cachedPrice = 286.45;
      lastFetchTime = now;
    }

    return NextResponse.json({ 
      price_per_gram: cachedPrice, 
      currency: 'AED', 
      cached: false,
      last_updated: new Date(lastFetchTime).toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch gold price' }, { status: 500 });
  }
}
