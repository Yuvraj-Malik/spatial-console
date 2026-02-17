export default function GhostCube({ position, color }) {
  if (!position) return null;

  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.3}
        emissive={color}
      />
    </mesh>
  );
}
