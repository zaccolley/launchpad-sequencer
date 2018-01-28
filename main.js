import {
  initLaunchpad,
  mapMidiDataToMessage,
  mapMessageToMidiData
} from './launchpad.js'

const GRID_SIZE = 8

initLaunchpad().then(launchpad => {
  function fillLaunchpad (color) {
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        launchpad.output.send(mapMessageToMidiData({
          grid: true,
          position: { x, y },
          value: color
        }))
      }
    }

    const circlePadPositions = 'ABCDEFGH12345678'
    for (let i = 0; i < circlePadPositions.length; i++) {
      const circlePadPosition = circlePadPositions[i]
      launchpad.output.send(mapMessageToMidiData({
        circle: true,
        position: circlePadPosition,
        value: color
      }))
    }
  }

  function clearLaunchpad () {
    fillLaunchpad('blank')
  }

  function handleMidiMessages (event) {
    const midiData = event.data

    const message = mapMidiDataToMessage(midiData)

    launchpad.output.send(
      mapMessageToMidiData({
        grid: message.grid,
        circle: message.circle,
        position: message.position,
        value: 'green'
      })
    )

    // console.log(message)
  }

  console.log('Launchpad ready', launchpad)
  launchpad.input.addEventListener('midimessage', handleMidiMessages)
  clearLaunchpad()
})
.catch(reason => {
  console.error('Launchpad error:', reason)
})
