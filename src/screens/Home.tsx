import { useContext } from "react";
import { GlobalContext } from "../context/GlobalContext";
import { ActionButton } from "../components/ActionButton";
import { AdvancedSettings } from "../components/AdvancedSettings";

export const HomeScreen = () => {
  const { setMode, createConnection } = useContext(GlobalContext);

  const handleCreate = () => {
    createConnection("HOST");
    setMode("HOST");
  };

  const handleJoin = () => {
    setMode("SLAVE");
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6 bg-stone-900">
      <ActionButton
        title="Create New Chat"
        subtitle="Become a host and invite a friend"
        onClick={handleCreate}
      />

      <ActionButton
        title="Join Existing"
        subtitle="Enter an invitation code"
        onClick={handleJoin}
      />

      <AdvancedSettings />
    </div>
  );
};
