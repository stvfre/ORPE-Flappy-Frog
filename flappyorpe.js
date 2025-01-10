let board, bufferCanvas, bufferContext;
let boardWidth = 360;
let boardHeight = 700;
let context;
let orpeImg;
let startInterface;
let startInterfaceWidth = boardWidth;
let startInterfaceHeight = boardHeight;
let startButton; 
let resetButton;
let gameOver = false;
let gameOverImg;
let score = 0;
let wingSound = new Audio("./sfx_wing.wav");
let hitSound = new Audio("./sfx_hit.wav");
let pointSound = new Audio("./sfx_point.wav")
let bgm = new Audio("./orpe-anthem.mp3");
bgm.loop = true;
//physics
let velocityX = -2; //pipes moving left speed
let velocityY = 0; // Velocidad vertical de Orpe
let gravity = 0.6; // La gravedad que hace que Orpe caiga
let jumpStrength = -10; // Fuerza del s alto

let orpeWidth = 70;
let orpeHeight = 70;
let orpeX = boardWidth / 8;
let orpeY = boardHeight / 2;

let orpe = {
    x : orpeX,
    y : orpeY,
    width : orpeWidth,
    height : orpeHeight,
}

let pipeArray = [];
let pipeInterval;
let pipeWidth = 66; // 1/6 658 x 3981
let pipeHeight = 398 + boardHeight - 640; // 1/6 658 x 3981
let pipeX = boardWidth;
let pipeY = 0;
let topPipeImg;
let bottomPipeImg;

function isGameStarted() {
    return startInterface.style.display === "none";
}

function updateButtons() {
    if (gameOver) {
        startButton.style.display = "none"; // Oculta el botón de Start
        resetButton.style.display = "block"; // Muestra el botón de Reset
    } else {
        startButton.style.display = "block"; // Muestra el botón de Start
        resetButton.style.display = "none"; // Oculta el botón de Reset
    }
}

//Main function

window.onload = function () {
    startInterface = document.getElementById("start-interface"); // Pantalla inicial

    startButton = document.getElementById("start-btn");    
    resetButton = document.getElementById("reset-btn");    

    // Configurar dimensiones de la pantalla inicial
    startInterface.style.height = `${boardHeight}px`;
    startInterface.style.width = `${boardWidth}px`;

    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");
    context.imageSmoothingEnabled = false;

    // Doble búfer
    bufferCanvas = document.createElement("canvas");
    bufferCanvas.width = boardWidth;
    bufferCanvas.height = boardHeight;
    bufferContext = bufferCanvas.getContext("2d");
    bufferContext.imageSmoothingEnabled = false;

    // Cargar imagen de Orpe
    orpeImg = new Image();
    orpeImg.src = "./orpe-png.png";

    topPipeImg = new Image();
    topPipeImg.src = "./top-candle.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottom-candle.png";

    gameOverImg = new Image();
    gameOverImg.src = "./game-over.png";

    // Configurar evento del botón Start
    startButton.addEventListener("click", function () {
        startInterface.style.display = "none";
        startGame();
    });


    resetButton.addEventListener("click", function () {
        startInterface.style.display = "none";
        resetGame();
    });


    // Detectar teclas y clics para controlar Orpe
    window.addEventListener("keydown", function (e) {
        if (isGameStarted() && (e.code === "Space" || e.code === "ArrowUp")) {
            jump();
        }
    });

    window.addEventListener("mousedown", function (e) {
        if (isGameStarted() && e.button === 0) {
            jump();
        }
    });

    window.addEventListener("touchstart", function () {
        if (isGameStarted()) {
            jump();
        }
    });

    const buttons = document.querySelectorAll("button");

    buttons.forEach(button => {
        button.addEventListener("mouseenter", () => {
            pointSound.currentTime = 0.1; // Reinicia el sonido
            pointSound.play();         // Reproduce el sonido
        });
    });
    updateButtons();
};


function startGame() {
    orpe.y = orpeY;
    velocityY = 0;
    pipeArray = [];
    score = 0;
    gameOver = false;
    requestAnimationFrame(update);
    clearInterval(pipeInterval);
    pipeInterval = setInterval(placePipes, 1500);

    board.style.animation = "none"; // Detenemos cualquier animación existente
    void board.offsetWidth; // Forzamos el reflow
    board.style.animation = "moveBackgroundFromZero 60s linear infinite"; // Aplicamos la nueva animación


    if(bgm.paused) {
        bgm.play();
    };

    updateButtons();
}

function resetGame() {
    startGame();
}

//Animación update

function update() {
    if (gameOver) {
        return;
    }

    requestAnimationFrame(update);

    // Lógica de actualización
    bufferContext.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);
    velocityY += gravity;
    orpe.y += velocityY;
    orpe.y = Math.max(orpe.y, 0 - orpeHeight);
    bufferContext.drawImage(orpeImg, orpe.x, orpe.y, orpe.width, orpe.height);

    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        bufferContext.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && (orpe.x + orpe.width / 4) > (pipe.x + pipe.width / 3)) {
            score += 0.5;
            pipe.passed = true;
            pointSound.play();
        }

        if (pixelPerfectCollision(orpe, pipe) || (orpe.y + orpe.height >= boardHeight + orpeHeight)) {
            hitSound.play();
            GameOver(); // Llama a la función de game over
            return; // Salimos del update para evitar más lógica innecesaria
        }
    }

    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    bufferContext.fillStyle = "orange";
    bufferContext.font = "700 45px Nunito";
    bufferContext.fillText(Math.floor(score), 5, 45);

    context.clearRect(0, 0, boardWidth, boardHeight);
    context.drawImage(bufferCanvas, 0, 0);
}

function GameOver() {
    gameOver = true;

    // Detener la animación

    // Pausar música y reiniciar
    bgm.pause();
    bgm.currentTime = 0;

    // Mostrar imagen de Game Over
    context.clearRect(0, 0, boardWidth, boardHeight);
    let scaledWidth = gameOverImg.width / 2;
    let scaledHeight = gameOverImg.height / 2;
    context.drawImage(gameOverImg, boardWidth / 12, boardHeight / 2.8, scaledWidth, scaledHeight);

    // Mostrar la interfaz de inicio después de un retraso
    setTimeout(function() {
        startInterface.style.display = "block";
        context.clearRect(0, 0, boardWidth, boardHeight);
    }, 2000);
}


// colocar obstáculos

function placePipes() {
    if(gameOver) {
        return;
    }

    let randomPipeY = pipeY - pipeHeight/4 - Math.random()*(pipeHeight/2);
    let openingSpace = board.height/4;

    let topPipe = {
        img : topPipeImg,
        x : pipeX,
        y : randomPipeY,
        width : pipeWidth,
        height : pipeHeight,
        passed : false,
    }

    let bottomPipe = {
        img : bottomPipeImg,
        x : pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width : pipeWidth,
        height : pipeHeight,
        passed : false,
    }
    pipeArray.push(topPipe, bottomPipe);
}

// Colisión de píxeles perfecta basada en la transparencia
function pixelPerfectCollision(orpe, pipe) {
    // Define el área de intersección entre Orpe y la pipe
    let intersectionX = Math.max(orpe.x, pipe.x);
    let intersectionY = Math.max(orpe.y, pipe.y);
    let intersectionWidth = Math.min(orpe.x + orpe.width, pipe.x + pipe.width) - intersectionX;
    let intersectionHeight = Math.min(orpe.y + orpe.height, pipe.y + pipe.height) - intersectionY;

    // Si no hay intersección, no hay colisión
    if (intersectionWidth <= 0 || intersectionHeight <= 0) {
        return false;
    }

    // Crea canvas temporales para obtener los datos de píxeles de Orpe y la pipe
    let tempCanvas = document.createElement("canvas");
    let tempContext = tempCanvas.getContext("2d");

    tempCanvas.width = intersectionWidth;
    tempCanvas.height = intersectionHeight;

    // Dibuja la sección de intersección de Orpe
    tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempContext.drawImage(orpeImg, orpe.x - intersectionX, orpe.y - intersectionY, orpe.width, orpe.height);
    let orpeData = tempContext.getImageData(0, 0, intersectionWidth, intersectionHeight).data;

    // Dibuja la sección de intersección de la pipe
    tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempContext.drawImage(pipe.img, pipe.x - intersectionX, pipe.y - intersectionY, pipe.width, pipe.height);
    let pipeData = tempContext.getImageData(0, 0, intersectionWidth, intersectionHeight).data;

    // Recorre los píxeles para detectar colisiones
    for (let i = 0; i < orpeData.length; i += 4) {
        // Si ambos píxeles no son transparentes, hay colisión
        if (orpeData[i + 3] !== 0 && pipeData[i + 3] !== 0) {
            return true;
        }
    }

    // Si no se encontró colisión
    return false;
}

// Función de salto
function jump() {
    //Repetir el sonido de aleteo
    if (!wingSound.paused) {
        wingSound.currentTime = 0;
        wingSound.play();
    } else {
        wingSound.play();
    }

    // Aplicar la fuerza de salto sin restricción de saltos consecutivos
    velocityY = jumpStrength;  // Impulsar a Orpe hacia arriba
}