const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Game State
let p1 = {
    resources: 100,
    baseHealth: 100,
    cursor: null,
    towers: null,
    units: null,
    scoreText: null,
    color: 0x3366ff // Blue (Dog)
};

let p2 = {
    resources: 100,
    baseHealth: 100,
    cursor: null,
    towers: null,
    units: null,
    scoreText: null,
    color: 0xff3333 // Red (Cat)
};

let lastResourceTick = 0;

function preload() {
    // Carregando as imagens geradas por IA 
    this.load.image('bg', 'assets/bg.jpg');
    this.load.image('dog', 'assets/dog.jpg');
    this.load.image('cat', 'assets/cat.jpg');
}

function create() {
    // Fundo
    this.add.image(400, 300, 'bg').setDisplaySize(800, 600);
    
    // Linha divisória
    let graphics = this.add.graphics();
    graphics.lineStyle(4, 0xffffff, 1);
    graphics.beginPath();
    graphics.moveTo(400, 0);
    graphics.lineTo(400, 600);
    graphics.strokePath();

    // UI Texts
    p1.scoreText = this.add.text(20, 20, 'Cachorro (P1)\nVida: 100\nOssos: 100', { fontSize: '20px', fill: '#fff', backgroundColor: '#000' });
    p2.scoreText = this.add.text(600, 20, 'Gato (P2)\nVida: 100\nPeixes: 100', { fontSize: '20px', fill: '#fff', backgroundColor: '#000' });

    // Bases (Visual apenas)
    this.add.rectangle(40, 300, 80, 200, 0x0000ff).setAlpha(0.5); // Base P1
    this.add.rectangle(760, 300, 80, 200, 0xff0000).setAlpha(0.5); // Base P2

    // Grupos de física
    p1.towers = this.physics.add.staticGroup();
    p2.towers = this.physics.add.staticGroup();
    p1.units = this.physics.add.group();
    p2.units = this.physics.add.group();

    // Cursores P1 (WASD e Space)
    p1.keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        action: Phaser.Input.Keyboard.KeyCodes.SPACE,
        spawn: Phaser.Input.Keyboard.KeyCodes.ONE
    });
    
    // Cursores P2 (Setas e Enter)
    p2.keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.UP,
        down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        action: Phaser.Input.Keyboard.KeyCodes.ENTER,
        spawn: Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE,
        spawn_alt: Phaser.Input.Keyboard.KeyCodes.ZERO // Alternativa caso no tenha numpad
    });

    p1.cursor = this.add.rectangle(200, 300, 40, 40, p1.color).setAlpha(0.7);
    p1.cursor.setStrokeStyle(4, 0xffffff);
    
    p2.cursor = this.add.rectangle(600, 300, 40, 40, p2.color).setAlpha(0.7);
    p2.cursor.setStrokeStyle(4, 0xffffff);

    // Dicas de comandos
    this.add.text(20, 550, 'WASD move\nSPACE: Torre(50)\n1: Tropas(30)', { fontSize: '14px', fill: '#fff', backgroundColor: '#000' });
    this.add.text(600, 550, 'SETAS move\nENTER: Torre(50)\nNUM1/0: Tropas(30)', { fontSize: '14px', fill: '#fff', backgroundColor: '#000' });

    // Colisões (Tropa bate na torre inimiga)
    this.physics.add.overlap(p1.units, p2.towers, unitHitTower, null, this);
    this.physics.add.overlap(p2.units, p1.towers, unitHitTower, null, this);
}

function update(time, delta) {
    if (p1.baseHealth <= 0 || p2.baseHealth <= 0) return; // Fim de jogo

    // Geração de recursos passiva
    if (time > lastResourceTick) {
        p1.resources += 5;
        p2.resources += 5;
        lastResourceTick = time + 2000;
        updateUI();
    }

    // Movimentação Cursor P1
    if (Phaser.Input.Keyboard.JustDown(p1.keys.left)) p1.cursor.x -= 40;
    if (Phaser.Input.Keyboard.JustDown(p1.keys.right)) p1.cursor.x += 40;
    if (Phaser.Input.Keyboard.JustDown(p1.keys.up)) p1.cursor.y -= 40;
    if (Phaser.Input.Keyboard.JustDown(p1.keys.down)) p1.cursor.y += 40;
    
    // Limitações P1 (metade esquerda)
    p1.cursor.x = Phaser.Math.Clamp(p1.cursor.x, 100, 380);
    p1.cursor.y = Phaser.Math.Clamp(p1.cursor.y, 100, 500);

    // Movimentação Cursor P2
    if (Phaser.Input.Keyboard.JustDown(p2.keys.left)) p2.cursor.x -= 40;
    if (Phaser.Input.Keyboard.JustDown(p2.keys.right)) p2.cursor.x += 40;
    if (Phaser.Input.Keyboard.JustDown(p2.keys.up)) p2.cursor.y -= 40;
    if (Phaser.Input.Keyboard.JustDown(p2.keys.down)) p2.cursor.y += 40;
    
    // Limitações P2 (metade direita)
    p2.cursor.x = Phaser.Math.Clamp(p2.cursor.x, 420, 700);
    p2.cursor.y = Phaser.Math.Clamp(p2.cursor.y, 100, 500);

    // Ações P1
    if (Phaser.Input.Keyboard.JustDown(p1.keys.action) && p1.resources >= 50) {
        p1.resources -= 50;
        buildTower(p1, p1.cursor.x, p1.cursor.y, this);
        updateUI();
    }
    if (Phaser.Input.Keyboard.JustDown(p1.keys.spawn) && p1.resources >= 30) {
        p1.resources -= 30;
        spawnUnit(p1, 'dog', 80, Phaser.Math.Between(100, 500), 80);
        updateUI();
    }

    // Ações P2
    if (Phaser.Input.Keyboard.JustDown(p2.keys.action) && p2.resources >= 50) {
        p2.resources -= 50;
        buildTower(p2, p2.cursor.x, p2.cursor.y, this);
        updateUI();
    }
    if ((Phaser.Input.Keyboard.JustDown(p2.keys.spawn) || Phaser.Input.Keyboard.JustDown(p2.keys.spawn_alt)) && p2.resources >= 30) {
        p2.resources -= 30;
        spawnUnit(p2, 'cat', 720, Phaser.Math.Between(100, 500), -80);
        updateUI();
    }

    // Verificar se unidades chegaram na base
    p1.units.getChildren().forEach(unit => {
        if (unit.x > 750) {
            p2.baseHealth -= 10;
            unit.destroy();
            updateUI();
            checkWin(this);
        }
    });

    p2.units.getChildren().forEach(unit => {
        if (unit.x < 50) {
            p1.baseHealth -= 10;
            unit.destroy();
            updateUI();
            checkWin(this);
        }
    });
}

function updateUI() {
    p1.scoreText.setText(`Cachorro (P1)\nVida: ${p1.baseHealth}\nOssos: ${p1.resources}`);
    p2.scoreText.setText(`Gato (P2)\nVida: ${p2.baseHealth}\nPeixes: ${p2.resources}`);
}

function checkWin(scene) {
    if (p1.baseHealth <= 0) {
        let winText = scene.add.text(400, 300, 'GATO VENCEU!', { fontSize: '64px', fill: '#f00', backgroundColor: '#000', padding: 10 }).setOrigin(0.5);
        scene.physics.pause();
    } else if (p2.baseHealth <= 0) {
        let winText = scene.add.text(400, 300, 'CACHORRO VENCEU!', { fontSize: '64px', fill: '#00f', backgroundColor: '#000', padding: 10 }).setOrigin(0.5);
        scene.physics.pause();
    }
}

function buildTower(player, x, y, scene) {
    // Para simplificar, a torre é apenas um bloco com física estática no grid
    let tower = scene.add.rectangle(x, y, 40, 40, player.color);
    tower.setStrokeStyle(2, 0xffffff);
    scene.physics.add.existing(tower, true); // true = isStatic
    player.towers.add(tower);
}

function spawnUnit(player, texture, x, y, velocityX) {
    let unit = player.units.create(x, y, texture);
    unit.setDisplaySize(40, 40); // Ajustar tamanho da imagem gerada por IA
    unit.setVelocityX(velocityX);
    unit.health = 3;
}

function unitHitTower(unit, tower) {
    // A torre "bloqueia" a unidade e causa dano contínuo até destruir
    unit.health -= 0.1;
    unit.x -= Math.sign(unit.body.velocity.x) * 2; // Rebate um pouco
    
    // Piscar em vermelho
    unit.setTint(0xff0000);
    unit.scene.time.delayedCall(100, () => {
        if(unit.active) unit.clearTint();
    });

    if (unit.health <= 0) {
        // Ao destruir uma unidade inimiga, recompensa o defensor
        let isP1Unit = (unit.texture.key === 'dog');
        if (isP1Unit) {
            p2.resources += 15; // P2 ganha recursos por derrotar tropa P1
        } else {
            p1.resources += 15; 
        }
        unit.destroy();
        updateUI();
    }
}
