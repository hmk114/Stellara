'use strict';

import { radii } from './solar_system_data.js';

const vertex1 = `
#if MAX_NUM_OPAQUE_OBJECTS_IN_SCENE > 0
varying vec3 patchWorldPosition; // avoid name collision
#endif
`;

const vertex2 = `
    #if MAX_NUM_OPAQUE_OBJECTS_IN_SCENE > 0
    patchWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
    #endif
`;

const fragment = `
#if MAX_NUM_OPAQUE_OBJECTS_IN_SCENE > 0
uniform vec3 opaqueObjectPositions[MAX_NUM_OPAQUE_OBJECTS_IN_SCENE];
uniform float opaqueObjectRadius[MAX_NUM_OPAQUE_OBJECTS_IN_SCENE];
uniform int numOpaqueObjectsInScene;

varying vec3 patchWorldPosition;

float calculateShadowFraction(const in vec3 curPos, const in vec3 opaqueObjectPos, const in float opaqueObjectRadii) {
    float dsc = length(curPos);
    vec3 nsc = curPos / dsc;

    vec3 roc = curPos - opaqueObjectPos;
    float doc = length(roc);
    vec3 noc = roc / doc;
    if (doc < 1e-16) return 0.0;

    // nsc and noc are expected to be very close to each other
    // so we can use the length of their difference as an approximation
    float alpha = length(nsc - noc);

    if (alpha > 5e-2) return 0.0;

    float r1 = dsc * opaqueObjectRadii / doc;
    float r2 = ${radii.sun};
    float d = dsc * alpha;

    float r12 = r1 * r1, r22 = r2 * r2;

    if (d >= r1 + r2) return 0.0;
    if (d + r1 <= r2) return r12 / r22;
    if (d + r2 <= r1) return 1.0;

    float d2 = d * d;

    float area1 = r12 * acos((d2 + r12 - r22) / (2.0 * d * r1));
    float area2 = r22 * acos((d2 + r22 - r12) / (2.0 * d * r2));

    float p = (r1 + r2 + d) / 2.0;
    float area3 = 2.0 * sqrt(p * (p - r1) * (p - r2) * (p - d));

    return (area1 + area2 - area3) / (PI * r22);
}

void RE_Direct_Physical_Modified(const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
    float dotNL = saturate(dot(geometryNormal, directLight.direction));
    vec3 irradiance = dotNL * directLight.color;

    #if MAX_NUM_OPAQUE_OBJECTS_IN_SCENE > 0
    for (int i = 0; i < numOpaqueObjectsInScene; i++) {
        irradiance *= 1.0 - calculateShadowFraction(patchWorldPosition, opaqueObjectPositions[i], opaqueObjectRadius[i]);
    }
    #endif

    #ifdef USE_CLEARCOAT
	float dotNLcc = saturate(dot(geometryClearcoatNormal, directLight.direction));
	vec3 ccIrradiance = dotNLcc * directLight.color;
	clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat(directLight.direction, geometryViewDir, geometryClearcoatNormal, material);
	#endif

	#ifdef USE_SHEEN
	sheenSpecularDirect += irradiance * BRDF_Sheen(directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness);
	#endif

	reflectedLight.directSpecular += irradiance * BRDF_GGX(directLight.direction, geometryViewDir, geometryNormal, material);
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert(material.diffuseColor);
}

#undef RE_Direct
#define RE_Direct RE_Direct_Physical_Modified
#endif
`;

const vertexShaderPatcher = vertexShader => 
    vertexShader.replace(
        '#include <clipping_planes_pars_vertex>',
        `#include <clipping_planes_pars_vertex>
        ${vertex1}`
    ).replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        ${vertex2}`
    );

const fragmentShaderPatcher = fragmentShader =>
    fragmentShader.replace(
        '#include <lights_physical_pars_fragment>',
        `#include <lights_physical_pars_fragment>
        ${fragment}`
    );

export { vertexShaderPatcher, fragmentShaderPatcher };
