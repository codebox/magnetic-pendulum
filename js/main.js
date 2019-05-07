
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
    //see https://news.ycombinator.com/item?id=8007477
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

let prevT;
function updateAndRender() {
    let now = Date.now() / 1000;
    if (prevT === undefined) {

    } else {
        updateSystem(now - prevT);
        view.render(model);
    }
    prevT = now;
    requestAnimationFrame(updateAndRender);
}

requestAnimationFrame(updateAndRender);
