import clsx from "clsx";
import { observer } from "mobx-react-lite";
import { memo, useEffect, useRef, useState } from "react";
import React from "react";

import FileQuestionIcon from "./assets/icons/solid/file-circle-question.svg";
import PlusIcon from "./assets/icons/solid/plus.svg";
import VolumeHighIcon from "./assets/icons/solid/volume-high.svg";
import VolumeLowIcon from "./assets/icons/solid/volume-low.svg";
import XmarkIcon from "./assets/icons/solid/xmark.svg";
import styles from "./styles.module.css";
import themePresets from "./utils/theme_presets";
import ThemeHelper from "./utils/themes";

type VivaldiTab = {
  vivExtData?: string;
  id: number | string;
  active: boolean;
  audible: boolean;
  favIconUrl?: string;
  title: string;
  url?: string;
  openerTabId?: number;
  windowId?: number;
};

class EventBase<Cb extends CallableFunction> {
  listeners: Cb[] = [];

  constructor(
    public topic: string,
    private port: chrome.runtime.Port
  ) {}

  addListener(cb: Cb) {
    this.listeners.push(cb);
    if (this.listeners.length === 1) {
      this.port.onMessage.addListener((msg) => {
        if (msg.type === this.topic) {
          this.listeners.forEach((l) => l(...msg.data));
        }
      });
      this.port.postMessage({ type: "subscribe", topic: this.topic });
    }
  }

  removeListener(cb: Cb) {
    this.listeners = this.listeners.filter((l) => l !== cb);
    if (this.listeners.length === 0) {
      this.port.postMessage({ type: "unsubscribe", topic: this.topic });
    }
  }

  subscribe() {
    this.port.onMessage.addListener((msg) => {
      if (msg.type === this.topic) {
        this.listeners.forEach((l) => l(...msg.data));
      }
    });
    this.port.postMessage({ type: "subscribe", topic: this.topic });
  }

  unsubscribe() {
    this.port.postMessage({ type: "unsubscribe", topic: this.topic });
  }

  reload(port: chrome.runtime.Port) {
    this.port = port;
    if (this.listeners.length > 0) {
      this.subscribe();
    }
  }
}

class TabsApi {
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

  constructor(public extId: string) {
    this.port = chrome.runtime.connect(extId);
    this.port.onDisconnect.addListener(() => {
      this.changeExtensionId(extId);
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
  }

  public query(info: chrome.tabs.QueryInfo): Promise<VivaldiTab[]> {
    return new Promise((resolve) => {
      chrome.runtime
        .sendMessage(this.extId, {
          method: "query",
          input: [info],
          type: "chrome.tabs",
        })
        .then(resolve);
    });
  }

  public getThisTab(): Promise<VivaldiTab> {
    return chrome.runtime.sendMessage(this.extId, {
      method: "getSenderTab",
      type: "custom",
    });
  }

  public update(tabId: number, props: chrome.tabs.UpdateProperties) {
    return chrome.runtime.sendMessage(this.extId, {
      method: "update",
      input: [tabId, props],
      type: "chrome.tabs",
    });
  }

  public remove(tabId: number) {
    return chrome.runtime.sendMessage(this.extId, {
      method: "remove",
      input: [tabId],
      type: "chrome.tabs",
    });
  }

  public create(props: chrome.tabs.CreateProperties) {
    return chrome.runtime.sendMessage(this.extId, {
      method: "create",
      input: [props],
      type: "chrome.tabs",
    });
  }

  public checkIncognito() {
    return chrome.runtime.sendMessage(this.extId, {
      method: "checkIncognito",
      type: "custom",
    });
  }

  public changeExtensionId(extId: string) {
    this.extId = extId;
    this.port = chrome.runtime.connect(extId);
    this.port.onDisconnect.addListener(() => {
      this.changeExtensionId(extId);
    });

    this.onUpdated.reload(this.port);
    this.onActivated.reload(this.port);
    this.onCreated.reload(this.port);
    this.onRemoved.reload(this.port);
    this.onReplaced.reload(this.port);
    this.onAttached.reload(this.port);
    this.onDetached.reload(this.port);
    this.onMoved.reload(this.port);
    this.onHighlighted.reload(this.port);
  }
}

const ApiContext = React.createContext<TabsApi>(null);
const useApi = () => React.useContext(ApiContext);

const ThemeInjector = ({ incognito }: { incognito: boolean }) => {
  const [selectedTheme, setSelectedTheme] = useState(
    incognito ? "private" : "dark"
  );
  useEffect(() => {
    setSelectedTheme(incognito ? "private" : "dark");
  }, [incognito]);

  const preset = themePresets[selectedTheme];
  const theme = ThemeHelper.forTheme(preset);
  const css = Object.entries(theme).reduce((acc, [key, value]) => {
    return `${acc} --${key}: ${value};\n`;
  }, "");

  return (
    <div style={{ display: "none" }}>
      <style>{`
        :root {
          ${css}
        }
      `}</style>
    </div>
  );
};

function TabsAppWrapper() {
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

function TabsApp() {
  const api = useApi();
  const [windowId, setWindowId] = useState<number>(0);
  const [windowIdLoaded, setWindowIdLoaded] = useState<boolean>(false);
  const [tabs, setT] = useState<VivaldiTab[]>([]);
  const [levels, setLevels] = useState<Record<number, number>>({});
  const [pos, setPos] = useState<Record<string, string>>({});
  const [contextTab, setContextTab] = useState<VivaldiTab | null>(null);

  const tabParentMap = React.useRef<Record<number, number | undefined>>({});

  useEffect(() => {
    document.body.style.setProperty("width", "100%");
    document.body.style.setProperty("height", "100%");
  });

  useEffect(() => {
    if (!windowIdLoaded) {
      api.getThisTab().then((tab) => {
        console.log(tab);
        setWindowId(tab.windowId as number);
        setWindowIdLoaded(true);
      });
    }
    const reloadTabs = () => {
      console.log("Reload tabs");
      api.query({ windowId }).then((tabs: VivaldiTab[]) => {
        console.log(tabs);
        for (const tab of tabs) {
          if (!tab.id) continue;
          console.log(tab.id, tab.openerTabId, tab.vivExtData);
          if (tab.vivExtData) {
            const data = JSON.parse(tab.vivExtData);
            console.log(data);
            if (data.panelId) {
              console.log("panelId", data.panelId);
              continue;
            }
          }
          if (tab.id in tabParentMap.current) {
            tab.openerTabId = tabParentMap.current[tab.id];
          } else {
            tabParentMap.current[tab.id] = tab.openerTabId;
          }
        }

        const arr: VivaldiTab[] = [];
        const tmpLevels: Record<number, number> = {};
        const mapTabs = (t: VivaldiTab[], level: number) => {
          for (const tab of t) {
            if (tab.vivExtData) {
              const data = JSON.parse(tab.vivExtData);
              console.log(data);
              if (data.panelId) {
                console.log("panelId", data.panelId);
                continue;
              }
            }
            arr.push(tab);
            tmpLevels[tab.id as number] = level;
            const children = tabs.filter((t) => t.openerTabId === tab.id);
            mapTabs(children as VivaldiTab[], level + 1);
          }
        };
        const top = tabs.filter((t) => !t.openerTabId);
        mapTabs(top as VivaldiTab[], 0);
        setT(arr);
        setLevels(tmpLevels);
      });
    };

    const onRemove = (tabId: number) => {
      const newParentId = tabParentMap.current[tabId] ?? undefined;
      const children = Object.keys(tabParentMap.current).filter(
        (id) => tabParentMap.current[+id] === tabId
      );
      for (const child of children) {
        tabParentMap.current[+child] = newParentId;
      }
      reloadTabs();
    };

    reloadTabs();
    api.onUpdated.addListener(reloadTabs);
    api.onRemoved.addListener(onRemove);
    api.onMoved.addListener(reloadTabs);
    api.onActivated.addListener(reloadTabs);

    const onClick = () => {
      setPos({});
      setContextTab(null);
    };

    document.addEventListener("click", onClick);

    return () => {
      api.onUpdated.removeListener(reloadTabs);
      api.onRemoved.removeListener(onRemove);
      api.onMoved.removeListener(reloadTabs);
      api.onActivated.removeListener(reloadTabs);
      document.removeEventListener("click", onClick);
    };
  }, [windowId, api, windowIdLoaded]);

  const onOpenNewClick = () => {
    api.create({
      active: true,
    });
  };

  const onContextMenu = (
    e: React.MouseEvent<Element, MouseEvent>,
    tab: VivaldiTab
  ) => {
    e.preventDefault();

    const _pos: Record<string, string> = {};
    if (e.pageX < window.innerWidth / 2) _pos.left = `${e.pageX}px`;
    else _pos.right = `${window.innerWidth - e.pageX}px`;
    if (e.pageY < (window.innerHeight / 4) * 3) _pos.top = `${e.pageY}px`;
    else _pos.bottom = `${window.innerHeight - e.pageY}px`;

    setPos(_pos);
    setContextTab(tab);
  };

  const onCloseWithChildren = (e: React.MouseEvent, tab: VivaldiTab) => {
    e.preventDefault();
    const tabsMap = tabParentMap.current;
    const tmp = [tab];
    let newActiveTab: number;
    if (tab.active && tabs.findIndex((t) => t.id === tab.id) > 0)
      newActiveTab = tabs[tabs.findIndex((t) => t.id === tab.id) - 1]
        .id as number;
    const rec = (parentId: number) => {
      tabs
        .filter((t) => tabsMap[t.id as number] === parentId)
        .forEach((t) => {
          tmp.push(t);
          rec(t.id as number);
        });
    };
    rec(tab.id as number);

    Promise.all(tmp.map((t) => api.remove(t.id as number))).then(() => {
      if (newActiveTab) api.update(newActiveTab as number, { active: true });
    });
  };

  const onCloseOnlyChildren = (e: React.MouseEvent, tab: VivaldiTab) => {
    e.preventDefault();
    const tabsMap = tabParentMap.current;
    const tmp: VivaldiTab[] = [];
    let newActiveTab: number;
    if (tab.active && tabs.findIndex((t) => t.id === tab.id) > 0)
      newActiveTab = tabs[tabs.findIndex((t) => t.id === tab.id) - 1]
        .id as number;
    const rec = (parentId: number) => {
      tabs
        .filter((t) => tabsMap[t.id as number] === parentId)
        .forEach((t) => {
          tmp.push(t);
          rec(t.id as number);
        });
    };
    rec(tab.id as number);

    Promise.all(tmp.map((t) => api.remove(t.id as number))).then(() => {
      if (newActiveTab) api.update(newActiveTab as number, { active: true });
    });
  };

  const onCloseTop = (tab: VivaldiTab) => {
    const activeIndex = tabs.findIndex((t) => !!t.active);
    const index = tabs.findIndex((t) => t.id === tab.id);
    const tmp = tabs.slice(0, index);

    if (activeIndex < index)
      api.update(tabs[index].id as number, { active: true });

    tmp.forEach((t) => api.remove(t.id as number));
  };

  const onCloseBottom = (tab: VivaldiTab) => {
    const activeIndex = tabs.findIndex((t) => !!t.active);
    const index = tabs.findIndex((t) => t.id === tab.id);
    const tmp = tabs.slice(index + 1);

    if (activeIndex > index)
      api.update(tabs[index].id as number, { active: true });

    tmp.forEach((t) => api.remove(t.id as number));
  };

  return (
    <div styleName="app">
      <div styleName="content">
        <div styleName="tabs">
          {tabs.map((tab) => (
            <TabElement
              tab={tab}
              tabs={tabs}
              tabsMap={tabParentMap.current}
              level={levels[tab.id as number]}
              key={tab.id}
              onContextMenu={onContextMenu}
            />
          ))}
          <div styleName="tab transparent" onClick={onOpenNewClick}>
            <span styleName="add">
              <PlusIcon />
            </span>
            <span>Open a New Tab</span>
          </div>
        </div>
      </div>
      {!!(pos.left || pos.right) && (
        <div style={pos} styleName="menu">
          <div
            onClick={(e) => onCloseWithChildren(e, contextTab as VivaldiTab)}
          >
            Close with children
          </div>
          <div
            onClick={(e) => onCloseOnlyChildren(e, contextTab as VivaldiTab)}
          >
            Close children
          </div>
          <div onClick={() => onCloseBottom(contextTab as VivaldiTab)}>
            Close all below
          </div>
          <div onClick={() => onCloseTop(contextTab as VivaldiTab)}>
            Close all above
          </div>
          {/* <div onClick={() => location.reload()}>Reload extension</div> */}
        </div>
      )}
    </div>
  );
}

const TabElement = observer(
  ({
    tab,
    tabs,
    tabsMap,
    level,
    onContextMenu,
  }: {
    tab: VivaldiTab;
    tabs: VivaldiTab[];
    tabsMap: Record<number, number | undefined>;
    level: number;
    onContextMenu: (e: React.MouseEvent, tab: VivaldiTab) => any;
  }) => {
    const api = useApi();
    const onClick = (e: React.MouseEvent, tab: VivaldiTab) => {
      const target = e.target as HTMLElement;

      let el = target;
      while (el.parentElement) {
        if (
          [...el.classList].includes(styles.closeWithChildren) ||
          [...el.classList].includes(styles.close)
        )
          return;
        el = el.parentElement;
      }

      console.log("ACTIVATING");
      api.update(tab.id as number, { active: true });
    };

    const onCloseClick = (e: React.MouseEvent, tab: VivaldiTab) => {
      e.preventDefault();
      let newActiveTab: number = tabs.find((t) => t.active === true)
        ?.id as number;
      if (tab.active && tabs.findIndex((t) => t.id === tab.id) > 0)
        newActiveTab = tabs[tabs.findIndex((t) => t.id === tab.id) - 1]
          .id as number;

      api.remove(tab.id as number).then(() => {
        if (tab.active) return;
        api.update(newActiveTab, { active: true });
      });
    };

    let title = tab.title as string;
    if (tab.url && title.endsWith(` - ${tab.url}`))
      title = title.slice(0, -` - ${tab.url}`.length);

    if (tab.url) {
      const url = new URL(tab.url as string);
      if (url.host === "vivaldi-webui") {
        title = "Vivaldi: New tab ";
        if (url.pathname === "/startpage") {
          if (url.searchParams.get("section") === "history")
            title = "Vivaldi: History";
          if (url.searchParams.get("section") === "Speed-dials")
            title = "Vivaldi: New tab ";
        }
      }
    }

    const getThumbnail = () => {
      const thumb = JSON.parse(
        tab.vivExtData ? tab.vivExtData : '{"thumbnail": ""}'
      ).thumbnail;
      return thumb;
    };

    const timer = useRef<null | NodeJS.Timeout>(null);
    const [popupShown, setPopupShown] = useState(false);

    const onMouseEnter = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setPopupShown(true), 500);
    };
    const onMouseLeave = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      setPopupShown(false);
    };

    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (!ref.current) return;
      ref.current.addEventListener(
        "contextmenu",
        // @ts-expect-error I dont remember why I did this
        (e: React.MouseEvent<Element, MouseEvent>) => onContextMenu(e, tab)
      );
    }, []);

    return (
      <div
        styleName="tabWrapper"
        style={
          {
            "--offset": tab.openerTabId ? level * 12 + "px" : "0px",
          } as React.CSSProperties
        }
      >
        <div
          ref={ref}
          key={tab.id}
          styleName={clsx("tab", tab.active && "active")}
          onClick={(e) => onClick(e, tab)}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {!!tab.favIconUrl && <img src={tab.favIconUrl} />}
          {!tab.favIconUrl && (
            <div styleName="noFavicon">
              <FileQuestionIcon />
            </div>
          )}
          {!!tab.audible && <VolumeIndicator />}
          <span styleName="title">{title}</span>
          <div styleName="close" onClick={(e) => onCloseClick(e, tab)}>
            <XmarkIcon />
          </div>
        </div>
        <div styleName="popup" style={{ opacity: popupShown ? 1 : 0 }}>
          <span styleName="tabTitle">{title}</span>
          <span styleName="tabUrl">{tab.url}</span>
          {/* <img src={getThumbnail()} styleName="thumbnail" /> */}
        </div>
      </div>
    );
  }
);

export const VolumeIndicator = () => {
  const icons = [VolumeLowIcon, VolumeHighIcon];
  const [i, setI] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setI((i) => (i === 1 ? 0 : i + 1));
    }, 500);
    return () => clearInterval(interval);
  });

  const Icon = icons[i];

  return (
    <div styleName="volume">
      <Icon />
    </div>
  );
};

const MemoTabsApp = memo(TabsAppWrapper);

export default MemoTabsApp;
