import { useState } from "react";
import { useStunStore } from "../stores/useStunStore";
import { ChevronRight } from "lucide-react";

export const AdvancedSettings = () => {
  const { config, setConfig, resetToDefaults } = useStunStore();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [stunUrl, setStunUrl] = useState(config.iceServers[0]?.urls || "");
  const [turnUrl, setTurnUrl] = useState(config.iceServers[1]?.urls || "");
  const [turnUsername, setTurnUsername] = useState(config.iceServers[1]?.username || "");
  const [turnCredential, setTurnCredential] = useState(config.iceServers[1]?.credential || "");

  const handleSave = () => {
    setConfig({
      iceServers: [
        { urls: stunUrl },
        {
          urls: turnUrl,
          username: turnUsername,
          credential: turnCredential,
        },
      ],
    });
  };

  const handleReset = () => {
    resetToDefaults();
    const defaultConfig = useStunStore.getState().config;
    setStunUrl(defaultConfig.iceServers[0]?.urls || "");
    setTurnUrl(defaultConfig.iceServers[1]?.urls || "");
    setTurnUsername(defaultConfig.iceServers[1]?.username || "");
    setTurnCredential(defaultConfig.iceServers[1]?.credential || "");
  };

  return (
    <div className="w-full max-w-md mt-8 bg-stone-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full px-4 py-3 flex items-center justify-between text-stone-200 hover:bg-stone-700 transition-colors"
      >
        <span className="font-medium">Advanced Settings</span>
        <div className={`transition-transform duration-200 ${showAdvanced ? "rotate-90" : ""}`}>
          <ChevronRight size={20} />
        </div>
      </button>

      <div
        className={`
          grid transition-all duration-300 ease-in-out
          ${showAdvanced ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}
        `}
      >
        <div className="overflow-hidden">
          <div className="p-5 space-y-4 border-t border-stone-700">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">
                STUN Server URL
              </label>
              <input
                type="text"
                value={stunUrl}
                onChange={(e) => setStunUrl(e.target.value)}
                className="w-full px-4 py-2 bg-stone-900 border border-stone-600 rounded text-stone-200 focus:outline-none focus:border-sky-500"
                placeholder="stun:server:port"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">
                TURN Server URL
              </label>
              <input
                type="text"
                value={turnUrl}
                onChange={(e) => setTurnUrl(e.target.value)}
                className="w-full px-4 py-2 bg-stone-900 border border-stone-600 rounded text-stone-200 focus:outline-none focus:border-sky-500"
                placeholder="turn:server:port?transport=tcp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">
                TURN Username
              </label>
              <input
                type="text"
                value={turnUsername}
                onChange={(e) => setTurnUsername(e.target.value)}
                className="w-full px-4 py-2 bg-stone-900 border border-stone-600 rounded text-stone-200 focus:outline-none focus:border-sky-500"
                placeholder="Username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">
                TURN Credential
              </label>
              <input
                type="password"
                value={turnCredential}
                onChange={(e) => setTurnCredential(e.target.value)}
                className="w-full px-4 py-2 bg-stone-900 border border-stone-600 rounded text-stone-200 focus:outline-none focus:border-sky-500"
                placeholder="Credential"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded font-medium transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-stone-600 hover:bg-stone-500 text-white rounded font-medium transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
