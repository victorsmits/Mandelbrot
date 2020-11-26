var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
   res.render('index', {title: 'Express'});
});

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

router.post('/generate', (req, res, next) => {
   console.log(req.body)
   res.status(200).json({result: mandelbrot(req.body.point)})
});


module.exports = router;
