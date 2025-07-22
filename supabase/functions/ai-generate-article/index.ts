import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MITHoo_SYSTEM_PROMPT = `You are Mithoo, an expert AI research assistant and writer.
Your primary function is to use the provided 'googleSearchRetrieval' tool to gather real-time, up-to-date information from the internet and then write a comprehensive, well-structured article based on your findings.

**CRITICAL INSTRUCTIONS:**
1.  **YOU MUST USE THE SEARCH TOOL:** For any request to write or improve an article, your first step is to perform a comprehensive web search on the topic. Do not rely on your internal knowledge alone.
2.  **DO NOT APOLOGIZE FOR LACK OF ACCESS:** You have full access to the internet via the 'googleSearchRetrieval' tool. Never state that you cannot access real-time information or perform research.
3.  **SYNTHESIZE AND WRITE:** After gathering information, synthesize it into a high-quality article in Markdown format. The article should be engaging, accurate, and reflect the information you found.
4.  **BE HUMAN-LIKE:** Write in a natural, conversational tone. Avoid jargon and clichés.
`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { title, outline, researchData, articleId, action = 'generate', userId } = await req.json()
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

    if (!apiKey) {
      throw new Error("Gemini API key is not configured. Please set it in the environment variables or in the user preferences.");
    }

    let fineTuningPrompt = ''
    const { data: fineTuningData } = await supabaseClient
      .from('fine_tuning_data')
      .select('training_data')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fineTuningData && fineTuningData.training_data) {
      fineTuningPrompt = `

---
Here is some training data that reflects the user's preferred writing style. Adapt your writing to match this style, tone, and structure.

Training Data:
${fineTuningData.training_data}
---
`
    }
    const finalSystemPrompt = `${MITHoo_SYSTEM_PROMPT}${fineTuningPrompt}`

    let prompt = ''
    if (action === 'generate') {
      prompt = `First, perform a comprehensive web search on the topic: "${title}".
Then, write a comprehensive article with the title: "${title}"

${outline ? `Follow this outline:\n${outline}\n` : ''}
${researchData ? `Use this existing research data as a starting point, but feel free to supplement it with your own search:\n${researchData}\n` : ''}

Requirements:
1. Create engaging and informative content
2. Use clear, professional writing style
3. Include proper structure with headings and subheadings
4. Make it between 800-1500 words
5. Ensure accuracy and credibility
6. Write in markdown format

Generate a complete, well-structured article ready for publication.`
    } else if (action === 'improve') {
      prompt = `Please improve this article content by enhancing clarity, engagement, and readability:

Title: ${title}
Content: ${outline}

Focus on:
1. Better flow and transitions
2. More engaging language
3. Clearer explanations
4. Professional tone
5. Better structure

Return the improved version in markdown format.`
    }

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{
          googleSearchRetrieval: {}
        }],
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 8192 },
        systemInstruction: {
          parts: [{
            text: finalSystemPrompt
          }]
        }
      }),
    })

    const geminiData = await geminiResponse.json()
    console.log('Gemini Generate Article Response:', JSON.stringify(geminiData, null, 2));

    if (!geminiResponse.ok) {
      console.error('Gemini API Error:', geminiData?.error?.message || 'Unknown error');
      throw new Error(`Gemini API Error: ${geminiData?.error?.message || 'Unknown error'}`);
    }

    let generatedContent;
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      const blockReason = geminiData.promptFeedback?.blockReason;
      generatedContent = `Article generation failed. Reason: ${blockReason || 'Content policy'}. Please adjust the title or outline.`;
      console.warn('Gemini generation blocked:', geminiData.promptFeedback);
    } else {
      generatedContent = geminiData.candidates[0]?.content?.parts[0]?.text || 'Article content could not be generated.';
    }

    const wordCount = generatedContent.trim().split(/\s+/).length

    if (articleId) {
      await supabaseClient
        .from('articles')
        .update({ content: generatedContent, word_count: wordCount, updated_at: new Date().toISOString() })
        .eq('id', articleId)
        .eq('user_id', user.id)
    }

    return new Response(
      JSON.stringify({ content: generatedContent, wordCount, action }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-generate-article function:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message || 'No specific error message available.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})