import { BoundingBox2d, BoundingBox3d } from "../models/types/basicGeometries";
import { CollisionUtils } from "../utils/collisionUtils";

describe('Collision Tests', () => {
    test('Collision Test 2d, when meets at a point', () => {
        const boxA: BoundingBox2d = {
            anchor: { x: 0, y: 0 },
            uAxis: { x: 1, y: 0 },
            length: { u: 10, v: 3 }
        };
        
        const boxB: BoundingBox2d = {
            anchor: { x: 0, y: 3 },
            uAxis: { x: 1, y: 1 },
            length: { u: 10, v: 3 }
        };

        const collisionCheck = CollisionUtils.hasBoundingBoxCollision2d(boxA, boxB, true);
        console.log(collisionCheck.result);
        console.log(collisionCheck.args);

        expect(collisionCheck.result).toBe(true);
    });

    test('Collision Test 3d, when mees at a side', () => {
        const boxA: BoundingBox3d = {
            anchor: { x: 0, y: 0, z: 0 },
            uAxis: { x: 1, y: 0, z: 0 },
            vAxis: { x: 0, y: 1, z: 0},
            length: { u: 10, v: 3, n: 3}
        };
        
        const boxB: BoundingBox3d = {
            anchor: { x: 0, y: 3, z: 0 },
            uAxis: { x: 1, y: 1, z: 0 },
            vAxis: { x: -1, y: 1, z: 0},
            length: { u: 10, v: 3, n: 3}
        };

        const collisionCheck = CollisionUtils.hasBoundingBoxCollision2d(boxA, boxB, true);
        console.log(collisionCheck.result);
        console.log(collisionCheck.args);

        expect(collisionCheck.result).toBe(true);
    });
});