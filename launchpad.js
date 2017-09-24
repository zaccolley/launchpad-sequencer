const COLORS = {
  red: 3,
  green: 48,
  orange: 18,
  yellow: 49,
  blank: 0
}

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

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value.toString());
}

function getLaunchPadInputOutput() {
  return new Promise((resolve, reject) => {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

    function isLaunchpad(string) {
      return string.toLowerCase().includes('launchpad');
    }

    function findAndCreateLaunchpadObject(midi) {
      const launchpad = {
        input: null,
        output: null
      };

      for (let entry of midi.inputs) {
        const input = entry[1];

        if (isLaunchpad(input.name)) {
          launchpad.input = input;
        }
      }

      for (let entry of midi.outputs) {
        const output = entry[1];

        if (isLaunchpad(output.name)) {
          launchpad.output = output;
        }
      }

      return launchpad;
    }

    function onMIDISuccess(midi) {
      const launchpad = findAndCreateLaunchpadObject(midi);

      if (!launchpad.input || !launchpad.output) {
        return reject("Couldn't find the Launchpad")
      }

      return resolve(launchpad);
    }

    function onMIDIFailure(msg) {
      return reject("Failed to get MIDI access: " + msg);
    }
  });
}

function mapNumber(message) {
  const number = message.number;

  if (message.top) {
    const topCircleButton = topCircleButtons[number];
    if (topCircleButton) {
      return { circle: topCircleButton };
    }

    return { error: "Couldn't work out the button" };
  }

  const rightCircleButton = rightCircleButtons[number];
  if (rightCircleButton) {
    return { circle: rightCircleButton };
  }

  if (number < 8) {
    return { x: number, y: 0 }
  }

  const x = number % 8;
  const y = Math.floor(number / 8) / 2;

  return { x, y };
}

function mapNumberBack(object) {
  if (object.error) {
    return;
  }

  if (object.circle) {
    const topCircleButton = getKeyByValue(topCircleButtons, object.circle);
    if (topCircleButton) {
      const number = parseInt(topCircleButton, 10);

      return {
        number,
        top: true
      }
    }

    const rightCircleButton = getKeyByValue(rightCircleButtons, object.circle);

    if (rightCircleButton) {
      const number = parseInt(rightCircleButton, 10);

      return {
        number,
        top: false
      }
    }

    return { error: 'Couldnt find the button' };
  }

  if (typeof object.x !== 'undefined' && typeof object.y !== 'undefined' ) {
    if (object.y === 0) {
      const number = object.x;
      return {
        number,
        top: false
      };
    }

    const number =((object.y * 2) * 8) + object.x

    return {
      number,
      top: false
    };
  }
}

function initLaunchpad() {
  return new Promise((resolve, reject) => {
  getLaunchPadInputOutput()
    .then(pad => {
      const events = document.createElement('div');

      startLoggingMIDIInput();

      function transformMessage(event) {
        const pressDown = event.data[2] === 127;
        const number = event.data[1];

        const message = {
          number,
          state: pressDown ? 'down' : 'up',
          top: event.data[0] === 176
        };

        return message;
      }

      function onMIDIMessage(event) {
        const message = transformMessage(event);

        // create and dispatch the event
        const messageEvent = new CustomEvent(message.state, { detail: mapNumber(message) });
        events.dispatchEvent(messageEvent);
      }

      function startLoggingMIDIInput() {
        pad.input.onmidimessage = onMIDIMessage;
      }

      function sendMessage(message, colour) {
        const data = mapNumberBack(message);
        const output = [data.top ? 176 : 144, data.number, COLORS[colour]];
        pad.output.send(output);
      }

      function sendMessageAll(colour) {
        ['1', '2', '3', '4', '5', '6', '7', '8'].map(circle => {
          sendMessage({ circle, top: true }, colour);
        });

        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(circle => {
          sendMessage({ circle }, colour);
        });

        for (let x = 0; x <= 7; x++) {
          for (let y = 0; y <= 7; y++) {
            sendMessage({ x, y }, colour);
          }
        }
      }

      return resolve({
        events,
        sendMessageAll,
        sendMessage
      })
    })
    .catch(error => {
      reject(error);
    });
  });
}
