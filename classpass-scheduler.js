#!/usr/bin/env casperjs

var fs = require('fs')
,   moment = require('moment')
,   casper = require('casper').create({
      verbose : true,
      viewportSize : { width: 1024, height: 768 }
    })
,   colorizer = require('colorizer').create('Colorizer')
,   logHeader = '[classpass-scheduler @ {{time}}] '

// regexes for string interpolation
,   studioNameRegex = /\{\{studioName\}\}/
,   classNameRegex = /\{\{className\}\}/
,   constraintRegex = /\{\{constraint\}\}/

// configuration
,   email = casper.cli.args[0]
,   password = casper.cli.args[1]
,   studios = JSON.parse(fs.read('./studios.json'))

// load custom modules
var log = require('./modules/log').bind(undefined, casper)
,   domUtils = require('./modules/dom-utilities')(casper)
,   constraints = require('./modules/constraints')(moment)

// check command-line args
if (!email || !password) {
  log('ERROR: must provide email and password as command-line arguments', 'ERROR')
  casper.exit(1)
}

// steps
casper.start('http://classpass.com/a/LoginNew', login)
casper.waitForUrl(/\/home/, loginHandler, loginFailHandler)
casper.then(iterateStudios.bind(undefined, eachStudio))
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

function iterateStudios (eachFn) {
  studios.forEach(eachFn)
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

  casper.waitFor(domUtils.isFormSubmittable).thenClick('#submit')

  // until POST goes thru - gotta be a better way of doing this
  casper.wait(5000).then(function () {
    log('successfully booked class "{{className}}" at "{{studioName}}"'
          .replace(classNameRegex, c.name)
          .replace(studioNameRegex, studio.name))
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
