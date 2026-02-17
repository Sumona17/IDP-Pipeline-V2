import { useLayoutEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  maxFontSize?: number;
  minFontSize?: number;
};

export const EditableLabel = ({
  value,
  onChange,
  maxFontSize = 14,
  minFontSize = 9
}: Props) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [fontSize, setFontSize] = useState(maxFontSize);
  const [isEditing, setIsEditing] = useState(false);

  /* ---------------- Auto font shrink ---------------- */

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    const wrapper = wrapperRef.current;
    if (!textarea || !wrapper) return;

    let size = maxFontSize;
    textarea.style.fontSize = `${size}px`;
    textarea.style.height = "auto";

    while (
      textarea.scrollHeight > wrapper.clientHeight &&
      size > minFontSize
    ) {
      size -= 1;
      textarea.style.fontSize = `${size}px`;
    }

    setFontSize(size);
  }, [value, maxFontSize, minFontSize]);

  /* ---------------- Focus on edit ---------------- */

  useLayoutEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing]);

  return (
    <div
      ref={wrapperRef}
      onDoubleClick={(e) => {
        e.stopPropagation();   // ⛔ prevent node drag
        setIsEditing(true);
      }}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isEditing ? "text" : "pointer"
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        readOnly={!isEditing}     // ✅ key behavior
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        spellCheck={false}
        style={{
          fontSize,
          resize: "none",
          overflow: "hidden",
          background: "transparent",
          border: "none",
          outline: "none",
          width: "100%",
          maxHeight: "100%",
          textAlign: "center",
          lineHeight: 1.25,
          fontWeight: 500,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          boxSizing: "border-box",
          pointerEvents: isEditing ? "auto" : "none" // 👈 critical
        }}
      />
    </div>
  );
};
