import React from "react";

export default function ShareButton({ sceneId }) {
  const onShare = async () => {
    const url = `${window.location.origin}${
      window.location.pathname
    }?sceneId=${encodeURIComponent(sceneId || "")}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Share link copied:\n" + url);
    } catch {
      prompt("Copy this link:", url);
    }
  };

  return (
    <button className="share-button" onClick={onShare}>
      Share Canvas
    </button>
  );
}
