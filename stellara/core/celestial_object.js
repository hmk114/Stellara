import { Vector3, SphereGeometry, MeshBasicMaterial, Mesh } from 'three';

class CelestialObject {
    constructor(name, children, orbit, radius = 1.0) {
        this.name = name;
        this.children = children;
        this.orbit = orbit;

        this.radius = radius;
        const geometry = new SphereGeometry(radius, 32, 32);
        const material = new MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new Mesh(geometry, material)
    }

    positionAtTime(jd) {
        return this.orbit ? this.orbit.positionAtTime(jd) : new Vector3();
    }
}

export { CelestialObject };