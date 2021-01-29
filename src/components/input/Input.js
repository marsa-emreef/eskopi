import styles from "./Input.module.css";
import useTheme from "../useTheme";
import {parseBorder, parseColorStyle, parseRadius, parseStyle} from "../layout/Layout";
import React,{useCallback} from "react";

function isUndefinedOrNull(b) {
    return b === undefined || b === null;
}

const replacedAutoCapsKey = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
/**
 *
 * @param {useRef} inputRef
 * @param {string} name
 * @param {string} defaultValue
 * @param {boolean} disabled
 * @param {string} className
 * @param {string} color
 * @param {Object} style
 *
 * @param {number} p - padding
 * @param {number} pL - padding left
 * @param {number} pR - padding right
 * @param {number} pT - padding top
 * @param {number} pB - padding bottom
 *
 * @param {number} m - margin
 * @param {number} mL - margin left
 * @param {number} mR - margin right
 * @param {number} mT - margin top
 * @param {number} mB - margin bottom
 *
 * @param {number} b - border
 * @param {number} bL - border left
 * @param {number} bR - border right
 * @param {number} bT - border top
 * @param {number} bB - border bottom
 *
 * @param {number} r - radius
 * @param {number} rTL - radius top left
 * @param {number} rTR - radius top right
 * @param {number} rBL - radius bottom left
 * @param {number} rBR - radius bottom right
 * @param {boolean} autoCaps - indicate to enable autoCaps
 * @param {string} errorMessage - indicate there is error
 *
 * @param props
 * @returns {JSX.Element}
 * @constructor
 */
function Input({
                                  inputRef,
                                  name,
                                  defaultValue,
                                  disabled,
                                  className = [],
                                  color,
                                  style,
                                  p, pL, pR, pT, pB,
                                  m, mL, mR, mT, mB,
                                  b, bL, bR, bT, bB,
                                  r, rTL, rTR, rBL, rBR,
                                  autoCaps,
                                  errorMessage,
                                  ...props
                              }) {
    const [theme] = useTheme();
    console.log('Recalculate');
    const buttonStyle = {
        background: 'none',
        borderRadius: 5,
        backgroundColor: 'none',
        outline: 'none'
    };
    b = isUndefinedOrNull(b) ? 1 : b;
    r = isUndefinedOrNull(r) ? 2 : r;
    p = isUndefinedOrNull(p) ? 2 : p;
    pT = isUndefinedOrNull(pT) ? 2 : pT;
    pB = isUndefinedOrNull(pB) ? 1.8 : pB;
    color = errorMessage && errorMessage.length > 0 ? 'danger' : color || 'light';

    const paddingMarginStyle = parseStyle({p, pL, pT, pR, pB, m, mL, mT, mR, mB}, theme);
    const borderStyle = parseBorder({b, bL, bR, bT, bB}, color, theme);
    const radiusStyle = parseRadius({r, rTL, rTR, rBL, rBR}, theme);
    const colorStyle = parseColorStyle({color, brightness: 0.71, opacity: 1}, theme);

    return <input ref={inputRef} type={"text"} name={name} defaultValue={defaultValue}
                  className={[...className, styles.button].join(' ')}
                  readOnly={disabled}
                  onKeyDownCapture={useCallback(e => {
                      if (autoCaps && !e.ctrlKey && !e.shiftKey && replacedAutoCapsKey.indexOf(e.key) >= 0) {
                          e.preventDefault();
                          const position = e.target.selectionStart;

                          const currentValue = e.target.value;
                          const newValue = currentValue.substring(0,position)+e.key.toUpperCase()+currentValue.substring(position,currentValue.length);

                          let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                          nativeInputValueSetter.call(e.target, newValue);
                          e.target.setSelectionRange(position+1,position+1);
                          const event = new Event('input', { bubbles: true });
                          e.target.dispatchEvent(event);

                      }
                  },[autoCaps])}
                  style={{...buttonStyle, ...paddingMarginStyle, ...borderStyle, ...radiusStyle, ...colorStyle, ...style}}
                  {...props}/>
}

export default React.memo(Input);