var rld = 132;
var cooldown = 7;
var shootx = 1.5;
var shooty = 6;
var loadround = 2;
var maxload = 8;

var shootsound = Sounds.shoot;
var shootfx = Fx.shootSmall;

const shotgun = extend(ItemTurret,"machete",{
    load() {
		this.super$load();
        this.baseRegion = Core.atlas.find("block-1");
        this.gunmount = Core.atlas.find("ares-shotgunmount");
        this.gunR = Core.atlas.find("ares-sgbarrelR");
        this.gunL = Core.atlas.find("ares-sgbarrelL");
        //this.gunmount = Core.atlas.find("ares-shotgunblock3");
	},
    icons(){
        return [
          this.baseRegion,
          Core.atlas.find("ares-machete-icon")
        ];
    },
    localizedName: "machete",
    description: "twin shotguns mounted on turret to fill your enemy with lead. Knocks back them back too.",
    range: 93,
    reloadTime: 1,
    shots: 8,
    unloadable: true,
    health: 645,
    inaccuracy: 15,
    size: 1,
    expanded: true,
    breakable: true,
    rebuildable: true,
    research: Blocks.duo,
    recoil: 3,
    restitution: 0.3
    //alternate: true
});

const leadshot = extend(BasicBulletType,{
    speed: 4,
    damage: 11,
    lifetime: 23,
    width: 5,
    height: 8,
    knockback: 4,
    pierce: false
});

shotgun.ammo(
    Items.lead, leadshot
);

shotgun.setupRequirements(Category.turret, ItemStack.with(
    Items.copper, 24,
    Items.graphite, 18,
    Items.lead, 45
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
shotgun.buildType = ent => {
    var shootL = true; //true is left, false is right
    var loaded = 0;
    var recoilR = 0;
    var recoilL = 0;
    //method variables;
    var type;
    var timer = 0;
    var cdtimer = 0; //timer for cooldown

    ent = extend(ItemTurret.ItemTurretBuild, shotgun,{
        updateTile(){
            this.super$updateTile();
            //preload function
            timer += Time.delta;
            if(loaded <= maxload - loadround && timer >= rld && this.hasAmmo()){
                loaded += loadround;
                timer = 0;
            }
            recoilL = Math.max(recoilL - shotgun.restitution, 0);
            recoilR = Math.max(recoilR - shotgun.restitution, 0);
        },
        draw(){
            let rotation = this.rotation - 90;
            let Rpos = new Vec2(
                0,
                -recoilR
            );
            let Lpos = new Vec2(
                0,
                -recoilL
            );
            let RposA = Math.atan2(Rpos.y,Rpos.x);
            let LposA = Math.atan2(Lpos.y,Lpos.x);
            //this.baseRegion undefined

            Draw.rect(shotgun.baseRegion, this.x, this.y, 0);

            //how to layer
            Draw.z(Layer.turret);
            Draw.rect(shotgun.gunL,
                 this.x + Math.cos(toRad(rotation) + RposA) * Vec2Len(Rpos),
                 this.y + Math.sin(toRad(rotation) + RposA) * Vec2Len(Rpos),
                 rotation
            );
            Draw.rect(shotgun.gunR,
                this.x + Math.cos(toRad(rotation) + LposA) * Vec2Len(Lpos),
                this.y + Math.sin(toRad(rotation) + LposA) * Vec2Len(Lpos),
                rotation
            );
            Draw.z(Layer.turret+1);
            Draw.rect(shotgun.gunmount, this.x, this.y, rotation);
        },
        shoot(type){
            this.useAmmo();
            this.useAmmo();
            let rotation = this.rotation;
            let pos = new Vec2(
                shootx,
                shooty,
            );
            let posA = Math.atan2(pos.y,pos.x);
            for(let i = 0; i < shotgun.shots; i++){
                type.create(
                    this,
                    this.team,
                    this.x + Math.cos(toRad(rotation-90)+ posA)*Vec2Len(pos),
                    this.y + Math.sin(toRad(rotation-90)+ posA)*Vec2Len(pos),
                    rotation + Mathf.range(shotgun.inaccuracy)
                );
            }
            shootfx.at(
                this.x + Math.cos(toRad(rotation-90)+ posA)*Vec2Len(pos),
                this.y + Math.sin(toRad(rotation-90)+ posA)*Vec2Len(pos),
                rotation
            );

            shootsound.at(this);
            shootx *= -1;
            if(shootL){
                recoilL = shotgun.recoil;
            }
            else{
                recoilR = shotgun.recoil;
            }
            shootL = !shootL;

        },
        updateShooting(){
            cdtimer += Time.delta;
            if(loaded > 0 && cdtimer >= cooldown && !this.charging){
                //using 'this' prefix for the in the same class
                //deadass overriden updateshooting and forgot to set type
                type = this.peekAmmo()
                this.shoot(type);
                cdtimer = 0;
                loaded--;
            }
        },
    });
    //i wasted an hour looking for the bug because I forgot the return
    return ent;
};
