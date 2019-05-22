/** The positive integer update frequency in hours */
const updateIntervalHours = 1

/**
 * @param {() => void} fn
 */
export default function createScheduler (fn) {
  /** @type {(() => void) | null} */
  let clearUpdateSchedule

  function startUpdating () {
    stopUpdating()

    function scheduleNextUpdate () {
      const nextUpdate = new Date()
      nextUpdate.setHours(nextUpdate.getHours() + updateIntervalHours, 0, 0, 0)
      console.info(`Scheduled next update at ${nextUpdate}`)
      clearUpdateSchedule = scheduleAt(nextUpdate, () => {
        fn()
        scheduleNextUpdate()
      })
    }

    scheduleNextUpdate()
  }

  function stopUpdating () {
    if (clearUpdateSchedule) {
      clearUpdateSchedule()
      clearUpdateSchedule = null
    }
  }

  return {startUpdating, stopUpdating}
}

/**
 * Run callback at time or a bit later but never earlier
 *
 * @param {Date} time
 * @param {() => void} callback
 * @returns {() => void} function to clear the schedule
 */
function scheduleAt (time, callback) {
  /** @type {number} */
  let handle

  /**
   * @param {Date} time
   * @param {() => void} callback
   */
  function _scheduleAt (time, callback) {
    const remainingTime = +time - +new Date()
    if (remainingTime > 0) {
      handle = setTimeout(() => _scheduleAt(time, callback), remainingTime)
    } else {
      callback()
    }
  }

  _scheduleAt(time, callback)

  return function clearSchedule () {
    clearTimeout(handle)
  }
}
