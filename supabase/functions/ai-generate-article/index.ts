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
    const { title, outline, researchData, articleId, action = 'generate' } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    let prompt = ''
    if (action === 'generate') {
      prompt = `Write a comprehensive article with the title: "${title}"

${outline ? `Follow this outline:\n${outline}\n` : ''}
${researchData ? `Use this research data:\n${researchData}\n` : ''}

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

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 8192 },
        systemInstruction: {
          parts: [{
            text: `You are an expert article writer for Mithoo, a professional writing platform. Create high-quality, engaging articles that are:

1. Well-researched and factually accurate
2. Professionally written with excellent grammar
3. Engaging and easy to read
4. Properly structured with clear headings
5. Optimized for readability and impact

Always deliver content that meets publication standards and engages readers effectively.`
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
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})