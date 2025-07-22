import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MITHoo_SYSTEM_PROMPT = `You are Mithoo, an expert AI research assistant.
Your SOLE function is to use the provided 'googleSearchRetrieval' tool to find the most relevant, up-to-date information on a given topic.

**CRITICAL INSTRUCTIONS:**
1.  **YOU MUST USE THE SEARCH TOOL:** When given a topic, execute a web search immediately.
2.  **DO NOT APOLOGIZE FOR LACK OF ACCESS:** You have full access to the internet via your tools.
3.  **SYNTHESIZE AND REPORT:** After searching, provide a comprehensive summary of your findings.
4.  **RETURN SOURCES:** Your response MUST include the sources you used for your research.
`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { topic, keywords, userId } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    let apiKey = Deno.env.get('GEMINI_API_KEY')
    if (userId) {
      const { data: preferences } = await supabaseClient
        .from('user_preferences')
        .select('custom_gemini_key')
        .eq('user_id', userId)
        .single()
      
      if (preferences?.custom_gemini_key) {
        apiKey = preferences.custom_gemini_key
      }
    }

    const researchPrompt = `Research the topic: "${topic}". Keywords: ${keywords ? keywords.join(', ') : 'None'}. Provide a detailed summary of your findings.`

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: researchPrompt }] }],
        tools: [{ googleSearchRetrieval: {} }],
        systemInstruction: { parts: [{ text: MITHoo_SYSTEM_PROMPT }] }
      }),
    })

    const geminiData = await geminiResponse.json()

    if (!geminiResponse.ok) {
      console.error("Gemini API Error:", geminiData);
      throw new Error(`Gemini API Error: ${geminiData?.error?.message || 'Unknown error'}`);
    }

    const candidate = geminiData.candidates?.[0];
    const researchSummary = candidate?.content?.parts?.[0]?.text || 'Research data could not be generated.';
    const attributions = candidate?.groundingMetadata?.groundingAttributions || [];

    const sources = attributions.map((attr: any) => ({
      title: attr.web?.title || 'Untitled Source',
      uri: attr.web?.uri || '#',
    }));

    const researchPayload = {
      research: researchSummary,
      sources: sources,
      topic: topic,
      keywords: keywords,
      generated_at: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(researchPayload),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-research function:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})