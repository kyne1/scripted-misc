const refresh = require("libs/refresh");
const fname = require("dir");
const pool = require("libs/poolhealth");

function sprite(name){
    return Core.atlas.find(name);
}

const orbs = 3;
const laser = sprite("laser");
const laserEnd = sprite("laser-end");
const inaccuracy = 2;
const rotateSpeed = 0.9;
const orbReload = 96;
const animStart = 0.55; //when does orb start growing in size;
const orbSize = 4.4;

function drawLaser(team,  x1,  y1,  x2,  y2,  size1,  size2){
    let angle1 = Angles.angle(x1, y1, x2, y2);
    let vx = Mathf.cosDeg(angle1), vy = Mathf.sinDeg(angle1);
    let len1 = size1 / 2 - 1.5, len2 = size2 / 2 - 1.5;
    //print(Drawf);
    Draw.color(Color.valueOf("#bf8bce"), 0.8);
    Drawf.laser(team, laser, laserEnd, x1 + vx*len1, y1 + vy*len1, x2 - vx*len2, y2 - vy*len2, 0.25);
}

//draw an orb
function drawOrb(x, y, size, opacity){
    Draw.z(Layer.bullet);
    Draw.color(Color.valueOf("#a751fd"), 0.2*opacity)
    Fill.circle(x, y, size*1.15);
    Draw.color(Color.valueOf("#bb7cf9"), 0.3*opacity)
    Fill.circle(x, y, size);
    Draw.color(Color.valueOf("#bf8bce"), 0.7*opacity)
    Fill.circle(x, y, size*0.8);
    Draw.color(Color.valueOf("#e1b9ed"), 0.96*opacity);
    Fill.circle(x, y, size*0.5);
}

function scaleOrb(x,y,sizei,sizef,percent){
    //print(sizei+scale*(sizef-sizei));
    drawOrb(x,y,sizei+fin(percent)*(sizef-sizei),1);
}

//asymptotic approach to 1 (100%)
function fin(percent){
    return 1 - Math.pow(2,-Math.min(percent,1)*6); 
}

function toRad(angle){
    return (angle * Math.PI/180);
}

function toDeg(angle){
    return (angle * 180/Math.PI);
}

function angleTo(xf,yf,xi,yi){
    return toDeg(Math.atan2(yf-yi,xf-xi));
};

const warper = extend(UnitType, "warper",{
    load(){
        this.super$load();
        this.region = sprite(fname+"-warper");
    },
    init(){
        this.super$init();
        this.localizedName = "firefly";
    },
    description: "Summons and launches electric orbs. Attack from distance. Manual control recommended.",
    health: 560,
    speed: 2.0,
    accel: 0.05,
    drag: 0.03,
    flying: true,
    hitSize: 19,
    engineOffset: 11,
    engineSize: 3.3,
    armor: 4,
    rotateShooting: false,
    rotateSpeed: 7,
    research: UnitTypes.horizon,
    range: 180,
    commandLimit: 9,
    lowAltitude: false,
    buildSpeed: 1.2,
    mineTier: 3,
    mineSpeed: 8,
});

warper.constructor = () => extend(UnitEntity,{
    classId: () => warper.classId,
    groupsize: 0,
    maxh: 0,
    sumh: 0,
    searchTimer: 0,
    lasth: 0,
    orbrot: 0,
    orbpos: {}, //positions of orbs, make position sync between draw and bullet spawn easyer
    orbready: 0,
    orbtimer: 0,
    update(){
        this.super$update();
        pool.update(this);
        print(this.sumh);
        this.orbrot += rotateSpeed*Time.delta;
        for(let i = 0; i < orbs; i++){
            let rot = toRad(this.orbrot + i*360/orbs);
            //print(rot);
            this.orbpos[i] = new Vec2(Math.cos(rot)*this.type.hitSize, Math.sin(rot)*this.type.hitSize);
            //print(this.orbpos[i].x);
        }
        if(this.orbrot >= 360) this.orbrot -= 360;
        else if(this.orbrot <= 0) this.orbrot += 360;

        

        this.orbtimer += Time.delta;

        //slowly gain orbs
        if(this.orbtimer >= orbReload && this.orbready < orbs){
            this.orbready ++;
            this.orbtimer = 0;
        }
        
        //if not a player nor under command
        if(!this.isPlayer() && !(this.controller instanceof FormationAI)){
            let target = Units.closestTarget(this.team, this.x,this.y, this.type.range)
            if(target != null) this.isShooting = true;
        }

        if(this.isShooting && this.orbready > 0){
            //print("h");
            for(let i = 0; i < this.orbready; i++){
                let thisx = this.orbpos[i].x + this.x;
                let thisy = this.orbpos[i].y + this.y;
                //print(thisx);
                orbBullet.create(
                    this, this.team,
                    thisx, thisy,
                    angleTo(this.mounts[0].aimX,this.mounts[0].aimY,thisx,thisy) + Mathf.range(inaccuracy)
                )
            }
            Sounds.tractorbeam.at(this.x,this.y);
            this.orbready = 0;
            this.orbtimer = 0;
        }
    },
    clearCommand(){
        pool.clearCommand(this);
        this.super$clearCommand();
        //inc++;
    },
    command(formation, units){
        this.super$command(formation, units);
        pool.command(this,formation,units);
    },
    draw(){
        this.super$draw();
        pool.draw(this);
        //draw orbiting orbs
        try{

            if(this.orbtimer >= orbReload * animStart && this.orbready < orbs && this.orbtimer <= orbReload){
                let percent = (this.orbtimer - orbReload * animStart)/(orbReload*(1-animStart));
                let thisx = this.orbpos[this.orbready].x + this.x;
                let thisy = this.orbpos[this.orbready].y + this.y;
                scaleOrb(thisx,thisy,0,orbSize,percent);
            }

            for(let i = 0; i < this.orbready; i++){
                let thisx = this.orbpos[i].x + this.x;
                let thisy = this.orbpos[i].y + this.y;
                drawOrb(thisx,thisy,orbSize,1);
            }
        }   
        catch(e){
            //print(e);
        }
    },
});

const warperbullet = extend(LightningBulletType,{
    damage: 34,
    shootEffect: Fx.none,
    lightningLength: 7,
    lightningLengthRand: 3,
    lightningColor: Color.valueOf("#bf8bce"),
    hitColor: Color.valueOf("#bf8bce"),
    lightningType: extend(BulletType, {
        lifetime: Fx.lightning.lifetime,
        hitEffect: Fx.none,
        despawnEffect: Fx.none,
        status: StatusEffects.shocked,
        statusDuration: 25,
        hittable: false,
        collidesTeam: false,
    }),
});


const warperbullet2 = extend(BasicBulletType,{
    damage: 15,
    shootEffect: Fx.none,
    lifetime: 40,
    speed: 8,
});

const orbBullet = extend(BasicBulletType,{
    damage: 30,
    splashDamageRadius: 35,
    splashDamage: 12,
    shootEffect: Fx.none,
    despawnEffect: Fx.redgeneratespark,
    hitEffect: Fx.redgeneratespark,
    lifetime: 80,
    speed: 3.8,
    homingPower: 0.08,
    homingRange: 70,
    fragBullets: 2,
    fragBullet: warperbullet,
    draw(b){
        drawOrb(b.x,b.y,orbSize,1);
    }
});

const blankshot = extend(BasicBulletType,{
    lifetime: 0,
    width: 0,
    height: 0,
    damage: 1,
    shootEffect: Fx.none,
    shootSmoke: Fx.none,
    despawnEffect: Fx.none,
    hitEffect: Fx.none,
    speed: orbBullet.speed
});

const fakegun = extend(Weapon, "fakegun",{
    rotate: true,
    x:0,
    y:0,
    reload: 10000,
    recoil: 0,
    mirror: false,
    bullet: blankshot,
    shootSound: Sounds.none,
});

warper.weapons.add(fakegun);

warper.defaultController = () => extend(BuilderAI,{});

const shield = new ShieldRegenFieldAbility(15, 90, 60*4.5, 50);

const heal = new RepairFieldAbility(25, 60*8, 50);

warper.abilities.add(shield);

warper.abilities.add(heal);

refresh(warper);
