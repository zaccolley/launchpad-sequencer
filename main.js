import { cloneArray } from './helpers.js'
import { initLaunchpad } from './launchpad.js'

initLaunchpad().then(launchpad => {
  const state = {
    bpm: 200, // beats per minute
    beats: []
  }

  function initaliseState () {
    const beatRow = Array.from({ length: launchpad.GRID_SIZE }, () => false)
    const beats = Array.from({ length: launchpad.GRID_SIZE }, () => cloneArray(beatRow))
    state.beats = beats

    console.log('Initial state', state)
  }
  initaliseState()

  function clearLaunchpad () {
    launchpad.fill('blank')
  }

  function handlePadUpEvents (event) {
    const message = event.detail

    if (message.grid) {
      handleGridPadPress(message)
    }
  }

  function handleGridPadPress (message) {
    const { x, y } = message.position

    const currentBeatState = state.beats[y][x]
    state.beats[y][x] = !currentBeatState

    launchpad.setPad({
      position: { x, y },
      value: state.beats[y][x] ? 'orange' : 'blank'
    })
  }

  function loop (callback) {
    const MINUTE = 60 * 1000
    const intervalTime = MINUTE / state.bpm

    let position = 0

    setInterval(() => {
      callback(position)

      position++

      if (position > launchpad.GRID_SIZE - 1) {
        position = 0
      }
    }, intervalTime)
  }

  loop((currentPadPosition) => {
    const firstPad = currentPadPosition === 0

    for (let y = 0; y < launchpad.GRID_SIZE; y++) {
      const beatRow = state.beats[y]

      const currentPadActive = beatRow[currentPadPosition]
      const currentPad = {
        position: {
          x: currentPadPosition,
          y
        },
        value: currentPadActive ? 'red' : 'green'
      }
      launchpad.setPad(currentPad)

      const previousPadPosition = currentPadPosition - 1
      const previousPadActive = beatRow[previousPadPosition]
      const previousPad = {
        position: {
          x: firstPad ? launchpad.GRID_SIZE - 1 : previousPadPosition,
          y
        },
        value: previousPadActive ? 'orange' : 'blank'
      }
      launchpad.setPad(previousPad)
    }
  })

  console.info('Launchpad ready', launchpad)
  launchpad.input.addEventListener('padup', handlePadUpEvents)

  clearLaunchpad()
})
.catch(reason => {
  console.error('Launchpad error', reason)
})

