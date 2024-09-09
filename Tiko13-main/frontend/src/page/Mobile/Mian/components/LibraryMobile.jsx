import React, {useState, useEffect, useHistory, useCallback, useRef, useLayoutEffect,createContext, useContext} from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate, NavLink, useParams,useLocation, Switch, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import apiUrl from '../../../../apiUrl';
import { jwtDecode } from 'jwt-decode';



function LibraryMobile() {
    const [profileData, setProfileData] = useState({});
    const [bookData, setBookData] = useState({});
    const [menuOpen, setMenuOpen] = useState(false);
    const token = localStorage.getItem('token');
    const { book_id } = useParams();
    const link = `http://localhost:3000/book_detail/${book_id}`;
    const handleMenuOpen = () => {
      setMenuOpen(!menuOpen);
    };
  
  
    const clearHistory = async () => {
      try {
        await axios.post(`${apiUrl}/api/history/delete/`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setBookData({}); 
        console.log('История успешно очищена');
      } catch (error) {
        console.error('Ошибка при очистке истории:', error);
      }
    };
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await axios.get(`${apiUrl}/api/unlogged-user-history/`, {});
    
          if (response.status === 200) {
            setBookData(response.data);
          } else {
          }
        } catch (error) {
          console.error('Ошибка при получении данных', error);
        }
      };
  
      fetchData();
    }, [book_id]);
  
    return(
            <div className='history_mobile'>
                <div className='history_mobile_views'><div>Only 10 last viewed books will be displayed here.<br/> If You want more:<br/><Link to={'/login'}><a className='history__purple'>Sign Up here</a></Link>for free to get full access to library<br/>functions.</div></div>

                  <div className='history__mobile_container'>
                  {Array.isArray(bookData) && bookData.map((book, bookIndex) => (
  <div key={bookIndex} className='history__mobile_book'>
    <div className='history__mobile_img'>
      <img src={book.coverpage} alt="Book Cover" />
    </div>
    <div className='history__mobile_label'>
      <div className='history__mobile_name'>{book.book_name}</div>
      <div className='history__mobile_author'>{book.author}</div>
    </div>
  </div>
))}
      


                  </div>

            </div>

    );
  }

export default LibraryMobile;