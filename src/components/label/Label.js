import {calculateBrightness, Vertical} from "../layout/Layout";
import useTheme from "../useTheme";
import {useObserverMapper, useObserverValue} from "components/useObserver";

/**
 * @param {string} name
 * @param {string} color
 * @param style
 * @param {{current:*}} $value
 * @param props
 * @returns {JSX.Element}
 * @constructor
 */
export default function Label({name, color, $value, style, ...props}) {
    $value = $value || {current: ''};
    $value.current = $value.current ?? '';
    name = name || '';
    const $nameValue = useObserverMapper($value, value => value[name]);
    let value = useObserverValue($nameValue)
    const [theme] = useTheme();
    if (color in theme) {
        color = calculateBrightness(theme[color], -0.6, 1);
    }
    if (typeof value !== 'string') {
        value = JSON.stringify(value);
    }
    return <Vertical {...props} style={{color: color, ...style}}>{value}</Vertical>
}