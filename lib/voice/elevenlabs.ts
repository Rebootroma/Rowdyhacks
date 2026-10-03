export async function generateBriefingAudio(text: string, voiceId?: string): Promise<ArrayBuffer> {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  // Default to Adam
  const ELEVENLABS_VOICE_ID = voiceId || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not configured in environment variables');
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5', // Use a fast and cost-effective model
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`ElevenLabs API error: ${response.statusText} - ${errorData}`);
  }

  return response.arrayBuffer();
}
