import React, { useEffect, useRef } from "react";

export default function Messages({ messages }) {
  const el = useRef(null);
  useEffect(() => {
    el.current.scrollIntoView({ block: "end", behavior: "smooth" });
  });
  return (
    <div className="w-full h-[570px] overflow-auto flex flex-col py-2">
      {messages}
      <div id={"el"} ref={el} />
    </div>
  );
}
