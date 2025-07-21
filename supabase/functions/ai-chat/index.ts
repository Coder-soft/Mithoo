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
    const { message, conversationId, articleId } = await req.json()
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

    // Get or create conversation
    let conversation
    if (conversationId) {
      const { data } = await supabaseClient
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()
      conversation = data
    } else {
      const { data } = await supabaseClient
        .from('conversations')
        .insert({
          user_id: user.id,
          article_id: articleId,
          messages: []
        })
        .select()
        .single()
      conversation = data
    }

    if (!conversation) {
      return new Response('Conversation not found', { status: 404, headers: corsHeaders })
    }

    // Prepare messages for Gemini
    const messages = [...conversation.messages, { role: 'user', content: message }]
    
    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        systemInstruction: {
          parts: [{
            text: `You are an AI writing assistant for Mithoo, a professional article writing platform. Help users plan, research, and write high-quality articles. 

Your capabilities include:
1. Article Planning: Help create outlines, suggest topics, and structure content
2. Research: Provide insights and suggest research directions
3. Writing: Generate content, improve style, and provide revisions
4. Editing: Review and suggest improvements for clarity and engagement

Always be helpful, professional, and focused on creating excellent written content.`
          }]
        }
      }),
    })

    const geminiData = await geminiResponse.json()
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I encountered an error generating a response.'

    // Update conversation with new messages
    const updatedMessages = [...messages, { role: 'assistant', content: aiResponse }]
    
    await supabaseClient
      .from('conversations')
      .update({ 
        messages: updatedMessages,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation.id)

    return new Response(
      JSON.stringify({ 
        response: aiResponse, 
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