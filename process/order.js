// - dict 1 = { task1: [...dependencies], task2 : [...dependencies], }
// - dict 2 = {task that is other tasks dependencies: [tasks that depend on that one], ...}
// - if the task has no dependencies [dict 1] it should go first / front of the list
// - then
// 'given a list of pairs of courses (A, B) where A is a req for B, return a valid ordering'

// use this object to sort by which task should go first

const generalOrder = [
  'mp3', 'squareArtWithImage', 'clearSquareArt', 'clearLogoSquareArt',
  'squareArtWithImageAndLogo', 'clearLogoRectangleArt', 'clearRectangleArt',
  'rectangleArtWithImage', 'rectangleArtWithImageAndLogo', 'squareVideoWithCoverArt',
  'squareVideoWithCoverArtAndLogo', 'squareVideoWithSourceVideo',
  'squareVideoWithSourceVideoAndClearLogo', 'rectangleVideoWithSourceVideo',
  'rectangleVideoWithSourceVideoAndClearLogo', 'rectangleVideoWithCoverArtAndLogo',
  'addSoundWaves', 'cleanUp', 'zip', 'upload'];

const position = {};
generalOrder.forEach((element, index) => {
  position[element] = index;
});

const dependencies = {
  zip: ['cleanUp'],
  mp3: [],
  clearSquareArt: [],
  clearRectangleArt: [],
  clearLogoSquareArt: [],
  squareArtWithImage: [],
  squareArtWithImageAndLogo: ['squareArtWithImage'],
  clearLogoRectangleArt: [],
  rectangleArtWithImage: [],
  rectangleArtWithImageAndLogo: ['rectangleArtWithImage'],
  squareVideoWithCoverArt: ['squareArtWithImage'],
  squareVideoWithCoverArtAndLogo: ['squareArtWithImageAndLogo'],
  squareVideoWithSourceVideo: ['clearSquareArt'],
  squareVideoWithSourceVideoAndClearLogo: ['clearLogoSquareArt'],
  rectangleVideoWithSourceVideo: ['clearRectangleArt'],
  rectangleVideoWithSourceVideoAndClearLogo: ['clearLogoRectangleArt'],
  rectangleVideoWithCoverArt: ['rectangleArtWithImage'],
  rectangleVideoWithCoverArtAndLogo: ['rectangleArtWithImageAndLogo'],
  addSoundWaves: [],
  cleanUp: [],
  upload: ['squareArtWithImage', 'zip', 'mp4'],
};

const { tasks } = info;
const tasksOrderedByDependencies = [];
const queue = [];
const queued = new Set();

while (queue.length || tasks.length) {
  const currTask = queue.splice(0, 1);
  const currTaskDependencies = dependencies[currTask];
  if (currTaskDependencies.length) {
    for (let i = 0; i < currTaskDependencies.length; i += 1) {
      const dependency = currTaskDependencies[i];
      if (!queued.has(dependency)) {
        queue.push(dependency);
        queued.add(dependency);
      }
    }
    queue.push(currTask);
  } else {
    tasksOrderedByDependencies.push(currTask);
  }
  if (!queue.length && tasks.length) {
    queue.push(tasks.splice(0, 1));
  }
}
