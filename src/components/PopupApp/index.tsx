import { observer } from "mobx-react-lite";
import ThemeInjector from "../ThemeInjector";
import styles from "./styles.module.css";
import themePresets from "../../utils/theme_presets";
import { useState } from "react";
import { TabsApi } from "../../api";
import PopupAppState from "./state";
import { toJS } from "mobx";
import ThemeSettingsUI from "../ThemeSettingsUI";

const PopupApp = observer(() => {
  const [api] = useState(() => new TabsApi(chrome.runtime.id));
  const [state] = useState(() => new PopupAppState(api));

  return (
    <>
      <ThemeInjector
        incognito={state.incognito}
        darkBodyClass={styles.themeDark}
        themeSettings={state.settings}
      />
      <div styleName="root">
        <div styleName="sidebar">
          <div styleName="tab selected">Themes</div>
          <div styleName="tab">Features</div>
        </div>
        <div styleName="content">
          <h2>Regular</h2>
          <ThemeSettingsUI
            fieldsetName="regular"
            themeSettings={state.settings.regular}
            setSettings={(settings) => {
              state.setSettings({ ...state.settings, regular: settings });
            }}
          />
          <h2>Incognito</h2>
          <ThemeSettingsUI
            fieldsetName="incognito"
            themeSettings={state.settings.incognito}
            setSettings={(settings) => {
              state.setSettings({ ...state.settings, incognito: settings });
            }}
          />
        </div>
      </div>
    </>
  );
});

export default PopupApp;
