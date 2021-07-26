var sim = require('blocks/simBlock');
var blockList = sim.list;
var simBlock = sim.block;

//global variables for simulation
var updateSpeed = 0;
var paused = true;
var timer = 0;


const controller = extend(Wall, "controller", {
    load(){
        this.super$load()
        this.region = Core.atlas.find("ares-controller");
    },
    icons(){
        this.super$icons();
        return [
          this.region
        ];
    },
    buildCostMultipler: 1.0,
    replaceable: false,
    size: 1,
    update: true,
    localizedName: "GOL controller",
    description: "controls the GOL blocks' timing.",
    destructible: true,
    configurable: true,
});

//build cost
controller.setupRequirements(Category.logic, ItemStack.with(
    Items.silicon, 53,
    Items.titanium, 25,
    Items.copper, 110,
    Items.lead, 75
));

controller.buildType = ent => {
    //variable go here
    var pauseIcon = Icon.pause;
    ent = extend(Wall.WallBuild, controller, {
        init(tile,  team,  shouldAdd,  rotation){
            return this.super$init(tile,  team,  shouldAdd,  rotation);
        },
        //UI that shows when clicked
        buildConfiguration(table){
            if(paused){
                this.pauseIcon = Icon.play;
            }
            else this.pauseIcon = Icon.pause;
            //pause
            table.button(this.pauseIcon, Styles.clearTransi, () => {
                paused = !paused;
                //force an update to update appearnce of pauseIcon
                table.clearChildren();
                this.buildConfiguration(table);
            }).size(40);

            //do 1 blocks update
            table.button(Icon.refresh, Styles.clearTransi, ()=>{
                paused = true;
                simUpdate();
                table.clearChildren();
                this.buildConfiguration(table);
            }).size(40);

            //clear all blocks button
            table.button(Icon.cancel, Styles.clearTransi, () => {
                blockList.forEach(function(value,key,map){
                    value.tile.remove();
                });
                blockList.clear();
            }).size(40);

            //slider copy and translated from sharustry varlogic
            let slide = new Slider(0.1, 1, 0.01, false);
            slide.setValue(updateSpeed);
            slide.moved(i => updateSpeed = i);
            table.add(slide).width(controller.size * 3 - 20).padTop(4);
        },
        update(){
            this.super$update();
            //print(blockList.length);
        },
    });
    return ent;
}

//lets the gol blocks update run independent of controller's update. reduce impact on fps and allows larger GOL simulations
Events.run(Trigger.update, () => {
    //print("h");
    if(!paused){
        timer += updateSpeed*Time.delta;
        if(timer > 5){
            timer = 0;
            simUpdate();
        }
    }
});

//update simBlocks
function simUpdate(){
    //array of indices of blocklist to be removed
    let killList = Array();

    //empty blocks nearby all GOL block, can be used as shortcut to check where to spawn.
    let emptyMap = new Map();
    blockList.forEach(function(value,key,map){
        let c = 0; //counting
        let s = key.split(',');
        let x = parseInt(s[0]);
        let y = parseInt(s[1]);
        for(let j = 0; j < 8; j++){
            let x1 = x + rot8x(j);
            let y1 = y + rot8y(j);
            let a = x1+","+y1;
            //print(a);
            if(blockList.has(a)){
                //print("debug");
                c++;
            }
            //cache neighbors to temp map
            if(!emptyMap.has(a)){
                emptyMap.set(a,Vars.world.tile(x1,y1).block()==Blocks.air);
            }
            //print(Vars.world.tile(x, y).block());
        }
        //add self to temp map
        let a = coordString(x,y);
        if(!emptyMap.has(a)){
            emptyMap.set(a,false);
        }
        if(c < 2 || c > 3){
            killList.push(x+","+y);
        }
    });

    //read empty spaces around GOL blocks for spawning blocks
    emptyMap.forEach(function(value, key, map){
        let s = key.split(',');
        let x = parseInt(s[0]);
        let y = parseInt(s[1]);
        if(value){
            let c = 0;
            //scan all 8 neighbors of a position
            for(let i = 0; i < 8; i++){
                let x1 = x+rot8x(i);
                let y1 = y+rot8y(i);
                let a = x1+","+y1;
                if(map.has(a) && !map.get(a)){
                    c++
                };
            }
            //create block if is empty and 3 simblock nearby
            if(c == 3) Vars.world.tile(x, y).setBlock(simBlock, Team.sharded);
        }
    });
    //remove blocks last to first
    for(let i = killList.length - 1; i >= 0; i--){
        blockList.get(killList[i]).tile.remove();
        blockList.delete(killList[i]);
    }
}

//@param 0 to 7, start at top with 0 and go cw which ends with 7
//@return array [x,y]
function rot8x(i){
    let x;
    if(i%4 == 0)x = 0;
    else if(i < 4)x = 1;  
    else x = -1;
    return x;
}
function rot8y(i){
    let y;
    if((i+2)%4 == 0) y = 0;
    else if(i > 2 && i < 6) y = -1;
    else y = 1;
    return y;
}

//shortcut to create a string
function coordString(x,y){
    return x+","+y;
}