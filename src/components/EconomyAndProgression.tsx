import React, { useState } from 'react';
import {
  TrendingUp,
  Coins,
  Smile,
  Users,
  Trophy,
  Sparkles,
  Calendar,
  UserPlus,
  RefreshCw,
  Flame,
  Shield,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Send,
  Loader2,
} from 'lucide-react';
import {
  TownEconomy,
  KingdomMilestoneTier,
  KingdomEvent,
  WayfarerCandidate,
  BuildingSpec,
  ResidentSpec,
} from '../types/kingdom';
import { generateResidentSpriteSheet } from '../utils/proceduralSprites';

interface EconomyAndProgressionProps {
  economy: TownEconomy;
  buildings: BuildingSpec[];
  residents: ResidentSpec[];
  onUpdateEconomy: (updated: Partial<TownEconomy>) => void;
  onRecruitResident: (resident: ResidentSpec, cost: number) => void;
  onLog: (tag: 'SYSTEM' | 'GEMINI-SPEC' | 'SPRITE-GEN' | 'UNITY-CLI' | 'COMPILER-ERR', msg: string) => void;
}

const DEFAULT_MILESTONES: KingdomMilestoneTier[] = [
  {
    tier: 1,
    title: "Founder's Camp",
    subtitle: 'A single campfire and brave souls',
    populationRequired: 3,
    unlocked: true,
    perks: ['Basic Shelter Construction', 'Wild Berry Gathering', 'Local Campfire Warmth'],
  },
  {
    tier: 2,
    title: 'Pioneer Hamlet',
    subtitle: 'Timber mills and skilled stonecutters',
    populationRequired: 6,
    unlocked: false,
    perks: ['Lumberjack Cabins (+Wood)', 'Wayfarer Recruitment Board', 'Stone Mason Guild'],
  },
  {
    tier: 3,
    title: 'Bustling Town',
    subtitle: 'Tavern songs and trade caravans',
    populationRequired: 10,
    unlocked: false,
    perks: ['Rustic Taverns (+Morale & Rest)', 'Trade Caravans', 'Granary Food Storage'],
  },
  {
    tier: 4,
    title: 'Royal Kingdom',
    subtitle: 'Stone battlements and royal decree',
    populationRequired: 16,
    unlocked: false,
    perks: ['Royal Treasury (+Gold Multiplier)', 'Knights of Eldoria', 'Kingdom Festivals'],
  },
];

const INITIAL_WAYFARERS: WayfarerCandidate[] = [
  {
    id: 'wf_01',
    name: 'Rowan the Herbalist',
    role: 'Apothecary & Forager',
    trait: 'Calm & Resourceful',
    backstory: 'Travels from the Misty Fen with satchels of dried healing root and forest remedies.',
    wagePerDay: 4,
    recruitmentCost: 25,
    stats: { walkSpeed: 2.1, workEfficiency: 1.3 },
    spriteDataUri: generateResidentSpriteSheet('Rowan', 'Herbalist', '#16a34a'),
  },
  {
    id: 'wf_02',
    name: 'Kaelen the Blacksmith',
    role: 'Weaponsmith',
    trait: 'Indomitable Work Ethic',
    backstory: 'Exiled from the High Hold for forging armor without the Guild Seal. Yearns to build anew.',
    wagePerDay: 6,
    recruitmentCost: 45,
    stats: { walkSpeed: 1.8, workEfficiency: 1.9 },
    spriteDataUri: generateResidentSpriteSheet('Kaelen', 'Blacksmith', '#ea580c'),
  },
  {
    id: 'wf_03',
    name: 'Lyra the Bard',
    role: 'Tavern Troubadour',
    trait: 'Inspirational & Witty',
    backstory: 'Sings tales of lost monarchs and ancient dragons. Inspires common workers to double their pace.',
    wagePerDay: 5,
    recruitmentCost: 35,
    stats: { walkSpeed: 2.5, workEfficiency: 1.2 },
    spriteDataUri: generateResidentSpriteSheet('Lyra', 'Bard', '#9333ea'),
  },
];

export const EconomyAndProgression: React.FC<EconomyAndProgressionProps> = ({
  economy,
  buildings,
  residents,
  onUpdateEconomy,
  onRecruitResident,
  onLog,
}) => {
  const [wayfarers, setWayfarers] = useState<WayfarerCandidate[]>(INITIAL_WAYFARERS);
  const [activeEvent, setActiveEvent] = useState<KingdomEvent | null>({
    id: 'evt_initial',
    title: 'The Wandering Merchant Caravan',
    description:
      'A colourful wagon halts beside the camp. The peddler offers exotic grain seeds and tempered iron tools in exchange for coin.',
    category: 'Merchant',
    choices: [
      {
        label: 'Purchase Grain Seeds (Cost: 25 Gold)',
        cost: { gold: 25 },
        reward: { food: 60, morale: 8 },
        outcomeSummary: 'Villagers celebrate with hearty porridge; grain silos fill for the coming month.',
      },
      {
        label: 'Trade 40 Wood for Iron Tools',
        cost: { wood: 40 },
        reward: { stone: 35, morale: 5 },
        outcomeSummary: 'The sturdy tools allow masons to quarry stone with much higher efficiency.',
      },
      {
        label: 'Politely decline and send them forward',
        outcomeSummary: 'The caravan rolls on toward the capital. No coin was spent.',
      },
    ],
  });

  const [isGeneratingEvent, setIsGeneratingEvent] = useState(false);
  const [customEventPrompt, setCustomEventPrompt] = useState('');
  const [isGeneratingRecruit, setIsGeneratingRecruit] = useState(false);
  const [customRecruitPrompt, setCustomRecruitPrompt] = useState('');

  // Calculate net resource rates per minute from placed buildings
  const placedBuildings = buildings.filter((b) => b.placed);
  let woodRate = 0;
  let stoneRate = 0;
  let goldRate = 0;
  let foodRate = 12; // base foraging

  placedBuildings.forEach((b) => {
    const res = b.production.resource.toLowerCase();
    const rate = b.production.ratePerMin;
    if (res.includes('wood')) woodRate += rate;
    else if (res.includes('stone')) stoneRate += rate;
    else if (res.includes('gold')) goldRate += rate;
    else if (res.includes('food') || res.includes('berry')) foodRate += rate;
  });

  // Calculate current Tier based on population
  const population = residents.length;
  const currentTier =
    population >= 16 ? 4 : population >= 10 ? 3 : population >= 6 ? 2 : 1;

  // Next tier progress
  const nextTierTarget = currentTier === 1 ? 6 : currentTier === 2 ? 10 : currentTier === 3 ? 16 : 25;
  const prevTierTarget = currentTier === 1 ? 0 : currentTier === 2 ? 6 : currentTier === 3 ? 10 : 16;
  const tierProgress = Math.min(
    100,
    Math.round(((population - prevTierTarget) / (nextTierTarget - prevTierTarget)) * 100)
  );

  // Harvest production tick
  const handleHarvestDay = () => {
    onUpdateEconomy({
      wood: economy.wood + Math.round(woodRate / 2),
      stone: economy.stone + Math.round(stoneRate / 2),
      food: economy.food + Math.round(foodRate / 2),
      gold: economy.gold + Math.round(goldRate / 2) + 15,
      morale: Math.min(100, Math.max(20, economy.morale + 2)),
    });
    onLog('SYSTEM', `Production harvest: +${Math.round(woodRate / 2)}W, +${Math.round(stoneRate / 2)}S, +${Math.round(goldRate / 2) + 15}G`);
  };

  // Resolve active event choice
  const handleResolveChoice = (choiceIndex: number) => {
    if (!activeEvent || activeEvent.resolvedChoiceIndex !== undefined) return;

    const choice = activeEvent.choices[choiceIndex];
    if (choice.cost) {
      if (
        (choice.cost.gold && economy.gold < choice.cost.gold) ||
        (choice.cost.wood && economy.wood < choice.cost.wood) ||
        (choice.cost.stone && economy.stone < choice.cost.stone) ||
        (choice.cost.food && economy.food < choice.cost.food)
      ) {
        alert('Insufficient resources for this choice!');
        return;
      }

      onUpdateEconomy({
        gold: economy.gold - (choice.cost.gold || 0),
        wood: economy.wood - (choice.cost.wood || 0),
        stone: economy.stone - (choice.cost.stone || 0),
        food: economy.food - (choice.cost.food || 0),
      });
    }

    if (choice.reward) {
      onUpdateEconomy({
        gold: economy.gold + (choice.reward.gold || 0),
        wood: economy.wood + (choice.reward.wood || 0),
        stone: economy.stone + (choice.reward.stone || 0),
        food: economy.food + (choice.reward.food || 0),
        morale: Math.min(100, Math.max(0, economy.morale + (choice.reward.morale || 0))),
      });
    }

    setActiveEvent({
      ...activeEvent,
      resolvedChoiceIndex: choiceIndex,
    });

    onLog('GEMINI-SPEC', `Resolved Event: "${activeEvent.title}" -> ${choice.outcomeSummary}`);
  };

  // Generate new event via Gemini
  const handleGenerateNewEvent = async (promptOverride?: string) => {
    setIsGeneratingEvent(true);
    onLog('GEMINI-SPEC', 'Prompting Gemini for Kingdom Quest / Disaster Event...');

    try {
      const resp = await fetch('/api/generate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptOverride || customEventPrompt || 'Generate an unexpected town dilemma' }),
      });
      const data = await resp.json();
      if (data.event) {
        setActiveEvent(data.event);
        onLog('GEMINI-SPEC', `New Event Generated: "${data.event.title}" [${data.event.category}]`);
      }
      setCustomEventPrompt('');
    } catch (e: any) {
      onLog('COMPILER-ERR', `Failed to generate event: ${e.message}`);
    } finally {
      setIsGeneratingEvent(false);
    }
  };

  // Recruit candidate
  const handleRecruitWayfarer = (candidate: WayfarerCandidate) => {
    if (economy.gold < candidate.recruitmentCost) {
      alert(`Need ${candidate.recruitmentCost} Gold to recruit ${candidate.name}!`);
      return;
    }

    const newResident: ResidentSpec = {
      id: `res_${candidate.id}_${Date.now().toString(36)}`,
      name: candidate.name,
      role: candidate.role,
      personalityTrait: candidate.trait,
      baseWalkSpeed: candidate.stats.walkSpeed,
      workEfficiency: candidate.stats.workEfficiency,
      needsDecay: { hungerRate: 1.0, restRate: 0.8, moraleRate: 0.6 },
      recruitmentCost: { gold: candidate.recruitmentCost },
      dialogueLines: [
        `Honor to the Kingdom! Ready for labor.`,
        candidate.backstory.slice(0, 50) + '...',
      ],
      spriteSheetPrompt: `4-direction pixel art ${candidate.role} character`,
      spriteConfig: {
        isSpriteSheet: true,
        columns: 4,
        rows: 4,
        cellWidth: 64,
        cellHeight: 64,
        pixelsPerUnit: 64,
        pivotX: 0.5,
        pivotY: 0.0,
        fps: 8,
        animations: {
          idle: [0],
          walkDown: [0, 1, 2, 3],
          walkLeft: [4, 5, 6, 7],
          walkRight: [8, 9, 10, 11],
          walkUp: [12, 13, 14, 15],
          work: [1, 3],
        },
      },
      spriteDataUri: candidate.spriteDataUri,
      x: 4 + Math.floor(Math.random() * 4),
      y: 4 + Math.floor(Math.random() * 4),
      state: 'WalkingToWork',
    };

    onRecruitResident(newResident, candidate.recruitmentCost);
    setWayfarers(wayfarers.filter((w) => w.id !== candidate.id));
    onLog('SYSTEM', `Recruited ${candidate.name} (${candidate.role}) for ${candidate.recruitmentCost} Gold!`);
  };

  // Reroll wayfarers
  const handleRerollWayfarers = () => {
    const roles = [
      { role: 'Tavern Cook', trait: 'Hearty & Cheerful', color: '#f59e0b', cost: 20 },
      { role: 'Scout Archer', trait: 'Eagle-Eyed & Swift', color: '#10b981', cost: 35 },
      { role: 'Rune Scholar', trait: 'Wise & Inquisitive', color: '#6366f1', cost: 50 },
      { role: 'Stone Breaker', trait: 'Tenacious & Tough', color: '#78350f', cost: 30 },
    ];

    const newCandidates: WayfarerCandidate[] = roles.slice(0, 3).map((r, i) => {
      const names = ['Thorne', 'Astrid', 'Garrick', 'Mira', 'Vaughn'];
      const name = `${names[Math.floor(Math.random() * names.length)]} the ${r.role.split(' ')[0]}`;
      return {
        id: `wf_${Date.now()}_${i}`,
        name,
        role: r.role,
        trait: r.trait,
        backstory: `Traveled through mountain snow seeking a thriving settlement to ply their trade.`,
        wagePerDay: 5,
        recruitmentCost: r.cost,
        stats: {
          walkSpeed: 1.8 + Math.random() * 0.8,
          workEfficiency: 1.2 + Math.random() * 0.8,
        },
        spriteDataUri: generateResidentSpriteSheet(name, r.role, r.color),
      };
    });

    setWayfarers(newCandidates);
    onLog('SYSTEM', 'Campfire wayfarer recruitment board rerolled with new arrivals.');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-y-auto p-4 space-y-4">
      {/* 1. Live Resource Economy Bar */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Kingdom Economy &amp; Treasury
            </h2>
          </div>
          <button
            onClick={handleHarvestDay}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Tick Harvest Cycle (+Day)</span>
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
          {/* Wood */}
          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Wood</span>
            <div className="font-bold font-mono text-amber-400 text-sm mt-0.5">
              {economy.wood} <span className="text-[10px] text-emerald-400">+{woodRate}/m</span>
            </div>
          </div>

          {/* Stone */}
          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Stone</span>
            <div className="font-bold font-mono text-slate-300 text-sm mt-0.5">
              {economy.stone} <span className="text-[10px] text-emerald-400">+{stoneRate}/m</span>
            </div>
          </div>

          {/* Food */}
          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Food Stores</span>
            <div className="font-bold font-mono text-teal-300 text-sm mt-0.5">
              {economy.food} <span className="text-[10px] text-emerald-400">+{foodRate}/m</span>
            </div>
          </div>

          {/* Gold */}
          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Gold Treasury</span>
            <div className="font-bold font-mono text-yellow-400 text-sm mt-0.5">
              {economy.gold} <span className="text-[10px] text-emerald-400">+{goldRate}/m</span>
            </div>
          </div>

          {/* Morale */}
          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Town Morale</span>
            <div className="font-bold font-mono text-rose-300 text-sm mt-0.5 flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-rose-400" />
              <span>{economy.morale}%</span>
            </div>
          </div>

          {/* Population */}
          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Citizens / Housing</span>
            <div className="font-bold font-mono text-indigo-300 text-sm mt-0.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {population} / {economy.housingCap}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Progression & Milestone Tech Tree */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Settlement Progression Tiers
            </h2>
          </div>
          <span className="text-xs font-mono text-amber-400 font-semibold">
            Current: Tier {currentTier} · {DEFAULT_MILESTONES[currentTier - 1].title}
          </span>
        </div>

        {/* Milestone Tier Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mb-3">
          {DEFAULT_MILESTONES.map((m) => {
            const isUnlocked = currentTier >= m.tier;
            const isCurrent = currentTier === m.tier;

            return (
              <div
                key={m.tier}
                className={`p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-amber-950/40 border-amber-500/80 text-amber-100 shadow-md'
                    : isUnlocked
                    ? 'bg-slate-950/80 border-emerald-900/60 text-slate-300'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-xs">
                    T{m.tier}: {m.title}
                  </span>
                  {isUnlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      Pop {m.populationRequired}+
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight mb-2">{m.subtitle}</p>

                <div className="space-y-1 text-[10px]">
                  {m.perks.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-1 truncate text-slate-400">
                      <span className="text-emerald-400 font-mono">✓</span>
                      <span className="truncate">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar to next tier */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-400">
              Advancement to Tier {Math.min(4, currentTier + 1)}:
            </span>
            <span className="font-mono text-emerald-400 font-semibold tabular-nums">
              {population} / {nextTierTarget} Citizens ({tierProgress}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${tierProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. AI Kingdom Events & Quests Simulator */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Kingdom Events, Quests &amp; Disasters Simulator
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleGenerateNewEvent('Bandit Clan demands 40 Gold tribute')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
            >
              Bandit Raid
            </button>
            <button
              onClick={() => handleGenerateNewEvent('Harvest Festival boosts town morale')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
            >
              Festival
            </button>
            <button
              onClick={() => handleGenerateNewEvent()}
              disabled={isGeneratingEvent}
              className="flex items-center gap-1 px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isGeneratingEvent ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Generate AI Event</span>
            </button>
          </div>
        </div>

        {activeEvent && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-900 px-1.5 py-0.5 rounded uppercase">
                  {activeEvent.category}
                </span>
                <h3 className="font-bold text-slate-100 text-sm mt-1">{activeEvent.title}</h3>
              </div>
              {activeEvent.resolvedChoiceIndex !== undefined && (
                <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resolved</span>
                </span>
              )}
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">{activeEvent.description}</p>

            {/* Event Choice Buttons */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] text-slate-400 font-semibold block">Player Directive:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeEvent.choices.map((choice, idx) => {
                  const isSelected = activeEvent.resolvedChoiceIndex === idx;
                  const isResolved = activeEvent.resolvedChoiceIndex !== undefined;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleResolveChoice(idx)}
                      disabled={isResolved}
                      className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between gap-1 text-xs ${
                        isSelected
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                          : isResolved
                          ? 'opacity-40 border-slate-800 bg-slate-900 text-slate-400'
                          : 'bg-slate-900 hover:bg-slate-850 border-slate-700 hover:border-emerald-500 text-slate-200'
                      }`}
                    >
                      <div className="font-semibold text-xs">{choice.label}</div>
                      <div className="text-[11px] text-slate-400">{choice.outcomeSummary}</div>
                      {(choice.cost || choice.reward) && (
                        <div className="text-[10px] font-mono flex flex-wrap gap-2 text-slate-400 mt-1">
                          {choice.cost && (
                            <span className="text-rose-400">
                              Cost: {choice.cost.gold ? `${choice.cost.gold}G ` : ''}
                              {choice.cost.wood ? `${choice.cost.wood}W ` : ''}
                            </span>
                          )}
                          {choice.reward && (
                            <span className="text-emerald-400">
                              Reward: {choice.reward.food ? `+${choice.reward.food} Food ` : ''}
                              {choice.reward.morale ? `+${choice.reward.morale}% Morale ` : ''}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Interactive Wayfarer Recruitment Board Simulator */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 shadow-lg">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-teal-400" />
            <div>
              <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Wayfarer Recruitment Board (Campfire)
              </h2>
              <p className="text-[11px] text-slate-400">
                Procedural arrivals seeking employment in your kingdom
              </p>
            </div>
          </div>

          <button
            onClick={handleRerollWayfarers}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
            <span>Reroll Daily Arrivals</span>
          </button>
        </div>

        {/* Wayfarer Candidate Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {wayfarers.length === 0 ? (
            <div className="col-span-3 text-center py-6 text-slate-500 text-xs">
              No wayfarers at the campfire today. Click "Reroll Daily Arrivals" to summon new travelers.
            </div>
          ) : (
            wayfarers.map((w) => (
              <div
                key={w.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 p-0.5">
                    <img
                      src={w.spriteDataUri}
                      alt={w.name}
                      className="w-full h-full object-contain pixelated"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-100 text-xs truncate">{w.name}</h3>
                    <div className="text-[10px] font-mono text-teal-400">{w.role}</div>
                    <div className="text-[10px] text-amber-300 mt-0.5">Trait: {w.trait}</div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {w.backstory}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                  <span>Speed: {w.stats.walkSpeed.toFixed(1)}</span>
                  <span>Eff: {w.stats.workEfficiency.toFixed(1)}x</span>
                  <span className="text-amber-400 font-bold">{w.recruitmentCost} Gold</span>
                </div>

                <button
                  onClick={() => handleRecruitWayfarer(w)}
                  className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Recruit into Kingdom</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
