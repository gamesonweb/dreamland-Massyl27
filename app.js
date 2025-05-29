// Pas d'import ES6 car on utilise le CDN

// Récupérer les éléments HTML
const canvas = document.getElementById("renderCanvas");
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const timerDisplay = document.getElementById("timer");
const scoreDisplay = document.getElementById("score");
const highestScoreDisplay = document.getElementById("highestScore");
const scoreScreen = document.getElementById("scoreScreen");
const scoreText = document.getElementById("scoreText");
const continueButton = document.getElementById("continueButton");

// Variables globales
let engine, scene, avatar;
let stillAnim, runForwardAnim, runBackwardAnim, rightAnim, leftAnim;
const speed = 0.2;
let moveForward = false;
let moveBackward = false;
let moveRight = false;
let moveLeft = false;
let gameRunning = false;
let timeLeft = 30;
let timerInterval;
let score = 0;
let dreams = [];
let hasMoved = false;
let highestScore = 0;

const dreamTypes = [
  { name: "rouge", model: "SphereRouge.glb", points: 1, count: 17 },
  { name: "bleue", model: "SphereBleu.glb", points: 2, count: 14 },
  { name: "jaune", model: "SphereJaune.glb", points: 3, count: 11 },
  { name: "verte", model: "SphereVerte.glb", bonusTime: 3, count: 15 },
  { name: "noir", model: "SphereNoir.glb", points: -5, count: 5 },
];
let currentUser = null;
const netlifyIdentity = window.netlifyIdentity;

// Initialiser Netlify Identity
if (netlifyIdentity) {
  netlifyIdentity.on("init", (user) => (currentUser = user));
  netlifyIdentity.on("login", (user) => {
    currentUser = user;
    loadUserBestScore();
  });
  netlifyIdentity.on("logout", () => (currentUser = null));
}

// Nouvelle fonction pour sauvegarder le score
async function saveScore(score) {
  if (!currentUser) return;

  try {
    const response = await fetch("/.netlify/functions/save-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser.id,
        score: score,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Erreur sauvegarde score:", error);
  }
}
// Démarrage du jeu
function startGame() {
  clearInterval(timerInterval);
  timerInterval = null;
  hasMoved = false;

  startScreen.style.display = "none";
  canvas.style.display = "block";
  timerDisplay.style.display = "block";
  scoreDisplay.style.display = "block";
  highestScoreDisplay.style.display = "block";

  timeLeft = 30;
  score = 0;
  hasMoved = false;
  timerDisplay.textContent = `Temps restant : ${timeLeft}s`;
  scoreDisplay.textContent = `Score : ${score}`;
  highestScoreDisplay.textContent = `Meilleur Score : ${highestScore}`;
  gameRunning = true;

  engine = new BABYLON.Engine(canvas, true);
  scene = new BABYLON.Scene(engine);
  scene.collisionsEnabled = true;

  const camera = new BABYLON.ArcRotateCamera(
    "Camera",
    Math.PI / 2,
    Math.PI / 2.5,
    20,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.attachControl(canvas, true);
  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(1, 1, 0),
    scene
  );
  light.intensity = 0.7;

  BABYLON.SceneLoader.ImportMesh(
    "",
    "assets/",
    "Terrain.glb",
    scene,
    function (meshes) {
      const terrain = meshes[0];
      terrain.scaling.set(2, 2, 2);
      terrain.position.y = -1;
      terrain.checkCollisions = true;

      const plane = meshes.find((m) => m.name === "Plane");
      if (!plane) {
        console.error("❌ Terrain non trouvé !");
        return;
      }

      // Créer un matériau personnalisé uniquement pour le terrain
      const terrainMaterial = new BABYLON.StandardMaterial("terrainMat", scene);
      terrainMaterial.diffuseTexture = new BABYLON.Texture(
        "textures/CouleurTerrain.jpg",
        scene
      );
      terrainMaterial.backFaceCulling = false;
      plane.material = terrainMaterial;

      meshes.forEach((mesh) => {
        if (
          mesh !== terrain &&
          mesh.position.x === 0 &&
          mesh.position.z === 0
        ) {
          mesh.setEnabled(false);
        }
        if (/Collider_\d+/.test(mesh.name)) {
          mesh.isVisible = false;
          mesh.checkCollisions = true;
        }
      });
      const skybox = BABYLON.MeshBuilder.CreateBox(
        "skyBox",
        { size: 1000 },
        scene
      );
      const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
      skyboxMaterial.backFaceCulling = false;
      skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(
        "textures/skybox/skybox",
        scene
      );
      skyboxMaterial.reflectionTexture.coordinatesMode =
        BABYLON.Texture.SKYBOX_MODE;
      skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
      skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
      skybox.material = skyboxMaterial;

      BABYLON.SceneLoader.ImportMesh(
        "",
        "assets/",
        "Avatar.glb",
        scene,
        function (meshes, _, __, animationGroups) {
          avatar = meshes.find((m) => m instanceof BABYLON.Mesh);
          avatar.position.y = 0;
          avatar.scaling.set(1, 1, 1);
          avatar.checkCollisions = true;
          camera.target = avatar.position;

          animationGroups.forEach((anim) => {
            const n = anim.name.toLowerCase();
            if (n.includes("still")) stillAnim = anim;
            else if (n.includes("runforward")) runForwardAnim = anim;
            else if (n.includes("runba")) runBackwardAnim = anim;
            else if (n.includes("right")) leftAnim = anim;
            else if (n.includes("left")) rightAnim = anim;
          });
          animationGroups.forEach((a) => a.stop());
          if (stillAnim) stillAnim.start(true);

          loadDreams();
        }
      );
    }
  );

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  engine.runRenderLoop(() => {
    if (gameRunning && avatar) {
      let isMoving = false;

      if (moveForward) {
        avatar.position.z -= speed;
        if (runForwardAnim && !runForwardAnim.isPlaying) {
          stopAllAnimations();
          runForwardAnim.start(true);
        }
        isMoving = true;
      }

      if (moveBackward) {
        avatar.position.z += speed;
        if (runBackwardAnim && !runBackwardAnim.isPlaying) {
          stopAllAnimations();
          runBackwardAnim.start(true);
        }
        isMoving = true;
      }

      if (moveRight) {
        avatar.position.x -= speed;
        if (rightAnim && !rightAnim.isPlaying) {
          stopAllAnimations();
          rightAnim.start(true);
        }
        isMoving = true;
      }

      if (moveLeft) {
        avatar.position.x += speed;
        if (leftAnim && !leftAnim.isPlaying) {
          stopAllAnimations();
          leftAnim.start(true);
        }
        isMoving = true;
      }

      // Si aucune touche appuyée → revenir à l’animation "Still"
      if (!isMoving) {
        if (!stillAnim?.isPlaying) {
          stopAllAnimations();
          stillAnim?.start(true);
        }
      }

      avatar.position.x = Math.max(-25, Math.min(25, avatar.position.x));
      avatar.position.z = Math.max(-25, Math.min(25, avatar.position.z));
      camera.target = avatar.position;

      if (hasMoved) {
        dreams.forEach((dream) => {
          if (dream.active && avatar.intersectsMesh(dream.mesh, false)) {
            dream.mesh.setEnabled(false);
            dream.active = false;
            if (dream.points) score += dream.points;
            if (dream.bonusTime) timeLeft += dream.bonusTime;
            scoreDisplay.textContent = `Score : ${score}`;
            timerDisplay.textContent = `Temps restant : ${timeLeft}s`;

            setTimeout(() => {
              const pos = getRandomPosition(50);
              dream.mesh.position = pos;
              dream.mesh.setEnabled(true);
              dream.active = true;
              console.log(
                `🔁 Respawn ${dream.mesh.name} à : x=${pos.x.toFixed(
                  2
                )}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)}`
              );
            }, 2000);
          }
        });
      }
    }

    scene.render();
  });

  // Fonction pour arrêter toutes les animations
  function stopAllAnimations() {
    [stillAnim, runForwardAnim, runBackwardAnim, rightAnim, leftAnim].forEach(
      (a) => a?.stop()
    );
  }

  window.addEventListener("resize", () => engine.resize());
}

// Chrono qui démarre uniquement quand le joueur bouge
function startTimer() {
  if (timerInterval) return; // éviter doublons
  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `Temps restant : ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

// Chargement des sphères
function loadDreams() {
  dreams = [];
  dreamTypes.forEach((type) => {
    BABYLON.SceneLoader.ImportMesh(
      "",
      "assets/",
      type.model,
      scene,
      function (meshes) {
        const baseMesh = meshes.find(
          (m) => m instanceof BABYLON.Mesh && m.geometry
        );
        if (!baseMesh) {
          console.error(`Aucun mesh valide dans ${type.model}`);
          return;
        }
        baseMesh.setEnabled(false);

        for (let i = 0; i < type.count; i++) {
          const pos = getRandomPosition(50);
          const inst = baseMesh.createInstance(`${type.name}_${i}`);
          inst.position = pos;
          inst.scaling.set(0.5, 0.5, 0.5);
          inst.setEnabled(true);

          console.log(
            `✅ Sphère ${type.name} ${i} à : x=${pos.x.toFixed(
              2
            )}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)}`
          );

          dreams.push({
            mesh: inst,
            active: true,
            points: type.points || 0,
            bonusTime: type.bonusTime || 0,
          });
        }
      },
      undefined,
      function (error) {
        console.error(`❌ Erreur chargement ${type.model}:`, error);
      }
    );
  });
}

// Position aléatoire
function getRandomPosition(range) {
  const x = (Math.random() - 0.5) * range;
  const z = (Math.random() - 0.5) * range;
  return new BABYLON.Vector3(x, 0, z);
}

// Contrôles clavier
function handleKeyDown(e) {
  if (!gameRunning) return;

  // Si première action → on démarre le chrono
  if (
    !hasMoved &&
    ["z", "q", "s", "d", "w", "a"].includes(e.key.toLowerCase())
  ) {
    hasMoved = true;
    startTimer();
  }

  switch (e.key.toLowerCase()) {
    case "z":
      moveForward = true;
      break;
    case "w":
      moveForward = true;
      break;
    case "s":
      moveBackward = true;
      break;
    case "d":
      moveRight = true;
      break;
    case "q":
      moveLeft = true;
      break;
    case "a":
      moveLeft = true;
      break;
  }
}
function handleKeyUp(e) {
  if (!gameRunning) return;
  switch (e.key.toLowerCase()) {
    case "z":
      moveForward = false;
      if (runForwardAnim?.isPlaying) {
        runForwardAnim.stop();
        stillAnim.start(true);
      }
      break;
    case "w":
      moveForward = false;
      if (runForwardAnim?.isPlaying) {
        runForwardAnim.stop();
        stillAnim.start(true);
      }
      break;
    case "s":
      moveBackward = false;
      if (runBackwardAnim?.isPlaying) runBackwardAnim.stop();
      break;
    case "d":
      moveRight = false;
      if (rightAnim?.isPlaying) rightAnim.stop();
      break;
    case "q":
      moveLeft = false;
      if (leftAnim?.isPlaying) leftAnim.stop();
      break;
    case "a":
      moveLeft = false;
      if (leftAnim?.isPlaying) leftAnim.stop();
      break;
  }
}

// Fin de partie
async function endGame() {
  if (currentUser) {
    try {
      const savedScore = await saveScore(score);
      highestScoreDisplay.textContent = `Meilleur Score : ${savedScore.best_score}`; // Modifier ici
    } catch (error) {
      console.error("Erreur sauvegarde score:", error);
    }
  }
  clearInterval(timerInterval);
  timerInterval = null;

  gameRunning = false;
  [stillAnim, runForwardAnim, runBackwardAnim, rightAnim, leftAnim].forEach(
    (a) => a?.stop()
  );
  [moveForward, moveBackward, moveRight, moveLeft] = [
    false,
    false,
    false,
    false,
  ];
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  engine.stopRenderLoop();
  scene.dispose();
  engine.dispose();
  avatar = null;
  canvas.style.display = "none";
  timerDisplay.style.display = "none";
  scoreDisplay.style.display = "none";
  scoreText.innerHTML = `Score final : ${score}<br>Meilleur score : ${highestScore}`;
  scoreScreen.style.display = "flex";
  if (score > highestScore) {
    highestScore = score;
  }
  score = 0;
}

// Retour menu
function returnToStartScreen() {
  scoreScreen.style.display = "none";
  startScreen.style.display = "flex";
}

startButton.addEventListener("click", () => {
  startScreen.style.display = "none";
  document.getElementById("instructionScreen").style.display = "block";
});
window.addEventListener("keydown", (e) => {
  if (
    e.code === "Space" &&
    document.getElementById("instructionScreen").style.display === "block"
  ) {
    document.getElementById("instructionScreen").style.display = "none";
    startGame();
  }
});

continueButton.addEventListener("click", returnToStartScreen);
