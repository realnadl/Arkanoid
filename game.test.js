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

//10. Plokilt põrkamine muudab vertikaalset suunda ja eemaldab ploki mängust.
test("Plokilt porkamine", game => {
    const block = { active: true};
    game.ball.dy = -3;
    game.ball.bumpBlock(block);
    equal(game.ball.dy, 3);
    equal(block.active, false);

});

//11. Vasak- ja paremnoole klahv määravad platvorimi liikumissuuna.
test("Platvormi suund", (game, KEYS) => {
    game.platform.start(KEYS.LEFT);
    equal(game.platform.dx, -6);
    game.platform.start(KEYS.RIGHT);
    equal(game.platform.dx, 6);
});

//12 peatab platvormi.
test("Platvormi peatamine ", game => {
    game.platform.dx = 6;
    game.platform.stop();
    equal(game.platform.dx, 0);
});

//13. Enne laskmist liigub pall koos platvormiga.
test("Pall platvormil", game => {
    game.platform.dx = 6;
    game.platform.move();
    equal(game.platform.x, 286);
    equal(game.ball.x, 326);
});

//14 parast palli vabastamist ei liiguta platvorm enam palli.
test("Vaba pall", game => {
    game.platform.ball = null;
    game.platform.dx = -6;
    game.platform.move();
    equal(game.platform.x, 274);
    equal(game.ball.x, 320);
});

//15 fire() kaivitab palli ainult esimesel vajutusel.
test("Uhekordne lask", game => {
    let starts = 0;
    game.ball.start = () => { starts++; };
    game.platform.fire();
    game.platform.fire();
    equal(starts, 1);
    equal(game.platform.ball, null);
});

//16  asendame juhuarvu kindla vaartusega et palli start oleks korratav
test("Palli start", game => {
    game.random = (min, max) => {
        equal(min, -3);
        equal(max, 3);
        return 2;
    };
    game.ball.start();
    equal(game.ball.dy, -3);
    equal(game.ball.dx, 2);
});

//17 Puutepunkti nihe on vasakul -1, keskel 0 ja paremal 1.
test("puutepunkt", game => {
    equal(game.platform.getTouchOffset(280), -1);
    equal(game.platform.getTouchOffset(330), 0);
    equal(game.platform.getTouchOffset(380), 1);
});

//18 vasaka piiri uletamine peatab platvormi. 
test("Platvormi vasak piir", game => {
    game.platform.x = 0;
    game.platform.dx = -6;
    game.platform.collideWorldBounds();
    equal(game.platform.dx, 0); 
});

//19 parema piiri uletamine peatab platvorimi 
test("Platvormi parem piir", game => {
    game.platform.x = 540;
    game.platform.dx = 6;
    game.platform.collideWorldBounds();
    equal(game.platform.dx, 0);
});

//20 Alla liikuv pall porkav platvormi keskelt otse ules
test("Platvormilt poramine", game => {
    game.ball.dy = 3; 
    game.ball.dx = 2; 
    game.ball.bumpPlatform(game.platform);
    equal(game.ball.dy, -3);
    equal(game.ball.dx, 0);
});

//21 Vasak sein suunab palli paremale ja mangib heli uhe korra.
test("Palli vasak piir", game => {
    let sounds = 0;
    game.sounds.bump = { play() { sounds++; } };
    game.ball.x = 1;
    game.ball.dx = -3;
    game.ball.collideWorldBounds();
    equal(game.ball.x, 0);
    equal(game.ball.dx, 3);
    equal(sounds, 1);

});

//22 parem sein suunab palli vasakule.
test("Palli parem piir", game => {
    game.sounds.bump = { play() {} };
    game.ball.x = 620;
    game.ball.dx = 3;
    game.ball.collideWorldBounds();
    equal(game.ball.x, 620);
    equal(game.ball.dx, -3);

});

//23 ulemine sein suunab palli alla
test("Palli ulemine piir", game => {
    game.sounds.bump = { play() {} };
    game.ball.y = 1;
    game.ball.dy = -3;
    game.ball.collideWorldBounds();
    equal(game.ball.y, 0);
    equal(game.ball.dy, 3);
});

//24 Alumisest piirist valjumine lopetab mangu.
test("Kaotus", game => {
    let endings = 0;
    game.end = () => { endings++; };
    game.ball.y = 340;
    game.ball.dy = 3;
    game.ball.collideWorldBounds();
    equal(endings, 1);
});

//25 aktiivse ploki tabamine annab punkti ja heli; sama plokk teist punkti ei anna.
test("Ploki tabamine", game => {
    const block = { x: 330, y: 290, width: 60, height: 20, active: true };
    game.blocks = [block, { x: 10, y: 10, width: 60, height: 20, active: true }];
    game.ball.dy = 3;
    let sounds = 0;
    game.sounds.bump = { play() { sounds++; } };
    game.collideBlocks();
    game.collideBlocks();
    equal(block.active, false);
    equal(game.blocks[1].active, true);
    equal(game.score, 1);
    equal(game.ball.dy, -3);
    equal(sounds, 1);
});
