
module.exports = function make(radius,regen,max,cooldown){
    let ability = new JavaAdapter(ForceFieldAbility,{
        load(){
            this.super$load();
        },
        update(unit){
            if(unit.isCommanding()){
                unit.controlling.forEach(u => {
                    this.super$update(u);
                });
            }
        },
        draw(unit){
            if(unit.isCommanding()){
                unit.controlling.forEach(u => {
                    this.super$draw(u);
                    //if(u.type != unit.type) print("not unit");
                });
            }
        },
        localized(){
            return "Command-Shield";
        }
    }
    ,radius,regen,max,cooldown
    );
    return ability;
}