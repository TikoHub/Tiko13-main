$(document).ready(function() {
    $('.toggle-buttons button').click(function() {
        // Remove active class from all buttons
        $('.toggle-buttons button').removeClass('active');

        // Add active class to the clicked button
        $(this).addClass('active');

        // Get the id of the clicked button
        var toggleId = $(this).attr('id');

        // Remove the "-toggle" suffix from toggleId
        toggleId = toggleId.replace('-toggle', '');

        // Get the username from the data attribute
        var username = $(this).data('username');

        // Perform AJAX request to fetch content based on the toggle button clicked
        $.ajax({
            url: '/users/get_' + toggleId + '_content/' + username + '/',
            type: 'GET',
            success: function(response) {
                // Update the content area with the received HTML content
                $('#content-area').html(response);
            },
            error: function(xhr) {
                console.log('Error:', xhr.status);
            }
        });
    });
});
