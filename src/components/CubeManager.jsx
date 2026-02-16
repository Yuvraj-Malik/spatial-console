import { useState } from "react";
import CubePrimitive from "./CubePrimitive";
import GroundPlane from "./GroundPlane";
import GhostCube from "./GhostCube";

export default function CubeManager() {
  const [cubes, setCubes] = useState([]);
  const [hoverPosition, setHoverPosition] = useState(null);

  const positionExists = (pos) => {
    return cubes.some(
      (c) =>
        c.x === pos[0] &&
        c.y === pos[1] &&
        c.z === pos[2]
    );
  };

  const placeCube = (pos) => {
    if (positionExists(pos)) return;

    setCubes([...cubes, {
      x: pos[0],
      y: pos[1],
      z: pos[2]
    }]);
  };

  const deleteCube = (pos) => {
    setCubes(
      cubes.filter(
        (c) =>
          !(c.x === pos[0] &&
            c.y === pos[1] &&
            c.z === pos[2])
      )
    );
  };

  return (
    <>
      <GroundPlane
        onMove={(e) => {
          const point = e.point;

          const snappedX = Math.round(point.x);
          const snappedZ = Math.round(point.z);

          const pos = [snappedX, 0.5, snappedZ];

          setHoverPosition(pos);
        }}
        onClick={(e) => {
          if (e.button !== 0) return;
          if (!hoverPosition) return;
          placeCube(hoverPosition);
        }}
      />

      {cubes.map((cube, index) => (
        <CubePrimitive
          key={index}
          position={[cube.x, cube.y, cube.z]}
          onHover={(pos) => setHoverPosition(pos)}
          onPlace={placeCube}
          onDelete={deleteCube}
        />
      ))}

      <GhostCube position={hoverPosition} />
    </>
  );
}
