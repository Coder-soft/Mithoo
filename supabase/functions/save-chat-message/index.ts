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
    const { conversationId, userMessage, assistantMessage, articleId } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let convId = conversationId;
    if (!convId) {
      // Create a new conversation if one doesn't exist
      const { data: newConv, error: newConvError } = await supabaseClient
        .from('conversations')
        .insert({ user_id: user.id, article_id: articleId, messages: [] })
        .select('id')
        .single();
      
      if (newConvError) throw newConvError;
      convId = newConv.id;
    }

    const { data: convData, error: convError } = await supabaseClient
      .from('conversations')
      .select('messages')
      .eq('id', convId)
      .single();

    if (convError) throw convError;

    const existingMessages = Array.isArray(convData.messages) ? convData.messages : [];
    const updatedMessages = [
      ...existingMessages,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantMessage }
    ];

    const { error: updateError } = await supabaseClient
      .from('conversations')
      .update({ messages: updatedMessages })
      .eq('id', convId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, conversationId: convId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in save-chat-message function:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})