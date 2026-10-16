import React, { useState } from 'react';
import {
  FolderCode,
  Copy,
  Check,
  Download,
  FileText,
  Terminal,
  HelpCircle,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import {
  BUILDER_CS_CONTENT,
  KINGDOM_RUNTIME_LOADER_CS_CONTENT,
  INSTALL_BAT_CONTENT,
  START_BAT_CONTENT,
  SETUP_AND_RUN_BAT_CONTENT,
} from '../utils/unityScripts';

interface PcSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  unityProjectPath: string;
}

const CLAUDE_PROMPT = `I just generated and downloaded this "KingdomForge: Unity AI Builder" full-stack app from Google AI Studio. 

Please upgrade the backend from Sandbox Mode to full Local Windows PC Execution:

1. Inspect all [CLAUDE_LOCAL_HOOK] routes in the backend server:
   - Replace the simulated file writes in /api/unity/inject-bridge and /api/unity/sync-manifest with real fs.promises.mkdir and fs.promises.writeFile calls targeting the unityProjectPath configured in the app's settings.
   - Automatically write Builder.cs to <unityProjectPath>/Assets/Editor/Builder.cs and KingdomRuntimeLoader.cs to <unityProjectPath>/Assets/Scripts/KingdomRuntimeLoader.cs.
   - Write the active KingdomManifest.json to <unityProjectPath>/Assets/Resources/Generated/KingdomManifest.json.

2. Wire Real Unity.exe Headless Execution & Live Log Streaming:
   - In /api/unity/build-exe, use child_process.spawn to execute the configured unityExePath with:
     ["-batchmode", "-quit", "-nographics", "-projectPath", unityProjectPath, "-executeMethod", "AgentBridge.Builder.BuildFromManifest", "-logFile", "-"]
   - Stream stdout and stderr in real time to the frontend terminal console and advance the 5-Stage Progress Bar as Unity logs each phase.
   - In /api/unity/launch-game, use child_process.execFile to launch <unityProjectPath>/Builds/KingdomBuilder.exe.

3. Connect My External Sprite & Media Generator Endpoints:
   - In /api/generate-media, forward the sprite/audio prompts to my configured spriteWebhookUrl and mediaWebhookUrl, download the resulting .png / .wav buffers, strip/crop transparent padding using sharp, and save them directly into <unityProjectPath>/Assets/Resources/Generated/Sprites/ and Audio/.

4. Create One-Click Windows Launchers in the Root Folder:
   - Create 1-install.bat (checks Node.js, runs npm install, creates .env.local if missing).
   - Create 2-start-kingdom-forge.bat (starts the backend and frontend and opens http://localhost:3000 in my default browser).
`;

export const PcSetupModal: React.FC<PcSetupModalProps> = ({
  isOpen,
  onClose,
  unityProjectPath,
}) => {
  const [activeTab, setActiveTab] = useState<
    'builder' | 'runtime' | 'install_bat' | 'start_bat' | 'claude_prompt'
  >('builder');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const getActiveContent = () => {
    switch (activeTab) {
      case 'builder':
        return {
          filename: 'Builder.cs',
          targetDir: `${unityProjectPath}/Assets/Editor/Builder.cs`,
          content: BUILDER_CS_CONTENT,
          lang: 'csharp',
        };
      case 'runtime':
        return {
          filename: 'KingdomRuntimeLoader.cs',
          targetDir: `${unityProjectPath}/Assets/Scripts/KingdomRuntimeLoader.cs`,
          content: KINGDOM_RUNTIME_LOADER_CS_CONTENT,
          lang: 'csharp',
        };
      case 'install_bat':
        return {
          filename: '1-install.bat',
          targetDir: 'Root project folder',
          content: INSTALL_BAT_CONTENT,
          lang: 'batch',
        };
      case 'start_bat':
        return {
          filename: '2-start-kingdom-forge.bat',
          targetDir: 'Root project folder',
          content: START_BAT_CONTENT,
          lang: 'batch',
        };
      case 'claude_prompt':
        return {
          filename: 'Claude-PC-Finisher-Prompt.md',
          targetDir: 'Claude Desktop / CLI',
          content: CLAUDE_PROMPT,
          lang: 'markdown',
        };
    }
  };

  const active = getActiveContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(active.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([active.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = active.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Unity C# Bridge &amp; Local PC Installer
              </h2>
              <p className="text-[11px] text-slate-400">
                Embedded scripts ready for one-click download or automatic bridge injection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800/80 overflow-x-auto text-xs bg-slate-950/40">
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-3 py-2 border-b-2 font-mono font-medium transition-colors shrink-0 ${
              activeTab === 'builder'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Builder.cs (CLI Compiler)
          </button>
          <button
            onClick={() => setActiveTab('runtime')}
            className={`px-3 py-2 border-b-2 font-mono font-medium transition-colors shrink-0 ${
              activeTab === 'runtime'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            KingdomRuntimeLoader.cs
          </button>
          <button
            onClick={() => setActiveTab('install_bat')}
            className={`px-3 py-2 border-b-2 font-mono font-medium transition-colors shrink-0 ${
              activeTab === 'install_bat'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1-install.bat
          </button>
          <button
            onClick={() => setActiveTab('start_bat')}
            className={`px-3 py-2 border-b-2 font-mono font-medium transition-colors shrink-0 ${
              activeTab === 'start_bat'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2-start-kingdom-forge.bat
          </button>
          <button
            onClick={() => setActiveTab('claude_prompt')}
            className={`px-3 py-2 border-b-2 font-mono font-medium transition-colors shrink-0 ${
              activeTab === 'claude_prompt'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Claude PC Finisher Prompt
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-hidden flex flex-col">
          {/* Metadata banner */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 mb-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
              <span className="text-indigo-400">Target File:</span>
              <span>{active.targetDir}</span>
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
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            </div>
          </div>

          {/* Code Viewport */}
          <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800/80 p-4 overflow-y-auto">
            <pre className="text-xs font-mono text-slate-300 whitespace-pre leading-relaxed">
              {active.content}
            </pre>
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Clicking <b>"Inject C# Bridge"</b> on the top bar automatically drops these scripts into your Unity project.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
