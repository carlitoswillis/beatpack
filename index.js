const fs = require('fs');
const path = require('path');
const Lame = require("node-lame").Lame;
const archiver = require('archiver');

const encodeMp3 = (np) => {

  const encoder = new Lame({
    output: `${np}/${name}.mp3`,
    bitrate: 128
  }).setFile(`${np}/stems/${name}.wav`);

  encoder
    .encode()
    .then(() => {
      console.log('done converting to mp3!')
      // process.exit();
      })
      .catch(error => {
        // Something went wrong
        console.log('something went wrong!')
        console.error(error);
        // process.exit();
    });
}

const zipFolder = (fp) => {
  fs.readdir(`${fp}/stems`, (err, files) => {
    const output = fs.createWriteStream(`${fp}/../${name}.zip`);
    const archive = archiver('zip');
    output.on('close', function () {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
    });
    process.stdout.write('copying the following files...\n')
    for (x of files) {
      process.stdout.write(x);
      process.stdout.write('\n')
    }
    archive.on('error', function(err){
      throw err;
    });
    archive.pipe(output);
    // append files from a sub-directory and naming it `new-subdir` within the archive (see docs for more options):
    archive.directory(fp, false);
    archive.finalize();
  });
}

const namePath = `/Users/carlitoswillis/Google\ Drive\ (carlitoswillis@berkeley.edu)/Track\ Outs/2019/12.\ December/last\ (prod.\ barlitxs)\ 146\ bpm\ C\ minor`
const name = namePath.split('/').pop();


process.stdin.on('data', (input) => {
  encodeMp3(namePath);
  zipFolder(namePath);
  process.exit();
})
