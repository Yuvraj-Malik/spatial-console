import { MATERIALS } from "./materials.js";

export const TEMPLATES = {
  // ─────────────────────────────────────────────────────────────────
  // BASIC ENGINEERING TESTS
  // ─────────────────────────────────────────────────────────────────
  column: {
    name: "Simple Concrete Column",
    description: "A tall vertical pillar of Concrete demonstrating basic vertical load path.",
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
    description: "A Concrete pillar supporting a Steel arm extending horizontally. Showcases bending moment limits.",
    cubes: [
      { x: -3, y: 0.5, z: 0, material: MATERIALS.CONCRETE },
      { x: -3, y: 1.5, z: 0, material: MATERIALS.CONCRETE },
      { x: -3, y: 2.5, z: 0, material: MATERIALS.CONCRETE },
      { x: -3, y: 3.5, z: 0, material: MATERIALS.CONCRETE },
      { x: -3, y: 4.5, z: 0, material: MATERIALS.CONCRETE },
      { x: -2, y: 4.5, z: 0, material: MATERIALS.STEEL },
      { x: -1, y: 4.5, z: 0, material: MATERIALS.STEEL },
      { x: 0,  y: 4.5, z: 0, material: MATERIALS.STEEL },
      { x: 1,  y: 4.5, z: 0, material: MATERIALS.STEEL },
      { x: 2,  y: 4.5, z: 0, material: MATERIALS.STEEL }
    ]
  },

  arch: {
    name: "Concrete Arch Bridge",
    description: "A compression-only arch bridge utilizing face and edge adjacency for load transfer.",
    cubes: [
      { x: -4, y: 0.5, z: 0, material: MATERIALS.CONCRETE },
      { x: 4,  y: 0.5, z: 0, material: MATERIALS.CONCRETE },
      { x: -3, y: 1.5, z: 0, material: MATERIALS.CONCRETE },
      { x: 3,  y: 1.5, z: 0, material: MATERIALS.CONCRETE },
      { x: -2, y: 2.5, z: 0, material: MATERIALS.CONCRETE },
      { x: 2,  y: 2.5, z: 0, material: MATERIALS.CONCRETE },
      { x: -1, y: 3.5, z: 0, material: MATERIALS.CONCRETE },
      { x: 1,  y: 3.5, z: 0, material: MATERIALS.CONCRETE },
      { x: 0,  y: 3.5, z: 0, material: MATERIALS.CONCRETE }
    ]
  },

  // ─────────────────────────────────────────────────────────────────
  // ARCHITECTURAL VILLA 
  // ─────────────────────────────────────────────────────────────────
  modern_house: {
    name: "Architectural Villa",
    description: "A luxury dual-volume modern villa built entirely from structural voxels. Uses high-strength STEEL for all horizontal floor slabs to prevent collapse under the physics engine.",
    cubes: [
      // ── GROUND FLOOR / PATIO (y: 0.5) ────────────────────────────
      ...(() => {
        const blocks = [];
        for (let x = -5; x <= 6; x++) {
          for (let z = -4; z <= 5; z++) {
            if (x >= 3 && x <= 5 && z >= -4 && z <= -2) {
              blocks.push({ x, y: 0.5, z, material: MATERIALS.WATER });
            } else {
              blocks.push({ x, y: 0.5, z, material: MATERIALS.MARBLE });
            }
          }
        }
        return blocks;
      })(),

      // ── GROUND FLOOR WALLS & PILLARS (y: 1.5 & 2.5) ──────────────
      ...(() => {
        const blocks = [];
        // Enclosed Living Area (x: -4 to 1, z: 0 to 4)
        for (let x = -4; x <= 1; x++) {
          for (let y = 1.5; y <= 2.5; y++) {
            blocks.push({ x, y, z: 4, material: MATERIALS.CONCRETE }); // Back wall
            blocks.push({ x, y, z: 0, material: MATERIALS.GLASS });    // Front glass
          }
        }
        for (let z = 1; z <= 3; z++) {
          for (let y = 1.5; y <= 2.5; y++) {
            blocks.push({ x: -4, y, z, material: MATERIALS.CONCRETE }); // Side wall
            blocks.push({ x: 1, y, z, material: MATERIALS.GLASS });     // Side glass
          }
        }
        // Support Pillars for the overhang
        blocks.push({ x: 5, y: 1.5, z: 0, material: MATERIALS.CONCRETE });
        blocks.push({ x: 5, y: 2.5, z: 0, material: MATERIALS.CONCRETE });
        blocks.push({ x: 5, y: 1.5, z: 4, material: MATERIALS.CONCRETE });
        blocks.push({ x: 5, y: 2.5, z: 4, material: MATERIALS.CONCRETE });
        return blocks;
      })(),

      // Voxel Staircase (Climbing from x:-2, z:3)
      { x: -2, y: 1.5, z: 3, material: MATERIALS.STEEL },
      { x: -1, y: 2.5, z: 3, material: MATERIALS.STEEL },

      // ── FIRST FLOOR SLAB (y: 3.5) - STRUCTURAL STEEL ─────────────
      ...(() => {
        const blocks = [];
        for (let x = -4; x <= 5; x++) {
          for (let z = -1; z <= 5; z++) {
            // Unblocked stairwell path
            if (!(x === -2 && z === 3) && !(x === -1 && z === 3)) {
              blocks.push({ x, y: 3.5, z, material: MATERIALS.STEEL });
            }
          }
        }
        return blocks;
      })(),

      // ── FIRST FLOOR WALLS (y: 4.5 & 5.5) - WOOD CANTILEVER ───────
      ...(() => {
        const blocks = [];
        for (let x = 0; x <= 5; x++) {
          for (let y = 4.5; y <= 5.5; y++) {
            blocks.push({ x, y, z: -1, material: MATERIALS.GLASS });
            blocks.push({ x, y, z: 2, material: MATERIALS.WOOD });
          }
        }
        for (let z = 0; z <= 1; z++) {
          for (let y = 4.5; y <= 5.5; y++) {
            blocks.push({ x: 0, y, z, material: MATERIALS.WOOD });
            blocks.push({ x: 5, y, z, material: MATERIALS.WOOD });
          }
        }
        return blocks;
      })(),

      // ── ROOF SLAB (y: 6.5) - STRUCTURAL STEEL ────────────────────
      ...(() => {
        const blocks = [];
        for (let x = 0; x <= 5; x++) {
          for (let z = -1; z <= 2; z++) {
            blocks.push({ x, y: 6.5, z, material: MATERIALS.STEEL });
          }
        }
        return blocks;
      })()
    ]
  },

  // ─────────────────────────────────────────────────────────────────
  // BRUTALIST CLIFF MANSION 
  // ─────────────────────────────────────────────────────────────────
  brutalist_villa: {
    name: "The Cyber Mansion (High-Ceiling Edition)",
    description: "Scaled up for full mobility. Each floor has a massive 8-block clearance so you can jump and roam freely. Engineered with structural steel slabs.",
    cubes: [
      // ── GROUND FLOOR SLAB (y: 0.5) ──────────────────────────────────
      ...(() => {
        const blocks = [];
        for (let x = -10; x <= 10; x++) {
          for (let z = -10; z <= 10; z++) {
            // Front patio is Concrete, interior is warm Wood
            if (z > 7) {
              blocks.push({ x, y: 0.5, z, material: MATERIALS.CONCRETE });
            } else {
              blocks.push({ x, y: 0.5, z, material: MATERIALS.WOOD });
            }
          }
        }
        return blocks;
      })(),

      // ── GROUND FLOOR WALLS & FACADES (y: 1.5 to 8.5) ────────────────
      ...(() => {
        const blocks = [];
        for (let y = 1.5; y <= 8.5; y++) {
          // Front Facade (z = 7)
          for (let x = -10; x <= 10; x++) {
            // Grand Entrance (Empty space for doors at x: -2 to 2)
            // Lintel above the door: close it off if y >= 6.5
            if (x >= -2 && x <= 2 && y <= 5.5) continue; 
            
            // Massive Glass Windows on the front
            if ((x >= -8 && x <= -4) || (x >= 4 && x <= 8)) {
              blocks.push({ x, y, z: 7, material: MATERIALS.GLASS });
            } else {
              blocks.push({ x, y, z: 7, material: MATERIALS.CONCRETE });
            }
          }

          // Back Wall (z = -10)
          for (let x = -10; x <= 10; x++) {
            // Back patio double-door (x: -1 to 1)
            if (x >= -1 && x <= 1 && y <= 5.5) continue;
            
            if (Math.abs(x) % 3 === 0) {
              blocks.push({ x, y, z: -10, material: MATERIALS.GLASS });
            } else {
              blocks.push({ x, y, z: -10, material: MATERIALS.CONCRETE });
            }
          }

          // Side Walls (x = -10 and x = 10)
          for (let z = -9; z <= 6; z++) {
            const isWindow = (z % 4 === 0);
            blocks.push({ x: -10, y, z, material: isWindow ? MATERIALS.GLASS : MATERIALS.CONCRETE });
            blocks.push({ x: 10, y, z, material: isWindow ? MATERIALS.GLASS : MATERIALS.CONCRETE });
          }

          // Interior Load-Bearing Divider (z = -2)
          for (let x = -10; x <= 10; x++) {
            // Central archway / hall progression
            if (x >= -3 && x <= 3 && y <= 5.5) continue;
            // Kitchen Doorway
            if ((x === -7 || x === 7) && y <= 5.5) continue;
            blocks.push({ x, y, z: -2, material: MATERIALS.CONCRETE });
          }
        }
        return blocks;
      })(),

      // ── GRAND CENTRAL STAIRCASE (Climbing 8 blocks) ─────────────────
      ...(() => {
        const blocks = [];
        // Bridging from GF (0.5) to F1 (9.5) smoothly 
        for (let step = 0; step < 8; step++) {
          let y = 1.5 + step;
          let z = 0 - step;
          blocks.push({ x: -1, y, z, material: MATERIALS.STEEL });
          blocks.push({ x: 0,  y, z, material: MATERIALS.STEEL });
          blocks.push({ x: 1,  y, z, material: MATERIALS.STEEL });
        }
        return blocks;
      })(),

      // ── FIRST FLOOR SLAB (y: 9.5) - 100% STRUCTURAL STEEL ───────────
      ...(() => {
        const blocks = [];
        for (let x = -10; x <= 10; x++) {
          for (let z = -10; z <= 10; z++) {
            // Cutout for the extended grand staircase
            if (x >= -1 && x <= 1 && z <= 0 && z >= -7) continue;
            
            blocks.push({ x, y: 9.5, z, material: MATERIALS.STEEL });
          }
        }
        return blocks;
      })(),

      // ── FIRST FLOOR WALLS & DIVIDERS (y: 10.5 to 17.5) ──────────────
      ...(() => {
        const blocks = [];
        for (let y = 10.5; y <= 17.5; y++) {
          // Replicate Outer Shell from GF
          for (let x = -10; x <= 10; x++) {
            if ((x >= -8 && x <= -4) || (x >= 4 && x <= 8)) {
              blocks.push({ x, y, z: 7, material: MATERIALS.GLASS }); // Front
            } else {
              blocks.push({ x, y, z: 7, material: MATERIALS.CONCRETE });
            }
            if (Math.abs(x) % 3 === 0 && Math.abs(x) > 2) {
              blocks.push({ x, y, z: -10, material: MATERIALS.GLASS }); // Back
            } else {
              blocks.push({ x, y, z: -10, material: MATERIALS.CONCRETE });
            }
          }
          for (let z = -9; z <= 6; z++) {
            const isWindow = (z % 4 === 0);
            blocks.push({ x: -10, y, z, material: isWindow ? MATERIALS.GLASS : MATERIALS.CONCRETE });
            blocks.push({ x: 10, y, z, material: isWindow ? MATERIALS.GLASS : MATERIALS.CONCRETE });
          }

          // Interior Corridors
          // Dev Wing Divider (Isolates the entire right half of the mansion)
          for (let z = -10; z <= 7; z++) {
            if (z >= -1 && z <= 1 && y <= 14.5) continue; // Wing Entrance Doorway
            blocks.push({ x: 2, y, z, material: MATERIALS.CONCRETE });
          }
          
          // Master Suite Divider (Left half isolation)
          for (let x = -10; x <= -2; x++) {
            if (x >= -5 && x <= -3 && y <= 14.5) continue; // Suite Double Doorway
            blocks.push({ x, y, z: 0, material: MATERIALS.CONCRETE });
          }
        }
        return blocks;
      })(),

      // ── THE COMMAND CENTER (Right Wing Setup on First Floor) ────────
      // Massive Wrap-around Steel Desk
      { x: 5, y: 10.5, z: 5, material: MATERIALS.STEEL },
      { x: 6, y: 10.5, z: 5, material: MATERIALS.STEEL },
      { x: 7, y: 10.5, z: 5, material: MATERIALS.STEEL },
      { x: 8, y: 10.5, z: 5, material: MATERIALS.STEEL },
      { x: 8, y: 10.5, z: 4, material: MATERIALS.STEEL },
      { x: 8, y: 10.5, z: 3, material: MATERIALS.STEEL },
      
      // Monitor Rig (Using Glass for screens)
      { x: 6, y: 11.5, z: 6, material: MATERIALS.GLASS },
      { x: 7, y: 11.5, z: 6, material: MATERIALS.GLASS },
      { x: 8, y: 11.5, z: 6, material: MATERIALS.GLASS },

      // Server / Hardware Rack (Aluminum) - Scaled up to 4 Blocks Tall!
      { x: 8, y: 10.5, z: -8, material: MATERIALS.ALUMINUM },
      { x: 8, y: 11.5, z: -8, material: MATERIALS.ALUMINUM },
      { x: 8, y: 12.5, z: -8, material: MATERIALS.ALUMINUM },
      { x: 8, y: 13.5, z: -8, material: MATERIALS.ALUMINUM },
      { x: 7, y: 10.5, z: -8, material: MATERIALS.ALUMINUM },
      { x: 7, y: 11.5, z: -8, material: MATERIALS.ALUMINUM },
      { x: 7, y: 12.5, z: -8, material: MATERIALS.ALUMINUM },
      { x: 7, y: 13.5, z: -8, material: MATERIALS.ALUMINUM },

      // ── ROOF CAP (y: 18.5) - STRUCTURAL STEEL ───────────────────────
      ...(() => {
        const blocks = [];
        // Creates a 1-block overhang all around the mansion
        for (let x = -11; x <= 11; x++) {
          for (let z = -11; z <= 8; z++) {
            blocks.push({ x, y: 18.5, z, material: MATERIALS.STEEL });
          }
        }
        return blocks;
      })()
    ]
  },
  // ─────────────────────────────────────────────────────────────────
  // BRICK COTTAGE 
  // ─────────────────────────────────────────────────────────────────
  old_house: {
    name: "Brick Cottage",
    description: "A pure voxel brick cottage. Features a stepped wooden roof and solid brick walls. 100% physically stable.",
    cubes: [
      // ── FLOOR (y: 0.5) ───────────────────────────────────────────
      ...(() => {
        const blocks = [];
        for (let x = -3; x <= 3; x++)
          for (let z = -3; z <= 3; z++)
            blocks.push({ x, y: 0.5, z, material: MATERIALS.WOOD });
        return blocks;
      })(),

      // ── WALLS (y: 1.5 & 2.5) ─────────────────────────────────────
      ...(() => {
        const blocks = [];
        for (let x = -3; x <= 3; x++) {
          blocks.push({ x, y: 1.5, z: -3, material: MATERIALS.BRICK });
          blocks.push({ x, y: 2.5, z: -3, material: MATERIALS.BRICK });
          if (x !== 0) { // Doorway opening
            blocks.push({ x, y: 1.5, z: 3, material: MATERIALS.BRICK });
          }
          blocks.push({ x, y: 2.5, z: 3, material: MATERIALS.BRICK });
        }
        for (let z = -2; z <= 2; z++) {
          blocks.push({ x: -3, y: 1.5, z, material: MATERIALS.BRICK });
          blocks.push({ x: -3, y: 2.5, z, material: MATERIALS.BRICK });
          blocks.push({ x: 3, y: 1.5, z, material: MATERIALS.BRICK });
          blocks.push({ x: 3, y: 2.5, z, material: MATERIALS.BRICK });
        }
        return blocks;
      })(),

      // ── STEPPED ROOF ─────────────────────────────────────────────
      ...(() => {
        const blocks = [];
        for (let z = -3; z <= 3; z++) {
          blocks.push({ x: -3, y: 3.5, z, material: MATERIALS.WOOD });
          blocks.push({ x: 3, y: 3.5, z, material: MATERIALS.WOOD });
          blocks.push({ x: -2, y: 4.5, z, material: MATERIALS.WOOD });
          blocks.push({ x: 2, y: 4.5, z, material: MATERIALS.WOOD });
          blocks.push({ x: -1, y: 5.5, z, material: MATERIALS.WOOD });
          blocks.push({ x: 0, y: 5.5, z, material: MATERIALS.WOOD });
          blocks.push({ x: 1, y: 5.5, z, material: MATERIALS.WOOD });
        }
        return blocks;
      })()
    ]
  },

  // ─────────────────────────────────────────────────────────────────
  // 3-STORY URBAN LOFT 
  // ─────────────────────────────────────────────────────────────────
  multistory: {
    name: "3-Story Urban Loft",
    description: "Built strictly from 1x1x1 cubes. Structural steel slabs are used between floors so the bending moment clears your solver.",
    cubes: [
      // ── GROUND FLOOR (y: 0.5) ────────────────────────────────────
      ...(() => {
        const blocks = [];
        for (let x = -3; x <= 3; x++)
          for (let z = -3; z <= 3; z++)
            blocks.push({ x, y: 0.5, z, material: MATERIALS.CONCRETE });
        return blocks;
      })(),

      // GF Pillars
      ...(() => {
        const blocks = [];
        [[-3,-3], [3,-3], [3,3], [-3,3]].forEach(([px, pz]) => {
          blocks.push({ x: px, y: 1.5, z: pz, material: MATERIALS.STEEL });
          blocks.push({ x: px, y: 2.5, z: pz, material: MATERIALS.STEEL });
        });
        return blocks;
      })(),

      // Stairs Floor 1 to 2
      { x: -1, y: 1.5, z: 0, material: MATERIALS.STEEL },
      { x: -1, y: 2.5, z: 1, material: MATERIALS.STEEL },

      // ── FLOOR 2 SLAB (y: 3.5) - STRUCTURAL STEEL ─────────────────
      ...(() => {
        const blocks = [];
        for (let x = -3; x <= 3; x++)
          for (let z = -3; z <= 3; z++)
            if (!(x === -1 && (z === 1 || z === 0))) // stair cutout
              blocks.push({ x, y: 3.5, z, material: MATERIALS.STEEL });
        return blocks;
      })(),

      // F2 Pillars
      ...(() => {
        const blocks = [];
        [[-3,-3], [3,-3], [3,3], [-3,3]].forEach(([px, pz]) => {
          blocks.push({ x: px, y: 4.5, z: pz, material: MATERIALS.STEEL });
          blocks.push({ x: px, y: 5.5, z: pz, material: MATERIALS.STEEL });
        });
        return blocks;
      })(),

      // Stairs Floor 2 to 3
      { x: 1, y: 4.5, z: 0, material: MATERIALS.STEEL },
      { x: 1, y: 5.5, z: -1, material: MATERIALS.STEEL },

      // ── FLOOR 3 SLAB (y: 6.5) - STRUCTURAL STEEL ─────────────────
      ...(() => {
        const blocks = [];
        for (let x = -3; x <= 3; x++)
          for (let z = -3; z <= 3; z++)
            if (!(x === 1 && (z === 0 || z === -1))) // stair cutout
              blocks.push({ x, y: 6.5, z, material: MATERIALS.STEEL });
        return blocks;
      })()
    ]
  }
};