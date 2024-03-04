import { toJS } from "mobx";
import { VivaldiTab } from "../../api";
import { useGlobalState } from "../../state";
import "./styles.module.css";
import { observer } from "mobx-react-lite";
import { ErrorBoundary } from "react-error-boundary";

const ContextMenu = observer(() => {
  const globalState = useGlobalState();

  const onCloseWithChildren = (e: React.MouseEvent) => {
    e.preventDefault();
    globalState.closeBranch(globalState.contextTab, true);
  };

  const onCloseOnlyChildren = (e: React.MouseEvent) => {
    e.preventDefault();
    globalState.closeBranch(globalState.contextTab, false);
  };

  const onCloseTop = () => {
    const activeIndex = globalState.tabs.findIndex((t) => !!t.active);
    const index = globalState.tabs.findIndex(
      (t) => t.id === globalState.contextTabId
    );
    const tmp = globalState.tabs.slice(0, index);

    if (activeIndex < index)
      globalState.api.update(globalState.tabs[index].id as number, {
        active: true,
      });

    tmp.forEach((t) => globalState.api.remove(t.id as number));
  };

  const onCloseBottom = () => {
    const activeIndex = globalState.tabs.findIndex((t) => !!t.active);
    const index = globalState.tabs.findIndex(
      (t) => t.id === globalState.contextTabId
    );
    const tmp = globalState.tabs.slice(index + 1);

    if (activeIndex > index)
      globalState.api.update(globalState.tabs[index].id as number, {
        active: true,
      });

    tmp.forEach((t) => globalState.api.remove(t.id as number));
  };

  if (!globalState.pos.left && !globalState.pos.right) return <></>;

  return (
    // Not converting pos with toJS will cause an error "Dynamic observable objects cannot be frozen"
    <div style={toJS(globalState.pos)} styleName="menu">
      <div onClick={(e) => onCloseWithChildren(e)}>Close with children</div>
      <div onClick={(e) => onCloseOnlyChildren(e)}>Close children</div>
      <div onClick={() => onCloseBottom()}>Close all below</div>
      <div onClick={() => onCloseTop()}>Close all above</div>
    </div>
  );
});

export default ContextMenu;
