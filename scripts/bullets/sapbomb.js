function dpos(ip,fp,t){
    return new Vec2((fp.x-ip.x)/t,(fp.y-ip.y)/t);
}

function Vec2Len(x,y){
    return Math.sqrt(Math.pow(x,2)+Math.pow(y,2));
}

//gives a custom bomb bullet type that inherit velocity of unit when fired but limit it to a maxSpeed
module.exports = function b(){
    const bean = extend(BombBulletType,{
        maxSpeed: 3,
        keepVelocity: true,
        update(b){
            this.super$update(b);
            let speed = Vec2Len(b.vel.x, b.vel.y);
            if(b.time == 0 && speed > this.maxSpeed){
                b.vel.x = b.vel.x * this.maxSpeed/speed;
                b.vel.y = b.vel.y * this.maxSpeed/speed;
            }
        }
    });
    return bean
};