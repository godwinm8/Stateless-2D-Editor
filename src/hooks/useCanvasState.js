import { useState, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import debounce from "lodash.debounce";

const waitForCanvas = (fabricRef) =>
  new Promise((resolve) => {
    const tick = () => (fabricRef.current ? resolve() : setTimeout(tick, 30));
    tick();
  });

const useCanvasState = (sceneId, fabricRef) => {
  const [loading, setLoading] = useState(false);

  const loadScene = useCallback(
    async (id) => {
      if (!id) return;
      setLoading(true);
      try {
        await waitForCanvas(fabricRef);
        const snap = await getDoc(doc(db, "scenes", id));
        if (snap.exists()) {
          const data = snap.data()?.data;
          if (data) {
            fabricRef.current.loadFromJSON(data, () => {
              fabricRef.current.renderAll();
            });
          }
        }
      } catch (e) {
        console.error("Error loading scene:", e);
      } finally {
        setLoading(false);
      }
    },
    [fabricRef]
  );

  const saveScene = useCallback(
    debounce(async () => {
      try {
        if (!fabricRef.current || !sceneId) return;
        const json = fabricRef.current.toJSON([
          "excludeFromExport",
          "__isGrid",
        ]);

        json.objects = (json.objects || []).filter(
          (o) => !o.__isGrid && !o.excludeFromExport
        );
        await setDoc(doc(db, "scenes", sceneId), {
          data: json,
          updatedAt: Date.now(),
        });
      } catch (e) {
        console.error("Error saving scene:", e);
      }
    }, 800),
    [fabricRef, sceneId]
  );

  return { loadScene, saveScene, loading };
};

export default useCanvasState;
