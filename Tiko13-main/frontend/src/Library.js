import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const UserLibrary = ({ username }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Define fetchBooks outside of useEffect
  const fetchBooks = useCallback(async (filterBy = '') => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`http://127.0.0.1:8000/users/api/${username}/library?filter_by=${filterBy}`);
      setBooks(response.data);
    } catch (err) {
      setError('Error fetching data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  // Use useEffect to call fetchBooks when the component mounts or username changes
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks, username]); // username is a dependency of useEffect

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>{username}'s Library</h1>
      <div>
        <button onClick={() => fetchBooks('reading')}>Reading</button>
        <button onClick={() => fetchBooks('liked')}>Liked</button>
        <button onClick={() => fetchBooks('wish_list')}>Wish List</button>
        <button onClick={() => fetchBooks('favorites')}>Favorites</button>
        <button onClick={() => fetchBooks('finished')}>Finished</button>
      </div>
      <ul>
        {books.map(book => (
          <li key={book.id}>
            <h2>{book.name}</h2>
            <p>Author: {book.author}</p>
            <p>Genre: {book.genre}</p>
            <img src={book.coverpage} alt={`${book.name} cover`} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserLibrary;
