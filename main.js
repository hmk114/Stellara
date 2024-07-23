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

document.getElementById("TopView").addEventListener('click', () => eventBus.publish('TopView'));
document.getElementById("SideView").addEventListener('click', () => eventBus.publish('SideView'));
document.getElementById("3DView").addEventListener('click', () => eventBus.publish('3DView'));

document.getElementById("ViewSwitchingSun").addEventListener('click', () => eventBus.publish('ViewSwitchingSun'));
document.getElementById("ViewSwitchingEarth").addEventListener('click', () => eventBus.publish('ViewSwitchingEarth'));
document.getElementById("ViewSwitchingMoon").addEventListener('click', () => eventBus.publish('ViewSwitchingMoon'));

document.getElementById("HalfSpeed").addEventListener('click', () => eventBus.publish('HalfSpeed'));
document.getElementById("TwotimesSpeed").addEventListener('click', () => eventBus.publish('TwotimesSpeed'));
document.getElementById("ReturnSpeed").addEventListener('click', () => eventBus.publish('ReturnSpeed'));
document.getElementById("Stop").addEventListener('click', () => eventBus.publish('Stop'));

document.getElementById("totalSolarEclipse").addEventListener('click', () => eventBus.publish('totalSolarEclipse'));
document.getElementById("partialSolarEclipse").addEventListener('click', () => eventBus.publish('partialSolarEclipse'));
document.getElementById("annularSolarEclipse").addEventListener('click', () => eventBus.publish('annularSolarEclipse'));
document.getElementById("totalLunarEclipse").addEventListener('click', () => eventBus.publish('totalLunarEclipse'));
document.getElementById("partialLunarEclipse").addEventListener('click', () => eventBus.publish('partialLunarEclipse'));
document.getElementById("annularLunarEclipse").addEventListener('click', () => eventBus.publish('annularLunarEclipse'));

flatpickr("#datetimePicker", {
    inline: true,
    enableTime: true,
    enableSeconds: true,
    dateFormat: "Y-m-d H:i:S",
    defaultDate: "2024-10-02 02:30:00",
    onChange: function(selectedDates, dateStr, instance) {
        eventBus.publish('TimeSelection', dateStr);
    }
});

const eventBus = new EventBus();
const app = new Application(solarSystemObjects, eventBus);
app.animate();
