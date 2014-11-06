var _ = require('./lib/underscore')
,   casper = require('casper').create({
      clientScripts : [
        'lib/jquery-2.1.1.js'
      ]
    })
,   colorizer = require('colorizer').create('Colorizer')
,   logHeader = '[classpass-scheduler @ {{time}}] '
,   timeRegex = /\{\{time\}\}/
,   email = casper.cli.args[0]
,   password = casper.cli.args[1]

function log (msg, type) {
  casper.echo(logHeader.replace(timeRegex , new Date().toLocaleString()) + msg, type || 'INFO')
}

if (!email || !password) {
  log('ERROR: must provide email and password as command-line arguments', 'ERROR')
  casper.exit(1)
}

casper.start('http://www.classpass.com/a/LoginNew', function () {
  log('initialized')

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

casper.run()
