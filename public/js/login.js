
$(function () {
    var lastError = localStorage.getItem('last_error');
    if(typeof lastError != "undefined" && lastError != null) {
        $('#login-error-cont').append('<div class="error-msg">' + lastError + '</div>')
        localStorage.removeItem('last_error');
    }

    $('#login-form').submit(function(event) {

        if (typeof(Storage) !== 'undefined') {
            // Store
            localStorage.setItem('username', $('#login-name').val());
        } else {
            // Error
        }
        
    });
});