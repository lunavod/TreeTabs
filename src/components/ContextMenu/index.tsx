import { VivaldiTab, useApi } from "../../api";
import "./styles.module.css";
import { observer } from "mobx-react-lite";

const ContextMenu = observer(
  ({
    contextTab,
    tabs,
    tabParentMap,
    pos,
  }: {
    contextTab: VivaldiTab | null;
    tabs: VivaldiTab[];
    tabParentMap: Record<number, number | undefined>;
    pos: Record<string, string>;
  }) => {
    const api = useApi();

    const onCloseWithChildren = (e: React.MouseEvent, tab: VivaldiTab) => {
      e.preventDefault();
      const tabsMap = tabParentMap;
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
      const tabsMap = tabParentMap;
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

    if (!pos.left && !pos.right) return <></>;

    return (
      <div style={pos} styleName="menu">
        <div onClick={(e) => onCloseWithChildren(e, contextTab as VivaldiTab)}>
          Close with children
        </div>
        <div onClick={(e) => onCloseOnlyChildren(e, contextTab as VivaldiTab)}>
          Close children
        </div>
        <div onClick={() => onCloseBottom(contextTab as VivaldiTab)}>
          Close all below
        </div>
        <div onClick={() => onCloseTop(contextTab as VivaldiTab)}>
          Close all above
        </div>
      </div>
    );
  }
);

export default ContextMenu;
