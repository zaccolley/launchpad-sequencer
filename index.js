const AUDIO_FILES = [
  'drum1.mp3',
  'drum3.mp3',
  'drum2.mp3',
];

const INITIAL_BPM = 250;
const INITIAL_AMOUNT_OF_ACTIVE_PAGES = 4;

const state = generateState(INITIAL_BPM, INITIAL_AMOUNT_OF_ACTIVE_PAGES);

function changeBPM(amount, direction) {
  const MAX_BPM = 1000;

  if (direction === 'increase' && state.bpm < MAX_BPM) {
    state.bpm += amount;
  }

  if (direction === 'decrease' && state.bpm > amount) {
    state.bpm -= amount;
  }
}

function audio() {
  const audioItems = [];

  for (let i = 0; i < AUDIO_FILES.length; i++) {
    const audioFile = AUDIO_FILES[i];

    const newAudioItem = new Audio(audioFile);
    const newAudioItemPromise = new Promise(resolve => {
      newAudioItem.addEventListener('load', () => {
        newAudioItem(newAudioItem);
      });
      newAudioItem.load();
    });

    audioItems.push(newAudioItem);
  }

  return Promise.all(audioItems);
}

audio().then(audioItems => {
  initLaunchpad().then(launchpad => {
    launchpad.clear();

    function setupEventListener() {
      launchpad.events.addEventListener('up', e => handleMessage(e.detail));
      window.addEventListener('beforeunload', launchpad.clear);
    }
    setupEventListener();

    bpmButtonsSetup();
    updatePage();

    startMusicLoop();

    function startMusicLoop() {
      const beatsInLoop = 8;
      let beatCount = 1;
      let previousBeat = beatsInLoop;

      const musicLoopBeat = function() {
        const minuteInMilliseconds = 60 * 1000;
        const beatInterval = minuteInMilliseconds / state.bpm;

        if (state.playState === 'stopped') {
          for (let rowCount = 0; rowCount < audioItems.length; rowCount++) {
            launchpad.sendMessage({ x: beatCount - 1, y: rowCount }, 'yellow');
          }

          setTimeout(musicLoopBeat, beatInterval);
          return;
        }

        if (beatCount === 1) {
          updatePage();
        }

        launchpad.sendMessage({ circle: 'C' }, beatCount % 2 ? 'yellow' : 'blank');

        const page = state.pages[state.pageNo - 1];
        const rows = page.rows;

        for (let rowCount = 0; rowCount < audioItems.length; rowCount++) {
          const row = rows[rowCount];
          const pads = row.pads;

          const previousBeatItem = pads[previousBeat - 1];
          const currentBeatItem = pads[beatCount - 1];

          const prevColour = previousBeatItem.active ? 'red' : 'blank';
          launchpad.sendMessage({ x: previousBeat - 1, y: rowCount }, prevColour);

          const currColour = currentBeatItem.active ? 'green' : 'yellow';
          launchpad.sendMessage({ x: beatCount - 1, y: rowCount }, currColour);

          if (currentBeatItem.active) {
            audioItems[rowCount].cloneNode().play();
          }
        }

        previousBeat = beatCount;

        if (beatCount === beatsInLoop) {
          if (state.pageNo === state.pages.length) {
            state.pageNo = 1
          } else {
            state.pageNo = state.pageNo + 1;
          }

          beatCount = 1;
        } else {
          beatCount++;
        }

        setTimeout(musicLoopBeat, beatInterval);
      }

      musicLoopBeat();
    }

    function bpmButtonsSetup() {
      launchpad.sendMessage({ circle: 'A' }, 'green');
      launchpad.sendMessage({ circle: 'B' }, 'red');
    }

    function updatePage() {
      for (let i = 1; i <= state.pages.length; i++) {
        launchpad.sendMessage({ circle: i }, 'yellow');
      }

      launchpad.sendMessage({ circle: state.pageNo }, 'red');

      const rows = state.pages[state.pageNo - 1].rows;
      for (let rowCount = 0; rowCount < rows.length; rowCount++) {
        const pads = rows[rowCount].pads;
        for (let padCount = 0; padCount < pads.length; padCount++) {
          const pad = pads[padCount];
          const padColour = pad.active ? 'red' : 'blank';
          launchpad.sendMessage({ x: padCount, y: rowCount }, padColour);
        }
      }
    }

    function handlesBeatsViewCirclePads(message) {
      if (message.circle === 'A') {
        return changeBPM(10, 'increase');
      }

      if (message.circle === 'B') {
        return changeBPM(10, 'decrease');
      }

      if (message.circle === 'H') {
        if (state.playState === 'stopped') {
          state.playState = 'playing';
          launchpad.sendMessage({ circle: 'H' }, 'green');
        } else {
          state.playState = 'stopped';
          launchpad.sendMessage({ circle: 'H' }, 'red');
        }

        updatePage();

        return;
      }

      if (
        message.circle === 'C' ||
        message.circle === 'D' ||
        message.circle === 'E' ||
        message.circle === 'F' ||
        message.circle === 'G'
      ) {
        return;
      }

      if (message.circle === state.pageNo) {
        return;
      }

      // otherwise top circle buttons

      state.pageNo = parseInt(message.circle, 10);

      updatePage();
    }

    function handleMiddlePads(message) {
      const page = state.pages[state.pageNo - 1];
      const row = page.rows[message.y];
      const pad = row.pads[message.x];

      if (!pad.active) {
        launchpad.sendMessage(message, 'orange');
        pad.active = true;
        return;
      }

      launchpad.sendMessage(message, 'blank');
      pad.active = false;
    }

    function handleMessage(message) {
      const isRightCirclePads = typeof message.circle !== 'undefined';
      if (isRightCirclePads) {
        return handlesBeatsViewCirclePads(message)
      }

      const isMiddlePads = typeof message.x !== 'undefined' && typeof message.y !== 'undefined';
      if (isMiddlePads) {
        return handleMiddlePads(message);
      }
    }
  })
  .catch(console.error);
})
.catch(console.error);
