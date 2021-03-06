const canvas = document.getElementById('myCanvas')
const ctx = canvas.getContext('2d')
const iteration_input = $('#iteration')
const division_input = $('#division')
const scale_input = $('#scale')
// const BASE_URL = "http://188.165.253.204:4000"
const BASE_URL = "https://work.victorsmits.com/api/mandelbrot"
const TASKS = []
const WIDTH = 1000
const HEIGHT = 800

ctx.canvas.width = WIDTH
ctx.canvas.height = HEIGHT

let time = moment().startOf('hour').startOf('day')
let timer
let DIV = 4
let ZOOM_FACTOR = 0.1
let STATUS = 0
let MODE = "SINGLE"
let MODE_COLOR = "BW"
let MAX_ITERATION = 2500
let worker
let colorPalette = []
let REAL_SET = {start: -2, end: 1}
let IMAGINARY_SET = {start: -1, end: 1}


// COLOR PALETTE

const lagrange = ([X1, Y1], [X2, Y2], x) => (((Y1 * (x - X2)) / (X1 - X2)) + ((Y2 * (x - X1)) / (X2 - X1)))

const makeRGB = (r, g, b, k) => {
   const calculate = pair => parseInt(lagrange(pair[0], pair[1], k))
   if (isNaN(r)) r = calculate(r)
   if (isNaN(g)) g = calculate(g)
   if (isNaN(b)) b = calculate(b)

   return [r, g, b]
}

const palette = (size = 250) => {
   const range = parseInt(size / 6)
   const colors = []
   let c
   for (let k = 0; k < size; k++) {
      if (k <= range)//red to yellow
         c = makeRGB(255, [[0, 0], [range, 255]], 0, k)
      else if (k <= range * 2)//yellow to green
         c = makeRGB([[range + 1, 255], [range * 2, 0]], 255, 0, k)
      else if (k <= range * 3)//green to cyan
         c = makeRGB(0, 255, [[range * 2 + 1, 0], [range * 3, 255]], k)
      else if (k <= range * 4)//cyan to blue
         c = makeRGB(0, [[range * 3 + 1, 255], [range * 4, 0]], 255, k)
      else if (k <= range * 5)//blue to purple
         c = makeRGB([[range * 4 + 1, 0], [range * 5, 255]], 0, 255, k)
      else//purple to red
         c = makeRGB(255, 0, [[range * 5 + 1, 255], [size - 1, 0]], k)

      colors.push(c)
   }
   return colors
}

const paletteBW = () => new Array(250).fill(0).map((_, i) => {
   const c = lagrange([0, 0], [250, 255], i)
   return [c, c, c]
})


// SINGLE CORE

const startSingle = () => {
   initWorker()
   for (let col = 0; col < WIDTH; col++) {
      TASKS[col] = col
   }
   worker.postMessage({d: TASKS.shift()})
}

const singleDraw = (col, mandelbrotSets) => {
   for (let i = 0; i < HEIGHT; i++) {
      const [m, isMandelbrotSet] = mandelbrotSets[i]
      let c = isMandelbrotSet ? [0, 0, 0] : colorPalette[m % (colorPalette.length - 1)]
      ctx.fillStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]})`
      ctx.fillRect(col, i, 1, 1)
   }
   if (TASKS.length === 0)
      stop()
}


// SERVER

const startServer = () => {
   for (let col = 0; col < WIDTH; col++) {
      calculateServer(col)
         .then(res => {
            res.json()
               .then(mandelbrotSets => {
                  draw({data: {col, mandelbrotSets}})
               })
         })
   }
}

function calculateServer(j) {
   return post('/generate', {col: j})
}

const post = (path, params) => {
   return fetch(`${BASE_URL}${path}`,
      {
         method: 'POST',
         body: JSON.stringify({
            ...params,
            REAL_SET: REAL_SET,
            IMAGINARY_SET: IMAGINARY_SET,
            WIDTH: WIDTH,
            HEIGHT: HEIGHT,
            END_START_RL: (REAL_SET.end - REAL_SET.start),
            END_START_IM: (IMAGINARY_SET.end - IMAGINARY_SET.start),
            MAX_ITERATION: MAX_ITERATION
         }),
         headers: {
            'Content-Type': 'application/json'
         }
      })
}


// MULTI CORE

const startWorker = () => {
   initWorker()
   for (let d = 0; d < DIV; d++) {
      worker.postMessage({d: d})
   }
}

const multiDraw = (d, mandelbrotSets) => {
   const start = (((1 / DIV) * d) * WIDTH)
   const end = ((1 / DIV) * (d + 1)) * WIDTH

   for (let col = start; col < end; col++) {
      for (let i = 0; i < HEIGHT; i++) {
         const [m, isMandelbrotSet] = mandelbrotSets[col][i]
         let c = isMandelbrotSet ? [0, 0, 0] : colorPalette[m % (colorPalette.length - 1)]
         ctx.fillStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]})`
         ctx.fillRect(col, i, 1, 1)
      }
   }
   if (STATUS === DIV - 1) {
      console.log("END")
      stop()
   } else {
      STATUS++
   }
}


// MAIN

const draw = (res) => {
   if (TASKS.length > 0)
      worker.postMessage({d: TASKS.shift()})

   const {mandelbrotSets} = res.data
   switch (MODE) {
      case "SINGLE":
         singleDraw(res.data.col, mandelbrotSets)
         break
      case "SERVER":
         singleDraw(res.data.col, mandelbrotSets)
         break
      case "MULTI":
         multiDraw(res.data.d, mandelbrotSets)
         break
   }
}

const initWorker = () =>{
   if (worker) worker.terminate()
   worker = new Worker('./worker.js')
   worker.postMessage({
      w: WIDTH,
      h: HEIGHT,
      div: DIV,
      realSet: REAL_SET,
      imaginarySet: IMAGINARY_SET,
      isSettingUp: true,
      mode: MODE,
      iteration: MAX_ITERATION
   })
}

const init = () => {
   STATUS = 0
   restart()
   console.log(MODE)
   switch (MODE) {
      case "SINGLE":
         startSingle()
         break
      case "SERVER":
         startServer()
         break
      case "MULTI":
         startWorker()
         break
   }
   switch (MODE_COLOR) {
      case "BW":
         colorPalette = paletteBW()
         break
      case "RGB":
         colorPalette = palette()
         break
   }
   worker.onmessage = draw
}

const getRelativePoint = (pixel, length, set) => set.start + (pixel / length) * (set.end - set.start)

const updateMode = (value) => {
   MODE = value
   reset()
}

const reset = () => {
   ctx.clearRect(0, 0, canvas.width, canvas.height);
   init()
}

const updateColor = (value) => {
   MODE_COLOR = value
   init()
}

const zoom = (e, scale = ZOOM_FACTOR) => {
   const zfw = (WIDTH * scale)
   const zfh = (HEIGHT * scale)

   REAL_SET = {
      start: getRelativePoint(e.pageX - canvas.offsetLeft - zfw, WIDTH, REAL_SET),
      end: getRelativePoint(e.pageX - canvas.offsetLeft + zfw, WIDTH, REAL_SET)
   }
   IMAGINARY_SET = {
      start: getRelativePoint(e.pageY - canvas.offsetTop - zfh, HEIGHT, IMAGINARY_SET),
      end: getRelativePoint(e.pageY - canvas.offsetTop + zfh, HEIGHT, IMAGINARY_SET)
   }

   init()
}


// TIMER

const start = () => {
   $('#basicUsage').html(time.format('HH:mm:ss'));
   timer = setInterval(() => {
      time.add(1, 'second')
      $('#basicUsage').html(time.format('HH:mm:ss'));
   }, 1000)
}

const stop = () => {
   clearInterval(timer)
}

const restart = () => {
   stop()
   time = moment().startOf('hour').startOf('day')
   start()
}


// START

iteration_input.val(MAX_ITERATION)

iteration_input.change(e => {
   console.log(e.target.value)
   MAX_ITERATION = e.target.value
   reset()
})

division_input.val(DIV)

division_input.change(e => {
   console.log(e.target.value)
   DIV = e.target.value
   reset()
})

scale_input.val(ZOOM_FACTOR)

scale_input.change(e => {
   console.log(e.target.value)
   ZOOM_FACTOR = e.target.value
   reset()
})

canvas.addEventListener('click', e => {
   zoom(e)
})

init()
