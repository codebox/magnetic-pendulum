const view = (() => {
    "use strict";
    const display = document.getElementById('display'),
        mass = document.getElementById('mass'),
        fixture = document.getElementById('fixture'),
        displayWidth = 400,
        displayHeight = 400,
        size = 20;

    function position(el, pos, viewFromSide=false){
        const [x,y,z] = pos.toArray();
        el.style.left = (x * size + displayWidth/2) + 'px';
        if (viewFromSide) {
            el.style.top = (displayHeight - y * size) + 'px';
        } else {
            el.style.top = (displayHeight/2 - z * size) + 'px';
        }
    }

    position(fixture, model.fixture.position);
    model.magnets.forEach(mag => {
        const mel = document.createElement('div');
        mel.setAttribute('class', 'object magnet');
        display.appendChild(mel);
        position(mel, mag.position);
    });

    return {
        render(model) {
            position(mass, model.mass.position);
        }
    };
})();