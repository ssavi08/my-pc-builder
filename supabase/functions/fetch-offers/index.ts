import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CACHE_HOURS = 24 * 7   // 7 days
const MAX_OFFERS = 4

// Croatian price format: 1.648,82 €  (dot = thousands, comma = decimal)
const PRICE_RE = /(\d{1,3}(?:\.\d{3})*,\d{2})\s*€/

function parseCroatianPrice(text: string): number | null {
  const match = text.match(PRICE_RE)
  if (!match) return null

  const normalised = match[1].replace(/\./g, '').replace(',', '.')
  const value = Number(normalised)

  return Number.isFinite(value) ? value : null
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const { componentId } = await req.json()

    if (typeof componentId !== 'string' || !componentId) {
      return json({ error: 'componentId is required' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── 1. cache hit? ──
    const { data: cached } = await supabase
      .from('price_cache')
      .select('offers, fetched_at')
      .eq('component_id', componentId)
      .maybeSingle()

    if (cached) {
      const ageMs = Date.now() - new Date(cached.fetched_at).getTime()
      if (ageMs < CACHE_HOURS * 60 * 60 * 1000) {
        return json({ offers: cached.offers, cached: true })
      }
    }

    // ── 2. what are we searching for? ──
    const { data: component, error: compErr } = await supabase
      .from('components')
      .select('name, price')
      .eq('id', componentId)
      .single()

    if (compErr || !component) {
      return json({ error: 'Unknown component' }, 404)
    }

    // ── 3. SerpApi ──
    const url = new URL('https://serpapi.com/search.json')
    url.searchParams.set('engine', 'google')
    url.searchParams.set('q', `${component.name} cijena`)
    url.searchParams.set('gl', 'hr')
    url.searchParams.set('hl', 'hr')
    url.searchParams.set('num', '10')
    url.searchParams.set('api_key', Deno.env.get('SERPAPI_KEY')!)

    const res = await fetch(url)
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`SerpApi ${res.status}: ${body.slice(0, 200)}`)
    }

    const data = await res.json()

    // ── 4. normalise: keep only results with a parseable price ──
    const catalogPrice = Number(component.price)
    const MIN_RATIO = 0.4   // reject anything under 40% of catalogue price
    const MAX_RATIO = 2.0   // or over 200%

    const offers = (data.organic_results ?? [])
      .map((r: any) => {
        const price = parseCroatianPrice(r.snippet ?? '')
        if (price === null || !r.link) return null

        // reject prices that can't plausibly be this component
        if (price < catalogPrice * MIN_RATIO) return null
        if (price > catalogPrice * MAX_RATIO) return null

        const host = hostname(r.link)

        // Croatian retailers only
        if (!host.endsWith('.hr')) return null

        return {
          retailer: host,
          price,
          currency: 'EUR',
          link: r.link,
          title: r.title ?? null,
          favicon: r.favicon ?? null,
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.price - b.price)
      .slice(0, MAX_OFFERS)

    // ── 5. store (only cache non-empty results) ──
    if (offers.length > 0) {
      await supabase
        .from('price_cache')
        .upsert({
          component_id: componentId,
          offers,
          fetched_at: new Date().toISOString(),
        })
    }

    return json({ offers, cached: false })
  } catch (err) {
    console.error('fetch-offers failed:', err)
    return json({ error: 'Could not fetch offers', details: String(err?.message ?? err) }, 500)
  }
})