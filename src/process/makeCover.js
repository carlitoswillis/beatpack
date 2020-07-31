const gm = require('gm');
// gm - Copyright Aaron Heckmann <aaron.heckmann+github@gmail.com> (MIT Licensed)

module.exports = (imagePaths, callback) => {
  const { name, input, output } = imagePaths;

  gm(`${input}`)
  // .blur(8, 4)
  .stroke("red", 7)
  .fill("#ffffffbb")
  .drawLine(20, 10, 50, 40)
  .fill("#fff")
  // .stroke("blue", 1)
  .drawRectangle(40, 10, 50, 20)
  .drawRectangle(60, 10, 70, 20, 3)
  .drawArc(80, 10, 90, 20, 0, 180)
  .drawEllipse(105, 15, 3, 5)
  .drawCircle(125, 15, 120, 15)
  .drawPolyline([140, 10], [143, 13], [145, 13], [147, 15], [145, 17], [143, 19])
  .drawPolygon([160, 10], [163, 13], [165, 13], [167, 15], [165, 17], [163, 19])
  .drawBezier([180, 10], [183, 13], [185, 13], [187, 15], [185, 17], [183, 19])
  .fontSize(68)
  .stroke("#fff", 2)
  // .fill("#000")
  .drawText(0, 300, `${name}`)
  .write(`${output}`, function(err){
    if (err) return console.dir(arguments)
    console.log('modified image')
    callback(null);
  }
)
}