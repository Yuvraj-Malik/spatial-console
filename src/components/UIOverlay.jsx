import { useEffect, useState } from "react";
import {
  MATERIALS,
  COLOR_PALETTE,
  createCustomMaterial,
} from "../simulation/materials.js";
import { TEMPLATES } from "../simulation/templates.js";
import {
  loginWithGoogle,
  logoutUser,
  saveStructure,
  getSavedStructures,
  deleteStructure,
  firebaseEnabled,
  registerUserWithEmail,
  loginUserWithEmail,
} from "../core/firebase.js";

const SHAPE_CATEGORIES = [
  {
    id: "shapes",
    name: "Architectural Shapes",
    items: [
      { id: "cube", name: "Standard Cube", emoji: "🧱" },
      { id: "slab", name: "Half Slab", emoji: "➖" },
      { id: "quarter", name: "Quarter Slab", emoji: "▫️" },
      { id: "stair", name: "Stairs", emoji: "🪜" },
      { id: "ramp", name: "Ramp / Wedge", emoji: "📐" },
      { id: "pillar", name: "Pillar / Cylinder", emoji: "🏛️" },
      { id: "sphere", name: "Sphere", emoji: "🟢" },
    ]
  },
  {
    id: "openings",
    name: "Openings & Enclosures",
    items: [
      { id: "door", name: "Wood Door", emoji: "🚪" },
      { id: "window", name: "Glass Window", emoji: "🪟" },
      { id: "fence", name: "Wood Fence", emoji: "🪵" },
    ]
  },
  {
    id: "furniture",
    name: "Furniture & Decor",
    items: [
      { id: "bed", name: "Bedroom Bed", emoji: "🛏️" },
      { id: "sofa", name: "Living Couch", emoji: "🛋️" },
      { id: "chair", name: "Dining Chair", emoji: "🪑" },
      { id: "table", name: "Coffee Table", emoji: "🪵" },
      { id: "sink", name: "Kitchen Sink", emoji: "𚰰" },
      { id: "toilet", name: "Bathroom Toilet", emoji: "🚽" },
    ]
  },
  {
    id: "landscaping",
    name: "Landscaping & Foliage",
    items: [
      { id: "grass_block", name: "Grass Block", emoji: "🌱" },
      { id: "tree", name: "Forest Tree", emoji: "🌳" },
      { id: "bush", name: "Green Bush", emoji: "🌿" },
      { id: "flower", name: "Pink Flower", emoji: "🌸" },
    ]
  },
  {
    id: "utilities",
    name: "Infrastructure & Utilities",
    items: [
      { id: "pipe", name: "Iron Pipe", emoji: "🛠️" },
      { id: "lamp", name: "Light Lamp", emoji: "💡" },
    ]
  }
];

export default function UIOverlay({
  state,
  dispatch,
}) {
  const [activeTab, setActiveTab] = useState("construct"); // "construct", "telemetry", "projects", "account"
  const [activeCategory, setActiveCategory] = useState("shapes"); // shapes categories filter
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showHelp, setShowHelp] = useState(false); // Help overlay state

  // Accordion Expand States
  const [materialsExpanded, setMaterialsExpanded] = useState(true);
  const [shapesExpanded, setShapesExpanded] = useState(true);
  const [templatesExpanded, setTemplatesExpanded] = useState(true);
  const [savedDesignsExpanded, setSavedDesignsExpanded] = useState(false);
  const [importExportExpanded, setImportExportExpanded] = useState(false);

  // Cloud database states
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [designName, setDesignName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Email/Password auth states
  const [authMode, setAuthMode] = useState("login");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

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

  // Load saved designs from Cloud/Local Storage
  const loadUserDesigns = async () => {
    if (!state.user) return;
    setIsLoadingList(true);
    try {
      const list = await getSavedStructures(state.user.uid);
      setSavedDesigns(list);
    } catch (e) {
      console.error("Failed to load designs:", e);
    } finally {
      setIsLoadingList(false);
    }
  };

  // Trigger loading list when tab is selected or user state updates
  useEffect(() => {
    if (state.user && activeTab === "projects") {
      loadUserDesigns();
    }
  }, [state.user, activeTab]);

  const handleLogin = async () => {
    try {
      const u = await loginWithGoogle();
      dispatch({ type: "SET_USER", payload: u });
    } catch (e) {
      console.error("Login failed:", e);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      dispatch({ type: "SET_USER", payload: null });
      setSavedDesigns([]);
      setShareUrl("");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const handleEmailAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      let u;
      if (authMode === "register") {
        if (!usernameInput.trim()) {
          throw new Error("Username is required.");
        }
        u = await registerUserWithEmail(
          emailInput,
          passwordInput,
          usernameInput.trim()
        );
      } else {
        u = await loginUserWithEmail(emailInput, passwordInput);
      }
      dispatch({ type: "SET_USER", payload: u });
      setEmailInput("");
      setPasswordInput("");
      setUsernameInput("");
    } catch (err) {
      console.error("Email auth failed:", err);
      setAuthError(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!designName.trim()) return;
    if (confirmedCubes.length === 0) {
      alert("Please place and confirm blocks first before saving!");
      return;
    }
    
    setIsSaving(true);
    try {
      const cubesToSave = confirmedCubes.map(c => ({
        x: c.x,
        y: c.y,
        z: c.z,
        material: c.material,
        shape: c.shape || "cube",
        rotationY: c.rotationY || 0,
        status: "confirmed"
      }));

      const designId = await saveStructure(
        state.user,
        designName,
        cubesToSave,
        structuralMetrics
      );

      await loadUserDesigns();
      setDesignName("");
      alert("✓ Design saved successfully!");
    } catch (err) {
      console.error("Failed to save design:", err);
      alert("Error saving design. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadDesign = (design) => {
    dispatch({ type: "LOAD_JSON", payload: { cubes: design.cubes } });
    const url = `${window.location.origin}${window.location.pathname}?share=${design.id}`;
    setShareUrl(url);
  };

  const handleDeleteDesign = async (designId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this design?")) return;
    try {
      await deleteStructure(designId);
      await loadUserDesigns();
      if (shareUrl.includes(designId)) {
        setShareUrl("");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  // Determine structural status
  let statusText = "Empty Scene";
  let statusColor = "bg-slate-500 text-slate-100 border-slate-400";
  
  if (totalCount > 0) {
    if (collapseState.warningActive || (structuralMetrics?.unstableIds || []).length > 0) {
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
      shape: c.shape || "cube",
      rotationY: c.rotationY || 0,
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
          material: c.material,
          shape: c.shape || "cube",
          rotationY: c.rotationY || 0
        };
      });

      dispatch({ type: "LOAD_JSON", payload: { cubes: validCubes } });
      setJsonInput("");
    } catch (err) {
      setImportError(err.message || "Failed to parse voxel JSON.");
    }
  };

  return (
    <>
      <div className={`absolute top-0 left-0 h-full w-96 z-20 pointer-events-auto flex flex-col bg-[#0d1422] border-r border-[#1e2a40] text-slate-100 shadow-2xl transition-transform duration-300 ease-in-out font-sans ${
        isCollapsed ? "-translate-x-full" : "translate-x-0"
      }`}>
        {/* Platform Header */}
        <div className="p-4 border-b border-[#1e2a40] flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Spatial Console
            </h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">
              3D Structural Suite
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(true)}
              className="w-7 h-7 bg-[#111927] hover:bg-[#131f30] border border-[#1e2a40] text-[#60a5fa] hover:text-white rounded-lg flex items-center justify-center text-xs font-black transition-all cursor-pointer"
              title="Help / Quick Controls"
            >
              ?
            </button>
            <div className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded border ${statusColor}`}>
              {statusText}
            </div>
          </div>
        </div>

        {/* Tab Segment Controls */}
        <div className="p-1 bg-[#080c14] border-b border-[#1e2a40] flex gap-1 text-[10px]">
          {[
            { id: "construct", label: "Construct" },
            { id: "telemetry", label: "Telemetry" },
            { id: "projects", label: "Projects" },
            { id: "account", label: "Account" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 text-center rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#111927] text-[#60a5fa] border border-[#1e2a40]"
                  : "text-[#3d5166] hover:text-[#94a3b8] border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Scrollable Panel Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* HELP OVERLAY POPUP */}
          {showHelp && (
            <div className="absolute inset-0 bg-[#0d1422]/95 z-50 p-6 flex flex-col justify-between animate-fadeIn">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#1e2a40] pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#60a5fa] flex items-center gap-1.5">
                    🎮 Interactive Controls Guide
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowHelp(false)}
                    className="text-slate-400 hover:text-white text-xs font-bold"
                  >
                    ✕ Close
                  </button>
                </div>
                
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div className="p-3 bg-[#080c14] border border-[#1e2a40] rounded-xl">
                    <span className="font-bold text-[#94a3b8] block mb-1">🖱️ Mouse Controls:</span>
                    <div className="space-y-1">
                      <div>• <strong className="text-white">Left Click Ground</strong>: Place selected block at ground level</div>
                      <div>• <strong className="text-white">Left Click Block Face</strong>: Snap a new block adjacent to that face</div>
                      <div>• <strong className="text-white">Right Click Block</strong>: Delete block from scene</div>
                      <div>• <strong className="text-white">Right Click & Drag</strong>: Rotate camera orbit</div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#080c14] border border-[#1e2a40] rounded-xl">
                    <span className="font-bold text-[#94a3b8] block mb-1">⌨️ Keyboard Shortcuts:</span>
                    <div className="space-y-1">
                      <div>• <strong className="text-white">R Key</strong>: Cycle block placement rotation by 90°</div>
                      <div>• <strong className="text-white">Ctrl + Z</strong>: Undo last action (draft or confirm)</div>
                      <div>• <strong className="text-white">Esc Key</strong>: Cancel active line / beam drawing</div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#080c14] border border-[#1e2a40] rounded-xl">
                    <span className="font-bold text-[#94a3b8] block mb-1">🖐️ Gesture Commands (when active):</span>
                    <div className="space-y-1">
                      <div>• <strong className="text-white">Point finger</strong>: Move block cursor</div>
                      <div>• <strong className="text-white">Pinch fingers</strong>: Place block</div>
                      <div>• <strong className="text-white">Make Fist</strong>: Delete block</div>
                      <div>• <strong className="text-white">Open Palm</strong>: Confirm drafts</div>
                      <div>• <strong className="text-white">V-Sign (peace)</strong>: Orbit camera</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-2.5 bg-[#1a3a5c] hover:bg-[#1e4570] border border-[#3b82f6] text-[#60a5fa] font-bold rounded-xl text-xs transition-all active:scale-98"
              >
                Acknowledge & Start Building
              </button>
            </div>
          )}

          {/* Collapse warning */}
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

          {/* TAB 1: CONSTRUCT */}
          {activeTab === "construct" && (
            <div className="space-y-4">
              
              {/* Accordion 1: Textures & Colors */}
              <div className="space-y-3">
                <div 
                  onClick={() => setMaterialsExpanded(!materialsExpanded)} 
                  className="flex items-center justify-between p-2.5 bg-[#111927] hover:bg-[#131f30] border border-[#1e2a40] rounded-lg cursor-pointer transition-all select-none"
                >
                  <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider">🎨 Textures & Colors</span>
                  <span className="text-xs text-slate-400">{materialsExpanded ? "▲" : "▼"}</span>
                </div>

                {materialsExpanded && (
                  <div className="space-y-4 pl-1 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(MATERIALS).map(([key, material]) => (
                        <button
                          key={key}
                          onClick={() => dispatch({ type: "SET_MATERIAL", payload: material })}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-24 relative overflow-hidden cursor-pointer ${
                            currentMaterial.name === material.name
                              ? "border-[#3b82f6] bg-[#0f1d30] ring-1 ring-[#3b82f6]/40"
                              : "border-[#1e2a40] bg-[#111927] hover:bg-[#131f30]"
                          }`}
                        >
                          <div className="w-1 h-full rounded-r-sm absolute top-0 left-0" style={{ backgroundColor: material.color }} />
                          <span className="font-semibold text-xs ml-1">{material.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono ml-1">{formatCost(material.costPerCube)} / block</span>
                        </button>
                      ))}

                      {/* Custom Material Color Selection */}
                      <button
                        onClick={() => setShowColorPalette(!showColorPalette)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-24 col-span-2 relative overflow-hidden cursor-pointer ${
                          currentMaterial.name === "Custom"
                            ? "border-purple-500 bg-purple-950/20 ring-1 ring-purple-500/30"
                            : "border-[#1e2a40] bg-[#111927] hover:bg-[#131f30]"
                        }`}
                      >
                        <div className="w-1 h-full rounded-r-sm absolute top-0 left-0" style={{ backgroundColor: currentMaterial.name === "Custom" ? currentMaterial.color : "#a855f7" }} />
                        <span className="font-semibold text-xs ml-1">Custom Color Voxel</span>
                        <span className="text-[10px] text-slate-400 ml-1">Configure structural properties with custom hues</span>
                      </button>
                    </div>

                    {/* Custom Color Selector Modal */}
                    {showColorPalette && (
                      <div className="p-3 bg-[#111927] border border-[#1e2a40] rounded-xl animate-fadeIn space-y-2">
                        <span className="text-[10px] uppercase font-bold text-[#3d5166] tracking-wider">Select Hex Color</span>
                        <div className="grid grid-cols-7 gap-1">
                          {COLOR_PALETTE.map((color) => (
                            <button
                              key={color}
                              onClick={() => {
                                dispatch({ type: "SET_MATERIAL", payload: createCustomMaterial(color) });
                                setShowColorPalette(false);
                              }}
                              className={`w-9 h-9 rounded-lg border-2 transition-all hover:scale-110 cursor-pointer ${
                                currentMaterial.color === color ? "border-white scale-105" : "border-[#1e2a40]"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Material Specifications */}
                    <div className="p-4 bg-[#111927] border border-[#1e2a40] rounded-xl space-y-2 text-xs">
                      <h4 className="font-bold text-slate-300"> Block Specifications ({currentMaterial.name})</h4>
                      <div className="grid grid-cols-2 gap-y-2 pt-1 border-t border-[#1e2a40]/40">
                        <span className="text-slate-400">Density:</span>
                        <span className="font-mono font-semibold text-right">{currentMaterial.density.toLocaleString()} kg/m³</span>
                        <span className="text-slate-400">Base Cost:</span>
                        <span className="font-mono font-semibold text-right text-blue-400">{formatCost(currentMaterial.costPerCube)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Architectural Shapes */}
              <div className="space-y-3">
                <div 
                  onClick={() => setShapesExpanded(!shapesExpanded)} 
                  className="flex items-center justify-between p-2.5 bg-[#111927] hover:bg-[#131f30] border border-[#1e2a40] rounded-lg cursor-pointer transition-all select-none"
                >
                  <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider">📐 Architectural Geometries</span>
                  <span className="text-xs text-slate-400">{shapesExpanded ? "▲" : "▼"}</span>
                </div>

                {shapesExpanded && (
                  <div className="space-y-4 pl-1 animate-fadeIn">
                    {/* Active Rotation Indicator */}
                    <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-[#3d5166] tracking-wider">Object Rotation</span>
                        <p className="text-xs font-semibold text-blue-400">
                          {state.rotationY === 0 ? "Facing North (0°)" :
                           state.rotationY === 1 ? "Facing East (90°)" :
                           state.rotationY === 2 ? "Facing South (180°)" : "Facing West (270°)"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "ROTATE_Y" })}
                        className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-95"
                      >
                        🔄 Rotate Y (R)
                      </button>
                    </div>

                    {/* Category Filter Segments */}
                    <div className="grid grid-cols-5 gap-1 bg-[#080c14] p-1 rounded-xl border border-[#1e2a40]">
                      {[
                        { id: "shapes", label: "Shapes", emoji: "📐" },
                        { id: "openings", label: "Openings", emoji: "🚪" },
                        { id: "furniture", label: "Decor", emoji: "🛋️" },
                        { id: "landscaping", label: "Garden", emoji: "🌱" },
                        { id: "utilities", label: "Utility", emoji: "💡" },
                      ].map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveCategory(cat.id)}
                            className={`py-1.5 px-0.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                              isActive
                                ? "bg-[#111927] border border-[#3b82f6] text-[#60a5fa] font-extrabold"
                                : "border border-transparent text-[#3d5166] hover:text-[#94a3b8] hover:bg-[#111927]/30"
                            }`}
                          >
                            <span className="text-base">{cat.emoji}</span>
                            <span className="text-[8px] uppercase tracking-wider font-bold truncate w-full text-center">
                              {cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Category items */}
                    {(() => {
                      const selectedCat = SHAPE_CATEGORIES.find(c => c.id === activeCategory);
                      if (!selectedCat) return null;
                      return (
                        <div className="space-y-1.5">
                          <h4 className="text-[9px] uppercase font-black text-slate-500 tracking-wider border-b border-slate-900/60 pb-1">
                            {selectedCat.name}
                          </h4>
                          <div className="grid grid-cols-2 gap-1.5">
                            {selectedCat.items.map((item) => {
                              const isSelected = (state.currentShape || "cube") === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => dispatch({ type: "SET_SHAPE", payload: item.id })}
                                  className={`p-2 rounded-lg border text-left transition-all flex items-center gap-2 cursor-pointer ${
                                    isSelected
                                      ? "border-[#3b82f6] bg-[#0f1d30] ring-1 ring-blue-500/30"
                                      : "border-[#1e2a40] bg-[#111927] hover:bg-[#131f30]"
                                  }`}
                                >
                                  <div className="w-7 h-7 flex items-center justify-center bg-[#1a2540] rounded-md text-sm flex-shrink-0">
                                    <span className="text-sm">{item.emoji}</span>
                                  </div>
                                  <span className="font-bold text-[10px] text-slate-300 truncate">{item.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: TELEMETRY */}
          {activeTab === "telemetry" && (
            <div className="space-y-4">
              
              {/* Voxel Counts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#111927] border border-[#1e2a40] rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-[#3d5166] tracking-wider">Draft Voxels</span>
                  <p className="text-lg font-bold text-blue-400 font-mono mt-0.5">{draftCount}</p>
                </div>
                <div className="p-3 bg-[#111927] border border-[#1e2a40] rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-[#3d5166] tracking-wider">Confirmed</span>
                  <p className="text-lg font-bold text-indigo-400 font-mono mt-0.5">{confirmedCount}</p>
                </div>
              </div>

              {/* Tool Mode Selection */}
              <div className="p-3 bg-[#111927] border border-[#1e2a40] rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#3d5166] tracking-wider block">Placement Mode</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => dispatch({ type: "SET_TOOL_MODE", payload: { toolMode: "single" } })}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      (viewSettings?.toolMode || "single") === "single"
                        ? "bg-[#1a2d4a] text-[#60a5fa] border-[#3b82f6]"
                        : "bg-[#080c14] text-[#3d5166] border-[#1e2a40] hover:text-[#94a3b8]"
                    }`}
                  >
                    🧱 Single Voxel
                  </button>
                  <button
                    onClick={() => dispatch({ type: "SET_TOOL_MODE", payload: { toolMode: "line" } })}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      viewSettings?.toolMode === "line"
                        ? "bg-[#1a2d4a] text-[#60a5fa] border-[#3b82f6]"
                        : "bg-[#080c14] text-[#3d5166] border-[#1e2a40] hover:text-[#94a3b8]"
                    }`}
                  >
                    📏 Line / Beam
                  </button>
                </div>
                {viewSettings?.toolMode === "line" && (
                  <p className="text-[10px] text-slate-400 italic">
                    * Click start position &rarr; hover to preview beam along axis &rarr; click again to place. Esc to cancel.
                  </p>
                )}
              </div>

              {/* Engineering Telemetry Metrics */}
              <div className="space-y-3 p-4 bg-[#111927] border border-[#1e2a40] rounded-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Engineering Telemetry</h3>
                
                {/* Safety Factor */}
                <div className="flex justify-between items-center py-1 border-b border-[#1a2540]">
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
                <div className="flex justify-between items-center py-1 border-b border-[#1a2540]">
                  <span className="text-xs text-slate-400 flex items-center">
                    ⚖️ Total Weight
                  </span>
                  <span className="text-xs font-bold text-slate-200 font-mono">
                    {formatMass(structuralMetrics.totalMass)}
                  </span>
                </div>

                {/* Budget Limit Meter */}
                <div className="space-y-1 py-1 border-b border-[#1a2540]">
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
                <div className="flex justify-between items-center py-1 border-b border-[#1a2540]">
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

            </div>
          )}

          {/* TAB 3: PROJECTS (Saved & Pre-built) */}
          {activeTab === "projects" && (
            <div className="space-y-4">
              
              {/* Accordion 1: Pre-built Blueprints */}
              <div className="space-y-3">
                <div 
                  onClick={() => setTemplatesExpanded(!templatesExpanded)} 
                  className="flex items-center justify-between p-2.5 bg-[#111927] hover:bg-[#131f30] border border-[#1e2a40] rounded-lg cursor-pointer transition-all select-none"
                >
                  <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider">📂 Pre-built Blueprints</span>
                  <span className="text-xs text-slate-400">{templatesExpanded ? "▲" : "▼"}</span>
                </div>

                {templatesExpanded && (
                  <div className="space-y-2 pl-1 animate-fadeIn">
                    <p className="text-[11px] text-[#3d5166] leading-normal mb-2">
                      Load these template structures directly into the viewport to test.
                    </p>
                    {Object.entries(TEMPLATES).map(([key, template]) => (
                      <div
                        key={key}
                        className="p-3 bg-[#111927] hover:bg-[#131f30] border border-[#1e2a40] rounded-xl flex flex-col justify-between gap-2 transition-all"
                      >
                        <div>
                          <h4 className="font-bold text-xs text-slate-200">{template.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{template.description}</p>
                        </div>
                        <button
                          onClick={() => dispatch({ type: "LOAD_TEMPLATE", payload: { cubes: template.cubes } })}
                          className="self-end px-3 py-1 bg-[#1a2d4a] hover:bg-blue-600 hover:text-white border border-blue-500/30 text-[#60a5fa] rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Load Model
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 2: Saved Projects */}
              <div className="space-y-3">
                <div 
                  onClick={() => setSavedDesignsExpanded(!savedDesignsExpanded)} 
                  className="flex items-center justify-between p-2.5 bg-[#111927] hover:bg-[#131f30] border border-[#1e2a40] rounded-lg cursor-pointer transition-all select-none"
                >
                  <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider">📁 Cloud & Local Designs</span>
                  <span className="text-xs text-slate-400">{savedDesignsExpanded ? "▲" : "▼"}</span>
                </div>

                {savedDesignsExpanded && (
                  <div className="space-y-3 pl-1 animate-fadeIn">
                    {/* Save Current Design Section */}
                    {state.user ? (
                      confirmedCount > 0 ? (
                        <form onSubmit={handleSave} className="space-y-2 p-3 bg-[#080c14] border border-[#1e2a40] rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-[#3d5166] tracking-wider">Save Current Design</span>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={designName}
                              onChange={(e) => setDesignName(e.target.value)}
                              placeholder="e.g. My suspension bridge"
                              required
                              maxLength={40}
                              className="flex-1 px-3 py-1.5 bg-[#080c14] border border-[#1e2a40] rounded-lg text-xs text-[#cbd5e1] focus:outline-none focus:border-[#3b82f6]"
                            />
                            <button
                              type="submit"
                              disabled={isSaving}
                              className="px-4 bg-[#1a3a5c] hover:bg-[#1e4570] disabled:bg-[#080c14] text-[#60a5fa] disabled:text-[#3d5166] text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                            >
                              {isSaving ? "..." : "💾 Save"}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="p-3 bg-[#080c14] border border-[#1e2a40] rounded-lg text-[10px] text-[#3d5166] text-center">
                          * Place and confirm blocks to enable saving!
                        </div>
                      )
                    ) : (
                      <div className="p-3 bg-[#080c14] border border-[#1e2a40] rounded-lg text-[10px] text-[#3d5166] text-center">
                        * Please log in under the Account tab to save designs!
                      </div>
                    )}

                    {/* List of Saved Projects */}
                    {state.user && (
                      <div className="space-y-2">
                        {isLoadingList ? (
                          <p className="text-xs text-[#3d5166] text-center py-5">Loading project database...</p>
                        ) : savedDesigns.length === 0 ? (
                          <p className="text-xs text-[#3d5166] text-center py-5 italic bg-[#080c14] border border-[#1e2a40] rounded-xl">
                            No designs saved in this account yet.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {savedDesigns.map((design) => (
                              <div
                                key={design.id}
                                onClick={() => handleLoadDesign(design)}
                                className="p-3 bg-[#111927] hover:bg-[#131f30] border border-[#1e2a40] hover:border-[#3b82f6]/50 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-99"
                              >
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-xs text-slate-200 truncate">{design.name}</h4>
                                  <span className="text-[9px] text-slate-500 font-mono">
                                    {new Date(design.createdAt).toLocaleDateString()} • {design.cubes.length} blocks
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const url = `${window.location.origin}${window.location.pathname}?share=${design.id}`;
                                      setShareUrl(url);
                                    }}
                                    title="Generate Shareable Link"
                                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-blue-400 transition-all"
                                  >
                                    🔗
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteDesign(design.id, e)}
                                    title="Delete Project"
                                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-all"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Generated Share Link Box */}
                    {shareUrl && (
                      <div className="p-3.5 bg-[#111927] border border-[#1e2a40] rounded-xl animate-fadeIn space-y-2 relative">
                        <button
                          type="button"
                          onClick={() => setShareUrl("")}
                          className="absolute top-3 right-3 text-[#3d5166] hover:text-[#cbd5e1] cursor-pointer text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full hover:bg-[#131f30] transition-all"
                          title="Close"
                        >
                          ✕
                        </button>
                        <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider block">🔗 Project Share Link</span>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Anyone with this link can view and test your 3D structure:
                        </p>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            readOnly
                            value={shareUrl}
                            className="flex-1 px-2.5 py-1 bg-[#080c14] border border-slate-850 rounded text-[10px] font-mono text-slate-400 focus:outline-none animate-pulse"
                          />
                          <button
                            onClick={handleCopyShareLink}
                            className="px-3 bg-[#1a3a5c] hover:bg-[#1e4570] text-[#60a5fa] text-[10px] font-bold rounded transition-all cursor-pointer active:scale-95"
                          >
                            {copiedShareLink ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 3: Import & Export Tools */}
              <div className="space-y-3">
                <div 
                  onClick={() => setImportExportExpanded(!importExportExpanded)} 
                  className="flex items-center justify-between p-2.5 bg-[#111927] hover:bg-[#131f30] border border-[#1e2a40] rounded-lg cursor-pointer transition-all select-none"
                >
                  <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider">📥 Import & Export Pipelines</span>
                  <span className="text-xs text-slate-400">{importExportExpanded ? "▲" : "▼"}</span>
                </div>

                {importExportExpanded && (
                  <div className="space-y-4 pl-1 animate-fadeIn">
                    
                    {/* Model Exporter */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#3d5166] tracking-wider block">CAD Mesh Exporter</span>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Download generic Wavefront `.obj` files with materials for Blender or CAD platforms.
                      </p>
                      <button
                        onClick={handleExportOBJ}
                        disabled={confirmedCubes.length === 0}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                          confirmedCubes.length === 0
                            ? "bg-[#111927] text-[#3d5166] border-[#1e2a40] cursor-not-allowed"
                            : "bg-[#1a2d4a] hover:bg-[#3b82f6] border-[#3b82f6] text-[#60a5fa] hover:text-white"
                        }`}
                      >
                        📥 Download wave-front .OBJ Model
                      </button>
                    </div>

                    <div className="border-t border-[#1e2a40] pt-2 space-y-3">
                      <span className="text-[10px] uppercase font-bold text-[#3d5166] tracking-wider block">JSON Blueprint Tools</span>
                      <button
                        onClick={handleExportJSON}
                        disabled={confirmedCubes.length === 0}
                        className="w-full py-2 border border-[#1e2a40] bg-[#080c14] hover:bg-[#131f30] text-[#94a3b8] rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        {copied ? "✓ Copied to Clipboard!" : "📋 Copy Blueprint to Clipboard"}
                      </button>

                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#3d5166] tracking-wider block">Paste Voxel JSON</span>
                        <textarea
                          value={jsonInput}
                          onChange={(e) => setJsonInput(e.target.value)}
                          placeholder='Paste valid block coordinates: [{"x":0,"y":0.5,"z":0,"material":{"name":"Steel"}}]'
                          className="w-full h-16 p-2 bg-[#080c14] border border-[#1e2a40] rounded-lg text-[10px] font-mono text-[#cbd5e1] focus:outline-none focus:border-[#3b82f6]"
                        />
                        {importError && <p className="text-[10px] text-red-400">{importError}</p>}
                        <button
                          onClick={handleImportJSON}
                          disabled={!jsonInput}
                          className="w-full py-2 bg-[#1a3a5c] hover:bg-[#1e4570] text-[#60a5fa] rounded-lg text-xs font-semibold disabled:bg-[#080c14] disabled:text-[#3d5166] transition-all cursor-pointer"
                        >
                          📥 Import Voxel Blueprint
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: ACCOUNT */}
          {activeTab === "account" && (
            <div className="space-y-4">
              
              {!state.user ? (
                <div className="p-4 bg-[#111927] border border-[#1e2a40] rounded-xl space-y-3">
                  <div className="text-center pb-1">
                    <div className="w-10 h-10 bg-slate-850 border border-slate-800 rounded-full flex items-center justify-center mx-auto text-lg mb-1 shadow-inner">
                      👤
                    </div>
                    <h3 className="font-bold text-sm text-slate-200">Cloud Sync Console</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                      Authenticate to access the spatial blueprints database.
                    </p>
                  </div>

                  {/* Tab Switcher */}
                  <div className="flex border-b border-slate-850/80 text-[11px] mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("login");
                        setAuthError("");
                      }}
                      className={`flex-1 pb-2 text-center font-bold transition-all cursor-pointer ${
                        authMode === "login"
                          ? "text-blue-400 border-b-2 border-blue-500"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("register");
                        setAuthError("");
                      }}
                      className={`flex-1 pb-2 text-center font-bold transition-all cursor-pointer ${
                        authMode === "register"
                          ? "text-blue-400 border-b-2 border-blue-500"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Register
                    </button>
                  </div>

                  {/* Form Fields */}
                  <form onSubmit={handleEmailAuthSubmit} className="space-y-2.5">
                    {authMode === "register" && (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-[#3d5166] tracking-wider block">Username</label>
                        <input
                          type="text"
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          placeholder="e.g. spatial_builder_9"
                          required
                          className="w-full px-3 py-1.5 bg-[#080c14] border border-[#1e2a40] rounded-lg text-xs text-[#cbd5e1] focus:outline-none focus:border-[#3b82f6]"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#3d5166] tracking-wider block">Email Address</label>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="e.g. name@domain.com"
                        required
                        className="w-full px-3 py-1.5 bg-[#080c14] border border-[#1e2a40] rounded-lg text-xs text-[#cbd5e1] focus:outline-none focus:border-[#3b82f6]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#3d5166] tracking-wider block">Password</label>
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full px-3 py-1.5 bg-[#080c14] border border-[#1e2a40] rounded-lg text-xs text-[#cbd5e1] focus:outline-none focus:border-[#3b82f6]"
                      />
                    </div>

                    {authError && (
                      <p className="text-[10px] text-red-400 bg-red-950/20 border border-red-900/30 p-2 rounded-lg leading-relaxed">
                        ⚠️ {authError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2 bg-[#1a3a5c] hover:bg-[#1e4570] disabled:bg-[#080c14] text-[#60a5fa] disabled:text-[#3d5166] rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      {authLoading ? (
                        <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : null}
                      {authMode === "login" ? "🔑 Log In" : "📝 Create Account"}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-3 flex py-1 items-center">
                    <div className="flex-grow border-t border-[#1e2a40]" />
                    <span className="flex-shrink mx-2 text-[9px] uppercase font-bold text-[#3d5166] tracking-wider">or</span>
                    <div className="flex-grow border-t border-[#1e2a40]" />
                  </div>

                  {/* Google Sign-in */}
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="w-full py-2 bg-[#080c14] hover:bg-[#111927] border border-[#1e2a40] hover:border-[#3b82f6] text-[#cbd5e1] rounded-lg text-xs font-semibold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Sign In with Google
                  </button>

                  {!firebaseEnabled && (
                    <p className="text-[9px] text-amber-400/90 text-center italic mt-1.5">
                      ℹ️ Running in Local Storage Sandbox mode.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-[#111927] border border-[#1e2a40] rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1e2a40]/40 pb-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={state.user.photoURL || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full border border-slate-700"
                      />
                      <div>
                        <h4 className="font-bold text-xs text-slate-200 truncate max-w-[120px]">{state.user.displayName}</h4>
                        <p className="text-[9px] text-slate-400 truncate max-w-[120px]">{state.user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-2.5 py-1 border border-[#1e2a40] hover:bg-[#111927] rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                  <p className="text-[10px] text-[#3d5166]">
                    ✓ Authenticated to Firebase blueprint engine. You can save and load your creations directly from the projects tab.
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

        {/* FIXED FOOTER CONTROLS */}
        <div className="p-4 border-t border-[#1e2a40] bg-[#0d1422] space-y-3 shadow-inner">
          <button
            onClick={() => dispatch({ type: "CONFIRM_DRAFT" })}
            disabled={draftCount === 0}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg cursor-pointer ${
              draftCount === 0
                ? "bg-[#080c14]/40 text-[#3d5166] cursor-not-allowed border border-[#1e2a40]"
                : "bg-[#1a3a5c] hover:bg-[#1e4570] border border-[#3b82f6] text-[#60a5fa] active:scale-98"
            }`}
          >
            Confirm Structure ({draftCount})
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => dispatch({ type: "UNDO" })}
              disabled={state.history.length === 0}
              className={`py-2 px-3 border rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                state.history.length === 0
                  ? "border-[#1e2a40]/30 text-[#3d5166] cursor-not-allowed"
                  : "border-[#1e2a40] text-[#94a3b8] hover:bg-[#111927] active:scale-95"
              }`}
            >
              ↩️ Undo (Ctrl+Z)
            </button>
            
            <button
              onClick={() => dispatch({ type: "CLEAR_SCENE" })}
              className="py-2 px-3 border border-[#7f1d1d]/60 hover:bg-red-950/20 text-red-400 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              🗑️ Clear Scene
            </button>
          </div>
        </div>
      </div>

      {/* Collapse/Expand Toggle Button */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute top-1/2 z-30 transform -translate-y-1/2 w-8 h-20 bg-[#0d1422] border-y border-r border-[#1e2a40] rounded-r-xl flex items-center justify-center text-[#60a5fa] hover:text-white cursor-pointer hover:bg-[#131f30] transition-all duration-300 ease-in-out shadow-md ${
          isCollapsed ? "left-0" : "left-96"
        }`}
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <span className="text-sm font-bold select-none">{isCollapsed ? "❯" : "❮"}</span>
      </button>

      {/* FLOATING VIEWPORT SETTINGS TOOLBAR (Top Center) */}
      {!isCollapsed && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto bg-[#0d1422]/90 backdrop-blur-md border border-[#1e2a40] rounded-full px-4 py-2 flex items-center gap-3 text-xs shadow-xl animate-fadeIn">
          <button
            onClick={() => dispatch({ type: "TOGGLE_STRESS_HEATMAP" })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
              viewSettings.stressHeatmap
                ? "bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/40"
                : "text-[#3d5166] hover:text-[#cbd5e1] border border-transparent"
            }`}
            title="Toggle Stress Heatmap View"
          >
            🔥 Stress Heatmap
          </button>
          <div className="w-px h-4 bg-[#1e2a40]" />
          <button
            onClick={() => dispatch({ type: "TOGGLE_GRID" })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
              viewSettings.showGrid !== false
                ? "bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/40"
                : "text-[#3d5166] hover:text-[#cbd5e1] border border-transparent"
            }`}
            title="Toggle Grid Lines Helper"
          >
            🌐 Grid Helper
          </button>
          <div className="w-px h-4 bg-[#1e2a40]" />
          <button
            onClick={() => dispatch({ type: "TOGGLE_AUTO_ROTATE" })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
              viewSettings.autoRotate
                ? "bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/40"
                : "text-[#3d5166] hover:text-[#cbd5e1] border border-transparent"
            }`}
            title="Toggle Auto-Rotate Camera orbit"
          >
            🔄 Auto-Rotate
          </button>
        </div>
      )}
    </>
  );
}
