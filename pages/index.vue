<script setup>
import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from 'vue'
import confetti from 'canvas-confetti'

// ── Game data ──────────────────────────────────────────────
const steps = [
  // 1 — NEW quiz
  {
    type: 'quiz',
    question: 'Kako ti se Ahmed javio, šta ti je napisao?',
    options: ['Heej, kako si?', '"Pomirišite mi kosu" poza', 'Mmm macko jesi dobra', 'Znamol se?'],
    correctIndex: 1,
    message: 'Sreća pa imamo screenshot kao dokaz 😂💇‍♂️',
    wrongMessage: 'Hahaha nee, sjeti se te legendarne poruke... 😂',
    imagePath: '/img/poruka.jpg',
  },
  // 2 — OLD Q1
  {
    type: 'quiz',
    question: 'Gdje si prvi put popila kafu sa Ahmedom?',
    options: ['Caffee Trezor', 'Verdi', 'Gato', 'Arhiva'],
    correctIndex: 0,
    message: 'Prvi dejt se ne može zaboraviti, kao ni prvi iznenadni poljubac na parkingu ☕💋',
    wrongMessage: 'Hajde, sjeti se... onaj parking, onaj poljubac... ☕',
    imagePath: '/img/mi.jpg',
  },
  // 3 — CHOICE: Najsmješnija scena
  {
    type: 'choice',
    question: 'Koja vam je najsmješnija zajednička scena?',
    options: ['Kikiriki umjesto kikiri', 'Scena pred spavanje na Zlatiboru 🏔️', 'Gartic phone crteži 🎨', 'Adam i njegovo: Sir Ahmed'],
    message: 'Sve su scene jake, ali Ahmedu je scena na Zlatiboru havarija 😂',
    imagePath: '/img/zlatibor.jpg',
    funnyScene: true,
  },
  // 4 — OLD Q2
  {
    type: 'quiz',
    question: 'Koja fudbalska ekipa su najveći luzeri?',
    options: ['Manchester United', 'Liverpool', 'Arsenal', 'Barcelona'],
    correctIndex: 1,
    message: 'Zar stvarno i dalje misliš da su crveni đavoli luzeri? ⚽😂',
    wrongMessage: 'Ma kakvi su to luzeri... znamo mi koji su pravi luzeri ! 😤',
    imagePath: '/img/luzeri.jpg',
  },
  // 5 — CHOICE: Najbolji koncert
  {
    type: 'choice',
    question: 'Koji vam je bio najbolji koncert zajedno?',
    options: ['Bajaga 🎸', 'Halid B🎤', 'Maid H🎵', 'Mirza S 🎶', 'Grše 🔥', 'Neko drugi? 🤔'],
    message: 'Svi su bili posebni, ali Mirza je pokidao 🎵',
    imagePath: '/img/mirza.jpg',
  },
  // 6 — OLD Q3
  {
    type: 'quiz',
    question: 'Koji je prvi zajednički film koji ste odgledali do kraja u stanu..?',
    options: ['Shawshank Redemption', 'Meet The Millers', 'Hangover', 'Fantastic Four'],
    correctIndex: 0,
    message: 'Ovu noć je tesko zaboraviti 🎬🍿',
    wrongMessage: 'Nee, sjeti se one noći na kauču... 🎬',
    imagePath: '/img/shawshank.jpg',
  },
  // 7 — OLD Q4
  {
    type: 'quiz',
    question: 'Koje je Ahmedovo omiljeno jelo?',
    options: ['Pizza', 'Pljeska', 'Döner', 'Ćevapi'],
    correctIndex: 1,
    message: 'PLJESKA! Jedina stvar koju volim skoro koliko i tebe. Ključna riječ: SKORO. Ti si ipak ispred. 🍔❤️',
    wrongMessage: 'Ma jok... razmisli bolje, znaš ti mene! 🍔',
    imagePath: '/img/pljeska.jpg',
  },
  // 8 — NEW quiz: gaming
  {
    type: 'quiz',
    question: 'Koja je Ahmedova najdraža igrica?',
    options: ['GTA', 'Fifa', 'Call of Duty', 'Minecraft'],
    correctIndex: 1,
    message: 'FIFA! Jedina igrica gdje Ahmed misli da je profesionalac... 🎮😂',
    wrongMessage: 'Nee, razmisli... koja igrica mu nikad ne dosadi? 🎮',
    imagePath: '/img/fifa.jpg',
  },
  // 9 — CHOICE: Destinacija
  {
    type: 'choice',
    question: 'Koja je vaša dream destinacija za posjetiti?',
    options: ['Barcelona 🇪🇸', 'Milano 🇮🇹', 'Manchester 🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'New York 🇺🇸', 'Maldivi 🏝️', 'Neka druga? 🌍'],
    message: 'Nije bitno gdje, bitno je s kim! Ali... Manchester je moj san 🇬🇧👺',
    imagePath: '/img/manco.jpg',
  },
  // 10 — OLD Q5
  {
    type: 'quiz',
    question: 'Vaše najbolje zajedničko putovanje je bilo u...?',
    options: ['Istanbul', 'Beč', 'Budimpešta', 'Zlatibor'],
    correctIndex: 0,
    message: 'Ako nas zemljotres nije rastavio, neće ništa 🌍💕',
    wrongMessage: 'Alo, sjeti se onog zemljotresa... 🌍',
    imagePath: '/img/istanbul.jpg',
  },
]

// ── World layout ───────────────────────────────────────────
const WORLD_WIDTH = 5800
const OBSTACLE_SPACING = 480
const FIRST_OBSTACLE = 520
const AHMED_POS = FIRST_OBSTACLE + OBSTACLE_SPACING * steps.length + 100
const AZRA_HALF = 24
const OBS_HALF = 32
const MOVE_SPEED = 5
const ACCEL = 0.35
const DECEL = 0.25
const MIN_X = 20
const MAX_X = WORLD_WIDTH - 40

const obstaclePositions = steps.map((_, i) => FIRST_OBSTACLE + OBSTACLE_SPACING * i)

// ── State ──────────────────────────────────────────────────
const gameState = ref('START') // START | PLAYING | DIALOGUE_AZRA | DIALOGUE_BIRD | QUIZ | CHOICE | MEMORY | PRE_FINAL | FINAL | WORD_PUZZLE | WORD_PUZZLE_WIN
const choiceResponse = ref(null) // stores chosen option text for choice steps
const currentCheckpoint = ref(0)
const azraX = ref(80)
const cameraX = ref(0)
const facingRight = ref(true)
const isMoving = ref(false)
const velocity = ref(0)
const clearedObstacles = ref([])
const wrongIndex = ref(-1)
const wrongPopup = ref(false)
const collidedObstacle = ref(-1) // which obstacle Azra just bumped into
const bumpAnim = ref(false)
const showPreFinalBubble = ref(false)
const showIntroPopup = ref(false)
const showIdleHint = ref(false)
let idleTimer = null

// ── Word Puzzle ("Ljubavno pismo") ──────────────────────
const PUZZLE_PHRASE = 'JUTROOOO'
const PUZZLE_ALPHABET = 'ABCČĆDĐEFGHIJKLMNOPRSŠTUVZŽ'.split('')
const PUZZLE_MAX_WRONG = 6

const puzzleGuessed = ref([])
const puzzleWrong = ref(0)
const puzzleCracking = ref(false)
const puzzleReassembling = ref(false)
const puzzleLost = ref(false)

const puzzleDisplayLetters = computed(() =>
  PUZZLE_PHRASE.split('').map(ch =>
    ch === ' ' ? ' ' : puzzleGuessed.value.includes(ch) ? ch : '_'
  )
)

const puzzleIsWon = computed(() =>
  PUZZLE_PHRASE.split('').filter(ch => ch !== ' ').every(ch => puzzleGuessed.value.includes(ch))
)

const puzzleHeartFill = computed(() => {
  const total = new Set(PUZZLE_PHRASE.split('').filter(ch => ch !== ' ')).size
  const found = PUZZLE_PHRASE.split('').filter(ch => ch !== ' ' && puzzleGuessed.value.includes(ch))
  const unique = new Set(found).size
  return Math.round((unique / total) * 100)
})

// ── Konami Code Easter Egg ──────────────────────────────
const KONAMI_SEQUENCE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight']
const konamiProgress = ref(0)
const catRainActive = ref(false)
const catRainEmojis = ref([])

// ── Starry Night Easter Egg ─────────────────────────────
const ahmedTapCount = ref(0)
const ahmedTapTimer = ref(null)
const starryNightActive = ref(false)
const starryStars = ref([])
const starryNotes = ref([])

// ── Parrots & dialogue ───────────────────────────────────
const parrotX = ref(-100)         // parrot X in world coords
const parrotY = ref(-60)          // parrot Y offset from bottom
const parrotVisible = ref(false)
const showAzraBubble = ref(false)
const showParrotBubble = ref(false)
const parrotIntroShown = reactive({ čombe: false, lili: false })

// Second parrot (for last question both appear)
const parrot2X = ref(-100)
const parrot2Y = ref(-60)
const parrot2Visible = ref(false)
const isLastQuestion = computed(() => currentCheckpoint.value === steps.length - 1)

// Even checkpoints = Čombe, odd = Lili
const currentParrot = computed(() => currentCheckpoint.value % 2 === 0 ? 'Čombe' : 'Lili')

const azraDialogues = [
  'Šta se dešava? Zašto ne mogu proći?! 😟',
  'Opet neko blokira put! Šta sad?! 😤',
  'Hmm, šta je ovo sada? 🤨',
  'Ma daj... ko je sad tu?! 🙄',
  'Evo opet nečega... 😅',
  'Još jedna prepreka?! Ahmede, gdje si? 😩',
  'Koliko dugo je još ovaj put?! 😤',
  'Opet?! Daj nemoj me zezat! 😫',
  'Uf, šta je sad? 🙄',
  'OPET?! Koliko još ovih ima?! 😭',
]

const parrotDialogues = [
  'Ćiriu ćiriu! Ako želiš proći, moraš odgovoriti na ovo pitanje!',
  'Hej hej! Nema prolaza bez tačnog odgovora!',
  'Ovaj put bez kviza — ali reci nam šta misliš! 🦜',
  'Opet ja! Odgovori tačno pa ćeš proći!',
  'Hajde, kaži nam šta ti misliš! Nema pogrešnog odgovora! 🎶',
  'Još malo! Ali prvo — jedno pitanjce!',
  'Skoro si gotova! Ali prvo — jedno pitanjce!',
  'Opet ja! Odgovori tačno pa ćeš proći! 🎮',
  'Zadnji izbor, obećavam! Kaži šta misliš! 🌍',
  'Zadnji put, obećavam! Ali moraš znati odgovor!',
]

const step = computed(() => steps[currentCheckpoint.value])

// ── Input state ────────────────────────────────────────────
const keys = reactive({ left: false, right: false })

// Keyboard
function onKeyDown(e) {
  if (e.repeat) return
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true

  // Konami code detection
  if (e.key === KONAMI_SEQUENCE[konamiProgress.value]) {
    konamiProgress.value++
    if (konamiProgress.value === KONAMI_SEQUENCE.length) {
      konamiProgress.value = 0
      triggerCatRain()
    }
  } else {
    konamiProgress.value = e.key === KONAMI_SEQUENCE[0] ? 1 : 0
  }
}
function onKeyUp(e) {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false
}

// Touch buttons
function touchLeft(pressed) { keys.left = pressed }
function touchRight(pressed) { keys.right = pressed }

// ── Camera ─────────────────────────────────────────────────
function updateCamera() {
  const vw = window.innerWidth
  cameraX.value = Math.max(0, Math.min(azraX.value - vw * 0.35, WORLD_WIDTH - vw))
}

// ── Collision ──────────────────────────────────────────────
function getBlockingObstacle(newX) {
  for (let i = 0; i < obstaclePositions.length; i++) {
    if (clearedObstacles.value.includes(i)) continue
    const oL = obstaclePositions[i] - OBS_HALF
    const oR = obstaclePositions[i] + OBS_HALF
    const aL = newX - AZRA_HALF
    const aR = newX + AZRA_HALF
    if (aR > oL && aL < oR) return i
  }
  return -1
}

function checkAhmedReach(x) {
  return clearedObstacles.value.length === steps.length && Math.abs(x - AHMED_POS) < 60
}

// ── Game loop ──────────────────────────────────────────────
let loopId = null

function gameLoop() {
  if (gameState.value === 'PLAYING') {
    // Acceleration-based movement
    let targetDir = 0
    if (keys.right) targetDir += 1
    if (keys.left) targetDir -= 1

    if (targetDir !== 0) {
      // Accelerate toward target direction
      velocity.value += targetDir * ACCEL
      velocity.value = Math.max(-MOVE_SPEED, Math.min(MOVE_SPEED, velocity.value))
      facingRight.value = targetDir > 0
      resetIdleTimer()
    } else {
      // Decelerate to stop
      if (Math.abs(velocity.value) < DECEL) {
        velocity.value = 0
      } else {
        velocity.value -= Math.sign(velocity.value) * DECEL
      }
    }

    const dx = velocity.value
    if (Math.abs(dx) > 0.1) {
      isMoving.value = true

      let newX = Math.max(MIN_X, Math.min(MAX_X, azraX.value + dx))
      const blocked = getBlockingObstacle(newX)

      if (blocked >= 0) {
        // Push Azra flush against obstacle wall
        const obsCenter = obstaclePositions[blocked]
        if (dx > 0) {
          newX = obsCenter - OBS_HALF - AZRA_HALF
        } else {
          newX = obsCenter + OBS_HALF + AZRA_HALF
        }
        azraX.value = newX
        velocity.value = 0

        // Trigger dialogue sequence on bump
        if (collidedObstacle.value !== blocked) {
          collidedObstacle.value = blocked
          currentCheckpoint.value = blocked
          bumpAnim.value = true
          setTimeout(() => { bumpAnim.value = false }, 300)
          setTimeout(() => {
            if (gameState.value === 'PLAYING') {
              startDialogueSequence(blocked)
            }
          }, 400)
        }
      } else {
        azraX.value = newX
        collidedObstacle.value = -1

        // Check if reached Ahmed
        if (checkAhmedReach(newX)) {
          gameState.value = 'PRE_FINAL'
          isMoving.value = false
          velocity.value = 0
          keys.left = false
          keys.right = false
          showPreFinalBubble.value = true
        }
      }
    } else {
      isMoving.value = false
    }

    updateCamera()
  }
  loopId = requestAnimationFrame(gameLoop)
}

// ── Game actions ───────────────────────────────────────────
function resetIdleTimer() {
  clearTimeout(idleTimer)
  showIdleHint.value = false
  if (gameState.value === 'PLAYING') {
    idleTimer = setTimeout(() => {
      showIdleHint.value = true
      setTimeout(() => {
        showIdleHint.value = false
        resetIdleTimer()
      }, 3000)
    }, 10000)
  }
}

function startGame() {
  currentCheckpoint.value = 0
  clearedObstacles.value = []
  azraX.value = 80
  facingRight.value = true
  collidedObstacle.value = -1
  parrotVisible.value = false
  parrot2Visible.value = false
  showAzraBubble.value = false
  showParrotBubble.value = false
  parrotIntroShown.čombe = false
  parrotIntroShown.lili = false
  choiceResponse.value = null
  updateCamera()
  showIntroPopup.value = true
  gameState.value = 'INTRO_POPUP'
}

function dismissIntroPopup() {
  showIntroPopup.value = false
  gameState.value = 'PLAYING'
  resetIdleTimer()
}

function selectAnswer(index) {
  if (index === step.value.correctIndex) {
    wrongIndex.value = -1
    wrongPopup.value = false
    clearedObstacles.value.push(currentCheckpoint.value)
    gameState.value = 'MEMORY'
  } else {
    wrongIndex.value = index
    wrongPopup.value = true
    setTimeout(() => { wrongIndex.value = -1 }, 500)
    setTimeout(() => { wrongPopup.value = false }, 2500)
  }
}

function selectChoice(index) {
  choiceResponse.value = step.value.options[index]
  clearedObstacles.value.push(currentCheckpoint.value)
  gameState.value = 'MEMORY'
}

function startDialogueSequence(obstacleIdx) {
  // Stop movement
  keys.left = false
  keys.right = false
  isMoving.value = false

  // Phase 1: Azra speaks — stays until player taps
  showAzraBubble.value = true
  showParrotBubble.value = false
  parrotVisible.value = false
  gameState.value = 'DIALOGUE_AZRA'
}

function advanceDialogue() {
  if (gameState.value === 'DIALOGUE_AZRA') {
    // Dismiss Azra's bubble, bring in the parrot
    showAzraBubble.value = false

    const obsX = obstaclePositions[currentCheckpoint.value]
    // Parrot flies in from off-screen right
    parrotX.value = obsX + 300
    parrotY.value = 60
    parrotVisible.value = true

    // Animate parrot flying to position
    requestAnimationFrame(() => {
      parrotX.value = obsX + 60
      parrotY.value = 180
    })

    // On last question, fly in second parrot too (from the left)
    if (isLastQuestion.value) {
      parrot2X.value = obsX - 250
      parrot2Y.value = 60
      parrot2Visible.value = true
      requestAnimationFrame(() => {
        parrot2X.value = obsX - 60
        parrot2Y.value = 180
      })
    }

    // Show parrot bubble after it arrives
    setTimeout(() => {
      showParrotBubble.value = true
      gameState.value = 'DIALOGUE_BIRD'
    }, 900)

  } else if (gameState.value === 'DIALOGUE_BIRD') {
    const name = currentParrot.value.toLowerCase()
    if (!parrotIntroShown[name]) {
      // First time — mark intro shown, show actual dialogue next
      parrotIntroShown[name] = true
      showParrotBubble.value = false
      nextTick(() => { showParrotBubble.value = true })
    } else {
      // Dismiss parrots, show quiz or choice
      showParrotBubble.value = false
      parrotVisible.value = false
      parrot2Visible.value = false
      gameState.value = step.value.type === 'choice' ? 'CHOICE' : 'QUIZ'
    }
  }
}

function getParrotBubbleText() {
  const name = currentParrot.value
  const key = name.toLowerCase()
  if (!parrotIntroShown[key]) {
    if (key === 'lili') {
      return 'Ćao i od mene, ja sam tvoj stari pomagač! 🦜'
    }
    return `Ja sam ${name} i ja sam tvoj pomoćnik danas! 🦜`
  }
  return parrotDialogues[currentCheckpoint.value]
}

function continueRunning() {
  collidedObstacle.value = -1
  parrotVisible.value = false
  parrot2Visible.value = false
  showAzraBubble.value = false
  showParrotBubble.value = false
  gameState.value = 'PLAYING'
  resetIdleTimer()
}

function launchConfetti() {
  const duration = 4000
  const end = Date.now() + duration
  const frame = () => {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ec4899', '#f472b6', '#f9a8d4', '#ff6b6b', '#ffd93d'] })
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ec4899', '#f472b6', '#f9a8d4', '#ff6b6b', '#ffd93d'] })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

function restart() {
  clearTimeout(idleTimer)
  gameState.value = 'START'
  azraX.value = 80
  cameraX.value = 0
  currentCheckpoint.value = 0
  clearedObstacles.value = []
  collidedObstacle.value = -1
  isMoving.value = false
  parrotVisible.value = false
  parrot2Visible.value = false
  showAzraBubble.value = false
  showParrotBubble.value = false
  parrotIntroShown.čombe = false
  parrotIntroShown.lili = false
  choiceResponse.value = null
}

function advanceToFinal() {
  showPreFinalBubble.value = false
  gameState.value = 'FINAL'
  nextTick(launchConfetti)
}

// ── Word Puzzle functions ─────────────────────────────────
function startWordPuzzle() {
  puzzleGuessed.value = []
  puzzleWrong.value = 0
  puzzleCracking.value = false
  puzzleReassembling.value = false
  puzzleLost.value = false
  gameState.value = 'WORD_PUZZLE'
}

function guessLetter(letter) {
  if (puzzleGuessed.value.includes(letter) || puzzleLost.value) return

  puzzleGuessed.value.push(letter)

  if (PUZZLE_PHRASE.includes(letter)) {
    // Correct guess — check for win
    if (puzzleIsWon.value) {
      setTimeout(() => {
        gameState.value = 'WORD_PUZZLE_WIN'
        nextTick(launchConfetti)
      }, 600)
    }
  } else {
    // Wrong guess
    puzzleWrong.value++
    puzzleCracking.value = true
    setTimeout(() => { puzzleCracking.value = false }, 800)

    if (puzzleWrong.value >= PUZZLE_MAX_WRONG) {
      // Lost — heart breaks then reassembles
      puzzleLost.value = true
      setTimeout(() => {
        puzzleReassembling.value = true
        setTimeout(() => {
          puzzleReassembling.value = false
        }, 1200)
      }, 1000)
    }
  }
}

function exitWordPuzzle() {
  gameState.value = 'FINAL'
}

// ── Konami Cat Rain ──────────────────────────────────────
function triggerCatRain() {
  if (catRainActive.value) return
  const cats = ['🐱', '😸', '🐈', '😻', '🙀']
  catRainEmojis.value = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    emoji: cats[i % cats.length],
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    size: 1.5 + Math.random() * 1.5,
  }))
  catRainActive.value = true
  setTimeout(() => {
    catRainActive.value = false
    catRainEmojis.value = []
  }, 5000)
}

// ── Starry Night ─────────────────────────────────────────
function tapAhmed() {
  ahmedTapCount.value++
  clearTimeout(ahmedTapTimer.value)

  if (ahmedTapCount.value >= 5) {
    ahmedTapCount.value = 0
    triggerStarryNight()
  } else {
    ahmedTapTimer.value = setTimeout(() => {
      ahmedTapCount.value = 0
    }, 2000)
  }
}

function triggerStarryNight() {
  if (starryNightActive.value) return
  starryStars.value = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 70,
    size: 0.5 + Math.random() * 1.5,
    delay: Math.random() * 3,
  }))
  starryNotes.value = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    note: ['♪', '♫', '♩', '♬'][i % 4],
    left: 20 + Math.random() * 60,
    delay: i * 0.5,
  }))
  starryNightActive.value = true
  setTimeout(() => {
    starryNightActive.value = false
    starryStars.value = []
    starryNotes.value = []
  }, 6000)
}

// ── Lifecycle ──────────────────────────────────────────────
onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  updateCamera()
  loopId = requestAnimationFrame(gameLoop)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  cancelAnimationFrame(loopId)
  clearTimeout(idleTimer)
})
</script>

<template>
  <div class="w-screen overflow-hidden select-none relative" style="height: 100dvh; background: linear-gradient(180deg, #fdf2f8 0%, #fce7f3 40%, #fbcfe8 100%); touch-action: none;">

    <!-- ─── SKY: Parallax clouds ─── -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute text-5xl opacity-30 animate-cloud-drift" style="top: 8%; animation-delay: 0s;">☁️</div>
      <div class="absolute text-7xl opacity-20 animate-cloud-drift-slow" style="top: 15%; animation-delay: -12s;">☁️</div>
      <div class="absolute text-4xl opacity-25 animate-cloud-drift" style="top: 5%; animation-delay: -8s;">☁️</div>
      <div class="absolute text-6xl opacity-15 animate-cloud-drift-slow" style="top: 22%; animation-delay: -20s;">☁️</div>
    </div>

    <!-- ─── GAME WORLD ─── -->
    <div
      class="absolute bottom-0 left-0"
      :style="{ width: WORLD_WIDTH + 'px', height: '100%', transform: `translateX(${-cameraX}px)` }"
    >

      <!-- Ground -->
      <div class="absolute bottom-0 w-full h-28" style="background: linear-gradient(0deg, #15803d 0%, #22c55e 40%, #4ade80 100%);">
        <div class="absolute top-0 w-full h-4 opacity-60" style="background: repeating-linear-gradient(90deg, transparent 0px, transparent 12px, #16a34a 12px, #16a34a 14px, transparent 14px, transparent 26px);"></div>
      </div>

      <!-- Dirt path -->
      <div class="absolute bottom-8 w-full h-12" style="background: linear-gradient(0deg, #a16207 0%, #ca8a04 50%, #eab308 100%); opacity: 0.5;"></div>

      <!-- Flowers -->
      <template v-for="n in 30" :key="'flower-'+n">
        <div
          class="absolute text-xl pointer-events-none"
          :style="{ bottom: (100 + (n * 7) % 30) + 'px', left: (n * 155 + (n * 37) % 80) + 'px' }"
        >{{ ['🌸', '🌷', '🌻', '💐', '🌺', '🌹'][n % 6] }}</div>
      </template>

      <!-- Trees -->
      <template v-for="n in 12" :key="'tree-'+n">
        <div
          class="absolute text-4xl opacity-40 pointer-events-none"
          :style="{ bottom: '130px', left: (n * 400 + 80) + 'px' }"
        >🌳</div>
      </template>

      <!-- Floating hearts -->
      <template v-for="n in 10" :key="'heart-'+n">
        <div
          class="absolute text-2xl opacity-20 animate-float pointer-events-none"
          :style="{ top: (80 + n * 40) + 'px', left: (n * 480 + 200) + 'px', animationDelay: (n * 0.7) + 's' }"
        >💕</div>
      </template>

      <!-- ─── OBSTACLES (invisible barriers with subtle shimmer) ─── -->
      <template v-for="(pos, i) in obstaclePositions" :key="'obs-'+i">
        <!-- Active: faint vertical shimmer -->
        <div
          v-if="!clearedObstacles.includes(i)"
          class="absolute pointer-events-none"
          :style="{ left: (pos - 2) + 'px', bottom: '100px', width: '4px', height: '64px' }"
        >
          <div class="w-full h-full rounded-full opacity-30 animate-pulse" style="background: linear-gradient(180deg, transparent, #f9a8d4, #ec4899, #f9a8d4, transparent);"></div>
        </div>

        <!-- Cleared: sparkles -->
        <div
          v-else
          class="absolute flex flex-col items-center opacity-40 pointer-events-none"
          :style="{ left: pos + 'px', bottom: '108px' }"
        >
          <div class="text-3xl">✨</div>
        </div>
      </template>

      <!-- ─── AHMED ─── -->
      <div
        class="absolute flex flex-col items-center"
        :style="{ left: AHMED_POS + 'px', bottom: '100px' }"
      >
        <div class="text-5xl animate-float">👨‍💻</div>
        <div class="text-xs text-pink-600 font-bold mt-1 bg-pink-100 px-2 py-0.5 rounded-full whitespace-nowrap">Ahmed</div>
      </div>

      <!-- ─── AZRA ─── -->
      <div
        class="absolute flex flex-col items-center z-20"
        :style="{ left: azraX + 'px', bottom: '100px' }"
      >
        <!-- Azra speech bubble -->
        <div
          v-if="showAzraBubble"
          class="absolute bottom-16 left-1/2 -translate-x-1/2 w-[260px] animate-slide-in z-30"
        >
          <div class="bg-white rounded-2xl px-4 py-2 shadow-lg border-2 border-pink-200 text-xs font-medium text-pink-700 max-w-[340px] whitespace-normal text-center">
            {{ azraDialogues[currentCheckpoint] }}
          </div>
          <div class="w-3 h-3 bg-white border-b-2 border-r-2 border-pink-200 rotate-45 mx-auto -mt-1.5"></div>
        </div>

        <div
          class="text-5xl transition-transform duration-75"
          :style="{ transform: facingRight ? 'scaleX(-1)' : 'scaleX(1)' }"
        >
          <div
            :class="{
              'animate-bounce-run': isMoving,
              'animate-shake': bumpAnim,
            }"
          >🏃‍♀️</div>
        </div>
        <div v-if="isMoving" class="text-xs mt-[-4px] opacity-50 pointer-events-none">💨</div>
      </div>

      <!-- ─── PARROT ─── -->
      <div
        v-if="parrotVisible"
        class="absolute z-20 flex flex-col items-center transition-all duration-900 ease-out"
        :style="{ left: parrotX + 'px', bottom: parrotY + 'px' }"
      >
        <!-- Parrot speech bubble -->
        <div
          v-if="showParrotBubble"
          class="absolute bottom-14 left-1/2 -translate-x-1/2 animate-slide-in z-30"
        >
          <div class="bg-green-50 rounded-2xl px-4 py-2 shadow-lg border-2 border-green-300 text-xs font-medium text-green-800 max-w-[340px] whitespace-normal text-center">
            {{ getParrotBubbleText() }}
          </div>
          <div class="w-3 h-3 bg-green-50 border-b-2 border-r-2 border-green-300 rotate-45 mx-auto -mt-1.5"></div>
        </div>

        <div class="text-4xl animate-float" style="animation-duration: 1.5s;">
          🦜
        </div>
        <div class="text-[10px] text-green-700 font-bold bg-green-100 px-1.5 py-0.5 rounded-full mt-0.5">{{ currentParrot }}</div>
      </div>

      <!-- ─── SECOND PARROT (last question only) ─── -->
      <div
        v-if="parrot2Visible"
        class="absolute z-20 flex flex-col items-center transition-all duration-900 ease-out"
        :style="{ left: parrot2X + 'px', bottom: parrot2Y + 'px' }"
      >
        <div class="text-4xl animate-float" style="animation-duration: 1.5s; transform: scaleX(-1);">
          🦜
        </div>
        <div class="text-[10px] text-green-700 font-bold bg-green-100 px-1.5 py-0.5 rounded-full mt-0.5">{{ currentParrot === 'Čombe' ? 'Lili' : 'Čombe' }}</div>
      </div>

    </div>

    <!-- ─── HUD: Progress (top) ─── -->
    <div v-if="gameState !== 'START' && gameState !== 'INTRO_POPUP'" class="absolute top-3 left-1/2 -translate-x-1/2 z-30 animate-fade-in">
      <div class="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
        <template v-for="(s, i) in steps" :key="'prog-'+i">
          <div
            class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500"
            :class="clearedObstacles.includes(i) ? 'bg-pink-500 text-white scale-110' : i === currentCheckpoint && (gameState === 'QUIZ' || gameState === 'CHOICE' || gameState === 'DIALOGUE_AZRA' || gameState === 'DIALOGUE_BIRD') ? 'bg-pink-300 text-pink-700 ring-2 ring-pink-400' : 'bg-pink-100 text-pink-300'"
          >
            <span v-if="clearedObstacles.includes(i)">✓</span>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <div v-if="i < steps.length - 1" class="w-3 h-0.5" :class="clearedObstacles.includes(i) ? 'bg-pink-500' : 'bg-pink-200'"></div>
        </template>
        <div class="w-3 h-0.5" :class="gameState === 'FINAL' ? 'bg-pink-500' : 'bg-pink-200'"></div>
        <div class="text-sm">💕</div>
      </div>
    </div>

    <!-- ─── HUD: Controls hint (desktop) ─── -->
    <div v-if="gameState === 'PLAYING'" class="absolute top-14 left-1/2 -translate-x-1/2 z-30 hidden sm:block">
      <div class="text-pink-400 text-xs bg-white/60 backdrop-blur-sm rounded-full px-3 py-1">
        ← → ili A D za kretanje
      </div>
    </div>

    <!-- ─── TOUCH CONTROLS (always visible on mobile when playing) ─── -->
    <div v-if="gameState === 'PLAYING'" class="absolute bottom-0 left-0 right-0 z-30 sm:hidden">
      <div class="flex justify-between px-4 pb-6 pt-2">
        <!-- Left button -->
        <button
          class="w-20 h-20 rounded-full flex items-center justify-center text-3xl active:scale-90 transition-transform"
          :class="keys.left ? 'bg-pink-500/50 text-white' : 'bg-white/40 text-pink-500 backdrop-blur-sm'"
          @touchstart.prevent="touchLeft(true)"
          @touchend.prevent="touchLeft(false)"
          @touchcancel.prevent="touchLeft(false)"
        >
          ◀
        </button>
        <!-- Right button -->
        <button
          class="w-20 h-20 rounded-full flex items-center justify-center text-3xl active:scale-90 transition-transform"
          :class="keys.right ? 'bg-pink-500/50 text-white' : 'bg-white/40 text-pink-500 backdrop-blur-sm'"
          @touchstart.prevent="touchRight(true)"
          @touchend.prevent="touchRight(false)"
          @touchcancel.prevent="touchRight(false)"
        >
          ▶
        </button>
      </div>
    </div>

    <!-- Also allow desktop users to click arrow buttons if they prefer -->
    <div v-if="gameState === 'PLAYING'" class="absolute bottom-4 left-0 right-0 z-30 hidden sm:flex justify-center gap-3">
      <button
        class="w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all"
        :class="keys.left ? 'bg-pink-500/50 text-white scale-90' : 'bg-white/30 text-pink-400 hover:bg-white/50'"
        @mousedown.prevent="touchLeft(true)"
        @mouseup.prevent="touchLeft(false)"
        @mouseleave="touchLeft(false)"
      >
        ◀
      </button>
      <button
        class="w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all"
        :class="keys.right ? 'bg-pink-500/50 text-white scale-90' : 'bg-white/30 text-pink-400 hover:bg-white/50'"
        @mousedown.prevent="touchRight(true)"
        @mouseup.prevent="touchRight(false)"
        @mouseleave="touchRight(false)"
      >
        ▶
      </button>
    </div>

    <!-- ─── START OVERLAY ─── -->
    <div v-if="gameState === 'START'" class="absolute inset-0 z-40 flex flex-col items-center justify-center bg-pink-50/80 backdrop-blur-sm">
      <div class="text-center animate-fade-in px-6">
        <div class="text-7xl mb-6" style="animation: wave 1.5s ease-in-out infinite;">👋</div>
        <h1 class="text-3xl sm:text-4xl font-bold text-pink-600 mb-3">Helouu 💕</h1>
        <p class="text-pink-400 mb-2 text-lg">Jesil spremna za jedan mali kviz?</p>
        <p class="text-pink-300 mb-8 text-sm">Koristi ← → tipke ili dodirne kontrole</p>
        <button
          @click="startGame"
          class="bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-14 rounded-full text-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 animate-pulse-glow"
        >
          Kreni! 🏃‍♀️
        </button>
      </div>
    </div>

    <!-- ─── INTRO POPUP (after pressing Kreni) ─── -->
    <div
      v-if="gameState === 'INTRO_POPUP'"
      class="absolute inset-0 z-40 flex items-center justify-center cursor-pointer"
      style="background: rgba(253,242,248,0.3);"
      @click="dismissIntroPopup"
    >
      <div class="mt-20 sm:mt-24 animate-slide-in">
        <div class="bg-white rounded-2xl px-5 py-3 shadow-xl border-2 border-pink-200 text-center max-w-[340px]">
          <p class="text-pink-700 font-bold text-sm">Gdje sam ja ovo? Moram naći Ahmeda! 😟</p>
        </div>
        <div class="w-3 h-3 bg-white border-b-2 border-r-2 border-pink-200 rotate-45 mx-auto -mt-1.5"></div>
      </div>
      <div class="absolute bottom-16 left-1/2 -translate-x-1/2 text-pink-300 text-xs animate-pulse">
        dodirni za nastaviti ▶
      </div>
    </div>

    <!-- ─── IDLE HINT (30s no movement) ─── -->
    <div
      v-if="showIdleHint && gameState === 'PLAYING'"
      class="absolute bottom-36 sm:bottom-28 left-1/2 -translate-x-1/2 z-35 animate-slide-in pointer-events-none"
    >
      <div class="bg-white rounded-2xl px-5 py-2.5 shadow-xl border-2 border-pink-200 text-center max-w-[340px]">
        <p class="text-pink-600 font-medium text-xs">Hmm moram krenuti desno... ➡️</p>
      </div>
      <div class="w-3 h-3 bg-white border-b-2 border-r-2 border-pink-200 rotate-45 mx-auto -mt-1.5"></div>
    </div>

    <!-- ─── DIALOGUE OVERLAY (tap to advance) ─── -->
    <div
      v-if="gameState === 'DIALOGUE_AZRA' || gameState === 'DIALOGUE_BIRD'"
      class="absolute inset-0 z-30 cursor-pointer"
      @click="advanceDialogue"
    >
      <div class="absolute bottom-20 left-1/2 -translate-x-1/2 text-pink-300 text-xs animate-pulse">
        dodirni za nastaviti ▶
      </div>
    </div>

    <!-- ─── QUIZ OVERLAY ─── -->
    <div v-if="gameState === 'QUIZ'" class="absolute inset-0 z-40 flex items-end sm:items-center justify-center p-3 sm:p-4" style="background: rgba(0,0,0,0.35);">
      <div class="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-md animate-slide-in mb-2 sm:mb-0">
        <div class="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div class="text-3xl sm:text-5xl">🦜<span v-if="isLastQuestion">🦜</span></div>
          <div>
            <p class="text-green-600 text-xs sm:text-sm font-medium">{{ isLastQuestion ? 'Čombe i Lili te pitaju...' : currentParrot + ' te pita...' }}</p>
            <h2 class="text-base sm:text-xl font-bold text-pink-700">{{ step.question }}</h2>
          </div>
        </div>
        <!-- Wrong answer popup -->
        <div v-if="wrongPopup" class="mb-2 sm:mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-red-600 text-xs sm:text-sm text-center animate-slide-in">
          {{ step.wrongMessage }}
        </div>
        <div class="grid gap-2 sm:gap-2.5">
          <button
            v-for="(option, i) in step.options"
            :key="i"
            @click="selectAnswer(i)"
            class="w-full py-2 px-3 sm:py-3 sm:px-5 rounded-xl text-left text-sm sm:text-base font-semibold transition-all duration-200"
            :class="[
              wrongIndex === i
                ? 'bg-red-50 text-red-500 border-2 border-red-300 animate-shake'
                : 'bg-pink-50 text-pink-600 border-2 border-pink-200 hover:border-pink-400 hover:bg-pink-100 active:scale-[0.98]'
            ]"
          >
            {{ option }}
          </button>
        </div>
      </div>
    </div>

    <!-- ─── CHOICE OVERLAY ─── -->
    <div v-if="gameState === 'CHOICE'" class="absolute inset-0 z-40 flex items-end sm:items-center justify-center p-3 sm:p-4" style="background: rgba(0,0,0,0.35);">
      <div class="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-md animate-slide-in mb-2 sm:mb-0" style="border: 2px solid #c084fc;">
        <div class="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div class="text-3xl sm:text-5xl">🦜</div>
          <div>
            <p class="text-purple-500 text-xs sm:text-sm font-medium">Nema pogrešnog odgovora!</p>
            <h2 class="text-base sm:text-xl font-bold text-purple-700">{{ step.question }}</h2>
          </div>
        </div>
        <div :class="step.options.length > 4 ? 'grid grid-cols-2 gap-1.5 sm:gap-2.5' : 'grid gap-2 sm:gap-2.5'">
          <button
            v-for="(option, i) in step.options"
            :key="i"
            @click="selectChoice(i)"
            class="w-full py-2 px-3 sm:py-3 sm:px-5 rounded-xl text-left text-sm sm:text-base font-semibold transition-all duration-200 bg-purple-50 text-purple-600 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-100 active:scale-[0.98]"
          >
            {{ option }}
          </button>
        </div>
      </div>
    </div>

    <!-- ─── MEMORY OVERLAY ─── -->
    <div v-if="gameState === 'MEMORY'" class="absolute inset-0 z-40 flex items-end sm:items-center justify-center p-3 sm:p-4" style="background: rgba(0,0,0,0.35);">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-in overflow-hidden mb-2 sm:mb-0">
        <div class="text-center pt-3 sm:pt-5 pb-1 sm:pb-2">
          <span v-if="step.type === 'choice'" class="text-xl sm:text-2xl font-bold text-purple-500">
            {{ choiceResponse }} 💬
          </span>
          <span v-else class="text-xl sm:text-2xl font-bold text-pink-500">Tačno! ✨</span>
        </div>
        <img
          :src="step.imagePath"
          :alt="'Uspomena ' + (currentCheckpoint + 1)"
          class="w-full max-h-48 sm:max-h-64 object-contain bg-pink-50"
          @error="(e) => e.target.style.display = 'none'"
        />
        <div class="p-3 sm:p-5">
          <!-- Laughing parrots for funny scene -->
          <div v-if="step.funnyScene" class="flex justify-center gap-3 mb-3">
            <span class="text-5xl animate-bounce" style="animation-duration: 0.6s;">🦜</span>
            <span class="text-4xl animate-bounce" style="animation-delay: 0.1s; animation-duration: 0.5s;">😂</span>
            <span class="text-5xl animate-bounce" style="animation-delay: 0.2s; animation-duration: 0.6s; display: inline-block; transform: scaleX(-1);">🦜</span>
          </div>
          <p :class="step.type === 'choice' ? 'text-purple-700' : 'text-pink-700'" class="text-sm sm:text-lg leading-relaxed mb-3 sm:mb-5">{{ step.message }}</p>
          <button
            @click="continueRunning"
            class="w-full text-white font-bold py-2.5 sm:py-3 rounded-xl text-base sm:text-lg shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            :class="step.type === 'choice' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-pink-500 hover:bg-pink-600'"
          >
            Trči dalje! 🏃‍♀️
          </button>
        </div>
      </div>
    </div>

    <!-- ─── PRE-FINAL OVERLAY (tap to continue) ─── -->
    <div
      v-if="gameState === 'PRE_FINAL'"
      class="absolute inset-0 z-40 flex items-end justify-center cursor-pointer"
      style="background: rgba(253,242,248,0.5);"
      @click="advanceToFinal"
    >
      <div class="mb-32 sm:mb-40 animate-slide-in">
        <div class="bg-white rounded-2xl px-5 py-3 shadow-xl border-2 border-pink-200 text-center max-w-xs">
          <p class="text-pink-700 font-bold text-base">Hajdeeee ustaj sa stolice bolan zakasnićeš kod Mukija! 😤</p>
        </div>
        <div class="w-3 h-3 bg-white border-b-2 border-r-2 border-pink-200 rotate-45 mx-auto -mt-1.5"></div>
      </div>
      <div class="absolute bottom-16 left-1/2 -translate-x-1/2 text-pink-300 text-xs animate-pulse">
        dodirni za nastaviti ▶
      </div>
    </div>

    <!-- ─── FINAL OVERLAY ─── -->
    <div v-if="gameState === 'FINAL'" class="absolute inset-0 z-40 flex items-center justify-center p-4" style="background: rgba(253,242,248,0.75);">
      <div class="text-center animate-fade-in">
        <div class="text-8xl mb-6 space-x-2">
          <span>🏃‍♀️</span><span class="inline-block animate-pulse-glow rounded-full">💕</span><span class="cursor-pointer" @click="tapAhmed">👨‍💻</span>
        </div>
        <h2 class="text-2xl sm:text-3xl font-bold text-pink-600 mb-3 uppercase tracking-wide">Sretna nam godišnjica ljubavi moja!</h2>
        <p class="text-pink-400 text-lg mb-8">🥰</p>
        <div class="flex flex-col items-center gap-3">
          <button
            @click="restart"
            class="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-10 rounded-full text-lg shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Ponovo? 🔄
          </button>
          <button
            @click="startWordPuzzle"
            class="text-pink-400 hover:text-pink-600 text-sm transition-all duration-500 hover:scale-105 animate-pulse-glow rounded-full px-4 py-1.5"
            style="animation-duration: 3s;"
          >
            Ovo ako pogodiš svaka čast 💌
          </button>
        </div>
      </div>
    </div>

    <!-- ─── WORD PUZZLE OVERLAY ─── -->
    <div v-if="gameState === 'WORD_PUZZLE'" class="absolute inset-0 z-40 flex items-center justify-center p-4" style="background: rgba(0,0,0,0.5);">
      <div class="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-md animate-slide-in max-h-[95vh] overflow-y-auto">
        <div class="text-center mb-4">
          <h2 class="text-xl font-bold text-pink-600 mb-1">Ljubavno pismo 💌</h2>
          <p class="text-pink-400 text-sm">Ovo ako pogodiš svaka čast!</p>
        </div>

        <!-- Heart visual -->
        <div class="flex justify-center mb-4">
          <div class="relative w-24 h-24">
            <!-- Background heart (empty) -->
            <div
              class="absolute inset-0 heart-shape bg-pink-100"
              :class="{ 'animate-heart-crack': puzzleCracking, 'animate-heart-reassemble': puzzleReassembling }"
            ></div>
            <!-- Fill heart (grows from bottom) -->
            <div
              class="absolute inset-0 heart-shape transition-all duration-500 ease-out"
              :style="{ background: `linear-gradient(to top, #ec4899 ${puzzleHeartFill}%, transparent ${puzzleHeartFill}%)` }"
            ></div>
            <!-- Wrong guess hearts -->
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
              <span v-for="i in PUZZLE_MAX_WRONG" :key="'wh-'+i" class="text-sm">
                {{ i <= puzzleWrong ? '🖤' : '🩷' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Phrase display -->
        <div class="flex flex-wrap justify-center gap-1.5 mb-5 mt-8 px-2">
          <template v-for="(ch, i) in puzzleDisplayLetters" :key="'pl-'+i">
            <span v-if="ch === ' '" class="w-4"></span>
            <span
              v-else
              class="w-7 h-9 sm:w-8 sm:h-10 flex items-center justify-center text-base sm:text-lg font-bold rounded-lg border-2 transition-all duration-300"
              :class="ch !== '_' ? 'border-pink-400 bg-pink-50 text-pink-700 animate-pop' : 'border-pink-200 bg-white text-transparent'"
            >{{ ch }}</span>
          </template>
        </div>

        <!-- Lost message -->
        <div v-if="puzzleLost" class="text-center mb-4 animate-fade-in">
          <p class="text-pink-600 font-bold text-lg">Jer naša ljubav ne može pući! 💕</p>
          <p class="text-pink-400 text-sm mt-1">Probaj ponovo, znaš ti ovo! 🥰</p>
          <div class="flex justify-center gap-3 mt-3">
            <button
              @click="startWordPuzzle"
              class="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-8 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              Ponovo 🔄
            </button>
            <button
              @click="exitWordPuzzle"
              class="bg-pink-100 hover:bg-pink-200 text-pink-600 font-bold py-2 px-6 rounded-full shadow transition-all hover:scale-105 active:scale-95"
            >
              Nazad
            </button>
          </div>
        </div>

        <!-- Keyboard -->
        <div v-if="!puzzleLost" class="flex flex-wrap justify-center gap-1.5 px-1">
          <button
            v-for="letter in PUZZLE_ALPHABET"
            :key="'kb-'+letter"
            @click="guessLetter(letter)"
            :disabled="puzzleGuessed.includes(letter)"
            class="w-[2rem] h-[2.2rem] sm:w-9 sm:h-10 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200"
            :class="puzzleGuessed.includes(letter)
              ? PUZZLE_PHRASE.includes(letter)
                ? 'bg-green-100 text-green-600 border-2 border-green-300'
                : 'bg-gray-100 text-gray-300 border-2 border-gray-200'
              : 'bg-pink-50 text-pink-600 border-2 border-pink-300 hover:bg-pink-100 hover:border-pink-400 active:scale-90'"
          >{{ letter }}</button>
        </div>

        <!-- Back button -->
        <div v-if="!puzzleLost" class="text-center mt-4">
          <button @click="exitWordPuzzle" class="text-pink-300 hover:text-pink-500 text-xs transition-colors">
            ← Nazad
          </button>
        </div>
      </div>
    </div>

    <!-- ─── WORD PUZZLE WIN OVERLAY ─── -->
    <div v-if="gameState === 'WORD_PUZZLE_WIN'" class="absolute inset-0 z-40 flex items-center justify-center p-4" style="background: rgba(253,242,248,0.85);">
      <div class="text-center animate-fade-in">
        <div class="text-7xl mb-4">💕</div>
        <h2 class="text-3xl font-bold text-pink-600 mb-2">{{ PUZZLE_PHRASE }}!</h2>
        <p class="text-pink-500 text-lg mb-2">Pogodila si!</p>
        <p class="text-pink-400 mb-6">I kroz 3 godine se radujem ovoj poruci (samo da ne bude jutro s jednim o) 🥰</p>
        <button
          @click="exitWordPuzzle"
          class="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-10 rounded-full text-lg shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          💕
        </button>
      </div>
    </div>

    <!-- ─── CAT RAIN OVERLAY (Konami) ─── -->
    <div v-if="catRainActive" class="absolute inset-0 z-50 pointer-events-none overflow-hidden">
      <div
        v-for="cat in catRainEmojis"
        :key="'cat-'+cat.id"
        class="absolute animate-cat-fall"
        :style="{
          left: cat.left + '%',
          top: '-60px',
          fontSize: cat.size + 'rem',
          animationDelay: cat.delay + 's',
          animationDuration: cat.duration + 's',
        }"
      >{{ cat.emoji }}</div>
      <div class="absolute bottom-20 left-1/2 -translate-x-1/2 bg-yellow-100 border-2 border-yellow-300 rounded-2xl px-5 py-3 shadow-xl text-center animate-slide-in">
        <p class="text-yellow-800 font-bold text-sm sm:text-base">Ahmed se opet zagledao u mačke! 🐱</p>
        <p class="text-yellow-600 text-xs sm:text-sm">— Istanbul flashback...</p>
      </div>
    </div>

    <!-- ─── STARRY NIGHT OVERLAY ─── -->
    <div v-if="starryNightActive" class="absolute inset-0 z-50 pointer-events-none animate-starry-fade" style="background: linear-gradient(180deg, #0f172a 0%, #1e293b 40%, #334155 100%);">
      <!-- Moon -->
      <div class="absolute top-10 right-12 text-5xl">🌙</div>
      <!-- Stars -->
      <div
        v-for="star in starryStars"
        :key="'star-'+star.id"
        class="absolute animate-twinkle text-white"
        :style="{
          left: star.left + '%',
          top: star.top + '%',
          fontSize: star.size + 'rem',
          animationDelay: star.delay + 's',
        }"
      >✦</div>
      <!-- Musical notes -->
      <div
        v-for="note in starryNotes"
        :key="'note-'+note.id"
        class="absolute animate-music-float text-pink-300 text-2xl"
        :style="{
          left: note.left + '%',
          bottom: '30%',
          animationDelay: note.delay + 's',
        }"
      >{{ note.note }}</div>
      <!-- Message -->
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center px-6">
          <p class="text-2xl sm:text-3xl font-bold text-white mb-3">Pod istim zvijezdama ✨</p>
          <p class="text-pink-300 text-lg">Uvijek zajedno, čak i kad smo daleko</p>
        </div>
      </div>
    </div>

  </div>
</template>
