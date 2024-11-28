const { useState } = require("react");

const TooltipValue = ({ label, value, tooltipContent }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex flex-col">
      <p className="text-gray-500 text-sm">{label}</p>
      <div className="relative">
        <p
          className="text-right cursor-help"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <span className={label === "Discount" ? "text-red-600" : ""}>
            {label === "Discount" ? "- " : ""}
            {value}
          </span>
        </p>

        {showTooltip && tooltipContent && (
          <div
            className="absolute z-[999] bg-white border rounded-lg shadow-lg right-0 bottom-full mb-1"
            style={{ minWidth: "180px" }}
          >
            <div className="p-2">{tooltipContent}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TooltipValue;
