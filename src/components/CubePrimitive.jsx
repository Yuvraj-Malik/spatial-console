import { useState } from "react";

export default function CubePrimitive({
  position,
  onHover,
  onPlace,
  onDelete
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);

        const normal = e.face.normal;

        const newPosition = [
          position[0] + normal.x,
          position[1] + normal.y,
          position[2] + normal.z
        ];

        onHover(newPosition);
      }}
      onPointerOut={() => setHovered(false)}
      onPointerDown={(e) => {
        e.stopPropagation();

        // LEFT CLICK → place
        if (e.button === 0) {
          const normal = e.face.normal;

          const newPosition = [
            position[0] + normal.x,
            position[1] + normal.y,
            position[2] + normal.z
          ];

          onPlace(newPosition);
        }

        // RIGHT CLICK → delete
        if (e.button === 2) {
          onDelete(position);
        }
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={hovered ? "#60a5fa" : "#1f3b73"}
        emissive={hovered ? "#1d4ed8" : "#0a1a33"}
        roughness={0.4}
        metalness={0.6}
      />
    </mesh>
  );
}
