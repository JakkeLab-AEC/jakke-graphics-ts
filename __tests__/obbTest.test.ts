import { Vertex3d } from "../src/models/types/basicGeometries";
import { computeContexHull2d } from "../src/utils/convexHullUtils";
import { computeOBB2d } from "../src/utils/obbUtils";

describe('obb test', () => {
    test('Rotated item test', () => {
        const pts = [
            {x:41.736309, y:112.619183, z:0,},
            {x:33.693848, y:132.248723, z:0,},
            {x:-86.218156, y:182.459391, z:0,},
            {x:-80.424618, y:196.295392, z:0,},
            {x:196.295392, y:80.424618, z:0,},
            {x:190.501853, y:66.588617, z:0,},
            {x:70.589849, y:116.799286, z:0,},
            {x:50.96031, y:108.756824, z:0,},
            {x:-41.736309, y:-112.619183, z:0,},
            {x:-33.693848, y:-132.248723, z:0,},
            {x:86.218156, y:-182.459391, z:0,},
            {x:80.424618, y:-196.295392, z:0,},
            {x:-196.295392, y:-80.424618, z:0,},
            {x:-190.501853, y:-66.588617, z:0,},
            {x:-70.589849, y:-116.799286, z:0,},
            {x:-50.96031, y:-108.756824, z:0,},
            {x:41.736309, y:112.619183, z:0,},
        ]
        const convexHulls = computeContexHull2d(pts);
        const obb = computeOBB2d(pts);

        console.log(convexHulls);
        console.log(obb);
    });
})