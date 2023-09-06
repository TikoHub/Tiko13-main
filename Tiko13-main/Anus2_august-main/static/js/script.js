$(document).ready(function() {
  // Handle the like button click event
  $(".like-button").click(function(event) {
    event.preventDefault();
    var commentId = $(this).closest("form").data("comment-id");
    var url = "/comment/like/" + commentId + "/";

    // Send an AJAX POST request to the server
    $.ajax({
      type: "POST",
      url: url,
      data: {
        csrfmiddlewaretoken: "{{ csrf_token }}"
      },
      success: function(response) {
        // Update the like count on the page
        $(".like-count").html(response.like_count);
      },
      error: function(xhr, textStatus, errorThrown) {
        console.log("Error:", errorThrown);
      }
    });
  });

  // Handle the dislike button click event
  $(".dislike-button").click(function(event) {
    event.preventDefault();
    var commentId = $(this).closest("form").data("comment-id");
    var url = "/comment/dislike/" + commentId + "/";

    // Send an AJAX POST request to the server
    $.ajax({
      type: "POST",
      url: url,
      data: {
        csrfmiddlewaretoken: "{{ csrf_token }}"
      },
      success: function(response) {
        // Update the dislike count on the page
        $(".dislike-count").html(response.dislike_count);
      },
      error: function(xhr, textStatus, errorThrown) {
        console.log("Error:", errorThrown);
      }
    });
  });
});
