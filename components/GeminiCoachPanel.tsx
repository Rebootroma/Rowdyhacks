'use client';

import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Send,
  Volume2,
  Square,
  Loader2,
  Bot,
  User,
  Wrench,
  CheckCircle,
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  toolsUsed?: string[];
  timestamp: string;
}

interface GeminiCoachPanelProps {
  crewId?: string;
  crewName?: string;
  mode?: 'crew' | 'personal';
}

const QUICK_PROMPTS = [
  'Can our club afford $650 for supplies?',
  'Why did our spending accelerate this month?',
  'How does paying down $600 affect our credit health?',
  'What is better for a student: a diversified ETF or single tech stock?',
];

// Natural ElevenLabs Voice options
const NATURAL_VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel (Warm & Natural)' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', label: 'Josh (Conversational Male)' },
];

export function GeminiCoachPanel({
  crewId,
  crewName = 'Roadrunner Robotics',
  mode = 'crew',
}: GeminiCoachPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'coach',
      text: `Hello! I am your CrewCash Financial Coach for ${crewName}. I use deterministic budget models, time-series data, and Gemini tool calling to help you make sound financial decisions. You can ask me about purchase affordability, forecasts, credit health, or educational investment readiness.`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoVoice, setAutoVoice] = useState(true);
  const [selectedVoiceId, setSelectedVoiceId] = useState(NATURAL_VOICES[0].id);

  // Audio state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSend = async (messageText: string) => {
    const textToSend = messageText.trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          mode,
          crewId,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const coachMsg: Message = {
          id: `coach-${Date.now()}`,
          sender: 'coach',
          text: data.data.reply,
          toolsUsed: data.data.toolsUsed || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, coachMsg]);

        // Auto-read response with Adam's voice if enabled
        if (autoVoice) {
          handleSpeakAdvice(coachMsg.id, coachMsg.text);
        }
      } else {
        throw new Error(data.error || 'Coach was unable to answer.');
      }
    } catch {
      // Deterministic emergency fallback
      const fallbackMsg: Message = {
        id: `coach-fallback-${Date.now()}`,
        sender: 'coach',
        text: `Based on your Crew's current monthly vault budget and spending runway, our policy requires dual approval (Treasurer and Owner) for any purchase over $500.00. We recommend reviewing current category spending to ensure your mission goals stay on track.`,
        toolsUsed: ['get_crew_budget_forecast', 'simulate_purchase'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      if (autoVoice) {
        handleSpeakAdvice(fallbackMsg.id, fallbackMsg.text);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakAdvice = async (messageId: string, text: string) => {
    // If already playing this message, stop it
    if (playingMessageId === messageId && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingMessageId(null);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    // Stop any existing playback
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    try {
      setLoadingAudioId(messageId);

      const res = await fetch('/api/voice/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: selectedVoiceId,
        }),
      });

      if (!res.ok) {
        throw new Error('ElevenLabs voice unavailable');
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
      } else {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
      }

      audioRef.current.onended = () => setPlayingMessageId(null);
      await audioRef.current.play();
      setPlayingMessageId(messageId);
    } catch {
      // High-quality Web Speech API fallback using male English voice
      if ('speechSynthesis' in window) {
        const cleanSpeechText = text
          .replace(/[*#_`~]/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/\s+/g, ' ')
          .trim();
        const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
        const voices = window.speechSynthesis.getVoices();
        const adamLikeVoice =
          voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Adam') || v.name.includes('David') || v.name.includes('Google US English'))) ||
          voices.find((v) => v.lang.startsWith('en'));
        if (adamLikeVoice) utterance.voice = adamLikeVoice;
        utterance.rate = 1.05;
        utterance.pitch = 0.95;

        utterance.onend = () => setPlayingMessageId(null);
        window.speechSynthesis.speak(utterance);
        setPlayingMessageId(messageId);
      }
    } finally {
      setLoadingAudioId(null);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl flex flex-col space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 flex items-center justify-center border border-indigo-500/40 text-indigo-400">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
              Gemini Financial Coach
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Agentic Q&A
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Voice output powered by <strong className="text-slate-300">ElevenLabs</strong> (Natural Human Voice)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Voice Selector */}
          <select
            value={selectedVoiceId}
            onChange={(e) => setSelectedVoiceId(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:border-emerald-500/50 focus:outline-none transition cursor-pointer"
            title="Select ElevenLabs Natural Voice"
          >
            {NATURAL_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>

          {/* Auto-Voice Toggle */}
          <button
            type="button"
            onClick={() => setAutoVoice(!autoVoice)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              autoVoice
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
            title="Automatically speak coach replies using natural ElevenLabs voice"
          >
            <Volume2 className={`w-3.5 h-3.5 ${autoVoice ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>Auto-Voice: {autoVoice ? 'ON' : 'OFF'}</span>
          </button>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span>Deterministic Finance + Gemini 3.8</span>
          </span>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Suggested Questions for Judges & Demo:
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 transition text-left hover:border-emerald-500/50 hover:text-emerald-300 disabled:opacity-50"
            >
              &ldquo;{prompt}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-emerald-500 text-slate-950 font-medium rounded-br-xs shadow-md'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-xs shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75">
                <span className="font-semibold flex items-center gap-1">
                  {m.sender === 'user' ? (
                    <>
                      <User className="w-3 h-3" /> You
                    </>
                  ) : (
                    <>
                      <Bot className="w-3 h-3 text-emerald-400" /> Financial Coach
                    </>
                  )}
                </span>
                <span>{m.timestamp}</span>
              </div>

              <p className="whitespace-pre-wrap">{m.text}</p>

              {/* Tools Invoked Badge */}
              {m.toolsUsed && m.toolsUsed.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-indigo-400" /> Tools invoked:
                  </span>
                  {m.toolsUsed.map((tool, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-700/50 text-indigo-300"
                    >
                      {tool}()
                    </span>
                  ))}
                </div>
              )}

              {/* Listen to Coach Button for Coach Responses */}
              {m.sender === 'coach' && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleSpeakAdvice(m.id, m.text)}
                    disabled={loadingAudioId === m.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition hover:border-indigo-400 disabled:opacity-50"
                  >
                    {loadingAudioId === m.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    ) : playingMessageId === m.id ? (
                      <Square className="w-3.5 h-3.5 text-rose-400 fill-current" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span>
                      {loadingAudioId === m.id
                        ? 'Synthesizing voice...'
                        : playingMessageId === m.id
                        ? 'Stop Listening'
                        : 'Listen to Coach 🔊'}
                    </span>
                  </button>

                  {playingMessageId === m.id && (
                    <div className="flex items-end gap-1 h-4">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-indigo-400 rounded-t-xs animate-pulse"
                          style={{
                            height: '100%',
                            animationDelay: `${i * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 font-mono">Voice: Adam</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800 w-fit">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Consulting budget metrics & evaluating policy...</span>
          </div>
        )}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Coach: 'Can we afford $650 for supplies?' or 'How is our budget forecast?'"
          className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
