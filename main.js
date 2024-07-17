'use strict';

import Application from './stellara/core/app.js';
import solarSystemObjects from './stellara/core/solar_system_objects.js';

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
document.getElementById("EarthTransformation").addEventListener('click', () => eventBus.publish('EarthTransformation'));
document.getElementById("ViewSwitching").addEventListener('click', () => eventBus.publish('ViewSwitching'));
document.getElementById("TimeSelection").addEventListener('change', () => eventBus.publish('TimeSelection', document.getElementById("TimeSelection").value));
document.getElementById("Stop").addEventListener('click', () => eventBus.publish('Stop'));
document.getElementById("popwindow").addEventListener('click', () =>{
    const url = 'https://ssd.jpl.nasa.gov/tools/orbit_viewer.html'; 
    const windowName = 'popupWindow';
    const windowFeatures = 'width=600,height=400,left=100,top=100';
    window.open(url, windowName, windowFeatures);
});
const eventBus = new EventBus();
const app = new Application(solarSystemObjects, eventBus);
app.animate();
