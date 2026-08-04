import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MIN_BUDGET = 550
const MAX_BUDGET = 10000
const MIN_BUDGET_USE = 0.85
const MAX_ATTEMPTS = 2

const SYSTEM_PROMPT = `You are a PC building expert. Build a complete, compatible PC from the provided candidate parts, within the user's budget and suited to their purpose.

## THE REASONING FIELD - CRITICAL
The user sees ONLY your final build. They never see any earlier attempt of yours.
Write the reasoning as if this were your first and only answer.
NEVER mention: previous builds, earlier attempts, corrections, changes, adjustments, downgrades, upgrades, or "to fit the budget we swapped X".
NEVER use words like "previous", "instead of", "was changed", "we adjusted", "retained", "maintained".
Simply explain why each chosen part suits the purpose and budget.

## REQUIRED SLOTS
Every build MUST include exactly one: case, motherboard, cpu, cooler, psu, ram, fan.
A build MUST include at least one storage drive.
A discrete gpu is OPTIONAL (see gpu rules below).
ALWAYS include exactly one fan id, even if fanCount is 0. The number of fans installed comes from fanCount, never from repeating the id.

## NEVER REPEAT AN ID
Each id appears at most once in componentIds.

## BUDGET - BOTH LIMITS ARE HARD RULES
Let TOTAL = sum of all component prices + (fanCount x fan price).
TOTAL MUST NOT exceed the budget.
TOTAL MUST be AT LEAST 85% of the budget. A build that spends far less than the budget is a FAILED build.
The user chose their budget deliberately. If they say 1500 EUR they want a 1500 EUR machine, not a 900 EUR one.
Before answering, add up your chosen prices. If TOTAL is below 85% of the budget, choose better parts until it is not:
- spend more on the gpu first (for gaming), or the cpu (for work and content creation)
- then more ram capacity, then faster or larger storage, then a better motherboard
Do not state price totals or percentages in your reasoning. Explain the choices, not the arithmetic.

## INTEGRATED GRAPHICS - READ CAREFULLY
Every cpu line is tagged either "iGPU" or "NO-iGPU". TRUST THE TAG, NOT THE MODEL NAME.
A cpu tagged NO-iGPU has NO integrated graphics and CANNOT display anything without a discrete gpu.
Intel chips ending in F or KF have NO integrated graphics.
AMD chips ending in F have NO integrated graphics.
If you do not include a discrete gpu, you MUST pick a cpu tagged iGPU.

## WHEN TO INCLUDE A DISCRETE GPU
The cheapest build WITH a discrete gpu costs about 652 EUR.
Budget below 750 EUR: OMIT the gpu and pick a cpu tagged iGPU.
Budget 750 EUR or above: INCLUDE a discrete gpu. This applies to ALL purposes, including school and work.
Integrated graphics are a compromise for tight budgets only. Do not use them to save money on a budget that can afford a gpu.

## COMPATIBILITY (hard rules)
1. cpu.socket MUST equal motherboard.socket.
2. ram.ram_type MUST equal motherboard.ram_type.
3. cooler.sockets MUST contain motherboard.socket.
4. An ATX case fits ATX or Micro-ATX motherboards. A Micro-ATX case fits ONLY Micro-ATX motherboards.
5. gpu.gpu_length_mm MUST NOT exceed case.max_gpu_length_mm.
6. cooler.cooler_height_mm MUST NOT exceed case.max_cooler_height_mm.
7. psu.wattage MUST be at least (cpu.tdp + gpu.tdp) * 1.5. With no gpu, at least cpu.tdp * 2.
8. Choose only air coolers (cooler_type "air"). Do not select AIO coolers.

## STORAGE
Physical limits: at most 1 M.2, at most 2 2.5-inch SSDs, at most 2 3.5-inch HDDs.
Office and school: one M.2 or one 2.5-inch SSD is enough.
Gaming: one fast M.2; add an SSD only if budget allows.
Content creation: one M.2 plus large HDD(s) or a second SSD.
On larger budgets, prefer higher capacity drives over the cheapest option.

## CASE FANS
fanCount is how many case fans to install (0-6).
Fan cost = fanCount x fan price, and it COUNTS toward the budget.
1-2 fans for office and school, 3-4 for mid gaming, 5-6 for high-TDP or high-budget builds.

## SELECTION QUALITY
Balance the build. Prioritise by purpose: gaming favours gpu, work and content creation favour cpu, ram and storage.`

function formatCandidates(candidates: any[]) {
  const bySlot: Record<string, any[]> = {}
  for (const c of candidates) {
    (bySlot[c.slot] ??= []).push(c)
  }

  const line = (c: any) => {
    const bits = [c.id, `${c.price} EUR`]
    if (c.socket) bits.push(c.socket)
    if (c.sockets) bits.push(c.sockets.join('/'))
    if (c.ram_type) bits.push(c.ram_type)
    if (c.form_factor) bits.push(c.form_factor)
    if (c.cooler_type) bits.push(c.cooler_type)
    if (c.slot === 'cpu') bits.push(c.igpu ? 'iGPU' : 'NO-iGPU')
    if (c.wattage) bits.push(`${c.wattage}W`)
    if (c.tdp) bits.push(`${c.tdp}W TDP`)
    if (c.ram_slots) bits.push(`${c.ram_slots} slots`)
    if (c.gpu_length_mm) bits.push(`${c.gpu_length_mm}mm long`)
    if (c.cooler_height_mm) bits.push(`${c.cooler_height_mm}mm tall`)
    if (c.max_gpu_length_mm) bits.push(`max gpu ${c.max_gpu_length_mm}mm`)
    if (c.max_cooler_height_mm) bits.push(`max cooler ${c.max_cooler_height_mm}mm`)
    if (c.specs?.modules) bits.push(`${c.specs.modules}x sticks`)
    if (c.specs?.capacity_gb) bits.push(`${c.specs.capacity_gb}GB`)
    return bits.join('|')
  }

  return Object.entries(bySlot)
    .map(([slot, items]) => `## ${slot}\n${items.map(line).join('\n')}`)
    .join('\n\n')
}

async function validateBuild(supabase: any, build: any, budget: number) {
  const errors: string[] = []
  const ids: string[] = build.componentIds ?? []

  const { data: rows } = await supabase
    .from('components')
    .select('id, slot, price, socket, sockets, ram_type, form_factor, cooler_type, igpu, tdp, wattage, gpu_length_mm, cooler_height_mm, max_gpu_length_mm, max_cooler_height_mm, default_models(form_factor)')
    .in('id', ids)

  const found = new Set((rows ?? []).map((r: any) => r.id))
  for (const id of ids) {
    if (!found.has(id)) errors.push(`Unknown component id: ${id}`)
  }
  if (errors.length) return { errors, fanCount: 0, total: 0 }

  const bySlot: Record<string, any[]> = {}
  for (const r of rows) (bySlot[r.slot] ??= []).push(r)

  const one = (s: string) => bySlot[s]?.[0]
  const cpu = one('cpu'), mobo = one('motherboard'), ram = one('ram')
  const cooler = one('cooler'), pcCase = one('case'), psu = one('psu')
  const gpu = one('gpu'), fan = one('fan')

  for (const s of ['case', 'motherboard', 'cpu', 'cooler', 'psu', 'ram']) {
    if (!bySlot[s]) errors.push(`Missing required slot: ${s}`)
  }
  if (!bySlot['storage']) errors.push('Build must include at least one storage drive')

  if (cpu && mobo && cpu.socket !== mobo.socket)
    errors.push(`Socket mismatch: cpu ${cpu.socket} vs motherboard ${mobo.socket}`)

  if (ram && mobo && ram.ram_type !== mobo.ram_type)
    errors.push(`RAM type mismatch: ${ram.ram_type} vs motherboard ${mobo.ram_type}`)

  if (cooler && mobo && !cooler.sockets?.includes(mobo.socket))
    errors.push(`Cooler does not support socket ${mobo.socket}`)

  if (pcCase && mobo && pcCase.form_factor === 'Micro-ATX' && mobo.form_factor !== 'Micro-ATX')
    errors.push('Micro-ATX case cannot fit an ATX motherboard')

  if (gpu && pcCase && gpu.gpu_length_mm > pcCase.max_gpu_length_mm)
    errors.push(`GPU too long: ${gpu.gpu_length_mm}mm > case limit ${pcCase.max_gpu_length_mm}mm`)

  if (cooler && pcCase && cooler.cooler_height_mm > pcCase.max_cooler_height_mm)
    errors.push(`Cooler too tall: ${cooler.cooler_height_mm}mm > case limit ${pcCase.max_cooler_height_mm}mm`)

  if (psu && cpu) {
    const needed = Math.ceil(((cpu.tdp ?? 0) + (gpu?.tdp ?? 0)) * 1.5)
    if (psu.wattage < needed)
      errors.push(`PSU too weak: ${psu.wattage}W < ${needed}W required`)
  }

  if (!gpu && cpu && !cpu.igpu)
    errors.push(`No discrete GPU and ${cpu.id} is tagged NO-iGPU`)

  const drives = bySlot['storage'] ?? []
  const count = (ff: string) => drives.filter((d: any) => d.default_models?.form_factor === ff).length
  if (count('M.2') > 1) errors.push('At most 1 M.2 drive')
  if (count('2.5 inch') > 2) errors.push('At most 2 2.5-inch SSDs')
  if (count('3.5 inch') > 2) errors.push('At most 2 3.5-inch HDDs')

  let fanCount = Math.max(0, Math.min(6, build.fanCount ?? 0))
  if (fanCount > 0 && !fan) fanCount = 0

  const partsTotal = rows.reduce((sum: number, r: any) => sum + Number(r.price), 0)
  const fanTotal = fan ? Number(fan.price) * fanCount : 0
  const total = partsTotal + fanTotal

  if (total > budget)
    errors.push(`Over budget: ${total.toFixed(2)} EUR > ${budget} EUR`)

  if (total < budget * MIN_BUDGET_USE)
    errors.push(`Underspent: ${total.toFixed(2)} EUR is only ${Math.round(total / budget * 100)}% of the ${budget} EUR budget. Minimum is ${Math.round(MIN_BUDGET_USE * 100)}%. Choose better parts.`)

  return { errors, fanCount, total }
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
    const { purpose, budget } = await req.json()

    if (!['school', 'work', 'gaming'].includes(purpose)) {
      return json({ error: 'Invalid purpose' }, 400)
    }
    if (typeof budget !== 'number' || budget < MIN_BUDGET || budget > MAX_BUDGET) {
      return json({ error: `Budget must be between ${MIN_BUDGET} and ${MAX_BUDGET} EUR` }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Not authenticated: no Authorization header' }, 401)

    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userErr } = await supabase.auth.getUser(token)
    const user = userData?.user

    if (userErr || !user) {
      return json({ error: `Not authenticated: ${userErr?.message ?? 'no user for token'}` }, 401)
    }

    const { data: deducted } = await supabase.rpc('deduct_credit', { p_user_id: user.id })
    if (!deducted) return json({ error: 'No credits remaining' }, 402)

    try {
      const { data: candidates, error: candErr } = await supabase.rpc(
        'get_build_candidates', { p_budget: budget },
      )
      if (candErr) throw new Error(`Candidate query failed: ${candErr.message}`)
      if (!candidates?.length) throw new Error('No candidates found for this budget')

      const candidateList = formatCandidates(candidates)
      const baseRequest = `Purpose: ${purpose}\nBudget: ${budget} EUR\n\nAvailable parts (id|price|specs):\n\n${candidateList}`

      let build: any = null
      let result: any = null
      let priorErrors: string[] = []
      let priorBuild: any = null

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        // Fresh single-turn conversation each attempt. Failure info is passed as
        // CONSTRAINTS, not as chat history, so the model has no "previous turn"
        // to narrate in its reasoning.
        let userContent = baseRequest

        if (priorErrors.length) {
          userContent += `\n\n## CONSTRAINTS FROM A REJECTED DRAFT\nA draft using these ids was rejected: ${JSON.stringify(priorBuild?.componentIds ?? [])} with fanCount ${priorBuild?.fanCount}.\nReasons:\n${priorErrors.map((e) => `- ${e}`).join('\n')}\n\nProduce a build that avoids every one of these problems.\nRemember: the reasoning field must read as a first and only answer. Do not mention this draft, any rejection, or any change.`
        }

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userContent },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'pc_build',
                strict: true,
                schema: {
                  type: 'object',
                  properties: {
                    componentIds: { type: 'array', items: { type: 'string' } },
                    fanCount: { type: 'integer' },
                    reasoning: { type: 'string' },
                  },
                  required: ['componentIds', 'fanCount', 'reasoning'],
                  additionalProperties: false,
                },
              },
            },
          }),
        })

        if (!res.ok) {
          const body = await res.text()
          throw new Error(`OpenAI ${res.status}: ${body.slice(0, 300)}`)
        }

        const completion = await res.json()
        build = JSON.parse(completion.choices[0].message.content)
        result = await validateBuild(supabase, build, budget)

        if (!result.errors.length) {
          console.log(`Build valid on attempt ${attempt}, total ${result.total}`)
          break
        }

        console.error(`Attempt ${attempt} failed:`, result.errors)
        priorErrors = result.errors
        priorBuild = build
      }

      if (result.errors.length) {
        await supabase.rpc('refund_credit', { p_user_id: user.id })
        return json({
          error: 'Could not generate a valid build. Please try again.',
          details: result.errors,
          build,
        }, 422)
      }

      return json({ ...build, fanCount: result.fanCount, totalPrice: result.total })
    } catch (err) {
      await supabase.rpc('refund_credit', { p_user_id: user.id })
      console.error('generate-build failed:', err)
      return json({ error: 'Build generation failed', details: String(err?.message ?? err) }, 500)
    }
  } catch (err) {
    console.error('generate-build error:', err)
    return json({ error: 'Bad request', details: String(err?.message ?? err) }, 400)
  }
})