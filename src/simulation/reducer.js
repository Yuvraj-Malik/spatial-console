import { DEFAULT_MATERIAL } from './materials.js';
import { calculateStructuralMetrics } from './structuralEngine.js';

// ---- Initial State ----
export const initialState = {
    draftCubes: [],
    confirmedCubes: [],
    currentMaterial: DEFAULT_MATERIAL,
    history: [],
    nextId: 1,
    user: null, // NEW: User Account State
    currentShape: "cube", // NEW: Active geometry shape
    rotationY: 0, // NEW: Active Y-axis rotation index (0=0, 1=90, 2=180, 3=270)
    openInteractiveIds: [], // NEW: Tracks open doors and windows
    // NEW: View settings
    viewSettings: {
        showGrid: true,
        autoRotate: false,
        walkthroughActive: false, // NEW: Walkthrough view mode active
        toolMode: "single", // "single" or "line"
        lightsOn: true, // NEW: Lighting toggle
        placementActive: true, // NEW: Whether placement/ghost preview is enabled
    },
    sidebarOpen: false, // NEW: Sidebar visibility

    // NEW: Pre-calculated metrics
    structuralMetrics: {
        totalMass: 0,
        totalCost: 0,
        maxHeight: 0,
        safetyFactor: Infinity,
        centerOfMass: { x: 0, y: 0, z: 0 },
        stresses: {}
    }
};

// ---- Reducer ----
export function simulationReducer(state, action) {
    switch (action.type) {

        case "SET_USER": {
            return {
                ...state,
                user: action.payload
            };
        }

        case "PLACE_DRAFT": {
            const newCube = {
                id: state.nextId,
                ...action.payload,   // { x, y, z, material }
                status: "draft"
            };

            return {
                ...state,
                draftCubes: [...state.draftCubes, newCube],
                history: [...state.history, action],
                nextId: state.nextId + 1
            };
        }

        case "PLACE_LINE_DRAFT": {
            const cubes = action.payload.cubes.map((c, index) => ({
                id: state.nextId + index,
                ...c,
                status: "draft"
            }));

            return {
                ...state,
                draftCubes: [...state.draftCubes, ...cubes],
                history: [...state.history, action],
                nextId: state.nextId + cubes.length
            };
        }

        case "DELETE_DRAFT": {
            return {
                ...state,
                draftCubes: state.draftCubes.filter(
                    (c) => c.id !== action.payload.id
                ),
                history: [...state.history, action]
            };
        }

        case "SET_MATERIAL": {
            return {
                ...state,
                currentMaterial: action.payload,
                viewSettings: {
                    ...state.viewSettings,
                    placementActive: true
                }
            };
        }

        case "SET_SHAPE": {
            return {
                ...state,
                currentShape: action.payload,
                viewSettings: {
                    ...state.viewSettings,
                    placementActive: true
                }
            };
        }

        case "SET_PLACEMENT_ACTIVE": {
            return {
                ...state,
                viewSettings: {
                    ...state.viewSettings,
                    placementActive: action.payload.active
                }
            };
        }

        case "ROTATE_Y": {
            return {
                ...state,
                rotationY: ((state.rotationY || 0) + 1) % 4
            };
        }

        case "SET_ROTATION": {
            return {
                ...state,
                rotationY: action.payload
            };
        }

        case "CONFIRM_DRAFT": {
            const confirmed = state.draftCubes.map((cube) => ({
                ...cube,
                status: "confirmed"
            }));

            const newConfirmedCubes = [...state.confirmedCubes, ...confirmed];
            const metrics = calculateStructuralMetrics(newConfirmedCubes);

            return {
                ...state,
                confirmedCubes: newConfirmedCubes,
                draftCubes: [],
                structuralMetrics: metrics,
                history: [
                    ...state.history, 
                    { 
                        ...action, 
                        previousDraftCubes: state.draftCubes,
                        previousMetrics: state.structuralMetrics 
                    }
                ]
            };
        }

        case "UNDO": {
            if (state.history.length === 0) return state;

            const lastAction = state.history[state.history.length - 1];
            const newHistory = state.history.slice(0, -1);

            if (lastAction.type === "PLACE_DRAFT") {
                return {
                    ...state,
                    draftCubes: state.draftCubes.slice(0, -1),
                    history: newHistory,
                    nextId: state.nextId - 1
                };
            }

            if (lastAction.type === "PLACE_LINE_DRAFT") {
                const count = lastAction.payload.cubes.length;
                return {
                    ...state,
                    draftCubes: state.draftCubes.slice(0, -count),
                    history: newHistory,
                    nextId: state.nextId - count
                };
            }

            if (lastAction.type === "DELETE_DRAFT") {
                return {
                    ...state,
                    draftCubes: [...state.draftCubes, lastAction.payload],
                    history: newHistory
                };
            }

            if (lastAction.type === "CONFIRM_DRAFT") {
                const recentlyConfirmed = lastAction.previousDraftCubes || [];
                const remainingConfirmed = state.confirmedCubes.filter(
                    cube => !recentlyConfirmed.some(draft => draft.id === cube.id)
                );
                const metrics = calculateStructuralMetrics(remainingConfirmed);

                return {
                    ...state,
                    confirmedCubes: remainingConfirmed,
                    draftCubes: recentlyConfirmed.map(cube => ({ ...cube, status: "draft" })),
                    structuralMetrics: metrics,
                    history: newHistory
                };
            }

            if (lastAction.type === "DELETE_CONFIRMED") {
                const restoredConfirmed = [...state.confirmedCubes, lastAction.payload];
                const metrics = calculateStructuralMetrics(restoredConfirmed);
                return {
                    ...state,
                    confirmedCubes: restoredConfirmed,
                    structuralMetrics: metrics,
                    history: newHistory
                };
            }

            return state;
        }

        case "DELETE_CONFIRMED": {
            const newConfirmedCubes = state.confirmedCubes.filter(
                (c) => c.id !== action.payload.id
            );
            const deletedCube = state.confirmedCubes.find(c => c.id === action.payload.id);
            const metrics = calculateStructuralMetrics(newConfirmedCubes);

            return {
                ...state,
                confirmedCubes: newConfirmedCubes,
                openInteractiveIds: state.openInteractiveIds.filter(id => id !== action.payload.id),
                structuralMetrics: metrics,
                history: [
                    ...state.history,
                    {
                        type: "DELETE_CONFIRMED",
                        payload: deletedCube,
                        previousMetrics: state.structuralMetrics
                    }
                ]
            };
        }

        // NEW: View settings toggles

        case "TOGGLE_GRID": {
            return {
                ...state,
                viewSettings: {
                    ...state.viewSettings,
                    showGrid: !state.viewSettings.showGrid
                }
            };
        }

        case "TOGGLE_AUTO_ROTATE": {
            return {
                ...state,
                viewSettings: {
                    ...state.viewSettings,
                    autoRotate: !state.viewSettings.autoRotate
                }
            };
        }

        case "TOGGLE_WALKTHROUGH": {
            return {
                ...state,
                viewSettings: {
                    ...state.viewSettings,
                    walkthroughActive: !state.viewSettings.walkthroughActive
                }
            };
        }

        case "TOGGLE_LIGHTS": {
            return {
                ...state,
                viewSettings: {
                    ...state.viewSettings,
                    lightsOn: !state.viewSettings.lightsOn
                }
            };
        }

        case "TOGGLE_SIDEBAR": {
            return {
                ...state,
                sidebarOpen: !state.sidebarOpen
            };
        }

        case "TOGGLE_INTERACTIVE_BLOCK": {
            const id = action.payload.id;
            const isOpen = state.openInteractiveIds.includes(id);
            const newOpenIds = isOpen
                ? state.openInteractiveIds.filter(x => x !== id)
                : [...state.openInteractiveIds, id];
            return {
                ...state,
                openInteractiveIds: newOpenIds
            };
        }

        // NEW: Loader & Utilities
        case "LOAD_TEMPLATE": {
            const templateCubes = action.payload.cubes.map((c, idx) => ({
                id: state.nextId + idx,
                ...c,
                status: "confirmed"
            }));
            const metrics = calculateStructuralMetrics(templateCubes);

            return {
                ...state,
                confirmedCubes: templateCubes,
                draftCubes: [],
                nextId: state.nextId + templateCubes.length,
                structuralMetrics: metrics,
                history: [], // Reset history on template load
                openInteractiveIds: []
            };
        }

        case "LOAD_JSON": {
            const importedCubes = action.payload.cubes.map((c, idx) => ({
                id: state.nextId + idx,
                ...c,
                status: c.status || "confirmed"
            }));
            const metrics = calculateStructuralMetrics(importedCubes);

            return {
                ...state,
                confirmedCubes: importedCubes,
                draftCubes: [],
                nextId: state.nextId + importedCubes.length,
                structuralMetrics: metrics,
                history: [],
                openInteractiveIds: []
            };
        }

        case "CLEAR_SCENE": {
            return {
                ...state,
                confirmedCubes: [],
                draftCubes: [],
                history: [],
                openInteractiveIds: [],
                structuralMetrics: calculateStructuralMetrics([]),
                viewSettings: {
                    ...state.viewSettings,
                    walkthroughActive: false
                }
            };
        }

        case "SET_TOOL_MODE": {
            return {
                ...state,
                viewSettings: {
                    ...state.viewSettings,
                    toolMode: action.payload.toolMode
                }
            };
        }

        default:
            return state;
    }
}
