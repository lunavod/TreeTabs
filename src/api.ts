import React from "react";
import { ThemeSettingsWrapper } from "./utils/themes";
import { FeatureToggles } from "./background_types";

export interface VivaldiTab extends chrome.tabs.Tab {
  vivExtData?: string;
}

export class EventBase<Cb extends CallableFunction> {
  listeners: Cb[] = [];

  constructor(
    public topic: string,
    private port: chrome.runtime.Port
  ) {
    this.subscribe();
  }

  addListener(cb: Cb) {
    this.listeners.push(cb);
  }

  removeListener(cb: Cb) {
    this.listeners = this.listeners.filter((l) => l !== cb);
  }

  subscribe() {
    // console.log("Subscribing to", this.topic);
    this.port.onMessage.addListener((msg) => {
      if (msg.type === this.topic) {
        // console.log("Received", msg.type, msg.data);
        this.listeners.forEach((l) => l(...msg.data));
      }
    });
  }

  reload(port: chrome.runtime.Port) {
    this.port = port;
    this.subscribe();
  }
}

export class TabsApi {
  public port: chrome.runtime.Port;
  public onUpdated: EventBase<
    (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: VivaldiTab
    ) => void
  >;
  public onActivated: EventBase<
    (activeInfo: chrome.tabs.TabActiveInfo) => void
  >;
  public onCreated: EventBase<(tab: VivaldiTab) => void>;
  public onRemoved: EventBase<
    (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => void
  >;
  public onReplaced: EventBase<
    (addedTabId: number, removedTabId: number) => void
  >;
  public onAttached: EventBase<
    (tabId: number, attachInfo: chrome.tabs.TabAttachInfo) => void
  >;
  public onDetached: EventBase<
    (tabId: number, detachInfo: chrome.tabs.TabDetachInfo) => void
  >;
  public onMoved: EventBase<
    (tabId: number, moveInfo: chrome.tabs.TabMoveInfo) => void
  >;
  public onHighlighted: EventBase<
    (highlightInfo: chrome.tabs.TabHighlightInfo) => void
  >;
  public onThemeSettingsUpdated: EventBase<
    (themeSettings: ThemeSettingsWrapper) => void
  >;

  public onTabCaptured: EventBase<(tabId: number, dataUrl: string) => void>;
  public onFeatureTogglesUpdated: EventBase<
    (tabId: number, dataUrl: string) => void
  >;

  constructor() {
    this.port = chrome.runtime.connect();
    // console.log("INITIAL CONNECTED", this.port);

    this.port.onMessage.addListener((msg) => {
      // console.warn("RECEIVED MESSAGE", msg);
    });

    this.port.onDisconnect.addListener(() => {
      // console.log("DISCONNECTED");
      this.port = chrome.runtime.connect();
      this.port.onMessage.addListener((msg) => {
        // console.warn("RECEIVED MESSAGE", msg);
      });

      // console.log("RECONNECTED", this.port);

      this.onUpdated.reload(this.port);
      this.onActivated.reload(this.port);
      this.onCreated.reload(this.port);
      this.onRemoved.reload(this.port);
      this.onReplaced.reload(this.port);
      this.onAttached.reload(this.port);
      this.onDetached.reload(this.port);
      this.onMoved.reload(this.port);
      this.onHighlighted.reload(this.port);
      this.onTabCaptured.reload(this.port);
      this.onThemeSettingsUpdated.reload(this.port);
      this.onFeatureTogglesUpdated.reload(this.port);
    });

    this.onUpdated = new EventBase("tabs.onUpdated", this.port);
    this.onActivated = new EventBase("tabs.onActivated", this.port);
    this.onCreated = new EventBase("tabs.onCreated", this.port);
    this.onRemoved = new EventBase("tabs.onRemoved", this.port);
    this.onReplaced = new EventBase("tabs.onReplaced", this.port);
    this.onAttached = new EventBase("tabs.onAttached", this.port);
    this.onDetached = new EventBase("tabs.onDetached", this.port);
    this.onMoved = new EventBase("tabs.onMoved", this.port);
    this.onHighlighted = new EventBase("tabs.onHighlighted", this.port);
    this.onTabCaptured = new EventBase("tabs.onTabCaptured", this.port);
    this.onThemeSettingsUpdated = new EventBase(
      "themeSettingsUpdated",
      this.port
    );
    this.onFeatureTogglesUpdated = new EventBase(
      "featureTogglesUpdated",
      this.port
    );
  }

  public query(info: chrome.tabs.QueryInfo): Promise<VivaldiTab[]> {
    return new Promise((resolve) => {
      chrome.runtime
        .sendMessage({
          method: "query",
          input: [info],
          type: "chrome.tabs",
        })
        .then(resolve);
    });
  }

  public getThisTab(): Promise<VivaldiTab> {
    return chrome.runtime.sendMessage({
      method: "getSenderTab",
      type: "custom",
    });
  }

  public update(tabId: number, props: chrome.tabs.UpdateProperties) {
    return chrome.runtime.sendMessage({
      method: "update",
      input: [tabId, props],
      type: "chrome.tabs",
    });
  }

  public remove(tabId: number) {
    return chrome.runtime.sendMessage({
      method: "remove",
      input: [tabId],
      type: "chrome.tabs",
    });
  }

  public create(props: chrome.tabs.CreateProperties) {
    return chrome.runtime.sendMessage({
      method: "create",
      input: [props],
      type: "chrome.tabs",
    });
  }

  public async checkIncognito() {
    const tabs = await this.query({ currentWindow: true });
    return tabs.some((t) => t.incognito);
  }

  public async getVisitedTabIds(): Promise<number[]> {
    return chrome.runtime.sendMessage({
      type: "custom",
      method: "getVisitedTabIds",
    });
  }

  public async getThemeSettings(): Promise<ThemeSettingsWrapper> {
    return chrome.runtime.sendMessage({
      type: "custom",
      method: "getThemeSettings",
    });
  }

  public async setThemeSettings(settings: ThemeSettingsWrapper) {
    return chrome.runtime.sendMessage({
      type: "custom",
      method: "setThemeSettings",
      themeSettings: settings,
    });
  }

  public async getFeatureToggles(): Promise<FeatureToggles> {
    return chrome.runtime.sendMessage({
      type: "custom",
      method: "getFeatureToggles",
    });
  }

  public async setFeatureToggles(toggles: FeatureToggles) {
    return chrome.runtime.sendMessage({
      type: "custom",
      method: "setFeatureToggles",
      featureToggles: toggles,
    });
  }
}
