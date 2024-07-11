'use strict';

import * as Mesh from './mesh.js';
import * as Orbit from './orbit.js';
import * as Rotation from './rotation.js';
import { CelestialObject } from './celestial_object.js';
import { LineBasicMaterial } from 'three';

const moon = new CelestialObject(
    "Moon", [], new Orbit.MoonOrbit(), new Rotation.MoonRotation(), 
    Mesh.CreateMoonGeometry(), Mesh.CreateMoonMaterials(1), new LineBasicMaterial({ color: 0xf0ffff })
);

const earth = new CelestialObject(
    "Earth", [moon], new Orbit.EarthOrbit(), new Rotation.EarthRotation(), 
    Mesh.CreateEarthGeometry(), Mesh.CreateEarthMaterials(1), new LineBasicMaterial({ color: 0x1e90ff })
);

const sun = new CelestialObject(
    "Sun", [earth], new Orbit.SunOrbit(), new Rotation.SunRotation(),
    Mesh.CreateSunGeometry(), Mesh.CreateSunMaterials(), new LineBasicMaterial({ color: 0xffffff }), 0, false, false
);

export default [sun, earth, moon];
