import { useState, useEffect } from "react";
import { TabsApi } from "../../api";
import ThemeInjector from "../ThemeInjector";
import TabsApp from "../TabsApp";
import TabsAppState, { GlobalStateContext } from "../../state";
import { observer } from "mobx-react-lite";
import styles from "./styles.module.css";

const TabsAppContainer = observer(() => {
  const [extensionId, setExtensionId] = useState<string>("");
  const [incognito, setIncognito] = useState<boolean>(false);
  const [state, setState] = useState<TabsAppState | null>(null);

  const getExtensionId = () => {
    const container = document.querySelector("#extension-id-container");
    if (!container || !(container instanceof HTMLElement)) {
      console.error("No extension id container found");
      return;
    }

    const extensionId = container.dataset.extensionId;
    if (!extensionId) {
      console.error("No extension id found");
      return;
    }

    return extensionId;
  };

  useEffect(() => {
    document.querySelector("#extension-id-container");
    const observer = new MutationObserver(() => {
      console.warn("Extension id container changed", getExtensionId());
      const newId = getExtensionId();
      if (newId === extensionId) return;

      setExtensionId(newId);

      if (state) {
        state.api.changeExtensionId(newId);
        state.api.checkIncognito().then(setIncognito);
      } else {
        const newState = new TabsAppState(new TabsApi(newId));
        newState.api.checkIncognito().then(setIncognito);
        setState(newState);
      }
    });
    observer.observe(document.querySelector("#extension-id-container"), {
      attributes: true,
    });

    return () => observer.disconnect();
  }, [extensionId, state]);

  if (!state) return <div>Loading...</div>;

  return (
    <GlobalStateContext.Provider value={state}>
      <ThemeInjector
        incognito={incognito}
        themeSettings={state.themeSettings}
        darkBodyClass={styles.darkTheme}
        accentModeClasses={{
          accent: styles.modeAccent,
          highlight: styles.modeHighlight,
          bg: styles.modeBg,
        }}
      />
      <TabsApp />
    </GlobalStateContext.Provider>
  );
});

export default TabsAppContainer;
