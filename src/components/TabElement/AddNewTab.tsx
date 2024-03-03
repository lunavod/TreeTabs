import React from "react";

import PlusIcon from "../../assets/icons/solid/plus.svg";
import "./styles.module.css";

const AddNewTab = ({
  onClick,
}: {
  onClick: React.MouseEventHandler<HTMLDivElement>;
}) => {
  return (
    <div styleName="tab transparent" onClick={onClick}>
      <span styleName="add">
        <PlusIcon />
      </span>
      <span>Open a New Tab</span>
    </div>
  );
};
export default AddNewTab;
