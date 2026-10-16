import React, { useState } from 'react';
import {
  Search,
  Filter,
  Layers,
  Users,
  Scissors,
  RefreshCw,
  Code2,
  Trash2,
  Zap,
  Hammer,
  Coins,
  Smile,
  Shield,
  Activity,
} from 'lucide-react';
import { BuildingSpec, ResidentSpec } from '../types/kingdom';

interface ManifestRosterProps {
  buildings: BuildingSpec[];
  residents: ResidentSpec[];
  onUpdateBuilding: (building: BuildingSpec) => void;
  onUpdateResident: (resident: ResidentSpec) => void;
  onDeleteBuilding: (id: string) => void;
  onDeleteResident: (id: string) => void;
  onRegenerateSprite: (entity: BuildingSpec | ResidentSpec) => void;
  onConfigureSprite: (entity: BuildingSpec | ResidentSpec) => void;
  onViewRawJson: (entity: BuildingSpec | ResidentSpec) => void;
}

export const ManifestRoster: React.FC<ManifestRosterProps> = ({
  buildings,
  residents,
  onUpdateBuilding,
  onUpdateResident,
  onDeleteBuilding,
  onDeleteResident,
  onRegenerateSprite,
  onConfigureSprite,
  onViewRawJson,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'buildings' | 'residents'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBuildings = buildings.filter((b) => {
    if (filterType === 'residents') return false;
    return (
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredResidents = residents.filter((r) => {
    if (filterType === 'buildings') return false;
    return (
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.personalityTrait.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4 overflow-y-auto">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Kingdom Manifest Roster</span>
            <span className="text-xs font-mono text-slate-400">
              ({buildings.length} Buildings · {residents.length} Residents)
            </span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Synchronized with Unity <code>KingdomManifest.json</code> and AssetDatabase
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search roster..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Segmented Type Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterType === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('buildings')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterType === 'buildings'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Buildings
            </button>
            <button
              onClick={() => setFilterType('residents')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterType === 'residents'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Residents
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pb-6">
        {/* Buildings Section */}
        {filteredBuildings.map((building) => (
          <div
            key={building.id}
            className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 shadow-sm"
          >
            {/* Header info */}
            <div className="flex items-start gap-3">
              {/* Sprite Thumbnail */}
              <div className="w-16 h-16 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1 relative group shrink-0 overflow-hidden">
                {building.spriteDataUri ? (
                  <img
                    src={building.spriteDataUri}
                    alt={building.name}
                    className="w-full h-full object-contain pixelated"
                  />
                ) : (
                  <Hammer className="w-6 h-6 text-amber-500/60" />
                )}
                <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-slate-950/80 px-1 rounded text-slate-400">
                  {building.footprint}
                </span>
              </div>

              {/* Title & Category */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-100 text-xs truncate">{building.name}</h3>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-900 px-1.5 py-0.5 rounded shrink-0">
                    {building.category}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Coins className="w-3 h-3" />
                    <span>{building.cost.wood}W · {building.cost.stone}S · {building.cost.gold}G</span>
                  </span>
                  <span>·</span>
                  <span className="text-teal-300">
                    +{building.production.ratePerMin} {building.production.resource}/min
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                  Prompt: {building.spritePrompt}
                </div>
              </div>
            </div>

            {/* Quick Live Sliders */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>Placement Bounce:</span>
                  <span className="font-mono text-emerald-400">
                    {building.arcadeJuice.placementBounce.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={building.arcadeJuice.placementBounce}
                  onChange={(e) =>
                    onUpdateBuilding({
                      ...building,
                      arcadeJuice: {
                        ...building.arcadeJuice,
                        placementBounce: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>Production Rate:</span>
                  <span className="font-mono text-teal-400">
                    {building.production.ratePerMin}/m
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={building.production.ratePerMin}
                  onChange={(e) =>
                    onUpdateBuilding({
                      ...building,
                      production: {
                        ...building.production,
                        ratePerMin: parseInt(e.target.value, 10),
                      },
                    })
                  }
                  className="w-full accent-teal-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80 text-[11px]">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onConfigureSprite(building)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 font-medium transition-colors"
                >
                  <Scissors className="w-3 h-3 text-indigo-400" />
                  <span>Configure Slicing / Pivot</span>
                </button>
                <button
                  onClick={() => onRegenerateSprite(building)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                  title="Regenerate Sprite"
                >
                  <RefreshCw className="w-3 h-3 text-amber-400" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onViewRawJson(building)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                  title="View Raw JSON / C#"
                >
                  <Code2 className="w-3 h-3" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => onDeleteBuilding(building.id)}
                  className="p-1 rounded hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete Building"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Residents Section */}
        {filteredResidents.map((resident) => (
          <div
            key={resident.id}
            className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 shadow-sm"
          >
            {/* Header info */}
            <div className="flex items-start gap-3">
              {/* Sprite Thumbnail */}
              <div className="w-16 h-16 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1 relative shrink-0 overflow-hidden">
                {resident.spriteDataUri ? (
                  <img
                    src={resident.spriteDataUri}
                    alt={resident.name}
                    className="w-full h-full object-contain pixelated"
                  />
                ) : (
                  <Users className="w-6 h-6 text-indigo-500/60" />
                )}
                <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-slate-950/80 px-1 rounded text-indigo-400">
                  4x4
                </span>
              </div>

              {/* Title & Role */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-100 text-xs truncate">{resident.name}</h3>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/50 border border-indigo-900 px-1.5 py-0.5 rounded shrink-0">
                    {resident.role}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-amber-400 font-medium">
                    Trait: {resident.personalityTrait}
                  </span>
                  <span>·</span>
                  <span className="text-teal-300 font-mono">
                    Speed: {resident.baseWalkSpeed.toFixed(1)}
                  </span>
                  <span>·</span>
                  <span className="text-emerald-300 font-mono">
                    Eff: {resident.workEfficiency.toFixed(1)}x
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5 italic truncate">
                  "{resident.dialogueLines[0] || 'At your service, Lord.'}"
                </div>
              </div>
            </div>

            {/* Quick Live Sliders */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>Base Walk Speed:</span>
                  <span className="font-mono text-teal-400">
                    {resident.baseWalkSpeed.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="4.0"
                  step="0.2"
                  value={resident.baseWalkSpeed}
                  onChange={(e) =>
                    onUpdateResident({
                      ...resident,
                      baseWalkSpeed: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-teal-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>Work Efficiency:</span>
                  <span className="font-mono text-emerald-400">
                    {resident.workEfficiency.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={resident.workEfficiency}
                  onChange={(e) =>
                    onUpdateResident({
                      ...resident,
                      workEfficiency: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80 text-[11px]">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onConfigureSprite(resident)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 font-medium transition-colors"
                >
                  <Scissors className="w-3 h-3 text-indigo-400" />
                  <span>Configure 4-Direction Sheet</span>
                </button>
                <button
                  onClick={() => onRegenerateSprite(resident)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                  title="Regenerate Sprite"
                >
                  <RefreshCw className="w-3 h-3 text-amber-400" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onViewRawJson(resident)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                  title="View Raw JSON / C#"
                >
                  <Code2 className="w-3 h-3" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => onDeleteResident(resident.id)}
                  className="p-1 rounded hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete Resident"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
