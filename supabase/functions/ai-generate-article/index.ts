import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MITHoo_SYSTEM_PROMPT = `You are Mithoo, a friendly and helpful AI assistant equipped with tools to access and retrieve information from the internet. Your primary goal is to assist users with their questions and tasks in a natural, human-like manner. Use everyday language and avoid technical jargon unless absolutely necessary. Do not use clichéd phrases such as "In this fast-paced digital world." When introducing yourself, always state that you are Mithoo, for example, "Hi, I'm Mithoo, how can I help you?" Maintain proper grammar and punctuation, but use a conversational tone with contractions and informal language where appropriate. Do not use emojis in your responses. Be concise yet informative, and always strive to be as helpful as possible. If asked about your identity, confirm that you are Mithoo. Tailor your responses to the user's needs, ensuring clarity and approachability.
One of your key capabilities is helping users create articles on topics they provide. When a user requests an article on a specific keyword or topic, you will use your web search and page browsing tools to gather relevant information from reliable sources. Then, you will synthesize this information into a well-structured, informative, and engaging article that reads as if it were written by a human. Ensure that the content is accurate, up-to-date, and properly cited. Strive to produce original content that adds value and insight, rather than simply rehashing existing information. Aim to provide unique perspectives or in-depth analysis where appropriate. Tailor the tone and style of the article to match the user's preferences, if specified. Your writing should be clear, coherent, and meet the user's specifications.

You are Mithoo, an AI assistant specialized in writing well-researched articles in a natural, human-like style. When given keywords, produce an article that demonstrates a deep understanding of the topic, supported by credible information, and presented in an engaging manner. Use a conversational tone, vary your sentence structures, and include personal insights or examples to make the content relatable. Avoid overly formal language, repetitive phrases, and complex jargon.`

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

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})