import { makeAutoObservable, runInAction, toJS } from "mobx";
import { TabsApi, VivaldiTab } from "../../api";

class TabsAppState {
  api: TabsApi;
  // `tabs` represents the full list of tabs in the current window.
  private tabs: VivaldiTab[] = [];

  // `levels` is a map of tab IDs to their depth in the tabs tree.
  levels: Record<number, number> = {};
  tabParentMap: Record<number, number> = {};

  windowId: number = 0;
  windowIdLoaded: boolean = false;

  // Position of the context menu in css
  pos: Record<string, string> = {};
  contextTabId: number | null = null;

  tabsUpdating: boolean = false;

  constructor(api: TabsApi) {
    makeAutoObservable(this);
    this.api = api;
  }

  get activeTab() {
    return this.tabs.find((t) => t.active);
  }

  setTabsUpdating(updating: boolean) {
    this.tabsUpdating = updating;
  }

  setPos(pos: Record<string, string>) {
    this.pos = pos;
  }

  setContextTabId(tabId: number | null) {
    this.contextTabId = tabId;
  }

  get contextTab(): VivaldiTab | null {
    return this.tabs.find((t) => t.id === this.contextTabId) || null;
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

  async reloadTabs() {
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
      this.tabs = flatTabsTree;
      this.levels = updatedLevels;
    });

    // In case where the active tab is a panel, we need to activate a different tab.
    // Otherwise, there will be no active tab displayed, and some strange side effects will occur in this app.
    const activeTab = this.tabs.find((t) => t.active);
    if (!activeTab || this.checkIsPanel(activeTab)) {
      const newActiveTab = this.tabs.find((t) => !this.checkIsPanel(t));
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
      const tabIndex = this.validTabs.findIndex((t) => t.id === tabId);
      if (tabIndex > 0) {
        this.api.update(this.validTabs[tabIndex - 1].id as number, {
          active: true,
        });
      } else if (this.validTabs.length > 1) {
        this.api.update(this.validTabs[1].id as number, { active: true });
      } else {
        this.api.create({ active: true });
      }
    }

    this.reloadTabs();
  }

  /**
   * Returns the tabs that are not panels.
   */
  get validTabs() {
    return this.tabs.filter((t) => {
      if (!t.id) return false;

      if (t.vivExtData) {
        const data = JSON.parse(t.vivExtData);
        if (data.panelId) return false;
      }

      return true;
    });
  }
}

export default TabsAppState;
