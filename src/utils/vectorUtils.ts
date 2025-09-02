import { Line, Vertex2d, Vertex3d } from "../models/types/basicGeometries";

const TOLERANCE_PARALLEL = 1e-6;

function add(v0: Vertex3d, v1: Vertex3d): Vertex3d {
    return {
        x: v0.x + v1.x,
        y: v0.y + v1.y,
        z: v0.z + v1.z
    };
}

function rotateOnXY(v: Vertex3d, rad: number): Vertex3d {
    return {
        x: v.x * Math.cos(rad) - v.y * Math.sin(rad),
        y: v.x * Math.sin(rad) + v.y * Math.cos(rad),
        z: v.z
    }
}

function rotateOnYZ(v: Vertex3d, rad: number): Vertex3d {
    return {
        x: v.x,
        y: v.y * Math.cos(rad) - v.z * Math.sin(rad),
        z: v.y * Math.sin(rad) + v.z * Math.cos(rad)
    };
}

function rotateOnXZ(v: Vertex3d, rad: number): Vertex3d {
    return {
        x: v.x * Math.cos(rad) + v.z * Math.sin(rad),
        y: v.y,
        z: -v.x * Math.sin(rad) + v.z * Math.cos(rad)
    };
}

function subtract(v0: Vertex3d, v1: Vertex3d): Vertex3d {
    return {
        x: v0.x - v1.x,
        y: v0.y - v1.y,
        z: v0.z - v1.z
    };
}

function scale(v: Vertex3d, scalar: number): Vertex3d {
    return {
        x: v.x * scalar,
        y: v.y * scalar,
        z: v.z * scalar
    };
}

function dot(v0: Vertex3d, v1: Vertex3d): number {
    return v0.x * v1.x + v0.y * v1.y + v0.z * v1.z;
}

function cross(v0: Vertex3d, v1: Vertex3d): Vertex3d {
    return {
        x: v0.y * v1.z - v0.z * v1.y,
        y: v0.z * v1.x - v0.x * v1.z,
        z: v0.x * v1.y - v0.y * v1.x
    };
}

function normalize(v: Vertex3d): Vertex3d {
    const size = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
    if (size === 0) return { x: 0, y: 0, z: 0 };
    return {
        x: v.x / size,
        y: v.y / size,
        z: v.z / size
    };
}

function flip(v: Vertex3d): Vertex3d {
    return {
        x: -v.x,
        y: -v.y,
        z: -v.z,
    }
}

function isParallel(v0: Vertex3d, v1: Vertex3d): boolean {
    const dotAbs = Math.abs(dot(normalize(v0), normalize(v1)));
    return Math.abs(dotAbs - 1) <= TOLERANCE_PARALLEL;
}

function isParallelLines(li0: Line, li1: Line): boolean {
    const li0Direction = subtract(li0.p1, li0.p0);
    const li1Direction = subtract(li1.p1, li1.p0);

    return isParallel(li0Direction, li1Direction);
}

function getSize(v: Vertex3d): number {
    return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
}

function getDist(v0: Vertex3d, v1: Vertex3d): number {
    return Math.sqrt((v1.x - v0.x) ** 2 + (v1.y - v0.y) ** 2 + (v1.z - v0.z) ** 2);
}

function is2d(v: Vertex2d | Vertex3d) {
    return 'z' in v && typeof v.z === 'number';
}

function to3d(v: Vertex2d): Vertex3d {
    return {...v, z: 0};
}

function to2d(v: Vertex3d): Vertex2d {
    return {x: v.x, y: v.y};
}

function chain(initial: Vertex3d): VectorChain {
    let current = { ...initial };

    const api: VectorChain = {
        add(v: Vertex3d) {
            current = add(current, v);
            return api;
        },
        subtract(v: Vertex3d) {
            current = subtract(current, v);
            return api;
        },
        scale(scalar: number) {
            current = scale(current, scalar);
            return api;
        },
        normalize() {
            current = normalize(current);
            return api;
        },
        dot(v: Vertex3d) {
            return dot(current, v);
        },
        cross(v: Vertex3d) {
            current = cross(current, v);
            return api;
        },
        flip() {
            current = flip(current);
            return api;
        },
        rotateOnXY(rad: number) {
            current = rotateOnXY(current, rad);
            return api;
        },
        rotateOnYZ(rad: number) {
            current = rotateOnYZ(current, rad);
            return api;
        },
        rotateOnXZ(rad: number) {
            current = rotateOnXZ(current, rad);
            return api;
        },
        value() {
            return current;
        },
    };

    return api;
}

function getBoundingBox2d(pts: (Vertex2d|Vertex3d)[]): {min: Vertex2d, max: Vertex2d} {
    const arrCoordX = pts.map(p => p.x);
    const arrCoordY = pts.map(p => p.y);

    const minX = Math.min(...arrCoordX);
    const minY = Math.min(...arrCoordY);
    const maxX = Math.max(...arrCoordX);
    const maxY = Math.max(...arrCoordY);
    
    return {
        min: {x: minX, y: minY},
        max: {x: maxX, y: maxY},
    }
}

function getBoundingBox3d(pts: Vertex3d[]) {
    const arrCoordX = pts.map(p => p.x);
    const arrCoordY = pts.map(p => p.y);
    const arrCoordZ = pts.map(p => p.z);

    const minX = Math.min(...arrCoordX);
    const minY = Math.min(...arrCoordY);
    const minZ = Math.min(...arrCoordZ);
    const maxX = Math.max(...arrCoordX);
    const maxY = Math.max(...arrCoordY);
    const maxZ = Math.max(...arrCoordZ);
    
    return {
        min: {x: minX, y: minY, z: minZ},
        max: {x: maxX, y: maxY, z: maxZ},
    }
}


interface VectorChain {
    add(v: Vertex3d): VectorChain;
    subtract(v: Vertex3d): VectorChain;
    scale(scalar: number): VectorChain;
    normalize(): VectorChain;
    dot(v: Vertex3d): number;
    cross(v: Vertex3d): VectorChain;
    value(): Vertex3d;
    flip(): VectorChain;
    rotateOnXY(rad: number): VectorChain;
    rotateOnYZ(rad: number): VectorChain;
    rotateOnXZ(rad: number): VectorChain;
}

export const VectorUtils = {
    add,
    subtract,
    scale,
    dot,
    cross,
    normalize,
    flip,
    isParallel,
    isParallelLines,
    getSize,
    getDist,
    rotateOnXY,
    rotateOnYZ,
    rotateOnXZ,
    is2d,
    to3d,
    to2d,
    chain,
    getBoundingBox2d,
    getBoundingBox3d,
};