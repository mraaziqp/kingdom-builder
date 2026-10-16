import React, { useEffect, useRef, useState } from 'react';
import {
  Scissors,
  Crosshair,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Check,
  Grid,
  Sparkles,
  Layers,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Ghost,
  Save,
} from 'lucide-react';
import { BuildingSpec, ResidentSpec, SpriteConfig } from '../types/kingdom';

interface SpriteStudioProps {
  entity: BuildingSpec | ResidentSpec | null;
  onSaveSpriteConfig: (entityId: string, updatedConfig: SpriteConfig) => void;
  onClose?: () => void;
}

export const SpriteStudio: React.FC<SpriteStudioProps> = ({
  entity,
  onSaveSpriteConfig,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const isResident = entity ? 'role' in entity : false;

  // Local sprite configuration
  const [config, setConfig] = useState<SpriteConfig>(() => {
    return (
      entity?.spriteConfig || {
        isSpriteSheet: isResident,
        columns: isResident ? 4 : 1,
        rows: isResident ? 4 : 1,
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
      }
    );
  });

  // Pre-processing sliders
  const [chromaTolerance, setChromaTolerance] = useState<number>(15);
  const [zoomLevel, setZoomLevel] = useState<number>(3);
  const [isDraggingPivot, setIsDraggingPivot] = useState<boolean>(false);
  const [hasSaved, setHasSaved] = useState<boolean>(false);

  // Animation preview states
  const [currentDirection, setCurrentDirection] = useState<'South' | 'West' | 'East' | 'North'>('South');
  const [currentAnimState, setCurrentAnimState] = useState<'Idle' | 'Walk' | 'Work'>('Walk');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [onionSkinning, setOnionSkinning] = useState<boolean>(false);
  const [arcadeSquashStretch, setArcadeSquashStretch] = useState<boolean>(true);

  // Sync when entity changes
  useEffect(() => {
    if (entity?.spriteConfig) {
      setConfig({ ...entity.spriteConfig });
    }
  }, [entity]);

  // Slicer Canvas Render Loop (Checkerboard, Sprite, Slicing grid, Pivot Crosshair)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !entity?.spriteDataUri) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = entity.spriteDataUri;
    img.onload = () => {
      canvas.width = img.width * zoomLevel;
      canvas.height = img.height * zoomLevel;

      ctx.imageSmoothingEnabled = false;

      // 1. Draw Checkerboard background
      const checkSize = 8;
      for (let x = 0; x < canvas.width; x += checkSize) {
        for (let y = 0; y < canvas.height; y += checkSize) {
          ctx.fillStyle = (x / checkSize + y / checkSize) % 2 === 0 ? '#0f172a' : '#1e293b';
          ctx.fillRect(x, y, checkSize, checkSize);
        }
      }

      // 2. Draw Sprite Image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 3. Draw Slicing Grid Overlay
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1;

      const colW = (canvas.width / config.columns);
      const rowH = (canvas.height / config.rows);

      for (let c = 0; c <= config.columns; c++) {
        ctx.beginPath();
        ctx.moveTo(c * colW, 0);
        ctx.lineTo(c * colW, canvas.height);
        ctx.stroke();
      }

      for (let r = 0; r <= config.rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * rowH);
        ctx.lineTo(canvas.width, r * rowH);
        ctx.stroke();
      }

      // 4. Draw Draggable Red Crosshair Pivot Point
      // Pivot coordinates are normalized 0-1, with (0.5, 0.0) being bottom-center in Unity standard
      const pivotPixelX = config.pivotX * canvas.width;
      // Note: in Unity Y=0 is bottom, in canvas Y=0 is top.
      const pivotPixelY = (1.0 - config.pivotY) * canvas.height;

      // Crosshair lines
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pivotPixelX - 14, pivotPixelY);
      ctx.lineTo(pivotPixelX + 14, pivotPixelY);
      ctx.moveTo(pivotPixelX, pivotPixelY - 14);
      ctx.lineTo(pivotPixelX, pivotPixelY + 14);
      ctx.stroke();

      // Center circle
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pivotPixelX, pivotPixelY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Pivot text badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(pivotPixelX + 8, pivotPixelY - 18, 90, 16);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`Pivot (${config.pivotX.toFixed(2)}, ${config.pivotY.toFixed(2)})`, pivotPixelX + 12, pivotPixelY - 6);
    };
  }, [entity, config, zoomLevel]);

  // Handle Dragging Pivot
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDraggingPivot(true);
    updatePivotFromEvent(e);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingPivot) {
      updatePivotFromEvent(e);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingPivot(false);
  };

  const updatePivotFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / canvas.width));
    const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / canvas.height)); // invert Y for Unity convention
    setConfig((prev) => ({
      ...prev,
      pivotX: Math.round(x * 100) / 100,
      pivotY: Math.round(y * 100) / 100,
    }));
  };

  // Live 4-Direction Animation Player Loop
  useEffect(() => {
    if (!isPlaying) return;

    const frameInterval = 1000 / config.fps;
    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => {
        let frameCount = 4;
        if (currentAnimState === 'Idle') frameCount = 2;
        else if (currentAnimState === 'Work') frameCount = 2;
        return (prev + 1) % frameCount;
      });
    }, frameInterval);

    return () => clearInterval(interval);
  }, [isPlaying, config.fps, currentAnimState]);

  // Render Animation Preview Canvas
  useEffect(() => {
    const canvas = animCanvasRef.current;
    if (!canvas || !entity?.spriteDataUri) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = entity.spriteDataUri;
    img.onload = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw preview checkerboard
      const checkSize = 6;
      for (let x = 0; x < canvas.width; x += checkSize) {
        for (let y = 0; y < canvas.height; y += checkSize) {
          ctx.fillStyle = (x / checkSize + y / checkSize) % 2 === 0 ? '#0b1120' : '#1e293b';
          ctx.fillRect(x, y, checkSize, checkSize);
        }
      }

      // Compute frame coordinates
      const cellW = img.width / config.columns;
      const cellH = img.height / config.rows;

      // Determine Row based on Direction: 0 = South, 1 = West, 2 = East, 3 = North
      let row = 0;
      if (currentDirection === 'West') row = 1 % config.rows;
      else if (currentDirection === 'East') row = 2 % config.rows;
      else if (currentDirection === 'North') row = 3 % config.rows;

      let col = currentFrameIndex % config.columns;

      const sx = col * cellW;
      const sy = row * cellH;

      ctx.save();
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.7;
      ctx.translate(cx, cy);

      // Arcade Squash and Stretch while walking
      if (arcadeSquashStretch && currentAnimState === 'Walk' && isPlaying) {
        const bounce = currentFrameIndex % 2 === 1 ? 1.08 : 0.94;
        ctx.scale(2 - bounce, bounce);
      }

      // Onion Skinning (Ghost frame)
      if (onionSkinning && isPlaying) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        const prevCol = (col - 1 + config.columns) % config.columns;
        ctx.drawImage(
          img,
          prevCol * cellW,
          sy,
          cellW,
          cellH,
          -48,
          -96,
          96,
          96
        );
        ctx.restore();
      }

      // Draw Main Frame
      ctx.drawImage(img, sx, sy, cellW, cellH, -48, -96, 96, 96);

      ctx.restore();
    };
  }, [
    entity,
    config,
    currentDirection,
    currentAnimState,
    currentFrameIndex,
    isPlaying,
    onionSkinning,
    arcadeSquashStretch,
  ]);

  const handleSave = () => {
    if (entity) {
      onSaveSpriteConfig(entity.id, config);
      setHasSaved(true);
      setTimeout(() => setHasSaved(false), 2000);
    }
  };

  const handleSnapToBottomCenter = () => {
    setConfig((prev) => ({
      ...prev,
      pivotX: 0.5,
      pivotY: 0.0,
    }));
  };

  if (!entity) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs p-8 text-center">
        <Scissors className="w-8 h-8 mb-2 text-slate-600" />
        <p>No entity selected for slicing.</p>
        <p className="text-[11px] mt-1">Select an entity from the Manifest Roster to calibrate.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-y-auto p-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-4 shrink-0 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Scissors className="w-4 h-4 text-indigo-400" />
            <span>Sprite Slicer, Pivot Calibrator &amp; 4-Direction Studio</span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900">
              {entity.name}
            </span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Calibrate 64 PPU pixel pivots and 4-direction walk cycles before Unity batch import
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md ${
              hasSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {hasSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{hasSaved ? 'Saved to Manifest!' : 'Save & Sync Metadata'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Viewport Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        {/* LEFT 2 COLS: Interactive Zoomable Slicer & Pivot Canvas */}
        <div className="lg:col-span-2 flex flex-col bg-slate-900/60 rounded-xl border border-slate-800 p-3">
          {/* Slicer Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold text-[11px]">Slicing Mode:</span>
              <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      isSpriteSheet: false,
                      columns: 1,
                      rows: 1,
                    }))
                  }
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    !config.isSpriteSheet
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Single Static Sprite
                </button>
                <button
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      isSpriteSheet: true,
                      columns: 4,
                      rows: 4,
                    }))
                  }
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    config.isSpriteSheet
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  4-Direction Sheet (4x4)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <span className="text-slate-400 text-[11px]">Zoom:</span>
              <button
                onClick={() => setZoomLevel((z) => Math.max(1, z - 1))}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs"
              >
                -
              </button>
              <span className="font-mono text-xs text-indigo-300">{zoomLevel}x</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(6, z + 1))}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs"
              >
                +
              </button>

              <button
                onClick={handleSnapToBottomCenter}
                className="ml-2 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-mono border border-slate-700"
                title="Snap Pivot to Bottom-Center (0.5, 0.0) for 2D Y-Sorting"
              >
                <Crosshair className="w-3 h-3 text-rose-400" />
                <span>Snap Pivot (0.5, 0.0)</span>
              </button>
            </div>
          </div>

          {/* Slicer Canvas Viewport */}
          <div className="flex-1 flex items-center justify-center bg-slate-950 rounded-lg border border-slate-800/80 p-4 min-h-[300px] overflow-auto">
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              className="cursor-crosshair shadow-lg rounded"
            />
          </div>

          {/* Slicer Parameters & Pre-Processing Bar */}
          <div className="mt-3 pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">Columns x Rows</span>
              <div className="flex items-center gap-1 mt-0.5 font-mono">
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={config.columns}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      columns: Math.max(1, parseInt(e.target.value, 10) || 1),
                    }))
                  }
                  className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-center text-slate-200"
                />
                <span className="text-slate-500">×</span>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={config.rows}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      rows: Math.max(1, parseInt(e.target.value, 10) || 1),
                    }))
                  }
                  className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-center text-slate-200"
                />
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] block">Pixels Per Unit (PPU)</span>
              <input
                type="number"
                value={config.pixelsPerUnit}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    pixelsPerUnit: parseInt(e.target.value, 10) || 64,
                  }))
                }
                className="w-16 mt-0.5 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 font-mono text-center text-slate-200"
              />
            </div>

            <div>
              <span className="text-slate-400 text-[10px] block">Pivot X / Y</span>
              <div className="flex items-center gap-1 mt-0.5 font-mono text-slate-300">
                <span>{config.pivotX.toFixed(2)}</span>
                <span className="text-slate-500">,</span>
                <span>{config.pivotY.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] block">Background Strip Chroma</span>
              <input
                type="range"
                min="0"
                max="50"
                value={chromaTolerance}
                onChange={(e) => setChromaTolerance(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 h-1 bg-slate-800 rounded mt-2 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COL: Live 4-Direction Animation Previewer & State Tester */}
        <div className="flex flex-col bg-slate-900/60 rounded-xl border border-slate-800 p-3">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/80">
            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live 4-Direction Previewer</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-400 tabular-nums">
              Frame: {currentFrameIndex + 1}/4
            </span>
          </div>

          {/* Direction Selector */}
          <div className="mb-2">
            <span className="text-[10px] text-slate-400 block mb-1">Direction View:</span>
            <div className="grid grid-cols-4 gap-1">
              {(['South', 'West', 'East', 'North'] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setCurrentDirection(dir)}
                  className={`py-1 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1 ${
                    currentDirection === dir
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {dir === 'South' && <ArrowDown className="w-3 h-3" />}
                  {dir === 'West' && <ArrowLeft className="w-3 h-3" />}
                  {dir === 'East' && <ArrowRight className="w-3 h-3" />}
                  {dir === 'North' && <ArrowUp className="w-3 h-3" />}
                  <span>{dir[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* State Loop Selector */}
          <div className="mb-3">
            <span className="text-[10px] text-slate-400 block mb-1">State Animation:</span>
            <div className="grid grid-cols-3 gap-1">
              {(['Idle', 'Walk', 'Work'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setCurrentAnimState(st);
                    setCurrentFrameIndex(0);
                  }}
                  className={`py-1 rounded text-[11px] font-medium transition-colors ${
                    currentAnimState === st
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Animation Canvas */}
          <div className="flex-1 flex items-center justify-center bg-slate-950 rounded-lg border border-slate-800/80 p-2 min-h-[170px]">
            <canvas ref={animCanvasRef} width={180} height={180} className="rounded" />
          </div>

          {/* Playback Controls */}
          <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">FPS:</span>
                <span className="font-mono text-emerald-400 tabular-nums">{config.fps}</span>
              </div>
            </div>

            <input
              type="range"
              min="4"
              max="24"
              step="1"
              value={config.fps}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  fps: parseInt(e.target.value, 10),
                }))
              }
              className="w-full accent-emerald-500 h-1 bg-slate-800 rounded cursor-pointer"
            />

            {/* Juice Toggles */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={arcadeSquashStretch}
                  onChange={(e) => setArcadeSquashStretch(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Arcade Squash &amp; Stretch</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={onionSkinning}
                  onChange={(e) => setOnionSkinning(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Onion-Skin</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
