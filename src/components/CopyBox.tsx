import { useRef, useState } from "react";

interface CopyBoxProps {
  label: string;
  value: string;
  readOnly?: boolean;
  onPaste?: (val: string) => void;
}

export const CopyBox = ({
  label,
  value,
  readOnly = true,
  onPaste,
}: CopyBoxProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");

  const handleConfirm = () => {
    if (onPaste) {
      onPaste(draft.trim());
    }
  };

  return (
    <div className="w-full mb-6">
      <label className="block text-xs font-bold mb-2 text-accent uppercase tracking-wider">
        {label}
      </label>

      <div className="relative group">
        <textarea
          ref={inputRef}
          className="w-full h-32 p-4 bg-stone-950 border border-stone-700 rounded-xl text-xs font-mono text-stone-300 focus:border-accent focus:ring-1 focus:ring-accent resize-none outline-none transition-all"
          value={readOnly ? value : draft}
          readOnly={readOnly}
          onChange={!readOnly ? (e) => setDraft(e.target.value) : undefined}
          placeholder={
            !readOnly
              ? "Paste connection code here..."
              : "Waiting for generation..."
          }
        />
      </div>

      {!readOnly && onPaste && (
        <button
          onClick={handleConfirm}
          className="mt-2 w-full bg-stone-200 text-stone-900 text-xs font-bold px-4 py-2 rounded-lg hover:bg-white transition-all"
        >
          Confirm
        </button>
      )}
    </div>
  );
};
