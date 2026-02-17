// ---- Engineering Material Presets ----
export const MATERIALS = {
  STEEL: {
    name: "Steel",
    color: "#94a3b8",
    density: 7850, // kg/m³
    strength: 250, // MPa
    weightFactor: 7.85,
    emissive: "#1e293b"
  },
  CONCRETE: {
    name: "Concrete",
    color: "#64748b",
    density: 2400, // kg/m³
    strength: 30, // MPa
    weightFactor: 2.4,
    emissive: "#334155"
  },
  WOOD: {
    name: "Wood",
    color: "#92400e",
    density: 600, // kg/m³
    strength: 40, // MPa
    weightFactor: 0.6,
    emissive: "#451a03"
  },
  ALUMINUM: {
    name: "Aluminum",
    color: "#e5e7eb",
    density: 2700, // kg/m³
    strength: 90, // MPa
    weightFactor: 2.7,
    emissive: "#374151"
  }
};

// ---- Color Palette for Custom Colors ----
export const COLOR_PALETTE = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#ffffff", // White
  "#f8fafc", // Slate 50
  "#f1f5f9", // Slate 100
  "#e2e8f0", // Slate 200
  "#cbd5e1", // Slate 300
  "#94a3b8", // Slate 400
  "#64748b", // Slate 500
  "#475569", // Slate 600
  "#334155", // Slate 700
  "#1e293b", // Slate 800
  "#0f172a", // Slate 900
  "#020617", // Slate 950
];

// ---- Default Material ----
export const DEFAULT_MATERIAL = MATERIALS.STEEL;

// ---- Material Helper Functions ----
export function getMaterialByName(name) {
  return MATERIALS[name.toUpperCase()] || DEFAULT_MATERIAL;
}

export function getMaterialColor(material) {
  return material?.color || DEFAULT_MATERIAL.color;
}

export function getMaterialEmissive(material) {
  return material?.emissive || DEFAULT_MATERIAL.emissive;
}

// ---- Custom Color Material Creator ----
export function createCustomMaterial(color) {
  return {
    name: "Custom",
    color,
    density: 1000, // Default density
    strength: 50,  // Default strength
    weightFactor: 1.0,
    emissive: adjustColorBrightness(color, -30)
  };
}

// ---- Helper function to adjust color brightness ----
function adjustColorBrightness(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}
