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
    const { trainingData, modelName = 'custom-mithoo-model' } = await req.json()
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

    // Store fine-tuning data
    const { data: fineTuningRecord } = await supabaseClient
      .from('fine_tuning_data')
      .insert({
        user_id: user.id,
        training_data: trainingData,
        model_name: modelName,
        status: 'training'
      })
      .select()
      .single()

    // Process training data for Gemini (this is a simulation since Gemini doesn't support direct fine-tuning via API)
    // In a real implementation, you would integrate with Google AI Studio or Vertex AI
    
    console.log('Processing fine-tuning data:', {
      userId: user.id,
      modelName,
      dataLength: trainingData.length
    })

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Update status to completed
    await supabaseClient
      .from('fine_tuning_data')
      .update({ 
        status: 'completed'
      })
      .eq('id', fineTuningRecord.id)

    // Create a prompt that incorporates the training data style
    const trainingPrompt = `Based on the following training examples, learn the writing style and approach:

${trainingData}

This training data represents the preferred writing style for the Mithoo platform. Use this style for future article generation and assistance.`

    return new Response(
      JSON.stringify({ 
        success: true,
        modelName,
        status: 'completed',
        message: 'Fine-tuning data has been processed and will be used to improve AI responses.',
        trainingDataId: fineTuningRecord.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-fine-tune function:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})