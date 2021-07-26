const refresh = require("libs/refresh");
const spawn = require('abilities/customUnitSpawn');
const fname = require('dir');
const fac = require('libs/factoryPush');

var sides = ["L","M","R"];

//custom effects
//(duration, spawner reference)
var aExp = new Effect(80, e => {
  //shockwaves
  Draw.color(Pal.missileYellow);

  e.scaled(10, i => {
    Lines.circle(e.x, e.y, 4 + i.fin() * 72);
  });

  e.scaled(12, i => {
    Lines.circle(e.x, e.y, 4 + i.fin() * 67);
  });

  e.scaled(15, i => {
    Lines.circle(e.x, e.y, 4 + i.fin() * 64);
  });

  //glowing line
  e.scaled(17,i =>{
    Lines.stroke(40 * i.fout());
  });

  //smoke
  Draw.color(Color.gray);

  Angles.randLenVectors(e.id, 45, 5 + 50 * e.finpow(), (x, y) => {
    Fill.circle(e.x + x, e.y + y, e.fout() * 10 + 0.5);
  });

  //
  Draw.color(Pal.missileYellowBack);
  Lines.stroke(e.fout());
  //glowing stuff
  e.scaled(55, i =>{
    //movement
    Angles.randLenVectors(e.id, 26, 5 + 27 * e.finpow(), (x, y) => {
      //circle
      Fill.circle(e.x + x, e.y + y, i.fout() * 7+ 0.5);
    });
  });
  
  //lines i guess
  Angles.randLenVectors(e.id + 1, 19, 1 + 50 * e.finpow(), (x, y) => {
    Lines.lineAngle(e.x + x, e.y + y, Mathf.angle(x, y), 1 + e.fout() * 4);
  });
});

const blankshot = extend(BasicBulletType,{
  lifetime: 0,
  width: 0,
  height: 0,
  damage: 180
});

const mainshot = extend(ArtilleryBulletType, {
  //will add more later
  update(b){
    this.super$update(b)
  },
  frontColor: Color(255, 137, 0),
  //remove if crash
  collides: false,
  width: 4,
  height: 40,
  shrinkY: 0.4,
  speed: 3.2,
  splashDamageRadius: 71,
  splashDamage: 365,
  //direct damage doesnt work, only breaks the forccefields
  damage: 160,
  status: StatusEffects.burning,
  trailEffect: Fx.artilleryTrail,
  shootEffect: Fx.none,
  smokeEffect: Fx.none,
  lifetime: 148,
  hitEffect: aExp,
  keepVelocity: false,
  fragBullets: 1,
  fragBullet: blankshot,
  absorbable: true,
});



var guns = {};
var rspeed = 1.2
//im ashamed to bruteforce like this
var span = 5;
var delay = 12;
var res = 38;
var rld = 288;
for(let i = 0; i < 3; i++){
  let tempsides = sides[i];
  guns[i] = extend(Weapon, "gun"+tempsides,{
    load(){
      this.super$load();
      //this.super$load();this.region = Core.atlas.find("ares-gun"+tempsides);
    },
    rotate: true,
    rotateSpeed: rspeed,
    mirror: false,
    x: 0,
    y: 74,
    reload: rld,
    //xRand: 8,
    firstShotDelay: i*delay,
    shootY: 18,
    shootX: span*(i-1),
    recoil: 13,
    inaccuracy: 1.4,
    shots: 1,
    shootSound: Sounds.artillery,
    bullet: mainshot,
    restitution: rld - res
  });
};

function getUnit(){
  const unit = extend(UnitType, "ares", {  
    /*drawWeapons(unit){
    }*/
    load() {
      this.super$load();
      this.region = Core.atlas.find(this.name);
      this.tbase = Core.atlas.find(fname+"-turret1base");
      this.secondaries = Core.atlas.find(fname+"-secondaries");
      this.paddle = Core.atlas.find(fname+"-ares-paddle");
      this.barrel = {}; //LMR
      for(let i = 0; i < 3; i++){
        let tempsides = sides[i];
        this.barrel[i] = Core.atlas.find(fname+"-gun" + tempsides);
      }
    },
    init(){
      this.super$init();
      //trick to renaming it without screwing stuff up
      this.localizedName = "icarus";
    },
    description: "Heavy-hitting battlecruiser. It has no movement AI and low HP for its size. Don't fly too close to the enemies.",
    health: 5600,
    //type: flying,
    speed: 1.2,
    accel: 0.004,
    rotateSpeed: 0.3,
    drag: 0.004,
    hitSize: 85,
    armor: 23,
    rotateShooting: false,
    trailLength: 35,
    trailX: 12,        
    trailY: 18,
    trailScl: 2.8,
    research: UnitTypes.eclipse,
    range: 255,
    flying: true,
    engineOffset : 65,
    engineSize : 13.2,
    lowAltitude: true
  });

  unit.constructor = () => extend(UnitEntity, {
    //yes it works, a different var per unit, but will start from different var than saved when loaded
    //h: Math.random(),

    //VERY IMPORTANT DO NOT DELETE OR METHODS NO WORK
    classId: () => unit.classId,
    //update only work when spawn
    update(){
      this.super$update();
    },
    killed(){
      this.super$killed();
      Fx.massiveExplosion.at(this.x,this.y,this.rotation);
    },
    draw(){
      this.super$draw();
      Draw.z(Layer.flyingUnitLow+0.5); //between turret and ship
      for(let i = 0; i < 3; i++){
        let mrotation = this.mounts[i].rotation;
        let recoil;
        
        //from maxreload to 0
        if(this.mounts[i].reload > guns[i].reload-guns[i].firstShotDelay){
          recoil = 0;
        }
        else recoil = -Math.max((this.mounts[i].reload + guns[i].firstShotDelay)-guns[i].restitution,0) / (guns[i].reload-guns[i].restitution) * guns[i].recoil;
        
        //brute force detect if gun recoiled/shot
        if(Math.abs(this.mounts[i].reload - (guns[i].reload-guns[i].firstShotDelay)) < Time.delta/3 ){
          let posx = this.x + Angles.trnsx(this.rotation-90,guns[i].x,guns[i].y) + Angles.trnsx(mrotation + this.rotation-90,guns[i].shootX,guns[i].shootY-4);
          let posy = this.y + Angles.trnsy(this.rotation-90,guns[i].x,guns[i].y) + Angles.trnsy(mrotation + this.rotation-90,guns[i].shootX,guns[i].shootY-4);
          Fx.shootBig.at(posx,posy,this.rotation + mrotation);
          Fx.shootBigSmoke2.at(posx,posy,this.rotation + mrotation);
        }
        Draw.rect(
            unit.barrel[i],
            this.x + Angles.trnsx(this.rotation-90,guns[i].x,guns[i].y) + Angles.trnsx(mrotation + this.rotation-90,0,recoil),
            this.y + Angles.trnsy(this.rotation-90,guns[i].x,guns[i].y) + Angles.trnsy(mrotation + this.rotation-90,0,recoil),
            this.rotation + mrotation - 90
        );
      };
      Draw.reset();
    },
  });
  return unit;
}

const a = getUnit();
refresh(a);

for(let i = 0; i < 3; i ++){
  a.weapons.add(guns[i]);
}

//zenith 2
const z = extend(UnitType, "zenith2", {
});
z.constructor = () => extend(UnitEntity, {
  classId: () => z.classId,
  killed(){
    this.super$killed();
  }
});

//format ripped from goldmod, (amt, max, rld, range)
const zshield = new JavaAdapter(ShieldRegenFieldAbility, {}, 32,140,60*8,10);
//const ashield = new JavaAdapter(ShieldRegenFieldAbility, {}, 1500,3000,1000,100);
z.abilities.add(zshield);
//a.abilities.add(ashield);


const sbf = extend(BasicBulletType, {
  width: 5,
  height: 7,
  lifetime: 20,
  speed: 12,
  damage: 10,
  drag: 0.03,
  pierce: true,
  despawnEffect: Fx.none,
  hitEffect: Fx.none
});

//sb = secondary bullet
const sb = extend(BasicBulletType, {
  width: 7,
  height: 11,
  shrinkY: 0,
  speed: 12,
  drag: 0,
  damage: 70,
  makeFire: true,
  status: StatusEffects.burning,
  lifetime: 28,
  fragBullets: 2,
  fragCone: 30,
  //add frag
  fragBullet: sbf,
  despawnEffect: Fx.none,
  hitEffect: Fx.none
});

//module.exports = sbf;

//a.weapons.add(wm);

var spawnZenith = spawn(z,0,5,1200);
var spawnFlare = spawn(UnitTypes.flare,0,-17,150);


a.abilities.add(spawnZenith);

//a.abilities.add(shield);
a.abilities.add(spawnFlare);

//make ares unit available to all files
module.exports = a;

fac("air",a,5);

//.put()
