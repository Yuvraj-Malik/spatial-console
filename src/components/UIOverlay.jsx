import { MATERIALS } from "../simulation/materials.js";

export default function UIOverlay({ 
  currentMaterial, 
  onMaterialChange, 
  onConfirm, 
  onUndo,
  draftCount,
  confirmedCount,
  collapseState,
  onCancelCollapse
}) {
  return (
    <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 text-white max-w-sm">
      {/* Material Selection */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-300">Material</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(MATERIALS).map(([key, material]) => (
            <button
              key={key}
              onClick={() => onMaterialChange(material)}
              className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                currentMaterial.name === material.name
                  ? "bg-blue-600 text-white ring-2 ring-blue-400"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              style={{
                borderLeft: `4px solid ${material.color}`
              }}
            >
              {material.name}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-300">Status</h3>
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Draft cubes:</span>
            <span className="font-mono">{draftCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Confirmed:</span>
            <span className="font-mono">{confirmedCount}</span>
          </div>
        </div>
      </div>

      {/* Collapse Warning */}
      {collapseState.warningActive && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded">
          <h3 className="text-sm font-semibold mb-2 text-red-300">
            ⚠️ Structural Instability Detected!
          </h3>
          <p className="text-xs text-red-200 mb-2">
            {collapseState.unstableIds.length} cubes will collapse in {collapseState.countdown}s
          </p>
          <div className="w-full bg-red-950 rounded-full h-2 mb-3">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(collapseState.countdown / 3) * 100}%` }}
            />
          </div>
          <button
            onClick={onCancelCollapse}
            className="w-full px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-all"
          >
            Cancel Collapse
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={onConfirm}
          disabled={draftCount === 0}
          className={`w-full px-4 py-2 rounded font-medium text-sm transition-all ${
            draftCount === 0
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          Confirm Structure ({draftCount})
        </button>
        
        <button
          onClick={onUndo}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded font-medium text-sm hover:bg-gray-700 transition-all"
        >
          Undo (Ctrl+Z)
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <h3 className="text-xs font-semibold mb-1 text-gray-400">Controls</h3>
        <div className="text-xs text-gray-500 space-y-1">
          <div>• Left click ground → Place cube</div>
          <div>• Left click cube → Place adjacent</div>
          <div>• Right click cube → Delete</div>
          <div>• Ctrl+Z → Undo</div>
        </div>
      </div>
    </div>
  );
}
