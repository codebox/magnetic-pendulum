const view = (() => {
    "use strict";

    const colours = {
        bob : '#FFA700',
        bobOutline : 'black',
        magnet : '#1144AA',
        magnetOutline : '#05296E',
        magneticField : '#6B8FD455',
        magneticFieldOutline : '#4575D455',
        rope : 'lightgrey',
        fixture : 'black'
    };

    function buildCanvasWrapper(canvasEl, transformCoords) {
        const overlayEl = document.createElement('canvas'),
            width = canvasEl.clientWidth,
            height = canvasEl.clientHeight,
            magnification = 20,
            ctx = canvasEl.getContext('2d'),
            overlayCtx = overlayEl.getContext('2d');

        canvasEl.width = overlayEl.width = width;
        canvasEl.height = overlayEl.height = height;

        function clear() {
            ctx.clearRect(0, 0, width, height);
        }
        function clearOverlay() {
            overlayCtx.clearRect(0, 0, width, height);
        }
        function drawCircle(xy, diameter, fillColour, outlineColour=fillColour) {
            ctx.fillStyle = fillColour;
            ctx.strokeStyle = outlineColour;
            ctx.beginPath();
            ctx.arc(xy.x, xy.y, diameter/2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fill();
        }
        function drawOverlayDot(prevXy, xy, diameter, fillColour, outlineColour=fillColour, copyToMainCanvas) {
            overlayCtx.fillStyle = fillColour;
            overlayCtx.strokeStyle = outlineColour;
            overlayCtx.beginPath();
            overlayCtx.strokeStyle = '';
            // if (prevXy){
            //     overlayCtx.moveTo(prevXy.x, prevXy.y);
            //     overlayCtx.lineTo(xy.x, xy.y);
            //     overlayCtx.moveTo(xy.x, xy.y);
            // }
            overlayCtx.arc(xy.x, xy.y, diameter, 0, Math.PI * 2);
            overlayCtx.stroke();
            overlayCtx.fill();

            if (copyToMainCanvas) {
                ctx.drawImage(overlayEl, 0, 0, width, height);
            }
        }
        function drawLine(fromXy, toXy, colour) {
            ctx.strokeStyle = colour;
            ctx.beginPath();
            ctx.moveTo(fromXy.x, fromXy.y);
            ctx.lineTo(toXy.x, toXy.y);
            ctx.stroke();
        }
        function text(xy, text, colour = 'black', font='10px sans-serif') {
            ctx.font = font;
            ctx.fillStyle = colour;
            ctx.fillText(text, xy.x - 15, xy.y);
        }

        function transform(position){
            const [x,y,z] = position.toArray();
            return transformCoords(x, y, z, magnification, width, height);
        }

        let previousMassPosition;
        const render = (model, showOverlay) => {
            clear();
            drawLine(transform(model.fixture.position), transform(model.mass.position), colours.rope);
            drawCircle(transform(model.fixture.position), 5, colours.fixture);
            model.magnets.forEach((magnet, i) => {
                drawCircle(transform(magnet.position), 10 + magnet.m * 5, colours.magneticField, colours.magneticFieldOutline);
                drawCircle(transform(magnet.position), 10, colours.magnet, colours.magnetOutline);
                text(transform(magnet.position), String.fromCharCode(65 + i));
            });
            drawOverlayDot(previousMassPosition && transform(previousMassPosition), transform(model.mass.position), 2, colours.bob, colours.bobOutline, showOverlay);
            drawCircle(transform(model.mass.position), 20, colours.bob, colours.bobOutline);
            previousMassPosition = model.mass.position;
        };
        return {
            render,
            clearOverlay,
            getCanvas(){
                return canvasEl;
            },
            onClick(handler) {
                canvasEl.onclick = event => {
                    const rect = canvasEl.getBoundingClientRect(),
                        x = event.clientX - rect.left,
                        y = event.clientY - rect.top;
                    handler({x,y}, magnification, width, height);
                };
            },
            onMouseMove(handler) {
                canvasEl.onmousemove = event => {
                    const rect = canvasEl.getBoundingClientRect(),
                        x = event.clientX - rect.left,
                        y = event.clientY - rect.top;
                    handler({x,y}, magnification, width, height);
                };
            }
        };
    }

    const viewAboveCanvas = buildCanvasWrapper(document.getElementById('viewAboveCanvas'), (x, y, z, magnification, canvasWidth, canvasHeight) => {
            return {
                x: x * magnification + canvasWidth / 2,
                y: z * magnification + canvasHeight / 2
            };
        }),
        viewSideCanvas = buildCanvasWrapper(document.getElementById('viewSideCanvas'), (x, y, z, magnification, canvasWidth, canvasHeight) => {
            return {
                x:  x * magnification + canvasWidth  / 2,
                y: -y * magnification + canvasHeight / 2
            };
        }),
        addMagnet = document.getElementById('addMagnet'),
        startStop = document.getElementById('startStop'),
        toggleOverlay = document.getElementById('toggleOverlay'),
        clearOverlay = document.getElementById('clearOverlay');

    let showOverlay;
    toggleOverlay.onclick = () => {
        document.dispatchEvent(new CustomEvent('toggleOverlayClicked'));
    };
    clearOverlay.onclick = () => {
        document.dispatchEvent(new CustomEvent('clearOverlayClicked'));
    };

    addMagnet.onclick = () => {
        document.dispatchEvent(new CustomEvent('addMagnetClicked'));
    };

    viewAboveCanvas.onClick((canvasCoords, magnification, canvasWidth, canvasHeight) => {
        document.dispatchEvent(new CustomEvent('canvasClicked', {detail : {position: vector([(canvasCoords.x - canvasWidth/2) / magnification, 0, (-canvasHeight/2 + canvasCoords.y)/magnification])}}));
    });

    viewAboveCanvas.onMouseMove((canvasCoords, magnification, canvasWidth, canvasHeight) => {
        if (shiftDown){
            const mouseX = (canvasCoords.x - canvasWidth/2) / magnification,
                mouseZ = (-canvasHeight/2 + canvasCoords.y)/magnification,
                l = Math.sqrt(mouseX * mouseX + mouseZ * mouseZ),
                h = Math.sqrt(Math.max(model.springLength * model.springLength - l * l, 0)),
                outside = l > model.springLength,
                mouseY = outside ? model.springLength : model.springLength - h;

            const mouseCoords = vector([mouseX, mouseY, mouseZ]);
            document.dispatchEvent(new CustomEvent('massMoved', {detail : {position : mouseCoords}}));
        }
    });

    viewSideCanvas.onMouseMove((canvasCoords, magnification, canvasWidth, canvasHeight) => {
        if (shiftDown){
            const mouseX = (canvasCoords.x - canvasWidth/2) / magnification,
                mouseY = (canvasHeight/2 - canvasCoords.y)/magnification,
                l = Math.sqrt(mouseX * mouseX + mouseY * mouseY),
                d = Math.sqrt(Math.max(model.springLength * model.springLength - l * l, 0)),
                outside = d > model.springLength,
                mouseZ = outside ? model.springLength : model.springLength - d;

            const mouseCoords = vector([mouseX, mouseY, mouseZ]);
            document.dispatchEvent(new CustomEvent('massMoved', {detail : {position : mouseCoords}}));
        }
    });

    startStop.onclick = () => {
        document.dispatchEvent(new CustomEvent('startStopClicked'));
    };

    let shiftDown = false;
    document.addEventListener('keydown', event => {
        if (event.keyCode === 16){
            shiftDown = true;
        }
    });
    document.addEventListener('keyup', event => {
        if (event.keyCode === 16){
            shiftDown = false;
            document.dispatchEvent(new CustomEvent('massReleased'));
        }
    });

    const presetList = document.getElementById('presetList');
    Object.keys(presets).forEach(presetName => {
        const preset = presets[presetName],
            link = document.createElement('a');
        link.innerText = presetName;
        link.onclick = () => {
            document.dispatchEvent(new CustomEvent('presetSelected', {detail:{name:presetName}}));
        };
        presetList.appendChild(link);
    });

    function buildParameterSliders(){
        "use strict";
        const parameterList = document.getElementById('parameterList');

        function buildParameterSlider(name, min, max, value, onChange){
            const slider = buildSlider(name, min, max, value, (box, label, slider) => {
               slider.oninput = onChange;
            });
            parameterList.appendChild(slider);
        }

        buildParameterSlider('Gravity', 0, 20, model.gravity.length(),
            e => document.dispatchEvent(new CustomEvent('gravityChanged', {detail : {value : e.target.value}})));
        buildParameterSlider('Spring Constant', 2, 500, model.springConstant,
            e => document.dispatchEvent(new CustomEvent('springConstantChanged', {detail : {value : e.target.value}})));
    }

    function buildSlider(labelText, min, max, value, postProcess = () => {}){
        const box = document.createElement('div'),
            label = document.createElement('label'),
            slider = document.createElement('input');

        label.innerText = labelText;
        box.appendChild(label);

        slider.setAttribute('min', min);
        slider.setAttribute('max', max);
        slider.value = value;
        slider.setAttribute('type', 'range');
        box.appendChild(slider);

        postProcess(box, label, slider);

        return box;
    }

    buildParameterSliders();

    return {
        render(model) {
            viewAboveCanvas.render(model, showOverlay);
            viewSideCanvas.render(model, showOverlay);
        },
        onStart(){
            startStop.innerText = 'Stop';
        },
        onStop(){
            startStop.innerText = 'Start';
        },
        onAddingMagnet(){
            addMagnet.innerText = 'Cancel';
        },
        onAddingMagnetDone(){
            addMagnet.innerText = 'Add Magnet';
        },
        onAddingMagnetCancelled() {
            addMagnet.innerText = 'Add Magnet';
        },
        onShowOverlay(){
            toggleOverlay.innerText = 'Hide Trace';
            showOverlay = true;
            clearOverlay.style.display = 'inline';
        },
        onHideOverlay(){
            toggleOverlay.innerText = 'Show Trace';
            showOverlay = false;
            clearOverlay.style.display = 'none';
        },
        onClearOverlay(){
            viewAboveCanvas.clearOverlay();
            viewSideCanvas.clearOverlay();
        },
        updateMagnetList(model) {
            const magnetList = document.getElementById('magnetList');
            while (magnetList.firstChild) {
                magnetList.removeChild(magnetList.firstChild);
            }
            model.magnets.forEach((magnet, i) => {
                buildSlider(String.fromCharCode(65 + i), 0, 20, magnet.m, (box, label, slider) => {
                    const removeButton = document.createElement('button');
                    removeButton.innerHTML = 'x';
                    removeButton.onclick = () => {
                        document.dispatchEvent(new CustomEvent('magnetRemoved', { detail: i }))
                    };
                    box.appendChild(removeButton);

                    box.setAttribute('class', 'magnetBox');

                    slider.oninput = () => {
                        document.dispatchEvent(new CustomEvent('magnetChanged', { detail: {index:i, newValue:slider.value }}));
                    };
                    magnetList.appendChild(box);
                });
            });
        }
    };
})();