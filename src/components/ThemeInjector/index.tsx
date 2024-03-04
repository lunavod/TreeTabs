import { useState, useEffect } from "react";
import themePresets from "../../utils/theme_presets";
import ThemeHelper from "../../utils/themes";
import { observer } from "mobx-react-lite";

const ThemeInjector = observer(({ incognito }: { incognito: boolean }) => {
  const [selectedTheme, setSelectedTheme] = useState(
    incognito ? "private" : "dark"
  );
  useEffect(() => {
    setSelectedTheme(incognito ? "private" : "dark");
  }, [incognito]);

  const preset = themePresets[selectedTheme];
  const theme = ThemeHelper.forTheme(preset);
  const css = Object.entries(theme).reduce((acc, [key, value]) => {
    return `${acc} --${key}: ${value};\n`;
  }, "");

  return (
    <div style={{ display: "none" }}>
      <style>{`
        :root {
          ${css}
        }
      `}</style>
    </div>
  );
});

export default ThemeInjector;
