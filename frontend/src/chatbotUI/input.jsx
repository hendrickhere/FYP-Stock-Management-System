import React, { useState } from "react";

export default function Input({ onSend }) {
  const [text, setText] = useState("");

  const handleInputChange = e => {
    setText(e.target.value);
  };

  const handleSend = e => {
    e.preventDefault();
    onSend(text);
    setText("");
  };

  return (
    <div className="relative">
      <form onSubmit={handleSend}>
        <input
          type="text"
          onChange={handleInputChange}
          className="w-full p-4 pl-2 ml-2 mr-5 pr-14 text-lg font-mono border-t border-[#eee] rounded-b-lg"
          value={text}
          placeholder="Enter your message here"
        />
        <button className="absolute right-0 top-0 p-4 bg-transparent border-0">
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 500 500"
          >
            <g>
              <g>
                <polygon points="0,497.25 535.5,267.75 0,38.25 0,216.75 382.5,267.75 0,318.75" />
              </g>
            </g>
          </svg>
        </button>
      </form>
    </div>
  );
}
