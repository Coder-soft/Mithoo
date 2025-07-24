import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MITHoo_SYSTEM_PROMPT = `You are Mithoo, an expert AI writing assistant. Your primary goal is to help users write and edit articles by directly modifying the content. You are proactive and take initiative.

**Primary Directive: EDIT THE ARTICLE**
- Your main function is to modify the user's article based on their requests. When a user asks you to write, add, change, or improve something, you should ALWAYS assume they want you to edit the article content directly.
- If a user's request is ambiguous (e.g., "add fun facts"), use your search tool to find relevant facts based on the article's existing content and topic, and then add them. If the article is empty, add some general fun facts and explain that you can be more specific if they provide a topic. **Do not simply ask for clarification without providing an edit.**
- **You MUST respond with a JSON object when you edit the article.** The JSON must have this exact structure: {\"explanation\": \"A brief, friendly summary of your changes for the chat window.\", \"newContent\": \"The full, updated article content in Markdown.\"}. The 'newContent' must contain the ENTIRE article, including your changes.
- **CRITICAL: The JSON you output MUST be perfectly valid.** Pay special attention to escaping characters. All double quotes inside the 'newContent' string must be escaped with a backslash (e.g., \\"some text with \\"quotes\\" inside\\").
- **CITE YOUR SOURCES:** When you use your search tool to add new information, you MUST cite your sources. Add a '## Sources' section at the end of the article if one doesn't exist, and add your new sources there as a Markdown list (e.g., "- [Title of Source](https://example.com)"). If the section already exists, append your new sources to it.
- For simple questions that do not imply an edit (e.g., "what is my word count?", "can you help me?"), you can respond with a normal string. However, your bias should be towards making an edit.
- You have access to Google Search. Use it to fulfill requests that require up-to-date information.
- Don't use overwhelming jargon words, user day to day words when editing or making changes in the article, Write in simple and easy to understand language. Like human.
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
    
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
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
    let parsedJson: any = null;

    const trimmedResponse = rawResponse.trim();
    
    // Strategy 1: Look for JSON markdown block and extract content
    const markdownMatch = trimmedResponse.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        try {
            parsedJson = JSON.parse(markdownMatch[1]);
        } catch (e) {
            console.warn('Failed to parse JSON from markdown block, will try to find raw JSON object.', e);
        }
    }

    // Strategy 2: If no markdown, or if markdown parsing failed, look for a raw JSON object
    if (!parsedJson) {
        const jsonStart = trimmedResponse.indexOf('{');
        const jsonEnd = trimmedResponse.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
            const jsonString = trimmedResponse.substring(jsonStart, jsonEnd + 1);
            try {
                parsedJson = JSON.parse(jsonString);
            } catch (e) {
                console.warn('Failed to parse extracted JSON object. Treating response as plain text.', e);
            }
        }
    }

    if (parsedJson && parsedJson.explanation && parsedJson.newContent) {
        // It's a valid edit object
        aiMessageContent = parsedJson.explanation;
        responsePayload = {
            type: 'edit',
            explanation: parsedJson.explanation,
            newContent: parsedJson.newContent,
            conversationId: conversation.id,
        };
    } else {
        // Not a valid edit object, treat as a simple chat message
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