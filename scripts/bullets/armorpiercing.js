const trail = require("fx/fixedtrail");


//@params: penmod, armormod 
//they are functions, see below for example.
module.exports = function getBullet(armormod, penmod){
    const bull = extend(BasicBulletType, {
        //only registers units hit
        //Hitboxc entity can be treated as just unit
        hitEntity( b,  entity,  initialHealth){
            if(entity instanceof Healthc){
                let a = armormod(entity.armor)
                entity.damage(a*b.damage);
                //print(a);
                if(a > 2){
                    penEf.at(b.x,b.y,b.rotation());
                    Fx.blastsmoke.at(b.x,b.y,b.rotation());
                }
            }
    
            if(entity instanceof Unit){
                entity.impulse(Tmp.v3.set(entity).sub(b.x, b.y).nor().scl(this.knockback * 80));
                entity.apply(this.status, this.statusDuration);
            }
            b.time += penmod(entity.armor);
        },
        hitTile( b,  build,  initialHealth,  direct){
            this.super$hitTile(b,  build,  initialHealth,  direct);
            let h = Math.sqrt(build.maxHealth)/11;
            let a = armormod(h);
            //print(h);
            if(a > 2){
                penEf.at(b.x,b.y,b.rotation());
                Fx.blastsmoke.at(b.x,b.y,b.rotation());
            }
            build.damage(Math.max(b.damage*(a-1),0));
            b.time += penmod(h);
        },
        draw(b){
            this.super$draw(b);
            //print(b.x+" "+b.y+" "+b.rotation());
            ef.at(b.x, b.y, b.rotation());
        },
        width: 5,
        height: 16,
        shrinkY: 0,
        speed: 16.6,
        drag: 0,
        damage: 60, //treated as baseDamage
        lifetime: 26,
        pierce: true,
        pierceBuilding: true
        });
    return bull;
}

//returns a modifier that multiplies the damage
//this example: very efficient when dealing with low armor but whiffs high armor
function aMod(a){
    if(a < 3){
        return 20;
    }
    else return 0.5;
}

//how much life time subtracted
function pMod(a){
    return 1;
}

//thorium trail effect
const ef = new Effect(6, e => {
    for(let i = 0; i < 2; i++){
        Draw.z()
        Draw.color(i == 0 ? Pal.thoriumPink : Pal.bulletYellow);
        var m = i == 0 ? 1 : 0.5;
  
        var rot = e.rotation + 180;
        var w = 15 * e.fout() * m - 2;
        Drawf.tri(e.x, e.y, w, (30 + Mathf.randomSeedRange(e.id, 15)) * m, rot);
        Drawf.tri(e.x, e.y, w, 10 * m, rot + 180);
    }
});

//hit effect
const penEf = new Effect(5, 130, e => {
    for(let i = 0; i < 2; i++){
        Draw.color(i == 0 ? Pal.thoriumPink : Pal.bulletYellow);
        
        let m = i == 0 ? 1 : 0.5;

        for(let j = 0; j < 5; j++){
            let rot = e.rotation + Mathf.randomSeedRange(e.id + j, 50);
            let w = 14 * e.fout() * m;
            Drawf.tri(e.x, e.y, w, (40 + Mathf.randomSeedRange(e.id + j, 30)) * m, rot);
            Drawf.tri(e.x, e.y, w, 20 * m, rot + 180);
        }
    }
});
