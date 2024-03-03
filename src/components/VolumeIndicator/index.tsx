import { useState, useEffect } from "react";
import VolumeHighIcon from "../../assets/icons/solid/volume-high.svg";
import VolumeLowIcon from "../../assets/icons/solid/volume-low.svg";
import "./styles.module.css";

const VolumeIndicator = () => {
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

export default VolumeIndicator;
