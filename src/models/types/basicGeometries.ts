/**
 * Represents a two-dimensional vertex with `x` and `y` coordinates.
 *
 * @property x - The x-coordinate of the vertex.
 * @property y - The y-coordinate of the vertex.
 */
export type Vertex2d = {x: number, y: number}

/**
 * Represents a point or vertex in 3D space.
 *
 * @property x - The X coordinate.
 * @property y - The Y coordinate.
 * @property z - The Z coordinate.
 */
export type Vertex3d = {x: number, y: number, z: number};

/**
 * Represents a 2D line segment defined by two vertices.
 *
 * @property p0 - The starting vertex of the line segment.
 * @property p1 - The ending vertex of the line segment.
 */
export type Line2d = {p0: Vertex2d, p1: Vertex2d};

/**
 * Represents a 3D line segment defined by two endpoints.
 *
 * @property p0 - The starting vertex of the line segment.
 * @property p1 - The ending vertex of the line segment.
 */
export type Line = {p0: Vertex3d, p1: Vertex3d};

/**
 * Represents a triangle in 3D space, defined by three vertices.
 *
 * @property p0 - The first vertex of the triangle.
 * @property p1 - The second vertex of the triangle.
 * @property p2 - The third vertex of the triangle.
 */
export type Triangle = {p0: Vertex3d, p1: Vertex3d, p2: Vertex3d};

/**
 * Represents a 2D bounding box defined by an anchor point, a direction axis, and lengths along two axes.
 *
 * @property anchor - The anchor point (origin) of the bounding box in 2D space.
 * @property uAxis - The direction vector representing the primary axis (u) of the bounding box.
 * @property length - The lengths of the bounding box along the u and v axes.
 * @property length.u - The length of the bounding box along the u axis.
 * @property length.v - The length of the bounding box along the v axis.
 */
export type BoundingBox2d = {
    anchor: Vertex2d,
    uAxis: Vertex2d,
    length: {
        u: number,
        v: number,
    }
}

/**
 * Represents a 3D bounding box defined by an anchor point, two axis vectors, and lengths along three axes.
 *
 * @property anchor - The anchor point (origin) of the bounding box in 3D space.
 * @property uAxis - The vector representing the local 'u' axis direction of the bounding box.
 * @property vAxis - The vector representing the local 'v' axis direction of the bounding box.
 * @property length - The lengths of the bounding box along the 'u', 'v', and 'n' (normal) axes.
 * @property length.u - Length along the 'u' axis.
 * @property length.v - Length along the 'v' axis.
 * @property length.n - Length along the 'n' (normal) axis.
 */
export type BoundingBox3d = {
    anchor: Vertex3d,
    uAxis: Vertex3d,
    vAxis: Vertex3d,
    length: {
        u: number,
        v: number,
        n: number,
    }
}

/**
 * Represents a two-dimensional polyline as an array of `Vertex2d` points.
 * Each vertex defines a point in 2D space, and the sequence of vertices forms the polyline.
 *
 * @see Vertex2d
 */
export type Polyline2d = Vertex2d[];

/**
 * Represents a polyline in 3D space as an array of `Vertex3d` points.
 * Each vertex defines a point in the polyline, and the order of vertices
 * determines the path of the polyline.
 */
export type Polyline3d = Vertex3d[];