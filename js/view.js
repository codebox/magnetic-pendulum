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
            }
        };
    }

    const viewAboveCanvas = buildCanvasWrapper(document.getElementById('viewAboveCanvas'), (x, y, z, magnification, canvasWidth, canvasHeight) => {
            return {
                x: x * magnification + canvasWidth / 2,
                y: z * magnification + canvasHeight / 2
            };
        }),
        viewAboveTrackCanvas = buildCanvasWrapper(document.createElement('canvas'), (x, y, z, magnification, canvasWidth, canvasHeight) => {
            return {
                x: x * magnification + canvasWidth / 2,
                y: z * magnification + canvasHeight / 2
            };
        }, () => {

        }),
        viewSideCanvas = buildCanvasWrapper(document.getElementById('viewSideCanvas'), (x, y, z, magnification, canvasWidth, canvasHeight) => {
            return {
                x:  x * magnification + canvasWidth  / 2,
                y: -y * magnification + canvasHeight / 2
            };
        });

    return {
        render(model) {
            viewAboveCanvas.render(model);
            //viewAboveCanvas.drawImage(viewAboveTrackCanvas.getCanvas());
            viewSideCanvas.render(model);
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