import { useEffect, useState } from "react";
import React from "react";

import "./styles.module.css";
import TabElement from "../TabElement";
import { VivaldiTab, useApi } from "../../api";
import AddNewTab from "../TabElement/AddNewTab";
import ContextMenu from "../ContextMenu";

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
    if (!windowIdLoaded) {
      api.getThisTab().then((tab) => {
        console.log(tab);
        setWindowId(tab.windowId as number);
        setWindowIdLoaded(true);
      });
      return;
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

    // const int = setInterval(reloadTabs, 1000);

    return () => {
      api.onUpdated.removeListener(reloadTabs);
      api.onRemoved.removeListener(onRemove);
      api.onMoved.removeListener(reloadTabs);
      api.onActivated.removeListener(reloadTabs);
      document.removeEventListener("click", onClick);
      // clearInterval(int);
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
          <AddNewTab onClick={onOpenNewClick} />
        </div>
      </div>
      <ContextMenu
        contextTab={contextTab}
        tabs={tabs}
        tabParentMap={tabParentMap}
        pos={pos}
      />
    </div>
  );
}
export default TabsApp;
