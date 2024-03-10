import { useState, useEffect } from "react";
import { TabsApi } from "../../api";
import ThemeInjector from "../ThemeInjector";
import TabsApp from "../TabsApp";
import TabsAppState, { GlobalStateContext } from "../../state";
import { observer } from "mobx-react-lite";
import styles from "./styles.module.css";

const TabsAppContainer = observer(() => {
  const [incognito, setIncognito] = useState<boolean>(false);
  const [state] = useState<TabsAppState>(() => new TabsAppState(new TabsApi()));

  useEffect(() => {
    state.api.checkIncognito().then(setIncognito);
  }, [state]);

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
