import * as THREE from 'three';

class Rotation {
    constructor() { }

    getRotationAxis() {
        throw new Error("getRotationAxis() must be implemented by subclass.");
    }

    rotationAtTime(jd) {
        throw new Error("rotationAtTime() must be implemented by subclass.");
    }
}

class SunRotation extends Rotation {
    constructor() {
        super();
        // computed from data in https://en.wikipedia.org/wiki/Axial_tilt
        this.axis = new THREE.Vector3(0.12241399, -0.0306615, 0.99200539);
    }

    getRotationAxis() {
        return this.axis.clone();
    }

    rotationAtTime(jd) {
        // ignore offset
        return 2 * Math.PI * Math.floor(jd / 25.38);
    }
}

class EarthRotation extends Rotation {
    constructor() {
        super();
        this.obliquity = 23.439281 * Math.PI / 180;
        this.axis = new THREE.Vector3(0, Math.sin(this.obliquity), Math.cos(this.obliquity));
    }

    getRotationAxis() {
        return this.axis.clone();
    }

    rotationAtTime(jd) {
        // https://en.wikipedia.org/wiki/Sidereal_time
        return 2 * Math.PI * Math.floor(0.7790572732640 + 1.00273781191135448 * (jd - 2451545.0));
    }
}

class MoonRotation extends Rotation {
    constructor() {
        super();
        this.axis = new THREE.Vector3(-7.31313897e-17, -3.61614760e-04,  9.99999935e-01);
    }

    getRotationAxis() {
        return this.axis.clone();
    }

    rotationAtTime(jd) {
        // ignore offset
        // 13.18 degrees per day
        return 2 * Math.PI * Math.floor(jd * 13.18 / 360);
    }
}

export { SunRotation, EarthRotation, MoonRotation };