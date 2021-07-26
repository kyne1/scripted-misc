const refresh = require("libs/refresh");

//const searchInterval = 75;

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
    Draw.color(Color.valueOf("#bf8bce"), 0.8);
    Draw.z(Layer.flyingUnitLow-1);
    Drawf.laser(team, laser, laserEnd, x1 + vx*len1, y1 + vy*len1, x2 - vx*len2, y2 - vy*len2, 0.25);
}
//var inc = 0;

const grouper = extend(UnitType, "grouper",{
    load(){
        this.super$load();
        this.region = sprite("ares-grouper");
    },
    init(){
        this.super$init();
        this.localizedName = "mosquito";
    },
    description: "Rallies and pools the HP of all units under its command",
    health: 375,
    speed: 2.8,
    accel: 0.07,
    drag: 0.03,
    flying: true,
    hitSize: 9,
    engineOffset: 8,
    engineSize: 2,
    armor: 3,
    rotateShooting: true,
    rotateSpeed: 12,
    research: UnitTypes.flare,
    range: 130,
    commandLimit: 10,
    lowAltitude: true,
    buildSpeed: 0.3,
    mineTier: 1,
    mineSpeed: 5,
});

grouper.constructor = () => extend(UnitEntity,{
    classId: () => grouper.classId, 
    groupsize: 0,
    maxh: 0,
    sumh: 0,
    lasth: 0,
    update(){
        this.super$update();

        //randomize firing interval
        let mount = this.mounts[0];
        if(mount.shoot && mount.reload == sapgun.reload){
            mount.reload -= Math.random()*(sapgun.reload-10);
        }

        if(this.isCommanding()){
            //kill everyone if pool is near zero
            let helth = 0;
            this.controlling.forEach(u => {
                //this.maxh += u.maxHealth;
                helth += u.health;
                //print(helth);
            });
            helth += this.health;
            this.sumh = helth;

            if(this.sumh <= 1){
                this.controlling.forEach(u => {
                    u.kill();
                });
                this.kill();
                //this.formation = null;
            }

            let percentage = this.sumh/this.maxh;
            this.controlling.forEach(u => {
                u.health = u.type.health*percentage;
            });
            this.health = this.type.health*percentage;
        }
    },
    clearCommand(){
        //print(this);
        //undo health pooling
        if(this.isCommanding()){
            this.groupsize = 0;
            this.maxh = 0;
            this.sumh = 0;
        }
        this.super$clearCommand();
        //inc++;
    },
    command(formation, units){
        this.super$command(formation, units);
        //print(this);
        units.forEach(u => {
            this.maxh += u.maxHealth;
            this.sumh += u.health;
            //print(u.health);
            this.groupsize++;
        });
        //print(this.sumh);
        this.maxh += this.maxHealth;
        this.sumh += this.health;
        //print(this.groupsize);
    },
    draw(){
        this.super$draw();
        if(this.isCommanding()){
            this.controlling.forEach(u=>{
                drawLaser(this.team,
                    this.x,this.y,
                    u.x,u.y,
                    this.hitSize/2,u.hitSize/2);
            });
        }
    },
});

const sapbullet = extend(SapBulletType,{
    damage: 17,
    shootEffect: Fx.shootSmall,
    hitColor: Color.valueOf("bf92f9"),
    color: Color.valueOf("bf92f9"),
    despawnEffect: Fx.none,
    width: 0.55,
    lifetime: 17,
    knockbacK: -0.5,
    length: 123,
    sapStrength: 0.75
});

const sapgun = extend(Weapon, "sapgun",{
    reload: 50,
    x: 0,
    y: 5.2,
    shootSound: Sounds.sap,
    bullet: sapbullet,
    rotate: false,
    mirror: false,
});

grouper.weapons.add(sapgun);

grouper.defaultController = () => extend(BuilderAI,{});

refresh(grouper);


