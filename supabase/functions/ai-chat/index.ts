import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MITHoo_SYSTEM_PROMPT = `You are Mithoo, a helpful AI writing assistant. Your purpose is to be a conversational partner and research assistant.

**YOUR CAPABILITIES:**
- You can answer questions, brainstorm ideas, and help with simple text edits.
- You have access to Google Search to find real-time information. Use it whenever a user's query requires up-to-date information or research.
- When asked to make a change to the article, you MUST respond with a JSON object with this exact structure: {\"explanation\": \"A brief, friendly summary of your changes for the chat window.\", \"newContent\": \"The full, updated article content in Markdown.\"}.
- For all other conversation, respond with a normal string. Do not use the JSON format unless you are providing a direct edit.
`

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
      articleContextPrompt = `\n---Current Article Context ("${articleTitle}")---\n${articleMarkdown}\n---End Context---`
    }

    const finalSystemPrompt = `${MITHoo_SYSTEM_PROMPT}${articleContextPrompt}`

    const messages = [...conversation.messages, { role: 'user', content: message }]
    
    const geminiContents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiContents,
        tools: [{ googleSearchRetrieval: {} }],
        systemInstruction: { parts: [{ text: finalSystemPrompt }] }
      }),
    })

    const geminiData = await geminiResponse.json()

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API Error: ${geminiData?.error?.message || 'Unknown error'}`);
    }

    const rawResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I encountered an error.';

    try {
      // Check if the response is the special JSON format for edits
      const editResponse = JSON.parse(rawResponse);
      if (editResponse.explanation && editResponse.newContent) {
        const updatedMessages = [...messages, { role: 'assistant', content: editResponse.explanation }]
        await supabaseClient.from('conversations').update({ messages: updatedMessages }).eq('id', conversation.id)
        
        return new Response(
          JSON.stringify({ type: 'edit', ...editResponse, conversationId: conversation.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (e) {
      // Not an edit, treat as a normal chat message
    }

    const updatedMessages = [...messages, { role: 'assistant', content: rawResponse }]
    await supabaseClient.from('conversations').update({ messages: updatedMessages }).eq('id', conversation.id)

    return new Response(
      JSON.stringify({ type: 'chat', content: rawResponse, conversationId: conversation.id }),
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