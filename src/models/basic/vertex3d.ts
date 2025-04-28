import { Vertex3d } from "../types/basicGeometries";

export class Vertex3dWrapped {
    readonly x: number;
    readonly y: number;
    readonly z: number;

    private static readonly PRECISION = 1e6;

    constructor(v: Vertex3d) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
    }

    getHash(): string {
        const x = Math.round(this.x * Vertex3dWrapped.PRECISION);
        const y = Math.round(this.y * Vertex3dWrapped.PRECISION);
        const z = Math.round(this.z * Vertex3dWrapped.PRECISION);
        return `${x},${y},${z}`;
    }

    add(v: Vertex3dWrapped): Vertex3dWrapped {
        return new Vertex3dWrapped({ x: this.x + v.x, y: this.y + v.y, z: this.z + v.z });
    }

    subtract(v: Vertex3dWrapped): Vertex3dWrapped {
        return new Vertex3dWrapped({ x: this.x - v.x, y: this.y - v.y, z: this.z - v.z });
    }

    dot(v: Vertex3dWrapped): number {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    cross(v: Vertex3dWrapped): Vertex3dWrapped {
        return new Vertex3dWrapped({
            x: this.y * v.z - this.z * v.y,
            y: this.z * v.x - this.x * v.z,
            z: this.x * v.y - this.y * v.x
        });
    }

    normalized(): Vertex3dWrapped {
        const length = this.getLength();
        return new Vertex3dWrapped({ x: this.x / length, y: this.y / length, z: this.z / length });
    }

    getLength(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }

    multiply(t: number): Vertex3dWrapped {
        return new Vertex3dWrapped({ x: this.x * t, y: this.y * t, z: this.z * t });
    }

    toObject(): Vertex3d {
        return { x: this.x, y: this.y, z: this.z };
    }

    equals(v: Vertex3dWrapped): boolean {
        return this.getHash() === v.getHash();
    }

    clone(): Vertex3dWrapped {
        return new Vertex3dWrapped({ x: this.x, y: this.y, z: this.z });
    }
}
