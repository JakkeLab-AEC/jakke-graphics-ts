export type Vertex2d = {x: number, y: number}
export type Vertex3d = {x: number, y: number, z: number};
export type Line = {p0: Vertex3d, p1: Vertex3d};
export type Triangle = {p0: Vertex3d, p1: Vertex3d, p2: Vertex3d};
export type BoundingBox2d = {
    anchor: Vertex2d,
    uAxis: Vertex2d,
    length: {
        u: number,
        v: number,
    }
}

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

export type Polyline2d = Vertex2d[];
export type Polyline3d = Vertex3d[];