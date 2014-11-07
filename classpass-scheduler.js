var fs = require('fs')
,   casper = require('casper').create({
      verbose : true,
      viewportSize : { width: 1024, height: 768 }
    })
,   colorizer = require('colorizer').create('Colorizer')
,   logHeader = '[classpass-scheduler @ {{time}}] '

// regexes for string interpolation
,   timeRegex = /\{\{time\}\}/
,   studioNameRegex = /\{\{studioName\}\}/
,   classNameRegex = /\{\{className\}\}/

// configuration
,   email = casper.cli.args[0]
,   password = casper.cli.args[1]
,   studios = JSON.parse(fs.read('./studios.json'))

if (!email || !password) {
  log('ERROR: must provide email and password as command-line arguments', 'ERROR')
  casper.exit(1)
}

// steps
casper.start('http://classpass.com/a/LoginNew', login)
casper.waitForUrl(/\/home/, loginHandler, loginFailHandler)
casper.then(iterateStudios)
casper.run()

function log (msg, type) {
  casper.echo(logHeader.replace(timeRegex , new Date().toLocaleString()) + msg, type || 'INFO')
}

function getAvailableClasses () {
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

function login () {
  log('connected to classpass')

  casper.fillSelectors('form.cl-login-form', {
    'input[name="email"]' : email,
    'input[name="pwd"]' : password,
    'input[name="remember_me"]' : 0
  }, true)
}

function loginHandler () {
  log('login successful')
}

function loginFailHandler () {
  log('login failed', 'ERROR')
  casper.exit(0)
}

function iterateStudios () {
  studios.forEach(eachStudio)
}

function eachStudio (studio) {
  casper.thenOpen('http://classpass.com/' + studio.url_slug, digestStudio.bind(undefined, studio))
}

function eachClass (studio, c) {

  var attended = studio.attended ? 'yes' : 'no'

  casper.thenOpen(c.real_class_url, function () {
    c.name = this.getTitle().replace(/\s\|.*/, '')

    log('attempting to book "{{className}}" at "{{studioName}}"'
          .replace(classNameRegex, c.name)
          .replace(studioNameRegex, studio.name))

    this.click('.reserve')
  })

  casper.waitForSelector('.modal', function () {
    this.click('input[name="passport_venue_attended"][value="' + attended +'"]')
  })

  casper.waitFor(isFormSubmittable).thenClick('#submit')

  // until POST goes thru - gotta be a better way of doing this
  casper.wait(5000).then(function () {
    log('successfully booked class "{{className}}" at {{studioName}}"'
          .replace(classNameRegex, c.name)
          .replace(studioNameRegex, studio.name))
  })
}

function digestStudio (studio) {
  log('checking studio "{{studioName}}"'.replace(studioNameRegex, studio.name))

  var totalAvailableClasses = getAvailableClasses()
  log(totalAvailableClasses.length + ' total available classe(s) at "{{studioName}}"'
                                       .replace(studioNameRegex, studio.name))

  if (!totalAvailableClasses.length) return false

  var desiredClasses = totalAvailableClasses.filter(doesClassMeetConstraints.bind(undefined, studio.constraints))
  log(desiredClasses.length + ' classe(s) matching constraints at "{{studioName}}"'
                                .replace(studioNameRegex, studio.name))

  if (!desiredClasses.length) return false

  desiredClasses.forEach(eachClass.bind(undefined, studio))
}
