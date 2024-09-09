import React, {useState, useEffect, useHistory, useCallback, useRef, useLayoutEffect,createContext, useContext} from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate, NavLink, useParams,useLocation, Switch, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import apiUrl from '../../../../apiUrl.jsx';

const BookLibraryItem = ({ filterBy }) => {
    const [books, setBooks] = useState([]);
    const token = localStorage.getItem('token');
    const decodedToken = jwtDecode(token);
    const username = decodedToken.username;
    const [isWide, setIsWide] = useState(true); // Состояние для отслеживания текущей ширины элементов

    const handleWidthToggle = () => {
      setIsWide(!isWide); // Переключаем состояние при нажатии на кнопку
    };
  
    useEffect(() => {
      const fetchBooks = async () => {
        try {
          // Получаем токен из localStorage или любого другого места, где он хранится
          const token = localStorage.getItem('token');
    
          if (!token) {
            console.error('Токен не найден');
            return;
          }
    
          // Добавляем токен к заголовку Authorization
          const config = {
            headers: {
              Authorization: `Bearer ${token}`
            }
          };
    
          const response = await axios.get(`${apiUrl}/users/api/${username}/library?filter_by=${filterBy}`, config);
          const fetchedBooks = response.data;
    
          if (Array.isArray(fetchedBooks)) {
            setBooks(fetchedBooks);
          } else {
            console.error('Данные не являются массивом:', fetchedBooks);
          }
        } catch (error) {
          console.error('Ошибка при получении книг', error);
        }
      };
    
      fetchBooks();
    
    }, [filterBy, username]);
  
    return (
      <div className='library_items_mobile'>
        {books.map((book) => (
          <div className='library_item_mobile' key={book.id}>
            <div className='library__item_content'>
              <a href={`book_detail/${book.id}`}><div className='library_item-coverpage_mobile'><img src={book.coverpage} alt={book.name} /></div></a>
              <a href={`book_detail/${book.id}`}><div className='book-name_mobile'>{book.name}</div></a>
              <div className='book-author'>{book.author}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

export default BookLibraryItem;