import { Vertex3d } from "../src/models/types/basicGeometries";
import { computeContexHull2d } from "../src/utils/convexHullUtils";
import { computeOBB2d } from "../src/utils/obbUtils";

describe('obb test', () => {
    test('Rotated item test', () => {
        const pts = [
            { x: 139685.16307969374, y: 127778.98887167184, z: 0 },
            { x: 139690.9566183968, y: 127792.82487214427, z: 0 },
            { x: 139801.03385378205, y: 128055.70888127037, z: 0 },
            { x: 139524.31384418212, y: 128171.57965535519, z: 0 },
            { x: 139518.52030547324, y: 128157.74365486903, z: 0 },
            { x: 139408.4430700938, y: 127894.85964575666, z: 0 }
        ]
        const convexHulls = computeContexHull2d(pts);
        const obb = computeOBB2d(pts);

        console.log(convexHulls);
        console.log(obb);
    });
})