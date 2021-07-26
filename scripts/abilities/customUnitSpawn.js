//@param st means spawntime
module.exports = function unitSpawn(type,spawnX,spawnY,st){
  var spawn = extend(UnitSpawnAbility,{
    load(){this.super$load();},
    update(unit){
      //annoying shared variable divide by all members of the unitType
      this.timer += Time.delta/unit.team.data().countType(unit.type);
      if(this.timer >= st && Units.canCreate(unit.team, this.unit)){
          var x = unit.x + Angles.trnsx(unit.rotation, spawnY, spawnX), y = unit.y + Angles.trnsy(unit.rotation, spawnY, spawnX);
          this.spawnEffect.at(x, y);
          var u = this.unit.create(unit.team);
          u.set(x, y);
          u.rotation = unit.rotation;
          if(!Vars.net.client()){
              u.add();
          }

          this.timer = 0;
      }
    },
    //@override
    draw(unit){
      //super.draw(unit);
      //this.super$draw(unit);
      Draw.draw(Draw.z(), () => {
          var x = unit.x + Angles.trnsx(unit.rotation, spawnY, spawnX), y = unit.y + Angles.trnsy(unit.rotation, spawnY, spawnX);

          Drawf.construct(x, y, this.unit.icon(Cicon.full), unit.rotation - 90, Math.min(1, this.timer/st), 1, this.timer);
      });
    },
    unit: type
  });
  return spawn;
};