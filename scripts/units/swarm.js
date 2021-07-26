const refresh = require("libs/refresh");
const fname = require("dir");
const sapbomb = require("bullets/sapbomb");
const comShield = require("abilities/commandShield");
const pool = require("libs/poolhealth");
const fac = require("libs/factoryPush");
//const searchInterval = 75;

function sprite(name){
    return Core.atlas.find(name);
}

const swarm = extend(UnitType, "swarm",{
    load(){
        this.super$load();
        this.region = sprite(fname+"-swarm");
    },
    init(){
        this.super$init();
        this.localizedName = "locust";
    },
    description: "Carpet bomber with forcefields",
    health: 90,
    speed: 5.4,
    accel: 0.02,
    drag: 0.02,
    armor: 2,
    flying: true,
    hitSize: 6,
    engineOffset: 5,
    engineSize: 2.3,
    rotateShooting: false,
    rotateSpeed: 7,
    research: UnitTypes.flare,
    circleTarget: true,
    targetAir: false,
    range: 140,
    commandLimit: 19,
    lowAltitude: false,
    faceTarget: false,
    mineTier: 1,
    mineSpeed: 0.5,
});

swarm.constructor = () => extend(UnitEntity,{
    classId: () => swarm.classId,
    groupsize: 0,
    maxh: 0,
    sumh: 0,
    lasth: 0,
    update(){
        if(this.isCommanding())print(this.lasth);
        this.super$update();
        pool.update(this);
    },
    clearCommand(){
        //undo health pooling
        pool.clearCommand(this);
        this.super$clearCommand();
    },
    command(formation, units){
        this.super$command(formation, units);
        pool.command(this,formation,units);
    },
    draw(){
        this.super$draw();
        pool.draw(this);
    },
});

const bomb = sapbomb();
bomb.homingPower =  6;
bomb.homingRange = 70;
bomb.splashDamage = 19;
bomb.splashDamageRadius = 23;
bomb.lifetime = 56;
bomb.speed = 0.1;
bomb.maxSpeed = 1.3;
bomb.drag = 0.036;

bomb.frontColor = bomb.backColor = Color.valueOf("bf92f9");
bomb.width = 9;
bomb.height = 12;
bomb.shrinkY = 0.6;
bomb.shrinkX = 0.4;
bomb.despawnEffect = Fx.flakExplosion;
bomb.maxRange = 85;
bomb.status = StatusEffects.sapped;
bomb.statusDuration = 60*10;
//bomb.color = Color.valueOf("bf92f9");


const swarmgun = extend(Weapon, "swarmgun", {
    rotate: false,
    x:0,
    xRand: 0.7,
    y:-2,
    reload: 160,
    mirror: false,
    bullet: bomb,
    ignoreRotation:true,
    shootCone: 180,
    inaccuracy: 15,
    shots: 7,
    shotDelay: 6,
    shootSound: Sounds.none,
});

swarm.weapons.add(swarmgun);

swarm.defaultController = () => extend(FlyingAI,{});

//@params: radius regen max cooldown
const shield = new comShield(17,1,65,85); //shield give group
const shield1 = new ForceFieldAbility(15,1,65,85); //shield give self
swarm.abilities.add(shield);
swarm.abilities.add(shield1);

refresh(swarm);
module.exports = swarm;

fac("air",swarm,5);
