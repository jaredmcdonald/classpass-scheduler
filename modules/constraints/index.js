
function constraintResolver (type, constraint, item) {
  return !constraint || constraint.indexOf(type === 'date' ?
                                            item.classDate : item.startTime) >= 0
}

// date formatting
var plusDaysRegex = /^\+(\d)+$/
,   dateFormat = 'YYYY-MM-DD'

module.exports = function (moment, plusDaysRegex, dateFormat) {
  return {
    doesClassMeetConstraints : function (constraints, item) {
      return !constraints ||
             (constraintResolver('date', constraints.desired_dates, item)) &&
             (constraintResolver('time', constraints.desired_times, item))
    },

    updateDate : function (constraint) {
      if (typeof constraint !== 'string') {
        return constraint
      }

      var match = constraint.match(plusDaysRegex)

      if (match && match[1]) {
        daysFromNow = parseInt(match[1])
        return moment().add(daysFromNow, 'days').format(dateFormat)
      }

      return constraint
    }
  }
}
