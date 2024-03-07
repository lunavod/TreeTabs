import { observer } from "mobx-react-lite";
import React, { useRef } from "react";
import themePresets from "../../utils/theme_presets";
import { ThemeModeSettings, ThemeSettings } from "../../utils/themes";
import { toJS } from "mobx";
import JSZip from "jszip";
import "./styles.module.css";

const ThemeSettingsUI = observer(
  ({
    themeSettings,
    setSettings,
    fieldsetName,
  }: {
    themeSettings: ThemeModeSettings;
    setSettings: (settings: ThemeModeSettings) => void;
    fieldsetName: string;
  }) => {
    const fileInput = useRef<HTMLInputElement>(null);

    const onSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const theme = e.target.value;
      const newSettings = { ...toJS(themeSettings) };
      newSettings.preset = theme;
      newSettings.mode = "preset";
      setSettings(newSettings);
    };

    const changeMode = (e: React.MouseEvent, mode: "preset" | "custom") => {
      const newSettings = { ...toJS(themeSettings) };
      newSettings.mode = mode;
      setSettings(newSettings);
    };

    const onInputFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const file = e.target.files[0];

      console.log(file.type);
      if (file.type.includes("zip")) {
        JSZip.loadAsync(file)
          .then((zip) => zip.files["settings.json"].async("text"))
          .then((content) => {
            const theme = JSON.parse(content) as ThemeSettings;
            const newSettings = { ...toJS(themeSettings) };
            newSettings.mode = "custom";
            newSettings.customThemeData = theme;
            setSettings(newSettings);
          });
      } else if (file.type.includes("json")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const theme = JSON.parse(e.target.result as string) as ThemeSettings;
          const newSettings = { ...toJS(themeSettings) };
          newSettings.mode = "custom";
          newSettings.customThemeData = theme;
          setSettings(newSettings);
        };
        reader.readAsText(file);
      }
    };

    const onCustomThemeClick = (e) => {
      e.preventDefault();
      fileInput.current.click();
    };

    const changeAccentMode = (mode: ThemeModeSettings["accentMode"]) => {
      const newSettings = { ...toJS(themeSettings) };
      newSettings.accentMode = mode;
      setSettings(newSettings);
    };

    return (
      <div styleName="wrapper">
        <div styleName="column">
          <h3>Select theme</h3>
          <label onClick={(e) => changeMode(e, "preset")}>
            <input
              type="radio"
              name={fieldsetName + "-mode"}
              value="preset"
              checked={themeSettings.mode === "preset"}
            />
            <span>Preset theme</span>
          </label>
          <div styleName="subContent">
            <div styleName="selectWrapper">
              <select onChange={onSelectChange} value={themeSettings.preset}>
                {Object.keys(themePresets).map((theme) => (
                  <option value={theme}>{themePresets[theme].name}</option>
                ))}
              </select>
            </div>
          </div>
          <label onClick={(e) => changeMode(e, "custom")}>
            <input
              type="radio"
              name={fieldsetName + "-mode"}
              value="custom"
              checked={themeSettings.mode === "custom"}
            />
            <span>Custom theme</span>
          </label>
          <div styleName="subContent">
            <div styleName="selectCustomWrapper">
              <input
                type="button"
                value="Select"
                onClick={onCustomThemeClick}
              />
              <span onClick={onCustomThemeClick}>Select theme file</span>
              <input
                ref={fileInput}
                type="file"
                onChange={onInputFileChange}
                accept="zip"
                styleName="customThemeInput"
              />
            </div>
          </div>
        </div>
        <div styleName="column">
          <h3>Tab accent mode</h3>
          <label>
            <input
              type="radio"
              name={fieldsetName + "-accentMode"}
              value="highlight"
              checked={themeSettings.accentMode === "highlight"}
              onChange={() => changeAccentMode("highlight")}
            />
            <span>Highlight (default)</span>
          </label>
          <label>
            <input
              type="radio"
              name={fieldsetName + "-accentMode"}
              value="accent"
              checked={themeSettings.accentMode === "accent"}
              onChange={() => changeAccentMode("accent")}
            />
            <span>Accent</span>
          </label>
          <label>
            <input
              type="radio"
              name={fieldsetName + "-accentMode"}
              value="accent"
              checked={themeSettings.accentMode === "bg"}
              onChange={() => changeAccentMode("bg")}
            />
            <span>Bg</span>
          </label>
        </div>
      </div>
    );
  }
);

export default ThemeSettingsUI;

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}
