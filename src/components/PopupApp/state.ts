import { makeAutoObservable, runInAction } from "mobx";
import { TabsApi } from "../../api";
import { ThemeSettingsWrapper, DefaultThemeSettings } from "../../utils/themes";
import { run } from "node:test";

class PopupAppState {
  api: TabsApi;

  settings: ThemeSettingsWrapper = DefaultThemeSettings;
  incognito = false;

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

  setSettings(settings: ThemeSettingsWrapper) {
    this.settings = settings;
    this.api.setThemeSettings(settings);
  }
}

export default PopupAppState;
