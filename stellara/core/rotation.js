'use strict';

import * as THREE from 'three';

class Rotation {
    #axis;

    constructor(axis) {
        this.#axis = axis;
    }

    getRotationAxis() {
        return this.#axis.clone();
    }

    rotationAtTime(jd) {
        return 0.0;
    }
}

class SunRotation extends Rotation {
    constructor() {
        // computed from data in https://en.wikipedia.org/wiki/Axial_tilt
        super(new THREE.Vector3(0.12241399, -0.0306615, 0.99200539));
    }

    rotationAtTime(jd) {
        // ignore offset
        return 2 * Math.PI * ((jd / 25.38) % 1);
    }
}

class EarthRotation extends Rotation {
    constructor() {
        const obliquity = 23.439281 * Math.PI / 180;
        super(new THREE.Vector3(0, Math.sin(obliquity), Math.cos(obliquity)));
    }

    rotationAtTime(jd) {
        // https://en.wikipedia.org/wiki/Sidereal_time
        return 2 * Math.PI * ((0.7790572732640 + 1.00273781191135448 * (jd - 2451545.0)) % 1);
    }
}

class MoonRotation extends Rotation {
    constructor() {
        super(new THREE.Vector3(-7.31313897e-17, -3.61614760e-04,  9.99999935e-01));
    }

    rotationAtTime(jd) {
        // ignore offset
        // 13.18 degrees per day
        return 2 * Math.PI * ((jd * 13.18 / 360) % 1);
    }
}

export { SunRotation, EarthRotation, MoonRotation };
