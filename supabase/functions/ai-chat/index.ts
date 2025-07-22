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

    let conversation
    if (conversationId) {
      const { data } = await supabaseClient.from('conversations').select('*').eq('id', conversationId).single()
      conversation = data
    } else {
      const { data } = await supabaseClient.from('conversations').insert({ user_id: user.id, article_id: articleId, messages: [] }).select().single()
      conversation = data
    }

    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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

    const messages = [...conversation.messages, { role: 'user', content: message }]
    
    const geminiContents = messages
      .filter(msg => msg && typeof msg.content === 'string' && msg.content.trim() !== '')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiContents,
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 8192 },
        systemInstruction: {
          parts: [{
            text: finalSystemPrompt
          }]
        }
      }),
    })

    const geminiData = await geminiResponse.json()

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API Error: ${geminiData?.error?.message || 'Unknown error'}`);
    }

    let rawResponse;
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      const blockReason = geminiData.promptFeedback?.blockReason;
      rawResponse = `I am unable to provide a response. Reason: ${blockReason || 'Content policy'}. Please try rephrasing your request.`;
    } else {
      rawResponse = geminiData.candidates[0]?.content?.parts[0]?.text || 'I apologize, but I encountered an error generating a response.';
    }

    let jsonString = rawResponse;
    const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1];
    }

    try {
      const editResponse = JSON.parse(jsonString);
      if (editResponse.explanation && editResponse.newContent) {
        const updatedMessages = [...messages, { role: 'assistant', content: editResponse.explanation }]
        await supabaseClient.from('conversations').update({ messages: updatedMessages }).eq('id', conversation.id)
        
        return new Response(
          JSON.stringify({ 
            type: 'edit',
            explanation: editResponse.explanation,
            newContent: editResponse.newContent,
            conversationId: conversation.id 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (e) {
      // Not an edit, treat as a normal chat message
    }

    const updatedMessages = [...messages, { role: 'assistant', content: rawResponse }]
    await supabaseClient.from('conversations').update({ messages: updatedMessages }).eq('id', conversation.id)

    return new Response(
      JSON.stringify({ 
        type: 'chat',
        content: rawResponse, 
        conversationId: conversation.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-chat function:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})