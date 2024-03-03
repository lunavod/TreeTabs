import { useState, useEffect } from "react";
import { TabsApi, ApiContext } from "../../api";
import ThemeInjector from "../ThemeInjector";
import TabsApp from "../TabsApp";

function TabsAppContainer() {
  const [extensionId, setExtensionId] = useState<string>("");
  const [api, setApi] = useState<TabsApi | null>(null);
  const [incognito, setIncognito] = useState<boolean>(false);

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

      if (api) {
        api.changeExtensionId(newId);
        api.checkIncognito().then(setIncognito);
      } else {
        const newApi = new TabsApi(newId);
        setApi(newApi);
        newApi.checkIncognito().then(setIncognito);
      }
    });
    observer.observe(document.querySelector("#extension-id-container"), {
      attributes: true,
    });

    return () => observer.disconnect();
  }, []);

  if (!api) return <div>Loading...</div>;

  return (
    <ApiContext.Provider value={api}>
      <ThemeInjector incognito={incognito} />
      <TabsApp />
    </ApiContext.Provider>
  );
}

export default TabsAppContainer;
