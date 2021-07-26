const pool = require("libs/poolhealth");
//when pooled health
const cmdstatus = extend(StatusEffect, "cmdStatus", {
    isHidden(){
        return true;
    },
    update(unit,time){
        this.super$update(unit,time);
        if( !(unit.controller instanceof FormationAI || unit.isCommanding()) ){
            unit.unapply(this);
        }
        //print(unit.lasth);
    },
    permanent: true,
    healthMultiplier: 100,
    color: Color.cyan,
});


module.exports = {
    cmd: cmdstatus,
}