// ---- Action Controller: Input Abstraction Layer ----
// Centralizes all input dispatches (mouse, gesture, future voice)

// Action dispatch function - single entry point for all inputs
export function dispatchAction(dispatch, type, payload) {
  console.log(`🎮 Action: ${type}`, payload);
  
  switch (type) {
    case "PLACE_DRAFT":
      dispatch({
        type: "PLACE_DRAFT",
        payload: {
          x: payload.x,
          y: payload.y,
          z: payload.z,
          material: payload.material,
          shape: payload.shape || "cube",
          rotationY: payload.rotationY || 0
        }
      });
      break;
      
    case "DELETE_DRAFT":
      dispatch({
        type: "DELETE_DRAFT",
        payload: { id: payload.id }
      });
      break;
      
    case "DELETE_CONFIRMED":
      dispatch({
        type: "DELETE_CONFIRMED",
        payload: { id: payload.id }
      });
      break;
      
    case "SET_MATERIAL":
      dispatch({
        type: "SET_MATERIAL",
        payload: payload.material
      });
      break;

    case "SET_SHAPE":
      dispatch({
        type: "SET_SHAPE",
        payload: payload.shape
      });
      break;
      
    case "CONFIRM_DRAFT":
      dispatch({
        type: "CONFIRM_DRAFT"
      });
      break;
      
    case "UNDO":
      dispatch({
        type: "UNDO"
      });
      break;
      
    case "COLLAPSE":
      dispatch({
        type: "COLLAPSE"
      });
      break;
      
    case "CANCEL_COLLAPSE":
      dispatch({
        type: "CANCEL_COLLAPSE"
      });
      break;

    case "LOAD_TEMPLATE":
      dispatch({
        type: "LOAD_TEMPLATE",
        payload: { cubes: payload.cubes }
      });
      break;

    case "LOAD_JSON":
      dispatch({
        type: "LOAD_JSON",
        payload: { cubes: payload.cubes }
      });
      break;

    case "CLEAR_SCENE":
      dispatch({
        type: "CLEAR_SCENE"
      });
      break;

    case "TOGGLE_STRESS_HEATMAP":
      dispatch({
        type: "TOGGLE_STRESS_HEATMAP"
      });
      break;

    case "TOGGLE_GRID":
      dispatch({
        type: "TOGGLE_GRID"
      });
      break;

    case "TOGGLE_AUTO_ROTATE":
      dispatch({
        type: "TOGGLE_AUTO_ROTATE"
      });
      break;

    case "PLACE_LINE_DRAFT":
      dispatch({
        type: "PLACE_LINE_DRAFT",
        payload: { cubes: payload.cubes }
      });
      break;

    case "SET_TOOL_MODE":
      dispatch({
        type: "SET_TOOL_MODE",
        payload: { toolMode: payload.toolMode }
      });
      break;

    case "SET_USER":
      dispatch({
        type: "SET_USER",
        payload: payload.user
      });
      break;
      
    default:
      console.warn(`Unknown action type: ${type}`);
  }
}

// Helper function for cube placement
export function createPlaceAction(position, material) {
  return {
    type: "PLACE_DRAFT",
    payload: {
      x: position[0],
      y: position[1],
      z: position[2],
      material: material
    }
  };
}

// Helper function for cube deletion
export function createDeleteAction(cubeId, status) {
  return {
    type: status === "draft" ? "DELETE_DRAFT" : "DELETE_CONFIRMED",
    payload: { id: cubeId }
  };
}

// Helper function for material change
export function createMaterialAction(material) {
  return {
    type: "SET_MATERIAL",
    payload: { material }
  };
}
