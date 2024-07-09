import Application from './stellara/core/app.js';
import { CelestialObject } from './stellara/core/celestial_object.js';
import * as Orbit from './stellara/core/orbit.js';
import * as Rotation from './stellara/core/rotation.js';
import * as Meshes from './stellara/core/mesh.js';
import { Mesh } from 'three';

class EventBus {
    constructor() {
        this.publishedEvents = {};
    }

    publish(eventName, ...args) {
        const callbacks = this.publishedEvents[eventName];

        if (!callbacks) {
            console.warn(eventName + " not found!");
            return;
        }

        for (let callback of callbacks) {
            callback(...args);
        }
    }

    subscribe(eventName, callback) {
        if (typeof callback !== "function") {
            console.warn("callback must be a function!");
            return;
        }

        if (!this.publishedEvents[eventName]) {
            this.publishedEvents[eventName] = [];
        }

        this.publishedEvents[eventName].push(callback);
    }
}

const eventBus = new EventBus();
const moon = new CelestialObject("Moon", [], new Orbit.MoonOrbit(), new Rotation.MoonRotation(), new Meshes.MoonGeometryCreator(), new Meshes.MoonMaterialCreator());
const earth = new CelestialObject("Earth", [moon], new Orbit.EarthOrbit(), new Rotation.EarthRotation(), new Meshes.EarthGeometryCreator(), new Meshes.EarthMaterialCreator());
const sun = new CelestialObject("Sun", [earth], new Orbit.SunOrbit(), new Rotation.SunRotation(), new Meshes.SunGeometryCreator(), new Meshes.SunMaterialCreator());
const app = new Application([sun, earth, moon]);

app.animate();
