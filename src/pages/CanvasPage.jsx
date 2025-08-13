import { useMemo } from "react";
import React from "react";
import { v4 as uuid } from "uuid";
import CanvasEditor from "../components/CanvasEditor";

export default function CanvasPage() {
  const sceneId = useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("id") || uuid();
  }, []);
  return <CanvasEditor sceneId={sceneId} />;
}
