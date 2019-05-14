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
        },
        max(maxLen){
            const length = this.length();
            if (length > maxLen){
                return this.multiply(maxLen / length);
            }
            return this;
        }
    };
}

const springLength = 10;
    model = (() => {
        "use strict";

        return {
            gravity : vector([0, -10, 0]),
            springConstant : 100,
            airResistance : 5,
            magnets : [],
            fixture : {
                length : springLength,
                position : vector([0, springLength, 0])
            },
            mass: {
                m : 10,
                position : vector([springLength, springLength, 0]),
                velocity : vector([0, 0, 0])
            },
            springLength
        };
    })();

const presets = (() => {
    function buildMagnetCoords(sides, distance, m, y=0, offset=0){
        return Array.from({length: sides}, (_, i) => {
            const angle = i * Math.PI * 2 / sides + offset;
            return {
                position : vector([distance * Math.sin(angle), y, distance * Math.cos(angle)]),
                m
            };
        });
    }

    return {
        'Blank' : {
            magnets : []
        },
        'Triangle' : {
            magnets : buildMagnetCoords(3, 5, 8, -1),
            position : vector([springLength, springLength, 0]),
            velocity : vector([0, 0, 10])
        },
        'Square' : {
            magnets : buildMagnetCoords(4, 4, 6, 0, Math.PI / 4),
            position : vector([springLength, springLength, 0]),
            velocity : vector([0, 0, -10])
        },
        'Hexagons' : {
            magnets : buildMagnetCoords(6, 4, 2).concat(buildMagnetCoords(6, 6, 6, 0, Math.PI / 6)),
            position : vector([springLength, springLength, 0]),
            velocity : vector([0, 0, 10])
        }
    };
});