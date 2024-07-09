import { BufferGeometry, Float32BufferAttribute, Vector3, Matrix3, TextureLoader, MeshBasicMaterial } from 'three';
import { radii } from './solar_system_data.js';

class CelestialObjectGeometry extends BufferGeometry {
    constructor(radius = 1, transform = new Matrix3(), phiStart = 0, widthSegments = 32, heightSegments = 32) {
        super();

        this.type = 'CelestialObjectGeometry';

        const phiLength = Math.PI * 2;
        const thetaStart = 0, thetaLength = Math.PI;

        this.parameters = {
            radius: radius,
            widthSegments: widthSegments,
            heightSegments: heightSegments,
            phiStart: phiStart,
            phiLength: phiLength,
            thetaStart: thetaStart,
            thetaLength: thetaLength
        };

        widthSegments = Math.max(3, Math.floor(widthSegments));
        heightSegments = Math.max(2, Math.floor(heightSegments));

        const thetaEnd = Math.min(thetaStart + thetaLength, Math.PI);

        let index = 0;
        const grid = [];

        const vertex = new Vector3();
        const normal = new Vector3();

        // buffers
        const indices = [];
        const vertices = [];
        const normals = [];
        const uvs = [];

        // generate vertices, normals and uvs
        for (let iy = 0; iy <= heightSegments; iy++) {
            const verticesRow = [];
            const v = iy / heightSegments;

            // special case for the poles
            let uOffset = 0;
            if (iy === 0 && thetaStart === 0) {
                uOffset = 0.5 / widthSegments;
            } else if (iy === heightSegments && thetaEnd === Math.PI) {
                uOffset = - 0.5 / widthSegments;
            }

            for (let ix = 0; ix <= widthSegments; ix++) {
                const u = ix / widthSegments;

                // vertex
                const v_prime = new Vector3(
                    - radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength),
                    - radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength),
                    radius * Math.cos(thetaStart + v * thetaLength)
                );
                vertex.copy(v_prime.applyMatrix3(transform));
                vertices.push(vertex.x, vertex.y, vertex.z);

                // normal
                normal.copy(vertex).normalize();
                normals.push(normal.x, normal.y, normal.z);

                // uv
                uvs.push(u + uOffset, 1 - v);

                verticesRow.push(index++);
            }

            grid.push(verticesRow);
        }

        // indices
        for (let iy = 0; iy < heightSegments; iy++) {
            for (let ix = 0; ix < widthSegments; ix++) {
                const a = grid[iy][ix + 1];
                const b = grid[iy][ix];
                const c = grid[iy + 1][ix];
                const d = grid[iy + 1][ix + 1];

                if (iy !== 0 || thetaStart > 0) indices.push(a, b, d);
                if (iy !== heightSegments - 1 || thetaEnd < Math.PI) indices.push(b, c, d);
            }
        }

        // build geometry
        this.setIndex(indices);
        this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    }

    copy(source) {
        super.copy(source);
        this.parameters = Object.assign({}, source.parameters);
        return this;
    }
}

class GeometryCreator {
    create() {
        throw new Error("create() must be implemented by subclass.");
    }
}

class SunGeometryCreator extends GeometryCreator {
    constructor() {
        super();
    }

    create() {
        return new CelestialObjectGeometry(radii.sun);
    }
}

class EarthGeometryCreator extends GeometryCreator {
    constructor() {
        super();
    }

    create() {
        const obliquity = 23.439281 * Math.PI / 180;
        return new CelestialObjectGeometry(radii.earth, new Matrix3(
            1.0, 0.0, 0.0,
            0.0, Math.cos(obliquity), Math.sin(obliquity),
            0.0, -Math.sin(obliquity), Math.cos(obliquity)
        ), 0.0047 * 2 * Math.PI);
    }
}

class MoonGeometryCreator extends GeometryCreator {
    constructor() {
        super();
    }

    create() {
        return new CelestialObjectGeometry(radii.moon);
    }
}

class MaterialCreator {
    constructor(texturePath) {
        this.texturePath = texturePath;
    }

    create() {
        const texture = new TextureLoader();
        const material = new MeshBasicMaterial({ map: texture });
        texture.load(
            this.texturePath,
            (texture) => {
                material.map = texture;
                material.needsUpdate = true;
            },
        )
        return material;
    }
}

export { SunGeometryCreator, EarthGeometryCreator, MoonGeometryCreator, MaterialCreator };
