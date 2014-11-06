var fs = require('fs')
,   _ = require('./lib/underscore')
,   casper = require('casper').create({
      clientScripts : [
        'lib/jquery-2.1.1.js'
      ],
      viewportSize : { width: 1024, height: 768 }
    })
,   colorizer = require('colorizer').create('Colorizer')
,   logHeader = '[classpass-scheduler @ {{time}}] '
,   timeRegex = /\{\{time\}\}/
,   studioNameRegex = /\{\{studioName\}\}/
,   email = casper.cli.args[0]
,   password = casper.cli.args[1]
,   studios = JSON.parse(fs.read('./studios.json'))

function log (msg, type) {
  casper.echo(logHeader.replace(timeRegex , new Date().toLocaleString()) + msg, type || 'INFO')
}

function getAvailableClasses (constraints) {
  return casper.evaluate(function () {
    var availableClasses = []

    $('.venue-class').each(function () {
      var $class = $(this)
      if ($class.find('a.cl-auth.reserve').length) {
        availableClasses.push($.extend($class.data(), {
          real_class_url : $class.find('a.class-link').attr('href')
        }))
      }
    })

    return availableClasses
  })
}

function isFormSubmittable () {
  return casper.evaluate(function () {
    return !$('#submit').hasClass('disabled')
  })
}

function doesClassMeetConstraints (constraints, item) {
  return !constraints ||
         (!constraints.desired_dates || constraints.desired_dates.indexOf(item.classDate) >= 0) &&
         (!constraints.desired_times || constraints.desired_times.indexOf(item.startTime) >= 0)
}

if (!email || !password) {
  log('ERROR: must provide email and password as command-line arguments', 'ERROR')
  casper.exit(1)
}

casper.start('http://classpass.com/a/LoginNew', function () {
  log('connected to classpass')

  this.fillSelectors('form.cl-login-form', {
    'input[name="email"]' : email,
    'input[name="pwd"]' : password,
    'input[name="remember_me"]' : 0
  }, true)
})

casper.waitForUrl(/\/home/, function () {
  log('login successful')
}, function () {
  log('login failed', 'ERROR')
  casper.exit(0)
})

casper.then(function () {
  studios.forEach(function (studio) {

    casper.thenOpen('http://classpass.com/' + studio.url_slug, function () {
      log('checking studio "{{studioName}}"'.replace(studioNameRegex, studio.name))

      var totalAvailableClasses = getAvailableClasses()
      log(totalAvailableClasses.length + ' total available classe(s) at "{{studioName}}"'
                                           .replace(studioNameRegex, studio.name))

      if (!totalAvailableClasses.length) return false

      var desiredClasses = _.filter(totalAvailableClasses, _.partial(doesClassMeetConstraints, studio.constraints))
      log(desiredClasses.length + ' classe(s) matching constraints at "{{studioName}}"'
                                    .replace(studioNameRegex, studio.name))

      if (!desiredClasses.length) return false

      desiredClasses.forEach(function (c) {

        var attended = studio.attended ? 'yes' : 'no'

        casper.thenOpen(c.real_class_url, function () {
          log('attempting to book ' + this.getTitle().replace(/\s\|.*/, ' at "{{studioName}}"'
                                                     .replace(studioNameRegex, studio.name)))


      })
    })
  })
})

casper.run()
