import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyButtonProps {
  value: string;
  className?: string;
}

export const CopyButton = ({ value, className }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex justify-center items-center gap-1.5 text-xs font-bold w-full px-3 py-3 rounded-lg bg-stone-200 text-stone-900 hover:bg-white transition-all ${className ?? ""}`}
      disabled={!value}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
};
