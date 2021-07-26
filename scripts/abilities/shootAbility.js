//this is more like a addon to ares unit than an ability
const refresh = require("libs/refresh");
const a = require('units/ares');
const fname = require('dir');

//weapon variables
var reload = 7;
var spread = 12;
var rows = 5;//at least 2
var rspeed = 3;
var firecone = 5;

//turret general positionings
var yspan = 80;
var ystart = 55;

//properties for each turret
var yoffset = 15.4; //bullet offset from barrel
var xradaroffset = 33;
var range = 240; // radar range

//deafen it
var shootSound = loadSound("secondaryshoot");
//const secondaries = Core.atlas.find("ares-secondaries");

//paddle vars;
var paddlex = 34;
var paddlenum = 5; //per each side
var paddlespan = 80;
var paddlestart = 45; // positive is back neg is front, start at this coordinate and move to front
var spacing = paddlespan/(paddlenum-1);

//for each pair, on one side (right), then mirror it.
//back , front
var anglelimit = [
    [150,-75], //back
    [75,-75], //middle
    [75,-75], //middle
    [75,-75], //middle 
    [75,-168], //front
];

const bullet = extend(BasicBulletType, {
    width: 9,
    height: 16,
    lifetime: 48,
    speed: 8,
    damage: 65,
    splashDamageRadius: 24,
    splashDamage: 7,
    drag: 0,
    //pierce: true,
    despawnEffect: Fx.plasticExplosion,
    hitEffect: Fx.plasticExplosion
});


//took from stackoverflow anon
/*
@params float, float

use it like angle1 - angle2
*/
function angleDifference(from, to){
    let difference = to - from;
    while (difference < -180) difference += 360;
    while (difference > 180) difference -= 360;
    return difference;
}

//flipping an angle down a line perpendicular to the wraparound
function flip90(angle){
    if(angle >= 0){
        return 180-angle;
    }
    else if(angle < 0){
        return -180-angle;
    }
}

//difference of 2 vector over time
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

//store unit refpoints for each unit id to store diff. variables. better solutions have been found.
var unitsMap = new Map();

/*turret setup:
0  3
1  4
2  5
*/

//print("bullet "+ bullet);
//ta for turret ability
function getAbility(){
    let ta = extend(Ability, {
        /*init(){
            this.super$init();
            print("initialized");
        },*/
        update(unit){
            //poor man's init()
            if(!unitsMap.has(unit.id+"timer")){
                //local constants do work
                //initialize
                let timer = {};
                let rto = {}; //rotate to
                let mrotation = {}; //mount rotation
                
                //paddle variables
                let paddlemove = {};//using ints wotn work when doing += 
                let lastpos = {}; //Vec2 array
                let lastrot = {};
                let changepos = {};
                let changerot = {};

                //script
                for(let i = 0; i < 2*rows; i++){
                    paddlemove[i] = 0;
                    timer[i] = 0;
                    rto[i] = 0;
                    mrotation[i] = -90;
                    lastpos[i] = new Vec2(unit.x,unit.y);
                    lastrot[i] = 0;
                    changepos[i] = new Vec2(0,0);
                    changerot[i] = 0
                }
                unitsMap.set(unit.id+"timer", timer);
                unitsMap.set(unit.id+"rto",rto);
                unitsMap.set(unit.id+"mrotation",mrotation);
                unitsMap.set(unit.id+"paddlemove",paddlemove);
                unitsMap.set(unit.id+"lastpos",lastpos);
                unitsMap.set(unit.id+"lastrot",lastrot);
                unitsMap.set(unit.id+"changepos",changepos);
                unitsMap.set(unit.id+"changerot",changerot);
            }
            //import unit variables;
            var timer = unitsMap.get(unit.id+"timer");
            var rto = unitsMap.get(unit.id+"rto");
            var mrotation = unitsMap.get(unit.id+"mrotation"); 
            var changerot = unitsMap.get(unit.id+"changerot");
            
            for(let j = 0; j < 2; j++){
                for(let i = 0; i < rows; i++){
                    var iter = i+rows*j;//iterate timer list
                    
                    //ripped from aicontroller.java in anuke/mindustry
                    let rotation = unit.rotation - 90;
                    let mount = new Vec2(
                        unit.x + Angles.trnsx(rotation, 50*j - 25, yspan/(rows-1)*i - ystart),
                        unit.y + Angles.trnsy(rotation, 50*j - 25, yspan/(rows-1)*i - ystart)
                        );
    
                    timer[iter] += Time.delta;
                    let target = Units.closestTarget(unit.team, mount.x - xradaroffset + 2*xradaroffset*j, mount.y, range);
                    //print(target);//detects target correclty and loops
                    
                    //turret 0 and 1 are not valid, seems to have vectors in them;
                    //print("iter: " + iter + " rotation: " + mrotation[iter]);
                    //turret control pt 2
                    if(j==1){
                        //right guns
                        if(angleDifference(mrotation[iter],rotation) > anglelimit[i][0]){
                            mrotation[iter] = -anglelimit[i][0]+rotation;
                        }
                        else if(angleDifference(mrotation[iter],rotation) < anglelimit[i][1]){
                            mrotation[iter] = -anglelimit[i][1]+rotation;
                        }
        
                    }
                    else{
                        //left guns, need flip
                        //positive
                        if(angleDifference(mrotation[iter],rotation) < flip90(anglelimit[i][0])
                         && angleDifference(mrotation[iter],rotation) > 0){
    
                            mrotation[iter] = -flip90(anglelimit[i][0])+rotation;
                            //print("<" + flip90(anglelimit[i][0]) + " currently:" + angleDifference(mrotation[iter],rotation));
                        }
                        else if(angleDifference(mrotation[iter],rotation) > flip90(anglelimit[i][1])
                        && angleDifference(mrotation[iter],rotation) <= 0 ){
    
                            mrotation[iter] = -flip90(anglelimit[i][1])+rotation;
                            //print(flip90(anglelimit[i][1]) + " !currently:" + angleDifference(mrotation[iter],rotation));
                        } 
                        //print("sets when it >" + flip90(anglelimit[i][1]) + " currently:" + angleDifference(mrotation[iter],rotation));
                    }
                    //check if valid target
                    if(!Units.invalidateTarget(target, unit.team, mount.x, mount.y)){
                        let to = Predict.intercept(mount, target, bullet.speed);
                        rto[iter] = 180*Math.atan2(to.y-mount.y,to.x-mount.x)/Math.PI;
    
                        if(timer[iter] >= reload && Math.abs(mrotation[iter] - rto[iter])<=firecone){
                            timer[iter] = 0;
                            bullet.create(unit,
                                unit.team, 
                                mount.x + Math.cos(Math.PI*mrotation[iter]/180)*yoffset, 
                                mount.y + Math.sin(Math.PI*mrotation[iter]/180)*yoffset, 
                                mrotation[iter] - spread/2 + spread*Math.random());
                            //print("proc");
                            shootSound.at(mount);
                        }
                    }
                    else{
                        if(j > 0){
                            rto[iter] = (anglelimit[rows-i-1][0]+anglelimit[rows-i-1][1])/2 + rotation;
                        }
                        else{
                            //stupid angle wrapping
                            let targetangle = (anglelimit[rows-i-1][0]+anglelimit[rows-i-1][1])/2;
                            if(targetangle >= 0){
                                rto[iter] = 180-targetangle+rotation;
                            }
                            else{
                                rto[iter] = -180-targetangle+rotation;
                            }
                        }
                    }

                    //move turret to rto
                    if(Math.abs(angleDifference(rto[iter],mrotation[iter])) <= Time.delta*rspeed){
                        mrotation[iter] = rto[iter];
                    }
                    else if(angleDifference(mrotation[iter],rto[iter]) > 0){
                        mrotation[iter] += Time.delta*rspeed;
                    }
                    else{
                        mrotation[iter] -= Time.delta*rspeed
                    }
                }
            }
        },
        draw(unit){
            //import unit variables
            var mrotation = unitsMap.get(unit.id+"mrotation"); 
            var paddlemove = unitsMap.get(unit.id+"paddlemove");
            var lastpos = unitsMap.get(unit.id+"lastpos");
            var lastrot = unitsMap.get(unit.id+"lastrot"); 
            var changepos = unitsMap.get(unit.id+"changepos");
            var changerot = unitsMap.get(unit.id+"changerot");
            //unit rotation instead of mount
            var r = unit.rotation-90; 
            try{
                for(let j = 0; j < 2; j++){
                    for(let i = 0; i < rows; i++){
                        var iter = i+rows*j;
                        Draw.rect(a.secondaries,
                            unit.x + Angles.trnsx(r, 50*j - 25, yspan/(rows-1)*i - ystart),
                            unit.y + Angles.trnsy(r, 50*j - 25, yspan/(rows-1)*i - ystart),
                            mrotation[iter] - 90
                        )
                    }
                }
            }
            catch(e){
                //java sucks
            }

            //moved from ares's draw() because bug when loaded up
            const x = 0;
            const y = 74;
            //routorio code
            /*const sin = Mathf.sin(r);
                const cos = Mathf.cos(r);*/
            Draw.z(Layer.flyingUnitLow+1);
            Draw.rect(a.tbase,
            unit.x + Angles.trnsx(r, x, y),
            unit.y + Angles.trnsy(r, x, y),
            r + unit.mounts[0].rotation
            );

            //ares paddle animations
            lastpos[0] = new Vec2(unit.x,unit.y);
            changepos[0] = dpos(lastpos[1], lastpos[0], Time.delta);
            lastpos[1] = new Vec2(unit.x,unit.y);//will be past position becuase only deteced when loop around
            
            lastrot[0] = r;
            changerot[0] = angleDifference(lastrot[0],lastrot[1])/Time.delta;
            lastrot[1] = r;

 
            Draw.z(Layer.flyingUnitLow-1);
            for(let j = -1; j < 2; j+=2){
                //conv to array-fridendly variable
                var k = Math.max(j,0);
                //print(k);
                //movement calculation in direction of facing with multiplier and accounting for rotation
                paddlemove[k] += Math.sin(toRad(r)-Math.atan2(changepos[0].y,changepos[0].x))*Vec2Len(changepos[0])*2.3 + j*changerot[0]*2.5;
                if(paddlemove[k] > spacing){
                    paddlemove[k] -= spacing;
                    //print(paddlemove[0]);
                }
                else if(paddlemove[k] < 0){
                    paddlemove[k] += spacing;
                }
                //print(isNaN(paddlemove[k]));

                //rotations movement for paddles
                var padrot = paddlemove[k]/spacing*90 - 90;
                var padrotfront = padrot + 90;

                var radius = 12;
                var center = new Vec2(
                    paddlex-radius,
                    paddlestart - spacing/2 - paddlespan
                );
                
                //back paddles
                let pos = new Vec2(
                    j*(center.x + radius*Math.cos(toRad(padrot))),
                    center.y + radius*Math.sin(toRad(padrot)),
                )
                Draw.rect(a.paddle,
                    unit.x + Angles.trnsx(r,pos.x, pos.y),
                    unit.y + Angles.trnsy(r,pos.x, pos.y),
                    j*padrot + r
                )
                
                //front paddles
                center = new Vec2(
                    paddlex-radius,
                    paddlestart + spacing/2
                );
                pos = new Vec2(
                    j*(center.x + radius*Math.cos(toRad(padrotfront))),
                    center.y + radius*Math.sin(toRad(padrotfront)),
                );
                Draw.rect(a.paddle,
                    unit.x + Angles.trnsx(r,pos.x, pos.y),
                    unit.y + Angles.trnsy(r,pos.x, pos.y),
                    j*padrotfront + r
                );


                //main movement
                for(let i = 0; i < paddlenum; i++){
                    let pos = new Vec2(
                        j*paddlex,
                        spacing*i - paddlestart + paddlemove[k]
                    )
                    // a.paddle, unit.paddle will not work
                    //the ones on the end flickers for some reason
                    Draw.rect(a.paddle,
                        unit.x + Angles.trnsx(r,pos.x, pos.y),
                        unit.y + Angles.trnsy(r,pos.x, pos.y),
                        r
                    )
                }
            }
            
        },
        //change name/title
        localized(){
            return "smart secondary batteries";
        }
    });
    return ta;
}

//adds this to all units of 'a' so no easy way out.
a.abilities.add(getAbility());

refresh(a);
