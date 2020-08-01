const gm = require('gm');
// gm - Copyright Aaron Heckmann <aaron.heckmann+github@gmail.com> (MIT Licensed)

module.exports = (data, callback) => {
  const { name, input, output, type, bw } = data;
  const namestuff = name.split(' (prod. barlitxs) ')
  const bpmAndKey = namestuff[1].split('bpm ');
  const bpm = bpmAndKey[0];
  const key = bpmAndKey[1];
  gm(`${input}`)
  // .blur(2, 1)
  .resize(null, 1080)
  .crop(1920, 1080, 0, 0)
  .noise('poisson')
  .fontSize(68)
  .stroke(bw.textColor, 1)
  .fill(bw.textColor)
  .drawText(40, 270, `${namestuff[0]}`)
  .fontSize(24)
  .drawText(40, 310, `${bpm} bpm`)
  .drawText(40, 340, `${key}`)
  .drawText(40, 370, "prod. barlitxs")
  .stroke(bw.color, 1)
  .fill(bw.color)
  .fontSize(68)
  .drawText(40, 100, `${namestuff[0]}`)
  .fontSize(24)
  .drawText(40, 140, `${bpm} bpm`)
  .drawText(40, 170, `${key}`)
  .drawText(40, 200, "prod. barlitxs")
  .fontSize(110)
  .stroke("white", 1)
  .fill("white")
  .drawText(40, 900, `${type}`)
  .drawText(40, 1000, "type beat")
  // .raise(10, 10)
  .write(`${output}`, function(err){
    if (err) return console.dir(arguments)
    console.log('modified image')
    callback(null);
  }
)
}