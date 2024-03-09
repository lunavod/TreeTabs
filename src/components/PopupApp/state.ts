import { makeAutoObservable, runInAction } from "mobx";
import { TabsApi } from "../../api";
import { ThemeSettingsWrapper, DefaultThemeSettings } from "../../utils/themes";
import { FeatureToggles } from "../../background_types";

class PopupAppState {
  api: TabsApi;

  settings: ThemeSettingsWrapper = DefaultThemeSettings;
  featureToggles: FeatureToggles = { previews: true };
  incognito = false;
  activeTab: "themes" | "features" | "help" = "themes";

  constructor(api: TabsApi) {
    makeAutoObservable(this);
    this.api = api;
    this.api.getThemeSettings().then((settings) =>
      runInAction(() => {
        console.log("Updated settings", settings);
        this.settings = settings;
      })
    );

    this.api
      .checkIncognito()
      .then((incognito) => runInAction(() => (this.incognito = incognito)));
  }

  setActiveTab(tab: PopupAppState["activeTab"]) {
    this.activeTab = tab;
  }

  setSettings(settings: ThemeSettingsWrapper) {
    this.settings = settings;
    this.api.setThemeSettings(settings);
  }

  setFeatureToggles(toggles: FeatureToggles) {
    this.featureToggles = toggles;
    this.api.setFeatureToggles(toggles);
  }
}

export default PopupAppState;
