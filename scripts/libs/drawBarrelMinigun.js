
//@params atlas.find, atlas.find, int, float, float, vec2, vec2, float
//@params barrelRot range 0-10
module.exports = function draw(sprite, outline, numBarrel, diameter, barrelRot, pos, offset, rot){
    for(let i = 0; i < numBarrel; i++){
        let rotOffset = bRotOffset(numBarrel,i,diameter,barrelRot);
        let sumOffset = new Vec2(rotOffset.x + offset.x, rotOffset.y + offset.y);
        Draw.z(Layer.turret-2+rotOffset.y);
        Draw.rect(
            sprite,
            pos.x + Angles.trnsx(rot,sumOffset.x,sumOffset.y),
            pos.y + Angles.trnsy(rot,sumOffset.x,sumOffset.y),
            rot
        );
        Draw.z(Layer.turret-3);
        Draw.rect(
            outline,
            pos.x + Angles.trnsx(rot,sumOffset.x,sumOffset.y),
            pos.y + Angles.trnsy(rot,sumOffset.x,sumOffset.y),
            rot
        );
    }
}

function bRotOffset(numBarrels, barrelNum, diameter, barrelRot){
    let trueRot = (2*Math.PI/numBarrels)*(barrelRot/10) + 2*Math.PI/numBarrels*barrelNum; //radians
    return new Vec2(
        diameter*Math.sin(trueRot),
        diameter*Math.cos(trueRot)/3
    )
}
