module.exports = new Effect(10, e => {
  for(let i = 0; i < 2; i++){
      color(i == 0 ? Pal.bulletYellowBack : Pal.bulletYellow);

       m = i == 0 ? 1 : 0.5;

       rot = e.rotation + 180;
       w = 15 * e.fout() * m;
      Drawf.tri(e.x, e.y, w, (30 + Mathf.randomSeedRange(e.id, 15)) * m, rot);
      Drawf.tri(e.x, e.y, w, 10 * m, rot + 180);
  }
});