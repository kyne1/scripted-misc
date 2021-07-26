//declare all files needed under each script folder

const units = [
  "ares",
  "gausstank",
  "grouper",
  "warper",
  "swarm",
  "/ai/ares-ai",
];

const abilities = [
  "shootAbility",
  "customUnitSpawn",
  "commandShield",
];

const blocks = [
  "shotgunblock",
  "GOLcontroller",
  "simBlock",
  "minigun",
];

const bullets = [
  "armorpiercing",
  "sapbomb",
];

const libs = [
  "poolhealth",
  "refresh",
  "status",
  "drawBarrelMinigun",
  "factoryPush"
]



units.forEach(i => {
  require("units/"+i);
});

abilities.forEach(i => {
  require("abilities/"+i);
});

blocks.forEach(i => {
  require("blocks/"+i);
});

bullets.forEach(i => {
  require("bullets/"+i);
});

libs.forEach(i => {
  require("libs/"+i);
});

require('fx/fixedtrail');
require('dir');

//require('effects.js');
//require('wcompchange');
