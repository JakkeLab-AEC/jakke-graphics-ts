# jakke-graphics-ts (Under construction)

My common graphics utils for building my aec apps.

---

# Included

## Traverse and searching geometry 
### BVHTree
Triangulated surface based BVHTree. Raycasting algorithm is Möller Trumbore's solution.

## Bounding box
### Convex Hull 2d
Graham scan applied.

### OBB 2d
It's a modification of rotating caliphers. Hull points are created from Convex Hull 2d.

## Geometry evaluation
### Point
- Get parameterized value indicating the relative position of point on given line in 3d Space.
- Get intersection point of line on triangle in 3D space. (Möller Trumbore's solution)
