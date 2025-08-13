import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { fabric } from "fabric";
import Toolbar from "./Toolbar";
import ShareButton from "./ShareButton";
import useCanvasState from "../hooks/useCanvasState";

class ErrorBoundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(e) {
    return { hasError: true, error: e };
  }
  componentDidCatch(e, info) {
    console.error("Canvas error:", e, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: "#b00020" }}>
          <h2>Something went wrong with the canvas.</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const GRID = 20;
const snap = (n) => Math.round(n / GRID) * GRID;
const stopDrawing = (c) => {
  if (c && c.isDrawingMode) c.isDrawingMode = false;
};

export default function CanvasEditor({ sceneId }) {
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const containerRef = useRef(null);

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [penOn, setPenOn] = useState(false);

  const measureWidth = () =>
    containerRef.current?.clientWidth ?? window.innerWidth;

  const drawGrid = useCallback((c) => {
    c.getObjects("line")
      .filter((l) => l.__isGrid)
      .forEach((l) => c.remove(l));
    const w = c.getWidth(),
      h = c.getHeight();
    const lines = [];
    for (let x = 0; x <= w; x += GRID) {
      const v = new fabric.Line([x, 0, x, h], {
        stroke: "#eee",
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      v.__isGrid = true;
      lines.push(v);
    }
    for (let y = 0; y <= h; y += GRID) {
      const hline = new fabric.Line([0, y, w, y], {
        stroke: "#eee",
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      hline.__isGrid = true;
      lines.push(hline);
    }
    c.add(...lines);
    lines.forEach((l) => c.sendToBack(l));
  }, []);

  const setCanvasSize = useCallback(
    (c) => {
      const w = measureWidth();
      const h = 600;
      c.setDimensions({ width: w, height: h });

      const el = c.getElement();
      el.style.width = "100%";
      el.style.height = `${h}px`;
      drawGrid(c);
      c.renderAll();
    },
    [drawGrid]
  );

  const viewOnly = useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("viewOnly") === "true";
  }, []);

  const { saveScene, loadScene, loading } = useCanvasState(sceneId, fabricRef);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || fabricRef.current) return;

    const c = new fabric.Canvas(el, {
      backgroundColor: "#fff",
      preserveObjectStacking: true,
      selection: !viewOnly,
    });

    fabricRef.current = c;
    window.__canvas = c;
    window.__fabric = fabric;

    setCanvasSize(c);

    if (viewOnly) {
      c.isDrawingMode = false;
      c.selection = false;
    }

    const onChange = () => saveScene();
    c.on("object:added", onChange);
    c.on("object:modified", onChange);
    c.on("object:removed", onChange);

    const onMoving = (e) => {
      const o = e?.target;
      if (!o) return;
      if (typeof o.left === "number") o.set({ left: snap(o.left) });
      if (typeof o.top === "number") o.set({ top: snap(o.top) });
    };
    c.on("object:moving", onMoving);

    (async () => {
      await loadScene(sceneId);
      drawGrid(c);
      c.renderAll();
      pushHistory(c, "init");
      setIsReady(true);
    })();

    const onResize = () => setCanvasSize(c);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      c.off("object:added", onChange);
      c.off("object:modified", onChange);
      c.off("object:removed", onChange);
      c.off("object:moving", onMoving);
      c.dispose();
      fabricRef.current = null;
      setIsReady(false);
    };
  }, [drawGrid, setCanvasSize, viewOnly, loadScene, saveScene]);

  useEffect(() => {
    if (fabricRef.current && sceneId) {
      (async () => {
        await loadScene(sceneId);
        drawGrid(fabricRef.current);
        fabricRef.current.renderAll();
      })();
    }
  }, [sceneId, loadScene, drawGrid]);

  const pushHistory = (c, label = "") => {
    const snap = c.toJSON(["excludeFromExport", "__isGrid"]);
    setUndoStack((prev) => {
      console.log("[history] push", label, "| undo:", prev.length + 1);
      return [...prev, snap];
    });
    setRedoStack([]);
  };

  const withCanvas = (fn) => {
    const c = fabricRef.current;
    if (!c || !isReady) {
      console.warn("Canvas not ready");
      return;
    }
    fn(c);
  };

  const addRectangle = () =>
    withCanvas((c) => {
      stopDrawing(c);
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 120,
        height: 80,
        fill: "royalblue",
      });
      c.add(rect);
      c.setActiveObject(rect);
      c.renderAll();
      pushHistory(c, "add-rect");
    });

  const addCircle = () =>
    withCanvas((c) => {
      stopDrawing(c);
      const circ = new fabric.Circle({
        left: 180,
        top: 160,
        radius: 50,
        fill: "seagreen",
      });
      c.add(circ);
      c.setActiveObject(circ);
      c.renderAll();
      pushHistory(c, "add-circle");
    });

  const addText = () =>
    withCanvas((c) => {
      stopDrawing(c);
      const txt = new fabric.Text("Hello, World!", {
        left: 240,
        top: 220,
        fontSize: 24,
      });
      c.add(txt);
      c.setActiveObject(txt);
      c.renderAll();
      pushHistory(c, "add-text");
    });

  const enablePenTool = () =>
    withCanvas((c) => {
      const next = !penOn;
      setPenOn(next);
      c.isDrawingMode = next;
      if (next && !c.freeDrawingBrush)
        c.freeDrawingBrush = new fabric.PencilBrush(c);
      c.renderAll();
    });

  const deleteObject = () =>
    withCanvas((c) => {
      const o = c.getActiveObject();
      if (!o) return;
      c.remove(o);
      stopDrawing(c);
      c.renderAll();
      pushHistory(c, "delete");
    });

  const editText = () =>
    withCanvas((c) => {
      let target = c.getActiveObject();
      if (!target || target.type !== "text") {
        target = c.getObjects().find((o) => o.type === "text");
      }
      if (!target) {
        const txt = new fabric.Text("New Text", {
          left: 240,
          top: 220,
          fontSize: 24,
        });
        c.add(txt);
        c.setActiveObject(txt);
        c.renderAll();
        pushHistory(c, "add-text (via edit)");
        return;
      }
      const next = window.prompt("Edit text:", target.text || "");
      if (next != null) {
        target.set({ text: next });
        stopDrawing(c);
        c.renderAll();
        pushHistory(c, "edit-text");
      }
    });

  const changeColor = () =>
    withCanvas((c) => {
      const o = c.getActiveObject();
      if (!o) return;
      o.set({ fill: "crimson" });
      stopDrawing(c);
      c.renderAll();
      pushHistory(c, "change-color");
    });

  const undo = () =>
    withCanvas((c) => {
      setUndoStack((u) => {
        if (!u.length) return u;
        const last = u[u.length - 1];
        setRedoStack((r) => [
          ...r,
          c.toJSON(["excludeFromExport", "__isGrid"]),
        ]);
        c.loadFromJSON(last, () => {
          drawGrid(c);
          stopDrawing(c);
          c.renderAll();
        });
        return u.slice(0, -1);
      });
    });

  const redo = () =>
    withCanvas((c) => {
      setRedoStack((r) => {
        if (!r.length) return r;
        const state = r[r.length - 1];
        setUndoStack((u) => [
          ...u,
          c.toJSON(["excludeFromExport", "__isGrid"]),
        ]);
        c.loadFromJSON(state, () => {
          drawGrid(c);
          stopDrawing(c);
          c.renderAll();
        });
        return r.slice(0, -1);
      });
    });

  const exportAsPNG = () =>
    withCanvas((c) => {
      const grid = c.getObjects("line").filter((l) => l.__isGrid);
      grid.forEach((l) => c.remove(l));
      const dataURL = c.toDataURL({ format: "png" });
      drawGrid(c);
      stopDrawing(c);
      c.renderAll();
      const a = document.createElement("a");
      a.href = dataURL;
      a.download = "canvas.png";
      a.click();
    });

  const exportAsSVG = () =>
    withCanvas((c) => {
      const grid = c.getObjects("line").filter((l) => l.__isGrid);
      grid.forEach((l) => c.remove(l));
      const svg = c.toSVG();
      drawGrid(c);
      stopDrawing(c);
      c.renderAll();
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "canvas.svg";
      a.click();
      URL.revokeObjectURL(url);
    });

  const loadTemplate = (name) =>
    withCanvas((c) => {
      stopDrawing(c);
      const s =
        name === "template1"
          ? new fabric.Rect({
              left: 100,
              top: 100,
              width: 200,
              height: 200,
              fill: "dodgerblue",
            })
          : new fabric.Circle({
              left: 320,
              top: 200,
              radius: 90,
              fill: "tomato",
            });
      c.add(s);
      c.setActiveObject(s);
      c.renderAll();
      pushHistory(c, "load-template");
    });

  const lockObject = () =>
    withCanvas((c) => {
      const o = c.getActiveObject();
      if (!o) return;
      o.lockMovementX = o.lockMovementY = true;
      o.lockScalingX = o.lockScalingY = true;
      o.lockRotation = true;
      stopDrawing(c);
      c.renderAll();
      pushHistory(c, "lock-object");
    });

  const unlockObject = () =>
    withCanvas((c) => {
      const o = c.getActiveObject();
      if (!o) return;
      o.lockMovementX = o.lockMovementY = false;
      o.lockScalingX = o.lockScalingY = false;
      o.lockRotation = false;
      stopDrawing(c);
      c.renderAll();
      pushHistory(c, "unlock-object");
    });

  return (
    <ErrorBoundary>
      <div ref={containerRef} className="container">
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.6)",
              zIndex: 1,
              pointerEvents: "none",
            }}
          >
            <div>Loading…</div>
          </div>
        )}

        <ShareButton sceneId={sceneId} />

        <Toolbar
          disabled={!isReady}
          penOn={penOn}
          addRectangle={addRectangle}
          addCircle={addCircle}
          addText={addText}
          enablePenTool={enablePenTool}
          deleteObject={deleteObject}
          editText={editText}
          changeColor={changeColor}
          saveState={() => pushHistory(fabricRef.current, "manual-save")}
          undo={undo}
          redo={redo}
          exportAsPNG={exportAsPNG}
          exportAsSVG={exportAsSVG}
          loadTemplate={loadTemplate}
          lockObject={lockObject}
          unlockObject={unlockObject}
        />

        <canvas ref={canvasRef} />
      </div>
    </ErrorBoundary>
  );
}
