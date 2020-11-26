let WIDTH, HEIGHT, REAL_SET, IMAGINARY_SET, END_START_RL, END_START_IM
const MAX_ITERATION = 2500
const BASE_URL = "http://localhost:4000"

onmessage = (e) => {
   const {isSettingUp} = e.data
   if (isSettingUp) {
      const {w, h, realSet, imaginarySet} = e.data

      REAL_SET = {start: realSet.start, end: realSet.end}
      IMAGINARY_SET = {start: imaginarySet.start, end: imaginarySet.end}

      END_START_RL = (REAL_SET.end - REAL_SET.start)
      END_START_IM = (IMAGINARY_SET.end - IMAGINARY_SET.start)

      WIDTH = w
      HEIGHT = h
   } else {
      const {col} = e.data
      const mandelbrotSets = []

      // calculateServer(col, mandelbrotSets).then(man => postMessage({col, man}))

      for (let row = 0; row < HEIGHT; row++) {
         mandelbrotSets[row] = calculate(col, row)
      }
      postMessage({col, mandelbrotSets})
   }
}
const calculate = (i, j) => {
   return mandelbrot(relativePoint(i, j))
}

async function calculateServer(j) {
   return new Promise(resolve => {
      let man = []
      for (let row = 0; row < HEIGHT; row++) {
         post('/generate', relativePoint(row, j))
            .then(res => {
               res.json()
                  .then((data) =>
                     man[row] = data.result
                  )
            })
      }
      resolve(man)
   })
}

const relativePoint = (x, y) => {
   x = REAL_SET.start + (x / WIDTH) * (END_START_RL)
   y = IMAGINARY_SET.start + (y / HEIGHT) * (END_START_IM)

   return {x, y}
}

const mandelbrot = (c) => {
   let z = {x: 0, y: 0}, n = 0, p, d;
   do {
      p = {
         x: Math.pow(z.x, 2) - Math.pow(z.y, 2),
         y: 2 * z.x * z.y
      }
      z = {
         x: p.x + c.x,
         y: p.y + c.y
      }
      d = 0.5 * (Math.pow(z.x, 2) + Math.pow(z.y, 2))
      n += 1
   } while (d <= 2 && n < MAX_ITERATION)

   return [n, d <= 2]
}

const post = (path, params, method = 'post') => {
   return fetch(`${BASE_URL}${path}`,
      {
         method: 'POST',
         body: JSON.stringify({point: params}),
         headers: {
            'Content-Type': 'application/json'
         }
      })
}
