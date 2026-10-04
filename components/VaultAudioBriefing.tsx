'use client';

import { useState, useRef } from 'react';
import { Play, Square, Loader2 } from 'lucide-react';

interface VaultAudioBriefingProps {
  briefingText: string;
}

const BRIEFING_VOICES = [
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh (Deep & Relaxed Male)' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Warm & Natural Female)' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum (Tech Analyst Male)' },
];

export function VaultAudioBriefing({ briefingText }: VaultAudioBriefingProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState(BRIEFING_VOICES[0].id);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayBriefing = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/voice/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: briefingText,
          voiceId: selectedVoiceId,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audio briefing');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
      } else {
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsPlaying(false);
        audioRef.current = audio;
      }

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err: any) {
      console.error(err);
      setError('Audio briefing unavailable. Using local fallback.');
      
      // Fallback to Web Speech API if ElevenLabs fails or is offline
      if ('speechSynthesis' in window) {
         const utterance = new SpeechSynthesisUtterance(briefingText);
         // Try to find a good English voice
         const voices = window.speechSynthesis.getVoices();
         const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en'));
         if (enVoice) utterance.voice = enVoice;
         
         utterance.onend = () => setIsPlaying(false);
         window.speechSynthesis.speak(utterance);
         setIsPlaying(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        onClick={handlePlayBriefing}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isPlaying ? (
          <Square className="w-5 h-5 text-rose-500 fill-current" />
        ) : (
          <Play className="w-5 h-5 text-emerald-400 fill-current" />
        )}
        <span>{isPlaying ? 'Stop Briefing' : 'Play Daily Briefing 🎙'}</span>
      </button>

      {/* Voice Selector */}
      <select
        value={selectedVoiceId}
        onChange={(e) => setSelectedVoiceId(e.target.value)}
        disabled={isPlaying || isLoading}
        className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-2 focus:border-emerald-500/50 focus:outline-none transition cursor-pointer"
        title="Select Natural Voice for Daily Briefing"
      >
        {BRIEFING_VOICES.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
      
      {isPlaying && !isLoading && (
        <div className="flex items-end gap-1 h-6">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="w-1.5 bg-emerald-400 rounded-t-sm"
              style={{
                height: '100%',
                animation: `pulse-height 1s ease-in-out ${i * 0.15}s infinite alternate`
              }}
            ></div>
          ))}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes pulse-height {
              0% { height: 20%; }
              100% { height: 100%; }
            }
          `}} />
        </div>
      )}
      
      {error && <span className="text-sm text-rose-500 font-medium">{error}</span>}
    </div>
  );
}
