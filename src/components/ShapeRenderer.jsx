import * as THREE from "three";

// Pre-create the wedge/ramp geometry (Triangle Prism)
const wedgeGeometry = new THREE.BufferGeometry();
const vertices = new Float32Array([
  // Bottom face
  -0.5, -0.5, -0.5,
   0.5, -0.5, -0.5,
   0.5, -0.5,  0.5,
  -0.5, -0.5,  0.5,

  // Back face
  -0.5, -0.5, -0.5,
  -0.5,  0.5, -0.5,
   0.5,  0.5, -0.5,
   0.5, -0.5, -0.5,

  // Slanted face
  -0.5,  0.5, -0.5,
  -0.5, -0.5,  0.5,
   0.5, -0.5,  0.5,
   0.5,  0.5, -0.5,

  // Left triangle
  -0.5, -0.5, -0.5,
  -0.5, -0.5,  0.5,
  -0.5,  0.5, -0.5,

  // Right triangle
   0.5, -0.5, -0.5,
   0.5,  0.5, -0.5,
   0.5, -0.5,  0.5,
]);

const indices = [
  0, 2, 1,   0, 3, 2,   // Bottom
  4, 5, 6,   4, 6, 7,   // Back
  8, 9, 10,  8, 10, 11, // Slanted front
  12, 13, 14,          // Left triangle
  15, 16, 17           // Right triangle
];

wedgeGeometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
wedgeGeometry.setIndex(indices);
wedgeGeometry.computeVertexNormals();

export function renderShapeGeometry(shape, color, emissiveColor, isDraft) {
  const materialProps = {
    color,
    transparent: isDraft,
    opacity: isDraft ? 0.55 : 1,
    emissive: emissiveColor,
    roughness: 0.4,
    metalness: 0.6,
  };

  switch (shape) {
    case "slab":
      // Half block sitting on the bottom of the grid cell
      return (
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[1, 0.5, 1]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      );

    case "quarter":
      // Quarter slab sitting on the bottom of the grid cell
      return (
        <mesh position={[0, -0.375, 0]}>
          <boxGeometry args={[1, 0.25, 1]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      );

    case "stair":
      return (
        <group>
          {/* Lower step */}
          <mesh position={[0, -0.25, 0]}>
            <boxGeometry args={[1, 0.5, 1]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Upper step */}
          <mesh position={[0, 0.25, -0.25]}>
            <boxGeometry args={[1, 0.5, 0.5]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      );

    case "ramp":
    case "wedge":
      return (
        <mesh>
          <primitive object={wedgeGeometry} attach="geometry" />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      );

    case "cylinder":
    case "pillar":
      return (
        <mesh>
          <cylinderGeometry args={[0.4, 0.4, 1, 16]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      );

    case "sphere":
      return (
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      );

    case "door":
      return (
        <group>
          {/* Wood panel */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.9, 1, 0.08]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Golden Handle */}
          <mesh position={[0.35, 0, 0.06]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color="#eab308" metalness={1.0} roughness={0.1} />
          </mesh>
        </group>
      );

    case "window":
      return (
        <group>
          {/* Frame */}
          <mesh>
            <boxGeometry args={[1, 1, 0.08]} />
            <meshStandardMaterial color={color} wireframe={true} />
          </mesh>
          {/* Blue semi-transparent glass */}
          <mesh>
            <boxGeometry args={[0.85, 0.85, 0.03]} />
            <meshStandardMaterial
              color="#38bdf8"
              transparent={true}
              opacity={0.35}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
        </group>
      );

    case "bed":
      return (
        <group>
          {/* Mattress */}
          <mesh position={[0, -0.25, 0]}>
            <boxGeometry args={[0.9, 0.3, 0.9]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.8} />
          </mesh>
          {/* Blanket */}
          <mesh position={[0, -0.09, 0.1]}>
            <boxGeometry args={[0.92, 0.04, 0.7]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          {/* Pillow */}
          <mesh position={[0, -0.08, -0.3]}>
            <boxGeometry args={[0.7, 0.06, 0.22]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
          </mesh>
        </group>
      );

    case "sofa":
      return (
        <group>
          {/* Main cushion */}
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[0.9, 0.25, 0.8]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Back rest */}
          <mesh position={[0, 0.15, -0.35]}>
            <boxGeometry args={[0.9, 0.5, 0.2]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Arm rest left */}
          <mesh position={[-0.45, 0, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.8]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Arm rest right */}
          <mesh position={[0.45, 0, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.8]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      );

    case "chair":
      return (
        <group>
          {/* Cushion */}
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.6, 0.08, 0.6]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Back rest */}
          <mesh position={[0, 0.25, -0.26]}>
            <boxGeometry args={[0.6, 0.6, 0.08]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Four metal legs */}
          <mesh position={[-0.22, -0.3, -0.22]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[0.22, -0.3, -0.22]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[-0.22, -0.3, 0.22]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[0.22, -0.3, 0.22]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      );

    case "table":
      return (
        <group>
          {/* Top */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.95, 0.08, 0.95]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Center pillar leg */}
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.12, 0.7, 0.12]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          {/* Base plate */}
          <mesh position={[0, -0.45, 0]}>
            <boxGeometry args={[0.6, 0.05, 0.6]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        </group>
      );

    case "sink":
      return (
        <group>
          {/* Counter top */}
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.9, 0.5, 0.9]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Basin bowl */}
          <mesh position={[0, 0.21, 0]}>
            <boxGeometry args={[0.6, 0.02, 0.5]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Metal tap */}
          <mesh position={[0, 0.32, -0.35]}>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color="#94a3b8" metalness={1.0} roughness={0.1} />
          </mesh>
        </group>
      );

    case "toilet":
      return (
        <group>
          {/* Toilet Bowl */}
          <mesh position={[0, -0.15, 0.15]}>
            <boxGeometry args={[0.45, 0.4, 0.55]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.1} />
          </mesh>
          {/* Tank */}
          <mesh position={[0, 0.2, -0.2]}>
            <boxGeometry args={[0.5, 0.5, 0.2]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.1} />
          </mesh>
        </group>
      );

    case "grass_block":
      return (
        <group>
          {/* Soil bottom */}
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[1, 0.9, 1]} />
            <meshStandardMaterial color="#78350f" roughness={0.95} />
          </mesh>
          {/* Grass top */}
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[1.005, 0.1, 1.005]} />
            <meshStandardMaterial color="#22c55e" roughness={0.9} />
          </mesh>
        </group>
      );

    case "tree":
      return (
        <group>
          {/* Trunk log */}
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.6, 8]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          {/* Leaf foliage */}
          <mesh position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.4, 8, 8]} />
            <meshStandardMaterial color="#16a34a" roughness={0.95} />
          </mesh>
        </group>
      );

    case "bush":
      return (
        <mesh>
          <dodecahedronGeometry args={[0.45]} />
          <meshStandardMaterial color="#15803d" roughness={0.9} />
        </mesh>
      );

    case "flower":
      return (
        <group>
          {/* Stem */}
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
            <meshStandardMaterial color="#22c55e" />
          </mesh>
          {/* Blossom */}
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color="#ec4899" roughness={0.3} />
          </mesh>
        </group>
      );

    case "pipe":
      return (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 1.02, 12]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </mesh>
      );

    case "lamp":
      return (
        <group>
          {/* Stand */}
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          {/* Glowing Bulb */}
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color="#fef08a" emissive="#eab308" emissiveIntensity={1.2} />
          </mesh>
        </group>
      );

    case "fence":
      return (
        <group>
          {/* Left vertical post */}
          <mesh position={[-0.45, 0, 0]}>
            <boxGeometry args={[0.1, 1, 0.1]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Right vertical post */}
          <mesh position={[0.45, 0, 0]}>
            <boxGeometry args={[0.1, 1, 0.1]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Top horizontal rail */}
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[1, 0.08, 0.08]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Bottom horizontal rail */}
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[1, 0.08, 0.08]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      );

    default: // "cube"
      return (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      );
  }
}
