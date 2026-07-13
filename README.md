# Spatial Structural Simulation Console

A browser-based 3D structural engineering simulator built with React and Three.js. Build, validate, and test structural stability in real-time.

## 🏗️ Features

### Core Building System
- **3D Cube Placement** - Click to place cubes on integer grid
- **Material Selection** - Steel, Concrete, Wood, Aluminum with engineering properties
- **Custom Colors** - 26-color palette for creative building
- **Draft & Confirm Modes** - Build freely, then validate structure

### Structural Engineering
- **Connectivity Validation** - Ground-connected support analysis
- **Stability Detection** - BFS propagation from ground level
- **Collapse Simulation** - Timed removal of unstable structures
- **Visual Feedback** - Red pulsing for unstable cubes

### User Interface
- **Material Panel** - Engineering presets + custom colors
- **Status Display** - Draft/confirmed cube counts
- **Collapse Warning** - 3-second countdown with cancel option
- **Undo System** - Full action history with Ctrl+Z support

### Interaction Controls
- **Left Click Ground** - Place cube at position
- **Left Click Cube** - Place adjacent cube
- **Right Click Cube** - Delete cube (draft or confirmed)
- **Ctrl+Z** - Undo last action

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
cd spatial-console
npm install
```

### Development
```bash
npm run dev
```
Open http://localhost:5173 in your browser

### Build
```bash
npm run build
```

## 🌐 Deployment

- Frontend target: Netlify on `https://yuvrajm.dev`
- Backend target: Render on `https://spatial-console.yuvrajm.dev`

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete DNS, environment, and release steps.

## 🧮 Engineering Model

### Structural Validation Logic
The system uses deterministic connectivity rules:

1. **Ground Connection** - Cubes touching ground (y=0.5) are stable seeds
2. **Face Adjacency** - 6-direction connectivity (±x, ±y, ±z)
3. **Edge Support** - Diagonal adjacency for complex structures
4. **BFS Propagation** - Support spreads from ground through connections

### Material Properties
- **Steel** - High strength, industrial gray
- **Concrete** - Medium strength, construction gray
- **Wood** - Low strength, brown tones
- **Aluminum** - Medium strength, metallic silver

### Collapse System
- **Detection** - Automatic instability analysis on confirmation
- **Warning** - Visual countdown with cancel option
- **Execution** - Selective removal of unstable cubes
- **History** - Collapse actions added to undo stack

## 📁 Project Structure

```
src/
├── components/
│   ├── SceneCanvas.jsx     # 3D rendering canvas
│   ├── CubeManager.jsx     # Cube interaction logic
│   ├── Cube.jsx            # Individual cube component
│   ├── GhostCube.jsx       # Placement preview
│   └── UIOverlay.jsx       # Control panel
├── simulation/
│   ├── reducer.js          # State management
│   ├── structuralEngine.js # Validation logic
│   └── materials.js        # Material definitions
└── App.jsx                 # Main application
```

## 🔧 Technical Stack

- **React 18** - Component framework
- **Three.js** - 3D rendering engine
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Three.js helpers
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility styling

## 🎯 Development Roadmap

### Phase 1: Core Engine ✅
- [x] Deterministic connectivity validation
- [x] Basic material system
- [x] Collapse mechanics
- [x] Undo/redo functionality

### Phase 2: Material Strength (Planned)
- [ ] Vertical load limits per material
- [ ] Strength-based failure analysis
- [ ] Load distribution visualization

### Phase 3: UX Polish (Planned)
- [ ] Smooth collapse animations
- [ ] Enhanced visual feedback
- [ ] Sound effects
- [ ] Performance optimization

### Phase 4: Advanced Features (Future)
- [ ] Gesture control (MediaPipe)
- [ ] AI structural optimization
- [ ] Stress heatmaps
- [ ] Export/share functionality

## 🧪 Testing

### Manual Test Cases
1. **Single Pillar** - Vertical stack should be stable
2. **Bridge** - Horizontal span should connect
3. **Floating Cluster** - Isolated cubes should collapse
4. **Complex Structure** - Multi-level connectivity test

### Debug Tools
- Console logging shows validation steps
- Visual indicators for unstable cubes
- State inspection in React DevTools


## 🔍 Troubleshooting

### Common Issues
- **White screen** - Check console for Three.js errors
- **Cubes not placing** - Verify ground plane interaction
- **Collapse not working** - Check structural validation logs

### Debug Mode
Open browser console to see:
- Connectivity validation steps
- Material assignment logs
- State change history

---

Built with ❤️ for structural engineering simulation
