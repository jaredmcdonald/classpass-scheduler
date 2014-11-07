module.exports = function (casper) {
  return {
    getAvailableClasses : function () {
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
    },
    isFormSubmittable : function () {
      return casper.evaluate(function () {
        return !$('#submit').hasClass('disabled')
      })
    }
  }
}
