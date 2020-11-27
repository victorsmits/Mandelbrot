const canvas = document.getElementById('myCanvas')
const ctx = canvas.getContext('2d')
const iteration_input = $('#iteration')
const division_input = $('#division')
const scale_input = $('#scale')

const timer = new Timer();
const WIDTH = 1000
const HEIGHT = 800
let DIV = 4
let ZOOM_FACTOR = 0.1
let STATUS = 0
let MODE = "SINGLE"
let MODE_COLOR = "BW"
let MAX_ITERATION = 2500
ctx.canvas.width = WIDTH
ctx.canvas.height = HEIGHT

let worker
let colorPalette = []
let REAL_SET = {start: -2, end: 1}
let IMAGINARY_SET = {start: -1, end: 1}

const TASKS = []

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

const startSingle = () => {
   for (let col = 0; col < WIDTH; col++) {
      TASKS[col] = col
   }
   worker.postMessage({d: TASKS.shift()})
}

const startWorker = () => {
   for (let d = 0; d < DIV; d++) {
      worker.postMessage({d: d})
   }
}

const singleDraw = (col, mandelbrotSets) => {
   for (let i = 0; i < HEIGHT; i++) {
      const [m, isMandelbrotSet] = mandelbrotSets[i]
      let c = isMandelbrotSet ? [0, 0, 0] : colorPalette[m % (colorPalette.length - 1)]
      ctx.fillStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]})`
      ctx.fillRect(col, i, 1, 1)
   }
   if (TASKS.length === 0)
      timer.stop()
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
      timer.stop()
   } else {
      STATUS++
   }
}

const draw = (res) => {
   if (TASKS.length > 0)
      worker.postMessage({d: TASKS.shift()})

   const {mandelbrotSets} = res.data
   switch (MODE) {
      case "SINGLE":
         singleDraw(res.data.col, mandelbrotSets)
         break
      case "MULTI":
         multiDraw(res.data.d, mandelbrotSets)
         break
   }
}

const init = () => {
   STATUS = 0
   timer.stop()
   timer.start(['second'])
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
   console.log(MODE)
   switch (MODE) {
      case "SINGLE":
         startSingle()
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

timer.addEventListener('secondsUpdated', function (e) {
   $('#basicUsage').html(timer.getTimeValues().toString());
});

init()
