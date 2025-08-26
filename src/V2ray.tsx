import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./V2ray.css";

interface V2rayService {
  startV2ray: () => Promise<string>;
  stopV2ray: () => Promise<string>;
}

export const useV2ray = (): V2rayService => {
  const startV2ray = async (): Promise<string> => {
    try {
      const result = await invoke<string>('start_v2ray');
      console.log('V2ray started:', result);
      return result;
    } catch (error) {
      console.error('Failed to start V2ray:', error);
      throw error;
    }
  };

  const stopV2ray = async (): Promise<string> => {
    try {
      const result = await invoke<string>('stop_v2ray');
      console.log('V2ray stopped:', result);
      return result;
    } catch (error) {
      console.error('Failed to stop V2ray:', error);
      throw error;
    }
  };

  return { startV2ray, stopV2ray };
};

function App() {
  const { startV2ray, stopV2ray } = useV2ray();
  const [isRunning, setIsRunning] = useState(false);

  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  const handleStart = async () => {
    try {
      await startV2ray();
      setIsRunning(true);
    } catch (error) {
      alert(`启动失败: ${error}`);
    }
  };

  const handleStop = async () => {
    try {
      await stopV2ray();
      setIsRunning(false);
    } catch (error) {
      alert(`停止失败: ${error}`);
    }
  };

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>
      <div>
        <button onClick={handleStart} disabled={isRunning}>
          启动 V2ray
        </button>
        <button onClick={handleStop} disabled={!isRunning}>
          停止 V2ray
        </button>
        <p>状态: {isRunning ? '运行中' : '已停止'}</p>
      </div>
      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;
