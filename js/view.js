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

    function buildCanvasWrapper(canvasEl, transformCoords, customRenderFn) {
        const width = canvasEl.clientWidth,
            height = canvasEl.clientHeight,
            magnification = 20,
            ctx = canvasEl.getContext('2d');

        canvasEl.width = width;
        canvasEl.height = height;

        function clear() {
            ctx.clearRect(0, 0, width, height);
        }
        function drawCircle(xy, diameter, fillColour, outlineColour=fillColour) {
            ctx.fillStyle = fillColour;
            ctx.strokeStyle = outlineColour;
            ctx.beginPath();
            ctx.arc(xy.x, xy.y, diameter/2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fill();
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

        const render = customRenderFn || (model => {
            clear();
            drawLine(transform(model.fixture.position), transform(model.mass.position), colours.rope);
            drawCircle(transform(model.fixture.position), 5, colours.fixture);
            model.magnets.forEach((magnet, i) => {
                drawCircle(transform(magnet.position), 10 + magnet.m * 5, colours.magneticField, colours.magneticFieldOutline);
                drawCircle(transform(magnet.position), 10, colours.magnet, colours.magnetOutline);
                text(transform(magnet.position), String.fromCharCode(65 + i));
            });
            drawCircle(transform(model.mass.position), 20, colours.bob, colours.bobOutline);
        });
        return {
            render,
            drawImage(img) {
                ctx.drawImage(img, 0, 0, width, height);
            },
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
        startStop = document.getElementById('startStop');

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
                h = Math.sqrt(10 * 10 - l * l),
                outside = l > 10,
                mouseY = outside ? 10 : 10 - h;

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

    return {
        render(model) {
            viewAboveCanvas.render(model);
            viewSideCanvas.render(model);
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
        updateMagnetList(model) {
            const magnetList = document.getElementById('magnetList');
            while (magnetList.firstChild) {
                magnetList.removeChild(magnetList.firstChild);
            }
            model.magnets.forEach((magnet, i) => {
                const box = document.createElement('div'),
                    label = document.createElement('label'),
                    slider = document.createElement('input'),
                    removeButton = document.createElement('button');

                box.setAttribute('class', 'magnetBox');

                label.innerText = String.fromCharCode(65 + i);
                box.appendChild(label);

                slider.setAttribute('min', 0);
                slider.setAttribute('max', 20);
                slider.value = magnet.m;
                slider.setAttribute('type', 'range');
                slider.oninput = () => {
                    document.dispatchEvent(new CustomEvent('magnetChanged', { detail: {index:i, newValue:slider.value }}));
                };
                box.appendChild(slider);

                removeButton.innerHTML = 'x';
                removeButton.onclick = () => {
                    document.dispatchEvent(new CustomEvent('magnetRemoved', { detail: i }))
                };
                box.appendChild(removeButton);

                magnetList.appendChild(box);
            });
        }
    };
})();