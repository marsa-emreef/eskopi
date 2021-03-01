import {Vertical} from "components/layout/Layout";
import {memo, useContext, useRef} from "react";
import {DropListenerContext} from "module/page-builder/index";
import {ObserverValue, useObserverMapper} from "components/useObserver";
import {v4 as uuid} from "uuid";
import {Controls} from "module/page-builder/controls/ControlListPanel";
import useForm from "components/useForm";
import SpaceController from "module/page-builder/controls/controller/SpaceController";
import LabelController from "module/page-builder/controls/controller/LabelController";
import ButtonController from "module/page-builder/controls/controller/ButtonController";
import TextInputController from "module/page-builder/controls/controller/TextInputController";
import TextAreaController from "module/page-builder/controls/controller/TextAreaController";
import {getPlaceHolder, usePlaceHolderListener} from "module/page-builder/page/getPlaceHolder";


/**
 * Function to get parent element ids from current parentElement
 * @param element
 * @param root
 * @returns {string[]|*[]}
 */
function traceParentId(element, root) {
    const parentElement = element.parentElement;
    const dataId = parentElement.getAttribute('data-id');
    if (parentElement.parentElement !== root) {
        const newResult = traceParentId(parentElement, root);
        return [...newResult, dataId];
    } else {
        return [dataId];
    }
}


export default function PageEditorPanel({$data, setData, $selectedController, setSelectedController}) {
    const dropListener = useContext(DropListenerContext);
    usePlaceHolderListener("drop", (event) => {
        const data = JSON.parse(event.dataTransfer.getData('text/plain'));
        // we need to know the parent first
        const placeHolder = getPlaceHolder();
        const childIndex = Array.prototype.indexOf.call(placeHolder.parentElement.children, placeHolder);
        if (placeHolder.parentElement === rootRef.current) {
            setData(oldData => {
                const newData = {...oldData};
                newData.children = newData.children || [];
                newData.children.splice(childIndex, 0, {
                    id: uuid(),
                    ...data,
                });
                newData.children = [...newData.children];
                return newData;
            });
        } else {
            const parentIds = traceParentId(placeHolder, rootRef.current);
            setData(oldData => {
                let newData = oldData;
                for (const id of parentIds) {
                    newData.children = [...newData.children];
                    newData = newData.children.filter(d => d.id === id)[0];
                }
                newData.children = newData.children || [];
                newData.children.splice(childIndex, 0, {
                    id: uuid(),
                    ...data,
                });
                newData.children = [...newData.children];
                return JSON.parse(JSON.stringify(oldData));
            });
        }

    });
    const dragHoverCountRef = useRef(0);
    const handleDragEnter = (event) => {
        const placeHolder = getPlaceHolder({display: 'block'});
        dragHoverCountRef.current++;
        if (dragHoverCountRef.current <= 0) {
            return;
        }

        // activating placeholder
        if (placeHolder.parentElement !== event.currentTarget) {
            event.currentTarget.append(placeHolder);
        }
    }
    const handleDragLeave = () => {
        dragHoverCountRef.current--;
        if (dragHoverCountRef.current > 0) {

        }
    }
    const handleDrop = (event) => {
        getPlaceHolder({display: 'none'});
        event.preventDefault();
        event.stopPropagation();
        dragHoverCountRef.current = 0;
        dropListener.current.call();

    }
    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
    }
    const rootRef = useRef();
    const {controller} = useForm();
    return <Vertical color={"light"} brightness={-3} p={3} flex={1}>
        <Vertical domRef={rootRef} color={"light"} brightness={0} flex={1} elevation={1}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop} p={2}
                  onClick={() => setSelectedController(null)}
                  data-layout={'vertical'}>

            <ObserverValue $observer={useObserverMapper($data, data => data.children)}
                           render={RenderLayoutMemo}
                           controller={controller}
                           $selectedController={$selectedController}
                           setSelectedController={setSelectedController} path={[]}/>
        </Vertical>
    </Vertical>
}

export const handleDragOver = () => {
    return (event) => {
        event.stopPropagation();
        event.preventDefault();
        const currentTarget = event.currentTarget;
        const parentTarget = currentTarget.parentNode;
        const elementPosition = currentTarget.getBoundingClientRect();
        const isLayout = currentTarget.getAttribute('data-layout');
        const heightPad = isLayout ? 5 : 0.3 * elementPosition.height;
        const widthPad = isLayout ? 5 : 0.3 * elementPosition.width;
        const mouseIsUp = event.clientY < (elementPosition.top + heightPad);
        const mouseIsDown = event.clientY > (elementPosition.top + (elementPosition.height - heightPad));
        const mouseIsLeft = event.clientX < (elementPosition.left + widthPad);
        const mouseIsRight = event.clientX > (elementPosition.left + (elementPosition.width - widthPad));

        const parentLayout = parentTarget.getAttribute('data-layout');
        const placeHolder = getPlaceHolder({display: 'block'});
        if (parentLayout === 'horizontal') {
            if (mouseIsLeft) {
                parentTarget.insertBefore(placeHolder, currentTarget);
            } else if (mouseIsRight) {
                const nextSibling = currentTarget.nextSibling;
                if (nextSibling) {
                    parentTarget.insertBefore(placeHolder, nextSibling);
                } else {
                    parentTarget.appendChild(placeHolder);
                }
            } else if (isLayout === 'horizontal') {
                currentTarget.appendChild(placeHolder);

            } else if (isLayout === 'vertical') {
                currentTarget.appendChild(placeHolder);
            }
        }
        if (parentLayout === 'vertical') {
            if (mouseIsUp) {
                parentTarget.insertBefore(placeHolder, currentTarget);
            } else if (mouseIsDown) {
                const nextSibling = currentTarget.nextSibling;
                if (nextSibling) {
                    parentTarget.insertBefore(placeHolder, nextSibling);
                } else {
                    parentTarget.appendChild(placeHolder);
                }
            } else if (isLayout === 'horizontal') {
                if (placeHolder.parentElement !== currentTarget) {
                    currentTarget.appendChild(placeHolder);
                }
            } else if (isLayout === 'vertical') {
                if (placeHolder.parentElement !== currentTarget) {
                    currentTarget.appendChild(placeHolder);
                }
            }
        }
    }
}

export const ControlMapper = {
    [Controls.SPACE]: SpaceController,
    [Controls.LABEL]: LabelController,
    [Controls.BUTTON]: ButtonController,
    [Controls.TEXT_INPUT]: TextInputController,
    [Controls.TEXT_AREA]: TextAreaController
}

const RenderLayout = ({value, controller, $selectedController, setSelectedController, path}) => {
    if (value === undefined) {
        return false;
    }
    return value.map(child => {
        const ChildRender = ControlMapper[child.type];
        return <ChildRender key={child.id}
                            data={child}
                            path={path}
                            formController={controller}
                            $selectedController={$selectedController}
                            setSelectedController={setSelectedController}

                            draggable={true}/>
    });
}
const RenderLayoutMemo = memo(RenderLayout);