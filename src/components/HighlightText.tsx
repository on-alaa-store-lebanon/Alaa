import React from "react";

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({ text, query, className = "" }) => {
  const safeText = typeof text === "string" ? text : String(text || "");
  if (!query || !query.trim() || !safeText) {
    return <span className={className}>{safeText}</span>;
  }

  const cleanQuery = query.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"); // Escape regex chars
  const regex = new RegExp(`(${cleanQuery})`, "gi");
  const parts = safeText.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="bg-yellow-100 text-[#0F172A] rounded px-0.5 font-bold animate-fade-in"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};
