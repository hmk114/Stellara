'use strict';

import * as THREE from 'three';
import { update } from 'three/examples/jsm/libs/tween.module.js';

class CelestialObject {
    #name;

    #children;
    #orbit;
    #rotation;
    #geometry;
    #materials;
    #orbitMaterial;
    #curMaterialIndex;

    #visible;
    #showOrbit;
    #showRotationAxis;

    #castShadow;
    #receiveShadow;

    #mesh;
    #axisMesh;
    #orbitMesh;
    #meshGroup;

    constructor(name, children, orbit, rotation, geometry, materials, orbitMaterial, curMaterialIndex = 0, castShadow = true, receiveShadow = true) {
        this.#name = name;
        this.#children = children;
        this.#orbit = orbit;

        this.#rotation = rotation;

        this.#geometry = geometry;
        this.#materials = materials;
        this.#orbitMaterial = orbitMaterial;
        this.#curMaterialIndex = curMaterialIndex;

        this.#visible = true;
        this.#showOrbit = true;
        this.#showRotationAxis = false;

        this.#castShadow = castShadow;
        this.#receiveShadow = receiveShadow;

        // meshGroup contains all currently visible meshes
        this.#meshGroup = new THREE.Group();

        this.#createMeshes();
        this.#updateMeshGroup();
    }

    #createMeshes() {
        this.#mesh = new THREE.Mesh(this.#geometry, this.#materials[this.#curMaterialIndex]);

        if (this.#rotation) {
            const delta = this.#rotation.getRotationAxis().multiplyScalar(this.#geometry.parameters.radius * 2);
            const vertex1 = this.#mesh.position.clone().add(delta);
            const vertex2 = this.#mesh.position.clone().sub(delta);
            const axisGeometry = new THREE.BufferGeometry().setFromPoints([vertex1, vertex2]);
            const axisMaterial = new THREE.LineDashedMaterial({ color: 0xffffff });
            this.#axisMesh = new THREE.Line(axisGeometry, axisMaterial);
        }

        this.#orbitMesh = new THREE.Line(new THREE.BufferGeometry(), this.#orbitMaterial);
    }

    #updateMeshGroup() {
        const updateMesh = (mesh, visible) => {
            if (!mesh) {
                return;
            }
            if (visible && !this.#meshGroup.children.includes(mesh)) {
                this.#meshGroup.add(mesh);
            }
            if (!visible && this.#meshGroup.children.includes(mesh)) {
                this.#meshGroup.remove(mesh);
            }
        };

        updateMesh(this.#mesh, this.#visible);
        updateMesh(this.#axisMesh, this.#visible && this.#showRotationAxis);
        updateMesh(this.#orbitMesh, this.#visible && this.#showOrbit);
    }

    /**
     * @param {boolean} value
     */
    set visible(value) {
        if (this.#visible === value) {
            return;
        }
        this.#visible = value;
        this.#updateMeshGroup();
    }

    get visible() {
        return this.#visible;
    }

    /**
     * @param {boolean} value
     */
    set showRotationAxis(value) {
        if (this.#showRotationAxis === value) {
            return;
        }
        this.#showRotationAxis = value;
        this.#updateMeshGroup();
    }

    /**
     * @param {boolean} value
     */
    set showOrbit(value) {
        this.#showOrbit = value;
    }

    get name() {
        return this.#name;
    }

    get children() {
        return this.#children;
    }

    get radius() {
        return this.#mesh.geometry.parameters.radius;
    }

    get meshGroup() {
        return this.#meshGroup;
    }

    get position() {
        return this.#mesh.position.clone();
    }

    get castShadow() {
        return this.#castShadow;
    }

    get receiveShadow() {
        return this.#receiveShadow;
    }

    #positionAtTime(jd) {
        return this.#orbit ? this.#orbit.positionAtTime(jd) : new Vector3();
    }

    #rotationAtTime(jd) {
        return this.#rotation ? {
            axis: this.#rotation.getRotationAxis(),
            angle: this.#rotation.rotationAtTime(jd)
        } : {
            axis: new THREE.Vector3(0, 0, 1),
            angle: 0.0
        };
    }

    updatePosition(scene, camera, jd, basePosition) {
        // calculate the position of the object
        const [baseX, baseY, baseZ] = basePosition;
        const position = this.#positionAtTime(jd);

        const [x, y, z] = [position.x + baseX, position.y + baseY, position.z + baseZ];
        this.#mesh.position.set(x, y, z);
        this.#axisMesh.position.set(x, y, z);

        // TODO: move into meshGroup
        // update orbit

        const orbitPoints = this.#orbit.orbitCurve(jd);
        if (orbitPoints.length !== 0) {
            for (let i = 0; i < orbitPoints.length; i++) {
                orbitPoints[i] = new THREE.Vector3(orbitPoints[i].x + baseX, orbitPoints[i].y + baseY, orbitPoints[i].z + baseZ);
            }
            let orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
            this.#orbitMesh.geometry.dispose();
            this.#orbitMesh.geometry = orbitGeometry;
        }


        // apply rotation
        const { axis, angle } = this.#rotationAtTime(jd);
        this.#mesh.setRotationFromAxisAngle(axis, angle);

        // set scale
        const minAngularRadius = 0.002;
        const dis = camera.position.distanceTo(this.#mesh.position);
        const realAngularRadius = Math.atan(this.radius / dis);

        this.#mesh.scale.setScalar(Math.max(minAngularRadius / realAngularRadius, 1));

        for (const child of this.#children) {
            child.updatePosition(scene, camera, jd, [x, y, z]);
        }
    }

    updateShadow(opaqueObjects) {
        if (typeof this.#mesh.material.updateShadowUniforms !== 'function') {
            return;
        }

        // remove self from the list
        const filteredOpaqueObjects = opaqueObjects.filter(obj => obj !== this);
        this.#mesh.material.updateShadowUniforms(filteredOpaqueObjects);
    }

    switchTexture(index) {
        if (index < 0 || index >= this.#materials.length) {
            return;
        }

        this.#curMaterialIndex = index;
        this.#mesh.material = this.#materials[index];
    }
}



export { CelestialObject };
