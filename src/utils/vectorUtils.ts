import { Line, Vertex2d, Vertex3d } from "../models/types/basicGeometries";

const TOLERANCE_PARALLEL = 1e-6;

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

export namespace VectorUtils {
    /**
     * Adds two 3D vertices together component-wise.
     *
     * @param v0 - The first vertex to add.
     * @param v1 - The second vertex to add.
     * @returns A new `Vertex3d` representing the sum of `v0` and `v1`.
     */
    export function add(v0: Vertex3d, v1: Vertex3d): Vertex3d {
        return {
            x: v0.x + v1.x,
            y: v0.y + v1.y,
            z: v0.z + v1.z
        };
    }

    /**
     * Rotates a 3D vertex around the Z-axis by a given angle in radians.
     *
     * The rotation is performed in the XY plane, leaving the Z coordinate unchanged.
     *
     * @param v - The 3D vertex to rotate, with x, y, and z properties.
     * @param rad - The angle in radians to rotate the vertex.
     * @returns A new `Vertex3d` object representing the rotated vertex.
     */
    export function rotateOnXY(v: Vertex3d, rad: number): Vertex3d {
        return {
            x: v.x * Math.cos(rad) - v.y * Math.sin(rad),
            y: v.x * Math.sin(rad) + v.y * Math.cos(rad),
            z: v.z
        }
    }

    /**
     * Rotates a 3D vertex around the YZ plane by a given angle in radians.
     *
     * The rotation is performed with respect to the origin (0, 0, 0), 
     * affecting the `y` and `z` coordinates while leaving `x` unchanged.
     *
     * @param v - The 3D vertex to rotate, represented as a `Vertex3d` object.
     * @param rad - The angle of rotation in radians.
     * @returns A new `Vertex3d` object representing the rotated vertex.
     */
    export function rotateOnYZ(v: Vertex3d, rad: number): Vertex3d {
        return {
            x: v.x,
            y: v.y * Math.cos(rad) - v.z * Math.sin(rad),
            z: v.y * Math.sin(rad) + v.z * Math.cos(rad)
        };
    }

    /**
     * Rotates a 3D vertex around the Y-axis (in the XZ plane) by a given angle in radians.
     *
     * @param v - The vertex to rotate, represented as an object with x, y, and z coordinates.
     * @param rad - The angle of rotation in radians.
     * @returns A new `Vertex3d` object representing the rotated vertex.
     */
    export function rotateOnXZ(v: Vertex3d, rad: number): Vertex3d {
        return {
            x: v.x * Math.cos(rad) + v.z * Math.sin(rad),
            y: v.y,
            z: -v.x * Math.sin(rad) + v.z * Math.cos(rad)
        };
    }

    /**
     * Subtracts the components of one 3D vertex (`v1`) from another (`v0`).
     *
     * @param v0 - The minuend vertex (from which to subtract).
     * @param v1 - The subtrahend vertex (to subtract).
     * @returns A new `Vertex3d` representing the difference between `v0` and `v1`.
     */
    export function subtract(v0: Vertex3d, v1: Vertex3d): Vertex3d {
        return {
            x: v0.x - v1.x,
            y: v0.y - v1.y,
            z: v0.z - v1.z
        };
    }

    /**
     * Scales a 3D vertex by a given scalar value.
     *
     * @param v - The vertex to scale, represented as a `Vertex3d` object.
     * @param scalar - The scalar value to multiply each component of the vertex by.
     * @returns A new `Vertex3d` object with each component scaled by the given scalar.
     */
    export function scale(v: Vertex3d, scalar: number): Vertex3d {
        return {
            x: v.x * scalar,
            y: v.y * scalar,
            z: v.z * scalar
        };
    }

    /**
     * Calculates the dot product of two 3D vertices.
     *
     * The dot product is a scalar value that is the sum of the products of the corresponding components of the two vectors.
     *
     * @param v0 - The first 3D vertex.
     * @param v1 - The second 3D vertex.
     * @returns The dot product of `v0` and `v1`.
     */
    export function dot(v0: Vertex3d, v1: Vertex3d): number {
        return v0.x * v1.x + v0.y * v1.y + v0.z * v1.z;
    }

    /**
     * Computes the cross product of two 3D vertices.
     *
     * The cross product of two vectors results in a vector that is perpendicular to both input vectors.
     *
     * @param v0 - The first 3D vertex.
     * @param v1 - The second 3D vertex.
     * @returns A new `Vertex3d` representing the cross product of `v0` and `v1`.
     */
    export function cross(v0: Vertex3d, v1: Vertex3d): Vertex3d {
        return {
            x: v0.y * v1.z - v0.z * v1.y,
            y: v0.z * v1.x - v0.x * v1.z,
            z: v0.x * v1.y - v0.y * v1.x
        };
    }

    /**
     * Normalizes a 3D vertex vector so that its length becomes 1.
     * If the input vector has zero length, returns a zero vector.
     *
     * @param v - The input 3D vertex to normalize.
     * @returns The normalized 3D vertex.
     */
    export function normalize(v: Vertex3d): Vertex3d {
        const size = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
        if (size === 0) return { x: 0, y: 0, z: 0 };
        return {
            x: v.x / size,
            y: v.y / size,
            z: v.z / size
        };
    }

    /**
     * Returns a new `Vertex3d` with each component (x, y, z) negated.
     *
     * @param v - The input vertex to flip.
     * @returns A new `Vertex3d` with all coordinates inverted.
     */
    export function flip(v: Vertex3d): Vertex3d {
        return {
            x: -v.x,
            y: -v.y,
            z: -v.z,
        }
    }

    /**
     * Determines whether two 3D vectors are parallel within a specified tolerance.
     *
     * The function normalizes both input vectors, computes their dot product,
     * and checks if the absolute value of the dot product is close to 1,
     * indicating parallelism (either in the same or opposite direction).
     *
     * @param v0 - The first 3D vector.
     * @param v1 - The second 3D vector.
     * @returns `true` if the vectors are parallel within the tolerance; otherwise, `false`.
     */
    export function isParallel(v0: Vertex3d, v1: Vertex3d): boolean {
        const dotAbs = Math.abs(dot(normalize(v0), normalize(v1)));
        return Math.abs(dotAbs - 1) <= TOLERANCE_PARALLEL;
    }

    /**
     * Determines whether two lines are parallel.
     *
     * @param li0 - The first line, represented by two points.
     * @param li1 - The second line, represented by two points.
     * @returns `true` if the lines are parallel, otherwise `false`.
     */
    export function isParallelLines(li0: Line, li1: Line): boolean {
        const li0Direction = subtract(li0.p1, li0.p0);
        const li1Direction = subtract(li1.p1, li1.p0);

        return isParallel(li0Direction, li1Direction);
    }

    /**
     * Calculates the Euclidean length (magnitude) of a 3D vertex.
     *
     * @param v - The vertex object containing x, y, and z coordinates.
     * @returns The length of the vector from the origin to the vertex.
     */
    export function getSize(v: Vertex3d): number {
        return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
    }

    /**
     * Calculates the Euclidean distance between two 3D vertices.
     *
     * @param v0 - The first vertex.
     * @param v1 - The second vertex.
     * @returns The distance between `v0` and `v1`.
     */
    export function getDist(v0: Vertex3d, v1: Vertex3d): number {
        return Math.sqrt((v1.x - v0.x) ** 2 + (v1.y - v0.y) ** 2 + (v1.z - v0.z) ** 2);
    }

    /**
     * Determines if the given vertex is a 2D vertex.
     *
     * @param v - The vertex to check, which can be either a `Vertex2d` or `Vertex3d`.
     * @returns `true` if the vertex has a `z` property of type `number`, indicating it is a 2D vertex; otherwise, `false`.
     */
    export function is2d(v: Vertex2d | Vertex3d) {
        return 'z' in v && typeof v.z === 'number';
    }

    /**
     * Converts a 2D vertex to a 3D vertex by adding a `z` coordinate with a value of `0`.
     *
     * @param v - The 2D vertex to convert.
     * @returns A new 3D vertex with the same `x` and `y` values as the input, and `z` set to `0`.
     */
    export function to3d(v: Vertex2d): Vertex3d {
        return {...v, z: 0};
    }

    /**
     * Converts a 3D vertex to a 2D vertex by discarding the z-coordinate.
     *
     * @param v - The 3D vertex to convert.
     * @returns A 2D vertex containing only the x and y coordinates from the input.
     */
    export function to2d(v: Vertex3d): Vertex2d {
        return {x: v.x, y: v.y};
    }

    /**
     * Creates a chainable API for performing vector operations on a 3D vertex.
     * 
     * The returned `VectorChain` object allows you to perform a sequence of operations
     * such as addition, subtraction, scaling, normalization, dot product, cross product,
     * flipping, and rotation on the initial vertex. Most operations are chainable, enabling
     * fluent method calls. The `value()` method returns the current state of the vector.
     * 
     * @param initial - The initial 3D vertex to start the chain of operations.
     * @returns A chainable API for vector operations.
     */
    export function chain(initial: Vertex3d): VectorChain {
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

    /**
     * Calculates the 2D axis-aligned bounding box for a set of vertices.
     *
     * Accepts an array of `Vertex2d` or `Vertex3d` objects and computes the minimum and maximum
     * x and y coordinates, returning them as the corners of the bounding box.
     *
     * @param pts - An array of vertices, each being either `Vertex2d` or `Vertex3d`.
     * @returns An object containing `min` and `max` properties, each a `Vertex2d` representing
     *          the lower-left and upper-right corners of the bounding box, respectively.
     */
    export function getBoundingBox2d(pts: (Vertex2d|Vertex3d)[]): {min: Vertex2d, max: Vertex2d} {
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

    /**
     * Calculates the axis-aligned bounding box for a set of 3D vertices.
     *
     * @param pts - An array of `Vertex3d` objects representing the points in 3D space.
     * @returns An object containing the minimum and maximum coordinates (`min` and `max`) of the bounding box,
     *          each with `x`, `y`, and `z` properties.
     */
    export function getBoundingBox3d(pts: Vertex3d[]) {
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

    /**
     * Computes the cross product of the vectors (p1 -> p2) and (p1 -> p3) to determine the orientation of three points.
     *
     * @param p1 - The first vertex.
     * @param p2 - The second vertex.
     * @param p3 - The third vertex.
     * @returns A positive value if the points are arranged in a counter-clockwise order,
     *          a negative value if clockwise, and zero if they are collinear.
     */
    export function ccw(p1: Vertex2d, p2: Vertex2d, p3: Vertex2d) {
        return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    }
}