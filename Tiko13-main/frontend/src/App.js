import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [bookDetails, setBookDetails] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        // Fetching the book details (assuming the endpoint returns book details)
        const bookResponse = await axios.get('http://localhost:8000/book_detail/45');
        if (bookResponse.status === 200) {
          setBookDetails(bookResponse.data);
        }

        // Fetching the reviews for the book
        const reviewResponse = await axios.get('http://localhost:8000/book_detail/45/review');
        if (reviewResponse.status === 200) {
          setReviews(reviewResponse.data);  // Assuming this endpoint returns a list of reviews
        }
      } catch (error) {
        console.error('Error fetching data', error);
      }
    };

    fetchBookDetails();
  }, []);

  if (!bookDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{bookDetails.name}</h1>
      <p>Author: {bookDetails.author}</p>
      <p>Genre: {bookDetails.genre}</p>
      {/* Assuming views_count is part of the book details */}
      <p>Views: {bookDetails.views_count}</p>

      <h2>Reviews</h2>
      {reviews.length > 0 ? (
        <ul>
          {reviews.map(review => (
            <li key={review.id}>
              <p>{review.text}</p>
              <p>Views: {review.views_count}</p>
              <p>Likes: {review.like_count}</p>
              <p>Dislikes: {review.dislike_count}</p>
              {/* Add other review details you want to display */}
            </li>
          ))}
        </ul>
      ) : <p>No reviews available.</p>}
    </div>
  );
}

export default App;
