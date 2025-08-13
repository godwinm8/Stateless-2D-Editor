import React from "react";
import "../styles.css"

export default function Toolbar({
  disabled = false,
  penOn,
  addRectangle,
  addCircle,
  addText,
  enablePenTool,
  deleteObject,
  editText,
  changeColor,
  undo,
  redo,
  exportAsPNG,
  exportAsSVG,
  loadTemplate,
  lockObject,
  unlockObject,
}) {
  const click = (label, fn) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    console.log(`[Toolbar] ${label} clicked`);
    if (typeof fn === "function") fn();
  };

  const btn = (label, fn) => ({
    type: "button",
    onClick: click(label, fn),
    disabled,
  });

  return (
    <div
      className="toolbar"
      style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: 12 }}
    >
      <button {...btn("Rectangle", addRectangle)}>Rectangle</button>
      <button {...btn("Circle", addCircle)}>Circle</button>
      <button {...btn("Text", addText)}>Text</button>

      <button {...btn("Pen", enablePenTool)} aria-pressed={!!penOn}>
        {penOn ? "Pen (On)" : "Pen"}
      </button>

      <button {...btn("Edit Text", editText)}>Edit Text</button>
      <button {...btn("Change Color", changeColor)}>Change Color</button>
      <button {...btn("Delete", deleteObject)}>Delete</button>
      <button {...btn("Undo", undo)}>Undo</button>
      <button {...btn("Redo", redo)}>Redo</button>
      <button {...btn("Export PNG", exportAsPNG)}>Export PNG</button>
      <button {...btn("Export SVG", exportAsSVG)}>Export SVG</button>
      <button {...btn("Template 1", () => loadTemplate?.("template1"))}>
        Template 1
      </button>
      <button {...btn("Template 2", () => loadTemplate?.("template2"))}>
        Template 2
      </button>
      <button {...btn("Lock", lockObject)}>Lock</button>
      <button {...btn("Unlock", unlockObject)}>Unlock</button>
    </div>
  );
}
