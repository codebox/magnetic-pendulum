function assert(cond, msg){
    "use strict";
    if (!cond){
        throw new Error(msg);
    }
}
function getNewPosition(p, u, t, a) {
    "use strict";
    //return u * t + a * t * t / 2;
    return p.add(u.multiply(t).add(a.multiply(t * t / 2)));
}

function getNewVelocity(u, t, a){
    "use strict";
    //return u + a * t;
    return u.add(a.multiply(t));
}

function calculateForce(model) {
    "use strict";
    const M = 100,
        DAMPING = 1,
        fromMassToFixture = model.fixture.position.subtract(model.mass.position),
        theta = fromMassToFixture.reverse().angleBetween(model.gravity),
        gravityComponent = model.mass.m * model.gravity.length() * Math.cos(theta),
        l = fromMassToFixture.length(),
        velAngle = fromMassToFixture.angleBetween(model.mass.velocity),
        velocity = Math.abs(model.mass.velocity.length() * Math.sin(velAngle)),
        centrepetal = model.mass.m * velocity * velocity  / l,
        springForce = (l - model.springLength) * model.springConstant,
        springDamping = velocity * DAMPING;

    let magneticAcc = vector([0,0,0]);
    model.magnets.forEach(mag => {
        const d = model.mass.position.distanceBetween(mag.position),
            fromMassToMagnet = mag.position.subtract(model.mass.position);
        magneticAcc = magneticAcc.add(fromMassToMagnet.normalise().multiply(M * mag.m / Math.max(d * d, 0.1)));
    });

    const theta2 = fromMassToFixture.reverse().angleBetween(magneticAcc),
        magneticForceComponent = model.mass.m * magneticAcc.length() * Math.cos(theta2),
        tensionMagnitude = gravityComponent + centrepetal + springForce - springDamping + magneticForceComponent,
        tension = fromMassToFixture.normalise().multiply(tensionMagnitude),
        airResistance = model.mass.velocity.reverse().normalise().multiply(model.airResistance / 10 * velocity * velocity);

    return model.gravity.multiply(model.mass.m).add(tension).add(airResistance).add(magneticAcc.multiply(model.mass.m));
}

function updateSystem(t){
    "use strict";
    const force = calculateForce(model),
        acceleration = force.multiply(1/model.mass.m),
        newVelocity = getNewVelocity(model.mass.velocity, t, acceleration),
        newPosition = getNewPosition(model.mass.position, model.mass.velocity, t, acceleration);

    model.mass.position = newPosition;
    model.mass.velocity = newVelocity;
}

const state = (() => {
    "use strict";

    const stateStopped = 'stopped',
        stateRunning = 'running';

    let state, stateChangeHandler, addMagnetHandler, addingMagnet, showingTrace, showingTraceHandler;

    function stateChanged() {
        if (stateChangeHandler) {
            stateChangeHandler({
                running: state === stateRunning,
                stopped: state === stateStopped
            });
        }
    }

    function addMagnetChanged() {
        if (addMagnetHandler){
            addMagnetHandler(addingMagnet);
        }
    }

    function showingTraceChanged() {
        if (showingTraceHandler){
            showingTraceHandler(showingTrace);
        }
    }

    return {
        started() {
            state = stateRunning;
            stateChanged();
        },
        stopped() {
            state = stateStopped;
            stateChanged();
        },
        onStateChanged(handler) {
            stateChangeHandler = handler;
        },
        isRunning(){
            return state === stateRunning;
        },
        addingMagnet(){
            addingMagnet = true;
            addMagnetChanged();
        },
        notAddingMagnet(){
            addingMagnet = false;
            addMagnetChanged();
        },
        onAddMagnetChanged(handler) {
            addMagnetHandler = handler;
        },
        isAddingMagnet(){
            return addingMagnet;
        },
        showingTrace() {
            showingTrace = true;
            showingTraceChanged();
        },
        notShowingTrace() {
            showingTrace = false;
            showingTraceChanged();
        },
        isShowingTrace() {
            return showingTrace;
        },
        onShowingTraceChanged(handler) {
            showingTraceHandler = handler;
        }
    };
})();

state.onStateChanged(state => {
    "use strict";
    if (state.running){
        view.onStart();
        requestAnimationFrame(updateAndRender);

    } else if (state.stopped) {
        view.onStop();

    } else {
        assert(false, 'Bad state', state)
    }
});

state.onAddMagnetChanged(isAddingMagnet => {
    "use strict";
    if (isAddingMagnet) {
        view.onAddingMagnet();
    } else {
        view.onAddingMagnetCancelled();
    }
});

state.onShowingTraceChanged(isShowingTrace => {
    "use strict";
    if (isShowingTrace){
        view.onShowOverlay();
    } else {
        view.onHideOverlay();
    }
});

let prevT;
function updateAndRender() {
    let now = Date.now() / 1000;
    if (prevT === undefined) {
        // don't draw anything

    } else {
        if (state.isRunning()) {
            updateSystem(Math.min(1 / 10, now - prevT));
        } else {
            prevT = undefined;
        }
        view.render(model);
    }
    prevT = now;
    requestAnimationFrame(updateAndRender);
}

view.updateMagnetList(model);
document.addEventListener('addMagnetClicked', event => {
    if (state.isAddingMagnet()) {
        state.notAddingMagnet();
    } else {
        state.addingMagnet();
    }
});
document.addEventListener('magnetRemoved', event => {
    model.magnets.splice(event.detail, 1);
    view.updateMagnetList(model);
});
document.addEventListener('magnetChanged', event => {
    model.magnets[event.detail.index].m = event.detail.newValue;
});

function applyPreset(name){
    "use strict";
    const preset = presets[name];
    model.magnets = preset.magnets.map(m => {
        return {...m};
    });
    if (preset.position){
        model.mass.position = preset.position;
    }
    if (preset.velocity){
        model.mass.velocity = preset.velocity;
    }
    view.updateMagnetList(model);
    view.onClearOverlay();
}
document.addEventListener('presetSelected', event => {
    "use strict";
    applyPreset(event.detail.name);
});
document.addEventListener('toggleOverlayClicked', event => {
    if (state.isShowingTrace()) {
        state.notShowingTrace();
    } else {
        state.showingTrace();
    }
});
document.addEventListener('clearOverlayClicked', event => {
    "use strict";
    view.onClearOverlay();
});

document.addEventListener('startStopClicked', event => {
    if (state.isRunning()){
        state.stopped();
    } else {
        state.started();
    }
});
document.addEventListener('canvasClicked', event => {
    if (state.isAddingMagnet()) {
        state.notAddingMagnet();
        view.onAddingMagnetDone();
        model.magnets.push({
            position: event.detail.position,
            m : 5
        });
        view.updateMagnetList(model);
    }
});

let prevMassLocation, prevMassVelocity, prevMassTs;
document.addEventListener('massMoved', event => {
    const ts = Date.now() / 1000,
        massLocation = event.detail.position;
    if (prevMassLocation) {
        prevMassVelocity = massLocation.subtract(prevMassLocation).multiply(1/(ts - prevMassTs)).max(50);
        model.mass.position = prevMassLocation;
        model.mass.velocity = prevMassVelocity;
    }
    prevMassLocation = massLocation;
    prevMassTs = ts;
    state.stopped();
});
document.addEventListener('massReleased', event => {
    prevMassLocation = prevMassVelocity = prevMassTs = undefined;
    state.started();
});
document.addEventListener('gravityChanged', event => {
    "use strict";
    model.gravity = vector([0, -event.detail.value, 0]);
});
document.addEventListener('springConstantChanged', event => {
    "use strict";
    model.springConstant = event.detail.value;
});

applyPreset('Triangle');
state.notShowingTrace();
state.started();
