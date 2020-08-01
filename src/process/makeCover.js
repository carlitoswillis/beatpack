const gm = require('gm');
// gm - Copyright Aaron Heckmann <aaron.heckmann+github@gmail.com> (MIT Licensed)
function randomcolor() {
  return Math.floor(Math.random() * (10) );
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

module.exports = (data, callback) => {
  const { name, input, output, type, bw } = data;
  const namestuff = name.split(' (prod. barlitxs) ')
  const bpmAndKey = namestuff[1].split('bpm ');
  const bpm = bpmAndKey[0];
  const key = bpmAndKey[1];
  // const typebeat = `‎‎${type} type beat`;
  const typebeat = `${type} type beat`;
  const size = 2.2639 * 1920 / (typebeat.length + 3);
  const [ red, green, blue ] = [ randomcolor(), randomcolor(), randomcolor()];
  const colorsnumber = getRndInteger(3, 20);
  console.log(colorsnumber);
  gm(`${input}`)
  .fontSize(36)
  .fill(bw.textColor)
  .gravity('NorthEast')
  .drawText(60, 270, `${namestuff[0]}`)
  .fontSize(24)
  .drawText(60, 310, `${bpm} bpm`)
  .drawText(60, 340, `${key}`)
  .drawText(60, 370, "prod. barlitxs")
  .fill(bw.color)
  .fontSize(36)
  .drawText(60, 100, `${namestuff[0]}`)
  .fontSize(24)
  .drawText(60, 140, `${bpm} bpm`)
  .drawText(60, 170, `${key}`)
  .drawText(60, 200, "prod. barlitxs")
  .colors(colorsnumber)
  .gravity('South')
  .colorize(red, green, blue)
  .noise('poisson')
  .write(`${output}/main.jpg`, function(err){
    if (err) return console.dir(arguments)
    console.log('modified image')
    gm(`${output}/main.jpg`)
    .resize(null, 1080 - size*1.2)
    .gravity('North')
    .colors(colorsnumber)
    .extent(1920, 1080)
    .gravity('South')
    .fontSize(size)
    .stroke("white", 1)
    .fill("black")
    .box('rgba(255,255,255, .9)') // for text "highlight / background"
    .drawText(0, size/4.6, typebeat)
    .colorize(red, green, blue)
    .write(`${output}/thumb.png`, function(err){
      if (err) return console.dir(arguments)
      console.log('made thumbnail')
      callback(null);
    })
  })
}