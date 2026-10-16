/**
 * KingdomForge: Unity AI Builder & Orchestrator Type Definitions
 */

export type GenerationMode = 'all_in_one' | 'building' | 'resident' | 'resource_chain' | 'arcade_juice';

export type EntityCategory = 'Town' | 'Production' | 'Civic' | 'Military' | 'Arcade';

export interface SpriteConfig {
  isSpriteSheet: boolean;
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  pixelsPerUnit: number; // default 64
  pivotX: number; // default 0.5 (bottom-center)
  pivotY: number; // default 0.0 (bottom-center)
  fps: number;
  animations: {
    idle: number[];
    walkDown: number[];
    walkLeft: number[];
    walkRight: number[];
    walkUp: number[];
    work: number[];
  };
}

export interface BuildingSpec {
  id: string;
  name: string;
  category: EntityCategory;
  footprint: '1x1' | '2x2' | '3x3';
  cost: {
    wood: number;
    stone: number;
    gold: number;
  };
  production: {
    resource: string;
    ratePerMin: number;
  };
  jobsProvided: number;
  arcadeJuice: {
    placementBounce: number; // 0.0 - 1.0
    screenShakeIntensity: number; // 0.0 - 1.0
    particleColor: string; // hex
  };
  spritePrompt: string;
  spriteConfig: SpriteConfig;
  spriteDataUri?: string;
  gridX?: number;
  gridY?: number;
  placed?: boolean;
}

export interface ResidentSpec {
  id: string;
  name: string;
  role: string;
  personalityTrait: string;
  baseWalkSpeed: number; // 1.0 - 5.0
  workEfficiency: number; // 0.5 - 3.0
  needsDecay: {
    hungerRate: number;
    restRate: number;
    moraleRate: number;
  };
  recruitmentCost: {
    gold: number;
  };
  dialogueLines: string[];
  spriteSheetPrompt: string;
  spriteConfig: SpriteConfig;
  spriteDataUri?: string;
  // Live simulation states in sandbox preview
  x?: number;
  y?: number;
  state?: 'Idle' | 'WalkingToWork' | 'Working' | 'SeekingFood' | 'Resting';
  hunger?: number;
  energy?: number;
  targetX?: number;
  targetY?: number;
}

export interface ArcadeFeelSettings {
  placementBounce: number; // 0.0 - 1.0
  screenShake: number; // 0.0 - 1.0
  dayNightCycleSpeed: number; // 0.1 - 5.0
  globalWalkSpeed: number; // 0.5 - 3.0
}

export interface KingdomManifest {
  version: string;
  gameTitle: string;
  lastUpdated: string;
  arcadeSettings: ArcadeFeelSettings;
  buildings: BuildingSpec[];
  residents: ResidentSpec[];
}

export interface PipelineStage {
  id: number;
  title: string;
  subtitle: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  subBadge: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  tag: 'SYSTEM' | 'GEMINI-SPEC' | 'SPRITE-GEN' | 'UNITY-CLI' | 'COMPILER-ERR';
  message: string;
  details?: string;
}

export interface EcosystemConfig {
  executionMode: 'sandbox' | 'local_pc';
  unityExePath: string;
  unityProjectPath: string;
  spriteWebhookUrl: string;
  mediaWebhookUrl: string;
  localWsPort: number;
  autoSync: boolean;
}

export interface TownEconomy {
  wood: number;
  stone: number;
  food: number;
  gold: number;
  morale: number; // 0 - 100
  population: number;
  housingCap: number;
}

export interface KingdomMilestoneTier {
  tier: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  populationRequired: number;
  unlocked: boolean;
  perks: string[];
}

export interface EventChoice {
  label: string;
  cost?: { wood?: number; stone?: number; gold?: number; food?: number };
  reward?: { wood?: number; stone?: number; gold?: number; food?: number; morale?: number };
  outcomeSummary: string;
}

export interface KingdomEvent {
  id: string;
  title: string;
  description: string;
  category: 'Merchant' | 'Disaster' | 'Quest' | 'Festival' | 'Royal Decree';
  choices: EventChoice[];
  resolvedChoiceIndex?: number;
}

export interface WayfarerCandidate {
  id: string;
  name: string;
  role: string;
  trait: string;
  backstory: string;
  wagePerDay: number;
  recruitmentCost: number;
  stats: {
    walkSpeed: number;
    workEfficiency: number;
  };
  spriteDataUri: string;
}

export interface SavedPreset {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  manifest: KingdomManifest;
  economy?: TownEconomy;
}

