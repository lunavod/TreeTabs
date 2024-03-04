import { useEffect, useState } from "react";
import React from "react";

import "./styles.module.css";
import TabElement from "../TabElement";
import { VivaldiTab, useApi } from "../../api";
import AddNewTab from "../TabElement/AddNewTab";
import ContextMenu from "../ContextMenu";
import TabsAppState from "./state";
import { observer } from "mobx-react-lite";

const TabsApp = observer(() => {
  const api = useApi();
  const [state] = useState(() => new TabsAppState(api));

  useEffect(() => {
    state.reloadTabs();

    const onRemove = (tabId: number) => state.onExternalRemove(tabId);
    const reloadTabs = () => state.reloadTabs();

    api.onUpdated.addListener(reloadTabs);
    api.onRemoved.addListener(onRemove);
    api.onMoved.addListener(reloadTabs);
    api.onActivated.addListener(reloadTabs);

    const onClick = () => {
      state.setPos({});
      state.setContextTabId(null);
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
  }, [api.onActivated, api.onMoved, api.onRemoved, api.onUpdated, state]);

  const onOpenNewClick = () => {
    api.create({
      active: true,
    });
  };

  const onContextMenu = (
    e: React.MouseEvent<Element, MouseEvent>,
    tab: VivaldiTab
  ) => {
    if (!tab.id) return;

    e.preventDefault();

    const _pos: Record<string, string> = {};
    if (e.pageX < window.innerWidth / 2) _pos.left = `${e.pageX}px`;
    else _pos.right = `${window.innerWidth - e.pageX}px`;
    if (e.pageY < (window.innerHeight / 4) * 3) _pos.top = `${e.pageY}px`;
    else _pos.bottom = `${window.innerHeight - e.pageY}px`;

    state.setPos(_pos);
    state.setContextTabId(tab.id);
  };

  return (
    <div styleName="app">
      <div styleName="content">
        <div styleName="tabs">
          {state.validTabs.map((tab) => (
            <TabElement
              tab={tab}
              tabs={state.validTabs}
              tabsMap={state.tabParentMap}
              level={state.levels[tab.id as number]}
              key={tab.id}
              onContextMenu={onContextMenu}
            />
          ))}
          <AddNewTab onClick={onOpenNewClick} />
        </div>
      </div>
      <ContextMenu
        contextTab={state.contextTab}
        tabs={state.validTabs}
        tabParentMap={state.tabParentMap}
        pos={state.pos}
      />
    </div>
  );
});
export default TabsApp;
