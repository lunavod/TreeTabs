import { useState, useEffect } from "react";
import themePresets from "../../utils/theme_presets";
import ThemeHelper, { ThemeSettingsWrapper } from "../../utils/themes";
import { observer } from "mobx-react-lite";

const ThemeInjector = observer(
  ({
    incognito,
    darkBodyClass = null,
    themeSettings,
    accentModeClasses,
  }: {
    incognito: boolean;
    darkBodyClass?: string | null;
    themeSettings: ThemeSettingsWrapper;
    accentModeClasses?: { accent: string; highlight: string; bg: string };
  }) => {
    const [preset, setPrest] = useState(
      () =>
        themePresets[themeSettings[incognito ? "incognito" : "regular"].preset]
    );

    useEffect(() => {
      const mode = incognito ? "incognito" : "regular";
      if (themeSettings[mode].mode === "preset") {
        setPrest(themePresets[themeSettings[mode].preset]);
      } else if (themeSettings[mode].customThemeData) {
        setPrest(themeSettings[mode].customThemeData);
      }
    }, [themeSettings, incognito]);

    // const preset = themePresets[selectedTheme];
    const theme = ThemeHelper.forTheme(preset);
    const radiusInfo = ThemeHelper.getRadiusInfo(preset.radius, false);
    const css = [
      ...Object.entries(theme),
      ...Object.entries(radiusInfo),
    ].reduce((acc, [key, value]) => {
      return `${acc} --${key}: ${value};\n`;
    }, "");

    const accentMode =
      themeSettings[incognito ? "incognito" : "regular"].accentMode;

    const color = theme.colorBg;
    const isDark = lightOrDark(color) === "dark";

    useEffect(() => {
      if (!darkBodyClass) return;

      if (document.body.classList.contains(darkBodyClass)) {
        if (!isDark) {
          document.body.classList.remove(darkBodyClass);
        }
      } else {
        if (isDark) {
          document.body.classList.add(darkBodyClass);
        }
      }
    }, [isDark, darkBodyClass]);

    useEffect(() => {
      if (!accentModeClasses) return;

      if (document.body.classList.contains(accentModeClasses.accent)) {
        if (accentMode !== "accent") {
          document.body.classList.remove(accentModeClasses.accent);
        }
      } else {
        if (accentMode === "accent") {
          document.body.classList.add(accentModeClasses.accent);
        }
      }

      if (document.body.classList.contains(accentModeClasses.highlight)) {
        if (accentMode !== "highlight") {
          document.body.classList.remove(accentModeClasses.highlight);
        }
      } else {
        if (accentMode === "highlight") {
          document.body.classList.add(accentModeClasses.highlight);
        }
      }

      if (document.body.classList.contains(accentModeClasses.bg)) {
        if (accentMode !== "bg") {
          document.body.classList.remove(accentModeClasses.bg);
        }
      } else {
        if (accentMode === "bg") {
          document.body.classList.add(accentModeClasses.bg);
        }
      }
    }, [accentModeClasses, accentMode]);

    return (
      <div style={{ display: "none" }}>
        <style>{`
        :root {
          ${css}
        }
      `}</style>
      </div>
    );
  }
);

export default ThemeInjector;

function lightOrDark(color) {
  // Check the format of the color, HEX or RGB?
  let r, g, b;
  if (color.match(/^rgb/)) {
    // If HEX --> store the red, green, blue values in separate variables
    color = color.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
    );

    r = color[1];
    g = color[2];
    b = color[3];
  } else {
    // If RGB --> Convert it to HEX: http://gist.github.com/983661
    color = +("0x" + color.slice(1).replace(color.length < 5 && /./g, "$&$&"));

    r = color >> 16;
    g = (color >> 8) & 255;
    b = color & 255;
  }

  // HSP equation from http://alienryderflex.com/hsp.html
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

  // Using the HSP value, determine whether the color is light or dark
  if (hsp > 127.5) {
    return "light";
  } else {
    return "dark";
  }
}
