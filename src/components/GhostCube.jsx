import { renderShapeGeometry } from "./ShapeRenderer.jsx";

export default function GhostCube({ position, color, shape = "cube", rotationY = 0 }) {
  if (!position) return null;

  const rotRad = (rotationY || 0) * (Math.PI / 2);

  return (
    <group position={position} rotation={[0, rotRad, 0]}>
      {renderShapeGeometry(shape, color, color, true)}
    </group>
  );
}
