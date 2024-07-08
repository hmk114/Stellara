import Application from './stellara/core/app.js';
import { CelestialObject } from './stellara/core/celestial_object.js';
import * as Orbit from './stellara/core/orbit.js';
import * as Rotation from './stellara/core/rotation.js';
import { radii } from './stellara/core/solar_system_data.js';

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
const moon = new CelestialObject("Moon", [], new Orbit.MoonOrbit(), radii.moon, new Rotation.MoonRotation());
const earth = new CelestialObject("Earth", [moon], new Orbit.EarthOrbit(), radii.earth, new Rotation.EarthRotation());
const sun = new CelestialObject("Sun", [earth], new Orbit.SunOrbit(), radii.sun, new Rotation.SunRotation());
const app = new Application([sun, earth, moon]);

app.animate();
