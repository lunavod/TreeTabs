import { observer } from "mobx-react-lite";
import ThemeInjector from "../ThemeInjector";
import styles from "./styles.module.css";
import themePresets from "../../utils/theme_presets";
import { useState } from "react";
import { TabsApi } from "../../api";
import PopupAppState from "./state";
import { toJS } from "mobx";
import ThemeSettingsUI from "../ThemeSettingsUI";
import clsx from "clsx";

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
          <div
            onClick={() => state.setActiveTab("themes")}
            className={clsx(
              styles.tab,
              state.activeTab === "themes" && styles.selected
            )}
          >
            Themes
          </div>
          <div
            onClick={() => state.setActiveTab("features")}
            className={clsx(
              styles.tab,
              state.activeTab === "features" && styles.selected
            )}
          >
            Features
          </div>
        </div>
        {state.activeTab === "features" && (
          <div styleName="content">
            <h2>Feature toggles</h2>
            <label>
              <input
                type="checkbox"
                checked={state.featureToggles.previews}
                onChange={(e) =>
                  state.setFeatureToggles({
                    ...state.featureToggles,
                    previews: e.target.checked,
                  })
                }
              />
              Previews
            </label>
            <div styleName="subContent">
              Vivaldi currently does not allow to get previews from the
              extension, so this feature uses a workaround that captures the tab
              when you open it, and uses that image as a preview. This could
              POSSIBLY cause performance issues, although none have been
              reported so far.
            </div>
          </div>
        )}
        {state.activeTab === "themes" && (
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
            <h2>Help</h2>
            <p>
              Accent mode changed color of the active tab. Different themes look
              better with different accent modes, but highlight is the most
              versatile.
            </p>
            <p>
              For custom themes, you need to select a zip file you exported from
              vivaldi theme settings. JSON file from the archive will also work.
            </p>
          </div>
        )}
      </div>
    </>
  );
});

export default PopupApp;
