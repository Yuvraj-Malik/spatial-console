import { useState } from "react";
import {
  MATERIALS,
  COLOR_PALETTE,
  createCustomMaterial,
} from "../simulation/materials.js";
import { TEMPLATES } from "../simulation/templates.js";

export default function UIOverlay({
  state,
  dispatch,
}) {
  const [activeTab, setActiveTab] = useState("structure");
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState("");

  const {
    currentMaterial,
    draftCubes,
    confirmedCubes,
    collapseState,
    viewSettings,
    structuralMetrics,
  } = state;

  const draftCount = draftCubes.length;
  const confirmedCount = confirmedCubes.length;
  const totalCount = draftCount + confirmedCount;

  // Formatting helpers
  const formatMass = (kg) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(2)} tonnes`;
    }
    return `${kg} kg`;
  };

  const formatCost = (val) => {
    return `$${val.toLocaleString()}`;
  };

  // Determine structural status
  let statusText = "Empty Scene";
  let statusColor = "bg-slate-500 text-slate-100 border-slate-400";
  
  if (totalCount > 0) {
    if (collapseState.warningActive || structuralMetrics.unstableIds.length > 0) {
      statusText = "COLLAPSE IMMINENT";
      statusColor = "bg-red-500/20 text-red-400 border-red-500/50 animate-pulse";
    } else if (structuralMetrics.safetyFactor < 1.0) {
      statusText = "STRUCTURE OVERLOADED";
      statusColor = "bg-amber-500/20 text-amber-400 border-amber-500/50";
    } else {
      statusText = "STRUCTURALLY SOUND";
      statusColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
    }
  }

  // OBJ Exporter
  const handleExportOBJ = () => {
    if (confirmedCubes.length === 0) {
      alert("Please place and confirm blocks before exporting!");
      return;
    }

    let objContent = "# VoxelForge 3D Structural Export\n";
    let mtllibName = "voxel_structure.mtl";
    objContent += `mtllib ${mtllibName}\n\n`;

    let vertexCount = 0;

    // Group cubes by material
    const materialGroups = {};
    confirmedCubes.forEach((cube) => {
      const matName = cube.material.name;
      if (!materialGroups[matName]) materialGroups[matName] = [];
      materialGroups[matName].push(cube);
    });

    Object.entries(materialGroups).forEach(([matName, cubes]) => {
      objContent += `g ${matName}\n`;
      objContent += `usemtl ${matName}\n`;

      cubes.forEach((cube) => {
        const { x, y, z } = cube;
        const r = 0.5; // Half voxel width

        // 8 Vertices
        objContent += `v ${x - r} ${y - r} ${z - r}\n`;
        objContent += `v ${x + r} ${y - r} ${z - r}\n`;
        objContent += `v ${x + r} ${y + r} ${z - r}\n`;
        objContent += `v ${x - r} ${y + r} ${z - r}\n`;
        objContent += `v ${x - r} ${y - r} ${z + r}\n`;
        objContent += `v ${x + r} ${y - r} ${z + r}\n`;
        objContent += `v ${x + r} ${y + r} ${z + r}\n`;
        objContent += `v ${x - r} ${y + r} ${z + r}\n`;

        // 6 Faces (quads, 1-indexed)
        const base = vertexCount + 1;
        objContent += `f ${base} ${base + 3} ${base + 2} ${base + 1}\n`; // Back
        objContent += `f ${base + 4} ${base + 5} ${base + 6} ${base + 7}\n`; // Front
        objContent += `f ${base} ${base + 1} ${base + 5} ${base + 4}\n`; // Bottom
        objContent += `f ${base + 2} ${base + 3} ${base + 7} ${base + 6}\n`; // Top
        objContent += `f ${base} ${base + 4} ${base + 7} ${base + 3}\n`; // Left
        objContent += `f ${base + 1} ${base + 2} ${base + 6} ${base + 5}\n\n`; // Right

        vertexCount += 8;
      });
    });

    // Generate .mtl content
    let mtlContent = "# VoxelForge MTL Definitions\n";
    const uniqueMaterials = Array.from(new Set(confirmedCubes.map((c) => c.material)));
    uniqueMaterials.forEach((mat) => {
      const hex = mat.color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      mtlContent += `newmtl ${mat.name}\n`;
      mtlContent += `Kd ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}\n`;
      mtlContent += `Ka 0.200 0.200 0.200\n`;
      mtlContent += `Ks 0.300 0.300 0.300\n`;
      mtlContent += `Ns 32.000\n`;
      mtlContent += `illum 2\n\n`;
    });

    // Trigger OBJ Download
    const objBlob = new Blob([objContent], { type: "text/plain" });
    const objUrl = URL.createObjectURL(objBlob);
    const objA = document.createElement("a");
    objA.href = objUrl;
    objA.download = "voxel_structure.obj";
    document.body.appendChild(objA);
    objA.click();
    document.body.removeChild(objA);
    URL.revokeObjectURL(objUrl);

    // Trigger MTL Download
    const mtlBlob = new Blob([mtlContent], { type: "text/plain" });
    const mtlUrl = URL.createObjectURL(mtlBlob);
    const mtlA = document.createElement("a");
    mtlA.href = mtlUrl;
    mtlA.download = "voxel_structure.mtl";
    document.body.appendChild(mtlA);
    mtlA.click();
    document.body.removeChild(mtlA);
    URL.revokeObjectURL(mtlUrl);
  };

  // Export JSON string
  const handleExportJSON = () => {
    const cubesToExport = confirmedCubes.map(c => ({
      x: c.x,
      y: c.y,
      z: c.z,
      material: c.material,
      status: "confirmed"
    }));
    const jsonStr = JSON.stringify(cubesToExport);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Import JSON string
  const handleImportJSON = () => {
    try {
      setImportError("");
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) throw new Error("JSON must be a list of block objects.");
      
      // Validate structure format
      const validCubes = parsed.map(c => {
        if (typeof c.x !== "number" || typeof c.y !== "number" || typeof c.z !== "number" || !c.material) {
          throw new Error("Invalid cube coordinates or material in JSON.");
        }
        return {
          x: c.x,
          y: c.y,
          z: c.z,
          material: c.material
        };
      });

      dispatch({ type: "LOAD_JSON", payload: { cubes: validCubes } });
      setJsonInput("");
    } catch (err) {
      setImportError(err.message || "Failed to parse voxel JSON.");
    }
  };

  return (
    <div className="absolute top-0 left-0 h-full w-96 z-20 pointer-events-auto flex flex-col bg-slate-950/80 backdrop-blur-lg border-r border-slate-800/60 text-slate-100 shadow-2xl overflow-hidden font-sans">
      {/* Platform Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            VoxelForge 3D
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">
            Structural Console
          </p>
        </div>
        <div className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded border ${statusColor}`}>
          {statusText}
        </div>
      </div>

      {/* Tabs Selection Bar */}
      <div className="flex border-b border-slate-900 bg-slate-950/50 text-xs">
        {[
          { id: "structure", label: "Telemetry" },
          { id: "materials", label: "Library" },
          { id: "templates", label: "Templates" },
          { id: "settings", label: "Console" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-center border-b-2 font-semibold transition-all ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-400 bg-slate-900/30"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab Content Panel */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* Collapse warning at the very top of stats if active */}
        {collapseState.warningActive && (
          <div className="p-4 bg-red-950/60 border border-red-500/50 rounded-xl space-y-2 text-slate-100 animate-pulse">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center">
              ⚠️ Collapse Alert
            </h3>
            <p className="text-xs text-red-200">
              {collapseState.unstableIds.length} unstable voxel(s) will fall in{" "}
              <span className="font-bold text-red-400 text-sm">{collapseState.countdown}s</span>
            </p>
            <div className="w-full bg-red-900/40 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-red-500 h-full transition-all duration-1000"
                style={{ width: `${(collapseState.countdown / 3) * 100}%` }}
              />
            </div>
            <button
              onClick={() => dispatch({ type: "CANCEL_COLLAPSE" })}
              className="w-full mt-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-md"
            >
              Cancel Structural Collapse
            </button>
          </div>
        )}

        {/* TAB 1: TELEMETRY & STATS */}
        {activeTab === "structure" && (
          <div className="space-y-4">
            
            {/* Voxel Counts */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900/50 border border-slate-800/50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Draft Voxels</span>
                <p className="text-lg font-bold text-blue-400 font-mono mt-0.5">{draftCount}</p>
              </div>
              <div className="p-3 bg-slate-900/50 border border-slate-800/50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Confirmed</span>
                <p className="text-lg font-bold text-indigo-400 font-mono mt-0.5">{confirmedCount}</p>
              </div>
            </div>

            {/* Safety Factor & Mass/Cost Stats */}
            <div className="space-y-3 p-4 bg-slate-900/40 border border-slate-900 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Engineering Telemetry</h3>
              
              {/* Safety Factor */}
              <div className="flex justify-between items-center py-1 border-b border-slate-800/30">
                <span className="text-xs text-slate-400 flex items-center">
                  🛡️ Safety Factor
                </span>
                <span className={`text-xs font-bold font-mono ${
                  structuralMetrics.safetyFactor === Infinity ? "text-slate-400" :
                  structuralMetrics.safetyFactor >= 1.5 ? "text-emerald-400" :
                  structuralMetrics.safetyFactor >= 1.0 ? "text-amber-400" : "text-red-400 font-black animate-pulse"
                }`}>
                  {structuralMetrics.safetyFactor === Infinity ? "∞ (No stress)" :
                   `${structuralMetrics.safetyFactor.toFixed(2)}x ${structuralMetrics.safetyFactor < 1.0 ? "⚠️" : "✓"}`}
                </span>
              </div>

              {/* Total Mass */}
              <div className="flex justify-between items-center py-1 border-b border-slate-800/30">
                <span className="text-xs text-slate-400 flex items-center">
                  ⚖️ Total Weight
                </span>
                <span className="text-xs font-bold text-slate-200 font-mono">
                  {formatMass(structuralMetrics.totalMass)}
                </span>
              </div>

              {/* Budget Limit Meter */}
              <div className="space-y-1 py-1 border-b border-slate-800/30">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">💵 Voxel Cost</span>
                  <span className="text-xs font-bold text-slate-200 font-mono">
                    {formatCost(structuralMetrics.totalCost)} / $10k
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      structuralMetrics.totalCost > 10000 ? "bg-red-500" :
                      structuralMetrics.totalCost > 7500 ? "bg-amber-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.min(100, (structuralMetrics.totalCost / 10000) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Height */}
              <div className="flex justify-between items-center py-1 border-b border-slate-800/30">
                <span className="text-xs text-slate-400">📏 Max Height</span>
                <span className="text-xs font-bold text-slate-200 font-mono">
                  {structuralMetrics.maxHeight.toFixed(1)} m ({Math.max(0, Math.ceil(structuralMetrics.maxHeight - 0.5))} blocks)
                </span>
              </div>

              {/* Center of Mass */}
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-slate-400">🎯 Center of Mass</span>
                <span className="text-xs font-bold text-slate-300 font-mono">
                  {confirmedCount > 0
                    ? `(${structuralMetrics.centerOfMass.x.toFixed(1)}, ${structuralMetrics.centerOfMass.y.toFixed(1)}, ${structuralMetrics.centerOfMass.z.toFixed(1)})`
                    : "None"}
                </span>
              </div>
            </div>

            {/* Confirm & Undo buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => dispatch({ type: "CONFIRM_DRAFT" })}
                disabled={draftCount === 0}
                className={`col-span-2 py-3 rounded-xl font-bold text-sm transition-all shadow-lg cursor-pointer ${
                  draftCount === 0
                    ? "bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-800/30"
                    : "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-900/30 border border-emerald-500/30 active:scale-98"
                }`}
              >
                Confirm Structure ({draftCount})
              </button>

              <button
                onClick={() => dispatch({ type: "UNDO" })}
                disabled={state.history.length === 0}
                className={`py-2 px-3 border rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  state.history.length === 0
                    ? "border-slate-800 text-slate-600 cursor-not-allowed"
                    : "border-slate-700 text-slate-300 hover:bg-slate-900/60 active:scale-95"
                }`}
              >
                ↩️ Undo (Ctrl+Z)
              </button>
              
              <button
                onClick={() => dispatch({ type: "CLEAR_SCENE" })}
                className="py-2 px-3 border border-red-900/50 hover:bg-red-950/20 text-red-400 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                🗑️ Clear Scene
              </button>
            </div>

            {/* Instruction Box */}
            <div className="p-3 bg-slate-950/50 border border-slate-900 rounded-lg text-[10px] text-slate-400 leading-relaxed">
              <span className="font-bold text-slate-300 block mb-1">🎮 Quick Controls Guide:</span>
              <div>• <strong className="text-slate-300">Left Click Ground</strong>: Place a block at ground level</div>
              <div>• <strong className="text-slate-300">Left Click Block Face</strong>: Snap a new block adjacent</div>
              <div>• <strong className="text-slate-300">Right Click Block</strong>: Delete selected block</div>
              <div>• <strong className="text-slate-300">Right Click & Drag</strong>: Rotate Camera view</div>
            </div>

          </div>
        )}

        {/* TAB 2: LIBRARY & MATERIALS */}
        {activeTab === "materials" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Material Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(MATERIALS).map(([key, material]) => (
                <button
                  key={key}
                  onClick={() => dispatch({ type: "SET_MATERIAL", payload: material })}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-20 relative overflow-hidden cursor-pointer ${
                    currentMaterial.name === material.name
                      ? "border-blue-500 bg-blue-950/20 ring-1 ring-blue-500/30"
                      : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="w-1.5 h-full absolute top-0 left-0" style={{ backgroundColor: material.color }} />
                  <span className="font-semibold text-xs ml-1">{material.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono ml-1">{formatCost(material.costPerCube)} / cube</span>
                </button>
              ))}

              {/* Custom Material Color Selection */}
              <button
                onClick={() => setShowColorPalette(!showColorPalette)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-20 col-span-2 relative overflow-hidden cursor-pointer ${
                  currentMaterial.name === "Custom"
                    ? "border-purple-500 bg-purple-950/20 ring-1 ring-purple-500/30"
                    : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/80"
                }`}
              >
                <div className="w-1.5 h-full absolute top-0 left-0" style={{ backgroundColor: currentMaterial.name === "Custom" ? currentMaterial.color : "#a855f7" }} />
                <span className="font-semibold text-xs ml-1">Custom Color Voxel</span>
                <span className="text-[10px] text-slate-400 ml-1">Configure structural properties with custom hues</span>
              </button>
            </div>

            {/* Custom Color Selector Modal */}
            {showColorPalette && (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl animate-fadeIn space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Hex Color</span>
                <div className="grid grid-cols-7 gap-1">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        dispatch({ type: "SET_MATERIAL", payload: createCustomMaterial(color) });
                        setShowColorPalette(false);
                      }}
                      className={`w-9 h-9 rounded-lg border-2 transition-all hover:scale-110 cursor-pointer ${
                        currentMaterial.color === color ? "border-white scale-105" : "border-slate-800"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Material Specific Specifications Info Panel */}
            <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-slate-300"> Voxel Specifications ({currentMaterial.name})</h4>
              
              <div className="grid grid-cols-2 gap-y-2 pt-1 border-t border-slate-800/40">
                <span className="text-slate-400">Density:</span>
                <span className="font-mono font-semibold text-right">{currentMaterial.density.toLocaleString()} kg/m³</span>
                
                <span className="text-slate-400">Compression Limit:</span>
                <span className="font-mono font-semibold text-right text-emerald-400">{formatMass(currentMaterial.maxVerticalLoad)}</span>
                
                <span className="text-slate-400">Bending Limit:</span>
                <span className="font-mono font-semibold text-right text-amber-400">{currentMaterial.maxMoment.toLocaleString()} kg·m</span>
                
                <span className="text-slate-400">Base Cost:</span>
                <span className="font-mono font-semibold text-right text-blue-400">{formatCost(currentMaterial.costPerCube)}</span>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: LOAD PRESETS */}
        {activeTab === "templates" && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Pre-built Structures</h3>
            <p className="text-[11px] text-slate-400 leading-normal mb-3">
              Load these structure configurations directly to analyze stress distributions and engineering capabilities.
            </p>

            <div className="space-y-2">
              {Object.entries(TEMPLATES).map(([key, template]) => (
                <div
                  key={key}
                  className="p-3 bg-slate-900/40 hover:bg-slate-900/70 border border-slate-900 rounded-xl flex flex-col justify-between gap-2 transition-all"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-200">{template.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{template.description}</p>
                  </div>
                  <button
                    onClick={() => dispatch({ type: "LOAD_TEMPLATE", payload: { cubes: template.cubes } })}
                    className="self-end px-3 py-1 bg-blue-600/25 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-blue-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Load Model
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM CONTROLS & UTILITIES */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            
            {/* View Settings Toggles */}
            <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">View Settings</h3>

              {/* Stress Heatmap View Switch */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">🔥 Stress Heatmap</span>
                <button
                  onClick={() => dispatch({ type: "TOGGLE_STRESS_HEATMAP" })}
                  className={`w-10 h-5 rounded-full p-0.5 transition-all cursor-pointer ${
                    viewSettings.stressHeatmap ? "bg-blue-600 flex justify-end" : "bg-slate-800 flex justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Grid Helper Switch */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">🌐 Grid Helper</span>
                <button
                  onClick={() => dispatch({ type: "TOGGLE_GRID" })}
                  className={`w-10 h-5 rounded-full p-0.5 transition-all cursor-pointer ${
                    viewSettings.showGrid !== false ? "bg-blue-600 flex justify-end" : "bg-slate-800 flex justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Auto Rotate View Switch */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">🔄 Auto-Rotate View</span>
                <button
                  onClick={() => dispatch({ type: "TOGGLE_AUTO_ROTATE" })}
                  className={`w-10 h-5 rounded-full p-0.5 transition-all cursor-pointer ${
                    viewSettings.autoRotate ? "bg-blue-600 flex justify-end" : "bg-slate-800 flex justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>

            {/* Model Exporter */}
            <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">3D Export Pipeline</h3>
              <p className="text-[10px] text-slate-400 leading-normal">
                Export voxel coordinates to generic Wavefront `.obj` mesh files (with materials) for importing directly into Blender or CAD software.
              </p>
              <button
                onClick={handleExportOBJ}
                disabled={confirmedCubes.length === 0}
                className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                  confirmedCubes.length === 0
                    ? "bg-slate-800/30 text-slate-600 border-slate-800 cursor-not-allowed"
                    : "bg-blue-600/10 hover:bg-blue-600 border-blue-500/40 hover:border-blue-500 text-blue-400 hover:text-white"
                }`}
              >
                📥 Download wave-front .OBJ Model
              </button>
            </div>

            {/* JSON Save / Load Clipboard */}
            <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">JSON Blueprint Copy</h3>
              
              <button
                onClick={handleExportJSON}
                disabled={confirmedCubes.length === 0}
                className="w-full py-2 border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                {copied ? "✓ Copied to Clipboard!" : "📋 Copy Scene Blueprint JSON"}
              </button>

              <div className="space-y-1.5 pt-2 border-t border-slate-900">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Paste Voxel JSON</span>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='Paste valid block coordinates: [{"x":0,"y":0.5,"z":0,"material":{"name":"Steel"}}]'
                  className="w-full h-16 p-2 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                />
                {importError && <p className="text-[10px] text-red-400">{importError}</p>}
                <button
                  onClick={handleImportJSON}
                  disabled={!jsonInput}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:bg-slate-800 disabled:text-slate-500 transition-all cursor-pointer"
                >
                  📥 Import Voxel Blueprint
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
