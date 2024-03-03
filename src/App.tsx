import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import TabsApp from "./Tabs";
import ThemeHelper from "./utils/themes";
import themePresets from "./utils/theme_presets";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <TabsApp />
    </>
  );
}

export default App;
