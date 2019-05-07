const view = (() => {
    "use strict";

    const colours = {
        bob : 'blue',
        bobOutline : 'black',
        magnet : 'darkgrey',
        magnetOutline : 'black',
        rope : 'lightgrey',
        fixture : 'black'
    };

    function buildCanvasWrapper(canvasEl, transformCoords) {
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

        function transform(position){
            const [x,y,z] = position.toArray();
            return transformCoords(x, y, z, magnification, width, height);
        }

        return {
            render(model) {
                clear();
                drawLine(transform(model.fixture.position), transform(model.mass.position), colours.rope);
                drawCircle(transform(model.fixture.position), 5, colours.fixture);
                model.magnets.forEach(magnet => {
                    drawCircle(transform(magnet.position), 10, colours.magnet, colours.magnetOutline);
                });
                drawCircle(transform(model.mass.position), 20, colours.bob, colours.bobOutline);
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
        });

    return {
        render(model) {
            viewAboveCanvas.render(model);
            viewSideCanvas.render(model);
        }
    };
})();