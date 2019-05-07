const view = (() => {
    "use strict";
    const
        buildCanvasHelper = (canvasEl) => {
            const width = canvasEl.clientWidth,
                height = canvasEl.clientHeight,
                ctx = canvasEl.getContext('2d');

            return {
                clear(){
                    ctx.clearRect(0, 0, width, height);
                }
            }
        },

        viewAboveCanvas = (() => {
            const el = document.getElementById('viewAboveCanvas'),
                canvasHelper = buildCanvasHelper(el);

            return {
                render(model) {
                    canvasHelper.clear();
                }
            };
        })(),

        viewSideCanvas = (() => {
            const el = document.getElementById('viewSideCanvas'),
                canvasHelper = buildCanvasHelper(el);

            return {
                render(model) {
                    canvasHelper.clear();
                }
            };
        })();

    return {
        render(model) {
            viewAboveCanvas.render(model);
            viewSideCanvas.render(model);
        }
    };
})();