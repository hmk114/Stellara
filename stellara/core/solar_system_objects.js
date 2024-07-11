'use strict';

import * as Mesh from './mesh.js';
import * as Orbit from './orbit.js';
import * as Rotation from './rotation.js';
import { CelestialObject } from './celestial_object.js';

const moon = new CelestialObject(
    "Moon", [], new Orbit.MoonOrbit(), new Rotation.MoonRotation(),
    Mesh.CreateMoonGeometry(), Mesh.CreateMoonMaterials(1)
);

const earth = new CelestialObject(
    "Earth", [moon], new Orbit.EarthOrbit(), new Rotation.EarthRotation(),
    Mesh.CreateEarthGeometry(), Mesh.CreateEarthMaterials(1)
);

const sun = new CelestialObject(
    "Sun", [earth], new Orbit.SunOrbit(), new Rotation.SunRotation(),
    Mesh.CreateSunGeometry(), Mesh.CreateSunMaterials(), 0, false, false
);

export default [sun, earth, moon];
