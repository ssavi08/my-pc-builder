import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MIN_BUDGET = 600
const MAX_BUDGET = 9000
const MAX_ATTEMPTS = 3

// Fans are NOT chosen by the model. The user adds them in the UI.
// Every build carries this id so the client always has a fan model and price.
const DEFAULT_FAN_ID = 'fan-arctic-p12-pro-a-rgb-120mm'

// The underspend floor exists to stop the model lowballing a generous budget.
// Near the catalogue floor (~485 EUR for a compatible build) there is nothing to
// lowball with, and a tight floor leaves a window too narrow to hit reliably.
function minBudgetUse(budget: number): number {
  if (budget < 800) return 0.60
  if (budget < 1200) return 0.72
  return 0.80
}

const SYSTEM_PROMPT = `You are a PC building expert. Build a complete, compatible PC from the provided candidate parts, within the user's budget and suited to their purpose.

## THE REASONING FIELD - CRITICAL
## THE REASONING FIELD - CRITICAL
WRITE THE reasoning FIELD IN CROATIAN (hrvatski jezik). The entire application is in
Croatian and this text is shown directly to the user, so it must be written in fluent,
natural Croatian - never in English. Use ordinary Croatian technical vocabulary
(procesor, matična ploča, grafička kartica, napajanje, hladnjak, radna memorija,
kućište, pohrana). Leave brand names, model numbers and standards
(AMD, Ryzen, GeForce, DDR5, AM5, ATX, M.2) exactly as they are - do not translate them.
The componentIds field is unaffected: ids stay exactly as given.

The user sees ONLY your final build. They never see any earlier attempt of yours.
Write the reasoning as if this were your first and only answer.
NEVER mention: previous builds, earlier attempts, corrections, changes, adjustments, downgrades, upgrades, or "to fit the budget we swapped X".
NEVER use words like "previous", "instead of", "was changed", "we adjusted", "retained", "maintained".
Simply explain why each chosen part suits the purpose and budget.
Do NOT mention case fans. The user adds those separately.

## REQUIRED SLOTS
Every build MUST include exactly one: case, motherboard, cpu, cooler, psu, ram.
A build MUST include at least one storage drive.
A discrete gpu is OPTIONAL (see gpu rules below).
Do NOT choose case fans. They are not your concern and are not in the candidate list.

## NEVER REPEAT AN ID
Each id appears at most once in componentIds.

## BUDGET - THE CEILING IS ABSOLUTE
Let TOTAL = sum of all component prices.
TOTAL MUST NOT exceed the budget. This is the rule that matters most.
TOTAL should also not be far below the budget - the user chose it deliberately.
Aim for 85-95% of the budget.

Before you answer, ADD UP YOUR CHOSEN PRICES ONE BY ONE and compare the total to the budget.
If the total is over the budget, replace the SINGLE most expensive part with a cheaper one
from the list. Do not rebuild from scratch - change one part, then add up again.

Tight budgets need care. Below 800 EUR the margins are small, so start from the
cheaper end of each slot and only upgrade one part at a time while the total allows it.
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
7. cooler.radiator_mm MUST NOT exceed case.max_radiator_mm.
8. psu.wattage MUST be at least (cpu.tdp + gpu.tdp) * 1.5. With no gpu, at least cpu.tdp * 2.

## STORAGE
Physical limits: at most 1 M.2, at most 2 2.5-inch SSDs, at most 2 3.5-inch HDDs.
Office and school: one M.2 or one 2.5-inch SSD is enough.
Gaming: one fast M.2; add an SSD only if budget allows.
Content creation: one M.2 plus large HDD(s) or a second SSD.
On tight budgets storage is the first place to economise - one cheap drive is fine.
On larger budgets, prefer higher capacity drives over the cheapest option.

## SELECTION QUALITY
Balance the build. Prioritise by purpose: gaming favours gpu, work and content creation favour cpu, ram and storage.`

function formatCandidates(candidates: any[]) {
  const bySlot: Record<string, any[]> = {}
  for (const c of candidates) {
    // Fans are user-chosen, never model-chosen. Keep them out of the prompt.
    if (c.slot === 'fan') continue
    ;(bySlot[c.slot] ??= []).push(c)
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
    if (c.radiator_mm) bits.push(`${c.radiator_mm}mm radiator`)
    if (c.max_gpu_length_mm) bits.push(`max gpu ${c.max_gpu_length_mm}mm`)
    if (c.max_cooler_height_mm) bits.push(`max cooler ${c.max_cooler_height_mm}mm`)
    if (c.max_radiator_mm) bits.push(`max radiator ${c.max_radiator_mm}mm`)
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

  if (!ids.length) return { errors: ['Build contains no components'], total: 0 }

  // duplicate ids would be silently collapsed by .in(), so catch them first
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dupes.length) errors.push(`Repeated ids: ${[...new Set(dupes)].join(', ')}`)

  const { data: rows, error: rowsErr } = await supabase
    .from('components')
    .select('id, slot, price, socket, sockets, ram_type, form_factor, cooler_type, igpu, tdp, wattage, gpu_length_mm, cooler_height_mm, radiator_mm, max_gpu_length_mm, max_cooler_height_mm, max_radiator_mm, default_models(form_factor)')
    .in('id', ids)

  if (rowsErr) throw new Error(`Component lookup failed: ${rowsErr.message}`)

  const found = new Set((rows ?? []).map((r: any) => r.id))
  for (const id of ids) {
    if (!found.has(id)) errors.push(`Unknown component id: ${id}`)
  }
  if (errors.length) return { errors, total: 0 }

  const bySlot: Record<string, any[]> = {}
  for (const r of rows) (bySlot[r.slot] ??= []).push(r)

  const one = (s: string) => bySlot[s]?.[0]
  const cpu = one('cpu'), mobo = one('motherboard'), ram = one('ram')
  const cooler = one('cooler'), pcCase = one('case'), psu = one('psu')
  const gpu = one('gpu')

  for (const s of ['case', 'motherboard', 'cpu', 'cooler', 'psu', 'ram']) {
    if (!bySlot[s]) errors.push(`Missing required slot: ${s}`)
  }
  if (!bySlot['storage']) errors.push('Build must include at least one storage drive')
  if (bySlot['fan']) errors.push('Do not choose case fans. Remove any fan id.')

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

  if (cooler?.radiator_mm && pcCase?.max_radiator_mm && cooler.radiator_mm > pcCase.max_radiator_mm)
    errors.push(`Radiator too large: ${cooler.radiator_mm}mm > case limit ${pcCase.max_radiator_mm}mm`)

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

  const total = rows.reduce((sum: number, r: any) => sum + Number(r.price), 0)

  if (total > budget) {
    const over = (total - budget).toFixed(2)
    // name the priciest part so the retry has an obvious single substitution
    const priciest = rows.reduce((a: any, b: any) => (Number(b.price) > Number(a.price) ? b : a))
    errors.push(
      `Over budget by ${over} EUR: ${total.toFixed(2)} EUR > ${budget} EUR. ` +
      `The most expensive part is ${priciest.id} at ${priciest.price} EUR - ` +
      `replace that one with something cheaper from the ${priciest.slot} list.`,
    )
  }

  const minUse = minBudgetUse(budget)
  if (total < budget * minUse) {
    const pct = (total / budget * 100).toFixed(1)
    const target = (budget * 0.90).toFixed(0)
    errors.push(`Underspent: ${total.toFixed(2)} EUR is only ${pct}% of the ${budget} EUR budget. Choose better parts so the total is near ${target} EUR.`)
  }

  return { errors, total }
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

      const baseRequest = `Purpose: ${purpose}\nBudget: ${budget} EUR\n\nAvailable parts (id|price|specs):\n\n${formatCandidates(candidates)}`
      console.log(baseRequest) //DEBUG

      let build: any = null
      let result: any = null
      let priorErrors: string[] = []
      let priorIds: string[] = []

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        // Fresh single-turn conversation each attempt. Failure info is passed as
        // CONSTRAINTS, not as chat history, so the model has no "previous turn"
        // to narrate in its reasoning.
        let userContent = baseRequest

        if (priorErrors.length) {
          userContent += `\n\n## CONSTRAINTS FROM A REJECTED DRAFT\nA draft using these ids was rejected: ${JSON.stringify(priorIds)}\nReasons:\n${priorErrors.map((e) => `- ${e}`).join('\n')}\n\nProduce a build that avoids every one of these problems.\nRemember: the reasoning field must read as a first and only answer. Do not mention this draft, any rejection, or any change.`
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
                    reasoning: { type: 'string' },
                  },
                  required: ['componentIds', 'reasoning'],
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
        priorIds = build.componentIds ?? []
      }

      if (result.errors.length) {
        await supabase.rpc('refund_credit', { p_user_id: user.id })
        return json({
          error: 'Could not generate a valid build. Please try again.',
          details: result.errors,
          build,
        }, 422)
      }

      // The model never picks fans. Append the default fan id so the client
      // always has a model and price for the user's +/- controls.
      return json({
        componentIds: [...build.componentIds, DEFAULT_FAN_ID],
        reasoning: build.reasoning,
        fanCount: 0,
        totalPrice: result.total,
        _debugPrompt: baseRequest,        // DEBUG — ukloniti
      })
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