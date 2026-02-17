import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function GestureCursor({ position, visible = false }) {
  const meshRef = useRef();
  const pulseRef = useRef(0);

  // Animate the cursor
  useFrame((state, delta) => {
    if (!meshRef.current || !visible) return;

    // Pulsing effect
    pulseRef.current += delta * 3;
    const scale = 1 + Math.sin(pulseRef.current) * 0.1;
    
    meshRef.current.scale.set(scale, scale, scale);
    
    // Floating animation
    meshRef.current.position.y = position.y + 0.2 + Math.sin(pulseRef.current * 2) * 0.05;
  });

  if (!visible) return null;

  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y + 0.2, position.z]}
    >
      {/* Cursor shape - a small sphere with ring */}
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial
        color="#00ff00"
        emissive="#00ff00"
        emissiveIntensity={0.5}
        transparent
        opacity={0.8}
      />
      
      {/* Ring indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.2, 32]} />
        <meshBasicMaterial
          color="#00ff00"
          transparent
          opacity={0.6}
          side={2} // DoubleSide
        />
      </mesh>
    </mesh>
  );
}
