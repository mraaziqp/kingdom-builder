import React, { useState, useEffect, useRef } from 'react';
import {
  BuildingSpec,
  ResidentSpec,
  KingdomManifest,
  EcosystemConfig,
  PipelineStage,
  LogEntry,
  GenerationMode,
  ArcadeFeelSettings,
  SpriteConfig,
  TownEconomy,
  SavedPreset,
} from './types/kingdom';
import { getInitialManifest } from './utils/initialManifest';
import { generateBuildingSprite, generateResidentSpriteSheet } from './utils/proceduralSprites';
import { HeaderBar } from './components/HeaderBar';
import { PipelineTracker } from './components/PipelineTracker';
import { PromptStudio } from './components/PromptStudio';
import { TownGridSandbox } from './components/TownGridSandbox';
import { ManifestRoster } from './components/ManifestRoster';
import { SpriteStudio } from './components/SpriteStudio';
import { TerminalConsole } from './components/TerminalConsole';
import { PcSetupModal } from './components/PcSetupModal';
import { EcosystemConfigModal } from './components/EcosystemConfigModal';
import { RawJsonModal } from './components/RawJsonModal';
import { SavedPresetManagerModal } from './components/SavedPresetManagerModal';
import { EconomyAndProgression } from './components/EconomyAndProgression';
import { PreFlightModal } from './components/PreFlightModal';
import { Map, Layers, Scissors, TrendingUp } from 'lucide-react';

const INITIAL_STAGES: PipelineStage[] = [
  {
    id: 1,
    title: 'AI Spec & Logic',
    subtitle: 'JSON Schema & MonoBehaviours',
    status: 'completed',
    progress: 100,
    subBadge: 'Manifest v1.2 OK',
  },
  {
    id: 2,
    title: 'Sprite & Media Hooks',
    subtitle: '64 PPU & Pivot Calibration',
    status: 'completed',
    progress: 100,
    subBadge: '6 Assets Prepared',
  },
  {
    id: 3,
    title: 'AssetDatabase Sync',
    subtitle: 'Writing to Assets/Resources/',
    status: 'idle',
    progress: 0,
    subBadge: 'Ready to write',
  },
  {
    id: 4,
    title: 'Arcade Prefab Wiring',
    subtitle: 'A* Grid, Bounce & Screen Shake',
    status: 'idle',
    progress: 0,
    subBadge: 'Waiting for Sync',
  },
  {
    id: 5,
    title: 'Windows64 Packaging',
    subtitle: 'Unity.exe -batchmode Compile',
    status: 'idle',
    progress: 0,
    subBadge: 'Builds/KingdomBuilder.exe',
  },
];

export default function App() {
  const [manifest, setManifest] = useState<KingdomManifest>(getInitialManifest);
  const [config, setConfig] = useState<EcosystemConfig>(() => {
    const saved = localStorage.getItem('kingdom_ecosystem_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      executionMode: 'sandbox',
      unityExePath: 'C:/Program Files/Unity/Hub/Editor/2022.3.20f1/Editor/Unity.exe',
      unityProjectPath: 'C:/Users/Developer/Documents/UnityKingdomGame',
      spriteWebhookUrl: '',
      mediaWebhookUrl: '',
      localWsPort: 8080,
      autoSync: true,
    };
  });

  // Pipeline states
  const [stages, setStages] = useState<PipelineStage[]>(INITIAL_STAGES);
  const [activeStageId, setActiveStageId] = useState<number>(1);
  const [overallProgress, setOverallProgress] = useState<number>(40);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isInjected, setIsInjected] = useState<boolean>(false);

  // Economy state
  const [economy, setEconomy] = useState<TownEconomy>({
    wood: 120,
    stone: 60,
    food: 85,
    gold: 180,
    morale: 90,
    population: 3,
    housingCap: 8,
  });

  // Tabs
  const [centerTab, setCenterTab] = useState<'grid' | 'manifest' | 'sprite_studio' | 'economy'>('grid');
  const [selectedEntityForStudio, setSelectedEntityForStudio] = useState<
    BuildingSpec | ResidentSpec | null
  >(null);

  // Prompt / AI State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSelfHealing, setIsSelfHealing] = useState<boolean>(false);

  // Modals
  const [isPcSetupOpen, setIsPcSetupOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPresetManagerOpen, setIsPresetManagerOpen] = useState<boolean>(false);
  const [isPreFlightOpen, setIsPreFlightOpen] = useState<boolean>(false);
  const [rawJsonModal, setRawJsonModal] = useState<{
    isOpen: boolean;
    title: string;
    data: any;
    filename?: string;
  }>({
    isOpen: false,
    title: '',
    data: null,
  });

  // Terminal Logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'log_01',
      timestamp: '07:15:00',
      tag: 'SYSTEM',
      message: 'KingdomForge AI Engine Initialized. Sandbox mode active.',
    },
    {
      id: 'log_02',
      timestamp: '07:15:02',
      tag: 'GEMINI-SPEC',
      message: 'Loaded default Starter Manifest: 3 Buildings, 3 Recruited Residents.',
    },
    {
      id: 'log_03',
      timestamp: '07:15:04',
      tag: 'SPRITE-GEN',
      message: 'Generated pixel textures at 64 PPU with bottom-center pivot (0.5, 0.0).',
    },
    {
      id: 'log_04',
      timestamp: '07:15:06',
      tag: 'UNITY-CLI',
      message: 'Daemon standing by for C# bridge injection and batch compile.',
    },
  ]);

  const addLog = (
    tag: LogEntry['tag'],
    message: string,
    details?: string
  ) => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    const newLog: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: timeStr,
      tag,
      message,
      details,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // Timer for active building pipeline
  useEffect(() => {
    let timer: any;
    if (isBuilding) {
      timer = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBuilding]);

  // Persist config
  const handleUpdateConfig = (newConfig: Partial<EcosystemConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('kingdom_ecosystem_config', JSON.stringify(updated));
      return updated;
    });
    // Send to server
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    }).catch((e) => console.warn('Could not sync config to server', e));

    addLog('SYSTEM', `Configuration updated: Mode is now ${newConfig.executionMode || config.executionMode}`);
  };

  // 1. Natural Language Prompt Generation (Calling Gemini)
  const handleGenerate = async (promptText: string, mode: GenerationMode) => {
    setIsGenerating(true);
    addLog('GEMINI-SPEC', `Sending directive to Gemini 3.8 Flash (Mode: ${mode})...`);
    addLog('GEMINI-SPEC', `Prompt: "${promptText}"`);

    try {
      const resp = await fetch('/api/generate-entity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, mode }),
      });

      const resData = await resp.json();
      const entityData = resData.data;

      if (entityData.building) {
        const b = entityData.building;
        const newBuilding: BuildingSpec = {
          id: b.id || `bld_${Date.now().toString(36)}`,
          name: b.name || 'New Building',
          category: (b.category as any) || 'Production',
          footprint: (b.footprint as any) || '2x2',
          cost: b.cost || { wood: 40, stone: 20, gold: 10 },
          production: b.production || { resource: 'Goods', ratePerMin: 20 },
          jobsProvided: b.jobsProvided || 2,
          arcadeJuice: b.arcadeJuice || {
            placementBounce: 0.75,
            screenShakeIntensity: 0.4,
            particleColor: '#10b981',
          },
          spritePrompt: b.spritePrompt || promptText,
          spriteConfig: {
            isSpriteSheet: false,
            columns: 1,
            rows: 1,
            cellWidth: b.footprint === '3x3' ? 192 : b.footprint === '2x2' ? 128 : 64,
            cellHeight: b.footprint === '3x3' ? 192 : b.footprint === '2x2' ? 128 : 64,
            pixelsPerUnit: 64,
            pivotX: 0.5,
            pivotY: 0.0,
            fps: 8,
            animations: {
              idle: [0],
              walkDown: [0],
              walkLeft: [0],
              walkRight: [0],
              walkUp: [0],
              work: [0],
            },
          },
          spriteDataUri: generateBuildingSprite(
            b.name,
            b.footprint || '2x2',
            b.arcadeJuice?.particleColor || '#3b82f6'
          ),
          gridX: Math.floor(Math.random() * 8) + 1,
          gridY: Math.floor(Math.random() * 8) + 1,
          placed: true,
        };

        setManifest((prev) => ({
          ...prev,
          buildings: [newBuilding, ...prev.buildings],
        }));

        addLog(
          'GEMINI-SPEC',
          `Synthesized Building: "${newBuilding.name}" [${newBuilding.footprint}] Cost: ${newBuilding.cost.wood}W/${newBuilding.cost.stone}S/${newBuilding.cost.gold}G`
        );
        addLog(
          'SPRITE-GEN',
          `Generated 64 PPU sprite for ${newBuilding.name} with (0.5, 0.0) pivot`
        );
      }

      if (entityData.resident) {
        const r = entityData.resident;
        const newResident: ResidentSpec = {
          id: r.id || `res_${Date.now().toString(36)}`,
          name: r.name || 'New Resident',
          role: r.role || 'Artisan',
          personalityTrait: r.personalityTrait || 'Energetic',
          baseWalkSpeed: r.baseWalkSpeed || 2.2,
          workEfficiency: r.workEfficiency || 1.4,
          needsDecay: r.needsDecay || { hungerRate: 1.0, restRate: 0.8, moraleRate: 0.6 },
          recruitmentCost: r.recruitmentCost || { gold: 30 },
          dialogueLines: r.dialogueLines || ['For the realm!'],
          spriteSheetPrompt: r.spriteSheetPrompt || promptText,
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
          spriteDataUri: generateResidentSpriteSheet(r.name, r.role || 'Artisan', '#38bdf8'),
          x: Math.floor(Math.random() * 8) + 2,
          y: Math.floor(Math.random() * 8) + 2,
          state: 'WalkingToWork',
          hunger: 80,
          energy: 90,
        };

        setManifest((prev) => ({
          ...prev,
          residents: [newResident, ...prev.residents],
        }));

        addLog(
          'GEMINI-SPEC',
          `Recruited Resident: "${newResident.name}" (${newResident.role}) - Trait: ${newResident.personalityTrait}`
        );
        addLog(
          'SPRITE-GEN',
          `Generated 4x4 Resident Sprite Sheet (4 Directions) for ${newResident.name}`
        );
      }
    } catch (e: any) {
      addLog('COMPILER-ERR', `Failed to parse Gemini response: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Quick preset chips
  const handleQuickAddPreset = (type: 'mason' | 'forager' | 'treasury') => {
    if (type === 'mason') {
      handleGenerate(
        'Stone Mason guild (2x2 tile) that costs 50 Wood and recruits a Grumpy Dwarf who works 2x faster but needs Tavern visits.',
        'all_in_one'
      );
    } else if (type === 'forager') {
      handleGenerate(
        'Berry Forager Hut (1x1) and a Nimble Scout resident with high movement speed.',
        'all_in_one'
      );
    } else if (type === 'treasury') {
      handleGenerate(
        'Royal Treasury (3x3) with gold coin burst particles and screen-shake on placement.',
        'building'
      );
    }
  };

  // 2. Inject C# Bridge
  const handleInjectBridge = async () => {
    addLog('SYSTEM', 'Requesting C# Bridge injection into Unity project...');
    try {
      const resp = await fetch('/api/unity/inject-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unityProjectPath: config.unityProjectPath }),
      });
      const data = await resp.json();
      if (data.logs) {
        data.logs.forEach((msg: string) => {
          if (msg.includes('UNITY-CLI')) addLog('UNITY-CLI', msg.replace('[UNITY-CLI] ', ''));
          else addLog('SYSTEM', msg.replace('[SYSTEM] ', ''));
        });
      }
      setIsInjected(true);
      // Advance pipeline
      setStages((prev) =>
        prev.map((st) =>
          st.id === 1 || st.id === 2 ? { ...st, status: 'completed', progress: 100 } : st
        )
      );
    } catch (err: any) {
      addLog('COMPILER-ERR', `Bridge injection failed: ${err.message}`);
    }
  };

  // 3. Sync Manifest
  const handleSyncManifest = async () => {
    setIsSyncing(true);
    addLog('UNITY-CLI', 'Synchronizing KingdomManifest.json and sprite database...');

    try {
      const resp = await fetch('/api/unity/sync-manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest, targetPath: config.unityProjectPath }),
      });
      const data = await resp.json();
      if (data.logs) {
        data.logs.forEach((msg: string) => addLog('UNITY-CLI', msg));
      }

      setStages((prev) =>
        prev.map((st) =>
          st.id === 3 ? { ...st, status: 'completed', progress: 100, subBadge: 'Synced to Disk' } : st
        )
      );
      setOverallProgress((p) => Math.max(p, 60));
    } catch (err: any) {
      addLog('COMPILER-ERR', `Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Live Hot-Reload
  const handleHotReload = () => {
    addLog('SYSTEM', `WebSocket hot-reload triggered on port ${config.localWsPort}`);
    addLog('UNITY-CLI', 'Broadcasted [RELOAD_MANIFEST_PAYLOAD] to active Unity PlayMode instance.');
    addLog('UNITY-CLI', 'KingdomRuntimeLoader refreshed town grid without game restart.');
  };

  // 5. Build and Package .EXE (Full 5-Stage Orchestration)
  const handleBuildExe = async () => {
    setIsBuilding(true);
    setElapsedSeconds(0);
    setActiveStageId(3);
    addLog('UNITY-CLI', 'Initializing Unity headless compilation pipeline...');

    // Progress Stage 3
    setStages((prev) =>
      prev.map((st) => (st.id === 3 ? { ...st, status: 'running', progress: 50 } : st))
    );
    setOverallProgress(50);

    setTimeout(async () => {
      setStages((prev) =>
        prev.map((st) =>
          st.id === 3
            ? { ...st, status: 'completed', progress: 100, subBadge: 'AssetDatabase OK' }
            : st.id === 4
            ? { ...st, status: 'running', progress: 60 }
            : st
        )
      );
      setActiveStageId(4);
      setOverallProgress(75);
      addLog('UNITY-CLI', 'Prefabs wired: Elastic placement bounce, particles, and A* grid bounds.');

      setTimeout(async () => {
        setStages((prev) =>
          prev.map((st) =>
            st.id === 4
              ? { ...st, status: 'completed', progress: 100 }
              : st.id === 5
              ? { ...st, status: 'running', progress: 70 }
              : st
          )
        );
        setActiveStageId(5);
        setOverallProgress(88);

        try {
          const resp = await fetch('/api/unity/build-exe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              unityExePath: config.unityExePath,
              unityProjectPath: config.unityProjectPath,
            }),
          });
          const data = await resp.json();
          if (data.logs) {
            data.logs.forEach((msg: string) => addLog('UNITY-CLI', msg));
          }

          setStages((prev) =>
            prev.map((st) =>
              st.id === 5
                ? {
                    ...st,
                    status: 'completed',
                    progress: 100,
                    subBadge: 'Builds/KingdomBuilder.exe',
                  }
                : st
            )
          );
          setOverallProgress(100);
          addLog('SYSTEM', 'Build Success! Output executable ready: Builds/KingdomBuilder.exe');
        } catch (err: any) {
          addLog('COMPILER-ERR', `Build failed: ${err.message}`);
        } finally {
          setIsBuilding(false);
        }
      }, 1200);
    }, 1000);
  };

  // 6. Launch Game
  const handleLaunchGame = async () => {
    addLog('SYSTEM', 'Requesting Game.exe execution...');
    try {
      const resp = await fetch('/api/unity/launch-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPath: config.unityProjectPath }),
      });
      const data = await resp.json();
      addLog('UNITY-CLI', `[PROCESS-SPAWNED] ${data.launchedPath} (PID: ${data.pid})`);
      addLog('SYSTEM', 'Game launched in Arcade Play Mode! Viewport attached.');
    } catch (e: any) {
      addLog('COMPILER-ERR', `Launch failed: ${e.message}`);
    }
  };

  // 7. AI Self-Healing Debugger
  const handleSimulateCompilerError = () => {
    addLog(
      'COMPILER-ERR',
      "Assets/Editor/Builder.cs(58,19): error CS1061: 'TextureImporter' does not contain a definition for 'spriteAlignment' and no accessible extension method 'spriteAlignment' accepting a first argument of type 'TextureImporter' could be found",
      `System.Exception: Compiler compilation failed with exit code 1.
  at AgentBridge.Builder.ConfigureGeneratedSprites () [0x00028] in <UnityProject>/Assets/Editor/Builder.cs:58
  at AgentBridge.Builder.BuildFromManifest () [0x00010] in <UnityProject>/Assets/Editor/Builder.cs:34`
    );
  };

  const handleSelfHealAndRecompile = async (errorLog: LogEntry) => {
    setIsSelfHealing(true);
    addLog('SYSTEM', 'Initiating Gemini AI Self-Healing analysis on compiler error...');

    try {
      const resp = await fetch('/api/self-heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorMessage: errorLog.message,
          scriptName: 'Builder.cs',
        }),
      });
      const data = await resp.json();

      addLog('GEMINI-SPEC', 'Self-Healing Patch Generated:', data.diagnosis);
      addLog('UNITY-CLI', 'Injected patch into Assets/Editor/Builder.cs. Cleared cache.');
      addLog('SYSTEM', 'Re-triggering compilation test...');

      // Re-trigger build
      handleBuildExe();
    } catch (e: any) {
      addLog('COMPILER-ERR', `Self-heal failed: ${e.message}`);
    } finally {
      setIsSelfHealing(false);
    }
  };

  // Entity updates
  const handleUpdateBuilding = (updated: BuildingSpec) => {
    setManifest((prev) => ({
      ...prev,
      buildings: prev.buildings.map((b) => (b.id === updated.id ? updated : b)),
    }));
  };

  const handleUpdateResident = (updated: ResidentSpec) => {
    setManifest((prev) => ({
      ...prev,
      residents: prev.residents.map((r) => (r.id === updated.id ? updated : r)),
    }));
  };

  const handleDeleteBuilding = (id: string) => {
    setManifest((prev) => ({
      ...prev,
      buildings: prev.buildings.filter((b) => b.id !== id),
    }));
    addLog('SYSTEM', `Removed building ${id} from manifest.`);
  };

  const handleDeleteResident = (id: string) => {
    setManifest((prev) => ({
      ...prev,
      residents: prev.residents.filter((r) => r.id !== id),
    }));
    addLog('SYSTEM', `Removed resident ${id} from roster.`);
  };

  const handleRegenerateSprite = (entity: BuildingSpec | ResidentSpec) => {
    if ('role' in entity) {
      const newUri = generateResidentSpriteSheet(entity.name, entity.role, '#f59e0b');
      handleUpdateResident({ ...entity, spriteDataUri: newUri });
      addLog('SPRITE-GEN', `Regenerated 4-direction sprite sheet for ${entity.name}`);
    } else {
      const newUri = generateBuildingSprite(
        entity.name,
        entity.footprint,
        entity.arcadeJuice.particleColor
      );
      handleUpdateBuilding({ ...entity, spriteDataUri: newUri });
      addLog('SPRITE-GEN', `Regenerated sprite for ${entity.name}`);
    }
  };

  const handleConfigureSprite = (entity: BuildingSpec | ResidentSpec) => {
    setSelectedEntityForStudio(entity);
    setCenterTab('sprite_studio');
  };

  const handleSaveSpriteConfig = (entityId: string, updatedConfig: SpriteConfig) => {
    setManifest((prev) => {
      const isRes = prev.residents.some((r) => r.id === entityId);
      if (isRes) {
        return {
          ...prev,
          residents: prev.residents.map((r) =>
            r.id === entityId ? { ...r, spriteConfig: updatedConfig } : r
          ),
        };
      } else {
        return {
          ...prev,
          buildings: prev.buildings.map((b) =>
            b.id === entityId ? { ...b, spriteConfig: updatedConfig } : b
          ),
        };
      }
    });
    addLog('SPRITE-GEN', `Saved slicing & pivot config for ${entityId} to KingdomManifest.json`);
  };

  const handlePlaceBuilding = (buildingId: string, x: number, y: number) => {
    setManifest((prev) => ({
      ...prev,
      buildings: prev.buildings.map((b) =>
        b.id === buildingId ? { ...b, gridX: x, gridY: y, placed: true } : b
      ),
    }));
    const b = manifest.buildings.find((item) => item.id === buildingId);
    if (b) {
      addLog('SYSTEM', `Placed ${b.name} at Grid (${x}, ${y}) with bounce: ${b.arcadeJuice.placementBounce}x`);
    }
  };

  const handleRemoveBuilding = (buildingId: string) => {
    setManifest((prev) => ({
      ...prev,
      buildings: prev.buildings.map((b) =>
        b.id === buildingId ? { ...b, placed: false } : b
      ),
    }));
    addLog('SYSTEM', `Demolished building ${buildingId} from town grid.`);
  };

  const handleSpawnResident = (residentId: string) => {
    const r = manifest.residents.find((item) => item.id === residentId);
    if (r) {
      addLog('SYSTEM', `Spawned ${r.name} (${r.role}) onto town grid.`);
    }
  };

  const handleUpdateArcadeSettings = (settings: Partial<ArcadeFeelSettings>) => {
    setManifest((prev) => ({
      ...prev,
      arcadeSettings: {
        ...prev.arcadeSettings,
        ...settings,
      },
    }));
  };

  const handleLoadPreset = (preset: SavedPreset) => {
    setManifest(preset.manifest);
    if (preset.economy) {
      setEconomy(preset.economy);
    }
    addLog('SYSTEM', `Loaded preset template: "${preset.name}" (${preset.manifest.buildings.length} Buildings, ${preset.manifest.residents.length} Residents)`);
  };

  const handleRecruitResident = (newResident: ResidentSpec, cost: number) => {
    setManifest((prev) => ({
      ...prev,
      residents: [newResident, ...prev.residents],
    }));
    setEconomy((prev) => ({
      ...prev,
      gold: Math.max(0, prev.gold - cost),
      population: prev.population + 1,
    }));
    addLog('SYSTEM', `Recruited ${newResident.name} (${newResident.role}) for ${cost} Gold.`);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Header Bar */}
      <HeaderBar
        config={config}
        onUpdateConfig={handleUpdateConfig}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPcSetup={() => setIsPcSetupOpen(true)}
        onOpenPresetManager={() => setIsPresetManagerOpen(true)}
        onInjectBridge={handleInjectBridge}
        onSyncManifest={handleSyncManifest}
        onHotReload={handleHotReload}
        onBuildExe={() => setIsPreFlightOpen(true)}
        onLaunchGame={handleLaunchGame}
        isBuilding={isBuilding}
        isSyncing={isSyncing}
        isInjected={isInjected}
      />

      {/* 2. Real-Time 5-Stage Pipeline Progress Tracker */}
      <PipelineTracker
        stages={stages}
        activeStageId={activeStageId}
        overallProgress={overallProgress}
        elapsedSeconds={elapsedSeconds}
        isBuilding={isBuilding}
        onTriggerFullPipeline={handleBuildExe}
      />

      {/* 3. Main Workspace Split (3-Column Layout) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT COLUMN: AI Prompt Studio & Entity Generator (3 cols) */}
        <div className="lg:col-span-3 h-full overflow-hidden">
          <PromptStudio
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            onQuickAddPreset={handleQuickAddPreset}
          />
        </div>

        {/* CENTER COLUMN: Town Grid Sandbox / Manifest Roster / Sprite Studio / Progression (6 cols) */}
        <div className="lg:col-span-6 flex flex-col h-full border-r border-slate-800/80 overflow-hidden">
          {/* Center Column Tab Bar */}
          <div className="bg-slate-950/90 border-b border-slate-800 px-4 pt-2 flex items-center justify-between shrink-0 overflow-x-auto">
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setCenterTab('grid')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                  centerTab === 'grid'
                    ? 'border-emerald-500 text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>Town Sandbox (12x12)</span>
              </button>

              <button
                onClick={() => setCenterTab('manifest')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                  centerTab === 'manifest'
                    ? 'border-emerald-500 text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Roster ({manifest.buildings.length + manifest.residents.length})</span>
              </button>

              <button
                onClick={() => {
                  if (!selectedEntityForStudio) {
                    setSelectedEntityForStudio(manifest.buildings[0] || manifest.residents[0]);
                  }
                  setCenterTab('sprite_studio');
                }}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                  centerTab === 'sprite_studio'
                    ? 'border-indigo-500 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Sprite Slicer &amp; 4-Dir</span>
              </button>

              <button
                onClick={() => setCenterTab('economy')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                  centerTab === 'economy'
                    ? 'border-amber-500 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Progression &amp; Wayfarers</span>
              </button>
            </div>

            <button
              onClick={() =>
                setRawJsonModal({
                  isOpen: true,
                  title: 'KingdomManifest.json',
                  data: manifest,
                  filename: 'KingdomManifest.json',
                })
              }
              className="text-[11px] font-mono text-emerald-400 hover:underline shrink-0 ml-2"
            >
              Export JSON
            </button>
          </div>

          {/* Center Tab Viewport */}
          <div className="flex-1 overflow-hidden">
            {centerTab === 'grid' && (
              <TownGridSandbox
                buildings={manifest.buildings}
                residents={manifest.residents}
                arcadeSettings={manifest.arcadeSettings}
                onUpdateArcadeSettings={handleUpdateArcadeSettings}
                onPlaceBuilding={handlePlaceBuilding}
                onRemoveBuilding={handleRemoveBuilding}
                onSpawnResident={handleSpawnResident}
                onSelectEntityForSlicing={handleConfigureSprite}
              />
            )}

            {centerTab === 'manifest' && (
              <ManifestRoster
                buildings={manifest.buildings}
                residents={manifest.residents}
                onUpdateBuilding={handleUpdateBuilding}
                onUpdateResident={handleUpdateResident}
                onDeleteBuilding={handleDeleteBuilding}
                onDeleteResident={handleDeleteResident}
                onRegenerateSprite={handleRegenerateSprite}
                onConfigureSprite={handleConfigureSprite}
                onViewRawJson={(entity) =>
                  setRawJsonModal({
                    isOpen: true,
                    title: `${entity.name} Specification`,
                    data: entity,
                    filename: `${entity.id}.json`,
                  })
                }
              />
            )}

            {centerTab === 'sprite_studio' && (
              <SpriteStudio
                entity={selectedEntityForStudio}
                onSaveSpriteConfig={handleSaveSpriteConfig}
              />
            )}

            {centerTab === 'economy' && (
              <EconomyAndProgression
                economy={economy}
                buildings={manifest.buildings}
                residents={manifest.residents}
                onUpdateEconomy={(updated) => setEconomy((prev) => ({ ...prev, ...updated }))}
                onRecruitResident={handleRecruitResident}
                onLog={addLog}
              />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Unity CLI Terminal & Self-Healing Debugger (3 cols) */}
        <div className="lg:col-span-3 h-full overflow-hidden">
          <TerminalConsole
            logs={logs}
            onClearLogs={() => setLogs([])}
            onSimulateCompilerError={handleSimulateCompilerError}
            onSelfHealAndRecompile={handleSelfHealAndRecompile}
            isSelfHealing={isSelfHealing}
          />
        </div>
      </div>

      {/* Modals */}
      <PcSetupModal
        isOpen={isPcSetupOpen}
        onClose={() => setIsPcSetupOpen(false)}
        unityProjectPath={config.unityProjectPath}
      />

      <EcosystemConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleUpdateConfig}
      />

      <SavedPresetManagerModal
        isOpen={isPresetManagerOpen}
        onClose={() => setIsPresetManagerOpen(false)}
        currentManifest={manifest}
        currentEconomy={economy}
        onLoadPreset={handleLoadPreset}
      />

      <PreFlightModal
        isOpen={isPreFlightOpen}
        onClose={() => setIsPreFlightOpen(false)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
        onProceedBuild={handleBuildExe}
        isBuilding={isBuilding}
      />

      <RawJsonModal
        isOpen={rawJsonModal.isOpen}
        onClose={() => setRawJsonModal((prev) => ({ ...prev, isOpen: false }))}
        title={rawJsonModal.title}
        data={rawJsonModal.data}
        filename={rawJsonModal.filename}
      />
    </div>
  );
}
