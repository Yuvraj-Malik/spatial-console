export default function GhostCube({ position }) {
  if (!position) return null;

  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#3b82f6"
        transparent
        opacity={0.35}
        emissive="#1e40af"
      />
    </mesh>
  );
}
