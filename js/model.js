function vector(values){
    "use strict";
    return {
        multiply(f) {
            return vector(values.map(v => v * f));
        },
        add(other) {
            if (values.length !== other.toArray().length){
                throw new Error('mismatched vectors!', values, other);
            }
            return vector(values.map((v,i) => v + other.toArray()[i]));
        },
        subtract(other) {
            return this.add(other.multiply(-1));
        },
        length() {
            return Math.sqrt(values.map(v => v * v).reduce((a,v) => a + v));
        },
        dotProduct(other) {
            if (values.length !== other.toArray().length){
                throw new Error('mismatched vectors!', values, other);
            }
            return values.map((v,i) => v * other.toArray()[i]).reduce((a,v) => a + v);
        },
        angleBetween(other) {
            const lengthProduct = this.length() * other.length();
            if (lengthProduct){
                return Math.acos(this.dotProduct(other) / lengthProduct);
            }
            return 0;
        },
        distanceBetween(other) {
            return this.subtract(other).length();
        },
        normalise() {
            const l = this.length();
            if (l) {
                return this.multiply(1 / l);
            }
            return this;
        },
        reverse() {
            return this.multiply(-1);
        },
        toArray() {
            return [...values];
        }
    };
}

const model = (() => {
    "use strict";

    const springLength = 10;

    return {
        gravity : vector([0, -10, 0]),
        magnets : [
            {position:vector([1,0,5]),m:8},
            {position:vector([2,0,-7]),m:12},
            {position:vector([-4,0,0]),m:9}
        ],
        fixture : {
            length : springLength,
            position : vector([0, springLength, 0])
        },
        mass: {
            m : 10,
            position : vector([springLength, springLength, 0]),
            velocity : vector([0, 0, 0])
        }
    };
})();