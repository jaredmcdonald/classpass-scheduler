var timeRegex = /\{\{time\}\}/

module.exports = function log (casper, msg, type) {
  casper.echo(logHeader.replace(timeRegex , new Date().toLocaleString()) + msg, type || 'INFO')
}
