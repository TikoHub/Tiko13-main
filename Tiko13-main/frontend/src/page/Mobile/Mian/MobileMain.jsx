import React, {useState, useEffect, useHistory, useCallback, useRef, useLayoutEffect,createContext, useContext} from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate, NavLink, useParams,useLocation, Switch, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import apiUrl from '../../../apiUrl';
import { jwtDecode } from 'jwt-decode';
import Logo from '../../../a.svg';
import Bell from '../../../bell.svg';
import Avatar from '../../../avatart.svg';
import './MobileMain.css'
import SearchInput from './components/SearchInput.jsx'
import BookItemMobile from './components/BookItemMobile.jsx';
import LibraryMobile from './components/LibraryMobile.jsx';
import LoginLibrary from './components/LoginLibraryMobile.jsx';
import BookPageMobile from './components/BookPageMobile.jsx';


function MobileMain(){
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [profileData, setProfileData] = useState({
    });
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const token = localStorage.getItem('token') || '';
    const [showHeader, setShowHeader] = useState(true);
    
    const handleScroll = (scrollPos) => {
      if (scrollPos > 0) {
        setShowHeader(false); // Скрываем header при прокрутке вниз
      } else {
        setShowHeader(true); // Показываем header при прокрутке вверх
      }
    };
  
    useEffect(() => {
      const getNotifications = async () => {
          try {
              const decodedToken = jwtDecode(token);
              const username = decodedToken.username;
              const response = await axios.get(`${apiUrl}/users/api/${username}/notifications/`, {
                  headers: {
                      'Authorization': `Bearer ${token}`
                  }
              });
              setNotifications(response.data);
          } catch (error) {
              console.error(`Ошибка при получении уведомлений: ${error}`);
          }
      };
  
      getNotifications();
  }, []);
  
  
  
    const toggleMenu = () => {
      setIsOpen(!isOpen);
    };
  
    const logout = () => {
      localStorage.removeItem('authToken');
    };
    const menuRef = useRef();
  
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setMenuOpen(false);
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
  
    const handleMenuOpen = () => {
      setMenuOpen(!menuOpen);
    };
  
    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setIsLoggedIn(false);
      navigate('/');
      window.location.reload();
    };
    
    
    
  
    useEffect(() => {
      const getProfile = async () => {
        try {
          const decodedToken = jwtDecode(token);
          const username = decodedToken.username
          
          const response = await axios.get(`${apiUrl}/users/api/${username}/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
  
          if (response.status === 200) {
            setProfileData(response.data);
            setIsLoggedIn(true);
          } else {
            // Обработка ошибки
          }
        } catch (error) {
          console.error('Ошибка при получении профиля', error);
        }
      };
  
      getProfile();
    }, [token]);
  
 
    // <header  className={`header_mobile ${showHeader ? '' : 'header_hidden'}`}>
   
    return(
      <div className='mainContainer_mobile'>
        <div className='mainWrapper_mobile'>
        <header  className='header_mobile'>
        {isLoggedIn && (
  <Link to='/studio'>
    <button className='studio_mobile_link_button'>+</button>
  </Link>
)}
          <div className='header-search_mobile'>
          <SearchInput/>
          </div>
          {isLoggedIn ? (
            <div className='header__buttons_mobile'>
                          
            <div className='header-avatar'>
            <button className='header-avatar-btn' onClick={(e) => { e.preventDefault(); handleMenuOpen(); }}>
              <img className='header_avatar-img' src={profileData.profileimg} />
            </button>
          </div>
          </div>
          ) : (
            <Link to='/login'>
              <div className='header-signin_mobile'>
                <button className='pool-sign_mobile'>
                  <img className='pool_icon_mobile' src={Avatar} alt="Sign In" />
                  Sign In
                </button>
              </div>
            </Link>
          )}
        </header>
        <Outlet />
        
        </div>
        <footer className='footer_mobile'>
            <button className='footer_button_mobile'>Home</button>
            <button className='footer_button_mobile'>Library</button>
            <button className='footer_button_mobile'>Books</button>
            {isLoggedIn && (
                            <button className='footer_button_mobile'>History</button>
)}
        </footer>
    </div>
    )
  }
  
export default MobileMain;