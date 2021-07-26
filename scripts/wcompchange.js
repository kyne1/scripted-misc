//useless


//weaponscomp
const wcomp = cons(()=> {
  var w = new JavaAdapter(WeaponsComp, {
    aim(x,y){
      //super();
      for(mount in this.mounts){
        mount.aimX = 1;
        mount.aimY = 1;
      }
    }
  });
  return w;
});