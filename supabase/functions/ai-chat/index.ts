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
  console.log('Function invoked. Method:', req.method, 'URL:', req.url);

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request.');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Attempting to parse request body...');
    const { message, conversationId, articleId, userId, articleMarkdown, enableSearch } = await req.json();
    console.log('Request body parsed successfully. Search enabled:', enableSearch);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } }
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

    if (!apiKey) {
      throw new Error("API key not found. Please set GEMINI_API_KEY or provide a custom key in settings.");
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
      throw new Error("Conversation could not be found or created.");
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

    const history = (Array.isArray(conversation.messages) ? conversation.messages : [])
      .filter(m => m && typeof m.role === 'string' && typeof m.content === 'string' && m.content.trim() !== '');

    const allMessages = [...history, { role: 'user', content: message }];

    // Step 1: Consolidate consecutive messages of the same role.
    const consolidatedMessages = allMessages.reduce((acc, current) => {
        const last = acc.length > 0 ? acc[acc.length - 1] : null;
        if (last && last.role === current.role) {
            last.content = `${last.content}\n\n${current.content}`;
        } else {
            acc.push({ role: current.role, content: current.content });
        }
        return acc;
    }, [] as {role: string, content: string}[]);

    // Step 2: Ensure the sequence starts with a 'user' message.
    const firstUserIndex = consolidatedMessages.findIndex(m => m.role === 'user');
    if (firstUserIndex === -1) {
        throw new Error("Cannot process a conversation without any user messages.");
    }
    let validSequence = consolidatedMessages.slice(firstUserIndex);

    // Step 3: Ensure roles alternate correctly (user, model, user, model...).
    const finalSequence = validSequence.filter((msg, index) => {
        if (index === 0) return true; // First message is already known to be 'user'.
        const prevRole = validSequence[index - 1].role;
        return msg.role !== prevRole;
    });

    const geminiContents = finalSequence.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    console.log('Sending request to Gemini API...');
    
    // Build request body conditionally including Google Search
    const requestBody: any = {
      contents: geminiContents,
      systemInstruction: { parts: [{ text: finalSystemPrompt }] },
      generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 8192 },
    };

    // Add Google Search tool if search is enabled
    if (enableSearch) {
      requestBody.tools = [{ googleSearch: {} }];
      console.log('Google Search tool enabled for this request');
    }
    
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    const geminiData = await geminiResponse.json()

    if (!geminiResponse.ok) {
      console.error('Gemini API Error:', geminiData);
      throw new Error(`Gemini API Error: ${geminiData?.error?.message || 'Unknown error'}`);
    }

    let rawResponse;
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      const blockReason = geminiData.promptFeedback?.blockReason;
      rawResponse = `I'm sorry, I can't respond to that. Reason: ${blockReason || 'Content policy'}. Please rephrase your message.`;
      console.warn('Gemini chat blocked:', geminiData.promptFeedback);
    } else {
      rawResponse = geminiData.candidates[0]?.content?.parts[0]?.text || 'I apologize, but I encountered an error.';
    }

    let responsePayload: object;
    let aiMessageContent: string;

    try {
      const parsedResponse = JSON.parse(rawResponse);
      if (parsedResponse.explanation && parsedResponse.newContent) {
        aiMessageContent = parsedResponse.explanation;
        responsePayload = {
          type: 'edit',
          explanation: parsedResponse.explanation,
          newContent: parsedResponse.newContent,
          conversationId: conversation.id,
        };
      } else {
        aiMessageContent = rawResponse;
        responsePayload = {
          type: 'chat',
          content: rawResponse,
          conversationId: conversation.id,
        };
      }
    } catch (e) {
      aiMessageContent = rawResponse;
      responsePayload = {
        type: 'chat',
        content: rawResponse,
        conversationId: conversation.id,
      };
    }

    const updatedMessages = [...finalSequence, { role: 'assistant', content: aiMessageContent }];
    await supabaseClient.from('conversations').update({ messages: updatedMessages }).eq('id', conversation.id);

    return new Response(
      JSON.stringify(responsePayload),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('CRITICAL_ERROR in ai-chat function:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})