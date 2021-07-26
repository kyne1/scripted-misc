module.exports = function factoryAdd(factory,unit,time){
    let fac;
    let arr = new Array();

    if(factory == "air") fac = Blocks.airFactory;
    else if (factory == "ground") fac = Blocks.groundFactory;
    else if (factory == "naval") fac = Blocks.navalFactory;

    for(let i = 0; i < fac.plans.size; i++){
        arr[i] = fac.plans.get(i);
      }
    arr.push(UnitFactory.UnitPlan(unit, 60 * time, ItemStack.with()));
    fac.plans = Seq.with(arr);
}
