const refresh = require("libs/refresh");
const apbullet = require("bullets/armorpiercing");
const fname = require("dir");


//modifiers
function aMod(a){
    //overpen
    if(a<3){
        return 0.2 + 0.1 * a;
    }
    //normal armor mod
    else{
        return -(a-2.5)*(a-25)/20;//goes up to ~7x
    }
}
function pMod(a){
    if(a<4){
        return a*0.5;
    }
    else return Math.pow(a,3)/30;
}

const tankbullet = apbullet(aMod,pMod);
tankbullet.despawnEffect = Fx.flakExplosion;
tankbullet.hitEffect = Fx.hitBulletSmall;
tankbullet.shootEffect = tankbullet.smokeEffect = Fx.thoriumShoot;
tankbullet.lifetime = 24;
tankbullet.speed = 19;
tankbullet.damage = 135;
tankbullet.absorbable = false;

//gun
const tankgun = extend(Weapon, "gaussgun",{
    bullet: tankbullet,
    load(){
        this.super$load();
        this.region = Core.atlas.find(fname + "-" + this.name);
        this.outlineRegion = Core.atlas.find(fname + "-"+ this.name + "-outline");
        this.heatRegion = Core.atlas.find(fname+ "-"+ this.name + "-heat");
    },
    icons(){
        return Core.atlas.find(fname + "-gausstank-icon");
    },
    rotate: true,
    rotateSpeed: 2.1,
    mirror: false,
    x: 0,
    y: 2.25,
    reload: 145,
    //xRand: 8,
    shootY: 20,
    shootCone: 3,
    shootX: 0,
    recoil: 3,
    inaccuracy: 0,
    //restitution: 0.3,
    shots: 1,
    shootSound: Sounds.shotgun,
    cooldownTime: 150
});

//unit
const tank = extend(UnitType, "gausstank",{
    
    load(){
        this.super$load();
        this.region = Core.atlas.find(this.name);
        this.turretcell = Core.atlas.find(fname+"-gaussgun-cell");
        this.track = Core.atlas.find(fname+"-gausstank-track");
    },
    init(){
        this.super$init();
        this.localizedName = "shredder";
    },
    drawWeapons(unit){
        //draw cell sprite onto turret
        this.super$drawWeapons(unit);
        let mrotation = unit.mounts[0].rotation;
        let recoil = -((unit.mounts[0].reload) / tankgun.reload * tankgun.recoil);
        this.applyColor(unit);
        Draw.color(this.cellColor(unit));
        Draw.z(Layer.groundUnit+1);
        Draw.rect(
            this.turretcell,
            unit.x + Angles.trnsx(unit.rotation-90,tankgun.x,tankgun.y) + Angles.trnsx(mrotation + unit.rotation-90,0,recoil),
            unit.y + Angles.trnsy(unit.rotation-90,tankgun.x,tankgun.y) + Angles.trnsy(mrotation + unit.rotation-90,0,recoil),
            unit.rotation + mrotation - 90
        );
        Draw.reset();
    },
    description: "Armoured tracked vehicle with a railgun that fires thorium tipped Armor Piercing shells. Will overpenetrate light armored targets. Try to keep distance.",
    health: 2275,
    //type: flying,
    speed: 0.74,
    accel: 0.03,
    drag: 0.028,
    hitSize: 24,
    armor: 16,
    rotateShooting: false,
    rotateSpeed: 1.55,
    research: UnitTypes.fortress,
    range: 160,
    //get rid of leg animation
    mechFrontSway: 0,
    mechSideSway: 0,
    mechStride: 0
});


var paddlex = 12;
var paddlenum = 8; //per each side, one paddle = 5 length
var paddlespan = 25;
var paddlestart = 14; // positive is back neg is front, start at this coordinate and move to front
var spacing = paddlespan/(paddlenum-1);

var unitsMap = new Map();
//unit type (mech, sea, fly go here)
tank.constructor = () => extend(MechUnit,{
    classId: () => tank.classId,
    trackmove: [0,0],
    lastpos: {},
    lastrot: [0,0],
    changepos: new Vec2(0,0),
    draw(){
        this.super$draw();
        if(!unitsMap.has(this.id)){
            this.lastpos = [new Vec2(this.x,this.y),new Vec2(this.x,this.y)];
            unitsMap.set(this.id,1);
        }
        let r = this.rotation-90; 

        this.lastpos[0] = new Vec2(this.x,this.y);
        this.changepos = dpos(this.lastpos[1], this.lastpos[0], Time.delta);
        this.lastpos[1] = new Vec2(this.x,this.y);//will be past position becuase only deteced when loop around
        
        this.lastrot[0] = r;
        this.changerot = angleDifference(this.lastrot[0],this.lastrot[1])/Time.delta;
        this.lastrot[1] = r;

        //main movement
        Draw.z(Layer.groundUnit-1);
        for(let j = -1; j <= 1; j+=2){
            let k = Math.max(j,0);
            
            //determine how much this track move
            this.trackmove[k] += Math.sin(toRad(r)-Math.atan2(this.changepos.y,this.changepos.x))*Vec2Len(this.changepos) + toRad(j*this.changerot)*paddlex*2;
            var center = new Vec2(
                j*paddlex,
                -(paddlestart - paddlespan - spacing)
            );
            Draw.rect(tank.track,
                this.x + Angles.trnsx(r,center.x, center.y),
                this.y + Angles.trnsy(r,center.x, center.y),
                r
            );

            center = new Vec2(
                j*paddlex,
                -(paddlestart)
            );
            Draw.rect(tank.track,
                this.x + Angles.trnsx(r,center.x, center.y),
                this.y + Angles.trnsy(r,center.x, center.y),
                r
            );
            
            while(this.trackmove[k] > spacing){
                this.trackmove[k] -= spacing;
                //print(this.trackmove[0]);
            }
            while(this.trackmove[k] < 0){
                this.trackmove[k] += spacing;
            }

            for(let i = 0; i < paddlenum; i++){
                let pos = new Vec2(
                    j*paddlex,
                    spacing*i - paddlestart + this.trackmove[k]
                );
                Draw.rect(tank.track,
                    this.x + Angles.trnsx(r,pos.x, pos.y),
                    this.y + Angles.trnsy(r,pos.x, pos.y),
                    r
                );
            }
        }
        Draw.reset();
    }
});

refresh(tank);

tank.weapons.add(tankgun);

module.exports = tank;

function angleDifference(from, to){
    let difference = to - from;
    while (difference < -180) difference += 360;
    while (difference > 180) difference -= 360;
    return difference;
}

function dpos(ip,fp,t){
    return new Vec2((fp.x-ip.x)/t,(fp.y-ip.y)/t);
}

function Vec2Len(v){
    return Math.sqrt(Math.pow(v.x,2)+Math.pow(v.y,2));
}

function toRad(angle){
    return (angle * Math.PI/180);
}

function toDeg(angle){
    return (angle * 180/Math.PI);
}