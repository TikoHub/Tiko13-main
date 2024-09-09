import React, {useState, useEffect, useHistory, useCallback, useRef, useLayoutEffect,createContext, useContext} from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate, NavLink, useParams,useLocation, Switch, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import apiUrl from '../../../../apiUrl.jsx';
import { jwtDecode } from 'jwt-decode';
import {SearchContext} from '../../../../context/SearchContext.jsx'


function BookItemMobile({ onScroll }) { 
    const [books, setBooks] = useState([]);
    const { searchQuery } = useContext(SearchContext);
    const bookItemRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
          const currentScrollPos = bookItemRef.current.scrollTop;
          onScroll(currentScrollPos); // Вызываем функцию обратного вызова, передавая текущую позицию прокрутки
        };
      
        const bookItemElement = bookItemRef.current;
        if (bookItemElement) {
          bookItemElement.addEventListener('scroll', handleScroll);
      
          return () => {
            bookItemElement.removeEventListener('scroll', handleScroll);
          };
        }
      }, [onScroll]);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await axios.get(`${apiUrl}/api/`);
          setBooks(response.data);
        } catch (error) {
          console.error('Error fetching books:', error);
        }
      };
  
      fetchData();
    }, []);
  
    const filteredBooks = books.filter(book => 
      book.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  

  
    return (
      <div className='book-item_mobile'>
  
          {filteredBooks.map(book => (
          <div className='colum_mobile' key={book.id}>
            <a href={`book_detail/${book.id}`}><div className='book-coverpage_mobile'><div className='image-overlay'>
            <a className='books-authorname_mobile' href={`profile/${book.author}`}>{book.author}</a>
                <a href={`profile/${book.author}`}><div className='book_author__img_mobile'><img src={book.author_profile_img} alt={book.author} /></div></a></div>
                <img src={book.coverpage} alt={book.name} /></div></a>
            <div className='book-info_mobile'>
                <a href={`book_detail/${book.id}`} className='books-name_mobile'>{book.name}</a>
                <div className='book_mobile_counts'>
                    <div className='book_mobile_views'><svg width="22px" fill="#ffffff" height="22px" viewBox="0 0 12 12" enable-background="new 0 0 12 12" id="Слой_1" version="1.1" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">

<g>

<circle cx="6" cy="6"  r="1.5"/>

<path d="M6,2C4,2,2,3,0,6c2,3,4,4,6,4s4-1,6-4C10,3,8,2,6,2z M6,8.5C4.621582,8.5,3.5,7.3789063,3.5,6   S4.621582,3.5,6,3.5S8.5,4.6210938,8.5,6S7.378418,8.5,6,8.5z" />

</g>

</svg>{book.views_count}</div>
                    <div className='book_mobile_views'><svg width="22px" height="22px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5C13 20.5 14 19.7294 15.0383 18.9109C17.9806 16.5914 22 14 22 9.1371C22 4.27416 16.4998 0.825464 12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371Z" fill="#ffffff"/>
</svg>{book.upvotes}</div>
                    <div className='book_mobile_views'><svg fill="#ffffff" height="20px" width="20px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 208.666 208.666" xmlSpace="preserve">
<g>
	<path d="M54.715,24.957c-0.544,0.357-1.162,0.598-1.806,0.696l-28.871,4.403c-2.228,0.341-3.956,2.257-3.956,4.511v79.825
		c0,1.204,33.353,20.624,43.171,30.142c12.427,12.053,21.31,34.681,33.983,54.373c4.405,6.845,10.201,9.759,15.584,9.759
		c10.103,0,18.831-10.273,14.493-24.104c-4.018-12.804-8.195-24.237-13.934-34.529c-4.672-8.376,1.399-18.7,10.989-18.7h48.991
		c18.852,0,18.321-26.312,8.552-34.01c-1.676-1.32-2.182-3.682-1.175-5.563c3.519-6.572,2.86-20.571-6.054-25.363
		c-2.15-1.156-3.165-3.74-2.108-5.941c3.784-7.878,3.233-24.126-8.71-27.307c-2.242-0.598-3.699-2.703-3.405-5.006
		c0.909-7.13-0.509-20.86-22.856-26.447C133.112,0.573,128.281,0,123.136,0C104.047,0.001,80.683,7.903,54.715,24.957z"/>
</g>
</svg>{book.downvotes}</div>
                </div>
            </div>
          </div>
  
          ))}
  
      </div>
    );
  }

export default BookItemMobile;