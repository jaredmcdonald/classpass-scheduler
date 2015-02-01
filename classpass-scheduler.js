#!/usr/bin/env casperjs

var fs = require('fs')
,   moment = require('moment')
,   casper = require('casper').create()
,   colorizer = require('colorizer').create('Colorizer')

// regexes for string interpolation
,   studioNameRegex = /\{\{studioName\}\}/
,   classNameRegex = /\{\{className\}\}/
,   constraintRegex = /\{\{constraint\}\}/
,   attemptCounterRegex = /\{\{attemptCounter\}\}/

// configuration
,   email = casper.cli.options.email
,   password = casper.cli.options.password
,   mode = casper.cli.options.mode || 'studio'
,   studios = []
,   classes = []

// load log module
var log = require('./modules/log').bind(undefined, casper)

if (mode === 'studio') {
  try {
    studios = JSON.parse(fs.read('./studios.json'))
  } catch (e) {
    log('Can\'t find ./studios.json. Aborting...', 'ERROR')
    casper.exit(1)
  }
} else {
  // mode === 'class'
  try {
    classes = JSON.parse(fs.read('./classes.json'))
  } catch (e) {
    log('Can\'t find ./classes.json. Aborting...', 'ERROR')
    casper.exit(1)
  }
}

// load custom modules
var domUtils = require('./modules/dom-utilities')(casper)
,   constraints = require('./modules/constraints')(moment)

// check command-line options
var optionsFailure = false
,   USAGE_INFO = 'Usage: casperjs classpass-scheduler.js --email=\'your.email@example.com\' --password=\'yourClasspassPassword\' [--mode=studio|class]'

if (!email) {
  log('ERROR: missing email', 'ERROR')
  optionsFailure = true
}
if (!password) {
  log('ERROR: missing password', 'ERROR')
  optionsFailure = true
}
if (optionsFailure) {
  log(USAGE_INFO, 'ERROR')
  casper.exit(1)
}

// steps
casper.start('http://classpass.com/a/LoginNew', login)
casper.waitForUrl(/\/home/, loginHandler, loginFailHandler)
if (mode === 'studio') {
  casper.then(studioMode.bind(undefined, eachStudio.bind(undefined, 1)))
} else {
  // mode === 'class'
  casper.then(classMode)
}

casper.run()

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

function studioMode (eachFn) {
  studios.forEach(eachFn)
}

function classMode () {
  classes.forEach(function (c) {
    c.real_class_url = c.url
    eachClass({ name : c.studio, attended : c.attended }, c)
  })
}

function eachStudio (attempt, studio) {
  var maxAttempts = 5

  casper.thenOpen('http://classpass.com/' + studio.url_slug, function () {
    log('attempt {{attemptCounter}} at studio "{{studioName}}"'
          .replace(attemptCounterRegex, attempt + ' of ' + maxAttempts)
          .replace(studioNameRegex, studio.name))

    if (!digestStudio(studio) && attempt < maxAttempts) {
      eachStudio(attempt + 1, studio)
    }
  })
}

function eachClass (studio, c) {

  var attended = studio.attended ? 'yes' : 'no'

  casper.thenOpen(c.real_class_url, function () {
    c.name = this.getTitle().replace(/\s\|.*/, '')

    var classAtStudioString = '{{className}}{{studioName}}'
        .replace(classNameRegex, c.name)
        .replace(studioNameRegex, studio.name ? ' at ' + studio.name : '')

    log('attempting to book ' + classAtStudioString)

    if (this.exists('.reserve') && !this.exists('.reserve.disabled')) {
      this.click('.reserve')
      this.waitForSelector('.modal', function () {
        this.click('input[name="passport_venue_attended"][value="' + attended +'"]')
      })

      this.waitFor(domUtils.isFormSubmittable).thenClick('#submit')

      // until POST goes thru - gotta be a better way of doing this
      this.wait(5000).then(function () {
        log('successfully booked ' + classAtStudioString
            .replace(classNameRegex, c.name)
            .replace(studioNameRegex, studio.name))
      })
    } else if (this.exists('.reserved')) {
      log('you already have ' + classAtStudioString + ' booked'
          .replace(classNameRegex, c.name)
          .replace(studioNameRegex, studio.name))
    } else {
      log(classAtStudioString + ' is not available'
          .replace(classNameRegex, c.name)
          .replace(studioNameRegex, studio.name))
    }
  })
}

function digestStudio (studio) {
  log('checking studio "{{studioName}}"'.replace(studioNameRegex, studio.name))

  var totalAvailableClasses = domUtils.getAvailableClasses()
  log(totalAvailableClasses.length + ' total available classe(s) at "{{studioName}}"'
                                       .replace(studioNameRegex, studio.name))

  if (!totalAvailableClasses.length) return false

  studio.constraints.desired_dates = constraints.updateDate(studio.constraints.desired_dates)

  var desiredClasses = totalAvailableClasses.filter(constraints.doesClassMeetConstraints.bind(undefined, studio.constraints))
  log(desiredClasses.length + ' classe(s) matching constraints at "{{studioName}}"'
                                .replace(studioNameRegex, studio.name))

  if (!desiredClasses.length) return false

  desiredClasses.forEach(eachClass.bind(undefined, studio))
}
