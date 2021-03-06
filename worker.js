let WIDTH, HEIGHT, REAL_SET, IMAGINARY_SET, END_START_RL, END_START_IM, DIV, MODE
let MAX_ITERATION

onmessage = (e) => {
   const {isSettingUp} = e.data
   if (isSettingUp) {
      const {w, h, realSet, imaginarySet, div, mode, iteration} = e.data

      REAL_SET = {start: realSet.start, end: realSet.end}
      IMAGINARY_SET = {start: imaginarySet.start, end: imaginarySet.end}

      END_START_RL = (REAL_SET.end - REAL_SET.start)
      END_START_IM = (IMAGINARY_SET.end - IMAGINARY_SET.start)

      WIDTH = w
      HEIGHT = h
      DIV = div
      MODE = mode
      MAX_ITERATION = iteration
      console.log({
         WIDTH, HEIGHT, REAL_SET, IMAGINARY_SET,
         END_START_RL, END_START_IM, DIV, MODE
      })
   } else {
      const {d} = e.data
      switch (MODE) {
         case "SINGLE":
            single(d)
            break
         case "MULTI":
            multi(d)
            break
      }
   }
}

const calculate = (i, j) => {
   return mandelbrot(relativePoint(i, j))
}

const multi = (d) => {
   const mandelbrotSets = [[]]

   const start = (((1 / DIV) * d) * WIDTH)
   const end = ((1 / DIV) * (d + 1)) * WIDTH

   for (let col = start; col < end; col++) {
      let man = []
      for (let row = 0; row < HEIGHT; row++) {
         man[row] = calculate(col, row)
      }
      mandelbrotSets[col] = man
   }
   postMessage({d, mandelbrotSets})
}

single = (col) => {
   const mandelbrotSets = []
   for (let row = 0; row < HEIGHT; row++) {
      mandelbrotSets[row] = calculate(col, row)
   }
   postMessage({col, mandelbrotSets})
}

const relativePoint = (x, y) => {
   x = REAL_SET.start + (x / WIDTH) * (END_START_RL) // relative col
   y = IMAGINARY_SET.start + (y / HEIGHT) * (END_START_IM) //relative row

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


