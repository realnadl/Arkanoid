//fs (file system) võimaldab faile lugeda ja kirjutada.
const fs = require("node:fs");
 
//vm (virtual machine) võimaldab JavaScripti koodi käivitada eraldi kontekstis.
//kontekst on oma muutujage
const vm = require("node:vm");
 
let passed = 0;
let failed = 0;
//siin loeb fs.readFileSync() game.js sisu tekstina. utf8 määrab teksti kodeeringu.
const source = fs.readFileSync(`${__dirname}/game.js`, "utf-8");
 
//Võrdleme tegelikku ja oodatud väärtust. Erinevuse korral katkestame testi ja väljastame vea.
function equal(actual, expected) {
  if (actual !== expected) {
    throw new Error(`Oodatud ${expected}, saadud ${actual}`);
  }
}
 
function test(name, check) {
    try {
        const window = {
            addEventListener() {}
                };
        const {game, KEYS} = vm.runInNewContext(source + "\n({game, KEYS});",{window});        
        check(game, KEYS);
        passed++;
        console.log(`OK ${name}`);
}   catch (error) {
        failed++;
        process.exitCode = 1;
        console.error(`VIGA ${name}: ${error.message}`);
    }
    console.log(`Läbitud: ${passed}, ebaõnnestunud: ${failed}`);
}    

//1. create() loob aktiivsed plokki
test ("Plookide loomine", game => {
    game.create();
    equal(game.blocks.length, 32);
    equal(game.blocks.every(block => block.active === true), true);
    equal(game.blocks[0].x, 65);
    equal(game.blocks[0].y, 35);
    equal(game.blocks[31].x, 513);
    equal(game.blocks[31].y, 107);

});

//2. Uhe punkti lisamine ei lõpeta mängu kui plokke on veel alles.
test("Punkti lisamine", game => {
    game.create();
    let endings = 0;
    game.end = () => { endings++; };
    game.addScore();
    equal(game.score, 1);
    equal(endings, 0);

});

//3. viimane punkt kutsub mangu lopetamise valja uhe korra
test("Pobed", game => {
game.create();
game.score = 31;
let endings = 0
game.end = () => { endings++; };
game.addScore();
equal(game.score, 32);
equal(endings, 1);
});

//4. Pall liigub mõlemas suunas vastavalt dx ja dy väärtustele.
test("Palli liikumine", game => {
    game.ball.dx = 2;
    game.ball.dy = -3;
    game.ball.move();
    equal(game.ball.x, 322);
    equal(game.ball.y, 277);
});

//5. Nullkiirusega pall jääb paigale.
test("Paigal olev pall", game => {
    game.ball.move();
    equal(game.ball.x, 320);
    equal(game.ball.y, 280);
});

//ET: 6. plokid põrkuvad.
test("Kokkupõrge", game => {
    const block = { x: 330, y:290, width: 60, height: 20 };
    equal(game.ball.collide(block), true);
});

//7. Uksteist kaugel olevad plokid ei põrgu 
test("Kokkupõrget pole", game => {
    const block = { x:10, y: 10, width: 60, height: 20 };
    equal(game.ball.collide(block), false); 
});

// 8. Ainult servade puudutamine ei ole veel kattumine.
test("Servade ouudutus", game => {
    const block = { x:340, y: 28, width: 60, height: 20 };
    equal(game.ball.collide(block), false);
});

//9. Kokkupõrke kontroll arvestab palli järgmist asukoht.
test("Jargmine asukoht", game => {
    const block = { x:340, y: 28, width: 60, height: 20 };
    game.ball.dx = 3;
    equal(game.ball.collide(block), false);
});

10. Plokilt põrkamine muudab vertikaalset suunda ja eemaldab ploki mängust.
test("Plokilt porkamine", game => {

});