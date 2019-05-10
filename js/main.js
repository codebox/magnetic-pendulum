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
    const SPRING_CONSTANT = 100,
        M = 100,
        DRAG = 0.5,
        DAMPING = 1,
        fromMassToFixture = model.fixture.position.subtract(model.mass.position),
        theta = fromMassToFixture.reverse().angleBetween(model.gravity),
        gravityComponent = model.mass.m * model.gravity.length() * Math.cos(theta),
        l = fromMassToFixture.length(),
        velAngle = fromMassToFixture.angleBetween(model.mass.velocity),
        velocity = Math.abs(model.mass.velocity.length() * Math.sin(velAngle)),
        centrepetal = model.mass.m * velocity * velocity  / l,
        springForce = (l - 10) * SPRING_CONSTANT,
        springDamping = velocity * DAMPING;

    let magneticAcc = vector([0,0,0]);
    model.magnets.forEach(mag => {
        const d = model.mass.position.distanceBetween(mag.position),
            fromMassToMagnet = mag.position.subtract(model.mass.position);
        magneticAcc = magneticAcc.add(fromMassToMagnet.normalise().multiply(M * mag.m / (d * d)));
    });

    const theta2 = fromMassToFixture.reverse().angleBetween(magneticAcc),
        magneticForceComponent = model.mass.m * magneticAcc.length() * Math.cos(theta2),
        tensionMagnitude = gravityComponent + centrepetal + springForce - springDamping + magneticForceComponent,
        tension = fromMassToFixture.normalise().multiply(tensionMagnitude),
        airResistance = model.mass.velocity.reverse().normalise().multiply(DRAG * velocity * velocity);

    let force = model.gravity.multiply(model.mass.m);
    force = force.add(tension).add(airResistance).add(magneticAcc.multiply(model.mass.m));

    return force;
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

    let state, stateChangeHandler, addMagnetHandler, addingMagnet;

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
        prevMassVelocity = massLocation.subtract(prevMassLocation).multiply(1/(ts - prevMassTs));
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


