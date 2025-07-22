import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MITHoo_SYSTEM_PROMPT = `You are Mithoo, a helpful AI writing assistant.
- Your main goal is to help users write and improve articles.
- When a user asks you to write an article, generate content, or make any changes to the article, your response MUST be a JSON object with this exact structure: {\"explanation\": \"A brief, friendly summary of your changes for the chat window.\", \"newContent\": \"The full, updated article content in Markdown.\"}.
- For example, if the user says 'write an article about dogs', you should generate the full article and return it in the 'newContent' field. If the current article is empty, you are creating a new one. If it has content, you are replacing it.
- For all other conversation, like answering questions or brainstorming that DO NOT involve changing the article, respond with a normal string. Do not use the JSON format for regular conversation.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, conversationId, articleId, userId, articleMarkdown } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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

    let conversationMessages: any[] = [];
    if (conversationId) {
      const { data } = await supabaseClient.from('conversations').select('messages').eq('id', conversationId).single()
      if (data) {
        conversationMessages = Array.isArray(data.messages) ? data.messages : [];
      }
    }

    let articleContextPrompt = ""
    if (articleMarkdown) {
      let articleTitle = 'Untitled';
      if (articleId) {
        const { data: articleData } = await supabaseClient.from('articles').select('title').eq('id', articleId).single();
        if (articleData) {
          articleTitle = articleData.title;
        }
      }

      articleContextPrompt = `
---
The user is currently working on an article titled "${articleTitle}". Here is the current content in Markdown format.

Current Article Content:
${articleMarkdown}
---
`
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

    const finalSystemPrompt = `${MITHoo_SYSTEM_PROMPT}${articleContextPrompt}${fineTuningPrompt}`

    const messages = [...conversationMessages, { role: 'user', content: message }]
    
    const geminiContents = messages
      .filter(msg => msg && typeof msg.content === 'string' && msg.content.trim() !== '')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:streamGenerateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiContents,
        generationConfig: { 
          temperature: 1,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 8192,
        },
        systemInstruction: {
          parts: [{
            text: finalSystemPrompt
          }]
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API request failed with status ${geminiResponse.status}: ${errorText}`);
    }

    return new Response(geminiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream; charset=utf-8" },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})