import { useState } from "react";
import {
  getMaterialColor,
  getMaterialEmissive,
} from "../simulation/materials.js";
import { renderShapeGeometry } from "./ShapeRenderer.jsx";

export default function Cube({
  cube,
  onHover,
  onPlace,
  onDelete,
  isUnstable = false,
  stressHeatmapEnabled = false,
  stressRatio = 0,
  isOpen = false,
  walkthroughActive = false,
}) {
  const [hovered, setHovered] = useState(false);

  const { x, y, z, material, status, shape = "cube", rotationY = 0 } = cube;

  // Determine cube color based on state
  let cubeColor = getMaterialColor(material);
  let emissiveColor = getMaterialEmissive(material);

  if (status === "confirmed" && stressHeatmapEnabled) {
    if (stressRatio > 1.0) {
      cubeColor = "#ef4444"; // Pulsing/bright red for overloaded
      emissiveColor = "#7f1d1d";
    } else {
      // HSL: 120 is green, 60 is yellow, 0 is red
      const hue = Math.max(0, Math.min(120, (1 - stressRatio) * 120));
      cubeColor = `hsl(${hue}, 85%, 45%)`;
      emissiveColor = `hsl(${hue}, 85%, 20%)`;
    }
  } else if (isUnstable) {
    // Pulsing red effect for unstable cubes
    cubeColor = "#ef4444";
    emissiveColor = hovered ? "#dc2626" : "#991b1b";
  } else if (hovered && !walkthroughActive) {
    emissiveColor = "#1d4ed8";
  }

  const rotRad = (rotationY || 0) * (Math.PI / 2);

  return (
    <group
      position={[x, y, z]}
      rotation={[0, rotRad, 0]}
      userData={{ cubeId: cube.id, shape }}
      onPointerOver={(e) => {
        if (walkthroughActive) return;
        e.stopPropagation();
        setHovered(true);

        const normal = e.face.normal;
        const newPos = [x + normal.x, y + normal.y, z + normal.z];

        onHover(newPos);
      }}
      onPointerOut={() => {
        if (walkthroughActive) return;
        setHovered(false);
      }}
      onPointerDown={(e) => {
        if (walkthroughActive) return;
        e.stopPropagation();

        if (e.button === 0) {
          const normal = e.face.normal;
          const newPos = [x + normal.x, y + normal.y, z + normal.z];
          onPlace(newPos);
        }

        if (e.button === 2) {
          if (window.__gestureRotateActive) return;
          onDelete();
        }
      }}
    >
      {renderShapeGeometry(shape, cubeColor, emissiveColor, status === "draft", isOpen)}
    </group>
  );
}
