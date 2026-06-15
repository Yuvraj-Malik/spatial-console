import { DEFAULT_MATERIAL } from './materials.js';
import { calculateStructuralMetrics } from './structuralEngine.js';

// ---- Initial State ----
export const initialState = {
    draftCubes: [],
    confirmedCubes: [],
    currentMaterial: DEFAULT_MATERIAL,
    history: [],
    collapseState: {
        warningActive: false,
        unstableIds: [],
        countdown: 3
    },
    nextId: 1,
    // NEW: View settings
    viewSettings: {
        stressHeatmap: false,
        showGrid: true,
        autoRotate: false
    },
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
                currentMaterial: action.payload
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
                ],
                collapseState: {
                    warningActive: metrics.unstableIds.length > 0,
                    unstableIds: metrics.unstableIds,
                    countdown: metrics.unstableIds.length > 0 ? 3 : 3
                }
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
                    history: newHistory,
                    collapseState: {
                        warningActive: false,
                        unstableIds: [],
                        countdown: 3
                    }
                };
            }

            if (lastAction.type === "DELETE_CONFIRMED") {
                const restoredConfirmed = [...state.confirmedCubes, lastAction.payload];
                const metrics = calculateStructuralMetrics(restoredConfirmed);
                return {
                    ...state,
                    confirmedCubes: restoredConfirmed,
                    structuralMetrics: metrics,
                    history: newHistory,
                    collapseState: {
                        warningActive: false,
                        unstableIds: [],
                        countdown: 3
                    }
                };
            }

            if (lastAction.type === "COLLAPSE") {
                const restoredConfirmed = [...state.confirmedCubes, ...lastAction.payload.collapsedCubes];
                const metrics = calculateStructuralMetrics(restoredConfirmed);
                return {
                    ...state,
                    confirmedCubes: restoredConfirmed,
                    structuralMetrics: metrics,
                    history: newHistory,
                    collapseState: {
                        warningActive: false,
                        unstableIds: [],
                        countdown: 3
                    }
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
                structuralMetrics: metrics,
                history: [
                    ...state.history,
                    {
                        type: "DELETE_CONFIRMED",
                        payload: deletedCube,
                        previousMetrics: state.structuralMetrics
                    }
                ],
                collapseState: {
                    warningActive: metrics.unstableIds.length > 0,
                    unstableIds: metrics.unstableIds,
                    countdown: metrics.unstableIds.length > 0 ? 3 : 3
                }
            };
        }

        case "COLLAPSE": {
            const collapsedCubes = state.confirmedCubes.filter(
                cube => state.collapseState.unstableIds.includes(cube.id)
            );
            const stableCubes = state.confirmedCubes.filter(
                cube => !state.collapseState.unstableIds.includes(cube.id)
            );
            const metrics = calculateStructuralMetrics(stableCubes);

            return {
                ...state,
                confirmedCubes: stableCubes,
                structuralMetrics: metrics,
                collapseState: {
                    warningActive: false,
                    unstableIds: [],
                    countdown: 3
                },
                history: [
                    ...state.history,
                    {
                        type: "COLLAPSE",
                        payload: { collapsedCubes },
                        previousMetrics: state.structuralMetrics
                    }
                ]
            };
        }

        case "CANCEL_COLLAPSE": {
            return {
                ...state,
                collapseState: {
                    warningActive: false,
                    unstableIds: [],
                    countdown: 3
                }
            };
        }

        case "UPDATE_COUNTDOWN": {
            return {
                ...state,
                collapseState: {
                    ...state.collapseState,
                    countdown: action.payload.countdown
                }
            };
        }

        // NEW: View settings toggles
        case "TOGGLE_STRESS_HEATMAP": {
            return {
                ...state,
                viewSettings: {
                    ...state.viewSettings,
                    stressHeatmap: !state.viewSettings.stressHeatmap
                }
            };
        }

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
                collapseState: {
                    warningActive: false,
                    unstableIds: [],
                    countdown: 3
                }
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
                collapseState: {
                    warningActive: false,
                    unstableIds: [],
                    countdown: 3
                }
            };
        }

        case "CLEAR_SCENE": {
            return {
                ...state,
                confirmedCubes: [],
                draftCubes: [],
                history: [],
                structuralMetrics: calculateStructuralMetrics([]),
                collapseState: {
                    warningActive: false,
                    unstableIds: [],
                    countdown: 3
                }
            };
        }

        default:
            return state;
    }
}
