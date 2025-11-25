interface ActionButtonProps {
  title: string;
  subtitle: string;
  onClick: () => void;
}

export const ActionButton = ({
  title,
  subtitle,
  onClick,
}: ActionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full max-w-sm p-4 mb-4 bg-stone-800 hover:bg-stone-700 rounded-xl transition text-left"
    >
      <div className="font-bold text-lg text-white">{title}</div>
      <div className="text-stone-400 text-xs">{subtitle}</div>
    </button>
  );
};
