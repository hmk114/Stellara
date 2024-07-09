import * as THREE from 'three';

class CelestialObject {
    constructor(name, children, orbit, radius, rotation) {
        this.$name = name;
        this.$children = children;
        this.$orbit = orbit;

        this.$radius = radius;
        this.$rotation = rotation;

        this.$visible = true;
        this.$showOrbit = false;
        this.$showRotationAxis = false;

        // meshGroup contains all currently visible meshes
        this.$meshGroup = new THREE.Group();
        this.$createMeshes();
        this.$updateMeshGroup();
    }

    $createMeshes() {
        const geometry = new THREE.SphereGeometry(this.$radius, 64, 64);
        const texture = new THREE.TextureLoader();

        if (this.$name === "Sun") {
            texture.load(
                "stellara/assets/texture/sun.jpg",
                (texture) => { 
                    this.$mesh.material.map = texture;
                    this.$mesh.material.needsUpdate = true;
                },
            )
        }

        else if (this.$name === "Moon") {
            texture.load(
                "stellara/assets/texture/moon.jpg",
                (texture) => {
                    this.$mesh.material.map = texture;
                    this.$mesh.material.needsUpdate = true;
                },
            )
        }
        
        else if (this.$name === "Earth") {
            texture.load(
                "stellara/assets/texture/earth.jpg",
                (texture) => {
                    this.$mesh.material.map = texture;
                    this.$mesh.material.needsUpdate = true;
                },
            )
        }
        const material = new THREE.MeshBasicMaterial({ map: texture });
        // const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.$mesh = new THREE.Mesh(geometry, material);


        if (this.$rotation) {
            const vertex1 = this.$mesh.position.clone().add(this.$rotation.getRotationAxis().multiplyScalar(this.$radius * 2));
            const vertex2 = this.$mesh.position.clone().sub(this.$rotation.getRotationAxis().multiplyScalar(this.$radius * 2));
            const axisGeometry = new THREE.BufferGeometry().setFromPoints([vertex1, vertex2]);
            const axisMaterial = new THREE.LineDashedMaterial({ color: 0xffffff });
            this.$axisMesh = new THREE.Line(axisGeometry, axisMaterial);
        }
    }

    $updateMeshGroup() {
        const updateMesh = (mesh, visible) => {
            if (!mesh) {
                return;
            }
            if (visible && !this.$meshGroup.children.includes(mesh)) {
                this.$meshGroup.add(mesh);
            }
            if (!visible && this.$meshGroup.children.includes(mesh)) {
                this.$meshGroup.remove(mesh);
            }
        };

        updateMesh(this.$mesh, this.$visible);
        updateMesh(this.$axisMesh, this.$visible && this.$showRotationAxis);
    }

    set visible(value) {
        if (this.$visible === value) {
            return;
        }
        this.$visible = value;
        this.$updateMeshGroup();
    }

    set showRotationAxis(value) {
        if (this.$showRotationAxis === value) {
            return;
        }
        this.$showRotationAxis = value;
        this.$updateMeshGroup();
    }

    $positionAtTime(jd) {
        return this.$orbit ? this.$orbit.positionAtTime(jd) : new Vector3();
    }

    $rotationAtTime(jd) {
        return this.$rotation ? {
            axis: this.$rotation.getRotationAxis(),
            angle: this.$rotation.rotationAtTime(jd)
        } : {
            axis: new THREE.Vector3(0, 0, 1),
            angle: 0.0
        };
    }

    get name() {
        return this.$name;
    }

    get children() {
        return this.$children;
    }

    get radius() {
        return this.$radius;
    }

    get meshGroup() {
        return this.$meshGroup;
    }

    update(scene, camera, jd, basePosition) {
        // calculate the position of the object
        const [baseX, baseY, baseZ] = basePosition;
        const position = this.$positionAtTime(jd);

        const [x, y, z] = [position.x + baseX, position.y + baseY, position.z + baseZ];
        this.$mesh.position.set(x, y, z);
        this.$axisMesh.position.set(x, y, z);

        // apply rotation
        const { axis, angle } = this.$rotationAtTime(jd);
        this.$mesh.rotateOnWorldAxis(axis, angle);

        // set scale
        const minAngularRadius = 0.005;
        const dis = camera.position.distanceTo(this.$mesh.position);
        const realAngularRadius = Math.atan(this.$radius / dis);

        this.$mesh.scale.setScalar(Math.max(minAngularRadius / realAngularRadius, 1));

        for (const child of this.$children) {
            child.update(scene, camera, jd, [x, y, z]);
        }
    }
}

export { CelestialObject };