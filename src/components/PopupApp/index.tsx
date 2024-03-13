import { observer } from "mobx-react-lite";
import ThemeInjector from "../ThemeInjector";
import styles from "./styles.module.css";
import { useState } from "react";
import { TabsApi } from "../../api";
import PopupAppState from "./state";
import ThemeSettingsUI from "../ThemeSettingsUI";
import clsx from "clsx";

const PopupApp = observer(() => {
  const [api] = useState(() => new TabsApi());
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
          <div
            onClick={() => state.setActiveTab("help")}
            className={clsx(
              styles.tab,
              state.activeTab === "help" && styles.selected
            )}
          >
            Help
          </div>
        </div>
        {state.activeTab === "help" && (
          <div styleName="content">
            <h2>Installation</h2>
            <ol>
              <li>
                Copy url:{" "}
                <code>https://tree-tabs-front.vercel.app/container</code>
                <div styleName="small">
                  That website is just a container for the extension - we can't
                  use bundled html file, because it won't open in incognito
                  mode.
                  <br />
                  Website itself does not contain any scripts that would work
                  with your tabs, it's just a container for the extensions's
                  content script.
                  <br />
                  That page uses client-side caching, so it should open even if
                  you're offline.
                </div>
              </li>
              <li>Press "+" button on the side panel and paste the address</li>
              <li>
                <span styleName="optional">(Optional)</span> To hide panel
                title, right-click near the home button on the panel, select
                "Navigation Controls" -{">"} "Hide"
              </li>
              <li>
                <span styleName="optional">(Optional)</span> To allow extension
                to work in incognito mode, find the extension in the extensions
                list, click on "Details", and enable "Allow in incognito".
                <br />
                After that, right-click on the extension panel, and press
                "reload". Or restart the browser.
              </li>
              <li>
                <span styleName="optional">(Optional)</span> Hide native browser
                tab bar: open settings, go to "Tabs", and uncheck "Show Tab Bar"
                option
              </li>
              <li>
                <span styleName="optional">(Optional)</span> Disable ad blocking
                for this domain - click on the shield icon in the address bar,
                and select "No Blocking"
                <div styleName="small">
                  With blocking enabled, some favicons might not load, for
                  example from reddit.com
                  <br />
                  This website does not contain any ads or trackers, so it's
                  safe to disable blocking here.
                </div>
              </li>
            </ol>
            <h2>Themes</h2>
            <p>
              In this popup, you can change the theme of the extension to match
              your browser's theme. All default themes are included, and you can
              also import your own themes.
            </p>
            <p>
              Accent mode changed color of the active tab. Different themes look
              better with different accent modes, but highlight is the most
              versatile.
            </p>
            <p>
              For custom themes, you need to select a zip file you exported from
              vivaldi theme settings. JSON file from the archive will also work.
            </p>
            <h2>Features</h2>
            <p>
              In the features menu, you can enable or disable some features of
              this extension if you experience any issues. Some may be unstable,
              as this extension is still in beta.
            </p>
          </div>
        )}
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
            <div styleName="subContent small">
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
          </div>
        )}
      </div>
    </>
  );
});

export default PopupApp;
