import { useEffect } from "react";
import React from "react";

import "./styles.module.css";
import TabElement from "../TabElement";
import { VivaldiTab } from "../../api";
import AddNewTab from "../TabElement/AddNewTab";
import ContextMenu from "../ContextMenu";
import { useGlobalState } from "../../state";
import { observer } from "mobx-react-lite";

const TabsApp = observer(() => {
  const state = useGlobalState();

  useEffect(() => {
    state.reloadTabs();

    const onRemove = (tabId: number) => state.onExternalRemove(tabId);
    const reloadTabs = () => state.reloadTabs();

    state.api.onUpdated.addListener(reloadTabs);
    state.api.onRemoved.addListener(onRemove);
    state.api.onMoved.addListener(reloadTabs);
    state.api.onActivated.addListener(reloadTabs);

    const onClick = () => {
      state.setPos({});
      state.setContextTabId(null);
    };

    document.addEventListener("click", onClick);

    // const int = setInterval(reloadTabs, 1000);

    return () => {
      state.api.onUpdated.removeListener(reloadTabs);
      state.api.onRemoved.removeListener(onRemove);
      state.api.onMoved.removeListener(reloadTabs);
      state.api.onActivated.removeListener(reloadTabs);
      document.removeEventListener("click", onClick);
      // clearInterval(int);
    };
  }, [state]);

  const onOpenNewClick = () => {
    state.api.create({
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
        {/* {state.bigTabsUpdateInProgress && <div>UPDATE IN PROGRESS</div>} */}
        <div styleName="tabs">
          {state.tabs.map((tab) => (
            <TabElement tab={tab} key={tab.id} onContextMenu={onContextMenu} />
          ))}
          <AddNewTab onClick={onOpenNewClick} />
        </div>
      </div>
      <ContextMenu />
    </div>
  );
});
export default TabsApp;
