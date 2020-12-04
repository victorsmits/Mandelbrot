let express = require('express');
let router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
   res.render('index', {title: 'Express'});
});

const mandelbrot = (c, MAX_ITERATION) => {
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

router.post('/generate', (req, res, next) => {
   let {WIDTH, HEIGHT, REAL_SET, IMAGINARY_SET, END_START_RL, END_START_IM, MAX_ITERATION, col} = req.body
   let man = []
   for (let row = 0; row < HEIGHT; row++) {
      let x = REAL_SET.start + (col / WIDTH) * (END_START_RL)
      let y = IMAGINARY_SET.start + (row / HEIGHT) * (END_START_IM)

      man[row] = mandelbrot({x, y}, MAX_ITERATION)
   }
   res.status(200).json(man)
});


module.exports = router;
