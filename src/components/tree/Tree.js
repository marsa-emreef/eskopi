import {useEffect, useState} from "react";
import {Horizontal, Vertical} from "components/layout/Layout";
import List from "components/list/List";
import useObserver, {ObserverValue, useObserverListener, useObserverValue} from "components/useObserver";
import Button from "components/button/Button";

const DEFAULT_DATA_KEY = (data) => data?.id;

/**
 * Tree data should contains children which is an array.
 * @param {{children:[],id:string}[]} $data
 * @param {React.FunctionComponent} itemRenderer
 * @param {function(data:*):string} dataKey
 * @param {function(event:*):void} onKeyboardUp
 * @param {function(event:*):void} onKeyboardDown
 * @param props
 * @returns {JSX.Element}
 * @constructor
 */
export default function Tree({
                                 $data,
                                 itemRenderer = DefaultTreeItemRenderer,
                                 dataKey = DEFAULT_DATA_KEY,
                                 onKeyboardDown,
                                 onKeyboardUp,
                                 ...props
                             }) {

    const [$listData, setListData] = useObserver(() => flatArray($data.current, [], [], dataKey));
    const [$collapsedNode, setCollapsedNode] = useObserver({});

    useObserverListener($data, (data) => {
        setListData(filterWithCollapsedNode(flatArray(data, [], [], dataKey), $collapsedNode.current));
    });
    useObserverListener($collapsedNode, (collapsedNode) => {
        setListData(filterWithCollapsedNode(flatArray($data.current, [], [], dataKey), collapsedNode));
    })

    // lets make the data flat first
    return <List $data={$listData} itemRenderer={DefaultTreeItemRenderer} listRenderer={itemRenderer} dataKey={dataKey}
                 onKeyboardUp={onKeyboardUp}
                 onKeyboardDown={onKeyboardDown} $collapsedNode={$collapsedNode}
                 setCollapsedNode={setCollapsedNode} {...props} />
}


const flatArray = (array, result, parentKey, dataKey) => {
    return array.reduce((acc, next) => {
        const {children, ...item} = next;
        const key = dataKey(item);
        item.key_ = [...parentKey, key];
        item.children = children ? children.length : 0;
        acc.push(item)
        if (children) {
            acc = flatArray(children, acc, item.key_, dataKey);
        }
        return acc;
    }, result);
}

const filterWithCollapsedNode = (array, collapsedNode) => {
    return array.filter((data) => {
        const key = data.key_.join(':');
        for (const collapsedKey of Object.keys(collapsedNode)) {
            if (key !== collapsedKey && key.indexOf(collapsedKey) === 0) {
                return false;
            }
        }
        return true;
    })
}


/**
 * This is the function that will loop into the tree and find the object in the tree.
 * @param {any[]} oldData
 * @param {string[]} key
 * @param {function(data):string} dataKey
 * @returns {any}
 */
export function findTreeDataFromKey(oldData = [], key = [], dataKey) {
    const [keyPath, ...rest] = key;
    const [filteredData] = oldData.filter(data => dataKey(data) === keyPath);
    if (rest && rest.length > 0) {
        return findTreeDataFromKey(filteredData.children, rest, dataKey);
    }
    return filteredData;
}

function ToggleButton({$open, setOpen, width}) {
    const open = useObserverValue($open);
    return <Button p={0} pT={0} pB={0} vAlign={"center"} color={'light'} opacity={0} b={0} width={width}
                   onClick={() => setOpen(val => !val)}>
        {open &&
        <svg viewBox='0 0 512 512'>
            <path fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='48'
                  d='M112 184l144 144 144-144'/>
        </svg>
        }
        {!open &&
        <svg viewBox='0 0 512 512'>
            <path fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='48'
                  d='M184 112l144 144-144 144'/>
        </svg>
        }
    </Button>;
}

export function DefaultTreeItemRenderer({
                                            $selectedItem,
                                            setSelectedItem,
                                            index,
                                            data,
                                            setData,
                                            dataKey,
                                            listRenderer,
                                            $collapsedNode,
                                            setCollapsedNode,
                                            ...props
                                        }) {

    const key = data.key_.join(':');

    const [$collapsed, setCollapsed] = useObserver($collapsedNode.current[key] === true);
    useObserverListener($collapsed, (value) => {
        if (value) {
            setCollapsedNode(oldKey => {
                return {...oldKey, [key]: true};
            });
        } else {
            setCollapsedNode(oldKey => {
                delete oldKey[key];
                return {...oldKey};
            });
        }
    })
    useObserverListener($collapsedNode, () => {
        setCollapsed($collapsedNode.current[key] === true);
    });


    const level = data.key_.length;
    const [selected, setSelected] = useState(false);
    const [$expand, setExpand] = useObserver(!$collapsed.current);

    useObserverListener($expand, (isExpand) => {
        setCollapsed(!isExpand);
    });

    const [$toggleButtonVisible, setToggleButtonVisible] = useObserver(data.children > 0);
    useObserverListener($selectedItem, (selectedItem) => setSelected(selectedItem === data));
    useEffect(() => setToggleButtonVisible(data.children > 0), [data, setToggleButtonVisible]);
    const Component = listRenderer;
    return <Horizontal onClick={() => setSelectedItem(data)} color={"light"} brightness={selected ? -10 : -2}>
        <Horizontal width={(level - 1) * 15}/>
        <ObserverValue $observer={$toggleButtonVisible} render={({value}) => {
            if (!value) {
                return <Horizontal width={15}/>
            }
            return <ToggleButton $open={$expand} setOpen={setExpand} width={15}/>
        }}/>
        <Vertical flex={1}>
            <Component selected={selected}
                       index={index}
                       $selectedItem={$selectedItem}
                       $collapsed={$collapsed}
                       data={data}
                       setData={setData}
                       dataKey={dataKey}
                       {...props}/>
        </Vertical>
    </Horizontal>
}