import { v4 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Home() {
  const nav = useNavigate();
  useEffect(() => {
    const id = uuid();
    nav(`/canvas/${id}`, { replace: true });
  }, []);
  return null;
}
