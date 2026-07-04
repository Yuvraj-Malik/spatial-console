import { memo, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getMaterialColor } from "../simulation/materials.js";

function getCubeColor({ cube, isConfirmed, stressHeatmapEnabled, unstableIdSet, stressById }) {
  let cubeColor = getMaterialColor(cube.material);

  if (isConfirmed && stressHeatmapEnabled) {
    const stressRatio = stressById?.[cube.id]?.stressRatio || 0;
    if (stressRatio > 1.0) {
      cubeColor = "#ef4444";
    } else {
      const hue = Math.max(0, Math.min(120, (1 - stressRatio) * 120));
      cubeColor = `hsl(${hue}, 85%, 45%)`;
    }
  } else if (unstableIdSet?.has(cube.id)) {
    cubeColor = "#ef4444";
  }

  return cubeColor;
}

function getSnappedFaceNormal(point, cube) {
  const localX = point.x - cube.x;
  const localY = point.y - cube.y;
  const localZ = point.z - cube.z;

  const faceDistances = [
    { normal: [1, 0, 0], distance: Math.abs(0.5 - localX) },
    { normal: [-1, 0, 0], distance: Math.abs(-0.5 - localX) },
    { normal: [0, 1, 0], distance: Math.abs(0.5 - localY) },
    { normal: [0, -1, 0], distance: Math.abs(-0.5 - localY) },
    { normal: [0, 0, 1], distance: Math.abs(0.5 - localZ) },
    { normal: [0, 0, -1], distance: Math.abs(-0.5 - localZ) },
  ];

  faceDistances.sort((a, b) => a.distance - b.distance);
  return faceDistances[0].normal;
}

function getInteractionNormal(event, cube) {
  const faceNormal = event.face?.normal;

  if (faceNormal) {
    return [
      Math.round(faceNormal.x),
      Math.round(faceNormal.y),
      Math.round(faceNormal.z),
    ];
  }

  return getSnappedFaceNormal(event.point, cube);
}

export default function CubeInstances({
  cubes,
  isDraft = false,
  onHover,
  onPlace,
  onDelete,
  stressHeatmapEnabled = false,
  unstableIdSet,
  stressById,
  walkthroughActive = false,
  lightsOn = true,
}) {
  const batches = useMemo(() => {
    const byColor = new Map();

    for (let i = 0; i < cubes.length; i += 1) {
      const cube = cubes[i];
      const cubeColor = getCubeColor({
        cube,
        isConfirmed: !isDraft,
        stressHeatmapEnabled,
        unstableIdSet,
        stressById,
      });
      const existing = byColor.get(cubeColor);
      if (existing) {
        existing.push(cube);
      } else {
        byColor.set(cubeColor, [cube]);
      }
    }

    return Array.from(byColor.entries()).map(([color, items]) => ({ color, items }));
  }, [cubes, isDraft, stressById, stressHeatmapEnabled, unstableIdSet]);

  if (cubes.length === 0) return null;

  return (
    <>
      {batches.map((batch) => (
        <CubeInstanceBatch
          key={`${isDraft ? "draft" : "confirmed"}-${batch.color}`}
          cubes={batch.items}
          color={batch.color}
          isDraft={isDraft}
          onHover={onHover}
          onPlace={onPlace}
          onDelete={onDelete}
          walkthroughActive={walkthroughActive}
          lightsOn={lightsOn}
        />
      ))}
    </>
  );
}

const CubeInstanceBatch = memo(function CubeInstanceBatch({
  cubes,
  color,
  isDraft,
  onHover,
  onPlace,
  onDelete,
  walkthroughActive,
  lightsOn,
}) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || cubes.length === 0) return;

    for (let i = 0; i < cubes.length; i += 1) {
      const cube = cubes[i];
      const rotRad = (cube.rotationY || 0) * (Math.PI / 2);

      dummy.position.set(cube.x, cube.y, cube.z);
      dummy.rotation.set(0, rotRad, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }, [cubes, dummy]);

  if (cubes.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, cubes.length]}
      onPointerMove={(e) => {
        if (walkthroughActive) return;
        e.stopPropagation();

        const cube = cubes[e.instanceId];
        if (!cube) return;

        const normal = getInteractionNormal(e, cube);
        onHover([cube.x + normal[0], cube.y + normal[1], cube.z + normal[2]]);
      }}
      onPointerDown={(e) => {
        if (walkthroughActive) return;
        e.stopPropagation();

        const cube = cubes[e.instanceId];
        if (!cube) return;

        if (e.button === 0) {
          const normal = getInteractionNormal(e, cube);
          onPlace([cube.x + normal[0], cube.y + normal[1], cube.z + normal[2]]);
        }

        if (e.button === 2) {
          if (window.__gestureRotateActive) return;
          onDelete(cube.id, cube.status);
        }
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={lightsOn ? color : "#000000"}
        emissiveIntensity={lightsOn ? 0.12 : 0}
        transparent={isDraft}
        opacity={isDraft ? 0.55 : 1}
        roughness={0.4}
        metalness={0.6}
      />
    </instancedMesh>
  );
});