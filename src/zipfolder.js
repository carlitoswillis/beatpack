const { fs, archiver, emitter } = require('./imports');

module.exports = (fp, name) => {
  fs.readdir(`${fp}/stems`, (err, files) => {
    const output = fs.createWriteStream(`${fp}/../${name}.zip`);
    const archive = archiver('zip');
    output.on('close', function () {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
      emitter.emit('video');
    });
    console.log(`zipping ${files.length} files...\n`);
    archive.on('error', function(err){
      throw err;
    });
    archive.pipe(output);
    // append files from a sub-directory and naming it `new-subdir` within the archive (see docs for more options):
    archive.directory(fp, false);
    archive.finalize();
  });
}