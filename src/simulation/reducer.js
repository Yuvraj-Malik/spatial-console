import { DEFAULT_MATERIAL } from './materials.js';
import { getUnstableCubeIds } from './structuralEngine.js';

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
    nextId: 1
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
            const unstableIds = getUnstableCubeIds(newConfirmedCubes);

            return {
                ...state,
                confirmedCubes: newConfirmedCubes,
                draftCubes: [],
                history: [...state.history, { ...action, previousDraftCubes: state.draftCubes }],
                collapseState: {
                    warningActive: unstableIds.length > 0,
                    unstableIds,
                    countdown: unstableIds.length > 0 ? 3 : 3
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
                // Revert confirmed cubes back to draft
                const recentlyConfirmed = lastAction.previousDraftCubes || [];
                const remainingConfirmed = state.confirmedCubes.filter(
                    cube => !recentlyConfirmed.some(draft => draft.id === cube.id)
                );

                return {
                    ...state,
                    confirmedCubes: remainingConfirmed,
                    draftCubes: recentlyConfirmed.map(cube => ({ ...cube, status: "draft" })),
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
            return {
                ...state,
                confirmedCubes: state.confirmedCubes.filter(
                    (c) => c.id !== action.payload.id
                ),
                history: [...state.history, action]
            };
        }

        case "COLLAPSE": {
            // Remove only the unstable cubes
            const stableCubes = state.confirmedCubes.filter(
                cube => !state.collapseState.unstableIds.includes(cube.id)
            );

            return {
                ...state,
                confirmedCubes: stableCubes,
                collapseState: {
                    warningActive: false,
                    unstableIds: [],
                    countdown: 3
                },
                history: [...state.history, action]
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

        default:
            return state;
    }
}
