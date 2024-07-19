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

const timeSpeedButtons = {
    FourtimesSpeed: 'FourtimesSpeed',
    TwotimesSpeed: 'TwotimesSpeed',
    HalfSpeed: 'HalfSpeed',
    QuarterSpeed: 'QuarterSpeed',
    Stop: 'Stop'
};

const speedTexts = {
    FourtimesSpeed: 'X4',
    TwotimesSpeed: 'X2',
    Stop: 'X1',
    HalfSpeed: 'X0.5',
    QuarterSpeed: 'X0.25'
};

document.getElementById("EarthTransformation").addEventListener('click', () => eventBus.publish('EarthTransformation'));
document.getElementById("TimeSelection").addEventListener('change', () => eventBus.publish('TimeSelection', document.getElementById("TimeSelection").value));
document.getElementById("topView").addEventListener('click', () => eventBus.publish('topView'));
document.getElementById("sideView").addEventListener('click', () => eventBus.publish('sideView'));
document.getElementById("3DView").addEventListener('click', () => eventBus.publish('3DView'));
document.getElementById("ViewSwitchingSun").addEventListener('click', () => eventBus.publish('ViewSwitchingSun'));
document.getElementById("ViewSwitchingEarth").addEventListener('click', () => eventBus.publish('ViewSwitchingEarth'));
document.getElementById("ViewSwitchingMoon").addEventListener('click', () => eventBus.publish('ViewSwitchingMoon'));
Object.keys(timeSpeedButtons).forEach(buttonId => {
    const button = document.getElementById(buttonId);
    button.addEventListener('click', () => {
        if (button.classList.contains('active')) {
            button.classList.remove('active');
            eventBus.publish('Stop');
        } else {
            Object.keys(timeSpeedButtons).forEach(id => document.getElementById(id).classList.remove('active'));
            button.classList.add('active');
            eventBus.publish(timeSpeedButtons[buttonId]);
        }
    });
});
document.getElementById("popwindow").addEventListener('click', () =>{
    eventBus.publish('popwindow');
});

const eventBus = new EventBus();
const app = new Application(solarSystemObjects, eventBus);
app.animate();
