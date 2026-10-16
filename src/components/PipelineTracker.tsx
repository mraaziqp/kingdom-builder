import React from 'react';
import { CheckCircle2, Clock, Loader2, Sparkles, Image as ImageIcon, Database, Layers, Binary } from 'lucide-react';
import { PipelineStage } from '../types/kingdom';

interface PipelineTrackerProps {
  stages: PipelineStage[];
  activeStageId: number;
  overallProgress: number;
  elapsedSeconds: number;
  isBuilding: boolean;
  onTriggerFullPipeline: () => void;
}

export const PipelineTracker: React.FC<PipelineTrackerProps> = ({
  stages,
  activeStageId,
  overallProgress,
  elapsedSeconds,
  isBuilding,
  onTriggerFullPipeline,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStageIcon = (id: number) => {
    switch (id) {
      case 1:
        return <Sparkles className="w-3.5 h-3.5" />;
      case 2:
        return <ImageIcon className="w-3.5 h-3.5" />;
      case 3:
        return <Database className="w-3.5 h-3.5" />;
      case 4:
        return <Layers className="w-3.5 h-3.5" />;
      case 5:
        return <Binary className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 text-xs">
      {/* Top metrics bar */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Orchestration Pipeline
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="tabular-nums">{formatTime(elapsedSeconds)}</span>
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-emerald-400 font-mono font-medium">
            Overall: <span className="tabular-nums">{overallProgress}%</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isBuilding && (
            <button
              onClick={onTriggerFullPipeline}
              className="text-[11px] text-slate-400 hover:text-emerald-400 font-mono transition-colors"
            >
              [Run 5-Stage Test Cycle]
            </button>
          )}
          {isBuilding && (
            <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Executing Stage {activeStageId}/5
            </span>
          )}
        </div>
      </div>

      {/* 5-Stage Step Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        {stages.map((stage) => {
          const isActive = stage.id === activeStageId && isBuilding;
          const isDone = stage.status === 'completed';
          const isError = stage.status === 'error';

          return (
            <div
              key={stage.id}
              className={`p-2 rounded-lg border transition-all ${
                isActive
                  ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200 shadow-md shadow-emerald-950/20'
                  : isDone
                  ? 'bg-slate-950/50 border-emerald-900/50 text-slate-300'
                  : isError
                  ? 'bg-rose-950/40 border-rose-600/70 text-rose-200'
                  : 'bg-slate-950/30 border-slate-800/60 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 font-medium truncate">
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : isDone
                        ? 'bg-emerald-900/80 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isActive ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : isDone ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      getStageIcon(stage.id)
                    )}
                  </span>
                  <span className="truncate text-[11px]">
                    S{stage.id}: {stage.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono tabular-nums shrink-0 text-slate-400">
                  {stage.progress}%
                </span>
              </div>

              {/* Progress mini bar */}
              <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isActive
                      ? 'bg-emerald-400'
                      : isDone
                      ? 'bg-emerald-600'
                      : isError
                      ? 'bg-rose-500'
                      : 'bg-slate-700'
                  }`}
                  style={{ width: `${stage.progress}%` }}
                />
              </div>

              <div className="mt-1 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 truncate">{stage.subBadge}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
