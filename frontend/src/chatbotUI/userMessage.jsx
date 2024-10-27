import React from "react";

export default function UserMessage({ text }) {
  return (
    <div className="message-container">
      <div className="float-right p-4 m-2 rounded-[20px_20px_1px_20px] bg-[#cccccc] text-black">{text}</div>
    </div>
  );
}
