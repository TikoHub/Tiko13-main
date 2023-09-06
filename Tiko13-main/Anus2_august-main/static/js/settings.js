$(document).ready(function() {
    $('#webpage-settings-toggle').on('click', function() {
        $('#settings-content-area').load('web_settings');
    });

    $('#notifications-toggle').on('click', function() {
        $('#settings-content-area').load('notifications/');
    });

    $('#privacy-toggle').on('click', function() {
        $('#settings-content-area').load('privacy/');
    });
    $('#blacklist-toggle').on('click', function() {
        $('#settings-content-area').load('blacklist/');
    });
    $('#reviews-toggle').on('click', function() {
        $('#settings-content-area').load('reviews_settings/');
    });
    $('#social-toggle').on('click', function() {
        $('#settings-content-area').load('social/');
    });
    $('#my_books-toggle').on('click', function() {
        $('#settings-content-area').load('my_books/');
    });
    $('#my_series-toggle').on('click', function() {
        $('#settings-content-area').load('my_series/');
    });
    $('#my_account-toggle').on('click', function() {
        $('#settings-content-area').load('my_account/');
    });
    $('#security-toggle').on('click', function() {
        $('#settings-content-area').load('security/');
    });
    $('#purchase_history-toggle').on('click', function() {
        $('#settings-content-area').load('purchase_history/');
    });

    // ...add more event handlers for the other settings
});
