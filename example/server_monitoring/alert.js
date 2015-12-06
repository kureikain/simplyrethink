exports = module.exports = Alert

function Alert(storage, notifier) {
  this._storage = storage
  if (typeof notifier == 'object' && typeof notifier[0] != 'undefined') {
    this._notifier   = notifier
  } else {
    this._notifier   = [notifier]
  }
}

Alert.prototype.subscribe = function(notifier) {
  this._notifier.push(notifier)
}

Alert.prototype.watch = function() {
  var self = this
  this._storage.watch()
  this._storage.on('alertChange', function(alert) {
      console.log("get row", alert)
      self.inspect(alert)
  })
}

/**
 * Inspect a check result to see if we need alerting 
 */
Alert.prototype.inspect = function(checkResult) {
  var threshold = checkResult.website.threshold || 1000
  var message

  console.log(checkResult)
  if (checkResult.duration > threshold) {
    console.log(checkResult.website.uri, " takes more than ", threshold," to respond ", checkResult.duration, ". Alert needed")
    message = checkResult.website.uri + " takes more than "+ threshold+"ms to respond: "+ checkResult.duration
  }

  if (checkResult.statusCode != 200) {
    console.log(checkResult.website.uri, " returns code ", checkResult.statusCode,". Alert needed")
    message = checkResult.website.uri + " returns code"+ checkResult.statusCode+"ms to respond: " + checkResult.duration
  }

  console.log(this._notifier)
  var telegram = this._notifier[0];
  checkResult.website.subscribers.forEach(function(subscriber) {
    // Telegram is special, we will send notification use bot object
    if ('telegram' == subscriber.name) {
      console.log("** Will notify telegram")
      telegram.yellTo(message, subscriber.option)
      return
    }

    var noti =  require('./notifier/' + subscriber.name)(subscriber.option)
    noti.yell(message)
  }.bind(this))

}
