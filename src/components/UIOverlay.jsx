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
      { id: "bathtub", name: "Bathtub", emoji: "🛁" },
      { id: "kitchen_cabinet", name: "Kitchen Cabinet", emoji: "🗄️" },
      { id: "fridge", name: "Refrigerator", emoji: "🧊" },
      { id: "tv", name: "Television", emoji: "📺" },
      { id: "painting", name: "Wall Painting", emoji: "🖼️" },
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
  const [isCollapsed, setIsCollapsed] = useState(true);
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
  let statusColor = "bg-[#1c1e24] text-slate-400 border-[#2a2d34]";
  
  if (totalCount > 0) {
    if (collapseState.warningActive || (structuralMetrics?.unstableIds || []).length > 0) {
      statusText = "COLLAPSE IMMINENT";
      statusColor = "bg-[#3b1111] text-[#f87171] border-[#6b1e1e]";
    } else if (structuralMetrics.safetyFactor < 1.0) {
      statusText = "STRUCTURE OVERLOADED";
      statusColor = "bg-[#332211] text-[#fbbf24] border-[#5c3e17]";
    } else {
      statusText = "STRUCTURALLY SOUND";
      statusColor = "bg-[#132c1f] text-[#4ade80] border-[#1f5135]";
    }
  }

  // OBJ Exporter
  const handleExportOBJ = () => {
    if (confirmedCubes.length === 0) {
      alert("Please place and confirm blocks before exporting!");
      return;
    }

    let objContent = "# VoxelForge 3D Export\n";
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
      <div className={`absolute top-0 left-0 h-full w-96 z-20 pointer-events-auto flex flex-col bg-[#121316] border-r border-[#2a2d34] text-slate-300 shadow-2xl transition-transform duration-300 ease-in-out font-sans ${
        (isCollapsed || viewSettings?.walkthroughActive) ? "-translate-x-full" : "translate-x-0"
      }`}>
        {/* Platform Header */}
        <div className="p-4 border-b border-[#2a2d34] flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-wide text-slate-100">
              Spatial Console
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mt-0.5">
              3D CAD Engine
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(true)}
              className="w-6 h-6 bg-[#1a1c20] hover:bg-[#22252a] border border-[#2a2d34] text-slate-400 hover:text-white rounded flex items-center justify-center text-xs font-semibold transition-all cursor-pointer"
              title="Controls Guide"
            >
              ?
            </button>
            <div className={`px-2 py-0.5 text-[9px] font-semibold tracking-wider rounded border ${statusColor}`}>
              {statusText}
            </div>
          </div>
        </div>

        {/* Tab Segment Controls */}
        <div className="p-1 bg-[#121316] border-b border-[#2a2d34] flex gap-1 text-[10px]">
          {[
            { id: "construct", label: "Construct" },
            { id: "telemetry", label: "Telemetry" },
            { id: "projects", label: "Projects" },
            { id: "account", label: "Account" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 text-center rounded font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#1a1c20] text-slate-100 border border-[#2a2d34]"
                  : "text-slate-500 hover:text-slate-300 border border-transparent"
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
            <div className="absolute inset-0 bg-[#121316]/98 z-50 p-5 flex flex-col justify-between animate-fadeIn text-[11px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#2a2d34] pb-2">
                  <h3 className="font-semibold uppercase tracking-wider text-slate-300">
                    Controls Guide
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowHelp(false)}
                    className="text-slate-500 hover:text-slate-300 font-bold"
                  >
                    ✕ Close
                  </button>
                </div>
                
                <div className="space-y-3 text-slate-400 leading-relaxed">
                  <div className="p-3 bg-[#1a1c20] border border-[#2a2d34] rounded">
                    <span className="font-semibold text-slate-200 block mb-1">Mouse Controls:</span>
                    <div className="space-y-1 font-mono text-[10px]">
                      <div>Left Click Ground: Place block</div>
                      <div>Left Click Face: Snap adjacent</div>
                      <div>Right Click: Delete block</div>
                      <div>Right Click + Drag: Orbit view</div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#1a1c20] border border-[#2a2d34] rounded">
                    <span className="font-semibold text-slate-200 block mb-1">Keyboard Shortcuts:</span>
                    <div className="space-y-1 font-mono text-[10px]">
                      <div>W A S D: Move camera</div>
                      <div>R Key: Cycle rotation 90°</div>
                      <div>Ctrl + Z: Undo action</div>
                      <div>Esc: Free-hand mode (hide ghost)</div>
                      <div>Arrow Up / Down: Adjust line height</div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#1a1c20] border border-[#2a2d34] rounded">
                    <span className="font-semibold text-slate-200 block mb-1">Gesture Commands:</span>
                    <div className="space-y-1 font-mono text-[10px]">
                      <div>Point finger: Move cursor</div>
                      <div>Pinch fingers: Place block</div>
                      <div>Make Fist: Delete block</div>
                      <div>Open Palm: Confirm drafts</div>
                      <div>V-Sign: Orbit camera</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-2 bg-[#121316] hover:bg-[#1a1c20] border border-[#2a2d34] text-[#38bdf8] font-bold rounded transition-all cursor-pointer animate-none"
              >
                Close Guide
              </button>
            </div>
          )}

          {/* Collapse warning */}
          {collapseState.warningActive && (
            <div className="p-4 bg-red-950/60 border border-red-500/50 rounded space-y-2 text-slate-100 animate-pulse">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center">
                Collapse Alert
              </h3>
              <p className="text-xs text-red-200">
                {collapseState.unstableIds.length} unstable voxel(s) will fall in{" "}
                <span className="font-bold text-red-400 text-sm">{collapseState.countdown}s</span>
              </p>
              <div className="w-full bg-red-900/40 rounded h-1.5 overflow-hidden">
                <div
                  className="bg-red-500 h-full transition-all duration-1000"
                  style={{ width: `${(collapseState.countdown / 3) * 100}%` }}
                />
              </div>
              <button
                onClick={() => dispatch({ type: "CANCEL_COLLAPSE" })}
                className="w-full mt-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-all shadow-md"
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
                  className="flex items-center justify-between py-1 px-1 cursor-pointer select-none text-[10px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
                >
                  <span>Materials & Colors</span>
                  <span className="text-[8px]">{materialsExpanded ? "▼" : "▶"}</span>
                </div>

                {materialsExpanded && (
                  <div className="space-y-4 pl-1 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(MATERIALS).map(([key, material]) => (
                        <button
                          key={key}
                          onClick={() => dispatch({ type: "SET_MATERIAL", payload: material })}
                          className={`p-2.5 rounded border text-left transition-all flex flex-col justify-between h-20 relative overflow-hidden cursor-pointer ${
                            currentMaterial.name === material.name
                              ? "border-[#38bdf8] bg-[#1a1c20]"
                              : "border-[#2a2d34] bg-[#1a1c20]/60 hover:bg-[#1a1c20] hover:border-slate-600"
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full absolute top-2.5 right-2.5" style={{ backgroundColor: material.color }} />
                          <span className="font-semibold text-[11px] text-slate-200">{material.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{formatCost(material.costPerCube)}</span>
                        </button>
                      ))}

                      {/* Custom Material Color Selection */}
                      <button
                        onClick={() => setShowColorPalette(!showColorPalette)}
                        className={`p-2.5 rounded border text-left transition-all flex flex-col justify-between h-20 col-span-2 relative overflow-hidden cursor-pointer ${
                          currentMaterial.name === "Custom"
                            ? "border-[#38bdf8] bg-[#1a1c20]"
                            : "border-[#2a2d34] bg-[#1a1c20]/60 hover:bg-[#1a1c20] hover:border-slate-600"
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full absolute top-2.5 right-2.5" style={{ backgroundColor: currentMaterial.name === "Custom" ? currentMaterial.color : "#a855f7" }} />
                        <span className="font-semibold text-[11px] text-slate-200">Custom Color Voxel</span>
                        <span className="text-[9px] text-slate-500">Configure structural properties with custom hues</span>
                      </button>
                    </div>

                    {/* Custom Color Selector Modal */}
                    {showColorPalette && (
                      <div className="p-2.5 bg-[#1a1c20] border border-[#2a2d34] rounded space-y-2">
                        <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider">Select Hex Color</span>
                        <div className="grid grid-cols-7 gap-1">
                          {COLOR_PALETTE.map((color) => (
                            <button
                              key={color}
                              onClick={() => {
                                dispatch({ type: "SET_MATERIAL", payload: createCustomMaterial(color) });
                                setShowColorPalette(false);
                              }}
                              className={`w-8 h-8 rounded border transition-all hover:scale-105 cursor-pointer ${
                                currentMaterial.color === color ? "border-slate-100 scale-102" : "border-[#2a2d34]"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Material Specifications */}
                    <div className="p-4 bg-[#1a1c20] border border-[#2a2d34] rounded space-y-2 text-xs">
                      <h4 className="font-semibold text-slate-300"> Block Specifications ({currentMaterial.name})</h4>
                      <div className="grid grid-cols-2 gap-y-2 pt-1 border-t border-[#2a2d34]/40">
                        <span className="text-slate-500">Density:</span>
                        <span className="font-mono font-semibold text-right">{currentMaterial.density.toLocaleString()} kg/m³</span>
                        <span className="text-slate-500">Base Cost:</span>
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
                  className="flex items-center justify-between py-1 px-1 cursor-pointer select-none text-[10px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
                >
                  <span>Architectural Geometries</span>
                  <span className="text-[8px]">{shapesExpanded ? "▼" : "▶"}</span>
                </div>

                {shapesExpanded && (
                  <div className="space-y-4 pl-1 animate-fadeIn">
                    {/* Active Rotation Indicator */}
                    <div className="p-2.5 bg-[#1a1c20] border border-[#2a2d34] rounded flex items-center justify-between text-[10px]">
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider">Object Rotation</span>
                        <p className="font-medium text-slate-300 mt-0.5">
                          {state.rotationY === 0 ? "Facing North (0°)" :
                           state.rotationY === 1 ? "Facing East (90°)" :
                           state.rotationY === 2 ? "Facing South (180°)" : "Facing West (270°)"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "ROTATE_Y" })}
                        className="py-1 px-2.5 bg-[#121316] hover:bg-[#1a1c20] border border-[#2a2d34] text-[#38bdf8] rounded font-medium cursor-pointer transition-all"
                      >
                        Rotate (R)
                      </button>
                    </div>

                    {/* Category Filter Segments */}
                    <div className="grid grid-cols-5 gap-1 bg-[#121316] p-0.5 rounded border border-[#2a2d34]">
                      {[
                        { id: "shapes", label: "Shapes" },
                        { id: "openings", label: "Openings" },
                        { id: "furniture", label: "Decor" },
                        { id: "landscaping", label: "Garden" },
                        { id: "utilities", label: "Utility" },
                      ].map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveCategory(cat.id)}
                            className={`py-1 rounded text-[9px] font-medium transition-all cursor-pointer ${
                              isActive
                                ? "bg-[#1a1c20] text-[#38bdf8] font-semibold border border-[#2a2d34]"
                                : "text-slate-500 hover:text-slate-300 border border-transparent"
                            }`}
                          >
                            {cat.label}
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
                          <h4 className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider border-b border-[#2a2d34] pb-1">
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
                                  className={`p-2 rounded border text-left transition-all flex items-center gap-2 cursor-pointer ${
                                    isSelected
                                      ? "border-[#38bdf8] bg-[#1a1c20]"
                                      : "border-[#2a2d34] bg-[#1a1c20]/60 hover:bg-[#1a1c20] hover:border-slate-600"
                                  }`}
                                >
                                  <div className="w-6 h-6 flex items-center justify-center bg-[#121316] border border-[#2a2d34] rounded text-xs flex-shrink-0">
                                    {item.emoji}
                                  </div>
                                  <span className="font-semibold text-[10px] text-slate-300 truncate">{item.name}</span>
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
                <div className="p-3 bg-[#1a1c20] border border-[#2a2d34] rounded">
                  <span className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider">Draft Voxels</span>
                  <p className="text-lg font-semibold text-slate-200 font-mono mt-0.5">{draftCount}</p>
                </div>
                <div className="p-3 bg-[#1a1c20] border border-[#2a2d34] rounded">
                  <span className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider">Confirmed</span>
                  <p className="text-lg font-semibold text-slate-200 font-mono mt-0.5">{confirmedCount}</p>
                </div>
              </div>

              {/* Tool Mode Selection */}
              <div className="p-3 bg-[#1a1c20] border border-[#2a2d34] rounded space-y-2">
                <span className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider block">Placement Mode</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => dispatch({ type: "SET_TOOL_MODE", payload: { toolMode: "single" } })}
                    className={`py-1.5 px-2 text-xs font-semibold rounded border transition-all cursor-pointer ${
                      (viewSettings?.toolMode || "single") === "single"
                        ? "bg-[#121316] text-[#38bdf8] border-[#38bdf8]"
                        : "bg-[#1a1c20] text-slate-500 border-[#2a2d34] hover:text-slate-300"
                    }`}
                  >
                    Single Voxel
                  </button>
                  <button
                    onClick={() => dispatch({ type: "SET_TOOL_MODE", payload: { toolMode: "line" } })}
                    className={`py-1.5 px-2 text-xs font-semibold rounded border transition-all cursor-pointer ${
                      viewSettings?.toolMode === "line"
                        ? "bg-[#121316] text-[#38bdf8] border-[#38bdf8]"
                        : "bg-[#1a1c20] text-slate-500 border-[#2a2d34] hover:text-slate-300"
                    }`}
                  >
                    Line / Beam
                  </button>
                </div>
                {viewSettings?.toolMode === "line" && (
                  <p className="text-[9px] text-slate-500 italic">
                    * Click start pos, hover to preview line, click to place. Esc to cancel.
                  </p>
                )}
              </div>

              {/* Engineering Telemetry Metrics */}
              <div className="space-y-2.5 p-3 bg-[#1a1c20] border border-[#2a2d34] rounded">
                <h3 className="text-[9px] uppercase font-semibold tracking-wider text-slate-400">Engineering Telemetry</h3>
                
                {/* Safety Factor */}
                <div className="flex justify-between items-center py-1.5 border-b border-[#2a2d34]">
                  <span className="text-xs text-slate-500">Safety Factor</span>
                  <span className={`text-xs font-semibold font-mono ${
                    structuralMetrics.safetyFactor === Infinity ? "text-slate-500" :
                    structuralMetrics.safetyFactor >= 1.5 ? "text-emerald-400" :
                    structuralMetrics.safetyFactor >= 1.0 ? "text-amber-400" : "text-red-400 font-bold"
                  }`}>
                    {structuralMetrics.safetyFactor === Infinity ? "No stress" :
                     `${structuralMetrics.safetyFactor.toFixed(2)}x`}
                  </span>
                </div>

                {/* Total Mass */}
                <div className="flex justify-between items-center py-1.5 border-b border-[#2a2d34]">
                  <span className="text-xs text-slate-500">Total Weight</span>
                  <span className="text-xs font-semibold text-slate-300 font-mono">
                    {formatMass(structuralMetrics.totalMass)}
                  </span>
                </div>

                {/* Budget Limit Meter */}
                <div className="space-y-1.5 py-1.5 border-b border-[#2a2d34]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Voxel Cost</span>
                    <span className="text-xs font-semibold text-slate-300 font-mono">
                      {formatCost(structuralMetrics.totalCost)} / $10k
                    </span>
                  </div>
                  <div className="w-full bg-[#121316] rounded-full h-1">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        structuralMetrics.totalCost > 10000 ? "bg-red-500" :
                        structuralMetrics.totalCost > 7500 ? "bg-amber-500" : "bg-[#38bdf8]"
                      }`}
                      style={{ width: `${Math.min(100, (structuralMetrics.totalCost / 10000) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Height */}
                <div className="flex justify-between items-center py-1.5 border-b border-[#2a2d34]">
                  <span className="text-xs text-slate-500">Max Height</span>
                  <span className="text-xs font-semibold text-slate-300 font-mono">
                    {structuralMetrics.maxHeight.toFixed(1)} m ({Math.max(0, Math.ceil(structuralMetrics.maxHeight - 0.5))} blocks)
                  </span>
                </div>

                {/* Center of Mass */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-slate-500">Center of Mass</span>
                  <span className="text-xs font-semibold text-slate-300 font-mono">
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
                  className="flex items-center justify-between py-1 px-1 cursor-pointer select-none text-[10px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
                >
                  <span>Pre-built Blueprints</span>
                  <span className="text-[8px]">{templatesExpanded ? "▼" : "▶"}</span>
                </div>

                {templatesExpanded && (
                  <div className="space-y-2 pl-1 animate-fadeIn">
                    <p className="text-[11px] text-slate-500 leading-normal mb-2">
                      Load template structures directly into the viewport.
                    </p>
                    {Object.entries(TEMPLATES).map(([key, template]) => (
                      <div
                        key={key}
                        className="p-3 bg-[#1a1c20] border border-[#2a2d34] rounded flex flex-col justify-between gap-2 transition-all hover:border-slate-500"
                      >
                        <div>
                          <h4 className="font-semibold text-[11px] text-slate-200">{template.name}</h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{template.description}</p>
                        </div>
                        <button
                          onClick={() => dispatch({ type: "LOAD_TEMPLATE", payload: { cubes: template.cubes } })}
                          className="self-end px-2.5 py-1 bg-[#121316] hover:bg-[#1a1c20] border border-[#2a2d34] text-[#38bdf8] rounded text-[10px] font-semibold transition-all cursor-pointer"
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
                  className="flex items-center justify-between py-1 px-1 cursor-pointer select-none text-[10px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
                >
                  <span>Cloud & Local Designs</span>
                  <span className="text-[8px]">{savedDesignsExpanded ? "▼" : "▶"}</span>
                </div>

                {savedDesignsExpanded && (
                  <div className="space-y-3 pl-1 animate-fadeIn">
                    {/* Save Current Design Section */}
                    {state.user ? (
                      confirmedCount > 0 ? (
                        <form onSubmit={handleSave} className="space-y-2 p-3 bg-[#1a1c20] border border-[#2a2d34] rounded">
                          <span className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider">Save Current Design</span>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={designName}
                              onChange={(e) => setDesignName(e.target.value)}
                              placeholder="e.g. My suspension bridge"
                              required
                              maxLength={40}
                              className="flex-1 px-3 py-1.5 bg-[#121316] border border-[#2a2d34] rounded text-xs text-[#cbd5e1] focus:outline-none focus:border-[#38bdf8]"
                            />
                            <button
                              type="submit"
                              disabled={isSaving}
                              className="px-4 bg-[#121316] hover:bg-[#1a1c20] border border-[#2a2d34] disabled:bg-[#1a1c20] text-[#38bdf8] disabled:text-slate-600 text-xs font-semibold rounded transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              {isSaving ? "..." : "Save"}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="p-3 bg-[#1a1c20] border border-[#2a2d34] rounded text-[10px] text-slate-500 text-center">
                          * Place and confirm blocks to enable saving!
                        </div>
                      )
                    ) : (
                      <div className="p-3 bg-[#1a1c20] border border-[#2a2d34] rounded text-[10px] text-slate-500 text-center">
                        * Please log in under the Account tab to save designs!
                      </div>
                    )}

                    {/* List of Saved Projects */}
                    {state.user && (
                      <div className="space-y-2">
                        {isLoadingList ? (
                          <p className="text-xs text-[#3d5166] text-center py-5">Loading project database...</p>
                        ) : savedDesigns.length === 0 ? (
                          <p className="text-xs text-[#3d5166] text-center py-5 italic bg-[#121316] border border-[#2a2d34] rounded">
                            No designs saved in this account yet.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {savedDesigns.map((design) => (
                              <div
                                key={design.id}
                                onClick={() => handleLoadDesign(design)}
                                className="p-3 bg-[#1a1c20] border border-[#2a2d34] hover:border-[#38bdf8]/50 rounded flex items-center justify-between gap-3 cursor-pointer transition-all"
                              >
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-xs text-slate-200 truncate">{design.name}</h4>
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
                                    className="p-1 hover:bg-[#121316] border border-[#2a2d34] rounded text-slate-400 hover:text-[#38bdf8] transition-all text-xs"
                                  >
                                    Share
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteDesign(design.id, e)}
                                    title="Delete Project"
                                    className="p-1 hover:bg-[#121316] border border-[#2a2d34] rounded text-slate-400 hover:text-red-400 transition-all text-xs"
                                  >
                                    Delete
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
                      <div className="p-3 bg-[#1a1c20] border border-[#2a2d34] rounded animate-fadeIn space-y-2 relative">
                        <button
                          type="button"
                          onClick={() => setShareUrl("")}
                          className="absolute top-2.5 right-2.5 text-slate-500 hover:text-slate-300 cursor-pointer text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded hover:bg-[#121316] transition-all"
                          title="Close"
                        >
                          ✕
                        </button>
                        <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">Project Share Link</span>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Anyone with this link can view your 3D structure:
                        </p>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            readOnly
                            value={shareUrl}
                            className="flex-1 px-2 py-1 bg-[#121316] border border-[#2a2d34] rounded text-[10px] font-mono text-slate-400 focus:outline-none animate-none"
                          />
                          <button
                            onClick={handleCopyShareLink}
                            className="px-2.5 bg-[#121316] hover:bg-[#1a1c20] border border-[#2a2d34] text-[#38bdf8] text-[10px] font-semibold rounded transition-all cursor-pointer"
                          >
                            Copy
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
                  className="flex items-center justify-between py-1 px-1 cursor-pointer select-none text-[10px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
                >
                  <span>Import & Export Pipelines</span>
                  <span className="text-[8px]">{importExportExpanded ? "▼" : "▶"}</span>
                </div>

                {importExportExpanded && (
                  <div className="space-y-4 pl-1 animate-fadeIn">
                    
                    {/* Model Exporter */}
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider block">CAD Mesh Exporter</span>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Export scene to generic Wavefront `.obj` file for Blender or CAD.
                      </p>
                      <button
                        onClick={handleExportOBJ}
                        disabled={confirmedCubes.length === 0}
                        className={`w-full py-2 rounded font-semibold text-[11px] tracking-wide transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                          confirmedCubes.length === 0
                            ? "bg-[#1a1c20] text-slate-600 border-[#2a2d34] cursor-not-allowed"
                            : "bg-[#121316] hover:bg-[#1a1c20] border-[#2a2d34] text-[#38bdf8] hover:text-white"
                        }`}
                      >
                        Download wavefront .OBJ
                      </button>
                    </div>

                    <div className="border-t border-[#2a2d34] pt-2 space-y-3">
                      <span className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider block">JSON Blueprint Tools</span>
                      <button
                        onClick={handleExportJSON}
                        disabled={confirmedCubes.length === 0}
                        className="w-full py-1.5 border border-[#2a2d34] bg-[#121316] hover:bg-[#1a1c20] text-slate-300 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        {copied ? "Copied!" : "Copy Blueprint to Clipboard"}
                      </button>

                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider block">Paste Voxel JSON</span>
                        <textarea
                          value={jsonInput}
                          onChange={(e) => setJsonInput(e.target.value)}
                          placeholder='[{"x":0,"y":0.5,"z":0,"material":{"name":"Steel"}}]'
                          className="w-full h-16 p-2 bg-[#121316] border border-[#2a2d34] rounded text-[10px] font-mono text-[#cbd5e1] focus:outline-none focus:border-[#38bdf8]"
                        />
                        {importError && <p className="text-[10px] text-red-400">{importError}</p>}
                        <button
                          onClick={handleImportJSON}
                          disabled={!jsonInput}
                          className="w-full py-2 bg-[#121316] hover:bg-[#1a1c20] border border-[#2a2d34] text-[#38bdf8] rounded text-xs font-semibold disabled:bg-[#1a1c20] disabled:text-slate-600 disabled:border-[#2a2d34] transition-all cursor-pointer"
                        >
                          Import Blueprint
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
                <div className="p-4 bg-[#1a1c20] border border-[#2a2d34] rounded space-y-3">
                  <div className="text-center pb-1">
                    <h3 className="font-semibold text-xs text-slate-200">Cloud Sync</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Sync spatial blueprints to cloud storage.
                    </p>
                  </div>

                  {/* Tab Switcher */}
                  <div className="flex border-b border-[#2a2d34] text-[10px] mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("login");
                        setAuthError("");
                      }}
                      className={`flex-1 pb-1.5 text-center font-medium transition-all cursor-pointer ${
                        authMode === "login"
                          ? "text-[#38bdf8] border-b border-[#38bdf8]"
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
                      className={`flex-1 pb-1.5 text-center font-medium transition-all cursor-pointer ${
                        authMode === "register"
                          ? "text-[#38bdf8] border-b border-[#38bdf8]"
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
                        <label className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider block">Username</label>
                        <input
                          type="text"
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          placeholder="spatial_builder"
                          required
                          className="w-full px-2.5 py-1.5 bg-[#121316] border border-[#2a2d34] rounded text-xs text-[#cbd5e1] focus:outline-none focus:border-[#38bdf8]"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider block">Email Address</label>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="name@domain.com"
                        required
                        className="w-full px-2.5 py-1.5 bg-[#121316] border border-[#2a2d34] rounded text-xs text-[#cbd5e1] focus:outline-none focus:border-[#38bdf8]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider block">Password</label>
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full px-2.5 py-1.5 bg-[#121316] border border-[#2a2d34] rounded text-xs text-[#cbd5e1] focus:outline-none focus:border-[#38bdf8]"
                      />
                    </div>

                    {authError && (
                      <p className="text-[10px] text-red-400 bg-red-950/20 border border-red-900/30 p-2 rounded leading-relaxed">
                        {authError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2 bg-[#121316] hover:bg-[#1a1c20] border border-[#2a2d34] disabled:bg-[#1a1c20] text-[#38bdf8] disabled:text-slate-600 rounded text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {authLoading ? "Authenticating..." : (authMode === "login" ? "Log In" : "Create Account")}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-3 flex py-1 items-center">
                    <div className="flex-grow border-t border-[#2a2d34]" />
                    <span className="flex-shrink mx-2 text-[9px] uppercase font-semibold text-slate-500 tracking-wider">or</span>
                    <div className="flex-grow border-t border-[#2a2d34]" />
                  </div>

                  {/* Google Sign-in */}
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="w-full py-2 bg-[#121316] hover:bg-[#1a1c20] border border-[#2a2d34] text-slate-300 rounded text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    Sign In with Google
                  </button>

                  {!firebaseEnabled && (
                    <p className="text-[9px] text-amber-500/90 text-center italic mt-1.5">
                      ℹ️ Running in Local Storage Sandbox mode.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-[#1a1c20] border border-[#2a2d34] rounded space-y-3">
                  <div className="flex items-center justify-between border-b border-[#2a2d34]/40 pb-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={state.user.photoURL || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
                        alt="Avatar"
                        className="w-8 h-8 rounded border border-slate-700"
                      />
                      <div>
                        <h4 className="font-semibold text-xs text-slate-200 truncate max-w-[120px]">{state.user.displayName}</h4>
                        <p className="text-[9px] text-slate-500 truncate max-w-[120px]">{state.user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-2 py-1 border border-[#2a2d34] hover:bg-[#121316] rounded text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    ✓ Authenticated to cloud server. You can save, load, and share your designs from the Projects tab.
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

        {/* FIXED FOOTER CONTROLS */}
        <div className="p-4 border-t border-[#2a2d34] bg-[#121316] space-y-3">
          <button
            onClick={() => dispatch({ type: "CONFIRM_DRAFT" })}
            disabled={draftCount === 0}
            className={`w-full py-2.5 rounded font-semibold text-xs transition-all cursor-pointer ${
              draftCount === 0
                ? "bg-[#1a1c20] text-slate-600 border border-[#2a2d34] cursor-not-allowed"
                : "bg-[#121316] hover:bg-[#1a1c20] border border-[#38bdf8] text-[#38bdf8] hover:text-white"
            }`}
          >
            Confirm Structure ({draftCount})
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => dispatch({ type: "UNDO" })}
              disabled={state.history.length === 0}
              className={`py-1.5 px-3 border rounded font-semibold text-xs transition-all flex items-center justify-center cursor-pointer ${
                state.history.length === 0
                  ? "border-[#2a2d34] text-slate-600 cursor-not-allowed"
                  : "border-[#2a2d34] bg-[#121316] text-slate-300 hover:bg-[#1a1c20]"
              }`}
            >
              Undo
            </button>
            
            <button
              onClick={() => dispatch({ type: "CLEAR_SCENE" })}
              className="py-1.5 px-3 border border-red-950/60 bg-[#121316] hover:bg-red-950/20 text-red-400 rounded font-semibold text-xs transition-all flex items-center justify-center cursor-pointer"
            >
              Clear Scene
            </button>
          </div>
        </div>
      </div>

      {/* Collapse/Expand Toggle Button */}
      {!viewSettings?.walkthroughActive && (
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute top-1/2 z-30 transform -translate-y-1/2 w-6 h-16 bg-[#121316] border-y border-r border-[#2a2d34] rounded-r flex items-center justify-center text-[#38bdf8] hover:text-slate-200 cursor-pointer hover:bg-[#1a1c20] transition-all duration-300 ease-in-out shadow ${
            isCollapsed ? "left-0" : "left-96"
          }`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <span className="text-[10px] font-bold select-none">{isCollapsed ? "❯" : "❮"}</span>
        </button>
      )}

      {/* FLOATING VIEWPORT SETTINGS TOOLBAR (Top Center) */}
      {(!isCollapsed || viewSettings?.walkthroughActive) && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto bg-[#121316]/90 backdrop-blur border border-[#2a2d34] rounded px-3 py-1 flex items-center gap-2 text-[10px] shadow-lg animate-fadeIn">
          {!viewSettings?.walkthroughActive && (
            <>
              <button
                onClick={() => dispatch({ type: "TOGGLE_STRESS_HEATMAP" })}
                className={`flex items-center px-2.5 py-1 rounded transition-all cursor-pointer font-medium ${
                  viewSettings.stressHeatmap
                    ? "bg-[#1a1c20] text-[#38bdf8] border border-[#2a2d34]"
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
                title="Toggle Stress Heatmap View"
              >
                Stress Heatmap
              </button>
              <div className="w-px h-3 bg-[#2a2d34]" />
              <button
                onClick={() => dispatch({ type: "TOGGLE_GRID" })}
                className={`flex items-center px-2.5 py-1 rounded transition-all cursor-pointer font-medium ${
                  viewSettings.showGrid !== false
                    ? "bg-[#1a1c20] text-[#38bdf8] border border-[#2a2d34]"
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
                title="Toggle Grid Lines Helper"
              >
                Grid Helper
              </button>
              <div className="w-px h-3 bg-[#2a2d34]" />
              <button
                onClick={() => dispatch({ type: "TOGGLE_AUTO_ROTATE" })}
                className={`flex items-center px-2.5 py-1 rounded transition-all cursor-pointer font-medium ${
                  viewSettings.autoRotate
                    ? "bg-[#1a1c20] text-[#38bdf8] border border-[#2a2d34]"
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
                title="Toggle Auto-Rotate Camera orbit"
              >
                Auto-Rotate
              </button>
              <div className="w-px h-3 bg-[#2a2d34]" />
              <button
                onClick={() => dispatch({ type: "TOGGLE_LIGHTS" })}
                className={`flex items-center px-2.5 py-1 rounded transition-all cursor-pointer font-medium ${
                  viewSettings.lightsOn !== false
                    ? "bg-[#1a1c20] text-[#38bdf8] border border-[#2a2d34]"
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
                title="Toggle Scene Lighting"
              >
                Lights {viewSettings.lightsOn !== false ? "💡" : "🌑"}
              </button>
              <div className="w-px h-3 bg-[#2a2d34]" />
            </>
          )}
          <button
            onClick={() => dispatch({ type: "TOGGLE_WALKTHROUGH" })}
            className={`flex items-center px-2.5 py-1 rounded transition-all cursor-pointer font-medium ${
              viewSettings.walkthroughActive
                ? "bg-[#1a1c20] text-[#38bdf8] border border-[#2a2d34]"
                : "text-slate-500 hover:text-slate-300 border border-transparent"
            }`}
            title="Toggle First-Person Walkthrough mode"
          >
            Walkthrough Mode 🚶‍♂️
          </button>
        </div>
      )}

      {/* WALKTHROUGH HUD OVERLAYS */}
      {viewSettings?.walkthroughActive && (
        <>
          {/* Centered Crosshair */}
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            <div
              id="hud-crosshair"
              className="w-1.5 h-1.5 rounded-full bg-white/60 transition-all duration-150"
            />
          </div>

          {/* Bottom HUD Banner */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto bg-[#121316]/95 backdrop-blur-md border border-[#2a2d34] rounded-lg px-6 py-3 flex items-center gap-6 shadow-2xl text-xs font-sans text-slate-300 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 uppercase tracking-wider text-[9px] font-semibold">Controls:</span>
              <kbd className="bg-[#1a1c20] border border-[#2a2d34] px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-200">WASD</kbd>
              <span className="text-slate-400">Walk</span>
            </div>
            <div className="w-px h-4 bg-[#2a2d34]" />
            <div className="flex items-center gap-2">
              <kbd className="bg-[#1a1c20] border border-[#2a2d34] px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-200">Mouse</kbd>
              <span className="text-slate-400">Look</span>
            </div>
            <div className="w-px h-4 bg-[#2a2d34]" />
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[10px] italic">Click doors or windows to open/close</span>
            </div>
            <div className="w-px h-4 bg-[#2a2d34]" />
            <button
              onClick={() => dispatch({ type: "TOGGLE_WALKTHROUGH" })}
              className="px-3 py-1 bg-red-950/40 hover:bg-red-900/40 border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-white rounded font-semibold transition-all cursor-pointer"
            >
              Exit Walkthrough
            </button>
          </div>

          {/* Locked Pointer Lock Overlay screen */}
          <div
            id="lock-screen-overlay"
            style={{ display: "flex" }}
            className="absolute inset-0 bg-[#0d1324]/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center space-y-4"
          >
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-slate-100 tracking-wide">First-Person Walkthrough</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Click anywhere on the screen to capture your mouse pointer and look around.
              </p>
            </div>
            <button
              onClick={() => {
                const canvas = document.querySelector("canvas");
                if (canvas) canvas.click();
              }}
              className="px-5 py-2 bg-[#121316] hover:bg-[#1a1c20] border border-[#38bdf8] text-[#38bdf8] hover:text-white rounded text-xs font-bold transition-all shadow-lg cursor-pointer"
            >
              Start Exploring
            </button>
            <button
              onClick={() => dispatch({ type: "TOGGLE_WALKTHROUGH" })}
              className="text-xs text-slate-500 hover:text-slate-300 font-medium underline"
            >
              Go back to editor
            </button>
          </div>
        </>
      )}
    </>
  );
}
