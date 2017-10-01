function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value.toString());
}

const TOP_CIRCLE_BUTTON_VALUE = 176;
const NOT_TOP_CIRCLE_BUTTON_VALUE = 144;
const PRESSED_DOWN_VALUE = 127;

const COLORS = {
  red: 3,
  green: 48,
  orange: 18,
  yellow: 49,
  blank: 0
};

const topCircleButtons = {
  104: '1',
  105: '2',
  106: '3',
  107: '4',
  108: '5',
  109: '6',
  110: '7',
  111: '8'
};

const rightCircleButtons = {
    8: 'A',
   24: 'B',
   40: 'C',
   56: 'D',
   72: 'E',
   88: 'F',
  104: 'G',
  120: 'H'
};

// converts pad number into x, y grid position
function mapNumberToGridPosition(number) {
  const x = number % 8;
  const y = Math.floor(number / 8) / 2;
  const gridPosition = { x, y };

  return gridPosition;
}

// coverts x, y grid position into pad number
function mapGridPositionToNumber(gridPosition) {
  const number = ((gridPosition.y * 2) * 8) + gridPosition.x;

  return number;
}

function mapMidiDataToMessage(midiData) {
  console.log(midiData);
  const number = midiData[1];
  const isPressedDown = midiData[2] === PRESSED_DOWN_VALUE;
  const value = isPressedDown ? 'down': 'up';

  const hasTopCircleButtonBeenPressed = midiData[0] === TOP_CIRCLE_BUTTON_VALUE;

  if (hasTopCircleButtonBeenPressed) {
    return {
      circle: true,
      position: topCircleButtons[number],
      value
    };
  }

  if (rightCircleButtons.hasOwnProperty(number)) {
    return {
      circle: true,
      position: rightCircleButtons[number],
      value
    };
  }

  return {
    grid: true,
    position: mapNumberToGridPosition(number),
    value
  };
}

function mapMessageToMidiData(message) {
  const color = COLORS[message.value];

  if (typeof color === 'undefined') {
    return console.error(message.value, 'is not a valid colour');
  }

  const isGridPosition = message.grid;
  if (isGridPosition) {
    return [
      NOT_TOP_CIRCLE_BUTTON_VALUE,
      mapGridPositionToNumber(message.position),
      color
    ];
  }

  const rightCircleButtonPosition = getKeyByValue(rightCircleButtons, message.position);
  if (rightCircleButtonPosition) {
    return [
      NOT_TOP_CIRCLE_BUTTON_VALUE,
      parseInt(rightCircleButtonPosition, 10),
      color
    ];
  }

  const topCircleButtonPosition = getKeyByValue(topCircleButtons, message.position);
  if (topCircleButtonPosition) {
    return [
      TOP_CIRCLE_BUTTON_VALUE,
      parseInt(topCircleButtonPosition, 10),
      color
    ];
  }
}


initLaunchpad()
  .then(launchpad => {
    launchpad.output.send(mapMessageToMidiData({ grid: true, position: { x: 0, y: 0 }, value: 'red' }));
    launchpad.output.send(mapMessageToMidiData({ circle: true, position: 'B', value: 'red' }));
    launchpad.output.send(mapMessageToMidiData({ circle: true, position: 'G', value: 'red' }));
    launchpad.output.send(mapMessageToMidiData({ circle: true, position: '5', value: 'red' }));

    launchpad.input.addEventListener('midimessage', function(event) {
      const midiData = event.data;

      const message = mapMidiDataToMessage(midiData);

      console.log(message);
    });

    console.log('woah its the launchpad', launchpad);
  })
  .catch(reason => {
    console.error('Launchpad error:', reason);
  });


// successful, return the object with inputs and outputs
// not successful, return a error message
function initLaunchpad() {
  return new Promise((resolve, reject) => {
    const launchpad = {};

    navigator.requestMIDIAccess().then(handleMidiAccessSuccess, handleMidiAccessFailure);

    function isMidiItemLaunchpad(item) {
      return item.name.includes('Launchpad Mini');
    }

    function handleMidiAccessSuccess(midiAccess) {
      console.log('MIDI API ready');

      for (let entry of midiAccess.inputs) {
        const input = entry[1];

        if (isMidiItemLaunchpad(input)) {
          launchpad.input = input;
        }
      }

      for (let entry of midiAccess.outputs) {
        const output = entry[1];

        if (isMidiItemLaunchpad(output)) {
          launchpad.output = output;
        }
      }

      if (!launchpad.input || !launchpad.output) {
        return console.error("Couldn't detect Launchpad");
      }

      return resolve(launchpad);
    }

    function handleMidiAccessFailure(message) {
      return reject(message);
    }
  });
}
