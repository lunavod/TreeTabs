import { observer } from "mobx-react-lite";
import { VivaldiTab } from "../../api";

import styles from "./styles.module.css";
import clsx from "clsx";
import { useRef, useState, useEffect } from "react";
import FileQuestionIcon from "../../assets/icons/solid/file-circle-question.svg";
import XmarkIcon from "../../assets/icons/solid/xmark.svg";
import VolumeIndicator from "../VolumeIndicator";
import { useGlobalState } from "../../state";
import { toJS } from "mobx";

const TabElement = observer(
  ({
    tab,
    onContextMenu,
  }: {
    tab: VivaldiTab;
    onContextMenu: (e: React.MouseEvent, tab: VivaldiTab) => any;
  }) => {
    const globalState = useGlobalState();

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
      globalState.api.update(tab.id as number, { active: true });
    };

    const onCloseClick = (e: React.MouseEvent, tab: VivaldiTab) => {
      e.preventDefault();
      let newActiveTab: number = globalState.tabs.find((t) => t.active === true)
        ?.id as number;
      if (tab.active && globalState.tabs.findIndex((t) => t.id === tab.id) > 0)
        newActiveTab = globalState.tabs[
          globalState.tabs.findIndex((t) => t.id === tab.id) - 1
        ].id as number;

      globalState.api.remove(tab.id as number).then(() => {
        if (tab.active) return;
        globalState.api.update(newActiveTab, { active: true });
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

    const thumbnail = globalState.tabPreviewMap[tab.id] || null;

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
        // @ts-expect-error I don't remember why I did this
        (e: React.MouseEvent<Element, MouseEvent>) =>
          onContextMenu(e, toJS(tab))
      );
    }, []);

    return (
      <div
        styleName="tabWrapper"
        style={
          {
            "--offset": tab.openerTabId
              ? globalState.levels[tab.id] * 12 + "px"
              : "0px",
          } as React.CSSProperties
        }
      >
        <div
          ref={ref}
          key={tab.id}
          styleName={clsx(
            "tab",
            tab.active && "active",
            !globalState.visitedTabIds.includes(tab.id) && "unread"
          )}
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
          <span styleName="title">{title ? title : tab.url}</span>
          <div styleName="close" onClick={(e) => onCloseClick(e, tab)}>
            <XmarkIcon />
          </div>
        </div>
        <div styleName="popupWrapper" style={{ opacity: popupShown ? 1 : 0 }}>
          <div styleName="popup">
            <span styleName="tabTitle">{title}</span>
            <span styleName="tabUrl">{tab.url}</span>
          </div>
          {/* {thumbnail && <img src={thumbnail} styleName="thumbnail" />} */}
          {/* {!thumbnail && <div styleName="emptyThumbnail" />} */}
          {/* <img src={getThumbnail()} styleName="thumbnail" /> */}
        </div>
      </div>
    );
  }
);

export default TabElement;
