const state = generateState();

function generatePad() {
  const pad = {
    active: false
  };

  return pad;
}

function generatePads() {
  const padAmount = 8;
  const pads = [];

  for (let i = 0; i < padAmount; i++) {
    const pad = generatePad();
    pads.push(pad);
  }

  return pads;
}

function generateRows() {
  const rowAmount = 8;
  const rows = [];

  for (let i = 0; i < rowAmount; i++) {
    const pads = generatePads();
    rows.push(pads);
  }

  return rows;
}

function generatePages() {
  // one page for now
  return [
    {
      rows: generateRows()
    }
  ];
}

function generateState() {
  const view = {
    name: 'beats',
    pageNo: 0
  };

  const beats = {
    pages: generatePages()
  };

  return {
    bpm: 100,
    view,
    beats
  }
}

launchpad().then(pads => {
  main();

  function getState() {
    return state;
  }

  function mapBeatToPad(rowNo, padNo) {
    return { x: padNo, y: rowNo };
  }

  function setState(message) {
    const existingItemIndex = state.findIndex(item => {
      return item.id === message.id;
    });

    if (existingItemIndex !== -1) {
      state[existingItemIndex] = message;
    } else {
      state.push(message);
    }
  }

  const drum1 = document.querySelector('.drum-1');
  const drum2 = document.querySelector('.drum-2');
  const drum3 = document.querySelector('.drum-3');

  const audio = [
    drum1, drum2, drum3, drum1, drum1, drum1, drum1, drum1, drum1, drum1
  ];

  function musicLoop() {
    const beatsInLoop = 8;
    let beatCount = 1;
    let previousBeat = beatsInLoop;

    const musicLooplol = function() {
      const page = state.beats.pages[state.view.pageNo];
      const rows = page.rows;

      for (let rowCount = 0; rowCount < rows.length; rowCount++) {
        const row = rows[rowCount];

        const previousBeatItem = row[previousBeat - 1];
        const currentBeatItem = row[beatCount - 1];

        const prevColour = previousBeatItem.active ? 'red' : 'blank';
        pads.sendMessage(mapBeatToPad(rowCount, previousBeat - 1), prevColour);

        const currColour = currentBeatItem.active ? 'green' : 'yellow';
        pads.sendMessage(mapBeatToPad(rowCount, beatCount - 1), currColour);

        if (currentBeatItem.active) {
          audio[rowCount].cloneNode().play();
        }
      }

      previousBeat = beatCount;

      if (beatCount === beatsInLoop) {
        beatCount = 1;
      } else {
        beatCount++;
      }

      const minuteInMilliseconds = 60 * 1000;
      const beatInterval = minuteInMilliseconds / state.bpm;
      setTimeout(musicLooplol, beatInterval);
    }

    musicLooplol();
  }

  function main() {
    setupEventListener();
    clearBoard();
    musicLoop();
  }

  function setupEventListener() {
    pads.events.addEventListener('up', e => handleMessage(e.detail));
    window.addEventListener('beforeunload', clearBoard);
  }

  function handleMessage(message) {
    if (state.view.name === 'beats') {
      if (typeof message.circle !== 'undefined') {
        if (message.circle === 'A') {
          if (state.bpm < 1000) {
            state.bpm += 10;
          }
          console.info('BPM:', state.bpm);
        }

        if (message.circle === 'B') {
          if (state.bpm > 10) {
            state.bpm -= 10;
          }
          console.info('BPM:', state.bpm);
        }
      }

      if (typeof message.x !== 'undefined' && typeof message.y !== 'undefined') {
        const page = state.beats.pages[state.view.pageNo];
        const row = page.rows[message.y];
        const pad = row[message.x];

        if (pad.active) {
          pads.sendMessage(message, 'blank');
          pad.active = false;
        } else {
          pads.sendMessage(message, 'red');
          pad.active = true;
        }
      }
    }
  }

  function clearBoard() {
    pads.sendMessageAll('blank');
  }
})
.catch(console.error);
