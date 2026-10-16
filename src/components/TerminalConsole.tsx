import React, { useEffect, useRef, useState } from 'react';
import {
  Terminal,
  Trash2,
  Bug,
  Sparkles,
  Lock,
  Unlock,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
} from 'lucide-react';
import { LogEntry } from '../types/kingdom';

interface TerminalConsoleProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  onSimulateCompilerError: () => void;
  onSelfHealAndRecompile: (errorLog: LogEntry) => Promise<void>;
  isSelfHealing: boolean;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  logs,
  onClearLogs,
  onSimulateCompilerError,
  onSelfHealAndRecompile,
  isSelfHealing,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (selectedTag !== 'ALL' && log.tag !== selectedTag) return false;
    if (searchFilter && !log.message.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const latestError = logs.slice().reverse().find((l) => l.tag === 'COMPILER-ERR');

  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleCopyLog = (log: LogEntry) => {
    navigator.clipboard.writeText(`[${log.timestamp}] [${log.tag}] ${log.message}`);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getTagColor = (tag: LogEntry['tag']) => {
    switch (tag) {
      case 'SYSTEM':
        return 'text-sky-400 bg-sky-950/60 border-sky-800/60';
      case 'GEMINI-SPEC':
        return 'text-amber-300 bg-amber-950/60 border-amber-800/60';
      case 'SPRITE-GEN':
        return 'text-teal-400 bg-teal-950/60 border-teal-800/60';
      case 'UNITY-CLI':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
      case 'COMPILER-ERR':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
      default:
        return 'text-slate-300 bg-slate-900 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800/80 font-mono text-xs">
      {/* Console Toolbar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">Unity Daemon Console</span>
          <span className="text-[10px] text-slate-400 tabular-nums">({logs.length} logs)</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* AI Self-Heal Button if error exists */}
          {latestError && (
            <button
              onClick={() => onSelfHealAndRecompile(latestError)}
              disabled={isSelfHealing}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-sans text-xs font-semibold shadow-md shadow-rose-950/50 animate-pulse transition-all disabled:opacity-50"
            >
              {isSelfHealing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isSelfHealing ? 'Self-Healing C#...' : 'AI Self-Heal & Recompile'}</span>
            </button>
          )}

          <button
            onClick={onSimulateCompilerError}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans text-xs transition-colors"
            title="Simulate a Unity C# compiler error to test self-healing"
          >
            <Bug className="w-3 h-3 text-rose-400" />
            <span className="hidden sm:inline">Simulate Error</span>
          </button>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded transition-colors ${
              autoScroll ? 'text-emerald-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300'
            }`}
            title={autoScroll ? 'Auto-Scroll Enabled' : 'Auto-Scroll Locked'}
          >
            {autoScroll ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClearLogs}
            className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tag Filters & Search Row */}
      <div className="bg-slate-900/60 border-b border-slate-800/60 px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto text-[11px]">
        <div className="flex items-center gap-1">
          {['ALL', 'SYSTEM', 'GEMINI-SPEC', 'SPRITE-GEN', 'UNITY-CLI', 'COMPILER-ERR'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2 py-0.5 rounded font-mono transition-colors shrink-0 ${
                selectedTag === tag
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="relative shrink-0">
          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1.5" />
          <input
            type="text"
            placeholder="Search..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-28 sm:w-36 bg-slate-950 border border-slate-800 rounded pl-6 pr-2 py-0.5 text-[11px] text-slate-200 focus:outline-hidden focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Streaming Log Lines */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 selection:bg-emerald-900/40">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-400 text-center py-8 text-[11px]">
            No logs recorded yet. Run a prompt or sync manifest.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`group flex items-start gap-2 p-1 rounded hover:bg-slate-900/50 transition-colors leading-relaxed ${
                log.tag === 'COMPILER-ERR' ? 'bg-rose-950/20 border-l-2 border-rose-500' : ''
              }`}
            >
              <span className="text-slate-400 text-[10px] tabular-nums shrink-0 mt-0.5">
                {log.timestamp}
              </span>

              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${getTagColor(
                  log.tag
                )}`}
              >
                {log.tag}
              </span>

              <span
                className={`flex-1 break-words font-mono text-[11px] ${
                  log.tag === 'COMPILER-ERR'
                    ? 'text-rose-300 font-semibold'
                    : log.tag === 'UNITY-CLI'
                    ? 'text-slate-200'
                    : log.tag === 'GEMINI-SPEC'
                    ? 'text-amber-300'
                    : 'text-slate-400'
                }`}
              >
                {log.message}
                {log.details && (
                  <pre className="mt-1 p-2 bg-slate-950 rounded border border-slate-800 text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {log.details}
                  </pre>
                )}
              </span>

              <button
                onClick={() => handleCopyLog(log)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white p-1 transition-opacity shrink-0"
                title="Copy log entry"
              >
                {copiedId === log.id ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          ))
        )}
        <div ref={consoleEndRef} />
      </div>
    </div>
  );
};
