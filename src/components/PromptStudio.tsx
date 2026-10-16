import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Users,
  Coins,
  Flame,
  Send,
  Loader2,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { GenerationMode } from '../types/kingdom';

interface PromptStudioProps {
  onGenerate: (prompt: string, mode: GenerationMode) => Promise<void>;
  isGenerating: boolean;
  onQuickAddPreset: (type: 'mason' | 'forager' | 'treasury') => void;
}

export const PromptStudio: React.FC<PromptStudioProps> = ({
  onGenerate,
  isGenerating,
  onQuickAddPreset,
}) => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<GenerationMode>('all_in_one');

  const quickChips = [
    {
      label: 'Stone Mason Guild & Grumpy Dwarf',
      preset: 'mason' as const,
      text: 'Create a Stone Mason guild (2x2 tile) that costs 50 Wood and recruits a Grumpy Dwarf who works 2x faster but needs Tavern visits.',
    },
    {
      label: 'Berry Forager & Nimble Scout',
      preset: 'forager' as const,
      text: 'Add a Berry Forager Hut (1x1) and a Nimble Scout resident with high movement speed.',
    },
    {
      label: 'Royal Treasury with Screen Shake',
      preset: 'treasury' as const,
      text: 'Create a Royal Treasury (3x3) with gold coin burst particles and screen-shake on placement.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onGenerate(prompt.trim(), mode);
  };

  const handleSelectChip = (chip: (typeof quickChips)[0]) => {
    setPrompt(chip.text);
    onQuickAddPreset(chip.preset);
  };

  return (
    <div className="bg-slate-950 border-r border-slate-800/80 p-4 flex flex-col h-full overflow-y-auto">
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-slate-100 tracking-tight">AI Prompt Studio</h2>
        </div>
        <span className="text-[11px] font-mono text-emerald-400">Gemini 3.8 Flash</span>
      </div>

      {/* Generation Mode Tabs */}
      <div className="mb-3">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
          Synthesis Mode
        </label>
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('all_in_one')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              mode === 'all_in_one'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="truncate">All-in-One</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('building')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              mode === 'building'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="truncate">Building Spec</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('resident')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              mode === 'resident'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="truncate">Resident AI</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('resource_chain')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              mode === 'resource_chain'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span className="truncate">Resource Chain</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('arcade_juice')}
            className={`col-span-2 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              mode === 'arcade_juice'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Arcade Juice &amp; FX Controls</span>
          </button>
        </div>
      </div>

      {/* Prompt Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3">
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Natural Language Directive
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="Describe a building, villager with unique traits, or arcade gameplay mechanic..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 font-mono resize-none"
          />
        </div>

        {/* Quick-Prompt Chips */}
        <div>
          <span className="text-[11px] text-slate-400 block mb-1.5">Quick Inspiration Chips:</span>
          <div className="flex flex-col gap-1.5">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectChip(chip)}
                className="text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-xs text-slate-300 transition-all flex items-start gap-2 group"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">{chip.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-auto pt-2">
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="w-full py-2.5 px-4 rounded-lg bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing C# Logic &amp; JSON...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Generate &amp; Queue for Unity</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Informational Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-start gap-2">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>
          Generates strict JSON schema for <code>KingdomManifest.json</code> and configures
          64 PPU sprite sheets with bottom-center pivot coordinates.
        </span>
      </div>
    </div>
  );
};
