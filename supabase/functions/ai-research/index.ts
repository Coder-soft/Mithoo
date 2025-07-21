import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { topic, keywords, articleId } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get user
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Prepare research prompt
    const researchPrompt = `Please research the topic: "${topic}" with focus on these keywords: ${keywords.join(', ')}.

Provide:
1. Key statistics and facts
2. Current trends and developments
3. Expert opinions and insights
4. Supporting evidence and sources
5. Different perspectives on the topic

Format your response as structured research data that can be used for article writing.`

    // Call Gemini API for research
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: researchPrompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        systemInstruction: {
          parts: [{
            text: `You are a professional research assistant specializing in gathering comprehensive information for article writing. Provide detailed, accurate, and well-structured research on any given topic. Focus on:

1. Factual accuracy and credible sources
2. Current and relevant information
3. Multiple perspectives and viewpoints
4. Actionable insights for writers
5. Well-organized and structured presentation

Always provide high-quality research that writers can use to create engaging and informative articles.`
          }]
        }
      }),
    })

    const geminiData = await geminiResponse.json()
    const researchData = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Research data could not be generated.'

    // Update article with research data
    if (articleId) {
      await supabaseClient
        .from('articles')
        .update({ 
          research_data: {
            topic,
            keywords,
            data: researchData,
            generated_at: new Date().toISOString()
          }
        })
        .eq('id', articleId)
        .eq('user_id', user.id)
    }

    return new Response(
      JSON.stringify({ 
        research: researchData,
        topic,
        keywords 
      }),
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