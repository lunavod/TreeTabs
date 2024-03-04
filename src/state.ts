import { makeAutoObservable, runInAction, toJS } from "mobx";
import { TabsApi, VivaldiTab } from "./api";
import { createContext, useContext } from "react";

class TabsAppState {
  api: TabsApi;
  // `__tabs` represents the full list of tabs in the current window.
  // It should only be accessed through the `tabs` getter, which filters out panels and tabs without id.
  private __tabs: VivaldiTab[] = [];

  // `levels` is a map of tab IDs to their depth in the tabs tree.
  levels: Record<number, number> = {};
  tabParentMap: Record<number, number> = {};

  windowId: number = 0;
  windowIdLoaded: boolean = false;

  // Position of the context menu in css
  pos: Record<string, string> = {};
  contextTabId: number | null = null;

  bigTabsUpdateInProgress: boolean = false;
  private _bigTabsUpdateTimeout: NodeJS.Timeout | null = null;

  constructor(api: TabsApi) {
    makeAutoObservable(this);
    this.api = api;
  }

  get tabs() {
    return this.__tabs.filter((t) => {
      if (!t.id) return false;

      if (this.checkIsPanel(t)) return false;

      return true;
    });
  }

  get activeTab() {
    return this.__tabs.find((t) => t.active);
  }

  markBigUpdateStart() {
    this.bigTabsUpdateInProgress = true;
    this._bigTabsUpdateTimeout = setTimeout(() => {
      console.warn(
        "Big tabs update is taking too long, marking as finished and reloading tabs"
      );
      this.markBigUpdateEnd(true);
    }, 10000);
  }

  markBigUpdateEnd(reload = false) {
    this.bigTabsUpdateInProgress = false;

    if (this._bigTabsUpdateTimeout) {
      clearTimeout(this._bigTabsUpdateTimeout);
      this._bigTabsUpdateTimeout = null;
    }

    if (reload) {
      this.reloadTabs();
    }
  }

  setPos(pos: Record<string, string>) {
    this.pos = pos;
  }

  setContextTabId(tabId: number | null) {
    this.contextTabId = tabId;
  }

  get contextTab(): VivaldiTab | null {
    return this.__tabs.find((t) => t.id === this.contextTabId) || null;
  }

  async ensureWindowId() {
    if (!this.windowIdLoaded) {
      const tab = await this.api.getThisTab();

      runInAction(() => {
        this.windowId = tab.windowId as number;
        this.windowIdLoaded = true;
      });
    }
  }

  async reloadTabs(ignoreBigUpdate = false) {
    if (this.bigTabsUpdateInProgress && !ignoreBigUpdate) {
      console.warn("Big tabs update in progress, skipping reload");
      return;
    }

    await this.ensureWindowId();

    const tabs = await this.api.query({ windowId: this.windowId });

    // Tabs should already be sorted by index, but just in case...
    tabs.sort((a, b) => a.index - b.index);

    // Before calculating levels, we need to ensure that the tabParentMap is up to date.
    tabs.forEach((tab) => {
      if (!tab.id) return;
      if (tab.vivExtData) {
        const data = JSON.parse(tab.vivExtData);
        if (data.panelId) return;
      }

      if (tab.id in this.tabParentMap) {
        // If the browser forgot the openerTabId, we need to restore it.
        tab.openerTabId = this.tabParentMap[tab.id];
      } else {
        this.tabParentMap[tab.id] = tab.openerTabId;
      }
    });

    // Calculating levels
    const flatTabsTree: VivaldiTab[] = [];
    const updatedLevels: Record<number, number> = {};

    const mapTabs = (t: VivaldiTab[], level: number) => {
      t.forEach((tab) => {
        flatTabsTree.push(tab);
        updatedLevels[tab.id as number] = level;

        const children = tabs.filter((t) => t.openerTabId === tab.id);
        mapTabs(children, level + 1);
      });
    };

    const topLevelTabs = tabs.filter((t) => !t.openerTabId);
    mapTabs(topLevelTabs, 0);

    runInAction(() => {
      this.__tabs = flatTabsTree;
      this.levels = updatedLevels;
    });

    // In case where the active tab is a panel, we need to activate a different tab.
    // Otherwise, there will be no active tab displayed, and some strange side effects will occur in this app.
    const activeTab = this.__tabs.find((t) => t.active);
    if (!activeTab || this.checkIsPanel(activeTab)) {
      const newActiveTab = this.__tabs.find((t) => !this.checkIsPanel(t));
      if (newActiveTab) {
        await this.api.update(newActiveTab.id as number, { active: true });
      }
    }
  }

  checkIsPanel(tab: VivaldiTab) {
    if (!tab.vivExtData) return false;

    const data = JSON.parse(tab.vivExtData);
    return !!data.panelId;
  }

  onExternalRemove(tabId: number) {
    const newParentId = this.tabParentMap[tabId];
    Object.keys(this.tabParentMap).forEach((id) => {
      if (this.tabParentMap[id] === tabId) {
        this.tabParentMap[id] = newParentId;
      }
    });

    if (this.activeTab?.id === tabId) {
      const tabIndex = this.tabs.findIndex((t) => t.id === tabId);
      if (tabIndex > 0) {
        this.api.update(this.tabs[tabIndex - 1].id as number, {
          active: true,
        });
      } else if (this.tabs.length > 1) {
        this.api.update(this.tabs[1].id as number, { active: true });
      } else {
        this.api.create({ active: true });
      }
    }

    this.reloadTabs();
  }

  async closeBranch(tab: VivaldiTab, includeSelf = true) {
    this.markBigUpdateStart();

    const tabIndex = this.tabs.findIndex((t) => t.id === tab.id);

    const findChildrenRecursively = (parentId: number) => {
      return this.tabs.reduce((acc, t) => {
        if (this.tabParentMap[t.id as number] === parentId) {
          acc.push(t);
          acc.push(...findChildrenRecursively(t.id as number));
        }
        return acc;
      }, []);
    };

    const targetTabs = includeSelf
      ? [tab, ...findChildrenRecursively(tab.id as number)]
      : findChildrenRecursively(tab.id as number);
    const targetTabIds = targetTabs.map((t) => t.id as number);

    if (targetTabs.some((t) => t.active)) {
      if (tabIndex > 0) {
        this.api.update(this.tabs[tabIndex - 1].id as number, { active: true });
      } else {
        const survivingTabs = this.tabs.filter(
          (t) => !targetTabIds.includes(t.id as number)
        );

        if (survivingTabs.length > 0) {
          await this.api.update(survivingTabs[0].id as number, {
            active: true,
          });
        } else {
          await this.api.create({ active: true });
        }
      }
    }

    await Promise.all(targetTabs.map((t) => this.api.remove(t.id as number)));

    this.markBigUpdateEnd(true);
  }
}

export default TabsAppState;

export const GlobalStateContext = createContext<TabsAppState>(null);
export const useGlobalState = () => useContext(GlobalStateContext);
