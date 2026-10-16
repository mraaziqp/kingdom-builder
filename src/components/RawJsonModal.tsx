import React, { useState } from 'react';
import { Code2, Copy, Check, Download, FileJson } from 'lucide-react';

interface RawJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
  filename?: string;
}

export const RawJsonModal: React.FC<RawJsonModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  filename = 'KingdomManifest.json',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">{title}</h2>
              <p className="text-[10px] text-slate-400 font-mono">{filename}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* JSON Code view */}
        <div className="flex-1 bg-slate-950 p-4 overflow-auto">
          <pre className="font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre">
            {jsonString}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Synced directly with Unity <code>KingdomRuntimeLoader.cs</code> JSON loader.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
