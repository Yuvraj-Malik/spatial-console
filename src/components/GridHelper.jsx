import { Grid } from "@react-three/drei";

export default function GridHelper() {
  return (
    <Grid
      args={[50, 50]}
      cellSize={1}
      cellThickness={0.6}
      cellColor="#1e2a44"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#2f4b7c"
      fadeDistance={100}
      fadeStrength={1}
      infiniteGrid
    />
  );
}
