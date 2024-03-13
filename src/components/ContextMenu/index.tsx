import { toJS } from "mobx";
import { useGlobalState } from "../../state";
import "./styles.module.css";
import { observer } from "mobx-react-lite";

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
    globalState.closeAllAbove(globalState.contextTab);
  };

  const onCloseBottom = () => {
    globalState.closeAllBelow(globalState.contextTab);
  };

  const onReload = () => {
    location.reload();
  };

  if (!globalState.pos.left && !globalState.pos.right) return <></>;

  return (
    // Not converting pos with toJS will cause an error "Dynamic observable objects cannot be frozen"
    <div style={toJS(globalState.pos)} styleName="menu">
      <div onClick={(e) => onCloseWithChildren(e)}>Close with children</div>
      <div onClick={(e) => onCloseOnlyChildren(e)}>Close children</div>
      <div onClick={() => onCloseBottom()}>Close all below</div>
      <div onClick={() => onCloseTop()}>Close all above</div>
      <div styleName="separator" />
      <div onClick={() => onReload()}>Reload extension</div>
    </div>
  );
});

export default ContextMenu;
