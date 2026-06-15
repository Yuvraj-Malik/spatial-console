import { MATERIALS } from "./materials";

export const TEMPLATES = {
  column: {
    name: "Simple Concrete Column",
    description: "A tall vertical pillar of Concrete demonstrating basic vertical load path. Stable up to 37 blocks.",
    cubes: [
      { x: 0, y: 0.5, z: 0, material: MATERIALS.CONCRETE },
      { x: 0, y: 1.5, z: 0, material: MATERIALS.CONCRETE },
      { x: 0, y: 2.5, z: 0, material: MATERIALS.CONCRETE },
      { x: 0, y: 3.5, z: 0, material: MATERIALS.CONCRETE },
      { x: 0, y: 4.5, z: 0, material: MATERIALS.CONCRETE },
      { x: 0, y: 5.5, z: 0, material: MATERIALS.CONCRETE },
      { x: 0, y: 6.5, z: 0, material: MATERIALS.CONCRETE }
    ]
  },
  cantilever: {
    name: "Cantilever Beam",
    description: "A Concrete pillar supporting a Steel arm extending horizontally. Wood or concrete arms would snap, but Steel is strong enough.",
    cubes: [
      // Concrete Pillar
      { x: -3, y: 0.5, z: 0, material: MATERIALS.CONCRETE },
      { x: -3, y: 1.5, z: 0, material: MATERIALS.CONCRETE },
      { x: -3, y: 2.5, z: 0, material: MATERIALS.CONCRETE },
      { x: -3, y: 3.5, z: 0, material: MATERIALS.CONCRETE },
      { x: -3, y: 4.5, z: 0, material: MATERIALS.CONCRETE },
      // Horizontal Steel cantilever
      { x: -2, y: 4.5, z: 0, material: MATERIALS.STEEL },
      { x: -1, y: 4.5, z: 0, material: MATERIALS.STEEL },
      { x: 0, y: 4.5, z: 0, material: MATERIALS.STEEL },
      { x: 1, y: 4.5, z: 0, material: MATERIALS.STEEL },
      { x: 2, y: 4.5, z: 0, material: MATERIALS.STEEL }
    ]
  },
  arch: {
    name: "Concrete Arch Bridge",
    description: "A compression-only arch bridge. Concrete performs exceptionally well here because gravity loads are directed downwards and inwards, avoiding shear failure.",
    cubes: [
      { x: -4, y: 0.5, z: 0, material: MATERIALS.CONCRETE },
      { x: 4, y: 0.5, z: 0, material: MATERIALS.CONCRETE },
      
      { x: -3, y: 1.5, z: 0, material: MATERIALS.CONCRETE },
      { x: 3, y: 1.5, z: 0, material: MATERIALS.CONCRETE },
      
      { x: -2, y: 2.5, z: 0, material: MATERIALS.CONCRETE },
      { x: 2, y: 2.5, z: 0, material: MATERIALS.CONCRETE },
      
      { x: -1, y: 3.5, z: 0, material: MATERIALS.CONCRETE },
      { x: 1, y: 3.5, z: 0, material: MATERIALS.CONCRETE },
      { x: 0, y: 3.5, z: 0, material: MATERIALS.CONCRETE }
    ]
  },
  tower: {
    name: "Aluminum Truss Tower",
    description: "A tall structure made of lightweight Aluminum to minimize self-weight while maximizing height. Excellent for wind/shear loads.",
    cubes: [
      // Base
      { x: -1, y: 0.5, z: -1, material: MATERIALS.ALUMINUM },
      { x: 1, y: 0.5, z: -1, material: MATERIALS.ALUMINUM },
      { x: -1, y: 0.5, z: 1, material: MATERIALS.ALUMINUM },
      { x: 1, y: 0.5, z: 1, material: MATERIALS.ALUMINUM },
      // Tier 1
      { x: -1, y: 1.5, z: -1, material: MATERIALS.ALUMINUM },
      { x: 1, y: 1.5, z: -1, material: MATERIALS.ALUMINUM },
      { x: -1, y: 1.5, z: 1, material: MATERIALS.ALUMINUM },
      { x: 1, y: 1.5, z: 1, material: MATERIALS.ALUMINUM },
      { x: 0, y: 1.5, z: 0, material: MATERIALS.ALUMINUM },
      // Tier 2
      { x: 0, y: 2.5, z: 0, material: MATERIALS.ALUMINUM },
      { x: 0, y: 3.5, z: 0, material: MATERIALS.ALUMINUM },
      { x: 0, y: 4.5, z: 0, material: MATERIALS.ALUMINUM },
      // Platform
      { x: -1, y: 5.5, z: 0, material: MATERIALS.ALUMINUM },
      { x: 1, y: 5.5, z: 0, material: MATERIALS.ALUMINUM },
      { x: 0, y: 5.5, z: -1, material: MATERIALS.ALUMINUM },
      { x: 0, y: 5.5, z: 1, material: MATERIALS.ALUMINUM },
      { x: 0, y: 5.5, z: 0, material: MATERIALS.ALUMINUM },
      // Tip
      { x: 0, y: 6.5, z: 0, material: MATERIALS.ALUMINUM },
      { x: 0, y: 7.5, z: 0, material: MATERIALS.ALUMINUM }
    ]
  },
  pavilion: {
    name: "Wood Pavilion",
    description: "A small shelter made of Wood. Shows how wood is a cost-effective material for small spans.",
    cubes: [
      // Pillars
      { x: -2, y: 0.5, z: -2, material: MATERIALS.WOOD },
      { x: -2, y: 1.5, z: -2, material: MATERIALS.WOOD },
      { x: 2, y: 0.5, z: -2, material: MATERIALS.WOOD },
      { x: 2, y: 1.5, z: -2, material: MATERIALS.WOOD },
      { x: -2, y: 0.5, z: 2, material: MATERIALS.WOOD },
      { x: -2, y: 1.5, z: 2, material: MATERIALS.WOOD },
      { x: 2, y: 0.5, z: 2, material: MATERIALS.WOOD },
      { x: 2, y: 1.5, z: 2, material: MATERIALS.WOOD },
      // Roof Ring
      { x: -2, y: 2.5, z: -2, material: MATERIALS.WOOD },
      { x: -1, y: 2.5, z: -2, material: MATERIALS.WOOD },
      { x: 0, y: 2.5, z: -2, material: MATERIALS.WOOD },
      { x: 1, y: 2.5, z: -2, material: MATERIALS.WOOD },
      { x: 2, y: 2.5, z: -2, material: MATERIALS.WOOD },
      
      { x: -2, y: 2.5, z: 2, material: MATERIALS.WOOD },
      { x: -1, y: 2.5, z: 2, material: MATERIALS.WOOD },
      { x: 0, y: 2.5, z: 2, material: MATERIALS.WOOD },
      { x: 1, y: 2.5, z: 2, material: MATERIALS.WOOD },
      { x: 2, y: 2.5, z: 2, material: MATERIALS.WOOD },

      { x: -2, y: 2.5, z: -1, material: MATERIALS.WOOD },
      { x: -2, y: 2.5, z: 0, material: MATERIALS.WOOD },
      { x: -2, y: 2.5, z: 1, material: MATERIALS.WOOD },
      
      { x: 2, y: 2.5, z: -1, material: MATERIALS.WOOD },
      { x: 2, y: 2.5, z: 0, material: MATERIALS.WOOD },
      { x: 2, y: 2.5, z: 1, material: MATERIALS.WOOD },
      
      // Roof Center
      { x: 0, y: 3.5, z: 0, material: MATERIALS.WOOD },
      { x: -1, y: 3.5, z: 0, material: MATERIALS.WOOD },
      { x: 1, y: 3.5, z: 0, material: MATERIALS.WOOD },
      { x: 0, y: 3.5, z: -1, material: MATERIALS.WOOD },
      { x: 0, y: 3.5, z: 1, material: MATERIALS.WOOD }
    ]
  }
};
