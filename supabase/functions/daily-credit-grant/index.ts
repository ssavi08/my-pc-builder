import { createClient } from 'npm:@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY'),
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await userClient.auth.getUser()
  if (error || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )

  const { data: granted, error: grantError } = await adminClient
    .rpc('maybe_grant_daily_credit', { p_user_id: user.id })

  if (grantError) {
    return new Response('Grant failed', { status: 500, headers: corsHeaders })
  }

  return new Response(
    JSON.stringify({ granted }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})