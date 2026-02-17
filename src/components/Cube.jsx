import { useState } from "react";
import { getMaterialColor, getMaterialEmissive } from "../simulation/materials.js";

export default function Cube({ cube, onHover, onPlace, onDelete, isUnstable = false }) {
  const [hovered, setHovered] = useState(false);

  const { x, y, z, material, status } = cube;

  // Determine cube color based on state
  let cubeColor = getMaterialColor(material);
  let emissiveColor = getMaterialEmissive(material);
  
  if (isUnstable) {
    // Pulsing red effect for unstable cubes
    cubeColor = "#ef4444";
    emissiveColor = hovered ? "#dc2626" : "#991b1b";
  } else if (hovered) {
    emissiveColor = "#1d4ed8";
  }

  return (
    <mesh
      position={[x, y, z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);

        const normal = e.face.normal;
        const newPos = [
          x + normal.x,
          y + normal.y,
          z + normal.z
        ];

        onHover(newPos);
      }}
      onPointerOut={() => setHovered(false)}
      onPointerDown={(e) => {
        e.stopPropagation();

        if (e.button === 0) {
          const normal = e.face.normal;
          const newPos = [
            x + normal.x,
            y + normal.y,
            z + normal.z
          ];
          onPlace(newPos);
        }

        if (e.button === 2) {
          onDelete();
        }
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={cubeColor}
        transparent={status === "draft"}
        opacity={status === "draft" ? 0.5 : 1}
        emissive={emissiveColor}
        roughness={0.4}
        metalness={0.6}
      />
    </mesh>
  );
}
