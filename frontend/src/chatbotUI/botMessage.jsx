import React, { useState, useEffect } from "react";

export default function BotMessage({ fetchMessage }) {
  const [isLoading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadMessage() {
      const msg = await fetchMessage();
      setLoading(false);
      setMessage(msg);
    }
    loadMessage();
  }, [fetchMessage]);

  return (
    <div className="message-container">
      <div className="float-left p-4 m-1 min-w-[40px] rounded-[20px_20px_20px_1px] bg-[#00aaa5] text-white">{isLoading ? "..." : message}</div>
    </div>
  );
}
