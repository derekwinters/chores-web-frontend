import React from "react";
import { getPersonColor, getPersonInitial } from "../utils/personColors";

export default function Avatar({ name, size = 44, color: customColor, style: extraStyle }) {
  const color = customColor || getPersonColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 600, fontSize: size * 0.38, flexShrink: 0,
      letterSpacing: '-0.5px', ...extraStyle,
    }}>
      {getPersonInitial(name)}
    </div>
  );
}
