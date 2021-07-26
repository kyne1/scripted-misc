const drawBarrel = require("libs/drawBarrelMinigun");

var shootsound = Sounds.shoot;
var shootfx = Fx.shootSmall;

const barrelOffset = new Vec2(0,5);

const minigun = extend(ItemTurret,"minigun",{
    load() {
		this.super$load();
        this.baseRegion = Core.atlas.find("block-3");
        this.mountRegion = Core.atlas.find("ares-minigun-mount");
        this.mountOutline = Core.atlas.find("ares-minigun-outline");
        this.barrelRegion = Core.atlas.find("ares-minigun-barrel");
        this.barrelOutline = Core.atlas.find("ares-minigun-barrel-outline");
        //this.gunmount = Core.atlas.find("ares-shotgunblock3");
	},
    icons(){
        return [
          this.baseRegion,
          Core.atlas.find("ares-minigun-icon")
        ];
    },
    localizedName: "minigun",
    description: "turret go brrr",
    range: 220,
    unloadable: false,
    health: 2500,
    inaccuracy: 6,
    size: 3,
    expanded: true,
    breakable: true,
    rebuildable: true,
    research: Blocks.scatter,
    recoil: 0,
    barrelTorque: 0.011,
    shootY: 5,
    maxSpin: 2.7,
    coolantMultiplier: 1.3,
    maxAmmo: 80,
    //restitution: 0.3
    //alternate: true
});

const leadshot = extend(BasicBulletType,{
    speed: 3.5,
    damage: 13,
    lifetime: 80,
    width: 5,
    height: 10,
    knockback: 1,
    pierce: false,
    ammoMultiplier: 5,
    reloadMultiplier: 1.6,
});

const thorshot = extend(BasicBulletType,{
    speed: 4,
    damage: 60,
    lifetime: 70,
    width: 7,
    height: 10,
    knockback: 1.1,
    frontColor: Pal.thoriumPink,
    pierce: false,
    ammoMultiplier: 4,
});



minigun.ammo(
    Items.lead, leadshot,
    Items.thorium, thorshot,
);

minigun.setupRequirements(Category.turret, ItemStack.with(
    Items.copper, 450,
    Items.lead, 600,
    Items.graphite, 150,
    Items.silicon, 215,
    Items.surgeAlloy, 75
));

//for vec2 only
function Vec2Len(v){
    return Math.sqrt(Math.pow(v.x,2)+Math.pow(v.y,2));
}

function toRad(angle){
    return (angle * Math.PI/180);
}

function toDeg(angle){
    return (angle * 180/Math.PI);
}

//ripped from meepoffaith/prog-mats-js
minigun.buildType = ent => {
    var spinpos = 0; // 0 to 10 arbitrary
    var spinSpeed = 0;
    var canShoot = false;
    var torqueMultiplier = 1;
    var spinMultiplier = 1;
    ent = extend(ItemTurret.ItemTurretBuild, minigun,{
        updateTile(){
            this.super$updateTile();
            //print(spinpos);
            canShoot = false;
            if(spinSpeed != 0){
                spinpos += spinSpeed
                if(spinpos > 10){
                    spinpos -= 10;
                    canShoot = true;
                };
            };
            if(!this.isShooting()){
                spinSpeed -= minigun.barrelTorque;
                spinSpeed = Math.max(0,spinSpeed);
            }
            //print(spinSpeed);
        },
        draw(){
            //this.super$draw();
            let rotation = this.rotation-90
            Draw.rect(minigun.baseRegion, this.x, this.y, 0);
            
            Draw.z(Layer.turret);
            Draw.rect(minigun.mountRegion,this.x,this.y,rotation);
            Draw.z(Layer.turret-0.5);
            Draw.rect(minigun.mountOutline,this.x,this.y,rotation);
            drawBarrel(minigun.barrelRegion, minigun.barrelOutline, 6, 2.3, spinpos, new Vec2(this.x,this.y), barrelOffset, rotation);
        },
        shoot(type){
           this.super$shoot(type);
        },
        updateShooting(){
            var type = this.peekAmmo();
            if(type == leadshot){
                torqueMultiplier = 2.5;
                spinMultiplier = 1.6;
            }
            else{
                torqueMultiplier = 1;
                spinMultiplier = 1;
            }
            spinSpeed += minigun.barrelTorque * torqueMultiplier;
            spinSpeed = Math.min(spinSpeed,minigun.maxSpin * spinMultiplier);
            if(canShoot){
                this.shoot(type);
                canShoot = false;
            }
        },
        /*setBars(){
            //this.super$setBars();
            bars.add("rotation", new Bar(() => Pal.thoriumPink, () => spinSpeed / minigun.maxSpin*spinMultiplier));
        }*/
    });
    return ent;
};
