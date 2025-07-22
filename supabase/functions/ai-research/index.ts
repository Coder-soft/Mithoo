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
    const { topic, keywords, articleId, userId } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Get user's custom API key if available
    let apiKey = Deno.env.get('GEMINI_API_KEY')
    if (userId) {
      const { data: preferences } = await supabaseClient
        .from('user_preferences')
        .select('custom_gemini_key')
        .eq('user_id', userId)
        .single()
      
      if (preferences?.custom_gemini_key) {
        apiKey = preferences.custom_gemini_key
        console.log('Using user custom API key')
      }
    }

    const researchPrompt = `Research the following topic online and gather the most current, comprehensive information:

Topic: ${topic}
Keywords: ${keywords ? keywords.join(', ') : 'None provided'}

Please search for and provide:
1. Latest facts, statistics, and data
2. Recent developments, news, and trends (within the last year)
3. Expert opinions and authoritative sources
4. Relevant examples, case studies, and real-world applications
5. Current market insights, challenges, and opportunities
6. Recent research papers or studies
7. Industry perspectives and future outlook

Focus on the most current and accurate information available online. Cite sources where possible and prioritize authoritative, recent content.`

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: researchPrompt }] }],
        tools: [{
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: "MODE_DYNAMIC",
              dynamicThreshold: 0.7
            }
          }
        }],
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 4096 },
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
    console.log('Gemini Research Response:', JSON.stringify(geminiData, null, 2));

    if (!geminiResponse.ok) {
      console.error('Gemini API Error:', geminiData?.error?.message || 'Unknown error');
      throw new Error(`Gemini API Error: ${geminiData?.error?.message || 'Unknown error'}`);
    }

    let researchData;
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      const blockReason = geminiData.promptFeedback?.blockReason;
      researchData = `Research failed. Reason: ${blockReason || 'Content policy'}. Please try a different topic or keywords.`;
      console.warn('Gemini research blocked:', geminiData.promptFeedback);
    } else {
      researchData = geminiData.candidates[0]?.content?.parts[0]?.text || 'Research data could not be generated.';
    }

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
      JSON.stringify({ research: researchData, topic, keywords }),
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