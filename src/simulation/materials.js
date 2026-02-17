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
