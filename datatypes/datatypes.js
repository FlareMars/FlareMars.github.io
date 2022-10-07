class Size{
    constructor(width, height){
        this.width = height;
        this.height = height;
    }
}

class Vector2{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
}

class Vector3{
    constructor(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Vector4{
    constructor(x, y, z, w){
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
}

class Color3B{
    constructor(r, g, b){
        this.r = r;
        this.g = g;
        this.b = b;
    }
}

class Color3F{
    constructor(r, g, b){
        this.r = r;
        this.g = g;
        this.b = b;
    }
}

class Color4B{
    constructor(r, g, b, a){
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

class Color4F{
    constructor(r, g, b, a){
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

class Matrix{
    constructor(){
        this.m00 = 0;
        this.m01 = 0;
        this.m02 = 0;
        this.m03 = 0;
        this.m10 = 0;
        this.m11 = 0;
        this.m12 = 0;
        this.m13 = 0;
        this.m20 = 0;
        this.m21 = 0;
        this.m22 = 0;
        this.rm23 = 0;
        this.m30 = 0;
        this.m31 = 0;
        this.m32 = 0;
        this.m33 = 0;
    }
}


class Plane{
    constructor(normal, distance){
        this.normalX = normal.x;
        this.normalY = normal.y;
        this.normalZ = normal.z;
        this.distance = distance;
    }
}

class BQuaternion{
    constructor(x, y, z, w){
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
}


class Ray{
    constructor(origin, dir){
        this.originX = origin.x;
        this.originY = origin.y;
        this.originZ = origin.z;
        this.directionX = dir.x;
        this.directionY = dir.y;
        this.directionZ = dir.z;
    }
}

