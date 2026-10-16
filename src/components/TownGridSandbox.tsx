import React, { useEffect, useRef, useState } from 'react';
import {
  Sliders,
  Sun,
  Moon,
  Trash2,
  Plus,
  RefreshCw,
  Sparkles,
  Maximize2,
  Minimize2,
  Volume2,
} from 'lucide-react';
import {
  BuildingSpec,
  ResidentSpec,
  ArcadeFeelSettings,
} from '../types/kingdom';

interface TownGridSandboxProps {
  buildings: BuildingSpec[];
  residents: ResidentSpec[];
  arcadeSettings: ArcadeFeelSettings;
  onUpdateArcadeSettings: (settings: Partial<ArcadeFeelSettings>) => void;
  onPlaceBuilding: (buildingId: string, x: number, y: number) => void;
  onRemoveBuilding: (buildingId: string) => void;
  onSpawnResident: (residentId: string) => void;
  onSelectEntityForSlicing: (entity: BuildingSpec | ResidentSpec) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  radius: number;
  life: number;
}

interface SpeechBubble {
  residentId: string;
  text: string;
  timer: number;
}

export const TownGridSandbox: React.FC<TownGridSandboxProps> = ({
  buildings,
  residents,
  arcadeSettings,
  onUpdateArcadeSettings,
  onPlaceBuilding,
  onRemoveBuilding,
  onSpawnResident,
  onSelectEntityForSlicing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    buildings[0]?.id || ''
  );
  const [activeTool, setActiveTool] = useState<'place' | 'select' | 'bulldozer'>('place');
  const [shakeOffset, setShakeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [timeOfDay, setTimeOfDay] = useState<number>(0.25); // 0.0 - 1.0 (0: dawn, 0.25: noon, 0.7: dusk, 0.9: night)
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubble[]>([]);
  const [selectedEntityInfo, setSelectedEntityInfo] = useState<any>(null);

  // Local simulation states of residents
  const simResidentsRef = useRef<
    Array<{
      id: string;
      name: string;
      role: string;
      gridX: number;
      gridY: number;
      targetX: number;
      targetY: number;
      state: 'Idle' | 'WalkingToWork' | 'Working' | 'SeekingFood' | 'Resting';
      stateTimer: number;
      dialogue: string[];
      speed: number;
      facing: 'down' | 'left' | 'right' | 'up';
      stepFrame: number;
      color: string;
    }>
  >([]);

  // Particles
  const particlesRef = useRef<Particle[]>([]);

  // Placement bounce anim tracking: id -> { scale: number, time: number }
  const bounceAnimsRef = useRef<Map<string, { scale: number; start: number }>>(new Map());

  // Initialize simulation residents from props
  useEffect(() => {
    simResidentsRef.current = residents.map((r, i) => {
      const existing = simResidentsRef.current.find((s) => s.id === r.id);
      return {
        id: r.id,
        name: r.name,
        role: r.role,
        gridX: existing ? existing.gridX : (r.x ?? 3 + i * 2),
        gridY: existing ? existing.gridY : (r.y ?? 4 + (i % 2) * 2),
        targetX: existing ? existing.targetX : (r.x ?? 3 + i * 2),
        targetY: existing ? existing.targetY : (r.y ?? 4 + (i % 2) * 2),
        state: existing ? existing.state : ('Idle' as const),
        stateTimer: existing ? existing.stateTimer : 2 + Math.random() * 3,
        dialogue: r.dialogueLines,
        speed: r.baseWalkSpeed,
        facing: 'down' as const,
        stepFrame: 0,
        color: i === 0 ? '#3b82f6' : i === 1 ? '#10b981' : '#f59e0b',
      };
    });
  }, [residents]);

  // Screen shake trigger
  const triggerScreenShake = (intensity = 0.5) => {
    const totalIntensity = intensity * arcadeSettings.screenShake * 18;
    if (totalIntensity <= 0.1) return;

    let frames = 0;
    const interval = setInterval(() => {
      frames++;
      const factor = (10 - frames) / 10;
      setShakeOffset({
        x: (Math.random() - 0.5) * totalIntensity * factor,
        y: (Math.random() - 0.5) * totalIntensity * factor,
      });

      if (frames >= 10) {
        clearInterval(interval);
        setShakeOffset({ x: 0, y: 0 });
      }
    }, 25);
  };

  // Trigger placement bounce & particles
  const triggerPlacementJuice = (gx: number, gy: number, color = '#f59e0b', bounce = 0.7) => {
    bounceAnimsRef.current.set(`${gx}_${gy}`, { scale: 0.1, start: Date.now() });
    triggerScreenShake(bounce);

    // Spawn 16 particles
    const canvas = canvasRef.current;
    if (!canvas) return;
    const origin = gridToIso(gx, gy, canvas.width, canvas.height);

    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18;
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: color || '#fbbf24',
        alpha: 1.0,
        radius: 2 + Math.random() * 3,
        life: 1.0,
      });
    }
  };

  // Coordinate transforms (Isometric 2:1 ratio)
  const gridToIso = (gx: number, gy: number, canvasWidth: number, canvasHeight: number) => {
    const tileW = 48;
    const tileH = 24;
    const originX = canvasWidth / 2;
    const originY = canvasHeight * 0.28;

    const isoX = originX + (gx - gy) * (tileW / 2);
    const isoY = originY + (gx + gy) * (tileH / 2);
    return { x: isoX, y: isoY };
  };

  const isoToGrid = (px: number, py: number, canvasWidth: number, canvasHeight: number) => {
    const tileW = 48;
    const tileH = 24;
    const originX = canvasWidth / 2;
    const originY = canvasHeight * 0.28;

    const dx = px - originX;
    const dy = py - originY;

    const gx = Math.floor((dx / (tileW / 2) + dy / (tileH / 2)) / 2);
    const gy = Math.floor((dy / (tileH / 2) - dx / (tileW / 2)) / 2);
    return { x: gx, y: gy };
  };

  // Main Render & Simulation Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Update time of day
      setTimeOfDay((prev) => (prev + dt * 0.02 * arcadeSettings.dayNightCycleSpeed) % 1.0);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderCanvas(ctx, canvas.width, canvas.height, dt);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [buildings, arcadeSettings, timeOfDay]);

  // Canvas drawing routine
  const renderCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dt: number
  ) => {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);

    // Apply Screen Shake
    ctx.save();
    ctx.translate(shakeOffset.x, shakeOffset.y);

    // Background Sky / Ambience based on Day/Night
    // timeOfDay: 0 = dawn, 0.25 = noon, 0.6 = sunset, 0.85 = deep cyber night
    let skyColor1 = '#090d16';
    let skyColor2 = '#020617';
    let ambientLightAlpha = 0;

    if (timeOfDay < 0.2) {
      // Dawn
      skyColor1 = '#1e1b4b';
      skyColor2 = '#311042';
      ambientLightAlpha = 0.15;
    } else if (timeOfDay < 0.6) {
      // Day
      skyColor1 = '#0f172a';
      skyColor2 = '#020617';
      ambientLightAlpha = 0.0;
    } else if (timeOfDay < 0.8) {
      // Dusk
      skyColor1 = '#3b1828';
      skyColor2 = '#0f172a';
      ambientLightAlpha = 0.2;
    } else {
      // Night
      skyColor1 = '#030712';
      skyColor2 = '#020617';
      ambientLightAlpha = 0.45;
    }

    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, skyColor1);
    skyGrad.addColorStop(1, skyColor2);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw Subtle Stars if Dusk/Night
    if (timeOfDay > 0.65 || timeOfDay < 0.2) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let s = 0; s < 35; s++) {
        const sx = ((s * 73 + 17) % width);
        const sy = ((s * 41 + 11) % (height * 0.4));
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
    }

    // Draw 12x12 Isometric Grid Floor
    const gridSize = 12;
    const tileW = 48;
    const tileH = 24;

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gy = 0; gy < gridSize; gy++) {
        const iso = gridToIso(gx, gy, width, height);
        const isAlt = (gx + gy) % 2 === 0;

        // Path / Foundation check
        const hasBuilding = buildings.find(
          (b) => b.placed && b.gridX === gx && b.gridY === gy
        );

        ctx.beginPath();
        ctx.moveTo(iso.x, iso.y);
        ctx.lineTo(iso.x + tileW / 2, iso.y + tileH / 2);
        ctx.lineTo(iso.x, iso.y + tileH);
        ctx.lineTo(iso.x - tileW / 2, iso.y + tileH / 2);
        ctx.closePath();

        ctx.fillStyle = hasBuilding
          ? '#1e293b'
          : isAlt
          ? '#0d1526'
          : '#090f1d';
        ctx.fill();

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Depth-Sorted Entities: Collect placed Buildings and Residents
    interface Renderable {
      yDepth: number;
      draw: () => void;
    }
    const renderList: Renderable[] = [];

    // 1. Placed Buildings
    buildings
      .filter((b) => b.placed && b.gridX !== undefined && b.gridY !== undefined)
      .forEach((b) => {
        const gx = b.gridX!;
        const gy = b.gridY!;
        const pos = gridToIso(gx, gy, width, height);
        const yDepth = pos.y + tileH / 2;

        renderList.push({
          yDepth,
          draw: () => {
            ctx.save();
            ctx.translate(pos.x, pos.y + tileH / 2);

            // Placement bounce animation
            const bounceKey = `${gx}_${gy}`;
            const bounce = bounceAnimsRef.current.get(bounceKey);
            let scaleMultiplier = 1.0;
            if (bounce) {
              const elapsed = (Date.now() - bounce.start) / 1000;
              const duration = 0.45;
              if (elapsed < duration) {
                const t = elapsed / duration;
                scaleMultiplier =
                  1.0 +
                  Math.sin(t * Math.PI * (1 + arcadeSettings.placementBounce * 2)) *
                    (1 - t) *
                    0.5;
              } else {
                bounceAnimsRef.current.delete(bounceKey);
              }
            }
            ctx.scale(scaleMultiplier, scaleMultiplier);

            // Draw Building Sprite or procedural graphic
            const size = b.footprint === '3x3' ? 96 : b.footprint === '2x2' ? 72 : 48;
            // Draw building shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.ellipse(0, 0, size * 0.45, size * 0.22, 0, 0, Math.PI * 2);
            ctx.fill();

            // Structure box (if sprite image loaded, use that, else stylized voxel building)
            const img = (b as any)._cachedImage;
            if (img && img.complete) {
              ctx.drawImage(img, -size / 2, -size * 0.85, size, size);
            } else {
              // Create cached image
              if (b.spriteDataUri && !(b as any)._loadingImage) {
                (b as any)._loadingImage = true;
                const newImg = new Image();
                newImg.src = b.spriteDataUri;
                newImg.onload = () => {
                  (b as any)._cachedImage = newImg;
                };
              }
              // Procedural Fallback block
              ctx.fillStyle = b.category === 'Town' ? '#f59e0b' : b.category === 'Production' ? '#10b981' : '#3b82f6';
              ctx.fillRect(-size / 2, -size * 0.8, size, size * 0.8);
            }

            // Warm tavern/house window glow during night
            if (timeOfDay > 0.6 || timeOfDay < 0.25) {
              ctx.fillStyle = 'rgba(253, 224, 71, 0.85)';
              ctx.shadowColor = '#eab308';
              ctx.shadowBlur = 10;
              ctx.fillRect(-size * 0.15, -size * 0.4, size * 0.3, size * 0.2);
              ctx.shadowBlur = 0;
            }

            // Building Name Label Badge
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(-size * 0.45, -size * 0.95, size * 0.9, 13);
            ctx.fillStyle = '#f8fafc';
            ctx.font = '9px Plus Jakarta Sans';
            ctx.textAlign = 'center';
            ctx.fillText(b.name, 0, -size * 0.95 + 10);

            ctx.restore();
          },
        });
      });

    // 2. Simulated Autonomous Residents
    simResidentsRef.current.forEach((resident) => {
      // Update Resident AI State Machine
      resident.stateTimer -= dt;

      // Distance to target
      const dx = resident.targetX - resident.gridX;
      const dy = resident.targetY - resident.gridY;
      const dist = Math.hypot(dx, dy);

      const effectiveSpeed = resident.speed * arcadeSettings.globalWalkSpeed * 0.8;

      if (dist > 0.05) {
        resident.gridX += (dx / dist) * effectiveSpeed * dt;
        resident.gridY += (dy / dist) * effectiveSpeed * dt;
        resident.stepFrame = (resident.stepFrame + dt * 8) % 4;

        // Facing
        if (Math.abs(dx) > Math.abs(dy)) {
          resident.facing = dx > 0 ? 'right' : 'left';
        } else {
          resident.facing = dy > 0 ? 'down' : 'up';
        }
      } else if (resident.stateTimer <= 0) {
        // Change State & Pick new target
        const states: ('Idle' | 'WalkingToWork' | 'Working' | 'SeekingFood' | 'Resting')[] = [
          'Idle',
          'WalkingToWork',
          'Working',
          'SeekingFood',
          'Resting',
        ];
        resident.state = states[Math.floor(Math.random() * states.length)];
        resident.stateTimer = 3 + Math.random() * 5;

        // Target: move towards a building or wander
        const randomBuilding = buildings[Math.floor(Math.random() * buildings.length)];
        if (randomBuilding?.placed && randomBuilding.gridX !== undefined && randomBuilding.gridY !== undefined) {
          resident.targetX = Math.max(0, Math.min(11, randomBuilding.gridX + (Math.random() - 0.5) * 2));
          resident.targetY = Math.max(0, Math.min(11, randomBuilding.gridY + (Math.random() - 0.5) * 2));
        } else {
          resident.targetX = Math.floor(Math.random() * 11);
          resident.targetY = Math.floor(Math.random() * 11);
        }

        // 30% chance to speak a dialogue line
        if (Math.random() < 0.4 && resident.dialogue.length > 0) {
          const line = resident.dialogue[Math.floor(Math.random() * resident.dialogue.length)];
          setSpeechBubbles((prev) => [
            ...prev.filter((b) => b.residentId !== resident.id),
            { residentId: resident.id, text: line, timer: 4.0 },
          ]);
        }
      }

      // Compute screen position
      const pos = gridToIso(resident.gridX, resident.gridY, width, height);
      const yDepth = pos.y + tileH / 2 + 1; // Slightly higher priority than floor

      renderList.push({
        yDepth,
        draw: () => {
          ctx.save();
          ctx.translate(pos.x, pos.y + tileH / 2);

          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.ellipse(0, 4, 8, 3, 0, 0, Math.PI * 2);
          ctx.fill();

          // Villager Body
          const bounceY = (Math.floor(resident.stepFrame) % 2 === 1) ? -2 : 0;
          ctx.fillStyle = resident.color;
          ctx.fillRect(-5, -16 + bounceY, 10, 12);

          // Head
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(-4, -24 + bounceY, 8, 8);

          // Role icon / tool
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(5, -14 + bounceY, 2, 7);

          // Name Tag & State
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.fillRect(-22, -34 + bounceY, 44, 9);
          ctx.fillStyle = '#38bdf8';
          ctx.font = '8px Plus Jakarta Sans';
          ctx.textAlign = 'center';
          ctx.fillText(resident.name.split(' ')[0], 0, -27 + bounceY);

          // Active Speech Bubble
          const bubble = speechBubbles.find((b) => b.residentId === resident.id);
          if (bubble && bubble.timer > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 1;
            const textWidth = ctx.measureText(bubble.text).width;
            const bw = Math.max(70, textWidth + 12);
            ctx.fillRect(-bw / 2, -54 + bounceY, bw, 16);
            ctx.strokeRect(-bw / 2, -54 + bounceY, bw, 16);

            ctx.fillStyle = '#0f172a';
            ctx.font = '9px Plus Jakarta Sans';
            ctx.fillText(bubble.text, 0, -42 + bounceY);
          }

          ctx.restore();
        },
      });
    });

    // Sort by yDepth and Draw
    renderList.sort((a, b) => a.yDepth - b.yDepth);
    renderList.forEach((item) => item.draw());

    // 3. Update & Draw Particles (Juice puffs)
    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
    particlesRef.current.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // Gravity
      p.life -= dt * 1.5;
      p.alpha = Math.max(0, p.life);

      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 4. Night / Ambient Color Grading Overlay
    if (ambientLightAlpha > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(15, 23, 42, ${ambientLightAlpha})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    ctx.restore(); // Restore screen shake translate
  };

  // Canvas Click: Handle Placement or Bulldozing
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const { x: gx, y: gy } = isoToGrid(px, py, canvas.width, canvas.height);

    if (gx < 0 || gx >= 12 || gy < 0 || gy >= 12) return;

    if (activeTool === 'bulldozer') {
      const target = buildings.find((b) => b.placed && b.gridX === gx && b.gridY === gy);
      if (target) {
        onRemoveBuilding(target.id);
        triggerScreenShake(0.6);
      }
    } else if (activeTool === 'place' && selectedBuildingId) {
      const b = buildings.find((item) => item.id === selectedBuildingId);
      if (b) {
        onPlaceBuilding(b.id, gx, gy);
        triggerPlacementJuice(gx, gy, b.arcadeJuice.particleColor, b.arcadeJuice.placementBounce);
      }
    } else {
      // Select inspection
      const b = buildings.find((item) => item.placed && item.gridX === gx && item.gridY === gy);
      if (b) {
        setSelectedEntityInfo(b);
      }
    }
  };

  // Speech bubble timers countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSpeechBubbles((prev) =>
        prev
          .map((b) => ({ ...b, timer: b.timer - 0.5 }))
          .filter((b) => b.timer > 0)
      );
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Top Arcade Control & Placement Toolbar */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            Tool:
          </span>
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTool('place')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeTool === 'place'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Place Building
            </button>
            <button
              onClick={() => setActiveTool('select')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeTool === 'select'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Inspect
            </button>
            <button
              onClick={() => setActiveTool('bulldozer')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                activeTool === 'bulldozer'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trash2 className="w-3 h-3" />
              <span>Demolish</span>
            </button>
          </div>

          {/* Building Selector */}
          {activeTool === 'place' && (
            <select
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-hidden focus:border-amber-500"
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.footprint})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Quick Resident Spawner & Camera controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
            {timeOfDay > 0.6 || timeOfDay < 0.25 ? (
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>Cycle: {Math.round(timeOfDay * 100)}%</span>
          </div>

          <button
            onClick={() => {
              const res = residents[Math.floor(Math.random() * residents.length)];
              if (res) onSpawnResident(res.id);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Spawn Resident</span>
          </button>
        </div>
      </div>

      {/* Main Interactive HTML5 Canvas Container */}
      <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={860}
          height={480}
          onClick={handleCanvasClick}
          className="cursor-crosshair shadow-2xl rounded-lg max-w-full h-auto"
        />

        {/* Selected Entity Quick Info Overlay */}
        {selectedEntityInfo && (
          <div className="absolute top-4 left-4 p-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg shadow-xl text-xs max-w-xs z-10">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-slate-100">{selectedEntityInfo.name}</span>
              <button
                onClick={() => setSelectedEntityInfo(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="text-[11px] text-slate-400 space-y-0.5">
              <div>Footprint: {selectedEntityInfo.footprint}</div>
              <div>
                Production: {selectedEntityInfo.production?.ratePerMin} {selectedEntityInfo.production?.resource}/min
              </div>
              <div>Bounce: {selectedEntityInfo.arcadeJuice?.placementBounce}x</div>
            </div>
            <button
              onClick={() => {
                onSelectEntityForSlicing(selectedEntityInfo);
                setSelectedEntityInfo(null);
              }}
              className="mt-2 w-full py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-medium"
            >
              Configure Sprite / Slicing →
            </button>
          </div>
        )}
      </div>

      {/* Arcade Feel Tuner (Bottom Bar) */}
      <div className="bg-slate-900/95 border-t border-slate-800 p-3 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">Arcade Feel Tuner</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Real-time physics parameters synced to Unity MonoBehaviours
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* 1. Placement Bounce */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400 text-[11px]">Placement Bounce</span>
              <span className="font-mono text-emerald-400 tabular-nums">
                {Math.round(arcadeSettings.placementBounce * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={arcadeSettings.placementBounce}
              onChange={(e) =>
                onUpdateArcadeSettings({ placementBounce: parseFloat(e.target.value) })
              }
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* 2. Screen Shake */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400 text-[11px]">Screen Shake</span>
              <span className="font-mono text-amber-400 tabular-nums">
                {Math.round(arcadeSettings.screenShake * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={arcadeSettings.screenShake}
              onChange={(e) =>
                onUpdateArcadeSettings({ screenShake: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* 3. Day/Night Cycle Speed */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400 text-[11px]">Day/Night Cycle</span>
              <span className="font-mono text-indigo-400 tabular-nums">
                {arcadeSettings.dayNightCycleSpeed.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="4.0"
              step="0.1"
              value={arcadeSettings.dayNightCycleSpeed}
              onChange={(e) =>
                onUpdateArcadeSettings({ dayNightCycleSpeed: parseFloat(e.target.value) })
              }
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* 4. Global Villager Walk Speed */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400 text-[11px]">Villager Walk Speed</span>
              <span className="font-mono text-teal-400 tabular-nums">
                {arcadeSettings.globalWalkSpeed.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={arcadeSettings.globalWalkSpeed}
              onChange={(e) =>
                onUpdateArcadeSettings({ globalWalkSpeed: parseFloat(e.target.value) })
              }
              className="w-full accent-teal-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
