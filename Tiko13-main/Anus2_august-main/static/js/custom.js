$(document).ready(function() {
    // Handle the Like button click
    $('.like-button').click(function() {
        var commentId = $(this).data('comment-id');
        var likesCountElement = $('#likes-count-' + commentId);
        var csrfToken = $('input[name="csrfmiddlewaretoken"]').val();
        var url = '/like_comment/' + commentId + '/';

        // Send an AJAX request to increment the likes count
        $.ajax({
            url: url,
            method: 'POST',
            data: {
                csrfmiddlewaretoken: csrfToken
            },
            success: function(response) {
                // Update the likes count on success
                likesCountElement.text(response.likes_count);
            }
        });
    });
});
