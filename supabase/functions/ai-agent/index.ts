import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.15.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set.");
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt, userId } = await req.json()

    if (!prompt) throw new Error('Prompt is required');
    if (!userId) throw new Error('User ID is required');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Generate Plan
    const planPrompt = `You are an expert planner. Based on the user's request, create a concise, step-by-step plan to fulfill it. Return the plan as a JSON array of strings. Do not include any other text, explanations, or markdown formatting.

User request: "${prompt}"`

    const planResult = await model.generateContent(planPrompt)
    const planResponse = await planResult.response
    const planText = planResponse.text()
    
    let plan = []
    try {
      const jsonString = planText.replace(/```json\n?|```/g, '').trim()
      plan = JSON.parse(jsonString)
    } catch (e) {
      console.error("Failed to parse plan JSON, falling back to text splitting:", e.message)
      plan = planText.split('\n').map(s => s.replace(/^- ?/, '').trim()).filter(Boolean)
    }

    // 2. Generate Final Result based on Plan
    const executionPrompt = `You are an AI assistant. Execute the following plan to fulfill the user's original request. Provide a comprehensive final answer in markdown format.

Original Request: "${prompt}"

Plan:
${plan.map((step, i) => `${i + 1}. ${step}`).join('\n')}
`
    const executionResult = await model.generateContent(executionPrompt)
    const executionResponse = await executionResult.response
    const finalResult = executionResponse.text()

    // 3. Save to database
    const { error: sessionError } = await supabaseAdmin
      .from('agent_sessions')
      .insert({
        user_id: userId,
        prompt,
        plan,
        final_result: { content: finalResult },
        status: 'completed',
      })

    if (sessionError) throw sessionError;

    return new Response(JSON.stringify({ plan, finalResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})