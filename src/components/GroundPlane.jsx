export default function GroundPlane({ onMove, onClick }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerMove={onMove}
      onClick={onClick}
    >
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}
