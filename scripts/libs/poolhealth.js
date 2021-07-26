const refresh = require("libs/refresh");
const fname = require("dir");
const status = require("libs/status");
//const searchInterval = 75;


//@param sprite name
function sprite(name){
    return Core.atlas.find(name);
}

const laser = sprite("laser");
const laserEnd = sprite("laser-end");

function drawLaser(team,  x1,  y1,  x2,  y2,  size1,  size2){
    let angle1 = Angles.angle(x1, y1, x2, y2);
    let vx = Mathf.cosDeg(angle1), vy = Mathf.sinDeg(angle1);
    let len1 = size1 / 2 - 1.5, len2 = size2 / 2 - 1.5;
    //print(Drawf);
    Draw.z(Layer.flyingUnitLow-1);
    Draw.color(Color.valueOf("#bf8bce"), 0.8);
    Drawf.laser(team, laser, laserEnd, x1 + vx*len1, y1 + vy*len1, x2 - vx*len2, y2 - vy*len2, 0.25);
}

//returns an angle
function toRad(angle){
    return (angle * Math.PI/180);
}

function toDeg(angle){
    return (angle * 180/Math.PI);
}

//import these functions into the unit's according functions and pass in 'this' as argument
//i.e. put update(this) in the update() method of a unit and etc
function update(unit){
    if(unit.isCommanding()){
        //kill everyone if pool is near zero
        let helth = 0;
        unit.controlling.forEach(u => {
            //unit.maxh += u.maxHealth;
            helth += u.health;
            //print(u.shield);
        });
        helth += unit.health;
        unit.sumh = helth;

        if(unit.sumh <= 1){
            unit.controlling.forEach(u => {
                u.kill();
            });
            unit.kill();
        }

        let percentage = unit.sumh/unit.maxh;
        unit.controlling.forEach(u => {
            u.health = u.type.health*percentage;
        });
        unit.health = unit.type.health*percentage;
    }
};
function clearCommand(unit){
    if(unit.isCommanding()){
        unit.groupsize = 0;
        unit.maxh = 0;
        unit.sumh = 0;
        unit.controlling.forEach(u => {
            let has = false;
            u.abilities.forEach(ab => {
                if(ab instanceof ForceFieldAbility || ab instanceof ShieldRegenFieldAbility){
                    has = true;
                }
            });
            if(!has){
                u.shield = 0;
            }
        });
    }
};
function command(unit,formation, units){
    units.forEach(u => {
        unit.maxh += u.maxHealth;
        unit.sumh += u.health;
        //print(u.health);
        /*u.apply(status.cmd);
        unit.lasth += u.health;*/
        unit.groupsize++;
    });
    //print(unit.sumh);
    unit.maxh += unit.maxHealth;
    unit.sumh += unit.health;
    /*unit.apply(status.cmd);
    unit.lasth += unit.health;*/
    //print(unit.groupsize);
};
function draw(unit){
    if(unit.isCommanding()){
        Draw.z(Layer.flyingUnit-1);
        unit.controlling.forEach(u=>{
            drawLaser(unit.team,
                unit.x,unit.y,
                u.x,u.y,
                u.type.hitSize,unit.type.hitSize);
        });
    }
};

//export callName: function
module.exports = {
    update:update,
    draw:draw,
    command:command,
    clearCommand:clearCommand,
}
