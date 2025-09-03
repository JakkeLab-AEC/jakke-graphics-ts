import { Vertex3d } from "./types/basicGeometries";
import { ActionResult } from "./types/errorMessages";

/**
 * BVHTree for fast traverse of triangles.
 */
export class BVHTree {
    /**
     * Triangles included.
     */
    readonly triangles: BVHTriangle[] = [];

    /**
     * Triangle hashes included in BVHTree.
     */
    readonly triangleHashes: Set<string> = new Set();

    private leftChild?: BVHTree;
    private rightChild?: BVHTree;
    private parent?: BVHTree;
    private _boundingBox: BVHBoundingBox = BVHBoundingBox.create();

    /**
     * Get bounding box of this BVHTree.
     */
    get boundingBox(): BVHBoundingBox { return this._boundingBox; }

    /**
     * Add triangle at this three.
     * @param triangle 
     * @returns Result of adding triangle action.
     */
    addTriangle(triangle: BVHTriangle): ActionResult {
        const hash = triangle.getHash();
        if (this.triangleHashes.has(hash)) {
            return { result: false, message: "Given triangle is already included." };
        }

        this.triangles.push(triangle);
        this.triangleHashes.add(hash);

        this._boundingBox.addVertex(triangle.v1);
        this._boundingBox.addVertex(triangle.v2);
        this._boundingBox.addVertex(triangle.v3);

        return { result: true };
    }

    /**
     * Build BVHTree's structure.
     * @returns 
     */
    calculateTree(): BVHTree {
        const sortedTriangles = this.getSortedTriangles();
        return this.buildBVHTree(sortedTriangles);
    }

    /**
     * Internal method for calculating the tree structure.
     * @param triangles 
     * @returns 
     */
    private buildBVHTree(triangles: BVHTriangle[]): BVHTree {
        if (triangles.length <= 1) {
            const leaf = new BVHTree();
            triangles.forEach(t => leaf.addTriangle(t));
            return leaf;
        }

        const node = new BVHTree();
        triangles.forEach(t => node.addTriangle(t));

        const diagonal = node.boundingBox.getDiagonal();
        if (!diagonal) {
            const mid = Math.floor(triangles.length / 2);
            const leftTriangles = triangles.slice(0, mid);
            const rightTriangles = triangles.slice(mid);

            node.leftChild = this.buildBVHTree(leftTriangles);
            node.leftChild.parent = node;

            node.rightChild = this.buildBVHTree(rightTriangles);
            node.rightChild.parent = node;

            return node;
        }

        const axis: BVHSplitAxis =
            diagonal.x >= diagonal.y && diagonal.x >= diagonal.z
                ? BVHSplitAxis.X
                : diagonal.y >= diagonal.z
                ? BVHSplitAxis.Y
                : BVHSplitAxis.Z;

        const enumerator = new BVHTriangleEnumerator(triangles);
        const [leftTriangles, rightTriangles] = enumerator.split(axis);

        node.leftChild = this.buildBVHTree(leftTriangles);
        node.leftChild.parent = node;

        node.rightChild = this.buildBVHTree(rightTriangles);
        node.rightChild.parent = node;

        return node;
    }

    /**
     * Internal method for sorting triangles.
     * @returns 
     */
    private getSortedTriangles(): BVHTriangle[] {
        const diagonal = this._boundingBox?.getDiagonal();
        if (!diagonal) {
            throw new Error("Bounding box diagonal is not defined. Make sure to call calculateBoundingBox() before sorting.");
        }
    
        const isXMajor = diagonal.x > diagonal.y;
    
        return this.triangles
            .map(t => t.clone())
            .sort((a, b) => {
                const ca = a.getCentroid();
                const cb = b.getCentroid();
                return isXMajor
                    ? ca.x - cb.x || ca.y - cb.y
                    : ca.y - cb.y || ca.x - cb.x;
            });
    }

    /**
     * Get all nodes included in this tree.
     * @returns 
     */
    getAllNodes(): BVHTree[] {
        const nodes: BVHTree[] = [];
        this.traverseTree(nodes);
        return nodes;
    }

    /**
     * Get all node's bounding box.
     * @returns 
     */
    getAllBoundingBoxes(): BVHBoundingBox[] {
        return this.getAllNodes().map(n => n._boundingBox);
    }

    /**
     * Internal method for traverse tree for collecting all nodes.
     * @param nodes 
     */
    private traverseTree(nodes: BVHTree[]): void {
        nodes.push(this);
        this.leftChild?.traverseTree(nodes);
        this.rightChild?.traverseTree(nodes);
    }

    /**
     * Get root node of this tree.
     * @returns 
     */
    getRoot(): BVHTree {
        let current: BVHTree = this;
        while (current.parent) {
            current = current.parent;
        }
        return current;
    }

    /**
     * Get the intersection point between the given line and tree.
     * This uses Möller Trumbore's soluion for determine the collision.
     * Currently, it returns only the first collision point.
     * @param p1 The start point of line.
     * @param p2 The end point of line.
     * @param onlyOnLine Parameter for testing the getting collision point. 
     *                   When this set true, it returns the collision point including outbound of the line.
     * @returns Intersection point when only the intersection exists.
     */
    getRayCollision(p1: Vertex3d, p2: Vertex3d, onlyOnLine: boolean): Vertex3d | undefined {
        if (!this.isRayCollideAABB(p1, p2)) return;

        if (!this.leftChild && !this.rightChild) {
            for (const triangle of this.triangles) {
                const ptTest = triangle.getPointOnTrianglePlane(p1, p2);
                if (!ptTest) continue;

                const onLine = ptTest.subtract(new BVHVertex(p1))
                    .dot(ptTest.subtract(new BVHVertex(p2))) <= 0;

                if (!onlyOnLine || onLine) return ptTest;
            }
        }

        return this.leftChild?.getRayCollision(p1, p2, onlyOnLine)
            || this.rightChild?.getRayCollision(p1, p2, onlyOnLine);
    }

    /**
     * Internal method for determine the collision between line and bounding box.
     * @param p1 The start point of line.
     * @param p2 The end point of line.
     * @returns 
     */
    private isRayCollideAABB(p1: Vertex3d, p2: Vertex3d): boolean {
        const ptMin = this._boundingBox.min;
        const ptMax = this._boundingBox.max;

        const intersections = [
            this.raycastOnPlane(p1, p2, "z", p2.z - p1.z > 0 ? ptMin.z : ptMax.z, ptMin, ptMax),
            this.raycastOnPlane(p1, p2, "x", p2.x - p1.x > 0 ? ptMin.x : ptMax.x, ptMin, ptMax),
            this.raycastOnPlane(p1, p2, "y", p2.y - p1.y > 0 ? ptMin.y : ptMax.y, ptMin, ptMax)
        ];

        return intersections.filter(pt => pt !== undefined).length === 1;
    }

    /**
     * Internal method of testing the collision between line and AABB.
     * @param p1 The start point of line.
     * @param p2 The end point of line.
     * @param axis x, y, z can be set.
     * @param value 
     * @param ptMin The minimum point of bounding box.
     * @param ptMax The maximum point of bounding box.
     * @returns 
     */
    private raycastOnPlane(p1: Vertex3d, p2: Vertex3d, axis: keyof Vertex3d, value: number, ptMin: Vertex3d, ptMax: Vertex3d): Vertex3d | undefined {
        const delta = p2[axis] - p1[axis];
        if (delta === 0) return undefined;

        const t = (value - p1[axis]) / delta;
        const pt = {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y),
            z: p1.z + t * (p2.z - p1.z)
        };

        return this.isPointInside(pt, ptMin, ptMax) ? pt : undefined;
    }

    /**
     * 
     * @param pt 
     * @param min 
     * @param max 
     * @returns 
     */
    private isPointInside(pt: Vertex3d, min: Vertex3d, max: Vertex3d): boolean {
        return min.x <= pt.x && pt.x <= max.x
            && min.y <= pt.y && pt.y <= max.y
            && min.z <= pt.z && pt.z <= max.z;
    }
}

export class BVHTriangle {
    /**
     * The first vertex of the bounding volume hierarchy (BVH) node.
     * This vertex is used to define the geometry or bounds associated with the node.
     */
    readonly v1: BVHVertex;

    /**
     * The second vertex associated with this BVH node.
     * Used to define the geometry or bounds within the BVH structure.
     */
    readonly v2: BVHVertex;

    /**
     * The third vertex of the BVH structure.
     * 
     * @readonly
     */
    readonly v3: BVHVertex;
    
    /**
     * Creates a new BVHTriangle instance from three vertices.
     * 
     * Each vertex is wrapped in a BVHVertex. The constructor checks for duplicate vertices
     * by comparing their hashes. If all three vertices are identical, an error is thrown.
     * 
     * @param v1 - The first vertex of the triangle.
     * @param v2 - The second vertex of the triangle.
     * @param v3 - The third vertex of the triangle.
     * @throws {Error} If all three vertices are identical.
     */
    constructor(v1: Vertex3d, v2: Vertex3d, v3: Vertex3d) {
        const bvhV1 = new BVHVertex(v1);
        const bvhV2 = new BVHVertex(v2);
        const bvhV3 = new BVHVertex(v3);

        const dupV1V2 = bvhV1.getHash() === bvhV2.getHash();
        const dupV2V3 = bvhV2.getHash() === bvhV3.getHash();
        const dupV3V1 = bvhV3.getHash() === bvhV1.getHash();

        const isDuplicated = dupV1V2 && dupV2V3 && dupV3V1;
        if (isDuplicated) {
            throw new Error("Cannot create BVHTriangle with all identical vertices");
        }

        this.v1 = bvhV1;
        this.v2 = bvhV2;
        this.v3 = bvhV3;
    }

    /**
     * Calculates and returns the centroid of the triangle defined by vertices `v1`, `v2`, and `v3`.
     *
     * The centroid is computed as the average of the x, y, and z coordinates of the three vertices.
     *
     * @returns {Vertex3d} The centroid of the triangle as a `Vertex3d` object.
     */
    getCentroid(): Vertex3d {
        return {
            x: (this.v1.x + this.v2.x + this.v3.x) / 3,
            y: (this.v1.y + this.v2.y + this.v3.y) / 3,
            z: (this.v1.z + this.v2.z + this.v3.z) / 3
        };
    }

    /**
     * Generates a unique hash string for the current object by concatenating
     * the hash values of its three vertices (`v1`, `v2`, and `v3`).
     *
     * @returns {string} A string representing the combined hash of the three vertices.
     */
    getHash(): string {
        return `${this.v1.getHash()}-${this.v2.getHash()}-${this.v3.getHash()}`;
    }

    /**
     * Creates a deep copy of the current `BVHTriangle` instance.
     * 
     * @returns A new `BVHTriangle` object with cloned vertex data.
     */
    clone(): BVHTriangle {
        return new BVHTriangle(this.v1.toObject(), this.v2.toObject(), this.v3.toObject());
    }

    /**
     * Determines whether the determinant formed by three vertices and the direction vector
     * between two points is zero. This can be used to check if the points are coplanar or
     * if the direction vector is parallel to the plane defined by the three vertices.
     *
     * @param pt1 - The first vertex used to compute the direction vector.
     * @param pt2 - The second vertex used to compute the direction vector.
     * @returns `true` if the determinant is zero; otherwise, `false`.
     */
    private isDetZero(pt1: Vertex3d, pt2: Vertex3d): boolean {
        const V1V2 = this.v2.subtract(this.v1);
        const V1V3 = this.v3.subtract(this.v1);
        const d = new BVHVertex(pt2).subtract(new BVHVertex(pt1)).normalized();
        const det = V1V2.dot(d.cross(V1V3));
        return det === 0;
    }

    /**
     * Calculates the intersection point of a line segment (defined by `pt1` and `pt2`)
     * with the plane of the triangle defined by the instance vertices (`v1`, `v2`, `v3`).
     * Returns the intersection point as a `BVHVertex` if it lies within the triangle,
     * otherwise returns `undefined`.
     *
     * @param pt1 - The starting vertex of the line segment.
     * @param pt2 - The ending vertex of the line segment.
     * @returns The intersection point as a `BVHVertex` if it is inside the triangle, or `undefined` otherwise.
     */
    getPointOnTrianglePlane(pt1: Vertex3d, pt2: Vertex3d): BVHVertex | undefined {
        if (this.isDetZero(pt1, pt2)) return;

        const V1 = this.v1;
        const V2 = this.v2;
        const V3 = this.v3;

        const P1 = new BVHVertex(pt1);
        const P2 = new BVHVertex(pt2);

        const V1V2 = V2.subtract(V1);
        const V1V3 = V3.subtract(V1);
        const V1P1 = P1.subtract(V1);
        const d = P2.subtract(P1).normalized();

        const det = V1V2.dot(d.cross(V1V3));

        const v = d.dot(V1V3.cross(V1P1)) / det;
        const w = d.dot(V1P1.cross(V1V2)) / det;
        const u = 1 - (v + w);

        const result = V1.multiply(u).add(V2.multiply(v)).add(V3.multiply(w));

        const validParams = [u, v, w].every(val => val >= 0 && val <= 1);
        return validParams ? result : undefined;
    }
}

export class BVHBoundingBox {
    private _min: BVHVertex;
    private _max: BVHVertex;
    private vertexHashes: Set<string>;
    private _initialized: boolean;

    private constructor() {
        this.vertexHashes = new Set();
        this._initialized = false;
        this._min = new BVHVertex({ x: Infinity, y: Infinity, z: Infinity });
        this._max = new BVHVertex({ x: -Infinity, y: -Infinity, z: -Infinity });
    }

    /**
     * Creates and returns a new instance of `BVHBoundingBox`.
     *
     * @returns {BVHBoundingBox} A newly created `BVHBoundingBox` object.
     */
    static create(): BVHBoundingBox {
        return new BVHBoundingBox();
    }

    /**
     * Gets the minimum bounding vertex of the BVH tree.
     * @returns The {@link BVHVertex} representing the minimum bounds.
     */
    get min(): BVHVertex { return this._min; }

    /**
     * Gets the maximum BVH vertex in the tree.
     * @returns The maximum {@link BVHVertex} stored in this BVHTree.
     */
    get max(): BVHVertex { return this._max; }

    /**
     * Indicates whether the BVH tree is empty.
     * Returns `true` if the tree has not been initialized.
     */
    get isEmpty(): boolean { return !this._initialized; }

    /**
     * Adds a vertex to the BVH tree if it is not already present.
     * Updates the minimum and maximum bounds of the tree to include the new vertex.
     * Marks the tree as initialized after adding the vertex.
     *
     * @param v - The `BVHVertex` to add to the tree.
     * @returns An `ActionResult` object indicating whether the vertex was added successfully.
     *          If the vertex is already present, returns `result: false` with a message.
     */
    addVertex(v: BVHVertex): ActionResult {
        const hash = v.getHash();
        if (this.vertexHashes.has(hash)) {
            return { result: false, message: "Given point is already included." };
        }

        this.vertexHashes.add(hash);

        this._min = new BVHVertex({
            x: Math.min(this._min.x, v.x),
            y: Math.min(this._min.y, v.y),
            z: Math.min(this._min.z, v.z)
        });

        this._max = new BVHVertex({
            x: Math.max(this._max.x, v.x),
            y: Math.max(this._max.y, v.y),
            z: Math.max(this._max.z, v.z)
        });

        this._initialized = true;

        return { result: true };
    }

    /**
     * Calculates and returns the centroid of the bounding volume defined by `_min` and `_max`.
     * The centroid is computed as the midpoint between the minimum and maximum coordinates.
     *
     * @returns {BVHVertex | undefined} The centroid as a `BVHVertex` instance, or `undefined` if the tree is not initialized.
     */
    getCentroid(): BVHVertex | undefined {
        if (!this._initialized) return;
        return new BVHVertex({
            x: (this._min.x + this._max.x) * 0.5,
            y: (this._min.y + this._max.y) * 0.5,
            z: (this._min.z + this._max.z) * 0.5
        });
    }

    /**
     * Calculates and returns the diagonal vector of the bounding box defined by `_min` and `_max`.
     * The diagonal is computed as the difference between the maximum and minimum coordinates
     * along each axis (x, y, z).
     *
     * @returns {BVHVertex | undefined} A new `BVHVertex` representing the diagonal vector,
     * or `undefined` if the bounding box is not initialized.
     */
    getDiagonal(): BVHVertex | undefined {
        if (!this._initialized) return;
        return new BVHVertex({
            x: this._max.x - this._min.x,
            y: this._max.y - this._min.y,
            z: this._max.z - this._min.z
        });
    }
}

class BVHVertex {
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
        const x = Math.round(this.x * BVHVertex.PRECISION);
        const y = Math.round(this.y * BVHVertex.PRECISION);
        const z = Math.round(this.z * BVHVertex.PRECISION);
        return `${x},${y},${z}`;
    }

    add(v: BVHVertex): BVHVertex {
        return new BVHVertex({ x: this.x + v.x, y: this.y + v.y, z: this.z + v.z });
    }

    subtract(v: BVHVertex): BVHVertex {
        return new BVHVertex({ x: this.x - v.x, y: this.y - v.y, z: this.z - v.z });
    }

    dot(v: BVHVertex): number {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    cross(v: BVHVertex): BVHVertex {
        return new BVHVertex({
            x: this.y * v.z - this.z * v.y,
            y: this.z * v.x - this.x * v.z,
            z: this.x * v.y - this.y * v.x
        });
    }

    normalized(): BVHVertex {
        const length = this.getLength();
        return new BVHVertex({ x: this.x / length, y: this.y / length, z: this.z / length });
    }

    getLength(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }

    multiply(t: number): BVHVertex {
        return new BVHVertex({ x: this.x * t, y: this.y * t, z: this.z * t });
    }

    toObject(): Vertex3d {
        return { x: this.x, y: this.y, z: this.z };
    }

    equals(v: BVHVertex): boolean {
        return this.getHash() === v.getHash();
    }

    clone(): BVHVertex {
        return new BVHVertex({ x: this.x, y: this.y, z: this.z });
    }
}


/**
 * Enumerates and manages a collection of BVHTriangle objects for BVH (Bounding Volume Hierarchy) operations.
 * 
 * Provides functionality to split the set of triangles into two groups along a specified axis,
 * typically used for spatial partitioning in BVH construction.
 *
 * @remarks
 * - The triangles are sorted by their centroid position on the chosen axis before splitting.
 * - Useful for recursive BVH tree building and spatial queries.
 *
 * @example
 * ```typescript
 * const enumerator = new BVHTriangleEnumerator(triangles);
 * const [left, right] = enumerator.split('X');
 * ```
 */
class BVHTriangleEnumerator {
    constructor(private readonly triangles: BVHTriangle[]) {}

    /**
     * Splits the current set of triangles into two groups along the specified axis.
     * The triangles are sorted by their centroid position on the given axis, then divided into two halves.
     *
     * @param axis - The axis along which to split the triangles (e.g., X, Y, or Z).
     * @returns A tuple containing two arrays of `BVHTriangle`:
     *          - The first array contains the triangles in the lower half.
     *          - The second array contains the triangles in the upper half.
     */
    split(axis: BVHSplitAxis): [BVHTriangle[], BVHTriangle[]] {
        const sorted = [...this.triangles].sort((a, b) => {
            const ca = a.getCentroid();
            const cb = b.getCentroid();
            return ca[axis] - cb[axis];
        });

        const mid = Math.floor(sorted.length / 2);
        return [sorted.slice(0, mid), sorted.slice(mid)];
    }
}

enum BVHSplitAxis {
    X = "x",
    Y = "y",
    Z = "z"
}