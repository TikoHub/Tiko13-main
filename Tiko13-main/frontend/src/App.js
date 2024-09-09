import axios from 'axios';
import React, {useState, useEffect, useHistory, useCallback, useRef, useLayoutEffect,createContext, useContext} from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate, NavLink, useParams,useLocation, Switch, useSearchParams } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { FontSizeProvider, useFontSize} from './context/SizeContext';
import {WidthProvider} from './context/WidthContext';
import {usePadding} from './context/WidthContext';
import { useLineHeight, LineHeightProvider } from './context/LineContext';
import { FontProvider, useFont } from './context/FontContext';
import { useMediaQuery } from '@mui/material';
import './App.css';
import Logo from './a.svg'
import Home from './icon-home.svg'
import Library from './icon-library.svg'
import History from './icon-history.svg'
import Book from './icon-book.svg'
import Drop from './drop.svg'
import Setting from './icon-setting.svg'
import Help from './icon-help.svg'
import Avatar from './avatart.svg'
import Search from './seach.svg'
import Google from './google.svg'
import Face from './face.svg'
import Bell from './bell.svg'
import CommentIcon from './comment.svg'
import Avatars from './avatar.jpg'
import { jwtDecode } from 'jwt-decode';
import ReactTooltip from 'react-tooltip';
import ClipboardJS from 'clipboard';
import ContentEditable from 'react-contenteditable';
import { ChromePicker } from 'react-color';
import { StudioFontSizeProvider } from './context/studio/SizeStudioContext';
import {StudioWidthProvider} from './context/studio/WidthStudioContext';
import {useStudioPadding} from './context/studio/WidthStudioContext';
import { useStudioLineHeight, StudioLineHeightProvider } from './context/studio/LineStudioContext';
import { FontStudioProvider, useStudioFont } from './context/studio/FontStudioContext';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Login from './page/Desktop/Login/Login.jsx';
import MobileRegister from './page/Mobile/Register/MobileRegister.jsx'
import MobileLogin from './page/Mobile/Login/MobileLogin.jsx';
import apiUrl from './apiUrl.jsx';
import { SearchProvider, SearchContext} from './context/SearchContext.jsx';
import BookItemMobile from './page/Mobile/Mian/components/BookItemMobile.jsx';
import LibraryMobile from './page/Mobile/Mian/components/LibraryMobile.jsx';
import LoginLibrary from './page/Mobile/Mian/components/LoginLibraryMobile.jsx';
import BookPageMobile from './page/Mobile/Mian/components/BookPageMobile.jsx';
import UpdateMobile from './page/Mobile/Mian/components/UpdateMobile.jsx';
import './page/Mobile/Mian/MobileMain.css'




function App() {
  const isMobile = useMediaQuery('(max-width: 1040px)');
  const updateAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const response = await axios.post(`${apiUrl}/users/api/token/refresh/`, {
          refresh: refreshToken,
        });
        localStorage.setItem('token', response.data.access);
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  };

  useEffect(() => {
    updateAccessToken();

    const interval = setInterval(() => {
      updateAccessToken();
    }, 25 * 60 * 1000); // Обновляем токен каждые 25 минут

    return () => clearInterval(interval);
  }, []);


  return (
    <Router>
      <SearchProvider>
      {isMobile ?  (
        <Routes>
        <Route path='/' element={<MobileMain/>}>
          <Route path='/' element={<BookItemMobile />} />
          <Route path='/history' element={<MainHistory />} />
          <Route path='/library' element={<LibraryMobile />} />
          <Route path='/book_detail/:book_id' element={<BookPageMobile />} />
          <Route path='/myLibrary' element={<LoginLibrary />} />
          <Route path='/update' element={<UpdateMobile/>} />
        </Route>
        <Route path="/login" element={<MobileLogin />} />
        <Route path="/register" element={<MobileRegister />} />
      </Routes>
      ):(
        <Routes>
          <Route path='/' element={<MainPage/>}>
            <Route path='/' element={<BookItem />} />
            <Route path='/history' element={<MainHistory />} />
            <Route path='/library' element={<AnonimHistory />} />
            <Route path='/profile' element={<Profile />}>
              <Route path='/profile' element={<ProfileLibrary />} />
              <Route path='/profile/books' element={<ProfileBooks />} />
              <Route path='/profile/series' element={<ProfileSeries />} />
              <Route path='/profile/comments' element={<ProfileComments/>} />
              <Route path='/profile/description' element={<ProfileDescription />} />
              <Route path='/profile/settings' element={<ProfileSettingsNav />} />
            </Route>
            <Route path='/book_detail/:book_id' element={<BookPageNew />} />
            <Route path='/news' element={<News />} />
          </Route>
          <Route path="/login" element={isMobile ?<MobileLogin /> : <Login/>} />
          <Route path="/register" element={isMobile ? <MobileRegister /> :<TwoStepRegistration/>} />
          <Route path='/reader/:book_id/chapter/' element={<ReaderContext />} />
          <Route path='/studio' element={<StudioContext />}>
            <Route path='/studio' element={<StudioWelcome />} />
            <Route path='/studio:book_id/chapter/:chapter_id?' element={<StudioMaker />} />
            <Route path='/studio/studio-books' element={<StudioBooks />} />
            <Route path='/studio/studio-series' element={<StudioSeries />} />
            <Route path='/studio/studio-comments' element={<StudioComments />} />
          </Route>
        </Routes>)}
      </SearchProvider>
    </Router>
  );
}
function ReaderContext() {
  return (
      <FontProvider>
        <WidthProvider>
          <LineHeightProvider>
            <FontSizeProvider>
              <ReaderMain />
            </FontSizeProvider>
          </LineHeightProvider>
        </WidthProvider>
      </FontProvider>
  );
}

function StudioContext() {
  return(
    <FontStudioProvider>
    <StudioWidthProvider>
    <StudioLineHeightProvider>
    <StudioFontSizeProvider>
      {<StudioMain />}
    </StudioFontSizeProvider>
    </StudioLineHeightProvider>
    </StudioWidthProvider>
    </FontStudioProvider>
  )
}
const spacing = 1;

function MainPage(){
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [profileData, setProfileData] = useState({
  });
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem('token') || '';

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

  
  return(
    <div className='main'>
      <header className='header'>
      <Link to='/'><a><img className='logo' src={Logo}></img></a></Link>
        <div className='header-search'>
        <SearchInput/>
        </div>
        {isLoggedIn ? (
          <div className='header__buttons'>
                        <Link to='/studio'><button 
      className='studio_link_button' 
    >
      +
    </button></Link>
    <div className='studio_menu_button' onClick={toggleMenu}>
      <img src={Bell} alt="" />
      {isOpen && (
        <div className='dropdown_news_menu'>
            {Array.isArray(notifications) && notifications.map((notification, index) => (
                <div className='drop_news' key={index}>

<Link to={`/book_detail/${notification.sender}`}><div className='drop_news_title'>{notification.book_name}:<div className='drop_news_chapter'>{notification.chapter_title}</div></div></Link>
                    <div className='drop_news_title'>{notification.formatted_timestamp}</div>
                </div>
            ))}
            </div>
      )}
    </div>
          <div className='header-avatar'>
          <button className='header-avatar-btn' onClick={(e) => { e.preventDefault(); handleMenuOpen(); }}>
            <img className='header_avatar-img' src={profileData.profileimg} />
          </button>
          {menuOpen && (
            <div ref={menuRef} className="menu">
              <Link to='/profile'><button className='menu_button'>Profile</button></Link>
              <Link to='/profile/settings'><button className='menu_button'>Settings</button></Link>
              <button className='menu_button' onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
        </div>
        ) : (
          <Link to='/login'>
            <div className='header-signin'>
              <button className='pool-sign'>
                <img className='pool_icon-sign' src={Avatar} alt="Sign In" />
                Sign In
              </button>
            </div>
          </Link>
        )}
      </header>
      <div className='main__content'>
      <Sidebar />
      <div className="books">
            <Outlet />
      </div>
      </div>
  </div>
  )
}

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
  const [isClicked, setIsClicked] = useState(false);
  const [linkPath, setLinkPath] = useState('/update');

  const handleClick = () => {
    setIsClicked(prevState => !prevState);
    setLinkPath(prevPath => (prevPath === '/update' ? '/' : '/update'));
  };
  
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
//   <div className='test_buttons'><Link to='/studio'>
//   <button className='studio_mobile_link_button'>+</button>
// </Link> <DownloadButton /></div>
  
  return(
    <div className='mainContainer_mobile'>
      <div className='mainWrapper_mobile'>
      <header  className={`header_mobile ${showHeader ? '' : 'header_hidden'}`}>
      {isLoggedIn && (
        <DownloadButton />

)}
        <div className='header-search_mobile'>
        <SearchInputMobile/>
        </div>
        {isLoggedIn ? (
          <div className='header__buttons'>
                        
                        <Link to={linkPath}>
      <button className='studio_menu_button_mobile' onClick={handleClick}>
        <img src={Bell} alt="Bell Icon" />
      </button>
    </Link>
          <div className='header-avatar_mobile'>
          <button className='header-avatar-btn' onClick={(e) => { e.preventDefault(); handleMenuOpen(); }}>
            <img className='header_avatar-img_mobile' src={profileData.profileimg} />
          </button>
          {menuOpen && (
            <div ref={menuRef} className="menu">
              <Link to='/profile'><button className='menu_button'>Profile</button></Link>
              <Link to='/profile/settings'><button className='menu_button'>Settings</button></Link>
              <button className='menu_button' onClick={handleLogout}>Logout</button>
            </div>
          )}
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
          <Link to={'/'}><button className='footer_button_mobile'>Home</button></Link>
          {isLoggedIn ? (<Link to={'/myLibrary'}><button className='footer_button_mobile'>Library</button></Link>):(<Link to={'/library'}><button className='footer_button_mobile'>Library</button></Link>)}
          <Link to={'#'}><button className='footer_button_mobile'>Books</button></Link>
          {isLoggedIn && (
                          <Link to={'/history'}><button className='footer_button_mobile'>History</button></Link>
)}
      </footer>
  </div>
  )
}

function SearchInput() {
  const { searchQuery, setSearchQuery } = useContext(SearchContext);
  return (
    <input type="text" placeholder="search" className="search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
  );
}

function SearchInputMobile() {
  const { searchQuery, setSearchQuery } = useContext(SearchContext);
  return (
    <input type="text" placeholder="search" className="search-input_mobile" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
  );
}

function BookPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [bookData, setBookData] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const token = localStorage.getItem('token');

  const { book_id } = useParams();
  const [following, setFollowing] = useState(false);
  const [author, setAuthor] = useState('');
  const link = `https://wormates.com/book_detail/${book_id}`;
  const handleMenuOpen = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.reload();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bookResponse = await axios.get(`${apiUrl}/api/book_detail/${book_id}/`);
        
        if (bookResponse.status === 200) {
          setBookData(bookResponse.data);
          const { author } = bookResponse.data;
          setAuthor(author);
        } else {

        }
      } catch (error) {
        console.error('Ошибка при получении данных', error);
      }
    };


    const getProfile = async () => {
      try {
        const decodedToken = jwtDecode(token);
        const username = decodedToken.username
        
        const response = await axios.get(`${apiUrl}/users/api/${username}/`, {
        });

        if (response.status === 200) {
          setProfileData(response.data);
        } else {
          // Обработка ошибки
        }
      } catch (error) {
        console.error('Ошибка при получении профиля', error);
      }
    };
    getProfile();
    fetchData();
  }, [book_id]);



const followAuthor = async () => {
  try {
      await axios.post(`${apiUrl}/users/api/${author}/follow/`, {}, {
          headers: { Authorization: `Bearer ${token}` }
      });
      // После нажатия кнопки "Follow" снова проверяем статус подписки
      checkFollowing();
  } catch (error) {
      console.error("Error following author:", error);
  }
};
const checkFollowing = async () => {
  try {
      const decodedToken = jwtDecode(token);
      const username = decodedToken.username
      const response = await axios.get(`${apiUrl}/users/api/${username}/following/`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      const followingUsers = response.data;
      const isFollowing = followingUsers.some(user => user.username === author);
      setFollowing(isFollowing);
  } catch (error) {
      console.error("Error checking following status:", error);
  }
};
useEffect(() => {
  if (typeof token === 'string') {
    const decodedToken = jwtDecode(token);
    const username = decodedToken.username;
    if (username && author) {
        checkFollowing();
    }
  } else {
    console.error('Invalid token:', token);
  }
}, [author, token]);
  
  return(

      <div className="bookpage__books">
        <div className='bookpage__info' >
          <div className='bookpage__genre'>{bookData.book_type},{bookData.genre},{bookData.subgenres}</div>
          <div className='bookpage__names'>
            <div className='bookpage__series_name'>{bookData.series_name}</div>
            <div className='bookpage__name'>{bookData.name}</div>
            </div>
            <div className='bookpage__info_book' style={{ backgroundImage: `url(${bookData.coverpage})` }}>
              <div className='bookpage__autor_button'>
                <div className='bookpage__autor_button_first'>
                <div className='bookpage__name_foll'>
                <div className='bookpage__autor_img'><img src={bookData.author_profile_img} />            {following ? (
                <button className='fol_button' onClick={followAuthor}>Following</button>
            ) : (<button className='fol_button' onClick={followAuthor}>+ Follow</button>)}</div>
                <div>
                  <div className='bookapage__author_name'>{bookData.author}</div>
                  <div className='bookpage__author_followers'>{bookData.author_followers_count}Followers</div>
                </div>
                </div>
                <div className='bookpage__button_menu'>
                <Link to={`/reader/${book_id}/chapter/`}>
  <button className='bookpage__button_read'>Read</button>
</Link>
                  <button className='bookpage__button_free'>{bookData.display_price}$</button>
                  <button className='bookpage__button_add'>+Add</button>
                  <button className='bookpage__button_download'></button>
                </div>
                </div>
                <div className='bookpage__autor_button_second'>
                <div className='bookpage__like_view'>
                  <div className='bookpage__like'> <svg width="32px" height="32px" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
<path d="M2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5C13 20.5 14 19.7294 15.0383 18.9109C17.9806 16.5914 22 14 22 9.1371C22 4.27416 16.4998 0.825464 12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371Z" />
</svg>{bookData.upvotes}</div>
                  <div className='bookpage__like'><svg fill="#ffffff" height="32px" width="32px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 208.666 208.666" xmlSpace="preserve">
<g>
	<path d="M54.715,24.957c-0.544,0.357-1.162,0.598-1.806,0.696l-28.871,4.403c-2.228,0.341-3.956,2.257-3.956,4.511v79.825
		c0,1.204,33.353,20.624,43.171,30.142c12.427,12.053,21.31,34.681,33.983,54.373c4.405,6.845,10.201,9.759,15.584,9.759
		c10.103,0,18.831-10.273,14.493-24.104c-4.018-12.804-8.195-24.237-13.934-34.529c-4.672-8.376,1.399-18.7,10.989-18.7h48.991
		c18.852,0,18.321-26.312,8.552-34.01c-1.676-1.32-2.182-3.682-1.175-5.563c3.519-6.572,2.86-20.571-6.054-25.363
		c-2.15-1.156-3.165-3.74-2.108-5.941c3.784-7.878,3.233-24.126-8.71-27.307c-2.242-0.598-3.699-2.703-3.405-5.006
		c0.909-7.13-0.509-20.86-22.856-26.447C133.112,0.573,128.281,0,123.136,0C104.047,0.001,80.683,7.903,54.715,24.957z"/>
</g>
</svg>{bookData.downvotes}</div>
                  <div className='bookpage__like'>{bookData.views_count}<svg width="32px" fill="#ffffff" height="32px" viewBox="0 0 12 12" enable-background="new 0 0 12 12" id="Слой_1" version="1.1" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">

<g>

<circle cx="6" cy="6"  r="1.5"/>

<path d="M6,2C4,2,2,3,0,6c2,3,4,4,6,4s4-1,6-4C10,3,8,2,6,2z M6,8.5C4.621582,8.5,3.5,7.3789063,3.5,6   S4.621582,3.5,6,3.5S8.5,4.6210938,8.5,6S7.378418,8.5,6,8.5z" />

</g>

</svg></div><div className='share_book'><svg version="1.1" id="Capa_1" fill='white' xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
	 width="32px" height="32px" viewBox="0 0 237.561 237.561"
	 xmlSpace="preserve">
<g>
	<g>
		<path  d="M134.545,75.727l5.655-0.194V38.668l80.732,80.118L140.2,198.89v-44.36h-5.855
			c-76.816,0-110.326,31.352-122.334,47.14C18.549,81.102,129.673,75.89,134.545,75.727z"/>
		<path  d="M0.006,212.95c0-125.659,102.97-145.464,128.483-148.431V10.55l109.071,108.23l-109.071,108.23
			v-60.702c-87.714,1.995-111.27,48.671-111.484,49.135l-1.586,3.362H0v-5.855H0.006z"/>
	</g>
</g>
</svg> <CopyToClipboardButton textToCopy={link} /></div>
                 
                </div>
                </div>
              </div>
            </div>
        </div>
        <div className='bookpage__content'>
         <BookpageNavigation  book_id={book_id}/> 
        </div> 
      </div>
  )
}

const handleLibraryClick = () => {
  const libraryNavigationSection = document.getElementById('library-navigation');
  if (libraryNavigationSection) {
    libraryNavigationSection.scrollIntoView({ behavior: 'smooth' });
  }
};


function Main() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState({});
  const navigate = useNavigate();
  const menuRef = useRef();

  const handleMenuOpen = () => {
    setMenuOpen(!menuOpen);
  };

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    navigate('/');
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        if (typeof token === 'string' && token.trim() !== '') { 
          const decodedToken = jwtDecode(token);
          const username = decodedToken.username;
          const response = await axios.get(`${apiUrl}/users/api/${username}/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.status === 200) {
            setProfileData(response.data);
            setIsLoggedIn(true);
          } else {

          }
        } else {
          console.log('Токен отсутствует или некорректен');

          navigate('/');
        }
      } catch (error) {
        console.error('Ошибка при получении профиля', error);
      }
    };

    fetchData();
  }, [navigate]);

  return (
      <div className='profile-page'>
        <Profile />
        <div><Navigation/></div>
      </div>
  );
}

const CopyToClipboardButton = ({ textToCopy }) => {
  const buttonRef = useRef(null);

  const handleCopy = () => {
    const clipboard = new ClipboardJS(buttonRef.current, {
      text: () => textToCopy,
    });

    clipboard.on('success', () => {
      console.log('Text successfully copied to clipboard');
      clipboard.destroy(); 
    });

    clipboard.on('error', (e) => {
      console.error('Unable to copy text to clipboard', e);
      clipboard.destroy(); 
    });

    
    buttonRef.current.click();
  };

  return (
    <>
      <button
        ref={buttonRef}
        data-clipboard-text={textToCopy}
        style={{ display: 'none' }} 
      />
      <button className='bookpage__like' onClick={handleCopy}>Share</button>
    </>
  );
};





function BookItem() { 
  const [books, setBooks] = useState([]);
  const { searchQuery } = useContext(SearchContext);

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

  if (!books) {
    return     <div class="load_container">
<svg xmlns="http://www.w3.org/2000/svg" fill='#858585' width="100" height="100" viewBox="0 0 100 100" class="svg" style={{marginRight: spacing + 'em'}}>
    <defs>
        <mask id="mask" x="0" y="0" width="100%" height="100%">
            <rect x="0" y="0" width="100%" height="100%" fill="#fff">
                <animate attributeName="y" from="100%" to="0%" dur="2s" fill="freeze" />
            </rect>
        </mask>
    </defs>
    <g clip-path="url(#clip0_309_961)" fill="white" mask="url(#mask)">
        <path d="M35.9632 5.50044C35.9074 5.69934 35.8329 5.82518 35.9558 5.56133C35.9856 5.50044 36.1121 5.32589 36.1121 5.27312C36.1121 5.36648 35.7883 5.65469 36.0116 5.44361C36.0861 5.3746 36.3728 5.08233 36.0489 5.38678C35.6505 5.76023 36.1196 5.3543 36.1159 5.36242C36.0973 5.41925 35.5165 5.67498 35.8515 5.52885C35.967 5.47608 36.3541 5.31371 35.859 5.5045C35.3638 5.69528 35.7064 5.56539 35.818 5.53291C36.3392 5.38272 35.5277 5.57351 35.5277 5.58162C35.5351 5.55321 35.8143 5.55321 35.8404 5.54915C36.1308 5.50856 35.2187 5.52073 35.5016 5.54915C35.5947 5.55727 35.6915 5.55727 35.7883 5.56539C35.8851 5.5735 35.9744 5.5938 36.0675 5.60192C36.3281 5.61816 35.5388 5.45579 35.7845 5.54915C35.9558 5.6141 36.1419 5.65469 36.3169 5.71964C36.3914 5.74805 36.652 5.86577 36.3169 5.71152C35.967 5.55321 36.2834 5.7034 36.3616 5.74399C36.5105 5.82518 36.652 5.91854 36.7934 6.01596C36.9349 6.11339 37.0652 6.22704 37.203 6.33664C37.5082 6.58426 36.9796 6.08903 37.1285 6.26764C37.1918 6.34476 37.27 6.40971 37.3333 6.48278C37.8619 7.05513 38.2863 7.72897 38.6325 8.44746L38.4203 8.00095C38.9751 9.19031 39.2915 10.4812 39.3511 11.8167L39.3325 11.3174C39.3548 12.0521 39.2915 12.7746 39.1538 13.4972C39.0756 13.9153 38.9788 14.3293 38.8708 14.7393C38.815 14.9504 38.7554 15.1574 38.6921 15.3645C38.6623 15.47 38.6288 15.5715 38.5953 15.677C38.4799 16.0545 38.6661 15.4822 38.5842 15.7217C37.9922 17.4063 37.2811 19.03 36.5366 20.6415C35.9148 21.9892 35.2857 23.3328 34.7682 24.7332C34.1651 26.3772 33.6178 28.0497 33.1189 29.7383C31.1346 36.4564 29.7795 43.5642 29.6306 50.6354C29.5673 53.6149 29.3328 58.0882 32.3781 59.5008C34.7942 60.6212 37.5827 59.2004 39.124 57.1018C39.6601 56.3711 40.1217 55.5958 40.5424 54.7799C41.5736 52.7665 42.4374 50.6516 43.2973 48.5489C44.3025 46.0931 45.2705 43.621 46.2757 41.1611C47.1319 39.0665 47.9919 36.9557 49.0157 34.9504C49.2093 34.5729 49.4066 34.1994 49.6188 33.8382C49.7007 33.6961 49.7901 33.5581 49.8757 33.4201C50.0916 33.075 49.805 33.5987 49.7082 33.6555C49.7603 33.6271 49.8124 33.5094 49.8534 33.4566C50.0842 33.144 50.3299 32.8436 50.5905 32.5595C50.7059 32.4296 50.8474 32.3119 50.9591 32.1779C50.6091 32.6123 50.6612 32.4377 50.8139 32.32C50.8288 32.3078 51.1527 32.048 51.1601 32.0602C51.1638 32.0643 50.5347 32.4255 50.9218 32.2185C51.108 32.117 51.3909 32.0886 50.5979 32.3362C50.7022 32.3038 50.9553 32.251 50.49 32.3484C49.7715 32.4945 50.8325 32.3728 50.181 32.389C49.5295 32.4052 50.6352 32.5108 49.8348 32.3565C49.3396 32.2632 49.5071 32.2835 49.6077 32.3159C49.8534 32.3971 48.9934 31.9953 49.2614 32.1536C49.4662 32.2794 49.2428 32.3281 49.0194 31.9141C49.0418 31.9547 49.0902 31.9831 49.1162 32.0237C49.1758 32.117 49.2354 32.2023 49.2838 32.2997L49.0716 31.8532C49.4327 32.6204 49.4774 33.5581 49.5146 34.4024L49.496 33.9031C49.6188 37.049 49.2279 40.195 49.1609 43.3409C49.1348 44.6277 49.0641 46.0484 49.4066 47.2946C50.0954 49.7951 52.8168 49.6206 54.6373 48.7478C56.1004 48.0497 57.3215 46.7669 58.4458 45.5573C59.5701 44.3476 60.5455 43.1948 61.5544 41.9729C64.2982 38.6403 66.8819 35.1493 69.3055 31.5366C71.5057 28.2567 73.6836 24.8063 75.1318 21.0434C75.3254 20.54 75.4967 20.0285 75.6642 19.5171C75.8318 19.0056 75.3887 18.4536 75.0537 18.2262C74.5622 17.8893 73.799 17.8041 73.2406 17.8812C71.9413 18.0557 70.6867 18.6971 70.2288 20.0935C70.4745 19.3466 70.1878 20.195 70.1171 20.3858C70.0203 20.6496 69.9161 20.9094 69.8118 21.1651C69.5922 21.701 69.3539 22.2287 69.1045 22.7523C68.5609 23.893 67.9653 25.0011 67.3435 26.089C66.6511 27.2946 65.9251 28.4759 65.1731 29.6409C64.7859 30.2417 64.3913 30.8384 63.9892 31.431C63.8924 31.5772 63.7919 31.7192 63.6951 31.8654C63.643 31.9425 63.3377 32.3849 63.5648 32.0561C63.7919 31.7273 63.4419 32.2348 63.3973 32.2997C63.2856 32.4621 63.1739 32.6204 63.0585 32.7828C60.2626 36.7527 57.288 40.6456 54.0156 44.1649C53.7326 44.4694 53.4422 44.7738 53.1481 45.0661C53.029 45.1838 52.9099 45.2975 52.7907 45.4152C52.4668 45.7278 53.3008 44.9606 53.07 45.1595C53.0141 45.2082 52.962 45.2569 52.9061 45.3056C52.787 45.4071 52.6642 45.5086 52.5413 45.606C52.4594 45.6709 52.37 45.7278 52.2881 45.7968C52.0499 45.9957 52.8503 45.5694 52.4259 45.7156C52.4557 45.7075 53.1444 45.5086 52.7051 45.606C53.0513 45.5289 53.23 45.5004 53.539 45.4964C54.0826 45.4923 53.9262 45.4964 53.8071 45.4923C53.5763 45.4761 54.5628 45.6709 54.3208 45.5938C54.0379 45.5004 54.9165 45.9429 54.6745 45.7562C54.4958 45.6222 54.991 46.1621 54.924 45.9916C54.8867 45.8982 54.7862 45.8049 54.7378 45.7075L54.95 46.154C54.641 45.4923 54.6112 44.6764 54.5814 43.9457L54.6001 44.445C54.4847 41.3072 54.8867 38.1694 54.9426 35.0356C54.9649 33.6677 55.017 32.1779 54.6634 30.8465C54.5331 30.3472 54.3208 29.8114 53.9746 29.4501C52.8652 28.2892 51.1117 28.3703 49.7231 28.7884C45.7209 29.99 43.8297 34.4633 42.2289 38.2141C40.6131 41.9973 39.1575 45.8577 37.5678 49.6531C36.9014 51.2402 36.2238 52.8315 35.442 54.3577C35.1628 54.9057 34.8575 55.4253 34.5336 55.9409C34.8017 55.5106 34.8426 55.5106 34.6267 55.7947C34.422 56.0667 34.1986 56.3103 33.9789 56.566C33.7965 56.773 34.1874 56.3711 34.1762 56.3833C34.1018 56.4442 33.871 56.5863 34.2321 56.363C34.422 56.2453 34.6304 56.1519 34.8426 56.0911C34.7682 56.1114 35.5425 55.9815 35.2708 56.0058C34.999 56.0302 35.7734 56.0058 35.6952 56.0058C35.6058 56.0058 35.3899 55.9571 35.8031 56.0342C36.2164 56.1114 36.0116 56.0748 35.9186 56.0423C35.9632 56.0586 36.3839 56.3184 36.1605 56.1479C36.101 56.1032 35.7548 55.8313 36.0228 56.0667C36.276 56.2859 36.0079 56.0261 35.9521 55.9571C35.7957 55.7541 35.6654 55.5309 35.5463 55.2995L35.7585 55.746C35.2596 54.6987 35.1181 53.5703 35.066 52.4052L35.0846 52.9045C34.9171 48.7154 35.3341 44.5019 36.0005 40.3776C36.6929 36.0992 37.6832 31.8694 38.9788 27.7614C39.057 27.5179 39.1351 27.2784 39.2133 27.0348C39.3287 26.6817 39.2059 27.0511 39.1873 27.112C39.2319 26.9699 39.2803 26.8278 39.3287 26.6898C39.4851 26.2311 39.6452 25.7724 39.8127 25.3137C40.118 24.4775 40.453 23.6616 40.8179 22.8538C41.6667 20.9744 42.5714 19.1193 43.3085 17.183C44.0456 15.2467 44.8051 13.0507 44.7604 10.883C44.7195 8.87369 44.2318 7.0186 43.2341 5.31371C42.0688 3.32467 40.2036 2.09065 38.0816 1.74968C35.1554 1.2788 31.4474 2.80509 30.5166 6.08903C30.3752 6.59238 30.7735 7.14038 31.1272 7.37988C31.6186 7.7168 32.3818 7.80204 32.9402 7.72492C34.1911 7.55849 35.5537 6.91712 35.9521 5.51261L35.9632 5.50044Z" />
<path d="M37.5193 12.1638C39.3716 8.28416 39.0325 4.09428 36.7619 2.80548C34.4913 1.51668 31.149 3.61701 29.2967 7.49669C27.4444 11.3764 27.7836 15.5663 30.0542 16.8551C32.3248 18.1439 35.667 16.0435 37.5193 12.1638Z"  stroke="none" stroke-miterlimit="10"/>
<path d="M76.0353 36.3825C75.7599 35.2296 77.141 32.8387 78.5669 31.6859C80.1343 30.4194 82.234 31.0486 82.878 32.4206C83.5221 33.7967 82.6025 35.6234 80.9012 36.6625C79.1923 37.7058 76.4002 37.9047 76.0353 36.3825Z"  stroke="#none" stroke-miterlimit="10"/>
    </g>
</svg>
</div>;
  }

  return (
    <div className='book-item'>

        {filteredBooks.map(book => (
        <div className='colum' key={book.id}>
          <a href={`book_detail/${book.id}`}><div className='book-coverpage'><img src={book.coverpage} alt={book.name} /></div></a>
          <div className='book-info'>
            <a href={`profile/${book.author}`}><div className='book_author__img'><img src={book.author_profile_img} alt={book.author} /></div></a>
            <div>
              <a href={`book_detail/${book.id}`} className='books-name'>{book.name}</a>
              <div className='books-authorname_cont'><a className='books-authorname' href={`profile/${book.author}`}>{book.author}</a></div>
              <div className="viewins">{book.views_count} Views</div>
            </div>
          </div>
        </div>

        ))}

    </div>
  );
}
const Sidebar = () => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAnonimLibrary, setAnonimLibrary] = useState(true);
  useEffect(() => {
    if (isAuthenticated === false) {
      setAnonimLibrary(true);
    } else {
      setAnonimLibrary(false);
    }
  }, [isAuthenticated]);
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await axios.get(`${apiUrl}/users/api/token-check/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setIsAuthenticated(true);
        } catch (error) {
          console.error(`Ошибка при проверке токена: ${error}`);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };
  
    checkAuth();
  
    window.addEventListener('storage', checkAuth);
  
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const getButtonClass = (color) => {
    if (color === 'home' && location.pathname === '/') {
      return 'pool-button selected';
    }

    if (location.pathname === `/${color}`) {
      return 'pool-button selected';
    }

    return 'pool-button';
  };

  return (
    <div className="sidebar_main">
      <ul className='sidebar-menu'>
        <Link to={'/'}>
          <li className='pool'>
            <button
              className={getButtonClass('home')}
            >
              <img className='pool_icon' src={Home} alt="Home" />
              Home
            </button>
          </li>
        </Link>
        {isAuthenticated && (
          <Link to="/profile">
            <li className='pool'>
              <button
                className={getButtonClass('profile')}
              >
                <img className='pool_icon' src={Library} alt="Library" />
                Library
              </button>
            </li>
          </Link>
        )}
                {isAnonimLibrary && (
          <Link to="/library">
            <li className='pool'>
              <button
                className={getButtonClass('profile')}
              >
                <img className='pool_icon' src={Library} alt="Library" />
                Library
              </button>
            </li>
          </Link>
        )}
        <Link to={'/history'}>
          {isAuthenticated && (
            <li className='pool'>
              <button
                className={getButtonClass('history')}
              >
                <img className='pool_icon' src={History} alt="History" />
                History
              </button>
            </li>
          )}
        </Link>
        <Link to={'/news'}>
          {isAuthenticated && (
            <li className='pool'>
              <button
                className={getButtonClass('news')}
              >
                <img className='pool_icon' src={Bell} alt="News" />
                News
              </button>
            </li>
          )}
        </Link>
        <hr className='sidebar_hr' />
        <div className='book_button'>
          <button className='pool-button'>
            <img className='pool_icon' src={Book} alt="Books" />
            Books
          </button>
        </div>
        <Books />
        <hr className='sidebar_hr' />
        {isAuthenticated && <div className='followings'>Followings</div>}
        {isAuthenticated && <List />}
        <hr className='sidebar_hr' />
        {isAuthenticated && (
          <div className='book_button'>
            <Link to={'/profile/settings'}>
              <button
                className={getButtonClass('settings')}
              >
                <img className='pool_icon' src={Setting} alt="Settings" />
                Settings
              </button>
            </Link>
          </div>
        )}
        <div className='book_button'>
          <button
            className={getButtonClass('help')}
          >
            <img className='pool_icon' src={Help} alt="Help" />
            Help
          </button>
        </div>
      </ul>
    </div>
  );
};


function Profile() {
  const [profileData, setProfileData] = useState({
    user: {
      first_name: '',
      last_name: '',
      at_username: '',
    },
    about: ''
  });
  const [editingAbout, setEditingAbout] = useState(false);
  const [newAbout, setNewAbout] = useState('');
  const token = localStorage.getItem('token') || ''; 

  useEffect(() => {
    const getProfile = async () => {
      try {
        // Проверяем, является ли токен строкой и не пустым
        if (typeof token === 'string' && token.trim() !== '') {
          const decodedToken = jwtDecode(token);
          const username = decodedToken.username;

          const response = await axios.get(`${apiUrl}/users/api/${username}/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.status === 200) {
            setProfileData(response.data);
            setNewAbout(response.data.about);
          } else {
            // Обработка ошибки, если ответ от сервера не 200
          }
        } else {
          console.log('Токен отсутствует или некорректен');
        }
      } catch (error) {
        console.error('Ошибка при получении профиля', error);
      }
    };

    getProfile();
  }, [token]);


  const handleAboutEdit = () => {
    setEditingAbout(true);
  };

  const handleAboutChange = (e) => {
    setNewAbout(e.target.value);
  };

  const handleSaveAbout = async () => {
    try {
      const decodedToken = jwtDecode(token);
      if (decodedToken && decodedToken.username) {
        const username = decodedToken.username;
        const response = await axios.put(
          `${apiUrl}/users/api/${username}/`, 
          { about: newAbout },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          setProfileData({ ...profileData, about: newAbout });
          setEditingAbout(false);
          console.log('About успешно обновлен');
        } else {
          console.error('Ошибка при обновлении About:', response.statusText);
        }
      } else {
        console.log('Некорректный токен');
      }
    } catch (error) {
      console.error('Ошибка при обновлении данных:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingAbout(false);
    setNewAbout(profileData.about);
  };

  return (
      <div className='profile'>
        <div className='profile-banner'><img src={profileData.banner_image} alt="#" className='banner-img'/></div>
        <div className="profile-info">
          <div className='avatar'><img className='avatar-img' src={profileData.profileimg} alt="#" /></div>
          <div className='user-info'>
            <div className='user-name' key={profileData.user.id}>
              <div className='first_name'>{profileData.user.first_name}</div>
              <div className='last_name'>{profileData.user.last_name}</div>
            </div>
            <div className='user-colum'>
              <div className='user-first__colum'>
                <div className='user-tag'>{profileData.user.at_username}</div>
                <div className='user_followers__info'>
                  <div className='user-followings'>{profileData.following_count} Followings</div>
                  <div className='user-followers'>{profileData.followers_count} Followers</div>
                </div>
                <div className='user-book__info'>
                  <div className='user-books'>{profileData.books_count} books</div>
                  <div className='user-series'>{profileData.series_count} series</div>
                </div>
              </div>
              <div className='user-second__colum'>
              <div className='about'>
                    <div className='about-name'>About</div>
              </div>
                {editingAbout ? (
                  <div className='about_input'>
                    <textarea 
                      className='about-textarea' 
                      value={newAbout} 
                      onChange={handleAboutChange}
                    />
                    <button className='about-button' onClick={handleSaveAbout}><svg fill="#858585" width="32px" height="32px" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
    <path d="M1827.701 303.065 698.835 1431.801 92.299 825.266 0 917.564 698.835 1616.4 1919.869 395.234z" fill-rule="evenodd"/>
</svg></button>
                    <button className='about-button_stroke' onClick={handleCancelEdit}><svg width="32px" stroke="#858585" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19 5L5 19M5.00001 5L19 19"  stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg></button>
                  </div>
                ) : (
                    <div className='about-description'>{profileData.about}<button className='about-button_stroke' onClick={handleAboutEdit}><svg width="32px" stroke="#858585" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.4998 5.50067L18.3282 8.3291M13 21H21M3 21.0004L3.04745 20.6683C3.21536 19.4929 3.29932 18.9052 3.49029 18.3565C3.65975 17.8697 3.89124 17.4067 4.17906 16.979C4.50341 16.497 4.92319 16.0772 5.76274 15.2377L17.4107 3.58969C18.1918 2.80865 19.4581 2.80864 20.2392 3.58969C21.0202 4.37074 21.0202 5.63707 20.2392 6.41812L8.37744 18.2798C7.61579 19.0415 7.23497 19.4223 6.8012 19.7252C6.41618 19.994 6.00093 20.2167 5.56398 20.3887C5.07171 20.5824 4.54375 20.6889 3.48793 20.902L3 21.0004Z"  stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg></button></div>
                )}
              </div>
            </div>  
          </div>
        </div>
        <div className="navigation-tabs">
              <ul className="navigation-tabs__ul">
              <Link to={'/profile'}><li><a>Library</a></li></Link>
              <Link to={'/profile/books'}><li><a>Books</a></li></Link>
              <Link to={'/profile/series'}><li><a>Series</a></li></Link>
              <Link to={'/profile/comments'}><li><a>Comments</a></li></Link>
              <li><a>My Reviews</a></li>
              <Link to={'/profile/description'}><li><a>Description</a></li></Link>
              <Link to={'/profile/settings'}><li><a>Settings</a></li></Link>
              </ul>
              <hr className="navigations-hr"></hr>
              <Outlet />
            </div>
      </div>
  );
}

function BookpageNavigation({book_id}) {
  const [activeTab, setActiveTab] = useState('tab1'); 

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };
 return (
    <div className='bookpage__container'>
        <div>
            <div className="navigation-tabs">
              <ul className="navigation-tabs__ul">
              <li><a onClick={() => handleTabClick('tab1')}>Info</a></li>
              <li><a onClick={() => handleTabClick('tab2')}>Content</a></li>
              <li><a onClick={() => handleTabClick('tab3')}>Comments</a></li>
              <li><a onClick={() => handleTabClick('tab4')}>Reviews</a></li>
              </ul>
            </div>
                      {activeTab === 'tab1' && <BookInfo book_id={book_id}/>}
                      {activeTab === 'tab2' && <BookContent book_id={book_id}/>}
                      {activeTab === 'tab3' && <BookComment book_id={book_id}/>}
                      {activeTab === 'tab4' && <BookReviews book_id={book_id}/>}
        </div>
    </div>
  );
}

const StarFilled = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#290038">
    <path d="M12 2L9.24 8.58 2 9.5l5.46 4.71L5.82 21 12 17.27 18.18 21l-1.64-6.79L22 9.5l-7.24-1.08L12 2zM12 15.4l-3.76 2.27 1-4.14-3.32-2.88 4.38-.37L12 6.1l1.71 4.18 4.38.37-3.32 2.88 1 4.14L12 15.4z"/>
  </svg>
);

const StarHalfFilled = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#290038">
    <path d="M12 2L9.24 8.58 2 9.5l5.46 4.71L5.82 21 12 17.27 18.18 21l-1.64-6.79L22 9.5l-7.24-1.08L12 2zM12 15.4l-3.76 2.27 1-4.14-3.32-2.88 4.38-.37L12 6.1v9.3z"/>
  </svg>
);

const StarEmpty = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#290038">
    <path d="M22 9.5l-7.24-1.08L12 2 9.24 8.58 2 9.5l5.46 4.71L5.82 21 12 17.27 18.18 21l-1.64-6.79L22 9.5zM12 15.4l-3.76 2.27 1-4.14-3.32-2.88 4.38-.37L12 6.1l1.71 4.18 4.38.37-3.32 2.88 1 4.14L12 15.4z"/>
  </svg>
);

function BookReviews({book_id}) {
  const [text, setText] = useState('');
  const [reviews, setReviews] = useState([]);
  const token = localStorage.getItem('token') || ''; 
  const [plotRating, setPlotRating] = useState(0);
  const [charactersRating, setCharactersRating] = useState(0);
  const [mainCharacterRating, setMainCharacterRating] = useState(0);
  const [genreFitRating, setGenreFitRating] = useState(0);

  const handleChange = (event) => {
    setText(event.target.value);
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/book_detail/${book_id}/reviews/`);
        setReviews(response.data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchReviews();
  }, []);

  const handleSubmit = async () => {
    try {
      // Проверьте, что рейтинг находится в диапазоне от 1 до 5
      if (plotRating < 1 || plotRating > 5 || charactersRating < 1 || charactersRating > 5 || mainCharacterRating < 1 || mainCharacterRating > 5 || genreFitRating < 1 || genreFitRating > 5) {
        alert('Рейтинг должен быть от 1 до 5');
        return;
      }
  
      await axios.post(`${apiUrl}/api/book_detail/${book_id}/reviews/`, {
        plot_rating: plotRating,
        characters_rating: charactersRating,
        main_character_rating: mainCharacterRating,
        genre_fit_rating: genreFitRating,
        text: text
      }, {
        headers: {
          'Authorization': `Bearer ${token}` // замените на ваш токен
        }
      });
  
      // Запросить отзывы снова после создания нового отзыва
      const response = await axios.get(`${apiUrl}/api/book_detail/${book_id}/reviews/`);
      setReviews(response.data);
    } catch (error) {
      console.error('Ошибка при отправке отзыва:', error);
    }
  };

  const handlePlotRatingChange = (newRating) => {
    setPlotRating(newRating);
  };

  const handleCharactersRatingChange = (newRating) => {
    setCharactersRating(newRating);
  };

  const handleMainCharacterRatingChange = (newRating) => {
    setMainCharacterRating(newRating);
  };

  const handleGenreFitRatingChange = (newRating) => {
    setGenreFitRating(newRating);
  };

  useEffect(() => {
    const textarea = document.getElementById('expanding-textarea');
    textarea.scrollTop = textarea.scrollHeight;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }, [text]);
  return (
    <div className='books_rviews'>
      {reviews.map((review, index) => (
        <div key={index}>
          <div className='reviews__author'>
            <div className='reviews__author_avatar'><img src={review.author_profile_img} alt="" /></div>
            <div className='reviews__author_name'>{review.author_username}</div>
            <div className='reviews__author_time'>{review.formatted_timestamp}</div>
            <div className='reviews__like'><div className="heart"></div>{review.like_count}</div>
          </div>
          <div className='reviews__rating'>
            <div className='reviews__rating_title'><span>Plot:</span> <RatingStars rating={review.plot_rating}/></div>
            <div className='reviews__rating_title'><span>Characters:</span> <RatingStars rating={review.characters_rating}/></div>
            <div className='reviews__rating_title'><span>Main Character:</span> <RatingStars rating={review.main_character_rating}/></div>
            <div className='reviews__rating_title'><span>Genre Fit:</span> <RatingStars rating={review.genre_fit_rating}/></div>
          </div>
          <div className='reviews__title'>Reviews Comment</div>
          <div className='reviews__content'>{review.text}</div>
        </div>
      ))}
      <div className='reviews__input_container'>
        <div className='reviews__rating'>
        <div className='reviews__rating_title'><span>Plot:</span> <InteractiveRatingStars onChange={handlePlotRatingChange}/></div>
      <div className='reviews__rating_title'><span>Characters:</span> <InteractiveRatingStars onChange={handleCharactersRatingChange}/></div>
      <div className='reviews__rating_title'><span>Main Character:</span> <InteractiveRatingStars onChange={handleMainCharacterRatingChange}/></div>
      <div className='reviews__rating_title'><span>Genre Fit:</span> <InteractiveRatingStars onChange={handleGenreFitRatingChange}/></div>
        </div>
        <hr className='reviews__input_hr'/>
        <textarea type="text" 
        className='reviews__input'
        id="expanding-textarea"
        value={text}
        onChange={handleChange}
        placeholder="Review Comment"
         />
          <hr className='reviews__input_hr'/>
        <button className='reviews__button' onClick={handleSubmit}>Leave Reviews</button>
      </div>
    </div>
  );
}


const Star = ({ filled, half }) => {
  const fillColor = filled ? '#BD00FF' : 'none';
  const halfColor = half ? 'url(#half)' : 'none';

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="half" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="50%" stop-color="#BD00FF" />
          <stop offset="50%" stop-color="none" stop-opacity="1" />
        </linearGradient>
      </defs>
      <polygon fill={half ? halfColor : fillColor} stroke="#BD00FF" stroke-width="2" points="12 2, 15.09 8.26, 22 9.27, 17 14.14, 18.18 21.02, 12 17.77, 5.82 21.02, 7 14.14, 2 9.27, 8.91 8.26" />
    </svg>
  );
};

const RatingStars = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating + 0.5 >= i && rating < i) {
      stars.push(<Star key={i} half={true} />);
    } else {
      stars.push(<Star key={i} filled={i <= rating} />);
    }
  }

  return (
    <div style={{ display: 'flex' }}>
      {stars}
    </div>
  );
};


const InteractiveStar = ({ filled, half, onClick }) => {
  const fillColor = filled ? '#BD00FF' : 'none';
  const halfColor = half ? 'url(#half)' : 'none';

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" onClick={onClick}>
      <defs>
        <linearGradient id="half" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="50%" stop-color="#BD00FF" />
          <stop offset="50%" stop-color="none" stop-opacity="1" />
        </linearGradient>
      </defs>
      <polygon fill={half ? halfColor : fillColor} stroke="#BD00FF" stroke-width="2" points="12 2, 15.09 8.26, 22 9.27, 17 14.14, 18.18 21.02, 12 17.77, 5.82 21.02, 7 14.14, 2 9.27, 8.91 8.26" />
    </svg>
  );
};

const InteractiveRatingStars = ({ onChange }) => {
  const [rating, setRating] = useState(0);

  const handleClick = (i) => {
    setRating(i);
    onChange(i); 
  };

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating + 0.5 >= i && rating < i) {
      stars.push(<InteractiveStar key={i} half={true} onClick={() => handleClick(i)} />);
    } else {
      stars.push(<InteractiveStar key={i} filled={i <= rating} onClick={() => handleClick(i)} />);
    }
  }

  return (
    <div style={{ display: 'flex' }}>
      {stars}
    </div>
  );
};



function BookInfo({book_id}) {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/book_detail/${book_id}/info`);
        setBooks(response.data);
        console.log(response)
      } catch (error) {
        console.error('Пиздец в инфо');
      }
    };

    fetchData();
  }, []);

  return(
    <div className='bookpage__info_tab'>
      <div className='general_info'>General Information:</div>
      <div className='info__total'>
        <div className='info__total_info'>Changed:{books.formatted_last_modified}</div>
        <div className='info__total_info'>Total Chapters:{books.total_chapters}</div>
        <div className='info__total_info'>Total Pages:{books.total_pages}</div>
      </div>
      <div className='info_description-views'>Description:</div>
      <div className='info_description'>{books.description}</div>
    </div>
  )
}

function BookContent({book_id}) {
  const [contents, setContents] = useState({
    chapters: [
      {
        title: '',
        added_date: '',
      }
    ]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/book_detail/${book_id}/content`);
        setContents(response.data);
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {contents.chapters.map((chapter, index) => (
        <div key={index} className='content__chapter'>
          <a className='content__chapter_name'>{chapter.title}</a>
          <div className='content__chapter_date'>Added:{chapter.added_date}</div>
        </div>
      ))}
    </div>
  );
}

function Comment({ comment, showReplyButtons, onToggleReplyButtons }) {
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);
  const { book_id } = useParams();
  const [showReplyInput, setShowReplyInput] = useState(false);
  

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const token = localStorage.getItem('token'); 
      if (!token) {
        throw new Error('Access token not found');
      }

      const response = await axios.post(`${apiUrl}/api/book_detail/${book_id}/comments/`, {
        parent_comment_id: comment.id, 
        text: replyText 
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Reply added successfully:', response.data);
      // Дополнительные действия после успешного добавления ответа

      // Очистить значение replyText после успешной отправки ответа
      setReplyText('');
    } catch (error) {
      console.error('Error adding reply:', error);
      // Обработка ошибки, например, отображение сообщения об ошибке пользователю
    }
  };

  const handleInputChange = (event) => {
    setReplyText(event.target.value);
  };

  const handleReplySubmit = () => {
    console.log('Ответ отправлен:', replyText);
    setReplyText('');
  };

  const handleToggleReply = () => {
    setShowReply(!showReply);
  };

  return (
    <div className='book_comment-reply' key={comment.id}>
      <div className='book_comment-info'>
        <div className='book__comment-rating'>{comment.rating}</div>
        <img className='book_comment-img' src={comment.profileimg} alt="Изображение пользователя" />
        <div className='book_comment-name'>{comment.username}</div>
        {comment.last_modified === "" ? 
        <div className='book_comment-time_since'>{comment.time_since}</div> : 
        <div className='book_comment-time_since'>Changed: {comment.last_modified}</div>
      }
      {comment.is_author === true &&<div className='book_comment_true_author'>Author</div>}
      </div>
      <p className='book_comment-text'>{comment.text}</p>
      {comment.image !== null &&<img className='reply-img' src={comment.image} alt=''/>}
      <button className='book__comment-reply_button' onClick={() => setShowReplyInput(!showReplyInput)}>Reply</button>
      {comment.replies.length > 0 &&<div className={`replies_open-button ${showReply ? 'show' : ''}`}>
        <button className='reply_button' onClick={handleToggleReply}>
          {showReply ? '-' : '+'}
        </button>
        <p className='open-replies'>open-replies&#40;{}&#41;</p>
      </div>}

      <div className={`replies-container ${showReply ? 'show' : ''}`}>
        {comment.replies && comment.replies.length > 0 && (
          <div className='comment-line'>
            {comment.replies.map((nestedReply) => (
              <Comment
                key={nestedReply.id}
                comment={nestedReply}
                showReplyButtons={showReplyButtons}
                onToggleReplyButtons={onToggleReplyButtons}
              />
            ))}
          </div>
        )}
      </div>
      {showReplyInput && 
      <div className="reply-input-container">
          <div className='reply-text'>Reply</div>
          <textarea
            type="text"
            value={replyText}
            onChange={handleInputChange}
            className='reply-input'
          />
          <button className='reply-input-container__button' onClick={handleSubmit}>Reply</button>
        </div>
        }
    </div>
  );
}



function AddComment() {
  const { book_id } = useParams();
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInput = useRef(null);

  const handleButtonClick = () => {
    fileInput.current.click();
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    const commentInput = event.target.elements.comment.value;
  
    try {
      const token = localStorage.getItem('token'); 
      if (!token) {
        throw new Error('Access token not found');
      }
  
      const formData = new FormData();
      if (commentInput) {
        formData.append('text', commentInput);
      }
      if (selectedFile) {
        formData.append('image', selectedFile);
      }
  
      const response = await axios.post(`${apiUrl}/api/book_detail/${book_id}/comments/`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
  
      console.log('Comment and image added successfully:', response.data);
  
      // Очистка поля ввода и выбранного изображения
      event.target.elements.comment.value = '';
      setSelectedFile(null);
  
    } catch (error) {
      console.error('Error adding comment and image:', error);
    }
  };

  return (
    <div className='add_comment'>
      <form className="reply-input-container" onSubmit={handleSubmit}>
        <div className='reply-img-input'>
          <textarea
            type="text"
            name="comment"
            className='reply-input'
            placeholder='Add a comment'
          />
      <button className='add_img' onClick={handleButtonClick}>
        <input
          ref={fileInput}
          style={{ display: 'none' }}
          type="file"
          onChange={handleFileChange}
        />
        <svg width="42px" height="42px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-labelledby="clipIconTitle" stroke="#888888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" color="#000000">
          <title id="clipIconTitle">Attachment (paper clip)</title>
          <path d="M7.93517 13.7796L15.1617 6.55304C16.0392 5.67631 17.4657 5.67631 18.3432 6.55304C19.2206 7.43052 19.2206 8.85774 18.3432 9.73522L8.40091 19.5477C6.9362 21.0124 4.56325 21.0124 3.09854 19.5477C1.63382 18.0837 1.63382 15.7093 3.09854 14.2453L12.9335 4.53784C14.984 2.48739 18.3094 2.48739 20.3569 4.53784C22.4088 6.58904 22.4088 9.91146 20.3584 11.9619L13.239 19.082"/>
        </svg>
      </button>
        </div>
        <button type="submit" className='reply-input-container__button'>Reply</button>
      </form>
    </div>
  );
}

function BookComment({ book_id }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyButtons, setShowReplyButtons] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/book_detail/${book_id}/comments/`, {
          
        });
        setComments(response.data.comments);
        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке комментариев', error);
        setLoading(false);
      }
    };

    fetchComments();
  }, [book_id, token, comments]); 


  const addComment = (newComment) => {
    setComments(prevComments => [...prevComments, newComment]);
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const toggleReplyButtons = (replyId) => {
    setShowReplyButtons((prevState) => ({
      ...prevState,
      [replyId]: !prevState[replyId],
    }));
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {!loading && (
        <div>
          {comments.map((comment) => (
            <div key={comment.id} className='book_comment'>
              <Comment
                comment={comment}
                showReplyButtons={showReplyButtons}
                onToggleReplyButtons={toggleReplyButtons}
              />
              {showReplies && comment.replies && comment.replies.length > 0 && (
                <div>
                  {comment.replies.map((reply) => (
                    <Comment
                      key={reply.id}
                      comment={reply}
                      showReplyButtons={showReplyButtons}
                      onToggleReplyButtons={toggleReplyButtons}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div><AddComment onAddComment={addComment} /></div>
    </div>
  );
}

function Navigation() {
  const [activeTab, setActiveTab] = useState('tab1'); 

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };
 return (
    <div>
        <div>
            <div className="navigation-tabs">
              <ul className="navigation-tabs__ul">
              <li><a onClick={() => handleTabClick('tab1')}>Library</a></li>
              <li><a onClick={() => handleTabClick('tab2')}>Books</a></li>
              <li><a onClick={() => handleTabClick('tab3')}>Series</a></li>
              <li><a onClick={() => handleTabClick('tab4')}>My Comments</a></li>
              <li><a onClick={() => handleTabClick('tab5')}>My Reviews</a></li>
              <li><a onClick={() => handleTabClick('tab6')}>Description</a></li>
              <li><a onClick={() => handleTabClick('tab7')}>Settings</a></li>
              </ul>
              <hr className="navigations-hr"></hr>
            </div>
                      {activeTab === 'tab1' && <ProfileLibrary />}
                      {activeTab === 'tab2' && <ProfileBooks />}
                      {activeTab === 'tab3' && <ProfileSeries />}
                      {activeTab === 'tab4' && <ProfileComments />}
                      {activeTab === 'tab6' && <ProfileDescription />}
                      {activeTab === 'tab7' && <ProfileSettingsNav />}
        </div>
    </div>
  );
};
function AuthorNavigation() {
  const [activeTab, setActiveTab] = useState('tab1'); 

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };
 return (
    <div>
        <div>
            <div className="navigation-tabs">
              <ul className="navigation-tabs__ul">
              <li><a onClick={() => handleTabClick('tab1')}>Library</a></li>
              <li><a onClick={() => handleTabClick('tab2')}>Books</a></li>
              <li><a onClick={() => handleTabClick('tab3')}>Series</a></li>
              <li><a onClick={() => handleTabClick('tab4')}>Comments</a></li>
              <li><a onClick={() => handleTabClick('tab5')}>Reviews</a></li>
              <li><a onClick={() => handleTabClick('tab6')}>Description</a></li>
              </ul>
              <hr className="navigations-hr"></hr>
            </div>
                      {activeTab === 'tab1' && <ProfileLibrary />}
                      {activeTab === 'tab2' && <ProfileBooks />}
                      {activeTab === 'tab3' && <ProfileSeries />}
                      {activeTab === 'tab4' && <ProfileComments />}
                      {activeTab === 'tab6' && <ProfileAuthorDescription />}
        </div>
    </div>
  );
};

// function AuthorProfile() {


//   return (
//       <div className='profile'>
//         <div className='profile-banner'><img src={profileData.banner_image} alt="#" className='banner-img'/></div>
//         <div className="profile-info">
//           <div className='avatar'><img className='avatar-img' src={profileData.profileimg} alt="#" /></div>
//           <div className='user-info'>
//             <div className='user-name' key={profileData.user.id}>
//               <div className='first_name'>{profileData.user.first_name}</div>
//               <div className='last_name'>{profileData.user.last_name}</div>
//             </div>
//             <div className='user-colum'>
//               <div className='user-first__colum'>
//                 <div className='user-tag'>{profileData.user.at_username}</div>
//                 <div className='user_followers__info'>
//                   <div className='user-followings'>{profileData.following_count} Followings</div>
//                   <div className='user-followers'>{profileData.followers_count} Followers</div>
//                 </div>
//                 <div className='user-book__info'>
//                   <div className='user-books'>{profileData.books_count} books</div>
//                   <div className='user-series'>{profileData.series_count} series</div>
//                 </div>
//               </div>
//               <div className='user-second__colum'>
//               <div className='about'>
//                     <div className='about-name'>About</div>
//               </div>
//                   <div className='about-description'>{profileData.about}</div>
//               </div>
//             </div>  
//           </div>
//         </div>
//         <div className="navigation-tabs">
//               <ul className="navigation-tabs__ul">
//               <li><a>Library</a></li>
//               <li><a>Books</a></li>
//               <li><a>Series</a></li>
//               <li><a>Comments</a></li>
//               <li><a>Reviews</a></li>
//               <li><a>Description</a></li>
//               </ul>
//               <hr className="navigations-hr"></hr>
//             </div>
//       </div>
//   );
// }

function ProfileAuthorDescription() {
  const [userData, setUserData] = useState(null);
  const [newDescription, setNewDescription] = useState('');
  const [inputVisible, setInputVisible] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      if (!token) {
        console.error('Токен отсутствует. Невозможно получить данные.');
        return;
      }
      
      const decodedToken = jwtDecode(token);
      const username = decodedToken.username;
      const response = await axios.get(`${apiUrl}/users/api/${username}/description`, {
        headers: {
          Authorization: `Bearer ${token}` 
        }
      }); 
  
      setUserData(response.data);
      setNewDescription(response.data.description); 
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };

  const handleChangeDescription = async () => {
    try {
      if (!token) {
        console.error('Токен отсутствует. Невозможно обновить описание.');
        return;
      }
      
      const decodedToken = jwtDecode(token);
      const username = decodedToken.username;
      const response = await axios.put(`${apiUrl}/users/api/${username}/description/`, { description: newDescription }, {
        headers: {
          Authorization: `Bearer ${token}` // Включение JWT токена в заголовок запроса
        }
      }); 

      if (response.status === 200) {
        // После успешного обновления описания обновляем данные
        fetchData();
        // Очищаем поле ввода
        setNewDescription('');
        // Скрываем input после изменения
        setInputVisible(false);
        console.log('Описание успешно обновлено.');
      } else {
        console.error('Ошибка при обновлении описания:', response.statusText);
      }
    } catch (error) {
      console.error('Ошибка при обновлении данных:', error);
    }
  };

  const handleShowInput = () => {
    setInputVisible(true);
  };

  return (
    <div className='description'>

        <div className="description-container">
          {userData && userData.description ? (
            <div className='prof_description'>
              <p className='profile_description'>{userData.description}</p>
            </div>
          ) : (
            <div>
              <p className='description-none'>Author not have any description yet:&lang;</p>
            </div>
          )}
        </div>
    </div>
  );
};


function ProfileDescription() {
  const [userData, setUserData] = useState(null);
  const [newDescription, setNewDescription] = useState('');
  const [inputVisible, setInputVisible] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      if (!token) {
        console.error('Токен отсутствует. Невозможно получить данные.');
        return;
      }
      
      const decodedToken = jwtDecode(token);
      const username = decodedToken.username;
      const response = await axios.get(`${apiUrl}/users/api/${username}/description`, {
        headers: {
          Authorization: `Bearer ${token}` 
        }
      }); 
  
      setUserData(response.data);
      setNewDescription(response.data.description); 
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };

  const handleChangeDescription = async () => {
    try {
      if (!token) {
        console.error('Токен отсутствует. Невозможно обновить описание.');
        return;
      }
      
      const decodedToken = jwtDecode(token);
      const username = decodedToken.username;
      const response = await axios.put(`${apiUrl}/users/api/${username}/description/`, { description: newDescription }, {
        headers: {
          Authorization: `Bearer ${token}` // Включение JWT токена в заголовок запроса
        }
      }); 

      if (response.status === 200) {
        // После успешного обновления описания обновляем данные
        fetchData();
        // Очищаем поле ввода
        setNewDescription('');
        // Скрываем input после изменения
        setInputVisible(false);
        console.log('Описание успешно обновлено.');
      } else {
        console.error('Ошибка при обновлении описания:', response.statusText);
      }
    } catch (error) {
      console.error('Ошибка при обновлении данных:', error);
    }
  };

  const handleShowInput = () => {
    setInputVisible(true);
  };

  return (
    <div className='description'>
      {inputVisible ? (
        <div className="input-container">
          <textarea className='input_description' defaultValue={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          <div className='prof_desc_buttons_menu'>
            <button className='change_description' onClick={handleChangeDescription}><svg fill="#858585" width="42px" height="42px" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
    <path d="M1827.701 303.065 698.835 1431.801 92.299 825.266 0 917.564 698.835 1616.4 1919.869 395.234z" fill-rule="evenodd"/>
</svg></button>
            <button className='change_description_stroke' onClick={() => setInputVisible(false)}><svg width="42px" stroke="#858585" height="42px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19 5L5 19M5.00001 5L19 19"  stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg></button>
          </div>
        </div>
      ) : (
        <div className="description-container">
          {userData && userData.description ? (
            <div className='prof_description'>
              <p className='profile_description'>{userData.description}</p>
              <button className='change_description_stroke' onClick={handleShowInput}><svg width="32px" stroke="#858585" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.4998 5.50067L18.3282 8.3291M13 21H21M3 21.0004L3.04745 20.6683C3.21536 19.4929 3.29932 18.9052 3.49029 18.3565C3.65975 17.8697 3.89124 17.4067 4.17906 16.979C4.50341 16.497 4.92319 16.0772 5.76274 15.2377L17.4107 3.58969C18.1918 2.80865 19.4581 2.80864 20.2392 3.58969C21.0202 4.37074 21.0202 5.63707 20.2392 6.41812L8.37744 18.2798C7.61579 19.0415 7.23497 19.4223 6.8012 19.7252C6.41618 19.994 6.00093 20.2167 5.56398 20.3887C5.07171 20.5824 4.54375 20.6889 3.48793 20.902L3 21.0004Z" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
</svg></button>
            </div>
          ) : (
            <div className='prof_desc_buttons'>
              <p className='description-none'>You do not have any description yet:&lang;</p>
              <button className='change_description_stroke' onClick={handleShowInput}><svg width="32px" stroke="#858585" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.4998 5.50067L18.3282 8.3291M13 21H21M3 21.0004L3.04745 20.6683C3.21536 19.4929 3.29932 18.9052 3.49029 18.3565C3.65975 17.8697 3.89124 17.4067 4.17906 16.979C4.50341 16.497 4.92319 16.0772 5.76274 15.2377L17.4107 3.58969C18.1918 2.80865 19.4581 2.80864 20.2392 3.58969C21.0202 4.37074 21.0202 5.63707 20.2392 6.41812L8.37744 18.2798C7.61579 19.0415 7.23497 19.4223 6.8012 19.7252C6.41618 19.994 6.00093 20.2167 5.56398 20.3887C5.07171 20.5824 4.54375 20.6889 3.48793 20.902L3 21.0004Z" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
</svg></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


const NavigationTabs = ({ tabs, currentTab, onTabChange }) => {
  return (
    <div className="navigation-tabs">
      <ul className='navigation-tabs__ul'>
        {tabs.map(tab => (
          <li key={tab.id} className={currentTab === tab.id ? 'active' : ''}>
            <Link to={tab.link} onClick={() => onTabChange(tab.id)}>
              {tab.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

function List() {
  const [following, setFollowing] = useState([]);
  const token = localStorage.getItem('token')
  useEffect(() => {
    const decodedToken = jwtDecode(token);
    const username = decodedToken.username
    axios.get(`${apiUrl}/users/api/${username}/following/`)
      .then(response => {
        setFollowing(response.data);
      })
      .catch(error => {
        console.error('There was an error!', error);
      });
  }, []);

  return (
    <div>
      {following.map((user, index) => (
        <div key={index} className='sidebar_following'>
          <img className='following_avatar' src={user.profile_img} alt="" />
          <div className='following_name'>{user.first_name} {user.last_name}</div>
        </div>
      ))}
    </div>
  );
}




function ProfileLibrary() {
  const [activeTab, setActiveTab] = useState('tab1');

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };
 return (

            <div className="navigation-tabs">
              <ul className="navigation-tabs__ul">
              <li><a onClick={() => handleTabClick('tab1')}>All</a></li>
              <li><a onClick={() => handleTabClick('tab2')}>Reading</a></li>
              <li><a onClick={() => handleTabClick('tab3')}>Liked</a></li>
              <li><a onClick={() => handleTabClick('tab4')}>Wish list</a></li>
              <li><a onClick={() => handleTabClick('tab5')}>Favorites</a></li>
              <li><a onClick={() => handleTabClick('tab6')}>Finished</a></li>
              </ul>
              <div>   
              {activeTab === 'tab1' && <BookProfileItem filterBy=''/>}
              {activeTab === 'tab2' && <BookProfileItem filterBy='reading'/>}
              {activeTab === 'tab3' && <BookProfileItem filterBy='liked'/>}
              {activeTab === 'tab4' && <BookProfileItem filterBy='wish_list'/>}
              {activeTab === 'tab5' && <BookProfileItem filterBy='favorites'/>}
              {activeTab === 'tab6' && <BookProfileItem filterBy='finished'/>}
                      </div>
            </div>

  );
};



const BookProfileItem = ({ filterBy }) => {
  const [books, setBooks] = useState([]);
  const token = localStorage.getItem('token');
  const decodedToken = jwtDecode(token);
  const username = decodedToken.username;

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get(`${apiUrl}/users/api/${username}/library?filter_by=${filterBy}`);
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
    <div className='books__items'>
      {books.map((book) => (
        <div className='books-items' key={book.id}>
          <div className='nav-book-items'>
            <a href={`book_detail/${book.id}`}><div className='bookitem-coverpage'><img src={book.coverpage} alt={book.name} /></div></a>
            <a href={`book_detail/${book.id}`}><div className='book-name'>{book.name}</div></a>
            <div className='book-author'>{book.author}</div>
          </div>
        </div>
      ))}
    </div>
  );
};



function ProfileBooks() {
  const [booksData, setBooksData] = useState([]); 

  const token = localStorage.getItem('token');


  useEffect(() => {
    const getBooks = async () => {
      try {
        const decodedToken = jwtDecode(token);
        const username = decodedToken.username;

        const response = await axios.get(`${apiUrl}/users/api/${username}/books/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          setBooksData(response.data);
        } else {

        }
      } catch (error) {
        console.error('Ошибка при получении профиля', error);
      }
    };

    getBooks();
  }, [token]);

 return (
    <div className='profile_book'>
      {booksData.map((book) => (
        <div className='profile__book'>
          <div className='profile__first_colum'>
            <div className='profile__img'>
            <Link to={`/book_detail/${book.id}`}><img src={book.coverpage} className='profile__book-img'/></Link>
            </div>
            <div className='profile__info'>
            <svg width="16px" fill="#ffffff" height="16px" viewBox="0 0 12 12" enable-background="new 0 0 12 12" id="Слой_1" version="1.1" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">

<g>

<circle cx="6" cy="6"  r="1.5"/>

<path d="M6,2C4,2,2,3,0,6c2,3,4,4,6,4s4-1,6-4C10,3,8,2,6,2z M6,8.5C4.621582,8.5,3.5,7.3789063,3.5,6   S4.621582,3.5,6,3.5S8.5,4.6210938,8.5,6S7.378418,8.5,6,8.5z" />

</g>

</svg>
              <div className="like-views__info">{book.views_count}</div>
              <div className="cirlce">&bull;</div>
              <svg fill="#ffffff" height="18px" width="18px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 512 512" xmlSpace="preserve">
<g>
	<g>
		<circle cx="99.692" cy="365.254" r="21.467"/>
	</g>
</g>
<g>
	<g>
		<path d="M512,274.581c0-18.759-10.265-35.165-25.474-43.896c3.372-6.811,5.243-14.443,5.243-22.416
			c0-27.888-22.689-50.577-50.577-50.577h-60.003c4.426-19.341,6.118-38.428,5.159-57.835c-1.26-25.252-22.132-45.639-48.047-45.639
			c-23.065,0-42.071,16.074-47.292,40.002c-5.842,26.784-18.697,49.155-37.173,64.694c-20.558,17.291-33.05,32.266-38.706,46.75
			h-40.666c-6.2-10.335-17.511-17.269-30.416-17.269H35.444C15.9,188.396,0,204.297,0,223.841v187.524
			c0,19.545,15.9,35.446,35.445,35.446h108.605c12.904,0,24.215-6.934,30.416-17.268h33.761
			c8.284,16.966,25.614,28.239,45.418,28.239h167.317c27.888,0,50.577-22.689,50.577-50.577c0-7.973-1.871-15.605-5.243-22.416
			c15.209-8.731,25.474-25.137,25.474-43.896c0-7.973-1.871-15.605-5.243-22.416C501.735,309.746,512,293.34,512,274.581z
			 M145.777,411.15l-0.024,0.348c-0.003,0.043,0,0.084-0.002,0.127c-0.127,0.829-0.837,1.467-1.701,1.467H35.445
			c-0.953,0-1.727-0.776-1.727-1.729V223.841c0-0.953,0.774-1.729,1.727-1.729h108.605c0.863,0,1.573,0.637,1.701,1.464
			c0.002,0.044,0,0.087,0.002,0.129l0.024,0.346V411.15z M461.423,291.44h-11.585c-8.47,0-15.625,6.285-16.718,14.684
			c-1.092,8.4,4.218,16.306,12.406,18.473c7.375,1.951,12.526,8.652,12.526,16.296c0,9.296-7.563,16.859-16.859,16.859h-11.585
			c-8.47,0-15.625,6.285-16.718,14.684c-1.092,8.4,4.218,16.306,12.406,18.473c7.375,1.951,12.526,8.652,12.526,16.296
			c0,9.296-7.563,16.859-16.859,16.859H253.645c-8.3,0-15.293-5.93-16.63-14.1c-1.334-8.152-8.378-14.138-16.639-14.138h-40.881
			V239.382h48.939c8.963,0,16.359-7.012,16.835-15.962c0.491-9.199,10.674-22.22,30.271-38.701
			c24.227-20.377,40.968-49.186,48.412-83.311c2.652-12.159,10.919-13.471,14.349-13.471c7.842,0,13.997,6.124,14.371,13.594
			c1.114,22.526-2.062,44.674-9.711,67.709c-1.707,5.14-0.841,10.786,2.329,15.178c3.168,4.391,8.255,6.993,13.67,6.993h82.231
			c9.296,0,16.859,7.563,16.859,16.859c0,7.644-5.151,14.345-12.526,16.296c-8.188,2.167-13.498,10.073-12.406,18.473
			c1.094,8.4,8.248,14.684,16.718,14.684h11.585c9.296,0,16.859,7.563,16.859,16.859C478.282,283.876,470.719,291.44,461.423,291.44
			z"/>
	</g>
</g>
</svg>
              <div className="like-views__info">{book.upvote_count}</div>
              <div className="cirlce">&bull;</div>
              <svg width="20px" height="20px" viewBox="0 0 512 512" fill="#ffffff"  version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
    <title>pen</title>
    <g id="Page-1" stroke="none" stroke-width="1"  fill-rule="evenodd">
        <g id="edit" transform="translate(42.666667, 42.666667)">
            <path d="M426.666667,384 L426.666667,426.666667 L3.55271368e-14,426.666667 L3.55271368e-14,384 L426.666667,384 Z M277.333333,7.10542736e-15 L384,106.666667 L149.333333,341.333333 L42.6666667,341.333333 L42.6666667,234.666667 L277.333333,7.10542736e-15 Z M207.079667,130.583 L85.3333333,252.330667 L85.3333333,298.666667 L131.669333,298.666667 L253.415667,176.919 L207.079667,130.583 Z M277.333333,60.3306667 L237.249667,100.413 L283.585667,146.749 L323.669333,106.666667 L277.333333,60.3306667 Z">

</path>
        </g>
    </g>
</svg>
              <div className="like-views__info">Changed:{book.formatted_last_modified}</div>
            </div>
          </div>
          <div className='profile__second_colum'>
            <div className='books__views'>{book.author}</div>
            <ul>
              <li className='profile__books_name'><Link to={`/book_detail/${book.id}`}>{book.name}</Link></li>
              <li>
                <div className='profile__series_colum'>
                  <div className='profile__books_series'>Series:{book.series}</div>
                  <div className="cirlce">&bull;</div>
                  <div className='profile__books_volume'>Volume:{book.volume_number}</div>
                </div>
              </li>
              <li className='profile__books_description'>{book.description}</li>
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

function ProfileComments() {

  
  return(
    <div><ProfileCommentsItem /></div>
  )
}

function ProfileCommentsItem() {
  const [commentData, setCommentData] = useState([]); 

  const token = localStorage.getItem('token');


  useEffect(() => {
    const getComment = async () => {
      try {
        const decodedToken = jwtDecode(token);
        const username = decodedToken.username;

        const response = await axios.get(`${apiUrl}/users/api/${username}/comments/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          setCommentData(response.data.comments);
        } else {

        }
      } catch (error) {
        console.error('Ошибка при получении профиля', error);
      }
    };

    getComment();
  }, [token]);

  return (
    <div className='comment'>
      {commentData.map((comment) => (
        <div className='comment-items'>
          <div className='comment-item_1'>
            <div className='comment-views'>Your comments</div>
            <div className='comment-content-text'>{comment.text}</div>
          </div>
          <div className='comment-item_2'>
            <div className='comment-views'>In reply to</div>
            <Link to={`/book_detail/${comment.book}`}><div className='comment-content'>{comment.book_name}</div></Link>
          </div>
          <div className='comment-item_3'>
            <div className='comment-views'>Date</div>
            <div className='comment-content'>{comment.formatted_timestamp}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const ProfileSeries = () => {
  const [seriesData, setSeriesData] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const getSeries = async () => {
      try {
        const decodedToken = jwtDecode(token);
        const username = decodedToken.username;

        const response = await axios.get(`${apiUrl}/users/api/${username}/series/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          setSeriesData(response.data);
        } else {
          // Handle error
        }
      } catch (error) {
        console.error('Error fetching series data', error);
      }
    };

    getSeries();
  }, [token]);

  const handleSeriesClick = (series) => {
    setSelectedSeries(series === selectedSeries ? null : series);
  };

  return (
    <div className='profile-series'>
      {seriesData.map((series) => (
        <div key={series.id} onClick={() => handleSeriesClick(series)}>
          <div className='series_name'> <div className={`triangle_ser ${selectedSeries === series ? 'down' : 'right'}`} />{series.name}</div>
          {selectedSeries === series && (
            <div>
              {series.books.map((book) => (
                <div key={book.id}>
                  <div className='profile__book'>
          <div className='profile__first_colum'>
            <div className='profile__img'>
            <Link to={`/book_detail/${book.id}`}><img src={book.coverpage} className='profile__book-img'/></Link>
            </div>
            <div className='profile__info'>
            <svg width="16px" fill="#ffffff" height="16px" viewBox="0 0 12 12" enable-background="new 0 0 12 12" id="Слой_1" version="1.1" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">

<g>

<circle cx="6" cy="6"  r="1.5"/>

<path d="M6,2C4,2,2,3,0,6c2,3,4,4,6,4s4-1,6-4C10,3,8,2,6,2z M6,8.5C4.621582,8.5,3.5,7.3789063,3.5,6   S4.621582,3.5,6,3.5S8.5,4.6210938,8.5,6S7.378418,8.5,6,8.5z" />

</g>

</svg>
              <div className="like-views__info">{book.views_count}</div>
              <div className="cirlce">&bull;</div>
              <svg fill="#ffffff" height="18px" width="18px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 512 512" xmlSpace="preserve">
<g>
	<g>
		<circle cx="99.692" cy="365.254" r="21.467"/>
	</g>
</g>
<g>
	<g>
		<path d="M512,274.581c0-18.759-10.265-35.165-25.474-43.896c3.372-6.811,5.243-14.443,5.243-22.416
			c0-27.888-22.689-50.577-50.577-50.577h-60.003c4.426-19.341,6.118-38.428,5.159-57.835c-1.26-25.252-22.132-45.639-48.047-45.639
			c-23.065,0-42.071,16.074-47.292,40.002c-5.842,26.784-18.697,49.155-37.173,64.694c-20.558,17.291-33.05,32.266-38.706,46.75
			h-40.666c-6.2-10.335-17.511-17.269-30.416-17.269H35.444C15.9,188.396,0,204.297,0,223.841v187.524
			c0,19.545,15.9,35.446,35.445,35.446h108.605c12.904,0,24.215-6.934,30.416-17.268h33.761
			c8.284,16.966,25.614,28.239,45.418,28.239h167.317c27.888,0,50.577-22.689,50.577-50.577c0-7.973-1.871-15.605-5.243-22.416
			c15.209-8.731,25.474-25.137,25.474-43.896c0-7.973-1.871-15.605-5.243-22.416C501.735,309.746,512,293.34,512,274.581z
			 M145.777,411.15l-0.024,0.348c-0.003,0.043,0,0.084-0.002,0.127c-0.127,0.829-0.837,1.467-1.701,1.467H35.445
			c-0.953,0-1.727-0.776-1.727-1.729V223.841c0-0.953,0.774-1.729,1.727-1.729h108.605c0.863,0,1.573,0.637,1.701,1.464
			c0.002,0.044,0,0.087,0.002,0.129l0.024,0.346V411.15z M461.423,291.44h-11.585c-8.47,0-15.625,6.285-16.718,14.684
			c-1.092,8.4,4.218,16.306,12.406,18.473c7.375,1.951,12.526,8.652,12.526,16.296c0,9.296-7.563,16.859-16.859,16.859h-11.585
			c-8.47,0-15.625,6.285-16.718,14.684c-1.092,8.4,4.218,16.306,12.406,18.473c7.375,1.951,12.526,8.652,12.526,16.296
			c0,9.296-7.563,16.859-16.859,16.859H253.645c-8.3,0-15.293-5.93-16.63-14.1c-1.334-8.152-8.378-14.138-16.639-14.138h-40.881
			V239.382h48.939c8.963,0,16.359-7.012,16.835-15.962c0.491-9.199,10.674-22.22,30.271-38.701
			c24.227-20.377,40.968-49.186,48.412-83.311c2.652-12.159,10.919-13.471,14.349-13.471c7.842,0,13.997,6.124,14.371,13.594
			c1.114,22.526-2.062,44.674-9.711,67.709c-1.707,5.14-0.841,10.786,2.329,15.178c3.168,4.391,8.255,6.993,13.67,6.993h82.231
			c9.296,0,16.859,7.563,16.859,16.859c0,7.644-5.151,14.345-12.526,16.296c-8.188,2.167-13.498,10.073-12.406,18.473
			c1.094,8.4,8.248,14.684,16.718,14.684h11.585c9.296,0,16.859,7.563,16.859,16.859C478.282,283.876,470.719,291.44,461.423,291.44
			z"/>
	</g>
</g>
</svg>
              <div className="like-views__info">{book.upvote_count}</div>
              <div className="cirlce">&bull;</div>
              <svg width="20px" height="20px" viewBox="0 0 512 512" fill="#ffffff"  version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
    <title>pen</title>
    <g id="Page-1" stroke="none" stroke-width="1"  fill-rule="evenodd">
        <g id="edit" transform="translate(42.666667, 42.666667)">
            <path d="M426.666667,384 L426.666667,426.666667 L3.55271368e-14,426.666667 L3.55271368e-14,384 L426.666667,384 Z M277.333333,7.10542736e-15 L384,106.666667 L149.333333,341.333333 L42.6666667,341.333333 L42.6666667,234.666667 L277.333333,7.10542736e-15 Z M207.079667,130.583 L85.3333333,252.330667 L85.3333333,298.666667 L131.669333,298.666667 L253.415667,176.919 L207.079667,130.583 Z M277.333333,60.3306667 L237.249667,100.413 L283.585667,146.749 L323.669333,106.666667 L277.333333,60.3306667 Z">

</path>
        </g>
    </g>
</svg>
              <div className="like-views__info">Changed:{book.formatted_last_modified}</div>
            </div>
          </div>
          <div className='profile__second_colum'>
            <div className='books__views'>{book.author}</div>
            <ul>
              <li className='profile__books_name'><Link to={`/book_detail/${book.id}`}>{book.name}</Link></li>
              <li>
                <div className='profile__series_colum'>
                  <div className='profile__books_series'>Series:{book.series}</div>
                  <div className="cirlce">&bull;</div>
                  <div className='profile__books_volume'>Volume:{book.volume_number}</div>
                </div>
              </li>
              <li className='profile__books_description'>{book.description}</li>
            </ul>
          </div>
        </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};




function ProfileSettingsNav() {
  const [activeTab, setActiveTab] = useState('tab1'); // Исходная активная вкладка

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };
 return (
    <div className='navigation__setting'>
        <div className='navigation__settings'>
            <div className="navigation-tabs">
              <ul className="navigation-tabs__ul">
              <li><a onClick={() => handleTabClick('tab1')}>Profile Settings</a></li>
              <li><a onClick={() => handleTabClick('tab2')}>Privacy & Security</a></li>
              <li><a onClick={() => handleTabClick('tab3')}>Notifications</a></li>
              <li><a onClick={() => handleTabClick('tab5')}>Series</a></li>
              <li><a onClick={() => handleTabClick('tab6')}>Books</a></li>
              </ul>
            </div>
            <div className='settings__content'>
                      {activeTab === 'tab1' && <ProfileSettings />}
                      {activeTab === 'tab2' && <Privacy />}
                      {activeTab === 'tab3' && <Notifications />}
        </div>
        </div>
    </div>
  );
}

function ProfileSettings() {
  const [profileData, setProfileData] = useState({
    user: {
      first_name: '',
      last_name: '',
      at_username: '',
      profile_img: '', 
    }
  });
  const [profileChangeData, setProfileChangeData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    profile_img: '', 
  });
  const token = localStorage.getItem('token');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setAtUsername] = useState('');

  useEffect(() => {
    const getProfile = async () => {
      try {
        const decodedToken = jwtDecode(token);
        const username = decodedToken.username;

        const response = await axios.get(`${apiUrl}/users/api/${username}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          setProfileData(response.data);
          setProfileChangeData(response.data.user);
        } else {
          // Обработка ошибки
        }
      } catch (error) {
        console.error('Ошибка при получении профиля', error);
      }
    };

    getProfile();
  }, [token]);

  useEffect(() => {
    setFirstName(profileData.user.first_name);
    setLastName(profileData.user.last_name);
    setAtUsername(profileData.user.at_username);
  }, [profileData]);

  const handleFirstNameChange = (e) => {
    const value = e.target.value;
    setFirstName(value);
    setProfileChangeData((prevData) => ({
      ...prevData,
      first_name: value !== profileData.user.first_name ? value : profileData.user.first_name,
    }));
  };
  
  const handleLastNameChange = (e) => {
    const value = e.target.value;
    setLastName(value);
    setProfileChangeData((prevData) => ({
      ...prevData,
      last_name: value !== profileData.user.last_name ? value : profileData.user.last_name,
    }));
  };
  
  const handleAtUsernameChange = (e) => {
    const value = e.target.value;
    setAtUsername(value);
    setProfileChangeData((prevData) => ({
      ...prevData,
      username: value !== profileData.user.at_username ? value : profileData.user.at_username,
    }));
  };
  const handleDobVisibilityChange = (e) => {
    const visibilityOption = parseInt(e.target.value);
    setProfileData((prevData) => ({
      ...prevData,
      display_dob_option: visibilityOption,
    }));
  };
  

  const handleGenderChange = (e) => {
    const genderOption = e.target.value;
    setProfileData((prevData) => ({
      ...prevData,
      gender: genderOption,
    }));
  };

  const [tempImage, setTempImage] = useState(null);
  const [finalImage, setFinalImage] = useState(null);
  const [tempBanner, setTempBanner] = useState(null);
const [finalBanner, setFinalBanner] = useState(null);

const handleBannerUpload = (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  
  reader.onload = () => {
    const bannerDataUrl = reader.result;
    setFinalBanner(bannerDataUrl); // Устанавливаем изображение для предпросмотра
    setTempBanner(file); // Устанавливаем временное изображение для сохранения
  };

  if (file) {
    reader.readAsDataURL(file);
  }
};
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = () => {
      const imageDataUrl = reader.result;
      setFinalImage(imageDataUrl); // Устанавливаем изображение для предпросмотра
      setTempImage(file); // Устанавливаем временное изображение для сохранения
    };
  
    if (file) {
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append('first_name', profileChangeData.first_name);
      formData.append('last_name', profileChangeData.last_name);
      formData.append('at_username', profileChangeData.username);
      formData.append('display_dob_option', profileData.display_dob_option);
      formData.append('gender', profileData.gender);
  
      // Проверяем, изменилось ли изображение профиля
      if (finalImage !== null) {
        formData.append('profile_img', finalImage);
      }
  
      // Проверяем, изменился ли баннер
      if (finalBanner !== null) {
        formData.append('banner_image', finalBanner);
      }
  
      const response = await axios.put(`${apiUrl}/users/api/settings/web_page_settings/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        const { profile_img, banner_image } = response.data;
        console.log(response.data)
        setProfileData(prevData => ({
          ...prevData,
          user: {
            ...prevData.user,
            profile_img,
            banner_image
          }
        }));
      }
      
      console.log('Успешно сохранено:', response.data);
    } catch (error) {
      console.error('Ошибка при сохранении профиля', error);
    }
  };
  return (
    <div className='profile-settings'>
      <div className="settings-views">Preview (This is how others see Your profile)</div>
      <div className='profile-banner'><img src={finalBanner || profileData.banner_image} alt="#" className='banner-img'/>
</div>
      <div className="profile-info">
        <div className='avatar'><img className='avatar-img' src={finalImage || profileData.profileimg} alt="#" /></div>
        <div className='user-info'>
          <div className='user-name'>
            <div className='first_name'>{firstName}</div>
            <div className='last_name'>{lastName}</div>
          </div>
          <div className='user-colum'>
            <div className='user-first__colum'>
              <div className='user-tag'>{username}</div>
              <div className='user_followers__info'>
                <div className='user-followings'>{profileData.following_count}Followings</div>
                <div className='user-followers'>{profileData.followers_count}Followers</div>
              </div>
              <div className='user-book__info'>
                <div className='user-books'>{profileData.books_count}books</div>
                <div className='user-series'>{profileData.series_count}series</div>
              </div>
            </div>
            <div className='user-second__colum'>
              <div className='about'>
                <div className='about-name'>About</div>
                <div className='about-description'>{profileData.about}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="profile-info__change">
        <div className="change">
          <ul className='change-ul'>
            <li className='change-li'>
              <p>Avatar</p>
              <form action="/upload" method='post' encType='multipart/form-data'>
                <div className='avatar_upload'>
                  <label htmlFor="avatar">Upload</label>
                  <input id="avatar" type="file" accept='image/*' style={{ display: 'none' }} onChange={handleImageUpload} />
                </div>
              </form>
            </li>
            <li className='change-li'>
              <p>Banner</p>
              <form action="/upload" method='post' encType='multipart/form-data'>
    <div className='avatar_upload'>
      <label htmlFor="banner">Upload</label>
      <input id="banner" type="file" accept='image/*' style={{ display: 'none' }} onChange={handleBannerUpload} />
    </div>
  </form>
            </li>
            <li className='change-li'>
              <label htmlFor='FirstName'>Firstname</label>
              <input
                type="text"
                className='change-input'
                id="firstName"
                value={firstName}
                onChange={handleFirstNameChange}
              />
            </li>
            <li className='change-li'>
              <label className='change-label'>Lastname</label>
              <input
                type="text"
                className='change-input'
                id="lastName"
                value={lastName}
                onChange={handleLastNameChange}
              />
            </li>
            <li className='change-li'>
              <label className='change-label'>Username</label>
              <input
                type="text"
                className='change-input'
                id="atUsername"
                value={username}
                onChange={handleAtUsernameChange}
              />
            </li>
            <li className='change-li'>
              <label className='change-label'>Date of Birth</label>
              <BirthSelector />
            </li>
            <li className='change-li'>
              <label className='change-label'>Date of Birth Visibility</label>
              <select className='change-input' onChange={handleDobVisibilityChange}>
                <option value="1">No One</option>
                <option value="2">Friends Only(Default)</option>
                <option value="3">Everyone</option>
              </select>
            </li>
            <li className='change-li'>
              <label className='change-label'>Gender</label>
              <select className='change-input' onChange={handleGenderChange}>
                <option value="1">Not Specified</option>
                <option value="2">Male</option>
                <option value="3">Female</option>
                <option value="4">Other</option>
              </select>
            </li>
          </ul>
          <div className="change-buttons">
            <button className='save-button' onClick={handleSave}>Save</button>
            <button className='discard-button'>Discard</button>
          </div>
        </div>
      </div>
    </div>
  );
}



function Books() {
  const itemsPerPage = 0; 
  const [visibleItems, setVisibleItems] = useState(itemsPerPage);
  const allItems = [
    <div className='book_button'><a className='pool-button'><img className='pool_icon' src={Book}></img>4elovek Pidor</a></div>,
    <div className='book_button'><a className='pool-button'><img className='pool_icon' src={Book}></img>4elovek Pidor</a></div>,
    <div className='book_button'><a className='pool-button'><img className='pool_icon' src={Book}></img>4elovek Pidor</a></div>,
    <div className='book_button'><a className='pool-button'><img className='pool_icon' src={Book}></img>4elovek Pidor</a></div>,
    <div className='book_button'><a className='pool-button'><img className='pool_icon' src={Book}></img>4elovek Pidor</a></div>,
    <div className='book_button'><a className='pool-button'><img className='pool_icon' src={Book}></img>4elovek Pidor</a></div>,
  ];
  const [isExpanded, setIsExpanded] = useState(false);

  const showMoreOrLessItems = () => {
    if (isExpanded) {
      setVisibleItems(itemsPerPage);
    } else {
      setVisibleItems(allItems.length);
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="button-container">
      <ul>
        {allItems.slice(0, visibleItems).map((item, index) => (
          <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
        ))}
      </ul>
      <a onClick={showMoreOrLessItems}>
        <div className='svg-container'>
          <ul>
            <li><img src={Drop}></img></li>
            <li><img className='drop-svg' src={Drop}></img></li>
          </ul>    
        </div>
        {isExpanded}
        
      </a>
    </div>
  );
};


function SearchBooks() {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    try {
      const response = await axios.get(`#=${searchText}`);
      setResults(response.data);
    } catch (error) {
      console.error('error', error);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
      <button onClick={handleSearch}>Искать</button>

      <ul>
        {results.map((book) => (
          <li key={book.id}>
            {book.title} - {book.author}
          </li>
        ))}
      </ul>
    </div>
  );
}

// function Login() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const navigate = useNavigate();
//   const [loggedIn, setLoggedIn] = useState(false);



//   const handleLogin = async () => {
//     try {
//       const response = await axios.post(`${apiUrl}/users/api/login/`, {
//         email,
//         password,
//       });

//       if (response.status === 200) {
//         const { access, refresh } = response.data;
//         localStorage.setItem('token', access);
//         localStorage.setItem('refreshToken', refresh); 
//         setLoggedIn(true);
//         navigate('/');
//       } else {
//         console.error('Ошибка при входе', response);
//       }
//     } catch (error) {
//       console.error('Ошибка при входе', error);
//     }
//   };

//   return (
//     <div className="formContainer">
//       <div className="formWrapper">
//         <Link to="/">
//           <span className="logo-register">
//           <svg width="227" height="100" viewBox="0 0 227 100" fill="none" xmlns="http://www.w3.org/2000/svg">
// <g clip-path="url(#clip0_40_384)">
// <path d="M150.874 30.0955C151.068 30.1807 150.774 30.0143 150.759 30.0021C150.703 29.9615 150.647 29.9128 150.595 29.8641C150.483 29.7585 150.398 29.6571 150.327 29.5353C150.118 29.1781 150.01 28.7437 149.973 28.3256C149.94 27.9481 149.966 27.5909 150.063 27.2296C150.159 26.8684 150.338 26.4746 150.498 26.2595C150.647 26.0606 150.818 25.886 150.993 25.7196C150.774 25.9307 151.124 25.6181 151.142 25.6059C151.22 25.5491 151.302 25.4963 151.38 25.4395C151.775 25.1635 151.042 25.5978 151.474 25.3867C151.559 25.3421 151.649 25.2974 151.734 25.2487C152.185 25.0092 151.299 25.4192 151.771 25.2284C151.909 25.1716 152.043 25.1147 152.177 25.062C152.665 24.8712 153.156 24.7007 153.651 24.5302C153.752 24.4937 154.068 24.38 153.599 24.5465C153.771 24.4856 153.946 24.4287 154.117 24.3719C154.433 24.2664 154.75 24.1568 155.066 24.0512C157.423 23.2637 159.798 22.529 162.181 21.847C163.372 21.5061 164.567 21.1732 165.766 20.8566C166.35 20.7023 166.935 20.5521 167.523 20.4019C167.817 20.3289 168.107 20.2558 168.402 20.1827C168.521 20.1543 168.636 20.1259 168.755 20.0975C168.815 20.0813 169.489 19.9189 169.168 19.996C168.815 20.0813 169.396 19.9432 169.407 19.9392C169.582 19.8986 169.76 19.8539 169.935 19.8133C170.289 19.7322 170.643 19.6469 170.993 19.5698C171.67 19.4155 172.348 19.2653 173.025 19.1192C174.41 18.8188 175.803 18.5387 177.195 18.2708C177.75 18.1653 178.331 17.9786 178.837 17.7066C179.086 17.5726 179.604 17.2885 179.715 16.9556C179.995 16.1316 178.215 16.3995 177.977 16.4442C172.538 17.4833 167.139 18.7701 161.801 20.3005C159.213 21.0433 156.637 21.847 154.083 22.7076C152.806 23.1379 151.503 23.5357 150.26 24.0756C149.016 24.6155 147.624 25.3177 146.678 26.4543C145.964 27.3149 145.573 28.354 145.658 29.5272C145.744 30.7003 146.373 31.5243 147.341 31.9587C147.699 32.121 148.369 32.0033 148.719 31.9384C149.262 31.8369 149.869 31.6542 150.36 31.3741C150.852 31.094 151.749 30.4811 150.874 30.0914V30.0955Z" />
// <path d="M35.9632 33.5014C35.9074 33.7003 35.8329 33.8262 35.9558 33.5623C35.9856 33.5014 36.1121 33.3269 36.1121 33.2741C36.1121 33.3675 35.7883 33.6557 36.0116 33.4446C36.0861 33.3756 36.3728 33.0833 36.0489 33.3878C35.6505 33.7612 36.1196 33.3553 36.1159 33.3634C36.0973 33.4202 35.5165 33.676 35.8515 33.5298C35.967 33.4771 36.3541 33.3147 35.859 33.5055C35.3638 33.6963 35.7064 33.5664 35.818 33.5339C36.3392 33.3837 35.5277 33.5745 35.5277 33.5826C35.5351 33.5542 35.8143 33.5542 35.8404 33.5501C36.1308 33.5095 35.2187 33.5217 35.5016 33.5501C35.5947 33.5582 35.6915 33.5582 35.7883 33.5664C35.8851 33.5745 35.9744 33.5948 36.0675 33.6029C36.3281 33.6191 35.5388 33.4568 35.7845 33.5501C35.9558 33.6151 36.1419 33.6557 36.3169 33.7206C36.3914 33.749 36.652 33.8667 36.3169 33.7125C35.967 33.5542 36.2834 33.7044 36.3616 33.745C36.5105 33.8262 36.652 33.9195 36.7934 34.0169C36.9349 34.1144 37.0652 34.228 37.203 34.3376C37.5082 34.5852 36.9796 34.09 37.1285 34.2686C37.1918 34.3457 37.27 34.4107 37.3333 34.4838C37.8619 35.0561 38.2863 35.73 38.6325 36.4484L38.4203 36.0019C38.9751 37.1913 39.2915 38.4821 39.3511 39.8176L39.3325 39.3183C39.3548 40.0531 39.2915 40.7756 39.1538 41.4982C39.0756 41.9163 38.9788 42.3303 38.8708 42.7403C38.815 42.9514 38.7554 43.1584 38.6921 43.3654C38.6623 43.471 38.6288 43.5724 38.5953 43.678C38.4799 44.0555 38.6661 43.4831 38.5842 43.7226C37.9922 45.4072 37.2811 47.0309 36.5366 48.6425C35.9148 49.9901 35.2857 51.3338 34.7682 52.7342C34.1651 54.3782 33.6178 56.0506 33.1189 57.7393C31.1346 64.4574 29.7795 71.5651 29.6306 78.6364C29.5673 81.6159 29.3328 86.0892 32.3781 87.5018C34.7942 88.6222 37.5827 87.2014 39.124 85.1028C39.6601 84.3721 40.1217 83.5968 40.5424 82.7809C41.5736 80.7675 42.4374 78.6526 43.2973 76.5499C44.3025 74.0941 45.2705 71.622 46.2757 69.1621C47.1319 67.0675 47.9919 64.9567 49.0157 62.9514C49.2093 62.5739 49.4066 62.2004 49.6188 61.8391C49.7007 61.6971 49.7901 61.5591 49.8757 61.421C50.0916 61.076 49.805 61.5996 49.7082 61.6565C49.7603 61.6281 49.8124 61.5103 49.8534 61.4576C50.0842 61.145 50.3299 60.8446 50.5905 60.5605C50.7059 60.4306 50.8474 60.3129 50.9591 60.1789C50.6091 60.6132 50.6612 60.4387 50.8139 60.321C50.8288 60.3088 51.1527 60.049 51.1601 60.0612C51.1638 60.0652 50.5347 60.4265 50.9218 60.2195C51.108 60.118 51.3909 60.0896 50.5979 60.3372C50.7022 60.3047 50.9553 60.252 50.49 60.3494C49.7715 60.4955 50.8325 60.3738 50.181 60.39C49.5295 60.4062 50.6352 60.5118 49.8348 60.3575C49.3396 60.2641 49.5071 60.2844 49.6077 60.3169C49.8534 60.3981 48.9934 59.9962 49.2614 60.1545C49.4662 60.2804 49.2428 60.3291 49.0194 59.9151C49.0418 59.9556 49.0902 59.9841 49.1162 60.0246C49.1758 60.118 49.2354 60.2033 49.2838 60.3007L49.0716 59.8542C49.4327 60.6214 49.4774 61.5591 49.5146 62.4034L49.496 61.9041C49.6188 65.05 49.2279 68.196 49.1609 71.3419C49.1348 72.6287 49.0641 74.0494 49.4066 75.2956C50.0954 77.7961 52.8168 77.6216 54.6373 76.7488C56.1004 76.0506 57.3215 74.7679 58.4458 73.5582C59.5701 72.3486 60.5455 71.1958 61.5544 69.9739C64.2982 66.6413 66.8819 63.1503 69.3055 59.5375C71.5057 56.2577 73.6836 52.8073 75.1318 49.0443C75.3254 48.541 75.4967 48.0295 75.6642 47.5181C75.8318 47.0066 75.3887 46.4545 75.0537 46.2272C74.5622 45.8903 73.799 45.805 73.2406 45.8822C71.9413 46.0567 70.6867 46.6981 70.2288 48.0945C70.4745 47.3476 70.1878 48.196 70.1171 48.3867C70.0203 48.6506 69.9161 48.9104 69.8118 49.1661C69.5922 49.7019 69.3539 50.2296 69.1045 50.7533C68.5609 51.8939 67.9653 53.0021 67.3435 54.09C66.6511 55.2956 65.9251 56.4769 65.1731 57.6419C64.7859 58.2426 64.3913 58.8393 63.9892 59.432C63.8924 59.5781 63.7919 59.7202 63.6951 59.8663C63.643 59.9435 63.3377 60.3859 63.5648 60.0571C63.7919 59.7283 63.4419 60.2357 63.3973 60.3007C63.2856 60.4631 63.1739 60.6214 63.0585 60.7837C60.2626 64.7537 57.288 68.6465 54.0156 72.1659C53.7326 72.4704 53.4422 72.7748 53.1481 73.0671C53.029 73.1848 52.9099 73.2984 52.7907 73.4162C52.4668 73.7287 53.3008 72.9615 53.07 73.1604C53.0141 73.2091 52.962 73.2579 52.9061 73.3066C52.787 73.408 52.6642 73.5095 52.5413 73.607C52.4594 73.6719 52.37 73.7287 52.2881 73.7977C52.0499 73.9966 52.8503 73.5704 52.4259 73.7166C52.4557 73.7084 53.1444 73.5095 52.7051 73.607C53.0513 73.5298 53.23 73.5014 53.539 73.4974C54.0826 73.4933 53.9262 73.4974 53.8071 73.4933C53.5763 73.4771 54.5628 73.6719 54.3208 73.5948C54.0379 73.5014 54.9165 73.9439 54.6745 73.7571C54.4958 73.6232 54.991 74.1631 54.924 73.9926C54.8867 73.8992 54.7862 73.8059 54.7378 73.7084L54.95 74.1549C54.641 73.4933 54.6112 72.6774 54.5814 71.9467L54.6001 72.446C54.4847 69.3082 54.8867 66.1704 54.9426 63.0366C54.9649 61.6687 55.017 60.1789 54.6634 58.8475C54.5331 58.3482 54.3208 57.8124 53.9746 57.4511C52.8652 56.2901 51.1117 56.3713 49.7231 56.7894C45.7209 57.991 43.8297 62.4643 42.2289 66.215C40.6131 69.9983 39.1575 73.8586 37.5678 77.654C36.9014 79.2412 36.2238 80.8324 35.442 82.3587C35.1628 82.9067 34.8575 83.4263 34.5336 83.9418C34.8017 83.5116 34.8426 83.5116 34.6267 83.7957C34.422 84.0677 34.1986 84.3112 33.9789 84.567C33.7965 84.774 34.1874 84.3721 34.1762 84.3843C34.1018 84.4452 33.871 84.5873 34.2321 84.364C34.422 84.2463 34.6304 84.1529 34.8426 84.092C34.7682 84.1123 35.5425 83.9824 35.2708 84.0068C34.999 84.0311 35.7734 84.0068 35.6952 84.0068C35.6058 84.0068 35.3899 83.9581 35.8031 84.0352C36.2164 84.1123 36.0116 84.0758 35.9186 84.0433C35.9632 84.0596 36.3839 84.3194 36.1605 84.1489C36.101 84.1042 35.7548 83.8322 36.0228 84.0677C36.276 84.2869 36.0079 84.0271 35.9521 83.9581C35.7957 83.7551 35.6654 83.5319 35.5463 83.3005L35.7585 83.747C35.2596 82.6997 35.1181 81.5712 35.066 80.4062L35.0846 80.9055C34.9171 76.7163 35.3341 72.5028 36.0005 68.3786C36.6929 64.1002 37.6832 59.8704 38.9788 55.7624C39.057 55.5189 39.1351 55.2794 39.2133 55.0358C39.3287 54.6827 39.2059 55.0521 39.1873 55.1129C39.2319 54.9709 39.2803 54.8288 39.3287 54.6908C39.4851 54.2321 39.6452 53.7734 39.8127 53.3147C40.118 52.4785 40.453 51.6626 40.8179 50.8548C41.6667 48.9753 42.5714 47.1202 43.3085 45.184C44.0456 43.2477 44.8051 41.0516 44.7604 38.884C44.7195 36.8747 44.2318 35.0196 43.2341 33.3147C42.0688 31.3256 40.2036 30.0916 38.0816 29.7507C35.1554 29.2798 31.4474 30.8061 30.5166 34.09C30.3752 34.5934 30.7735 35.1414 31.1272 35.3809C31.6186 35.7178 32.3818 35.803 32.9402 35.7259C34.1911 35.5595 35.5537 34.9181 35.9521 33.5136L35.9632 33.5014Z" />
// <path d="M37.5193 40.1638C39.3716 36.2842 39.0325 32.0943 36.7619 30.8055C34.4913 29.5167 31.149 31.617 29.2967 35.4967C27.4444 39.3764 27.7836 43.5663 30.0542 44.8551C32.3248 46.1439 35.667 44.0435 37.5193 40.1638Z"   stroke-miterlimit="10"/>
// <path d="M81.751 52.8761C79.4466 51.9668 76.7363 53.3876 75.2509 55.3279C74.2904 56.5822 73.5309 58.0517 72.8198 59.4846C72.1087 60.9175 71.4237 62.5291 70.8653 64.1203C70.3069 65.7115 69.808 67.3921 69.6367 69.0969C69.5399 70.063 69.5251 71.0697 69.7373 72.0196C69.9718 73.0669 70.6196 73.6636 71.6024 73.7976C73.8734 74.098 75.8726 72.6163 77.6372 71.2646C78.6052 70.5217 79.5248 69.6571 80.247 68.6301C81.0735 67.4529 81.658 66.0769 82.1606 64.7089C83.4338 61.2301 84.3496 56.9313 82.5329 53.4769C82.0973 52.6529 80.8278 52.8802 80.1279 53.0994C79.6253 53.2577 79.078 53.4607 78.6759 53.8422C78.4935 54.0127 78.0542 54.4268 78.218 54.7393C79.5918 57.3454 79.3461 60.3573 78.5903 63.1379C78.218 64.51 77.7415 65.8698 77.1533 67.1526C77.0974 67.2743 77.0416 67.3961 76.982 67.5138C76.9522 67.5707 76.9262 67.6315 76.8964 67.6884C76.9076 67.664 76.982 67.5301 76.9113 67.664C76.7773 67.9076 76.6395 68.1471 76.4906 68.3785C76.23 68.7844 75.9396 69.1578 75.6269 69.5191C75.3626 69.8235 75.787 69.3689 75.5785 69.5719C75.5003 69.649 75.4221 69.7261 75.3439 69.8033C75.1504 69.9859 74.953 70.1605 74.7483 70.3269C74.5621 70.4812 74.3723 70.6313 74.1824 70.7775C74.0633 70.8668 73.9441 70.9561 73.825 71.0454C73.7729 71.0819 73.7133 71.1185 73.6649 71.1631C73.7543 71.0779 73.9292 70.9764 73.7319 71.1144C73.475 71.2971 73.2182 71.4797 72.9538 71.6502C72.9203 71.6705 72.7863 71.7314 72.7714 71.7639C72.7751 71.7558 73.1549 71.5893 72.9389 71.6746C72.5815 71.8207 73.7319 71.4716 73.6165 71.4879C73.6686 71.4797 74.402 71.4391 74.3983 71.5406C74.3983 71.5772 74.134 71.0982 74.1042 70.9886C73.9925 70.5867 73.933 70.1605 73.9032 69.7424C73.7952 68.212 74.1712 66.6614 74.5845 65.2122C74.9754 63.8524 75.4593 62.525 76.0029 61.2301C76.6134 59.7728 77.2612 58.413 78.0319 57.0896C78.3855 56.4848 78.7541 55.88 79.1711 55.3239C79.2344 55.2386 79.2977 55.1574 79.3609 55.0803C79.3796 55.06 79.5732 54.8286 79.4764 54.9382C79.3721 55.0559 79.5471 54.8692 79.5508 54.8652C79.6253 54.7962 79.7035 54.7271 79.7816 54.6622C79.8375 54.6135 80.005 54.5526 79.8226 54.6257C79.7035 54.6744 79.3312 54.8489 79.6327 54.7434C79.2753 54.8692 78.9365 54.9707 78.5642 54.9788C78.4488 54.9788 77.9686 54.8773 78.2627 54.9951C79.1971 55.3644 80.4741 55.0356 81.3043 54.4958C81.7771 54.1873 82.7116 53.2739 81.7399 52.8924L81.751 52.8761Z" />
// <path d="M107.763 62.1437C108.984 59.2007 110.302 56.3065 111.78 53.5056C113.258 50.7047 114.807 48.1027 116.854 45.8863L112.718 46.5845C112.782 48.5857 113.109 50.5991 113.4 52.5719C113.69 54.5447 113.991 56.5541 114.379 58.5228C114.509 59.1845 115.808 59.0424 116.188 58.9693C117.041 58.811 117.886 58.4863 118.519 57.8246C119.308 56.9965 119.889 55.9371 120.421 54.906C121.069 53.6517 121.612 52.3406 122.122 51.0132C123.049 48.602 123.831 46.1299 124.609 43.6578L120.309 44.6442C121.75 47.9484 122.074 51.7235 123.515 55.0278C123.872 55.8478 125.29 55.5352 125.905 55.3444C126.407 55.1861 126.955 54.9872 127.364 54.6219C127.554 54.4514 127.971 54.0901 127.833 53.7694C126.392 50.4652 126.069 46.6901 124.628 43.3858C124.304 42.643 123.09 42.8743 122.528 43.0042C122.07 43.1098 121.59 43.26 121.18 43.5198C120.86 43.7187 120.454 43.9703 120.328 44.3763C119.568 46.8037 118.798 49.2312 117.893 51.6018C117.398 52.8926 116.869 54.1753 116.255 55.4012C116.181 55.5474 116.106 55.6976 116.028 55.8396C116.006 55.8802 115.771 56.3024 115.905 56.071C115.775 56.2983 115.641 56.5216 115.499 56.7408C115.22 57.1751 114.915 57.5892 114.565 57.9586L118.701 57.2604C118.314 55.2916 118.012 53.2985 117.722 51.3095C117.431 49.3205 117.104 47.3233 117.041 45.3221C117.022 44.6645 115.518 44.8228 115.231 44.8756C114.386 45.0298 113.519 45.3505 112.901 46.0203C110.745 48.3544 109.092 51.2243 107.577 54.0779C106.062 56.9316 104.725 59.8664 103.485 62.8581C103.351 63.1829 103.657 63.4264 103.88 63.5238C104.278 63.6943 104.87 63.6578 105.276 63.5807C106.099 63.4305 107.383 63.0773 107.767 62.1437H107.763Z" />
// <path d="M158.956 13.85C156.924 19.878 155.148 26.0197 153.636 32.2263C152.881 35.3276 152.196 38.4532 151.656 41.6073C151.22 44.1524 150.103 48.6298 153.365 49.466C155.673 50.0587 158.208 48.6623 160.111 47.343C161.775 46.1902 163.238 44.7694 164.481 43.1011C165.125 42.2365 163.934 41.7494 163.32 41.7494C162.296 41.7494 161.134 42.1309 160.468 43.024C160.356 43.1742 160.241 43.3243 160.125 43.4745C160.077 43.5395 160.025 43.6004 159.973 43.6613C160.018 43.6044 160.163 43.4461 159.943 43.6978C159.697 43.982 159.44 44.2539 159.176 44.5178C158.912 44.7816 158.64 45.0333 158.361 45.2769C158.242 45.3824 158.119 45.4798 157.996 45.5813C157.717 45.8127 157.959 45.6097 158.015 45.5691C157.929 45.63 157.847 45.695 157.761 45.7599C157.464 45.9791 157.162 46.1821 156.849 46.3769C156.715 46.4581 156.581 46.5393 156.447 46.6205C156.105 46.8275 156.473 46.588 156.525 46.5839C156.447 46.5921 156.324 46.6895 156.25 46.7301C156.086 46.8153 155.919 46.8965 155.751 46.9696C155.695 46.9939 155.569 47.0223 155.528 47.067C155.725 46.864 155.885 46.9574 155.632 47.0142C155.632 47.0142 156.082 46.933 155.826 46.9696C155.587 47.002 155.971 46.9615 155.982 46.9615C155.974 46.9615 156.231 46.9696 156.257 47.0305C156.239 46.9939 156.056 46.929 156.012 46.9046C156.231 47.0223 155.978 46.864 155.904 46.7788C155.863 46.7301 155.669 46.4378 155.773 46.6286C155.639 46.381 155.565 46.0846 155.517 45.8046C155.397 45.1429 155.423 44.7735 155.494 44.1281C155.643 42.7885 155.878 41.453 156.12 40.1297C157.199 34.1261 158.729 28.2158 160.416 22.3867C161.306 19.3179 162.248 16.2693 163.268 13.2493C163.39 12.888 163.089 12.5632 162.832 12.4252C162.434 12.2101 161.834 12.202 161.414 12.271C160.528 12.413 159.303 12.8311 158.956 13.85Z" />
// <path d="M191.886 20.8445C190.37 21.6889 188.889 22.6103 187.474 23.6454C186.718 24.1975 185.962 24.7617 185.274 25.4072C184.693 25.9552 184.056 26.7792 184.019 27.656C183.915 29.9617 186.77 30.0915 188.263 30.2174C188.673 30.2499 189.078 30.2783 189.488 30.3189C189.663 30.3351 189.834 30.3554 190.009 30.3798C190.058 30.3879 190.422 30.4406 190.195 30.4041C189.998 30.3716 190.344 30.4366 190.381 30.4447C190.568 30.4853 190.75 30.534 190.932 30.5908C191.018 30.6193 191.1 30.6477 191.186 30.6801C191.215 30.6923 191.431 30.7735 191.234 30.6923C191.037 30.6111 191.245 30.7004 191.279 30.7167C191.361 30.7613 191.439 30.8019 191.521 30.8466C191.681 30.9359 191.833 31.0374 191.982 31.1429C192.057 31.1957 192.302 31.3986 192.109 31.2241C192.228 31.3296 192.336 31.4473 192.44 31.5691C192.544 31.6909 192.641 31.8127 192.731 31.9466C192.768 32.0035 192.801 32.0603 192.839 32.1171C192.958 32.3079 192.742 31.8208 192.883 32.1983C193.155 32.9087 193.155 33.3471 192.947 34.0777C192.947 34.0737 192.857 34.3254 192.906 34.1995C192.961 34.0493 192.827 34.37 192.816 34.3944C192.746 34.5486 192.671 34.6988 192.593 34.849C192.396 35.2143 192.172 35.5634 191.941 35.9044C191.897 35.9694 191.848 36.0384 191.804 36.1033C191.644 36.3347 191.964 35.9004 191.789 36.1196C191.673 36.2657 191.562 36.4199 191.446 36.5661C191.215 36.8583 190.973 37.1425 190.724 37.4185C190.475 37.6946 190.218 37.9625 189.957 38.2223C189.845 38.3359 189.73 38.4455 189.615 38.5511C189.518 38.6404 189.101 39.0503 189.414 38.7418C188.889 39.2574 188.271 39.6958 187.682 40.122C187.064 40.5726 186.428 40.9947 185.78 41.3925C185.72 41.4291 185.631 41.4656 185.579 41.5143C185.586 41.5062 185.936 41.3073 185.724 41.425C185.564 41.5143 185.408 41.6117 185.248 41.701C184.898 41.9 184.544 42.0948 184.19 42.2815C180.829 44.0676 177.295 45.4356 173.963 47.2866C173.543 47.518 173.066 47.8224 172.828 48.2933C172.657 48.6302 172.608 49.1051 172.869 49.4137C173.543 50.2011 174.965 50.0347 175.758 49.5963C178.725 47.9523 181.849 46.6858 184.868 45.1677C187.887 43.6495 190.579 41.9852 193.025 39.7039C194.183 38.6282 195.203 37.4023 196.092 36.0627C196.982 34.7232 197.771 33.0183 197.321 31.3215C196.938 29.8723 195.765 28.7642 194.533 28.1756C192.876 27.3881 191.1 27.3353 189.328 27.1567C189.097 27.1323 188.863 27.0958 188.632 27.0715C188.416 27.0471 188.654 27.0755 188.688 27.0836C188.583 27.0593 188.472 27.0146 188.367 27.0065C188.192 26.9903 188.442 27.0187 188.464 27.0674L188.349 27.0024L188.446 27.108C188.505 26.836 188.263 27.0796 188.397 27.108C188.352 27.0999 188.36 26.8604 188.352 27.0958C188.352 27.0106 188.375 26.9091 188.401 26.8279C188.349 26.9984 188.364 26.9213 188.438 26.8279C188.501 26.7467 188.635 26.6331 188.431 26.832C188.501 26.7629 188.568 26.6818 188.635 26.6046C188.792 26.4301 188.654 26.4666 188.58 26.6493C188.609 26.5762 188.792 26.4788 188.851 26.4301C189.034 26.284 189.216 26.1419 189.399 25.9998C190.132 25.4315 190.888 24.8916 191.658 24.3842C192.02 24.1447 192.384 23.9133 192.753 23.686C192.839 23.6333 193.051 23.4059 192.883 23.6089C192.738 23.7875 192.928 23.5845 193.014 23.5358C193.237 23.4059 193.46 23.2801 193.687 23.1543C194.108 22.9188 194.585 22.6184 194.823 22.1476C194.994 21.8106 195.043 21.3357 194.782 21.0272C194.112 20.2397 192.686 20.4021 191.893 20.8445H191.886Z" />
// <path d="M92.5811 52.6119C92.6034 52.4698 92.6257 52.3196 92.6741 52.1816C92.5289 52.5835 92.8863 51.8163 92.7225 52.1085C92.5773 52.3683 93.0502 51.796 92.7709 52.0395C92.6481 52.1451 92.6555 52.141 92.797 52.0355C92.5103 52.1978 92.4694 52.2263 92.6779 52.1288L89.7926 51.9624C89.7033 51.8163 89.8298 52.0842 89.8522 52.1613C89.8522 52.1613 89.882 52.3967 89.8745 52.2628C89.8634 52.1085 89.8596 52.417 89.8559 52.4495C89.8373 52.6078 89.8038 52.7621 89.7666 52.9123C89.7479 52.9894 89.7256 53.0665 89.6995 53.1436C89.6735 53.2208 89.6176 53.371 89.6772 53.2127C89.4017 53.9433 89.0927 54.6578 88.8247 55.3925C88.2364 56.9959 87.7115 58.6196 87.2759 60.2798C86.8664 61.8345 86.5351 63.4136 86.2745 65.0089C86.1442 65.8045 86.0362 66.6042 85.9431 67.4079C85.8501 68.2116 85.6416 69.2102 86.2224 69.8678C87.1121 70.8705 88.7353 70.5823 89.7852 70.1073C90.6563 69.7095 91.3302 69.0641 91.8923 68.2522C92.7076 67.071 93.4671 65.8491 94.2266 64.6273C95.7195 62.2283 97.1788 59.7968 98.7797 57.483C99.0105 57.1501 99.2413 56.8213 99.4759 56.4966C99.595 56.3302 99.461 56.521 99.4424 56.5412C99.5057 56.456 99.5689 56.3708 99.6322 56.2815C99.7439 56.1313 99.8556 55.9811 99.971 55.8349C100.44 55.222 100.924 54.6212 101.423 54.0407C101.922 53.4603 102.477 52.8554 103.035 52.2993C103.296 52.0395 103.56 51.7838 103.832 51.5362C103.91 51.4631 103.988 51.3941 104.066 51.3251C104.23 51.1749 104.144 51.2317 104.036 51.3495C104.178 51.1993 104.36 51.0734 104.517 50.9435L101.147 51.0653C101.08 50.9313 101.241 51.3982 101.255 51.4631C101.278 51.5646 101.33 51.9056 101.33 51.9015C101.33 51.8975 101.308 52.2384 101.293 52.344C101.278 52.4495 101.255 52.551 101.229 52.6525C101.177 52.8351 101.17 52.8554 101.214 52.7134C100.314 54.9541 104.628 54.5887 105.276 52.9853C105.812 51.6498 105.768 50.4158 105.135 49.1372C104.896 48.6541 104.089 48.6176 103.672 48.6297C103.031 48.646 102.29 48.8246 101.769 49.2589C97.5586 52.7499 94.4835 57.4018 91.5461 62.143C90.8276 63.2999 90.1165 64.4609 89.3868 65.6137C89.0369 66.1617 88.6869 66.7097 88.3295 67.2536C88.1508 67.5256 87.9758 67.7976 87.7897 68.0614C88.095 67.6271 87.7711 68.0939 87.719 68.0899C87.9386 67.9031 87.9647 67.8747 87.7934 68.0006C88.2439 67.6758 88.7576 67.5378 89.331 67.5784L90.1724 67.9153C90.2208 68.0614 90.2245 68.0452 90.1761 67.8625C90.1463 68.1061 90.2208 67.5256 90.2133 67.5784C90.2505 67.209 90.2915 66.8356 90.3362 66.4662C90.4255 65.7274 90.5335 64.9886 90.6601 64.2539C90.9169 62.7235 91.2445 61.2053 91.6392 59.7115C92.071 58.0838 92.5848 56.456 93.1469 54.9906C93.7463 53.4278 94.785 51.6701 93.7798 50.0464C93.5639 49.6973 92.931 49.5471 92.5885 49.5309C92.0003 49.5065 91.4381 49.6405 90.8909 49.88C89.6251 50.4402 88.4822 51.6052 88.2439 53.1233C88.0726 54.2072 89.4613 54.4385 90.1575 54.3411C90.9988 54.2234 92.4061 53.7201 92.5811 52.6241V52.6119Z" />
// <path d="M199 36.7565C198.725 35.6036 200.106 33.2127 201.532 32.0599C203.099 30.7934 205.199 31.4226 205.843 32.7946C206.487 34.1707 205.567 35.9974 203.866 37.0366C202.157 38.0798 199.365 38.2787 199 36.7565Z"   stroke-miterlimit="10"/>
// <path d="M169.999 35.9369C171.882 35.4011 173.696 34.5933 175.378 33.5257C177.061 32.4581 178.889 31.2323 179.715 29.3244C180.088 28.4638 180.259 27.3841 179.961 26.4626C179.6 25.3544 178.736 24.6157 177.72 24.2869C175.468 23.5602 173.066 24.3437 171.149 25.6954C168.111 27.8387 166.328 31.626 165.479 35.3565C165.107 36.9923 164.783 38.8393 165.185 40.5077C165.736 42.7971 167.739 43.7348 169.768 43.6292C171.968 43.5156 174.09 42.2572 175.911 40.9948C177.605 39.8217 179.146 38.34 180.445 36.6717C180.709 36.3347 180.925 35.872 180.814 35.4133C180.702 34.9546 180.296 34.642 179.917 34.5203C178.919 34.2036 177.56 34.5203 176.864 35.4133C176.417 35.9897 175.94 36.5377 175.438 37.0573C175.363 37.1344 175.285 37.2075 175.211 37.2846C175.047 37.4551 175.293 37.2115 175.304 37.1994C175.207 37.3211 175.066 37.4226 174.954 37.5241C174.678 37.7758 174.395 38.0153 174.105 38.2467C173.815 38.478 173.521 38.7013 173.219 38.9124C173.089 39.0017 172.958 39.091 172.828 39.1803C172.783 39.2128 172.553 39.3467 172.802 39.2006C173.092 39.0301 172.698 39.2615 172.642 39.298C172.352 39.4726 172.054 39.6431 171.756 39.8014C171.618 39.8744 171.477 39.9475 171.339 40.0165C171.272 40.049 171.205 40.0815 171.138 40.1139C171.093 40.1342 170.65 40.3128 171.015 40.1789C171.361 40.049 170.896 40.2195 170.81 40.2438C170.658 40.2925 170.46 40.3088 170.315 40.3778C170.319 40.3778 170.788 40.3169 170.546 40.3291C170.475 40.3291 170.405 40.3453 170.334 40.3534C169.973 40.4021 170.408 40.3412 170.468 40.3656C170.397 40.3372 170.27 40.3494 170.192 40.3412C169.842 40.3088 170.568 40.4265 170.096 40.2925C169.913 40.2398 170.177 40.3291 170.2 40.3453C170.148 40.3007 170.081 40.2682 170.025 40.2235C169.969 40.1789 169.921 40.1383 169.865 40.0936C170.118 40.2885 169.958 40.1951 169.902 40.1099C169.827 39.9921 169.738 39.8338 169.649 39.7324C169.545 39.6146 169.664 39.777 169.682 39.8176C169.649 39.7324 169.615 39.6512 169.589 39.5659C169.548 39.436 169.511 39.3061 169.481 39.1722C169.444 39.0139 169.418 38.8515 169.399 38.6891C169.384 38.5795 169.384 38.1736 169.377 38.474C169.392 37.7717 169.444 37.0979 169.556 36.4038C169.675 35.669 169.824 34.9384 170.014 34.2199C170.055 34.0616 170.099 33.8992 170.144 33.7409C170.222 33.4689 170.073 33.9601 170.159 33.6962C170.185 33.6191 170.207 33.5379 170.233 33.4608C170.352 33.0955 170.483 32.7382 170.624 32.3851C170.896 31.7072 171.209 31.0455 171.57 30.4204C171.663 30.258 171.76 30.0997 171.856 29.9414C171.689 30.2174 171.871 29.9211 171.946 29.8156C172.158 29.5111 172.381 29.2148 172.62 28.9347C172.739 28.7926 172.862 28.6546 172.984 28.5207C173.037 28.4638 173.092 28.407 173.148 28.3502C173.275 28.2122 173.238 28.131 173.107 28.3826C173.245 28.1107 173.733 27.8549 173.964 27.6845C174.299 27.4368 173.651 27.8468 174.012 27.652C174.172 27.5667 174.328 27.4774 174.492 27.4044C174.559 27.3719 174.637 27.3516 174.701 27.311C174.69 27.3151 174.258 27.4531 174.496 27.4003C174.567 27.3841 174.641 27.3557 174.712 27.3354C175.177 27.1811 174.362 27.3638 174.634 27.3394C174.783 27.3272 174.928 27.311 175.077 27.2988C175.363 27.2704 174.69 27.2501 174.969 27.3069C175.04 27.3232 175.121 27.3232 175.192 27.3313C175.553 27.3678 174.902 27.2379 175.252 27.3557C175.553 27.4571 175.296 27.3638 175.233 27.3232C175.315 27.3719 175.393 27.4247 175.471 27.4815C175.698 27.6439 175.412 27.3678 175.564 27.5992C175.725 27.8428 175.617 27.6642 175.587 27.5911C175.613 27.656 175.635 27.725 175.654 27.7941C175.676 27.8752 175.751 28.3299 175.728 28.0133C175.739 28.1837 175.721 28.3624 175.695 28.5288C175.684 28.6018 175.661 28.6749 175.654 28.748C175.684 28.4598 175.672 28.6952 175.628 28.8129C175.557 28.9834 175.471 29.1458 175.378 29.3082C175.568 28.9753 175.248 29.4502 175.174 29.5395C175.121 29.6004 175.062 29.6532 175.013 29.7141C174.861 29.9049 175.285 29.4827 174.999 29.7344C174.384 30.2783 173.733 30.7614 173.059 31.212C173.018 31.2404 172.791 31.4027 173.022 31.2363C173.286 31.0455 172.899 31.3053 172.843 31.3419C172.679 31.4393 172.512 31.5326 172.348 31.626C171.968 31.8371 171.577 32.0319 171.186 32.2105C171.015 32.2877 170.84 32.3648 170.665 32.4379C170.609 32.4622 170.349 32.5678 170.646 32.45C170.985 32.3161 170.546 32.4866 170.472 32.5109C170.066 32.6571 169.656 32.787 169.243 32.9047C168.74 33.0467 168.178 33.3634 167.828 33.7977C167.583 34.1022 167.326 34.6299 167.46 35.0561C167.802 36.144 169.146 36.1886 169.991 35.9451L169.999 35.9369Z" />
// <path d="M140.301 37.4303C138.097 37.0528 136.355 38.5345 134.992 40.2231C133.972 41.4896 133.079 42.8576 132.263 44.2864C131.519 45.5935 130.864 46.9534 130.32 48.3701C130.037 49.1048 129.784 49.8517 129.561 50.6108C129.319 51.4267 129.039 52.2791 128.946 53.1316C128.835 54.1626 129.147 55.1856 129.903 55.8391C130.659 56.4927 131.545 56.6226 132.438 56.6307C134.043 56.6428 135.54 55.8148 136.865 54.9095C139.441 53.1559 141.481 50.7366 143.041 47.9073C144.854 44.6274 145.804 40.8117 146.247 37.0366L141.865 37.3492L142.036 41.8468C142.092 43.3163 142.099 44.8223 142.412 46.2592C143.06 49.2306 145.305 51.4186 148.179 51.2684C149.106 51.2197 150.506 50.4809 150.543 49.3078C150.58 48.1346 149.474 47.611 148.521 47.6597C148.082 47.6841 148.856 47.7287 148.614 47.6719C148.588 47.6678 148.294 47.6435 148.291 47.615C148.291 47.6232 148.76 47.7774 148.354 47.6029C148.313 47.5866 148.272 47.5663 148.231 47.546C148.108 47.4851 148.149 47.5136 148.358 47.6313C148.331 47.5298 147.948 47.339 147.859 47.2619C147.769 47.1848 147.684 47.1036 147.602 47.0183C147.773 47.1929 147.71 47.136 147.591 46.9818C147.457 46.8113 147.337 46.6286 147.226 46.4419C147.151 46.3161 147.088 46.1862 147.025 46.0563C147.11 46.2349 147.069 46.1659 147.021 46.0238C146.827 45.4596 146.686 44.8872 146.597 44.2905C146.556 44.0226 146.53 43.7506 146.504 43.4827C146.492 43.3569 146.492 43.3609 146.504 43.503L146.492 43.3203C146.485 43.1701 146.477 43.0159 146.47 42.8657C146.44 42.2568 146.422 41.6439 146.399 41.0309L146.247 37.0325C146.15 34.4711 142.122 35.1287 141.865 37.3451C141.697 38.7861 141.459 40.2231 141.109 41.6236C141.198 41.2623 141.049 41.8347 141.046 41.8549C140.997 42.0295 140.949 42.204 140.901 42.3745C140.815 42.6627 140.729 42.9509 140.636 43.2351C140.394 43.9739 140.119 44.7005 139.813 45.4109C139.557 45.9995 139.277 46.5759 138.976 47.1401C138.939 47.2051 138.674 47.6678 138.916 47.2497C138.834 47.3877 138.756 47.5217 138.671 47.6556C138.503 47.9235 138.332 48.1915 138.153 48.4513C137.796 48.9708 137.416 49.4742 137.014 49.9491C136.984 49.9857 136.545 50.554 136.496 50.5337L136.656 50.3672C136.586 50.4403 136.511 50.5174 136.441 50.5905C136.295 50.7366 136.146 50.8787 135.997 51.0208C135.584 51.4064 135.152 51.7636 134.702 52.0965C134.587 52.1817 134.456 52.3035 134.33 52.3603C134.843 52.1249 134.423 52.2954 134.296 52.3725C133.998 52.5592 133.693 52.7419 133.377 52.9002C133.302 52.9367 132.937 53.0829 133.328 52.9367C133.719 52.7906 133.332 52.9286 133.261 52.953C133.149 52.9895 133.008 53.0017 132.904 53.0504L133.25 52.9855C133.172 52.9976 133.09 53.0057 133.012 53.0098C132.591 53.0707 133.514 53.091 133.109 53.0179C132.703 52.9449 133.559 53.2046 133.187 53.0463C132.844 52.9002 133.481 53.2615 133.287 53.1032C133.183 53.0179 133.224 53.0666 133.41 53.2534C133.362 53.1925 133.321 53.1316 133.28 53.0626C133.488 53.367 133.306 53.091 133.287 52.9164C133.332 53.3061 133.328 52.7906 133.336 52.7297C133.358 52.5633 133.395 52.3969 133.429 52.2345C133.537 51.6987 133.328 52.5836 133.477 52.0478C133.656 51.3942 133.846 50.7447 134.065 50.1034C134.501 48.8247 135.022 47.5785 135.621 46.381C135.77 46.0806 135.927 45.7843 136.087 45.492C136.165 45.3459 136.247 45.1998 136.329 45.0536C136.098 45.4596 136.455 44.8466 136.496 44.7776C136.869 44.1606 137.267 43.5598 137.684 42.9753C138.101 42.3908 138.537 41.8225 138.998 41.2826C139.08 41.1852 139.318 40.7833 139.054 41.2055C139.102 41.1283 139.445 40.7792 139.527 40.7874L139.307 40.9376C139.531 40.8198 139.478 40.832 139.143 40.97C139.382 40.901 139.322 40.9051 138.968 40.9822C138.648 40.9538 138.604 40.9538 138.838 40.9903C139.825 41.1608 141.262 40.6209 141.641 39.5209C142.021 38.4208 141.28 37.5927 140.297 37.4263L140.301 37.4303Z" />
// </g>
// <defs>
// <clipPath id="clip0_40_384">
// <rect width="227" height="100" rx="15" fill="white"/>
// </clipPath>
// </defs>
// </svg>

//           </span>
//         </Link>
//         <span className="google">    <div className="google_button">        <a className="google-button" href="http://127.0.0.1:8000/users/api/accounts/google/login/">            <img className="google_icon" src={Google} alt="Google" />            Sign in via Google
//         </a>    </div></span><span className="facebook">    <div className="face_button">        <a className="face-button" href="http://127.0.0.1:8000/users/api/accounts/facebook/login/">            <img className="face_icon" src={Face} alt="Facebook" />            Sign in via Facebook
//         </a>    </div></span>
//         <hr className="login_hr" />
//         <form className="log-form">
//           <input
//             type="email"
//             placeholder="email"
//             className="em-log"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//           />
//           <input
//             type="password"
//             placeholder="password"
//             className="pas-log"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />
//           <span>
//             <a className="forgot-log">Forgot Password?</a>
//           </span>
//           <Link to="/register" className="create-log">
//             <div className='letter'>Create Account</div>
//           </Link>
//           <button type="button" className="button-log" onClick={handleLogin}>
//   Sign in
// </button>
//         </form>
//       </div>
//     </div>
//   );
// }




// function Register () {
//   const [currentStep, setCurrentStep] = useState(1);

//   const [formData, setFormData] = useState({
//     first_name: '',
//     last_name: '',
//     dob_month: '',
//     dob_year: '',
//     email: '',
//     password: '',
//     password2: '',
// });

// const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
// };

// const handleSubmit = async (e) => {
//     e.preventDefault();
//     const response = await fetch(`${apiUrl}/users/auth/users/`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(formData),
//     });

//     if (response.status === 201) {
//         // Регистрация успешна
//     } else {
//         // Обработка ошибки
//     }
// };
// const nextStep = () => {
//   setCurrentStep(currentStep + 1);
// };

// const prevStep = () => {
//   setCurrentStep(currentStep - 1);
// };
//   return (  
//     <div>
//       {currentStep === 1 && (
//         <RegisterStep1 formData={formData} setFormData={setFormData} nextStep={nextStep} />
//       )}
//       {currentStep === 2 && (
//         <RegisterStep2 formData={formData} setFormData={setFormData} prevStep={prevStep} nextStep={nextStep} />
//       )}
//       {currentStep === 3 && (
//         <RegisterStep3 formData={formData} prevStep={prevStep} />
//       )}
//     </div>    
//   )
// }



function RegisterStep1 () {

    const navigate = useNavigate();
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      dob_month: '',
      dob_year: '',
    });
  
    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/users/api/register_step1/`, formData);

      if (response.status === 200) {
        navigate('/step2')
      } else {

      }
    } catch (error) {

    }
  };



  return (
    <div className='formContainer'>
    <div className='formWrapper'>
    <Link to='/'><span className='logo-register'><img src={Logo}></img></span></Link>
        <span className='register-title'>Create a Wormates Account</span>
        <span className='info'>Basic information</span> 
        <form className='register-form'>
            <input name="first_name" type="text" placeholder='First name' className='register-name' value={formData.first_name} onChange={handleChange}/>
            <input name="last_name"  type="text" placeholder='Last name (optional)' className='register-last' value={formData.last_name} onChange={handleChange}/>
            <p className='register-date'>Date of birth (optional)</p>
            <select name="dob_month"  className='month' value={formData.dob_month} onChange={handleChange}>
              <option value="" disabled selected hidden>Month</option>
              <option type='number' value="1">1</option>
              <option type='number' value="2">2</option>
              <option type='number' value="3">3</option>
              <option type='number' value="4">4</option>
              <option type='number' value="5">5</option>
              <option type='number' value="6">6</option>
              <option type='number' value="7">7</option>
              <option type='number' value="8">8</option>
              <option type='number' value="9">9</option>
              <option type='number' value="10">10</option>
              <option type='number' value="11">11</option>
              <option type='number' value="12">12</option>
            </select>
            <input name="dob_year"  type='number' placeholder='Year' className='year' value={formData.dob_year} onChange={handleChange}/>
            <Link to='/step2'><div><button type='submit' className='next-button' onClick={handleSubmit}>Next</button></div></Link>
        </form>
    </div>
</div>

  )
}


function RegisterStep2 () {

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/users/api/register_step2/`, formData); 

      if (response.status === 201) {

      } else {

      }
    } catch (error) {

    }
  };


  return (
    <div className='formContainer'>
          <div className='formWrapper'>
          <Link to='/'><span className='logo-register'><img src={Logo}></img></span></Link>
              <span className='register-title'>Enter your email and password</span>
              <form className='register-form'>
                <div>
                  <input type="email" placeholder='Email' name="email" className='register-mail' value={formData.email} onChange={handleChange}/>
                </div> 
                <div>
                  <input type="password" placeholder='password' name="password" className='register-password' value={formData.password} onChange={handleChange}/>
                  <input type="password" placeholder='Repeat password' name="password2" className='register-password' value={formData.password2} onChange={handleChange}/>
                </div> 
                <Link to='/step1'><button className='back-button'>Back</button></Link>
                <Link to='/login'> <button type='button' className='next-button'onClick={handleSubmit}>Next</button></Link> 
              </form>
          </div>
      </div>
  )
}



function RegisterStep3 () {
  return (
    <div className='formContainer'>
          <div className='formWrapper'>
          <span className='logo-register'><img src={Logo}></img></span>
              <span className='finish-title'>We have sent a four<br/> digit code to your<br/>  email</span>
              <form >
                <span className='finish-text'>Enter code</span>
                  <input type="number" placeholder='' className='register-code' />
                <Link to='/2'><button className='back-button'>Back</button></Link>
                  <Link to='/login'><button className='next-button'>Finish</button></Link>
              </form>
          </div>
      </div>
  )
}





 
function TwoStepRegistration() {
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [dob_month, setDateOfBirthMonth] = useState('');
  const [dob_year, setDateOfBirthYear] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [verification_code, setCode] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(59);

  useEffect(() => {
    let timer;
    if (currentStep === 3) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => (prevTime > 0 ? prevTime - 1 : 0));
      }, 1000);
    } else {
      setTimeLeft(60);
    }

    return () => clearInterval(timer);
  }, [currentStep]);

  const formatTime = (time) => {
    const seconds = time % 60;
    return `${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleClick = () => {
    // Логика для повторной отправки кода
  };

  const codeSubmit = () => {
    // Логика для отправки кода
  };

  const navigate = useNavigate();

  const handleFirstStepSubmit = (e) => {
    e.preventDefault();
    setCurrentStep(2);
  };

  const handleSecondStepSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${apiUrl}/users/api/register/`, {
        email: email,
        password: password,
        password2: password2,
        first_name: first_name,
        last_name: last_name,
        dob_month: dob_month,
        dob_year: dob_year,
      });
      setCurrentStep(3);
    } catch (error) {
      console.error('Ошибка регистрации:', error);
    }
  };
  const CodeSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${apiUrl}/users/api/register_verification/`, {
        verification_code: verification_code
      });
      setCurrentStep(3);
  
      navigate('/login')
  
    } catch (error) {
      console.error('Ошибка регистрации:', error);
    }
  };

  return (
    <div>
      {currentStep === 1 && (
        <div className='formContainer'>
          <div className='formWrapper'>
            <Link to='/'><span className='logo-register'>          <svg width="227" height="100" viewBox="0 0 227 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_40_384)">
<path d="M150.874 30.0955C151.068 30.1807 150.774 30.0143 150.759 30.0021C150.703 29.9615 150.647 29.9128 150.595 29.8641C150.483 29.7585 150.398 29.6571 150.327 29.5353C150.118 29.1781 150.01 28.7437 149.973 28.3256C149.94 27.9481 149.966 27.5909 150.063 27.2296C150.159 26.8684 150.338 26.4746 150.498 26.2595C150.647 26.0606 150.818 25.886 150.993 25.7196C150.774 25.9307 151.124 25.6181 151.142 25.6059C151.22 25.5491 151.302 25.4963 151.38 25.4395C151.775 25.1635 151.042 25.5978 151.474 25.3867C151.559 25.3421 151.649 25.2974 151.734 25.2487C152.185 25.0092 151.299 25.4192 151.771 25.2284C151.909 25.1716 152.043 25.1147 152.177 25.062C152.665 24.8712 153.156 24.7007 153.651 24.5302C153.752 24.4937 154.068 24.38 153.599 24.5465C153.771 24.4856 153.946 24.4287 154.117 24.3719C154.433 24.2664 154.75 24.1568 155.066 24.0512C157.423 23.2637 159.798 22.529 162.181 21.847C163.372 21.5061 164.567 21.1732 165.766 20.8566C166.35 20.7023 166.935 20.5521 167.523 20.4019C167.817 20.3289 168.107 20.2558 168.402 20.1827C168.521 20.1543 168.636 20.1259 168.755 20.0975C168.815 20.0813 169.489 19.9189 169.168 19.996C168.815 20.0813 169.396 19.9432 169.407 19.9392C169.582 19.8986 169.76 19.8539 169.935 19.8133C170.289 19.7322 170.643 19.6469 170.993 19.5698C171.67 19.4155 172.348 19.2653 173.025 19.1192C174.41 18.8188 175.803 18.5387 177.195 18.2708C177.75 18.1653 178.331 17.9786 178.837 17.7066C179.086 17.5726 179.604 17.2885 179.715 16.9556C179.995 16.1316 178.215 16.3995 177.977 16.4442C172.538 17.4833 167.139 18.7701 161.801 20.3005C159.213 21.0433 156.637 21.847 154.083 22.7076C152.806 23.1379 151.503 23.5357 150.26 24.0756C149.016 24.6155 147.624 25.3177 146.678 26.4543C145.964 27.3149 145.573 28.354 145.658 29.5272C145.744 30.7003 146.373 31.5243 147.341 31.9587C147.699 32.121 148.369 32.0033 148.719 31.9384C149.262 31.8369 149.869 31.6542 150.36 31.3741C150.852 31.094 151.749 30.4811 150.874 30.0914V30.0955Z" />
<path d="M35.9632 33.5014C35.9074 33.7003 35.8329 33.8262 35.9558 33.5623C35.9856 33.5014 36.1121 33.3269 36.1121 33.2741C36.1121 33.3675 35.7883 33.6557 36.0116 33.4446C36.0861 33.3756 36.3728 33.0833 36.0489 33.3878C35.6505 33.7612 36.1196 33.3553 36.1159 33.3634C36.0973 33.4202 35.5165 33.676 35.8515 33.5298C35.967 33.4771 36.3541 33.3147 35.859 33.5055C35.3638 33.6963 35.7064 33.5664 35.818 33.5339C36.3392 33.3837 35.5277 33.5745 35.5277 33.5826C35.5351 33.5542 35.8143 33.5542 35.8404 33.5501C36.1308 33.5095 35.2187 33.5217 35.5016 33.5501C35.5947 33.5582 35.6915 33.5582 35.7883 33.5664C35.8851 33.5745 35.9744 33.5948 36.0675 33.6029C36.3281 33.6191 35.5388 33.4568 35.7845 33.5501C35.9558 33.6151 36.1419 33.6557 36.3169 33.7206C36.3914 33.749 36.652 33.8667 36.3169 33.7125C35.967 33.5542 36.2834 33.7044 36.3616 33.745C36.5105 33.8262 36.652 33.9195 36.7934 34.0169C36.9349 34.1144 37.0652 34.228 37.203 34.3376C37.5082 34.5852 36.9796 34.09 37.1285 34.2686C37.1918 34.3457 37.27 34.4107 37.3333 34.4838C37.8619 35.0561 38.2863 35.73 38.6325 36.4484L38.4203 36.0019C38.9751 37.1913 39.2915 38.4821 39.3511 39.8176L39.3325 39.3183C39.3548 40.0531 39.2915 40.7756 39.1538 41.4982C39.0756 41.9163 38.9788 42.3303 38.8708 42.7403C38.815 42.9514 38.7554 43.1584 38.6921 43.3654C38.6623 43.471 38.6288 43.5724 38.5953 43.678C38.4799 44.0555 38.6661 43.4831 38.5842 43.7226C37.9922 45.4072 37.2811 47.0309 36.5366 48.6425C35.9148 49.9901 35.2857 51.3338 34.7682 52.7342C34.1651 54.3782 33.6178 56.0506 33.1189 57.7393C31.1346 64.4574 29.7795 71.5651 29.6306 78.6364C29.5673 81.6159 29.3328 86.0892 32.3781 87.5018C34.7942 88.6222 37.5827 87.2014 39.124 85.1028C39.6601 84.3721 40.1217 83.5968 40.5424 82.7809C41.5736 80.7675 42.4374 78.6526 43.2973 76.5499C44.3025 74.0941 45.2705 71.622 46.2757 69.1621C47.1319 67.0675 47.9919 64.9567 49.0157 62.9514C49.2093 62.5739 49.4066 62.2004 49.6188 61.8391C49.7007 61.6971 49.7901 61.5591 49.8757 61.421C50.0916 61.076 49.805 61.5996 49.7082 61.6565C49.7603 61.6281 49.8124 61.5103 49.8534 61.4576C50.0842 61.145 50.3299 60.8446 50.5905 60.5605C50.7059 60.4306 50.8474 60.3129 50.9591 60.1789C50.6091 60.6132 50.6612 60.4387 50.8139 60.321C50.8288 60.3088 51.1527 60.049 51.1601 60.0612C51.1638 60.0652 50.5347 60.4265 50.9218 60.2195C51.108 60.118 51.3909 60.0896 50.5979 60.3372C50.7022 60.3047 50.9553 60.252 50.49 60.3494C49.7715 60.4955 50.8325 60.3738 50.181 60.39C49.5295 60.4062 50.6352 60.5118 49.8348 60.3575C49.3396 60.2641 49.5071 60.2844 49.6077 60.3169C49.8534 60.3981 48.9934 59.9962 49.2614 60.1545C49.4662 60.2804 49.2428 60.3291 49.0194 59.9151C49.0418 59.9556 49.0902 59.9841 49.1162 60.0246C49.1758 60.118 49.2354 60.2033 49.2838 60.3007L49.0716 59.8542C49.4327 60.6214 49.4774 61.5591 49.5146 62.4034L49.496 61.9041C49.6188 65.05 49.2279 68.196 49.1609 71.3419C49.1348 72.6287 49.0641 74.0494 49.4066 75.2956C50.0954 77.7961 52.8168 77.6216 54.6373 76.7488C56.1004 76.0506 57.3215 74.7679 58.4458 73.5582C59.5701 72.3486 60.5455 71.1958 61.5544 69.9739C64.2982 66.6413 66.8819 63.1503 69.3055 59.5375C71.5057 56.2577 73.6836 52.8073 75.1318 49.0443C75.3254 48.541 75.4967 48.0295 75.6642 47.5181C75.8318 47.0066 75.3887 46.4545 75.0537 46.2272C74.5622 45.8903 73.799 45.805 73.2406 45.8822C71.9413 46.0567 70.6867 46.6981 70.2288 48.0945C70.4745 47.3476 70.1878 48.196 70.1171 48.3867C70.0203 48.6506 69.9161 48.9104 69.8118 49.1661C69.5922 49.7019 69.3539 50.2296 69.1045 50.7533C68.5609 51.8939 67.9653 53.0021 67.3435 54.09C66.6511 55.2956 65.9251 56.4769 65.1731 57.6419C64.7859 58.2426 64.3913 58.8393 63.9892 59.432C63.8924 59.5781 63.7919 59.7202 63.6951 59.8663C63.643 59.9435 63.3377 60.3859 63.5648 60.0571C63.7919 59.7283 63.4419 60.2357 63.3973 60.3007C63.2856 60.4631 63.1739 60.6214 63.0585 60.7837C60.2626 64.7537 57.288 68.6465 54.0156 72.1659C53.7326 72.4704 53.4422 72.7748 53.1481 73.0671C53.029 73.1848 52.9099 73.2984 52.7907 73.4162C52.4668 73.7287 53.3008 72.9615 53.07 73.1604C53.0141 73.2091 52.962 73.2579 52.9061 73.3066C52.787 73.408 52.6642 73.5095 52.5413 73.607C52.4594 73.6719 52.37 73.7287 52.2881 73.7977C52.0499 73.9966 52.8503 73.5704 52.4259 73.7166C52.4557 73.7084 53.1444 73.5095 52.7051 73.607C53.0513 73.5298 53.23 73.5014 53.539 73.4974C54.0826 73.4933 53.9262 73.4974 53.8071 73.4933C53.5763 73.4771 54.5628 73.6719 54.3208 73.5948C54.0379 73.5014 54.9165 73.9439 54.6745 73.7571C54.4958 73.6232 54.991 74.1631 54.924 73.9926C54.8867 73.8992 54.7862 73.8059 54.7378 73.7084L54.95 74.1549C54.641 73.4933 54.6112 72.6774 54.5814 71.9467L54.6001 72.446C54.4847 69.3082 54.8867 66.1704 54.9426 63.0366C54.9649 61.6687 55.017 60.1789 54.6634 58.8475C54.5331 58.3482 54.3208 57.8124 53.9746 57.4511C52.8652 56.2901 51.1117 56.3713 49.7231 56.7894C45.7209 57.991 43.8297 62.4643 42.2289 66.215C40.6131 69.9983 39.1575 73.8586 37.5678 77.654C36.9014 79.2412 36.2238 80.8324 35.442 82.3587C35.1628 82.9067 34.8575 83.4263 34.5336 83.9418C34.8017 83.5116 34.8426 83.5116 34.6267 83.7957C34.422 84.0677 34.1986 84.3112 33.9789 84.567C33.7965 84.774 34.1874 84.3721 34.1762 84.3843C34.1018 84.4452 33.871 84.5873 34.2321 84.364C34.422 84.2463 34.6304 84.1529 34.8426 84.092C34.7682 84.1123 35.5425 83.9824 35.2708 84.0068C34.999 84.0311 35.7734 84.0068 35.6952 84.0068C35.6058 84.0068 35.3899 83.9581 35.8031 84.0352C36.2164 84.1123 36.0116 84.0758 35.9186 84.0433C35.9632 84.0596 36.3839 84.3194 36.1605 84.1489C36.101 84.1042 35.7548 83.8322 36.0228 84.0677C36.276 84.2869 36.0079 84.0271 35.9521 83.9581C35.7957 83.7551 35.6654 83.5319 35.5463 83.3005L35.7585 83.747C35.2596 82.6997 35.1181 81.5712 35.066 80.4062L35.0846 80.9055C34.9171 76.7163 35.3341 72.5028 36.0005 68.3786C36.6929 64.1002 37.6832 59.8704 38.9788 55.7624C39.057 55.5189 39.1351 55.2794 39.2133 55.0358C39.3287 54.6827 39.2059 55.0521 39.1873 55.1129C39.2319 54.9709 39.2803 54.8288 39.3287 54.6908C39.4851 54.2321 39.6452 53.7734 39.8127 53.3147C40.118 52.4785 40.453 51.6626 40.8179 50.8548C41.6667 48.9753 42.5714 47.1202 43.3085 45.184C44.0456 43.2477 44.8051 41.0516 44.7604 38.884C44.7195 36.8747 44.2318 35.0196 43.2341 33.3147C42.0688 31.3256 40.2036 30.0916 38.0816 29.7507C35.1554 29.2798 31.4474 30.8061 30.5166 34.09C30.3752 34.5934 30.7735 35.1414 31.1272 35.3809C31.6186 35.7178 32.3818 35.803 32.9402 35.7259C34.1911 35.5595 35.5537 34.9181 35.9521 33.5136L35.9632 33.5014Z" />
<path d="M37.5193 40.1638C39.3716 36.2842 39.0325 32.0943 36.7619 30.8055C34.4913 29.5167 31.149 31.617 29.2967 35.4967C27.4444 39.3764 27.7836 43.5663 30.0542 44.8551C32.3248 46.1439 35.667 44.0435 37.5193 40.1638Z"   stroke-miterlimit="10"/>
<path d="M81.751 52.8761C79.4466 51.9668 76.7363 53.3876 75.2509 55.3279C74.2904 56.5822 73.5309 58.0517 72.8198 59.4846C72.1087 60.9175 71.4237 62.5291 70.8653 64.1203C70.3069 65.7115 69.808 67.3921 69.6367 69.0969C69.5399 70.063 69.5251 71.0697 69.7373 72.0196C69.9718 73.0669 70.6196 73.6636 71.6024 73.7976C73.8734 74.098 75.8726 72.6163 77.6372 71.2646C78.6052 70.5217 79.5248 69.6571 80.247 68.6301C81.0735 67.4529 81.658 66.0769 82.1606 64.7089C83.4338 61.2301 84.3496 56.9313 82.5329 53.4769C82.0973 52.6529 80.8278 52.8802 80.1279 53.0994C79.6253 53.2577 79.078 53.4607 78.6759 53.8422C78.4935 54.0127 78.0542 54.4268 78.218 54.7393C79.5918 57.3454 79.3461 60.3573 78.5903 63.1379C78.218 64.51 77.7415 65.8698 77.1533 67.1526C77.0974 67.2743 77.0416 67.3961 76.982 67.5138C76.9522 67.5707 76.9262 67.6315 76.8964 67.6884C76.9076 67.664 76.982 67.5301 76.9113 67.664C76.7773 67.9076 76.6395 68.1471 76.4906 68.3785C76.23 68.7844 75.9396 69.1578 75.6269 69.5191C75.3626 69.8235 75.787 69.3689 75.5785 69.5719C75.5003 69.649 75.4221 69.7261 75.3439 69.8033C75.1504 69.9859 74.953 70.1605 74.7483 70.3269C74.5621 70.4812 74.3723 70.6313 74.1824 70.7775C74.0633 70.8668 73.9441 70.9561 73.825 71.0454C73.7729 71.0819 73.7133 71.1185 73.6649 71.1631C73.7543 71.0779 73.9292 70.9764 73.7319 71.1144C73.475 71.2971 73.2182 71.4797 72.9538 71.6502C72.9203 71.6705 72.7863 71.7314 72.7714 71.7639C72.7751 71.7558 73.1549 71.5893 72.9389 71.6746C72.5815 71.8207 73.7319 71.4716 73.6165 71.4879C73.6686 71.4797 74.402 71.4391 74.3983 71.5406C74.3983 71.5772 74.134 71.0982 74.1042 70.9886C73.9925 70.5867 73.933 70.1605 73.9032 69.7424C73.7952 68.212 74.1712 66.6614 74.5845 65.2122C74.9754 63.8524 75.4593 62.525 76.0029 61.2301C76.6134 59.7728 77.2612 58.413 78.0319 57.0896C78.3855 56.4848 78.7541 55.88 79.1711 55.3239C79.2344 55.2386 79.2977 55.1574 79.3609 55.0803C79.3796 55.06 79.5732 54.8286 79.4764 54.9382C79.3721 55.0559 79.5471 54.8692 79.5508 54.8652C79.6253 54.7962 79.7035 54.7271 79.7816 54.6622C79.8375 54.6135 80.005 54.5526 79.8226 54.6257C79.7035 54.6744 79.3312 54.8489 79.6327 54.7434C79.2753 54.8692 78.9365 54.9707 78.5642 54.9788C78.4488 54.9788 77.9686 54.8773 78.2627 54.9951C79.1971 55.3644 80.4741 55.0356 81.3043 54.4958C81.7771 54.1873 82.7116 53.2739 81.7399 52.8924L81.751 52.8761Z" />
<path d="M107.763 62.1437C108.984 59.2007 110.302 56.3065 111.78 53.5056C113.258 50.7047 114.807 48.1027 116.854 45.8863L112.718 46.5845C112.782 48.5857 113.109 50.5991 113.4 52.5719C113.69 54.5447 113.991 56.5541 114.379 58.5228C114.509 59.1845 115.808 59.0424 116.188 58.9693C117.041 58.811 117.886 58.4863 118.519 57.8246C119.308 56.9965 119.889 55.9371 120.421 54.906C121.069 53.6517 121.612 52.3406 122.122 51.0132C123.049 48.602 123.831 46.1299 124.609 43.6578L120.309 44.6442C121.75 47.9484 122.074 51.7235 123.515 55.0278C123.872 55.8478 125.29 55.5352 125.905 55.3444C126.407 55.1861 126.955 54.9872 127.364 54.6219C127.554 54.4514 127.971 54.0901 127.833 53.7694C126.392 50.4652 126.069 46.6901 124.628 43.3858C124.304 42.643 123.09 42.8743 122.528 43.0042C122.07 43.1098 121.59 43.26 121.18 43.5198C120.86 43.7187 120.454 43.9703 120.328 44.3763C119.568 46.8037 118.798 49.2312 117.893 51.6018C117.398 52.8926 116.869 54.1753 116.255 55.4012C116.181 55.5474 116.106 55.6976 116.028 55.8396C116.006 55.8802 115.771 56.3024 115.905 56.071C115.775 56.2983 115.641 56.5216 115.499 56.7408C115.22 57.1751 114.915 57.5892 114.565 57.9586L118.701 57.2604C118.314 55.2916 118.012 53.2985 117.722 51.3095C117.431 49.3205 117.104 47.3233 117.041 45.3221C117.022 44.6645 115.518 44.8228 115.231 44.8756C114.386 45.0298 113.519 45.3505 112.901 46.0203C110.745 48.3544 109.092 51.2243 107.577 54.0779C106.062 56.9316 104.725 59.8664 103.485 62.8581C103.351 63.1829 103.657 63.4264 103.88 63.5238C104.278 63.6943 104.87 63.6578 105.276 63.5807C106.099 63.4305 107.383 63.0773 107.767 62.1437H107.763Z" />
<path d="M158.956 13.85C156.924 19.878 155.148 26.0197 153.636 32.2263C152.881 35.3276 152.196 38.4532 151.656 41.6073C151.22 44.1524 150.103 48.6298 153.365 49.466C155.673 50.0587 158.208 48.6623 160.111 47.343C161.775 46.1902 163.238 44.7694 164.481 43.1011C165.125 42.2365 163.934 41.7494 163.32 41.7494C162.296 41.7494 161.134 42.1309 160.468 43.024C160.356 43.1742 160.241 43.3243 160.125 43.4745C160.077 43.5395 160.025 43.6004 159.973 43.6613C160.018 43.6044 160.163 43.4461 159.943 43.6978C159.697 43.982 159.44 44.2539 159.176 44.5178C158.912 44.7816 158.64 45.0333 158.361 45.2769C158.242 45.3824 158.119 45.4798 157.996 45.5813C157.717 45.8127 157.959 45.6097 158.015 45.5691C157.929 45.63 157.847 45.695 157.761 45.7599C157.464 45.9791 157.162 46.1821 156.849 46.3769C156.715 46.4581 156.581 46.5393 156.447 46.6205C156.105 46.8275 156.473 46.588 156.525 46.5839C156.447 46.5921 156.324 46.6895 156.25 46.7301C156.086 46.8153 155.919 46.8965 155.751 46.9696C155.695 46.9939 155.569 47.0223 155.528 47.067C155.725 46.864 155.885 46.9574 155.632 47.0142C155.632 47.0142 156.082 46.933 155.826 46.9696C155.587 47.002 155.971 46.9615 155.982 46.9615C155.974 46.9615 156.231 46.9696 156.257 47.0305C156.239 46.9939 156.056 46.929 156.012 46.9046C156.231 47.0223 155.978 46.864 155.904 46.7788C155.863 46.7301 155.669 46.4378 155.773 46.6286C155.639 46.381 155.565 46.0846 155.517 45.8046C155.397 45.1429 155.423 44.7735 155.494 44.1281C155.643 42.7885 155.878 41.453 156.12 40.1297C157.199 34.1261 158.729 28.2158 160.416 22.3867C161.306 19.3179 162.248 16.2693 163.268 13.2493C163.39 12.888 163.089 12.5632 162.832 12.4252C162.434 12.2101 161.834 12.202 161.414 12.271C160.528 12.413 159.303 12.8311 158.956 13.85Z" />
<path d="M191.886 20.8445C190.37 21.6889 188.889 22.6103 187.474 23.6454C186.718 24.1975 185.962 24.7617 185.274 25.4072C184.693 25.9552 184.056 26.7792 184.019 27.656C183.915 29.9617 186.77 30.0915 188.263 30.2174C188.673 30.2499 189.078 30.2783 189.488 30.3189C189.663 30.3351 189.834 30.3554 190.009 30.3798C190.058 30.3879 190.422 30.4406 190.195 30.4041C189.998 30.3716 190.344 30.4366 190.381 30.4447C190.568 30.4853 190.75 30.534 190.932 30.5908C191.018 30.6193 191.1 30.6477 191.186 30.6801C191.215 30.6923 191.431 30.7735 191.234 30.6923C191.037 30.6111 191.245 30.7004 191.279 30.7167C191.361 30.7613 191.439 30.8019 191.521 30.8466C191.681 30.9359 191.833 31.0374 191.982 31.1429C192.057 31.1957 192.302 31.3986 192.109 31.2241C192.228 31.3296 192.336 31.4473 192.44 31.5691C192.544 31.6909 192.641 31.8127 192.731 31.9466C192.768 32.0035 192.801 32.0603 192.839 32.1171C192.958 32.3079 192.742 31.8208 192.883 32.1983C193.155 32.9087 193.155 33.3471 192.947 34.0777C192.947 34.0737 192.857 34.3254 192.906 34.1995C192.961 34.0493 192.827 34.37 192.816 34.3944C192.746 34.5486 192.671 34.6988 192.593 34.849C192.396 35.2143 192.172 35.5634 191.941 35.9044C191.897 35.9694 191.848 36.0384 191.804 36.1033C191.644 36.3347 191.964 35.9004 191.789 36.1196C191.673 36.2657 191.562 36.4199 191.446 36.5661C191.215 36.8583 190.973 37.1425 190.724 37.4185C190.475 37.6946 190.218 37.9625 189.957 38.2223C189.845 38.3359 189.73 38.4455 189.615 38.5511C189.518 38.6404 189.101 39.0503 189.414 38.7418C188.889 39.2574 188.271 39.6958 187.682 40.122C187.064 40.5726 186.428 40.9947 185.78 41.3925C185.72 41.4291 185.631 41.4656 185.579 41.5143C185.586 41.5062 185.936 41.3073 185.724 41.425C185.564 41.5143 185.408 41.6117 185.248 41.701C184.898 41.9 184.544 42.0948 184.19 42.2815C180.829 44.0676 177.295 45.4356 173.963 47.2866C173.543 47.518 173.066 47.8224 172.828 48.2933C172.657 48.6302 172.608 49.1051 172.869 49.4137C173.543 50.2011 174.965 50.0347 175.758 49.5963C178.725 47.9523 181.849 46.6858 184.868 45.1677C187.887 43.6495 190.579 41.9852 193.025 39.7039C194.183 38.6282 195.203 37.4023 196.092 36.0627C196.982 34.7232 197.771 33.0183 197.321 31.3215C196.938 29.8723 195.765 28.7642 194.533 28.1756C192.876 27.3881 191.1 27.3353 189.328 27.1567C189.097 27.1323 188.863 27.0958 188.632 27.0715C188.416 27.0471 188.654 27.0755 188.688 27.0836C188.583 27.0593 188.472 27.0146 188.367 27.0065C188.192 26.9903 188.442 27.0187 188.464 27.0674L188.349 27.0024L188.446 27.108C188.505 26.836 188.263 27.0796 188.397 27.108C188.352 27.0999 188.36 26.8604 188.352 27.0958C188.352 27.0106 188.375 26.9091 188.401 26.8279C188.349 26.9984 188.364 26.9213 188.438 26.8279C188.501 26.7467 188.635 26.6331 188.431 26.832C188.501 26.7629 188.568 26.6818 188.635 26.6046C188.792 26.4301 188.654 26.4666 188.58 26.6493C188.609 26.5762 188.792 26.4788 188.851 26.4301C189.034 26.284 189.216 26.1419 189.399 25.9998C190.132 25.4315 190.888 24.8916 191.658 24.3842C192.02 24.1447 192.384 23.9133 192.753 23.686C192.839 23.6333 193.051 23.4059 192.883 23.6089C192.738 23.7875 192.928 23.5845 193.014 23.5358C193.237 23.4059 193.46 23.2801 193.687 23.1543C194.108 22.9188 194.585 22.6184 194.823 22.1476C194.994 21.8106 195.043 21.3357 194.782 21.0272C194.112 20.2397 192.686 20.4021 191.893 20.8445H191.886Z" />
<path d="M92.5811 52.6119C92.6034 52.4698 92.6257 52.3196 92.6741 52.1816C92.5289 52.5835 92.8863 51.8163 92.7225 52.1085C92.5773 52.3683 93.0502 51.796 92.7709 52.0395C92.6481 52.1451 92.6555 52.141 92.797 52.0355C92.5103 52.1978 92.4694 52.2263 92.6779 52.1288L89.7926 51.9624C89.7033 51.8163 89.8298 52.0842 89.8522 52.1613C89.8522 52.1613 89.882 52.3967 89.8745 52.2628C89.8634 52.1085 89.8596 52.417 89.8559 52.4495C89.8373 52.6078 89.8038 52.7621 89.7666 52.9123C89.7479 52.9894 89.7256 53.0665 89.6995 53.1436C89.6735 53.2208 89.6176 53.371 89.6772 53.2127C89.4017 53.9433 89.0927 54.6578 88.8247 55.3925C88.2364 56.9959 87.7115 58.6196 87.2759 60.2798C86.8664 61.8345 86.5351 63.4136 86.2745 65.0089C86.1442 65.8045 86.0362 66.6042 85.9431 67.4079C85.8501 68.2116 85.6416 69.2102 86.2224 69.8678C87.1121 70.8705 88.7353 70.5823 89.7852 70.1073C90.6563 69.7095 91.3302 69.0641 91.8923 68.2522C92.7076 67.071 93.4671 65.8491 94.2266 64.6273C95.7195 62.2283 97.1788 59.7968 98.7797 57.483C99.0105 57.1501 99.2413 56.8213 99.4759 56.4966C99.595 56.3302 99.461 56.521 99.4424 56.5412C99.5057 56.456 99.5689 56.3708 99.6322 56.2815C99.7439 56.1313 99.8556 55.9811 99.971 55.8349C100.44 55.222 100.924 54.6212 101.423 54.0407C101.922 53.4603 102.477 52.8554 103.035 52.2993C103.296 52.0395 103.56 51.7838 103.832 51.5362C103.91 51.4631 103.988 51.3941 104.066 51.3251C104.23 51.1749 104.144 51.2317 104.036 51.3495C104.178 51.1993 104.36 51.0734 104.517 50.9435L101.147 51.0653C101.08 50.9313 101.241 51.3982 101.255 51.4631C101.278 51.5646 101.33 51.9056 101.33 51.9015C101.33 51.8975 101.308 52.2384 101.293 52.344C101.278 52.4495 101.255 52.551 101.229 52.6525C101.177 52.8351 101.17 52.8554 101.214 52.7134C100.314 54.9541 104.628 54.5887 105.276 52.9853C105.812 51.6498 105.768 50.4158 105.135 49.1372C104.896 48.6541 104.089 48.6176 103.672 48.6297C103.031 48.646 102.29 48.8246 101.769 49.2589C97.5586 52.7499 94.4835 57.4018 91.5461 62.143C90.8276 63.2999 90.1165 64.4609 89.3868 65.6137C89.0369 66.1617 88.6869 66.7097 88.3295 67.2536C88.1508 67.5256 87.9758 67.7976 87.7897 68.0614C88.095 67.6271 87.7711 68.0939 87.719 68.0899C87.9386 67.9031 87.9647 67.8747 87.7934 68.0006C88.2439 67.6758 88.7576 67.5378 89.331 67.5784L90.1724 67.9153C90.2208 68.0614 90.2245 68.0452 90.1761 67.8625C90.1463 68.1061 90.2208 67.5256 90.2133 67.5784C90.2505 67.209 90.2915 66.8356 90.3362 66.4662C90.4255 65.7274 90.5335 64.9886 90.6601 64.2539C90.9169 62.7235 91.2445 61.2053 91.6392 59.7115C92.071 58.0838 92.5848 56.456 93.1469 54.9906C93.7463 53.4278 94.785 51.6701 93.7798 50.0464C93.5639 49.6973 92.931 49.5471 92.5885 49.5309C92.0003 49.5065 91.4381 49.6405 90.8909 49.88C89.6251 50.4402 88.4822 51.6052 88.2439 53.1233C88.0726 54.2072 89.4613 54.4385 90.1575 54.3411C90.9988 54.2234 92.4061 53.7201 92.5811 52.6241V52.6119Z" />
<path d="M199 36.7565C198.725 35.6036 200.106 33.2127 201.532 32.0599C203.099 30.7934 205.199 31.4226 205.843 32.7946C206.487 34.1707 205.567 35.9974 203.866 37.0366C202.157 38.0798 199.365 38.2787 199 36.7565Z"   stroke-miterlimit="10"/>
<path d="M169.999 35.9369C171.882 35.4011 173.696 34.5933 175.378 33.5257C177.061 32.4581 178.889 31.2323 179.715 29.3244C180.088 28.4638 180.259 27.3841 179.961 26.4626C179.6 25.3544 178.736 24.6157 177.72 24.2869C175.468 23.5602 173.066 24.3437 171.149 25.6954C168.111 27.8387 166.328 31.626 165.479 35.3565C165.107 36.9923 164.783 38.8393 165.185 40.5077C165.736 42.7971 167.739 43.7348 169.768 43.6292C171.968 43.5156 174.09 42.2572 175.911 40.9948C177.605 39.8217 179.146 38.34 180.445 36.6717C180.709 36.3347 180.925 35.872 180.814 35.4133C180.702 34.9546 180.296 34.642 179.917 34.5203C178.919 34.2036 177.56 34.5203 176.864 35.4133C176.417 35.9897 175.94 36.5377 175.438 37.0573C175.363 37.1344 175.285 37.2075 175.211 37.2846C175.047 37.4551 175.293 37.2115 175.304 37.1994C175.207 37.3211 175.066 37.4226 174.954 37.5241C174.678 37.7758 174.395 38.0153 174.105 38.2467C173.815 38.478 173.521 38.7013 173.219 38.9124C173.089 39.0017 172.958 39.091 172.828 39.1803C172.783 39.2128 172.553 39.3467 172.802 39.2006C173.092 39.0301 172.698 39.2615 172.642 39.298C172.352 39.4726 172.054 39.6431 171.756 39.8014C171.618 39.8744 171.477 39.9475 171.339 40.0165C171.272 40.049 171.205 40.0815 171.138 40.1139C171.093 40.1342 170.65 40.3128 171.015 40.1789C171.361 40.049 170.896 40.2195 170.81 40.2438C170.658 40.2925 170.46 40.3088 170.315 40.3778C170.319 40.3778 170.788 40.3169 170.546 40.3291C170.475 40.3291 170.405 40.3453 170.334 40.3534C169.973 40.4021 170.408 40.3412 170.468 40.3656C170.397 40.3372 170.27 40.3494 170.192 40.3412C169.842 40.3088 170.568 40.4265 170.096 40.2925C169.913 40.2398 170.177 40.3291 170.2 40.3453C170.148 40.3007 170.081 40.2682 170.025 40.2235C169.969 40.1789 169.921 40.1383 169.865 40.0936C170.118 40.2885 169.958 40.1951 169.902 40.1099C169.827 39.9921 169.738 39.8338 169.649 39.7324C169.545 39.6146 169.664 39.777 169.682 39.8176C169.649 39.7324 169.615 39.6512 169.589 39.5659C169.548 39.436 169.511 39.3061 169.481 39.1722C169.444 39.0139 169.418 38.8515 169.399 38.6891C169.384 38.5795 169.384 38.1736 169.377 38.474C169.392 37.7717 169.444 37.0979 169.556 36.4038C169.675 35.669 169.824 34.9384 170.014 34.2199C170.055 34.0616 170.099 33.8992 170.144 33.7409C170.222 33.4689 170.073 33.9601 170.159 33.6962C170.185 33.6191 170.207 33.5379 170.233 33.4608C170.352 33.0955 170.483 32.7382 170.624 32.3851C170.896 31.7072 171.209 31.0455 171.57 30.4204C171.663 30.258 171.76 30.0997 171.856 29.9414C171.689 30.2174 171.871 29.9211 171.946 29.8156C172.158 29.5111 172.381 29.2148 172.62 28.9347C172.739 28.7926 172.862 28.6546 172.984 28.5207C173.037 28.4638 173.092 28.407 173.148 28.3502C173.275 28.2122 173.238 28.131 173.107 28.3826C173.245 28.1107 173.733 27.8549 173.964 27.6845C174.299 27.4368 173.651 27.8468 174.012 27.652C174.172 27.5667 174.328 27.4774 174.492 27.4044C174.559 27.3719 174.637 27.3516 174.701 27.311C174.69 27.3151 174.258 27.4531 174.496 27.4003C174.567 27.3841 174.641 27.3557 174.712 27.3354C175.177 27.1811 174.362 27.3638 174.634 27.3394C174.783 27.3272 174.928 27.311 175.077 27.2988C175.363 27.2704 174.69 27.2501 174.969 27.3069C175.04 27.3232 175.121 27.3232 175.192 27.3313C175.553 27.3678 174.902 27.2379 175.252 27.3557C175.553 27.4571 175.296 27.3638 175.233 27.3232C175.315 27.3719 175.393 27.4247 175.471 27.4815C175.698 27.6439 175.412 27.3678 175.564 27.5992C175.725 27.8428 175.617 27.6642 175.587 27.5911C175.613 27.656 175.635 27.725 175.654 27.7941C175.676 27.8752 175.751 28.3299 175.728 28.0133C175.739 28.1837 175.721 28.3624 175.695 28.5288C175.684 28.6018 175.661 28.6749 175.654 28.748C175.684 28.4598 175.672 28.6952 175.628 28.8129C175.557 28.9834 175.471 29.1458 175.378 29.3082C175.568 28.9753 175.248 29.4502 175.174 29.5395C175.121 29.6004 175.062 29.6532 175.013 29.7141C174.861 29.9049 175.285 29.4827 174.999 29.7344C174.384 30.2783 173.733 30.7614 173.059 31.212C173.018 31.2404 172.791 31.4027 173.022 31.2363C173.286 31.0455 172.899 31.3053 172.843 31.3419C172.679 31.4393 172.512 31.5326 172.348 31.626C171.968 31.8371 171.577 32.0319 171.186 32.2105C171.015 32.2877 170.84 32.3648 170.665 32.4379C170.609 32.4622 170.349 32.5678 170.646 32.45C170.985 32.3161 170.546 32.4866 170.472 32.5109C170.066 32.6571 169.656 32.787 169.243 32.9047C168.74 33.0467 168.178 33.3634 167.828 33.7977C167.583 34.1022 167.326 34.6299 167.46 35.0561C167.802 36.144 169.146 36.1886 169.991 35.9451L169.999 35.9369Z" />
<path d="M140.301 37.4303C138.097 37.0528 136.355 38.5345 134.992 40.2231C133.972 41.4896 133.079 42.8576 132.263 44.2864C131.519 45.5935 130.864 46.9534 130.32 48.3701C130.037 49.1048 129.784 49.8517 129.561 50.6108C129.319 51.4267 129.039 52.2791 128.946 53.1316C128.835 54.1626 129.147 55.1856 129.903 55.8391C130.659 56.4927 131.545 56.6226 132.438 56.6307C134.043 56.6428 135.54 55.8148 136.865 54.9095C139.441 53.1559 141.481 50.7366 143.041 47.9073C144.854 44.6274 145.804 40.8117 146.247 37.0366L141.865 37.3492L142.036 41.8468C142.092 43.3163 142.099 44.8223 142.412 46.2592C143.06 49.2306 145.305 51.4186 148.179 51.2684C149.106 51.2197 150.506 50.4809 150.543 49.3078C150.58 48.1346 149.474 47.611 148.521 47.6597C148.082 47.6841 148.856 47.7287 148.614 47.6719C148.588 47.6678 148.294 47.6435 148.291 47.615C148.291 47.6232 148.76 47.7774 148.354 47.6029C148.313 47.5866 148.272 47.5663 148.231 47.546C148.108 47.4851 148.149 47.5136 148.358 47.6313C148.331 47.5298 147.948 47.339 147.859 47.2619C147.769 47.1848 147.684 47.1036 147.602 47.0183C147.773 47.1929 147.71 47.136 147.591 46.9818C147.457 46.8113 147.337 46.6286 147.226 46.4419C147.151 46.3161 147.088 46.1862 147.025 46.0563C147.11 46.2349 147.069 46.1659 147.021 46.0238C146.827 45.4596 146.686 44.8872 146.597 44.2905C146.556 44.0226 146.53 43.7506 146.504 43.4827C146.492 43.3569 146.492 43.3609 146.504 43.503L146.492 43.3203C146.485 43.1701 146.477 43.0159 146.47 42.8657C146.44 42.2568 146.422 41.6439 146.399 41.0309L146.247 37.0325C146.15 34.4711 142.122 35.1287 141.865 37.3451C141.697 38.7861 141.459 40.2231 141.109 41.6236C141.198 41.2623 141.049 41.8347 141.046 41.8549C140.997 42.0295 140.949 42.204 140.901 42.3745C140.815 42.6627 140.729 42.9509 140.636 43.2351C140.394 43.9739 140.119 44.7005 139.813 45.4109C139.557 45.9995 139.277 46.5759 138.976 47.1401C138.939 47.2051 138.674 47.6678 138.916 47.2497C138.834 47.3877 138.756 47.5217 138.671 47.6556C138.503 47.9235 138.332 48.1915 138.153 48.4513C137.796 48.9708 137.416 49.4742 137.014 49.9491C136.984 49.9857 136.545 50.554 136.496 50.5337L136.656 50.3672C136.586 50.4403 136.511 50.5174 136.441 50.5905C136.295 50.7366 136.146 50.8787 135.997 51.0208C135.584 51.4064 135.152 51.7636 134.702 52.0965C134.587 52.1817 134.456 52.3035 134.33 52.3603C134.843 52.1249 134.423 52.2954 134.296 52.3725C133.998 52.5592 133.693 52.7419 133.377 52.9002C133.302 52.9367 132.937 53.0829 133.328 52.9367C133.719 52.7906 133.332 52.9286 133.261 52.953C133.149 52.9895 133.008 53.0017 132.904 53.0504L133.25 52.9855C133.172 52.9976 133.09 53.0057 133.012 53.0098C132.591 53.0707 133.514 53.091 133.109 53.0179C132.703 52.9449 133.559 53.2046 133.187 53.0463C132.844 52.9002 133.481 53.2615 133.287 53.1032C133.183 53.0179 133.224 53.0666 133.41 53.2534C133.362 53.1925 133.321 53.1316 133.28 53.0626C133.488 53.367 133.306 53.091 133.287 52.9164C133.332 53.3061 133.328 52.7906 133.336 52.7297C133.358 52.5633 133.395 52.3969 133.429 52.2345C133.537 51.6987 133.328 52.5836 133.477 52.0478C133.656 51.3942 133.846 50.7447 134.065 50.1034C134.501 48.8247 135.022 47.5785 135.621 46.381C135.77 46.0806 135.927 45.7843 136.087 45.492C136.165 45.3459 136.247 45.1998 136.329 45.0536C136.098 45.4596 136.455 44.8466 136.496 44.7776C136.869 44.1606 137.267 43.5598 137.684 42.9753C138.101 42.3908 138.537 41.8225 138.998 41.2826C139.08 41.1852 139.318 40.7833 139.054 41.2055C139.102 41.1283 139.445 40.7792 139.527 40.7874L139.307 40.9376C139.531 40.8198 139.478 40.832 139.143 40.97C139.382 40.901 139.322 40.9051 138.968 40.9822C138.648 40.9538 138.604 40.9538 138.838 40.9903C139.825 41.1608 141.262 40.6209 141.641 39.5209C142.021 38.4208 141.28 37.5927 140.297 37.4263L140.301 37.4303Z" />
</g>
<defs>
<clipPath id="clip0_40_384">
<rect width="227" height="100" rx="15" fill="white"/>
</clipPath>
</defs>
</svg></span></Link>
            <span className='register-title'>Create a Wormates Account</span>
            <span className='info'>Basic information</span>
            <form onSubmit={handleFirstStepSubmit}>
              <input name="first_name" type="text" placeholder='First name' className='register-name' value={first_name} onChange={(e) => setFirstName(e.target.value)} />
              <input name="last_name" type="text" placeholder='Last name (optional)' className='register-last' value={last_name} onChange={(e) => setLastName(e.target.value)} />
              <p className='register-date'>Date of birth</p>
              <select name="dob_month" className='month' value={dob_month} onChange={(e) => setDateOfBirthMonth(e.target.value)}>
                <option value="" disabled>Month</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              <input name="dob_year" type='number' placeholder='Year' className='year' value={dob_year} onChange={(e) => setDateOfBirthYear(e.target.value)} />
              <div><button type='submit' className='next-button_first'>Next</button></div>
            </form>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className='formContainer'>
          <div className='formWrapper'>
          <Link to='/'><span className='logo-register'>          <svg width="227" height="100" viewBox="0 0 227 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_40_384)">
<path d="M150.874 30.0955C151.068 30.1807 150.774 30.0143 150.759 30.0021C150.703 29.9615 150.647 29.9128 150.595 29.8641C150.483 29.7585 150.398 29.6571 150.327 29.5353C150.118 29.1781 150.01 28.7437 149.973 28.3256C149.94 27.9481 149.966 27.5909 150.063 27.2296C150.159 26.8684 150.338 26.4746 150.498 26.2595C150.647 26.0606 150.818 25.886 150.993 25.7196C150.774 25.9307 151.124 25.6181 151.142 25.6059C151.22 25.5491 151.302 25.4963 151.38 25.4395C151.775 25.1635 151.042 25.5978 151.474 25.3867C151.559 25.3421 151.649 25.2974 151.734 25.2487C152.185 25.0092 151.299 25.4192 151.771 25.2284C151.909 25.1716 152.043 25.1147 152.177 25.062C152.665 24.8712 153.156 24.7007 153.651 24.5302C153.752 24.4937 154.068 24.38 153.599 24.5465C153.771 24.4856 153.946 24.4287 154.117 24.3719C154.433 24.2664 154.75 24.1568 155.066 24.0512C157.423 23.2637 159.798 22.529 162.181 21.847C163.372 21.5061 164.567 21.1732 165.766 20.8566C166.35 20.7023 166.935 20.5521 167.523 20.4019C167.817 20.3289 168.107 20.2558 168.402 20.1827C168.521 20.1543 168.636 20.1259 168.755 20.0975C168.815 20.0813 169.489 19.9189 169.168 19.996C168.815 20.0813 169.396 19.9432 169.407 19.9392C169.582 19.8986 169.76 19.8539 169.935 19.8133C170.289 19.7322 170.643 19.6469 170.993 19.5698C171.67 19.4155 172.348 19.2653 173.025 19.1192C174.41 18.8188 175.803 18.5387 177.195 18.2708C177.75 18.1653 178.331 17.9786 178.837 17.7066C179.086 17.5726 179.604 17.2885 179.715 16.9556C179.995 16.1316 178.215 16.3995 177.977 16.4442C172.538 17.4833 167.139 18.7701 161.801 20.3005C159.213 21.0433 156.637 21.847 154.083 22.7076C152.806 23.1379 151.503 23.5357 150.26 24.0756C149.016 24.6155 147.624 25.3177 146.678 26.4543C145.964 27.3149 145.573 28.354 145.658 29.5272C145.744 30.7003 146.373 31.5243 147.341 31.9587C147.699 32.121 148.369 32.0033 148.719 31.9384C149.262 31.8369 149.869 31.6542 150.36 31.3741C150.852 31.094 151.749 30.4811 150.874 30.0914V30.0955Z" />
<path d="M35.9632 33.5014C35.9074 33.7003 35.8329 33.8262 35.9558 33.5623C35.9856 33.5014 36.1121 33.3269 36.1121 33.2741C36.1121 33.3675 35.7883 33.6557 36.0116 33.4446C36.0861 33.3756 36.3728 33.0833 36.0489 33.3878C35.6505 33.7612 36.1196 33.3553 36.1159 33.3634C36.0973 33.4202 35.5165 33.676 35.8515 33.5298C35.967 33.4771 36.3541 33.3147 35.859 33.5055C35.3638 33.6963 35.7064 33.5664 35.818 33.5339C36.3392 33.3837 35.5277 33.5745 35.5277 33.5826C35.5351 33.5542 35.8143 33.5542 35.8404 33.5501C36.1308 33.5095 35.2187 33.5217 35.5016 33.5501C35.5947 33.5582 35.6915 33.5582 35.7883 33.5664C35.8851 33.5745 35.9744 33.5948 36.0675 33.6029C36.3281 33.6191 35.5388 33.4568 35.7845 33.5501C35.9558 33.6151 36.1419 33.6557 36.3169 33.7206C36.3914 33.749 36.652 33.8667 36.3169 33.7125C35.967 33.5542 36.2834 33.7044 36.3616 33.745C36.5105 33.8262 36.652 33.9195 36.7934 34.0169C36.9349 34.1144 37.0652 34.228 37.203 34.3376C37.5082 34.5852 36.9796 34.09 37.1285 34.2686C37.1918 34.3457 37.27 34.4107 37.3333 34.4838C37.8619 35.0561 38.2863 35.73 38.6325 36.4484L38.4203 36.0019C38.9751 37.1913 39.2915 38.4821 39.3511 39.8176L39.3325 39.3183C39.3548 40.0531 39.2915 40.7756 39.1538 41.4982C39.0756 41.9163 38.9788 42.3303 38.8708 42.7403C38.815 42.9514 38.7554 43.1584 38.6921 43.3654C38.6623 43.471 38.6288 43.5724 38.5953 43.678C38.4799 44.0555 38.6661 43.4831 38.5842 43.7226C37.9922 45.4072 37.2811 47.0309 36.5366 48.6425C35.9148 49.9901 35.2857 51.3338 34.7682 52.7342C34.1651 54.3782 33.6178 56.0506 33.1189 57.7393C31.1346 64.4574 29.7795 71.5651 29.6306 78.6364C29.5673 81.6159 29.3328 86.0892 32.3781 87.5018C34.7942 88.6222 37.5827 87.2014 39.124 85.1028C39.6601 84.3721 40.1217 83.5968 40.5424 82.7809C41.5736 80.7675 42.4374 78.6526 43.2973 76.5499C44.3025 74.0941 45.2705 71.622 46.2757 69.1621C47.1319 67.0675 47.9919 64.9567 49.0157 62.9514C49.2093 62.5739 49.4066 62.2004 49.6188 61.8391C49.7007 61.6971 49.7901 61.5591 49.8757 61.421C50.0916 61.076 49.805 61.5996 49.7082 61.6565C49.7603 61.6281 49.8124 61.5103 49.8534 61.4576C50.0842 61.145 50.3299 60.8446 50.5905 60.5605C50.7059 60.4306 50.8474 60.3129 50.9591 60.1789C50.6091 60.6132 50.6612 60.4387 50.8139 60.321C50.8288 60.3088 51.1527 60.049 51.1601 60.0612C51.1638 60.0652 50.5347 60.4265 50.9218 60.2195C51.108 60.118 51.3909 60.0896 50.5979 60.3372C50.7022 60.3047 50.9553 60.252 50.49 60.3494C49.7715 60.4955 50.8325 60.3738 50.181 60.39C49.5295 60.4062 50.6352 60.5118 49.8348 60.3575C49.3396 60.2641 49.5071 60.2844 49.6077 60.3169C49.8534 60.3981 48.9934 59.9962 49.2614 60.1545C49.4662 60.2804 49.2428 60.3291 49.0194 59.9151C49.0418 59.9556 49.0902 59.9841 49.1162 60.0246C49.1758 60.118 49.2354 60.2033 49.2838 60.3007L49.0716 59.8542C49.4327 60.6214 49.4774 61.5591 49.5146 62.4034L49.496 61.9041C49.6188 65.05 49.2279 68.196 49.1609 71.3419C49.1348 72.6287 49.0641 74.0494 49.4066 75.2956C50.0954 77.7961 52.8168 77.6216 54.6373 76.7488C56.1004 76.0506 57.3215 74.7679 58.4458 73.5582C59.5701 72.3486 60.5455 71.1958 61.5544 69.9739C64.2982 66.6413 66.8819 63.1503 69.3055 59.5375C71.5057 56.2577 73.6836 52.8073 75.1318 49.0443C75.3254 48.541 75.4967 48.0295 75.6642 47.5181C75.8318 47.0066 75.3887 46.4545 75.0537 46.2272C74.5622 45.8903 73.799 45.805 73.2406 45.8822C71.9413 46.0567 70.6867 46.6981 70.2288 48.0945C70.4745 47.3476 70.1878 48.196 70.1171 48.3867C70.0203 48.6506 69.9161 48.9104 69.8118 49.1661C69.5922 49.7019 69.3539 50.2296 69.1045 50.7533C68.5609 51.8939 67.9653 53.0021 67.3435 54.09C66.6511 55.2956 65.9251 56.4769 65.1731 57.6419C64.7859 58.2426 64.3913 58.8393 63.9892 59.432C63.8924 59.5781 63.7919 59.7202 63.6951 59.8663C63.643 59.9435 63.3377 60.3859 63.5648 60.0571C63.7919 59.7283 63.4419 60.2357 63.3973 60.3007C63.2856 60.4631 63.1739 60.6214 63.0585 60.7837C60.2626 64.7537 57.288 68.6465 54.0156 72.1659C53.7326 72.4704 53.4422 72.7748 53.1481 73.0671C53.029 73.1848 52.9099 73.2984 52.7907 73.4162C52.4668 73.7287 53.3008 72.9615 53.07 73.1604C53.0141 73.2091 52.962 73.2579 52.9061 73.3066C52.787 73.408 52.6642 73.5095 52.5413 73.607C52.4594 73.6719 52.37 73.7287 52.2881 73.7977C52.0499 73.9966 52.8503 73.5704 52.4259 73.7166C52.4557 73.7084 53.1444 73.5095 52.7051 73.607C53.0513 73.5298 53.23 73.5014 53.539 73.4974C54.0826 73.4933 53.9262 73.4974 53.8071 73.4933C53.5763 73.4771 54.5628 73.6719 54.3208 73.5948C54.0379 73.5014 54.9165 73.9439 54.6745 73.7571C54.4958 73.6232 54.991 74.1631 54.924 73.9926C54.8867 73.8992 54.7862 73.8059 54.7378 73.7084L54.95 74.1549C54.641 73.4933 54.6112 72.6774 54.5814 71.9467L54.6001 72.446C54.4847 69.3082 54.8867 66.1704 54.9426 63.0366C54.9649 61.6687 55.017 60.1789 54.6634 58.8475C54.5331 58.3482 54.3208 57.8124 53.9746 57.4511C52.8652 56.2901 51.1117 56.3713 49.7231 56.7894C45.7209 57.991 43.8297 62.4643 42.2289 66.215C40.6131 69.9983 39.1575 73.8586 37.5678 77.654C36.9014 79.2412 36.2238 80.8324 35.442 82.3587C35.1628 82.9067 34.8575 83.4263 34.5336 83.9418C34.8017 83.5116 34.8426 83.5116 34.6267 83.7957C34.422 84.0677 34.1986 84.3112 33.9789 84.567C33.7965 84.774 34.1874 84.3721 34.1762 84.3843C34.1018 84.4452 33.871 84.5873 34.2321 84.364C34.422 84.2463 34.6304 84.1529 34.8426 84.092C34.7682 84.1123 35.5425 83.9824 35.2708 84.0068C34.999 84.0311 35.7734 84.0068 35.6952 84.0068C35.6058 84.0068 35.3899 83.9581 35.8031 84.0352C36.2164 84.1123 36.0116 84.0758 35.9186 84.0433C35.9632 84.0596 36.3839 84.3194 36.1605 84.1489C36.101 84.1042 35.7548 83.8322 36.0228 84.0677C36.276 84.2869 36.0079 84.0271 35.9521 83.9581C35.7957 83.7551 35.6654 83.5319 35.5463 83.3005L35.7585 83.747C35.2596 82.6997 35.1181 81.5712 35.066 80.4062L35.0846 80.9055C34.9171 76.7163 35.3341 72.5028 36.0005 68.3786C36.6929 64.1002 37.6832 59.8704 38.9788 55.7624C39.057 55.5189 39.1351 55.2794 39.2133 55.0358C39.3287 54.6827 39.2059 55.0521 39.1873 55.1129C39.2319 54.9709 39.2803 54.8288 39.3287 54.6908C39.4851 54.2321 39.6452 53.7734 39.8127 53.3147C40.118 52.4785 40.453 51.6626 40.8179 50.8548C41.6667 48.9753 42.5714 47.1202 43.3085 45.184C44.0456 43.2477 44.8051 41.0516 44.7604 38.884C44.7195 36.8747 44.2318 35.0196 43.2341 33.3147C42.0688 31.3256 40.2036 30.0916 38.0816 29.7507C35.1554 29.2798 31.4474 30.8061 30.5166 34.09C30.3752 34.5934 30.7735 35.1414 31.1272 35.3809C31.6186 35.7178 32.3818 35.803 32.9402 35.7259C34.1911 35.5595 35.5537 34.9181 35.9521 33.5136L35.9632 33.5014Z" />
<path d="M37.5193 40.1638C39.3716 36.2842 39.0325 32.0943 36.7619 30.8055C34.4913 29.5167 31.149 31.617 29.2967 35.4967C27.4444 39.3764 27.7836 43.5663 30.0542 44.8551C32.3248 46.1439 35.667 44.0435 37.5193 40.1638Z"   stroke-miterlimit="10"/>
<path d="M81.751 52.8761C79.4466 51.9668 76.7363 53.3876 75.2509 55.3279C74.2904 56.5822 73.5309 58.0517 72.8198 59.4846C72.1087 60.9175 71.4237 62.5291 70.8653 64.1203C70.3069 65.7115 69.808 67.3921 69.6367 69.0969C69.5399 70.063 69.5251 71.0697 69.7373 72.0196C69.9718 73.0669 70.6196 73.6636 71.6024 73.7976C73.8734 74.098 75.8726 72.6163 77.6372 71.2646C78.6052 70.5217 79.5248 69.6571 80.247 68.6301C81.0735 67.4529 81.658 66.0769 82.1606 64.7089C83.4338 61.2301 84.3496 56.9313 82.5329 53.4769C82.0973 52.6529 80.8278 52.8802 80.1279 53.0994C79.6253 53.2577 79.078 53.4607 78.6759 53.8422C78.4935 54.0127 78.0542 54.4268 78.218 54.7393C79.5918 57.3454 79.3461 60.3573 78.5903 63.1379C78.218 64.51 77.7415 65.8698 77.1533 67.1526C77.0974 67.2743 77.0416 67.3961 76.982 67.5138C76.9522 67.5707 76.9262 67.6315 76.8964 67.6884C76.9076 67.664 76.982 67.5301 76.9113 67.664C76.7773 67.9076 76.6395 68.1471 76.4906 68.3785C76.23 68.7844 75.9396 69.1578 75.6269 69.5191C75.3626 69.8235 75.787 69.3689 75.5785 69.5719C75.5003 69.649 75.4221 69.7261 75.3439 69.8033C75.1504 69.9859 74.953 70.1605 74.7483 70.3269C74.5621 70.4812 74.3723 70.6313 74.1824 70.7775C74.0633 70.8668 73.9441 70.9561 73.825 71.0454C73.7729 71.0819 73.7133 71.1185 73.6649 71.1631C73.7543 71.0779 73.9292 70.9764 73.7319 71.1144C73.475 71.2971 73.2182 71.4797 72.9538 71.6502C72.9203 71.6705 72.7863 71.7314 72.7714 71.7639C72.7751 71.7558 73.1549 71.5893 72.9389 71.6746C72.5815 71.8207 73.7319 71.4716 73.6165 71.4879C73.6686 71.4797 74.402 71.4391 74.3983 71.5406C74.3983 71.5772 74.134 71.0982 74.1042 70.9886C73.9925 70.5867 73.933 70.1605 73.9032 69.7424C73.7952 68.212 74.1712 66.6614 74.5845 65.2122C74.9754 63.8524 75.4593 62.525 76.0029 61.2301C76.6134 59.7728 77.2612 58.413 78.0319 57.0896C78.3855 56.4848 78.7541 55.88 79.1711 55.3239C79.2344 55.2386 79.2977 55.1574 79.3609 55.0803C79.3796 55.06 79.5732 54.8286 79.4764 54.9382C79.3721 55.0559 79.5471 54.8692 79.5508 54.8652C79.6253 54.7962 79.7035 54.7271 79.7816 54.6622C79.8375 54.6135 80.005 54.5526 79.8226 54.6257C79.7035 54.6744 79.3312 54.8489 79.6327 54.7434C79.2753 54.8692 78.9365 54.9707 78.5642 54.9788C78.4488 54.9788 77.9686 54.8773 78.2627 54.9951C79.1971 55.3644 80.4741 55.0356 81.3043 54.4958C81.7771 54.1873 82.7116 53.2739 81.7399 52.8924L81.751 52.8761Z" />
<path d="M107.763 62.1437C108.984 59.2007 110.302 56.3065 111.78 53.5056C113.258 50.7047 114.807 48.1027 116.854 45.8863L112.718 46.5845C112.782 48.5857 113.109 50.5991 113.4 52.5719C113.69 54.5447 113.991 56.5541 114.379 58.5228C114.509 59.1845 115.808 59.0424 116.188 58.9693C117.041 58.811 117.886 58.4863 118.519 57.8246C119.308 56.9965 119.889 55.9371 120.421 54.906C121.069 53.6517 121.612 52.3406 122.122 51.0132C123.049 48.602 123.831 46.1299 124.609 43.6578L120.309 44.6442C121.75 47.9484 122.074 51.7235 123.515 55.0278C123.872 55.8478 125.29 55.5352 125.905 55.3444C126.407 55.1861 126.955 54.9872 127.364 54.6219C127.554 54.4514 127.971 54.0901 127.833 53.7694C126.392 50.4652 126.069 46.6901 124.628 43.3858C124.304 42.643 123.09 42.8743 122.528 43.0042C122.07 43.1098 121.59 43.26 121.18 43.5198C120.86 43.7187 120.454 43.9703 120.328 44.3763C119.568 46.8037 118.798 49.2312 117.893 51.6018C117.398 52.8926 116.869 54.1753 116.255 55.4012C116.181 55.5474 116.106 55.6976 116.028 55.8396C116.006 55.8802 115.771 56.3024 115.905 56.071C115.775 56.2983 115.641 56.5216 115.499 56.7408C115.22 57.1751 114.915 57.5892 114.565 57.9586L118.701 57.2604C118.314 55.2916 118.012 53.2985 117.722 51.3095C117.431 49.3205 117.104 47.3233 117.041 45.3221C117.022 44.6645 115.518 44.8228 115.231 44.8756C114.386 45.0298 113.519 45.3505 112.901 46.0203C110.745 48.3544 109.092 51.2243 107.577 54.0779C106.062 56.9316 104.725 59.8664 103.485 62.8581C103.351 63.1829 103.657 63.4264 103.88 63.5238C104.278 63.6943 104.87 63.6578 105.276 63.5807C106.099 63.4305 107.383 63.0773 107.767 62.1437H107.763Z" />
<path d="M158.956 13.85C156.924 19.878 155.148 26.0197 153.636 32.2263C152.881 35.3276 152.196 38.4532 151.656 41.6073C151.22 44.1524 150.103 48.6298 153.365 49.466C155.673 50.0587 158.208 48.6623 160.111 47.343C161.775 46.1902 163.238 44.7694 164.481 43.1011C165.125 42.2365 163.934 41.7494 163.32 41.7494C162.296 41.7494 161.134 42.1309 160.468 43.024C160.356 43.1742 160.241 43.3243 160.125 43.4745C160.077 43.5395 160.025 43.6004 159.973 43.6613C160.018 43.6044 160.163 43.4461 159.943 43.6978C159.697 43.982 159.44 44.2539 159.176 44.5178C158.912 44.7816 158.64 45.0333 158.361 45.2769C158.242 45.3824 158.119 45.4798 157.996 45.5813C157.717 45.8127 157.959 45.6097 158.015 45.5691C157.929 45.63 157.847 45.695 157.761 45.7599C157.464 45.9791 157.162 46.1821 156.849 46.3769C156.715 46.4581 156.581 46.5393 156.447 46.6205C156.105 46.8275 156.473 46.588 156.525 46.5839C156.447 46.5921 156.324 46.6895 156.25 46.7301C156.086 46.8153 155.919 46.8965 155.751 46.9696C155.695 46.9939 155.569 47.0223 155.528 47.067C155.725 46.864 155.885 46.9574 155.632 47.0142C155.632 47.0142 156.082 46.933 155.826 46.9696C155.587 47.002 155.971 46.9615 155.982 46.9615C155.974 46.9615 156.231 46.9696 156.257 47.0305C156.239 46.9939 156.056 46.929 156.012 46.9046C156.231 47.0223 155.978 46.864 155.904 46.7788C155.863 46.7301 155.669 46.4378 155.773 46.6286C155.639 46.381 155.565 46.0846 155.517 45.8046C155.397 45.1429 155.423 44.7735 155.494 44.1281C155.643 42.7885 155.878 41.453 156.12 40.1297C157.199 34.1261 158.729 28.2158 160.416 22.3867C161.306 19.3179 162.248 16.2693 163.268 13.2493C163.39 12.888 163.089 12.5632 162.832 12.4252C162.434 12.2101 161.834 12.202 161.414 12.271C160.528 12.413 159.303 12.8311 158.956 13.85Z" />
<path d="M191.886 20.8445C190.37 21.6889 188.889 22.6103 187.474 23.6454C186.718 24.1975 185.962 24.7617 185.274 25.4072C184.693 25.9552 184.056 26.7792 184.019 27.656C183.915 29.9617 186.77 30.0915 188.263 30.2174C188.673 30.2499 189.078 30.2783 189.488 30.3189C189.663 30.3351 189.834 30.3554 190.009 30.3798C190.058 30.3879 190.422 30.4406 190.195 30.4041C189.998 30.3716 190.344 30.4366 190.381 30.4447C190.568 30.4853 190.75 30.534 190.932 30.5908C191.018 30.6193 191.1 30.6477 191.186 30.6801C191.215 30.6923 191.431 30.7735 191.234 30.6923C191.037 30.6111 191.245 30.7004 191.279 30.7167C191.361 30.7613 191.439 30.8019 191.521 30.8466C191.681 30.9359 191.833 31.0374 191.982 31.1429C192.057 31.1957 192.302 31.3986 192.109 31.2241C192.228 31.3296 192.336 31.4473 192.44 31.5691C192.544 31.6909 192.641 31.8127 192.731 31.9466C192.768 32.0035 192.801 32.0603 192.839 32.1171C192.958 32.3079 192.742 31.8208 192.883 32.1983C193.155 32.9087 193.155 33.3471 192.947 34.0777C192.947 34.0737 192.857 34.3254 192.906 34.1995C192.961 34.0493 192.827 34.37 192.816 34.3944C192.746 34.5486 192.671 34.6988 192.593 34.849C192.396 35.2143 192.172 35.5634 191.941 35.9044C191.897 35.9694 191.848 36.0384 191.804 36.1033C191.644 36.3347 191.964 35.9004 191.789 36.1196C191.673 36.2657 191.562 36.4199 191.446 36.5661C191.215 36.8583 190.973 37.1425 190.724 37.4185C190.475 37.6946 190.218 37.9625 189.957 38.2223C189.845 38.3359 189.73 38.4455 189.615 38.5511C189.518 38.6404 189.101 39.0503 189.414 38.7418C188.889 39.2574 188.271 39.6958 187.682 40.122C187.064 40.5726 186.428 40.9947 185.78 41.3925C185.72 41.4291 185.631 41.4656 185.579 41.5143C185.586 41.5062 185.936 41.3073 185.724 41.425C185.564 41.5143 185.408 41.6117 185.248 41.701C184.898 41.9 184.544 42.0948 184.19 42.2815C180.829 44.0676 177.295 45.4356 173.963 47.2866C173.543 47.518 173.066 47.8224 172.828 48.2933C172.657 48.6302 172.608 49.1051 172.869 49.4137C173.543 50.2011 174.965 50.0347 175.758 49.5963C178.725 47.9523 181.849 46.6858 184.868 45.1677C187.887 43.6495 190.579 41.9852 193.025 39.7039C194.183 38.6282 195.203 37.4023 196.092 36.0627C196.982 34.7232 197.771 33.0183 197.321 31.3215C196.938 29.8723 195.765 28.7642 194.533 28.1756C192.876 27.3881 191.1 27.3353 189.328 27.1567C189.097 27.1323 188.863 27.0958 188.632 27.0715C188.416 27.0471 188.654 27.0755 188.688 27.0836C188.583 27.0593 188.472 27.0146 188.367 27.0065C188.192 26.9903 188.442 27.0187 188.464 27.0674L188.349 27.0024L188.446 27.108C188.505 26.836 188.263 27.0796 188.397 27.108C188.352 27.0999 188.36 26.8604 188.352 27.0958C188.352 27.0106 188.375 26.9091 188.401 26.8279C188.349 26.9984 188.364 26.9213 188.438 26.8279C188.501 26.7467 188.635 26.6331 188.431 26.832C188.501 26.7629 188.568 26.6818 188.635 26.6046C188.792 26.4301 188.654 26.4666 188.58 26.6493C188.609 26.5762 188.792 26.4788 188.851 26.4301C189.034 26.284 189.216 26.1419 189.399 25.9998C190.132 25.4315 190.888 24.8916 191.658 24.3842C192.02 24.1447 192.384 23.9133 192.753 23.686C192.839 23.6333 193.051 23.4059 192.883 23.6089C192.738 23.7875 192.928 23.5845 193.014 23.5358C193.237 23.4059 193.46 23.2801 193.687 23.1543C194.108 22.9188 194.585 22.6184 194.823 22.1476C194.994 21.8106 195.043 21.3357 194.782 21.0272C194.112 20.2397 192.686 20.4021 191.893 20.8445H191.886Z" />
<path d="M92.5811 52.6119C92.6034 52.4698 92.6257 52.3196 92.6741 52.1816C92.5289 52.5835 92.8863 51.8163 92.7225 52.1085C92.5773 52.3683 93.0502 51.796 92.7709 52.0395C92.6481 52.1451 92.6555 52.141 92.797 52.0355C92.5103 52.1978 92.4694 52.2263 92.6779 52.1288L89.7926 51.9624C89.7033 51.8163 89.8298 52.0842 89.8522 52.1613C89.8522 52.1613 89.882 52.3967 89.8745 52.2628C89.8634 52.1085 89.8596 52.417 89.8559 52.4495C89.8373 52.6078 89.8038 52.7621 89.7666 52.9123C89.7479 52.9894 89.7256 53.0665 89.6995 53.1436C89.6735 53.2208 89.6176 53.371 89.6772 53.2127C89.4017 53.9433 89.0927 54.6578 88.8247 55.3925C88.2364 56.9959 87.7115 58.6196 87.2759 60.2798C86.8664 61.8345 86.5351 63.4136 86.2745 65.0089C86.1442 65.8045 86.0362 66.6042 85.9431 67.4079C85.8501 68.2116 85.6416 69.2102 86.2224 69.8678C87.1121 70.8705 88.7353 70.5823 89.7852 70.1073C90.6563 69.7095 91.3302 69.0641 91.8923 68.2522C92.7076 67.071 93.4671 65.8491 94.2266 64.6273C95.7195 62.2283 97.1788 59.7968 98.7797 57.483C99.0105 57.1501 99.2413 56.8213 99.4759 56.4966C99.595 56.3302 99.461 56.521 99.4424 56.5412C99.5057 56.456 99.5689 56.3708 99.6322 56.2815C99.7439 56.1313 99.8556 55.9811 99.971 55.8349C100.44 55.222 100.924 54.6212 101.423 54.0407C101.922 53.4603 102.477 52.8554 103.035 52.2993C103.296 52.0395 103.56 51.7838 103.832 51.5362C103.91 51.4631 103.988 51.3941 104.066 51.3251C104.23 51.1749 104.144 51.2317 104.036 51.3495C104.178 51.1993 104.36 51.0734 104.517 50.9435L101.147 51.0653C101.08 50.9313 101.241 51.3982 101.255 51.4631C101.278 51.5646 101.33 51.9056 101.33 51.9015C101.33 51.8975 101.308 52.2384 101.293 52.344C101.278 52.4495 101.255 52.551 101.229 52.6525C101.177 52.8351 101.17 52.8554 101.214 52.7134C100.314 54.9541 104.628 54.5887 105.276 52.9853C105.812 51.6498 105.768 50.4158 105.135 49.1372C104.896 48.6541 104.089 48.6176 103.672 48.6297C103.031 48.646 102.29 48.8246 101.769 49.2589C97.5586 52.7499 94.4835 57.4018 91.5461 62.143C90.8276 63.2999 90.1165 64.4609 89.3868 65.6137C89.0369 66.1617 88.6869 66.7097 88.3295 67.2536C88.1508 67.5256 87.9758 67.7976 87.7897 68.0614C88.095 67.6271 87.7711 68.0939 87.719 68.0899C87.9386 67.9031 87.9647 67.8747 87.7934 68.0006C88.2439 67.6758 88.7576 67.5378 89.331 67.5784L90.1724 67.9153C90.2208 68.0614 90.2245 68.0452 90.1761 67.8625C90.1463 68.1061 90.2208 67.5256 90.2133 67.5784C90.2505 67.209 90.2915 66.8356 90.3362 66.4662C90.4255 65.7274 90.5335 64.9886 90.6601 64.2539C90.9169 62.7235 91.2445 61.2053 91.6392 59.7115C92.071 58.0838 92.5848 56.456 93.1469 54.9906C93.7463 53.4278 94.785 51.6701 93.7798 50.0464C93.5639 49.6973 92.931 49.5471 92.5885 49.5309C92.0003 49.5065 91.4381 49.6405 90.8909 49.88C89.6251 50.4402 88.4822 51.6052 88.2439 53.1233C88.0726 54.2072 89.4613 54.4385 90.1575 54.3411C90.9988 54.2234 92.4061 53.7201 92.5811 52.6241V52.6119Z" />
<path d="M199 36.7565C198.725 35.6036 200.106 33.2127 201.532 32.0599C203.099 30.7934 205.199 31.4226 205.843 32.7946C206.487 34.1707 205.567 35.9974 203.866 37.0366C202.157 38.0798 199.365 38.2787 199 36.7565Z"   stroke-miterlimit="10"/>
<path d="M169.999 35.9369C171.882 35.4011 173.696 34.5933 175.378 33.5257C177.061 32.4581 178.889 31.2323 179.715 29.3244C180.088 28.4638 180.259 27.3841 179.961 26.4626C179.6 25.3544 178.736 24.6157 177.72 24.2869C175.468 23.5602 173.066 24.3437 171.149 25.6954C168.111 27.8387 166.328 31.626 165.479 35.3565C165.107 36.9923 164.783 38.8393 165.185 40.5077C165.736 42.7971 167.739 43.7348 169.768 43.6292C171.968 43.5156 174.09 42.2572 175.911 40.9948C177.605 39.8217 179.146 38.34 180.445 36.6717C180.709 36.3347 180.925 35.872 180.814 35.4133C180.702 34.9546 180.296 34.642 179.917 34.5203C178.919 34.2036 177.56 34.5203 176.864 35.4133C176.417 35.9897 175.94 36.5377 175.438 37.0573C175.363 37.1344 175.285 37.2075 175.211 37.2846C175.047 37.4551 175.293 37.2115 175.304 37.1994C175.207 37.3211 175.066 37.4226 174.954 37.5241C174.678 37.7758 174.395 38.0153 174.105 38.2467C173.815 38.478 173.521 38.7013 173.219 38.9124C173.089 39.0017 172.958 39.091 172.828 39.1803C172.783 39.2128 172.553 39.3467 172.802 39.2006C173.092 39.0301 172.698 39.2615 172.642 39.298C172.352 39.4726 172.054 39.6431 171.756 39.8014C171.618 39.8744 171.477 39.9475 171.339 40.0165C171.272 40.049 171.205 40.0815 171.138 40.1139C171.093 40.1342 170.65 40.3128 171.015 40.1789C171.361 40.049 170.896 40.2195 170.81 40.2438C170.658 40.2925 170.46 40.3088 170.315 40.3778C170.319 40.3778 170.788 40.3169 170.546 40.3291C170.475 40.3291 170.405 40.3453 170.334 40.3534C169.973 40.4021 170.408 40.3412 170.468 40.3656C170.397 40.3372 170.27 40.3494 170.192 40.3412C169.842 40.3088 170.568 40.4265 170.096 40.2925C169.913 40.2398 170.177 40.3291 170.2 40.3453C170.148 40.3007 170.081 40.2682 170.025 40.2235C169.969 40.1789 169.921 40.1383 169.865 40.0936C170.118 40.2885 169.958 40.1951 169.902 40.1099C169.827 39.9921 169.738 39.8338 169.649 39.7324C169.545 39.6146 169.664 39.777 169.682 39.8176C169.649 39.7324 169.615 39.6512 169.589 39.5659C169.548 39.436 169.511 39.3061 169.481 39.1722C169.444 39.0139 169.418 38.8515 169.399 38.6891C169.384 38.5795 169.384 38.1736 169.377 38.474C169.392 37.7717 169.444 37.0979 169.556 36.4038C169.675 35.669 169.824 34.9384 170.014 34.2199C170.055 34.0616 170.099 33.8992 170.144 33.7409C170.222 33.4689 170.073 33.9601 170.159 33.6962C170.185 33.6191 170.207 33.5379 170.233 33.4608C170.352 33.0955 170.483 32.7382 170.624 32.3851C170.896 31.7072 171.209 31.0455 171.57 30.4204C171.663 30.258 171.76 30.0997 171.856 29.9414C171.689 30.2174 171.871 29.9211 171.946 29.8156C172.158 29.5111 172.381 29.2148 172.62 28.9347C172.739 28.7926 172.862 28.6546 172.984 28.5207C173.037 28.4638 173.092 28.407 173.148 28.3502C173.275 28.2122 173.238 28.131 173.107 28.3826C173.245 28.1107 173.733 27.8549 173.964 27.6845C174.299 27.4368 173.651 27.8468 174.012 27.652C174.172 27.5667 174.328 27.4774 174.492 27.4044C174.559 27.3719 174.637 27.3516 174.701 27.311C174.69 27.3151 174.258 27.4531 174.496 27.4003C174.567 27.3841 174.641 27.3557 174.712 27.3354C175.177 27.1811 174.362 27.3638 174.634 27.3394C174.783 27.3272 174.928 27.311 175.077 27.2988C175.363 27.2704 174.69 27.2501 174.969 27.3069C175.04 27.3232 175.121 27.3232 175.192 27.3313C175.553 27.3678 174.902 27.2379 175.252 27.3557C175.553 27.4571 175.296 27.3638 175.233 27.3232C175.315 27.3719 175.393 27.4247 175.471 27.4815C175.698 27.6439 175.412 27.3678 175.564 27.5992C175.725 27.8428 175.617 27.6642 175.587 27.5911C175.613 27.656 175.635 27.725 175.654 27.7941C175.676 27.8752 175.751 28.3299 175.728 28.0133C175.739 28.1837 175.721 28.3624 175.695 28.5288C175.684 28.6018 175.661 28.6749 175.654 28.748C175.684 28.4598 175.672 28.6952 175.628 28.8129C175.557 28.9834 175.471 29.1458 175.378 29.3082C175.568 28.9753 175.248 29.4502 175.174 29.5395C175.121 29.6004 175.062 29.6532 175.013 29.7141C174.861 29.9049 175.285 29.4827 174.999 29.7344C174.384 30.2783 173.733 30.7614 173.059 31.212C173.018 31.2404 172.791 31.4027 173.022 31.2363C173.286 31.0455 172.899 31.3053 172.843 31.3419C172.679 31.4393 172.512 31.5326 172.348 31.626C171.968 31.8371 171.577 32.0319 171.186 32.2105C171.015 32.2877 170.84 32.3648 170.665 32.4379C170.609 32.4622 170.349 32.5678 170.646 32.45C170.985 32.3161 170.546 32.4866 170.472 32.5109C170.066 32.6571 169.656 32.787 169.243 32.9047C168.74 33.0467 168.178 33.3634 167.828 33.7977C167.583 34.1022 167.326 34.6299 167.46 35.0561C167.802 36.144 169.146 36.1886 169.991 35.9451L169.999 35.9369Z" />
<path d="M140.301 37.4303C138.097 37.0528 136.355 38.5345 134.992 40.2231C133.972 41.4896 133.079 42.8576 132.263 44.2864C131.519 45.5935 130.864 46.9534 130.32 48.3701C130.037 49.1048 129.784 49.8517 129.561 50.6108C129.319 51.4267 129.039 52.2791 128.946 53.1316C128.835 54.1626 129.147 55.1856 129.903 55.8391C130.659 56.4927 131.545 56.6226 132.438 56.6307C134.043 56.6428 135.54 55.8148 136.865 54.9095C139.441 53.1559 141.481 50.7366 143.041 47.9073C144.854 44.6274 145.804 40.8117 146.247 37.0366L141.865 37.3492L142.036 41.8468C142.092 43.3163 142.099 44.8223 142.412 46.2592C143.06 49.2306 145.305 51.4186 148.179 51.2684C149.106 51.2197 150.506 50.4809 150.543 49.3078C150.58 48.1346 149.474 47.611 148.521 47.6597C148.082 47.6841 148.856 47.7287 148.614 47.6719C148.588 47.6678 148.294 47.6435 148.291 47.615C148.291 47.6232 148.76 47.7774 148.354 47.6029C148.313 47.5866 148.272 47.5663 148.231 47.546C148.108 47.4851 148.149 47.5136 148.358 47.6313C148.331 47.5298 147.948 47.339 147.859 47.2619C147.769 47.1848 147.684 47.1036 147.602 47.0183C147.773 47.1929 147.71 47.136 147.591 46.9818C147.457 46.8113 147.337 46.6286 147.226 46.4419C147.151 46.3161 147.088 46.1862 147.025 46.0563C147.11 46.2349 147.069 46.1659 147.021 46.0238C146.827 45.4596 146.686 44.8872 146.597 44.2905C146.556 44.0226 146.53 43.7506 146.504 43.4827C146.492 43.3569 146.492 43.3609 146.504 43.503L146.492 43.3203C146.485 43.1701 146.477 43.0159 146.47 42.8657C146.44 42.2568 146.422 41.6439 146.399 41.0309L146.247 37.0325C146.15 34.4711 142.122 35.1287 141.865 37.3451C141.697 38.7861 141.459 40.2231 141.109 41.6236C141.198 41.2623 141.049 41.8347 141.046 41.8549C140.997 42.0295 140.949 42.204 140.901 42.3745C140.815 42.6627 140.729 42.9509 140.636 43.2351C140.394 43.9739 140.119 44.7005 139.813 45.4109C139.557 45.9995 139.277 46.5759 138.976 47.1401C138.939 47.2051 138.674 47.6678 138.916 47.2497C138.834 47.3877 138.756 47.5217 138.671 47.6556C138.503 47.9235 138.332 48.1915 138.153 48.4513C137.796 48.9708 137.416 49.4742 137.014 49.9491C136.984 49.9857 136.545 50.554 136.496 50.5337L136.656 50.3672C136.586 50.4403 136.511 50.5174 136.441 50.5905C136.295 50.7366 136.146 50.8787 135.997 51.0208C135.584 51.4064 135.152 51.7636 134.702 52.0965C134.587 52.1817 134.456 52.3035 134.33 52.3603C134.843 52.1249 134.423 52.2954 134.296 52.3725C133.998 52.5592 133.693 52.7419 133.377 52.9002C133.302 52.9367 132.937 53.0829 133.328 52.9367C133.719 52.7906 133.332 52.9286 133.261 52.953C133.149 52.9895 133.008 53.0017 132.904 53.0504L133.25 52.9855C133.172 52.9976 133.09 53.0057 133.012 53.0098C132.591 53.0707 133.514 53.091 133.109 53.0179C132.703 52.9449 133.559 53.2046 133.187 53.0463C132.844 52.9002 133.481 53.2615 133.287 53.1032C133.183 53.0179 133.224 53.0666 133.41 53.2534C133.362 53.1925 133.321 53.1316 133.28 53.0626C133.488 53.367 133.306 53.091 133.287 52.9164C133.332 53.3061 133.328 52.7906 133.336 52.7297C133.358 52.5633 133.395 52.3969 133.429 52.2345C133.537 51.6987 133.328 52.5836 133.477 52.0478C133.656 51.3942 133.846 50.7447 134.065 50.1034C134.501 48.8247 135.022 47.5785 135.621 46.381C135.77 46.0806 135.927 45.7843 136.087 45.492C136.165 45.3459 136.247 45.1998 136.329 45.0536C136.098 45.4596 136.455 44.8466 136.496 44.7776C136.869 44.1606 137.267 43.5598 137.684 42.9753C138.101 42.3908 138.537 41.8225 138.998 41.2826C139.08 41.1852 139.318 40.7833 139.054 41.2055C139.102 41.1283 139.445 40.7792 139.527 40.7874L139.307 40.9376C139.531 40.8198 139.478 40.832 139.143 40.97C139.382 40.901 139.322 40.9051 138.968 40.9822C138.648 40.9538 138.604 40.9538 138.838 40.9903C139.825 41.1608 141.262 40.6209 141.641 39.5209C142.021 38.4208 141.28 37.5927 140.297 37.4263L140.301 37.4303Z" />
</g>
<defs>
<clipPath id="clip0_40_384">
<rect width="227" height="100" rx="15" fill="white"/>
</clipPath>
</defs>
</svg></span></Link>
            <span className='register-title'>Enter your email and password</span>
            <form onSubmit={handleSecondStepSubmit}>
              <div>
                <input type="email" placeholder='Email' name="email" className='register-mail' value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <input type="password" placeholder='Password' name="password" className='register-password' value={password} onChange={(e) => setPassword(e.target.value)} />
                <input type="password" placeholder='Repeat password' name="password2" className='register-password' value={password2} onChange={(e) => setPassword2(e.target.value)} />
              </div>
              <button className='back-button' type="button" onClick={() => setCurrentStep(1)}>Back</button>
              <button type='submit' className='next-button'>Next</button>
            </form>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className='formContainer'>
          <div className='formWrapper'>
            <span className='logo-register'><img src={Logo} alt="Logo" /></span>
            <span className='finish-title'>We have sent a four<br /> digit code to your<br />  email</span>
            <form>
              <span className='finish-text'>Enter code</span>
              <input type="number" placeholder='' className='register-code' value={verification_code} onChange={(e) => setCode(e.target.value)} />
              <div className='resent'>
      {timeLeft <= 0 ? (
        <a className='resend_on' href="#" onClick={handleClick}>Resent a code</a>
      ) : (
        <span className='resend_off'>Resent in {formatTime(timeLeft)} seconds</span>
      )}
    </div>
              <button className='back-button' type="button" onClick={() => setCurrentStep(2)}>Back</button>
              <Link to='/login'><button type='submit' className='next-button' onClick={CodeSubmit}>Finish</button></Link>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const BirthSelector = () => {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);


    setSelectedDay('');
  };

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };


  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];


  const generateDays = () => {
    if (selectedMonth && selectedYear) {
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    }
    return [];
  };

  return (
    <div className='change-birth'>

<select id="year" className='change-input-year' value={selectedYear} onChange={handleYearChange}>
        <option value="" disabled>Select year</option>
        {Array.from({ length: 114 }, (_, i) => new Date().getFullYear() - i).map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>


      <select id="day" className='change-input-day' value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
        <option value="" disabled>day</option>
        {generateDays().map((day) => (
          <option key={day} value={day}>
            {day}
          </option>
        ))}
      </select>

      <select id="month" className='change-input-month' value={selectedMonth} onChange={handleMonthChange}>
        <option value="" disabled>Select month</option>
        {months.map((month, index) => (
          <option key={index + 1} value={index + 1}>
            {month}
          </option>
        ))}
      </select>
    </div>
  );
};

function Privacy() {
  const [autoAddReading, setAutoAddReading] = useState(false);
  const [libraryVisibility, setLibraryVisibility] = useState('friends');
  const token = localStorage.getItem('token');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [code, setVerificationCode] = useState('');
  const [allDataSaved, setAllDataSaved] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const saveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Access token not found');
      }
  
      const response = await axios.post(
        `${apiUrl}/users/api/settings/security/`,
        {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_new_password: repeatPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
  
      console.log(response.data);
      setAllDataSaved(true);
  
      // Откройте модальное окно
      setIsModalVisible(true);
    } catch (error) {
      console.error('Ошибка при сохранении настроек безопасности:', error);
      console.log(currentPassword);
      console.log(newPassword);
      console.log(repeatPassword);
    }
  };

  const handleVerificationCodeChange = (e) => {
    const code = e.target.value;
    setVerificationCode(code);
    if (code.length === 6) {
      sendVerificationCode(code);
    }
  };

  const sendVerificationCode = async (code) => {
    try {
      const token = localStorage.getItem('token'); 
  
      const response = await axios.post(
        `${apiUrl}/users/api/settings/verify-password-change/`,
        { verification_code: code },
        {
          headers: {
            Authorization: `Bearer ${token}` 
          }
        }
      );
      console.log('Ответ от сервера:', response.data);
      setAllDataSaved(false);
    } catch (error) {
      console.error('Ошибка при отправке верификационного кода:', error);
      console.log(code);
    }
  };

  const discardChanges = () => {

  };


useEffect(() => {
    if (token !== null) {
        axios.put(
            `${apiUrl}/users/api/settings/privacy/`,
            {
                auto_add_reading: autoAddReading,
                library_visibility: libraryVisibility
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )
        .then(response => {
            console.log('Успешно сохранено:', response.data);
        })
        .catch(error => {
            console.error('Ошибка при сохранении настроек:', error);
        });
    }
}, [autoAddReading, token]);

// Обработчик изменения libraryVisibility
useEffect(() => {
    if (token !== null) {
        axios.put(
            `${apiUrl}/users/api/settings/privacy/`,
            {
                auto_add_reading: autoAddReading,
                library_visibility: libraryVisibility
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )
        .then(response => {
            console.log('Успешно сохранено:', response.data);
        })
        .catch(error => {
            console.error('Ошибка при сохранении настроек:', error);
            console.log('Успешно сохранено:', autoAddReading);
        });
    }
}, [libraryVisibility, token]);

const handleAutoAddReadingChange = (e) => {
  const value = e.target.value === "true"; // Преобразуем строку "true" в true, а "false" в false
  setAutoAddReading(value);
};

const handleLibraryVisibilityChange = (e) => {
  const value = e.target.value;
  setLibraryVisibility(value);
};


  const handleDiscard = () => {
      axios.get(`${apiUrl}/users/api/settings/privacy/`)
          .then(response => {
              setAutoAddReading(response.data.auto_add_reading);
              setLibraryVisibility(response.data.library_visibility);
          })
          .catch(error => {
              console.error('Ошибка при загрузке данных с сервера:', error);
          });
  };

  return (
      <div className='privacy-setting'>
        <div className='privacy-views'>Privacy</div>
          <div className='privacy-info'>
              <ul className='privacy-setting-ul'>
                  <li className='privacy-setting-li'>
                      <label className='privacy-label'>Auto add books to<br></br>the library</label>
                      <select className='privacy-input' value={autoAddReading} onChange={handleAutoAddReadingChange}>
                          <option value="true">Active (Recommended)</option>
                          <option value="false">Off</option>
                      </select>
                  </li>
                  <li className='privacy-setting-li'>
                      <label className='privacy-label'>Who can see your<br></br>Library</label>
                      <select className='privacy-input' value={libraryVisibility} onChange={handleLibraryVisibilityChange}>
                          <option value="private">No One</option>
                          <option value="followers">Friends Only (Default)</option>
                          <option value="everyone">Everyone</option>
                      </select>
                  </li>
              </ul>
          </div>
          <div className='setting-security'>
            <div className='privacy-views'>Security</div>
            <div className='setting-views'>We do not share and disclose Your personal information to anyone</div>
            <ul className="security-info-ul">
            <li className='security-info-li'>
                      <label className='security-label'>Your Email</label>
                      <input type="email" className='security-input' />
                  </li>
            </ul>
          <div className='setting-password-change'>Password Change</div>
          <div className='security-info'>
              <ul className="security-info-ul">
                  <li className='security-info-li'>
                      <label className='security-label'>Current Password</label>
                      <input type="password" className='security-input' value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  </li>
                  <li className="security-info-li">
                      <div className='pw-change-menu'>
                          <div className='security-change-pw'>
                              <label className='security-pw-label'>New Password</label>
                              <input type="password" className='security-input' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                          </div>
                          <div className='security-change-pw'>
                              <label className='security-pw-label'>Repeat Password</label>
                              <input type="password" className='security-input' value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} />
                          </div>
                      </div>
                  </li>
              </ul>
          </div>
          <div className="change-buttons_sec">
              <button className='save-button' onClick={saveSettings}>Save</button>
              <button className='discard-button' onClick={discardChanges}>Cancel</button>
          </div>
          {isModalVisible && (
      <div className="modal">
        <div className="modal-content">
        <div className="close" onClick={() => setIsModalVisible(false)}>&times;</div>
          <div className='modal-text'>To confirm changes, please enter the code which We have sent to You on Your email below</div>
          <input className='modal-number' type="number" value={code} onChange={handleVerificationCodeChange} />
        </div>
      </div>
    )}
      </div>
      </div>
  );
}

function Security() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [code, setVerificationCode] = useState('');
  const [allDataSaved, setAllDataSaved] = useState(false);

  const saveSettings = async () => {
      try {
          const token = localStorage.getItem('token');
          const response = await axios.post(
              `${apiUrl}/users/api/settings/security/`,
              {
                  current_password: currentPassword,
                  new_password: newPassword,
                  confirm_new_password: repeatPassword
              },
              {
                  headers: {
                      Authorization: `Bearer ${token}`
                  }
              },
              
          );
          console.log(response.data);
          setAllDataSaved(true);
      } catch (error) {
          console.error('Ошибка при сохранении настроек безопасности:', error);
          console.log(currentPassword);
          console.log(newPassword);
          console.log(repeatPassword);

      }
  };

  const handleVerificationCodeChange = (e) => {
    const code = e.target.value;
    setVerificationCode(code);
    if (code.length === 6) {
      sendVerificationCode(code);
    }
  };

  const sendVerificationCode = async (code) => {
    try {
      const token = localStorage.getItem('token'); 
  
      const response = await axios.post(
        `${apiUrl}/users/api/settings/verify-password-change/`,
        { verification_code: code },
        {
          headers: {
            Authorization: `Bearer ${token}` 
          }
        }
      );
      console.log('Ответ от сервера:', response.data);
      setAllDataSaved(false);
    } catch (error) {
      console.error('Ошибка при отправке верификационного кода:', error);
      console.log(code);
    }
  };

  const discardChanges = () => {

  };

  return (
      <div className='setting-security'>
          <div className='setting-views'>We do not share and disclose Your personal information to anyone</div>
          <div className='setting-password-change'>Password Change</div>
          <div className='security-info'>
              <ul className="security-info-ul">
                  <li className='security-info-li'>
                      <label className='security-label'>Current Password</label>
                      <input type="password" className='security-input' value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  </li>
                  <li className="security-info-li">
                      <div className='pw-change-menu'>
                          <div className='security-change-pw'>
                              <label className='security-pw-label'>New Password</label>
                              <input type="password" className='security-input' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                          </div>
                          <div className='security-change-pw'>
                              <label className='security-pw-label'>Repeat Password</label>
                              <input type="password" className='security-input' value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} />
                          </div>
                      </div>
                  </li>
                  {allDataSaved && (
            <li className="security-info-li">
              <div className='security-change-pw'>
                <label className='security-pw-label'>Verification Code</label>
                <input
                  type="text"
                  className='security-input'
                  value={code}
                  onChange={handleVerificationCodeChange}
                />
              </div>
            </li>
          )}
              </ul>
          </div>
          <div className="change-buttons_sec">
              <button className='save-button' onClick={saveSettings}>Save</button>
              <button className='discard-button' onClick={discardChanges}>Cancel</button>
          </div>
      </div>
  );
}

function Notifications() {
  const [notificationsData, setNotificationsData] = useState(null);
  const [originalNotificationsData, setOriginalNotificationsData] = useState(null);
  const [isToggled, setIsToggled] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchNotificationsData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/users/api/settings/notifications/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setNotificationsData(response.data);
        setOriginalNotificationsData(response.data);
        setIsToggled(response.data.group_by_author);
      } catch (error) {
        console.error('Error fetching notifications data:', error);
      }
    };

    fetchNotificationsData();
  }, []);

  const handleNotificationsToggle = (type) => {
    setNotificationsData({ ...notificationsData, [type]: !notificationsData[type] });
  };

  const handleSaveChanges = async () => {
    try {
      await axios.post(`${apiUrl}/users/api/settings/notifications/update/`, notificationsData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setOriginalNotificationsData(notificationsData);
    } catch (error) {
      console.error('Error saving notifications data:', error);
    }
  };

  const handleDiscardChanges = () => {
    setNotificationsData(originalNotificationsData);
  };

  return (
    <div className='setting-notifications'>
      <div className='notifications-views'>General Notifications</div>
      <div className='notifications-menu'>
        <ul className='notifications-ul'>
          <li className='notifications-li'>
            <label className='notifications-label'>Group notifications by author</label>
            <button className={notificationsData?.group_by_author ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={() => handleNotificationsToggle('group_by_author')}></button>
          </li>
          <li className='notifications-li'>
            <label className='notifications-label'>Show book’s updates</label>
            <button className={notificationsData?.show_book_updates ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={() => handleNotificationsToggle('show_book_updates')}></button>
          </li>
          <li className='notifications-li'>
            <label className='notifications-label'>Show author’s updates</label>
            <button className={notificationsData?.show_author_updates ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={() => handleNotificationsToggle('show_author_updates')}></button>
          </li>
        </ul>
      </div>
      <div className='notifications-views'>Book’s Updates</div>
      <div className='notifications-menu'>
        <ul>
          <li className='notifications-li'>
            <label className='notifications-label'>New Ebooks</label>
            <button className={notificationsData?.newbooks ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={() => handleNotificationsToggle('newbooks')}></button>
          </li>
          <li className='notifications-li'>
            <label className='notifications-label'>Library reading list updates</label>
            <button className={notificationsData?.library_reading_updates ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={() => handleNotificationsToggle('library_reading_updates')}></button>
          </li>
          <li className='notifications-li'>
            <label className='notifications-label'>Library wish list updates</label>
            <button className={notificationsData?.library_wishlist_updates ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={() => handleNotificationsToggle('library_wishlist_updates')}></button>
          </li>
          <li className='notifications-li'>
            <label className='notifications-label'>Library liked updates</label>
            <button className={notificationsData?.library_liked_updates ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={() => handleNotificationsToggle('library_liked_updates')}></button>
          </li>
        </ul>
      </div>
      <div className='notifications-views'>Social Updates</div>
      <div className='notifications-menu'>
        <ul>
          <li className='notifications-li'>
            <label className='notifications-label'>New Reviews</label>
            <button className={notificationsData?.show_review_updates ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={() => handleNotificationsToggle('show_review_updates')}></button>
          </li>
          <li className='notifications-li'>
            <label className='notifications-label'>New Followers</label>
            <button className={notificationsData?.show_follower_updates ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={() => handleNotificationsToggle('show_follower_updates')}></button>
          </li>
          <li className='notifications-li'>
            <label className='notifications-label'>New Comments</label>
            <button className={notificationsData?.show_comment_updates ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={() => handleNotificationsToggle('show_comment_updates')}></button>
          </li>
          <li className='notifications-li'>
            <label className='notifications-label'>Responses to my comments</label>
            <button className={notificationsData?.show_response_updates ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={() => handleNotificationsToggle('show_response_updates')}></button>
          </li>
        </ul>
      </div>
      <div className="change-buttons_not">
        <button className='save-button' onClick={handleSaveChanges}>Save</button>
        <button className='discard-button' onClick={handleDiscardChanges}>Discard</button>
      </div>
    </div>
  );
}
// if (!book) {
//   return     <div class="load_container">
// <svg xmlns="http://www.w3.org/2000/svg" fill='#858585' width="100" height="100" viewBox="0 0 100 100" class="svg" style={{marginRight: spacing + 'em'}}>
//   <defs>
//       <mask id="mask" x="0" y="0" width="100%" height="100%">
//           <rect x="0" y="0" width="100%" height="100%" fill="#fff">
//               <animate attributeName="y" from="100%" to="0%" dur="2s" fill="freeze" />
//           </rect>
//       </mask>
//   </defs>
//   <g clip-path="url(#clip0_309_961)" fill="white" mask="url(#mask)">
//       <path d="M35.9632 5.50044C35.9074 5.69934 35.8329 5.82518 35.9558 5.56133C35.9856 5.50044 36.1121 5.32589 36.1121 5.27312C36.1121 5.36648 35.7883 5.65469 36.0116 5.44361C36.0861 5.3746 36.3728 5.08233 36.0489 5.38678C35.6505 5.76023 36.1196 5.3543 36.1159 5.36242C36.0973 5.41925 35.5165 5.67498 35.8515 5.52885C35.967 5.47608 36.3541 5.31371 35.859 5.5045C35.3638 5.69528 35.7064 5.56539 35.818 5.53291C36.3392 5.38272 35.5277 5.57351 35.5277 5.58162C35.5351 5.55321 35.8143 5.55321 35.8404 5.54915C36.1308 5.50856 35.2187 5.52073 35.5016 5.54915C35.5947 5.55727 35.6915 5.55727 35.7883 5.56539C35.8851 5.5735 35.9744 5.5938 36.0675 5.60192C36.3281 5.61816 35.5388 5.45579 35.7845 5.54915C35.9558 5.6141 36.1419 5.65469 36.3169 5.71964C36.3914 5.74805 36.652 5.86577 36.3169 5.71152C35.967 5.55321 36.2834 5.7034 36.3616 5.74399C36.5105 5.82518 36.652 5.91854 36.7934 6.01596C36.9349 6.11339 37.0652 6.22704 37.203 6.33664C37.5082 6.58426 36.9796 6.08903 37.1285 6.26764C37.1918 6.34476 37.27 6.40971 37.3333 6.48278C37.8619 7.05513 38.2863 7.72897 38.6325 8.44746L38.4203 8.00095C38.9751 9.19031 39.2915 10.4812 39.3511 11.8167L39.3325 11.3174C39.3548 12.0521 39.2915 12.7746 39.1538 13.4972C39.0756 13.9153 38.9788 14.3293 38.8708 14.7393C38.815 14.9504 38.7554 15.1574 38.6921 15.3645C38.6623 15.47 38.6288 15.5715 38.5953 15.677C38.4799 16.0545 38.6661 15.4822 38.5842 15.7217C37.9922 17.4063 37.2811 19.03 36.5366 20.6415C35.9148 21.9892 35.2857 23.3328 34.7682 24.7332C34.1651 26.3772 33.6178 28.0497 33.1189 29.7383C31.1346 36.4564 29.7795 43.5642 29.6306 50.6354C29.5673 53.6149 29.3328 58.0882 32.3781 59.5008C34.7942 60.6212 37.5827 59.2004 39.124 57.1018C39.6601 56.3711 40.1217 55.5958 40.5424 54.7799C41.5736 52.7665 42.4374 50.6516 43.2973 48.5489C44.3025 46.0931 45.2705 43.621 46.2757 41.1611C47.1319 39.0665 47.9919 36.9557 49.0157 34.9504C49.2093 34.5729 49.4066 34.1994 49.6188 33.8382C49.7007 33.6961 49.7901 33.5581 49.8757 33.4201C50.0916 33.075 49.805 33.5987 49.7082 33.6555C49.7603 33.6271 49.8124 33.5094 49.8534 33.4566C50.0842 33.144 50.3299 32.8436 50.5905 32.5595C50.7059 32.4296 50.8474 32.3119 50.9591 32.1779C50.6091 32.6123 50.6612 32.4377 50.8139 32.32C50.8288 32.3078 51.1527 32.048 51.1601 32.0602C51.1638 32.0643 50.5347 32.4255 50.9218 32.2185C51.108 32.117 51.3909 32.0886 50.5979 32.3362C50.7022 32.3038 50.9553 32.251 50.49 32.3484C49.7715 32.4945 50.8325 32.3728 50.181 32.389C49.5295 32.4052 50.6352 32.5108 49.8348 32.3565C49.3396 32.2632 49.5071 32.2835 49.6077 32.3159C49.8534 32.3971 48.9934 31.9953 49.2614 32.1536C49.4662 32.2794 49.2428 32.3281 49.0194 31.9141C49.0418 31.9547 49.0902 31.9831 49.1162 32.0237C49.1758 32.117 49.2354 32.2023 49.2838 32.2997L49.0716 31.8532C49.4327 32.6204 49.4774 33.5581 49.5146 34.4024L49.496 33.9031C49.6188 37.049 49.2279 40.195 49.1609 43.3409C49.1348 44.6277 49.0641 46.0484 49.4066 47.2946C50.0954 49.7951 52.8168 49.6206 54.6373 48.7478C56.1004 48.0497 57.3215 46.7669 58.4458 45.5573C59.5701 44.3476 60.5455 43.1948 61.5544 41.9729C64.2982 38.6403 66.8819 35.1493 69.3055 31.5366C71.5057 28.2567 73.6836 24.8063 75.1318 21.0434C75.3254 20.54 75.4967 20.0285 75.6642 19.5171C75.8318 19.0056 75.3887 18.4536 75.0537 18.2262C74.5622 17.8893 73.799 17.8041 73.2406 17.8812C71.9413 18.0557 70.6867 18.6971 70.2288 20.0935C70.4745 19.3466 70.1878 20.195 70.1171 20.3858C70.0203 20.6496 69.9161 20.9094 69.8118 21.1651C69.5922 21.701 69.3539 22.2287 69.1045 22.7523C68.5609 23.893 67.9653 25.0011 67.3435 26.089C66.6511 27.2946 65.9251 28.4759 65.1731 29.6409C64.7859 30.2417 64.3913 30.8384 63.9892 31.431C63.8924 31.5772 63.7919 31.7192 63.6951 31.8654C63.643 31.9425 63.3377 32.3849 63.5648 32.0561C63.7919 31.7273 63.4419 32.2348 63.3973 32.2997C63.2856 32.4621 63.1739 32.6204 63.0585 32.7828C60.2626 36.7527 57.288 40.6456 54.0156 44.1649C53.7326 44.4694 53.4422 44.7738 53.1481 45.0661C53.029 45.1838 52.9099 45.2975 52.7907 45.4152C52.4668 45.7278 53.3008 44.9606 53.07 45.1595C53.0141 45.2082 52.962 45.2569 52.9061 45.3056C52.787 45.4071 52.6642 45.5086 52.5413 45.606C52.4594 45.6709 52.37 45.7278 52.2881 45.7968C52.0499 45.9957 52.8503 45.5694 52.4259 45.7156C52.4557 45.7075 53.1444 45.5086 52.7051 45.606C53.0513 45.5289 53.23 45.5004 53.539 45.4964C54.0826 45.4923 53.9262 45.4964 53.8071 45.4923C53.5763 45.4761 54.5628 45.6709 54.3208 45.5938C54.0379 45.5004 54.9165 45.9429 54.6745 45.7562C54.4958 45.6222 54.991 46.1621 54.924 45.9916C54.8867 45.8982 54.7862 45.8049 54.7378 45.7075L54.95 46.154C54.641 45.4923 54.6112 44.6764 54.5814 43.9457L54.6001 44.445C54.4847 41.3072 54.8867 38.1694 54.9426 35.0356C54.9649 33.6677 55.017 32.1779 54.6634 30.8465C54.5331 30.3472 54.3208 29.8114 53.9746 29.4501C52.8652 28.2892 51.1117 28.3703 49.7231 28.7884C45.7209 29.99 43.8297 34.4633 42.2289 38.2141C40.6131 41.9973 39.1575 45.8577 37.5678 49.6531C36.9014 51.2402 36.2238 52.8315 35.442 54.3577C35.1628 54.9057 34.8575 55.4253 34.5336 55.9409C34.8017 55.5106 34.8426 55.5106 34.6267 55.7947C34.422 56.0667 34.1986 56.3103 33.9789 56.566C33.7965 56.773 34.1874 56.3711 34.1762 56.3833C34.1018 56.4442 33.871 56.5863 34.2321 56.363C34.422 56.2453 34.6304 56.1519 34.8426 56.0911C34.7682 56.1114 35.5425 55.9815 35.2708 56.0058C34.999 56.0302 35.7734 56.0058 35.6952 56.0058C35.6058 56.0058 35.3899 55.9571 35.8031 56.0342C36.2164 56.1114 36.0116 56.0748 35.9186 56.0423C35.9632 56.0586 36.3839 56.3184 36.1605 56.1479C36.101 56.1032 35.7548 55.8313 36.0228 56.0667C36.276 56.2859 36.0079 56.0261 35.9521 55.9571C35.7957 55.7541 35.6654 55.5309 35.5463 55.2995L35.7585 55.746C35.2596 54.6987 35.1181 53.5703 35.066 52.4052L35.0846 52.9045C34.9171 48.7154 35.3341 44.5019 36.0005 40.3776C36.6929 36.0992 37.6832 31.8694 38.9788 27.7614C39.057 27.5179 39.1351 27.2784 39.2133 27.0348C39.3287 26.6817 39.2059 27.0511 39.1873 27.112C39.2319 26.9699 39.2803 26.8278 39.3287 26.6898C39.4851 26.2311 39.6452 25.7724 39.8127 25.3137C40.118 24.4775 40.453 23.6616 40.8179 22.8538C41.6667 20.9744 42.5714 19.1193 43.3085 17.183C44.0456 15.2467 44.8051 13.0507 44.7604 10.883C44.7195 8.87369 44.2318 7.0186 43.2341 5.31371C42.0688 3.32467 40.2036 2.09065 38.0816 1.74968C35.1554 1.2788 31.4474 2.80509 30.5166 6.08903C30.3752 6.59238 30.7735 7.14038 31.1272 7.37988C31.6186 7.7168 32.3818 7.80204 32.9402 7.72492C34.1911 7.55849 35.5537 6.91712 35.9521 5.51261L35.9632 5.50044Z" />
// <path d="M37.5193 12.1638C39.3716 8.28416 39.0325 4.09428 36.7619 2.80548C34.4913 1.51668 31.149 3.61701 29.2967 7.49669C27.4444 11.3764 27.7836 15.5663 30.0542 16.8551C32.3248 18.1439 35.667 16.0435 37.5193 12.1638Z"  stroke="none" stroke-miterlimit="10"/>
// <path d="M76.0353 36.3825C75.7599 35.2296 77.141 32.8387 78.5669 31.6859C80.1343 30.4194 82.234 31.0486 82.878 32.4206C83.5221 33.7967 82.6025 35.6234 80.9012 36.6625C79.1923 37.7058 76.4002 37.9047 76.0353 36.3825Z"  stroke="#none" stroke-miterlimit="10"/>
//   </g>
// </svg>
// </div>;
// }



function ReaderMain() {
  const [chapters, setChapters] = useState([]);
  const { book_id } = useParams();
  const token = localStorage.getItem('token');
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [selectedChapterId, setSelectedChapterId] = useState(null); 
  const { padding } = usePadding();
  const { lineHeight } = useLineHeight();
  const { fontFamily } = useFont();
  const { fontSize } = useFontSize();
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });

  const style = {
    paddingLeft: `${padding.left}px`,
    paddingRight: `${padding.right}px`,
    lineHeight: `${lineHeight * 100}%`,
    fontFamily,
    fontSize: `${fontSize}px`,
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const loadChapters = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/book/${book_id}/chapter_side/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.status === 200) {
        setChapters(response.data);
      } else {
        console.log("Failed to fetch chapters");
      }
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };

  useEffect(() => {
    loadChapters();
  }, [book_id, token]);

  const handleChapterSelect = (chapterId) => {
    setSelectedChapterId(chapterId);

    // Найдите выбранную главу в списке глав
    const selectedChapter = chapters.find(chapter => chapter.id === chapterId);
    if (selectedChapter) {
      // Прокрутите к выбранной главе
      document.getElementById(`chapter_${selectedChapter.id}`).scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className={`main ${theme}`}>
      <div className='container'>
        <ReaderSidebar book_id={book_id} onSelectChapter={handleChapterSelect}/>
        <div className='reader'>
          {chapters.map((chapter) => (
            <div key={chapter.id} id={`chapter_${chapter.id}`}> {/* Добавьте id для каждой главы */}
              <div className='title'>{chapter.title}</div>
              <hr className='top-line' />
              <div className='book_container'>
                <div className='book_reader' style={style}>
                  &emsp;{chapter.content}
                </div>
              </div>
            </div>
          ))}
        </div>
        <ButtonMenu changeTheme={changeTheme} />
      </div>
    </main>
  );
}

function ReaderSidebar({ book_id, onSelectChapter }) {
  const [showComponent1, setShowComponent1] = useState(true);
  const token = localStorage.getItem('token')
  const [chapters, setChapters] = useState([]); // Добавьте состояние для глав


  // Загрузите главы при монтировании компонента
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/book/${book_id}/chapter_side/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setChapters(response.data);
        console.log(response.data)
      } catch (error) {
        console.error('Ошибка при загрузке глав:', error);
      }
    };

    if (token) {
      fetchChapters();
    }
  }, [book_id, token]);

  const toggleComponent = () => {
    setShowComponent1(!showComponent1);
  };



  return (
    <div className='sidebar'>
            <div className='sidebar_logo_but'>
      <button className='menu__button' onClick={toggleComponent}>
        <a href='#'>
        <svg className='burger-icon' version="1.0" xmlns="http://www.w3.org/2000/svg"
  width="42" height="42" viewBox="0 0 50.000000 50.000000" 
  preserveAspectRatio="xMidYMid meet">

  <g transform="translate(0.000000,50.000000) scale(0.100000,-0.100000)" 
    stroke="none">
    <path d="M56 444 c-24 -23 -24 -365 0 -388 23 -24 365 -24 388 0 24 23 24 365
      0 388 -23 24 -365 24 -388 0z m379 -194 l0 -185 -185 0 -185 0 -3 175 c-1 96
      0 180 3 187 3 11 44 13 187 11 l183 -3 0 -185z"/>
    <path d="M120 340 c0 -6 50 -10 130 -10 80 0 130 4 130 10 0 6 -50 10 -130 10
      -80 0 -130 -4 -130 -10z"/>
    <path d="M120 250 c0 -6 50 -10 130 -10 80 0 130 4 130 10 0 6 -50 10 -130 10
      -80 0 -130 -4 -130 -10z"/>
    <path d="M120 160 c0 -6 50 -10 130 -10 80 0 130 4 130 10 0 6 -50 10 -130 10
      -80 0 -130 -4 -130 -10z"/>
  </g>
</svg>
        </a> 
      </button>
      <Link to={'/'}><a>  
        <div className='logo-mini'>
        <svg width="227" height="100" viewBox="0 0 227 100" xmlns="http://www.w3.org/2000/svg" >
<g clip-path="url(#clip0_309_961)">
<path d="M35.9632 5.50044C35.9074 5.69934 35.8329 5.82518 35.9558 5.56133C35.9856 5.50044 36.1121 5.32589 36.1121 5.27312C36.1121 5.36648 35.7883 5.65469 36.0116 5.44361C36.0861 5.3746 36.3728 5.08233 36.0489 5.38678C35.6505 5.76023 36.1196 5.3543 36.1159 5.36242C36.0973 5.41925 35.5165 5.67498 35.8515 5.52885C35.967 5.47608 36.3541 5.31371 35.859 5.5045C35.3638 5.69528 35.7064 5.56539 35.818 5.53291C36.3392 5.38272 35.5277 5.57351 35.5277 5.58162C35.5351 5.55321 35.8143 5.55321 35.8404 5.54915C36.1308 5.50856 35.2187 5.52073 35.5016 5.54915C35.5947 5.55727 35.6915 5.55727 35.7883 5.56539C35.8851 5.5735 35.9744 5.5938 36.0675 5.60192C36.3281 5.61816 35.5388 5.45579 35.7845 5.54915C35.9558 5.6141 36.1419 5.65469 36.3169 5.71964C36.3914 5.74805 36.652 5.86577 36.3169 5.71152C35.967 5.55321 36.2834 5.7034 36.3616 5.74399C36.5105 5.82518 36.652 5.91854 36.7934 6.01596C36.9349 6.11339 37.0652 6.22704 37.203 6.33664C37.5082 6.58426 36.9796 6.08903 37.1285 6.26764C37.1918 6.34476 37.27 6.40971 37.3333 6.48278C37.8619 7.05513 38.2863 7.72897 38.6325 8.44746L38.4203 8.00095C38.9751 9.19031 39.2915 10.4812 39.3511 11.8167L39.3325 11.3174C39.3548 12.0521 39.2915 12.7746 39.1538 13.4972C39.0756 13.9153 38.9788 14.3293 38.8708 14.7393C38.815 14.9504 38.7554 15.1574 38.6921 15.3645C38.6623 15.47 38.6288 15.5715 38.5953 15.677C38.4799 16.0545 38.6661 15.4822 38.5842 15.7217C37.9922 17.4063 37.2811 19.03 36.5366 20.6415C35.9148 21.9892 35.2857 23.3328 34.7682 24.7332C34.1651 26.3772 33.6178 28.0497 33.1189 29.7383C31.1346 36.4564 29.7795 43.5642 29.6306 50.6354C29.5673 53.6149 29.3328 58.0882 32.3781 59.5008C34.7942 60.6212 37.5827 59.2004 39.124 57.1018C39.6601 56.3711 40.1217 55.5958 40.5424 54.7799C41.5736 52.7665 42.4374 50.6516 43.2973 48.5489C44.3025 46.0931 45.2705 43.621 46.2757 41.1611C47.1319 39.0665 47.9919 36.9557 49.0157 34.9504C49.2093 34.5729 49.4066 34.1994 49.6188 33.8382C49.7007 33.6961 49.7901 33.5581 49.8757 33.4201C50.0916 33.075 49.805 33.5987 49.7082 33.6555C49.7603 33.6271 49.8124 33.5094 49.8534 33.4566C50.0842 33.144 50.3299 32.8436 50.5905 32.5595C50.7059 32.4296 50.8474 32.3119 50.9591 32.1779C50.6091 32.6123 50.6612 32.4377 50.8139 32.32C50.8288 32.3078 51.1527 32.048 51.1601 32.0602C51.1638 32.0643 50.5347 32.4255 50.9218 32.2185C51.108 32.117 51.3909 32.0886 50.5979 32.3362C50.7022 32.3038 50.9553 32.251 50.49 32.3484C49.7715 32.4945 50.8325 32.3728 50.181 32.389C49.5295 32.4052 50.6352 32.5108 49.8348 32.3565C49.3396 32.2632 49.5071 32.2835 49.6077 32.3159C49.8534 32.3971 48.9934 31.9953 49.2614 32.1536C49.4662 32.2794 49.2428 32.3281 49.0194 31.9141C49.0418 31.9547 49.0902 31.9831 49.1162 32.0237C49.1758 32.117 49.2354 32.2023 49.2838 32.2997L49.0716 31.8532C49.4327 32.6204 49.4774 33.5581 49.5146 34.4024L49.496 33.9031C49.6188 37.049 49.2279 40.195 49.1609 43.3409C49.1348 44.6277 49.0641 46.0484 49.4066 47.2946C50.0954 49.7951 52.8168 49.6206 54.6373 48.7478C56.1004 48.0497 57.3215 46.7669 58.4458 45.5573C59.5701 44.3476 60.5455 43.1948 61.5544 41.9729C64.2982 38.6403 66.8819 35.1493 69.3055 31.5366C71.5057 28.2567 73.6836 24.8063 75.1318 21.0434C75.3254 20.54 75.4967 20.0285 75.6642 19.5171C75.8318 19.0056 75.3887 18.4536 75.0537 18.2262C74.5622 17.8893 73.799 17.8041 73.2406 17.8812C71.9413 18.0557 70.6867 18.6971 70.2288 20.0935C70.4745 19.3466 70.1878 20.195 70.1171 20.3858C70.0203 20.6496 69.9161 20.9094 69.8118 21.1651C69.5922 21.701 69.3539 22.2287 69.1045 22.7523C68.5609 23.893 67.9653 25.0011 67.3435 26.089C66.6511 27.2946 65.9251 28.4759 65.1731 29.6409C64.7859 30.2417 64.3913 30.8384 63.9892 31.431C63.8924 31.5772 63.7919 31.7192 63.6951 31.8654C63.643 31.9425 63.3377 32.3849 63.5648 32.0561C63.7919 31.7273 63.4419 32.2348 63.3973 32.2997C63.2856 32.4621 63.1739 32.6204 63.0585 32.7828C60.2626 36.7527 57.288 40.6456 54.0156 44.1649C53.7326 44.4694 53.4422 44.7738 53.1481 45.0661C53.029 45.1838 52.9099 45.2975 52.7907 45.4152C52.4668 45.7278 53.3008 44.9606 53.07 45.1595C53.0141 45.2082 52.962 45.2569 52.9061 45.3056C52.787 45.4071 52.6642 45.5086 52.5413 45.606C52.4594 45.6709 52.37 45.7278 52.2881 45.7968C52.0499 45.9957 52.8503 45.5694 52.4259 45.7156C52.4557 45.7075 53.1444 45.5086 52.7051 45.606C53.0513 45.5289 53.23 45.5004 53.539 45.4964C54.0826 45.4923 53.9262 45.4964 53.8071 45.4923C53.5763 45.4761 54.5628 45.6709 54.3208 45.5938C54.0379 45.5004 54.9165 45.9429 54.6745 45.7562C54.4958 45.6222 54.991 46.1621 54.924 45.9916C54.8867 45.8982 54.7862 45.8049 54.7378 45.7075L54.95 46.154C54.641 45.4923 54.6112 44.6764 54.5814 43.9457L54.6001 44.445C54.4847 41.3072 54.8867 38.1694 54.9426 35.0356C54.9649 33.6677 55.017 32.1779 54.6634 30.8465C54.5331 30.3472 54.3208 29.8114 53.9746 29.4501C52.8652 28.2892 51.1117 28.3703 49.7231 28.7884C45.7209 29.99 43.8297 34.4633 42.2289 38.2141C40.6131 41.9973 39.1575 45.8577 37.5678 49.6531C36.9014 51.2402 36.2238 52.8315 35.442 54.3577C35.1628 54.9057 34.8575 55.4253 34.5336 55.9409C34.8017 55.5106 34.8426 55.5106 34.6267 55.7947C34.422 56.0667 34.1986 56.3103 33.9789 56.566C33.7965 56.773 34.1874 56.3711 34.1762 56.3833C34.1018 56.4442 33.871 56.5863 34.2321 56.363C34.422 56.2453 34.6304 56.1519 34.8426 56.0911C34.7682 56.1114 35.5425 55.9815 35.2708 56.0058C34.999 56.0302 35.7734 56.0058 35.6952 56.0058C35.6058 56.0058 35.3899 55.9571 35.8031 56.0342C36.2164 56.1114 36.0116 56.0748 35.9186 56.0423C35.9632 56.0586 36.3839 56.3184 36.1605 56.1479C36.101 56.1032 35.7548 55.8313 36.0228 56.0667C36.276 56.2859 36.0079 56.0261 35.9521 55.9571C35.7957 55.7541 35.6654 55.5309 35.5463 55.2995L35.7585 55.746C35.2596 54.6987 35.1181 53.5703 35.066 52.4052L35.0846 52.9045C34.9171 48.7154 35.3341 44.5019 36.0005 40.3776C36.6929 36.0992 37.6832 31.8694 38.9788 27.7614C39.057 27.5179 39.1351 27.2784 39.2133 27.0348C39.3287 26.6817 39.2059 27.0511 39.1873 27.112C39.2319 26.9699 39.2803 26.8278 39.3287 26.6898C39.4851 26.2311 39.6452 25.7724 39.8127 25.3137C40.118 24.4775 40.453 23.6616 40.8179 22.8538C41.6667 20.9744 42.5714 19.1193 43.3085 17.183C44.0456 15.2467 44.8051 13.0507 44.7604 10.883C44.7195 8.87369 44.2318 7.0186 43.2341 5.31371C42.0688 3.32467 40.2036 2.09065 38.0816 1.74968C35.1554 1.2788 31.4474 2.80509 30.5166 6.08903C30.3752 6.59238 30.7735 7.14038 31.1272 7.37988C31.6186 7.7168 32.3818 7.80204 32.9402 7.72492C34.1911 7.55849 35.5537 6.91712 35.9521 5.51261L35.9632 5.50044Z" />
<path d="M37.5193 12.1638C39.3716 8.28416 39.0325 4.09428 36.7619 2.80548C34.4913 1.51668 31.149 3.61701 29.2967 7.49669C27.4444 11.3764 27.7836 15.5663 30.0542 16.8551C32.3248 18.1439 35.667 16.0435 37.5193 12.1638Z"  stroke="none" stroke-miterlimit="10"/>
<path d="M76.0353 36.3825C75.7599 35.2296 77.141 32.8387 78.5669 31.6859C80.1343 30.4194 82.234 31.0486 82.878 32.4206C83.5221 33.7967 82.6025 35.6234 80.9012 36.6625C79.1923 37.7058 76.4002 37.9047 76.0353 36.3825Z"  stroke="#none" stroke-miterlimit="10"/>
</g>
</svg> 
        </div>
      </a></Link></div>
      <div className={`reader__sidebar-menu ${showComponent1 ? 'show' : 'hide'}`}>
        {/* Передаем функцию handleChapterSelect в SidebarMenu */}
        {showComponent1 ? <SidebarMenu onSelectChapter={onSelectChapter} chapters={chapters} /> : <SidebarMenu2 />}  
      </div> 
    </div>
  );
};

<svg width="227" height="100" viewBox="0 0 227 100" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_309_961)">
<path d="M35.9632 5.50044C35.9074 5.69934 35.8329 5.82518 35.9558 5.56133C35.9856 5.50044 36.1121 5.32589 36.1121 5.27312C36.1121 5.36648 35.7883 5.65469 36.0116 5.44361C36.0861 5.3746 36.3728 5.08233 36.0489 5.38678C35.6505 5.76023 36.1196 5.3543 36.1159 5.36242C36.0973 5.41925 35.5165 5.67498 35.8515 5.52885C35.967 5.47608 36.3541 5.31371 35.859 5.5045C35.3638 5.69528 35.7064 5.56539 35.818 5.53291C36.3392 5.38272 35.5277 5.57351 35.5277 5.58162C35.5351 5.55321 35.8143 5.55321 35.8404 5.54915C36.1308 5.50856 35.2187 5.52073 35.5016 5.54915C35.5947 5.55727 35.6915 5.55727 35.7883 5.56539C35.8851 5.5735 35.9744 5.5938 36.0675 5.60192C36.3281 5.61816 35.5388 5.45579 35.7845 5.54915C35.9558 5.6141 36.1419 5.65469 36.3169 5.71964C36.3914 5.74805 36.652 5.86577 36.3169 5.71152C35.967 5.55321 36.2834 5.7034 36.3616 5.74399C36.5105 5.82518 36.652 5.91854 36.7934 6.01596C36.9349 6.11339 37.0652 6.22704 37.203 6.33664C37.5082 6.58426 36.9796 6.08903 37.1285 6.26764C37.1918 6.34476 37.27 6.40971 37.3333 6.48278C37.8619 7.05513 38.2863 7.72897 38.6325 8.44746L38.4203 8.00095C38.9751 9.19031 39.2915 10.4812 39.3511 11.8167L39.3325 11.3174C39.3548 12.0521 39.2915 12.7746 39.1538 13.4972C39.0756 13.9153 38.9788 14.3293 38.8708 14.7393C38.815 14.9504 38.7554 15.1574 38.6921 15.3645C38.6623 15.47 38.6288 15.5715 38.5953 15.677C38.4799 16.0545 38.6661 15.4822 38.5842 15.7217C37.9922 17.4063 37.2811 19.03 36.5366 20.6415C35.9148 21.9892 35.2857 23.3328 34.7682 24.7332C34.1651 26.3772 33.6178 28.0497 33.1189 29.7383C31.1346 36.4564 29.7795 43.5642 29.6306 50.6354C29.5673 53.6149 29.3328 58.0882 32.3781 59.5008C34.7942 60.6212 37.5827 59.2004 39.124 57.1018C39.6601 56.3711 40.1217 55.5958 40.5424 54.7799C41.5736 52.7665 42.4374 50.6516 43.2973 48.5489C44.3025 46.0931 45.2705 43.621 46.2757 41.1611C47.1319 39.0665 47.9919 36.9557 49.0157 34.9504C49.2093 34.5729 49.4066 34.1994 49.6188 33.8382C49.7007 33.6961 49.7901 33.5581 49.8757 33.4201C50.0916 33.075 49.805 33.5987 49.7082 33.6555C49.7603 33.6271 49.8124 33.5094 49.8534 33.4566C50.0842 33.144 50.3299 32.8436 50.5905 32.5595C50.7059 32.4296 50.8474 32.3119 50.9591 32.1779C50.6091 32.6123 50.6612 32.4377 50.8139 32.32C50.8288 32.3078 51.1527 32.048 51.1601 32.0602C51.1638 32.0643 50.5347 32.4255 50.9218 32.2185C51.108 32.117 51.3909 32.0886 50.5979 32.3362C50.7022 32.3038 50.9553 32.251 50.49 32.3484C49.7715 32.4945 50.8325 32.3728 50.181 32.389C49.5295 32.4052 50.6352 32.5108 49.8348 32.3565C49.3396 32.2632 49.5071 32.2835 49.6077 32.3159C49.8534 32.3971 48.9934 31.9953 49.2614 32.1536C49.4662 32.2794 49.2428 32.3281 49.0194 31.9141C49.0418 31.9547 49.0902 31.9831 49.1162 32.0237C49.1758 32.117 49.2354 32.2023 49.2838 32.2997L49.0716 31.8532C49.4327 32.6204 49.4774 33.5581 49.5146 34.4024L49.496 33.9031C49.6188 37.049 49.2279 40.195 49.1609 43.3409C49.1348 44.6277 49.0641 46.0484 49.4066 47.2946C50.0954 49.7951 52.8168 49.6206 54.6373 48.7478C56.1004 48.0497 57.3215 46.7669 58.4458 45.5573C59.5701 44.3476 60.5455 43.1948 61.5544 41.9729C64.2982 38.6403 66.8819 35.1493 69.3055 31.5366C71.5057 28.2567 73.6836 24.8063 75.1318 21.0434C75.3254 20.54 75.4967 20.0285 75.6642 19.5171C75.8318 19.0056 75.3887 18.4536 75.0537 18.2262C74.5622 17.8893 73.799 17.8041 73.2406 17.8812C71.9413 18.0557 70.6867 18.6971 70.2288 20.0935C70.4745 19.3466 70.1878 20.195 70.1171 20.3858C70.0203 20.6496 69.9161 20.9094 69.8118 21.1651C69.5922 21.701 69.3539 22.2287 69.1045 22.7523C68.5609 23.893 67.9653 25.0011 67.3435 26.089C66.6511 27.2946 65.9251 28.4759 65.1731 29.6409C64.7859 30.2417 64.3913 30.8384 63.9892 31.431C63.8924 31.5772 63.7919 31.7192 63.6951 31.8654C63.643 31.9425 63.3377 32.3849 63.5648 32.0561C63.7919 31.7273 63.4419 32.2348 63.3973 32.2997C63.2856 32.4621 63.1739 32.6204 63.0585 32.7828C60.2626 36.7527 57.288 40.6456 54.0156 44.1649C53.7326 44.4694 53.4422 44.7738 53.1481 45.0661C53.029 45.1838 52.9099 45.2975 52.7907 45.4152C52.4668 45.7278 53.3008 44.9606 53.07 45.1595C53.0141 45.2082 52.962 45.2569 52.9061 45.3056C52.787 45.4071 52.6642 45.5086 52.5413 45.606C52.4594 45.6709 52.37 45.7278 52.2881 45.7968C52.0499 45.9957 52.8503 45.5694 52.4259 45.7156C52.4557 45.7075 53.1444 45.5086 52.7051 45.606C53.0513 45.5289 53.23 45.5004 53.539 45.4964C54.0826 45.4923 53.9262 45.4964 53.8071 45.4923C53.5763 45.4761 54.5628 45.6709 54.3208 45.5938C54.0379 45.5004 54.9165 45.9429 54.6745 45.7562C54.4958 45.6222 54.991 46.1621 54.924 45.9916C54.8867 45.8982 54.7862 45.8049 54.7378 45.7075L54.95 46.154C54.641 45.4923 54.6112 44.6764 54.5814 43.9457L54.6001 44.445C54.4847 41.3072 54.8867 38.1694 54.9426 35.0356C54.9649 33.6677 55.017 32.1779 54.6634 30.8465C54.5331 30.3472 54.3208 29.8114 53.9746 29.4501C52.8652 28.2892 51.1117 28.3703 49.7231 28.7884C45.7209 29.99 43.8297 34.4633 42.2289 38.2141C40.6131 41.9973 39.1575 45.8577 37.5678 49.6531C36.9014 51.2402 36.2238 52.8315 35.442 54.3577C35.1628 54.9057 34.8575 55.4253 34.5336 55.9409C34.8017 55.5106 34.8426 55.5106 34.6267 55.7947C34.422 56.0667 34.1986 56.3103 33.9789 56.566C33.7965 56.773 34.1874 56.3711 34.1762 56.3833C34.1018 56.4442 33.871 56.5863 34.2321 56.363C34.422 56.2453 34.6304 56.1519 34.8426 56.0911C34.7682 56.1114 35.5425 55.9815 35.2708 56.0058C34.999 56.0302 35.7734 56.0058 35.6952 56.0058C35.6058 56.0058 35.3899 55.9571 35.8031 56.0342C36.2164 56.1114 36.0116 56.0748 35.9186 56.0423C35.9632 56.0586 36.3839 56.3184 36.1605 56.1479C36.101 56.1032 35.7548 55.8313 36.0228 56.0667C36.276 56.2859 36.0079 56.0261 35.9521 55.9571C35.7957 55.7541 35.6654 55.5309 35.5463 55.2995L35.7585 55.746C35.2596 54.6987 35.1181 53.5703 35.066 52.4052L35.0846 52.9045C34.9171 48.7154 35.3341 44.5019 36.0005 40.3776C36.6929 36.0992 37.6832 31.8694 38.9788 27.7614C39.057 27.5179 39.1351 27.2784 39.2133 27.0348C39.3287 26.6817 39.2059 27.0511 39.1873 27.112C39.2319 26.9699 39.2803 26.8278 39.3287 26.6898C39.4851 26.2311 39.6452 25.7724 39.8127 25.3137C40.118 24.4775 40.453 23.6616 40.8179 22.8538C41.6667 20.9744 42.5714 19.1193 43.3085 17.183C44.0456 15.2467 44.8051 13.0507 44.7604 10.883C44.7195 8.87369 44.2318 7.0186 43.2341 5.31371C42.0688 3.32467 40.2036 2.09065 38.0816 1.74968C35.1554 1.2788 31.4474 2.80509 30.5166 6.08903C30.3752 6.59238 30.7735 7.14038 31.1272 7.37988C31.6186 7.7168 32.3818 7.80204 32.9402 7.72492C34.1911 7.55849 35.5537 6.91712 35.9521 5.51261L35.9632 5.50044Z" />
<path d="M37.5193 12.1638C39.3716 8.28416 39.0325 4.09428 36.7619 2.80548C34.4913 1.51668 31.149 3.61701 29.2967 7.49669C27.4444 11.3764 27.7836 15.5663 30.0542 16.8551C32.3248 18.1439 35.667 16.0435 37.5193 12.1638Z"  stroke="none" stroke-miterlimit="10"/>
<path d="M76.0353 36.3825C75.7599 35.2296 77.141 32.8387 78.5669 31.6859C80.1343 30.4194 82.234 31.0486 82.878 32.4206C83.5221 33.7967 82.6025 35.6234 80.9012 36.6625C79.1923 37.7058 76.4002 37.9047 76.0353 36.3825Z"  stroke="#none" stroke-miterlimit="10"/>
</g>
</svg> 

function SidebarMenu({ onSelectChapter, chapters }) {
  const [selectedChapterId, setSelectedChapterId] = useState(null);

  const handleChapterClick = (chapterId) => {
    setSelectedChapterId(chapterId);
    onSelectChapter(chapterId);
  };

  return (
    <ul className='reader__sidebar-menu'>
      <li className='chapter-menu'>
        <ul className='chapter-list'>
          {chapters.map(chapter => (
            <li key={chapter.id}>
              <button 
                className={`chapters_reader_list_buttons ${selectedChapterId === chapter.id ? 'active' : ''}`} 
                onClick={() => handleChapterClick(chapter.id)}>
                {chapter.title}
              </button>
            </li>
          ))}
        </ul>
      </li>
    </ul>
  );
}
function SidebarMenu2() {
  const location = useLocation();

  useEffect(() => {
    const navigation = document.getElementById('navigation');
    if (location.hash && navigation) {
      navigation.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location]);
  return(
    <div className='reader__sidebar-menu-2'>
    <ul className='reader__sidebar-menu-2'>
    <Link to={'/'}><li className='pool'><button className='pool-button'>
        <div className='sidebar-svg'></div>Home</button></li></Link>
        <Link to="/profile#navigation"><li className='pool'><button className='pool-button'>
          <div className='sidebar-svg'>
</div>
          Library</button></li></Link>
        <Link to={'/history'}><li className='pool'><button className='pool-button'>History</button></li></Link>
        <hr className='reader__sidebar_hr'></hr>
        <div className='book_button'><button className='pool-button'>Books</button></div>
        <hr className='reader__sidebar_hr'></hr>
        <div className='book_button'><button className='pool-button'>Settings</button></div>
        <div className='book_button'><button className='pool-button'>Help</button></div>
    </ul>
  </div>
  )
}

function ButtonMenu ({ changeTheme }) {
  return (
    <div className='button-reader'>
      <ul className='reader__button-menu'>
        <li><button className='reader_icon'><svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 width="42" height="42" viewBox="0 0 80.000000 80.000000" 
 preserveAspectRatio="xMidYMid meet">

<g transform="translate(0.000000,80.000000) scale(0.100000,-0.100000)"
 stroke="none">
<path d="M90 636 c0 -18 -6 -25 -22 -28 l-23 -3 0 -235 0 -235 145 -3 c114 -2
152 -6 178 -19 30 -17 34 -17 65 0 25 13 63 17 177 19 l145 3 0 235 0 235 -22
3 c-17 3 -23 10 -23 28 l0 24 -143 0 c-98 0 -147 -4 -155 -12 -9 -9 -15 -9
-24 0 -8 8 -57 12 -155 12 l-143 0 0 -24z m300 -13 c10 -17 10 -17 20 0 10 15
28 17 145 17 l135 0 0 -220 0 -220 -133 0 c-90 0 -137 -4 -145 -12 -9 -9 -15
-9 -24 0 -8 8 -55 12 -145 12 l-133 0 0 220 0 220 135 0 c117 0 135 -2 145
-17z m-300 -238 l0 -205 145 0 c126 0 145 -2 155 -17 10 -17 10 -17 20 0 10
15 29 17 155 17 l145 0 0 205 c0 176 2 205 15 205 13 0 15 -31 15 -220 l0
-220 -149 0 c-120 0 -151 -3 -161 -15 -16 -19 -44 -19 -60 0 -10 12 -41 15
-161 15 l-149 0 0 220 c0 189 2 220 15 220 13 0 15 -29 15 -205z"/>
<path d="M390 580 c0 -5 5 -10 10 -10 6 0 10 5 10 10 0 6 -4 10 -10 10 -5 0
-10 -4 -10 -10z"/>
<path d="M160 540 c0 -6 35 -10 85 -10 50 0 85 4 85 10 0 6 -35 10 -85 10 -50
0 -85 -4 -85 -10z"/>
<path d="M390 540 c0 -5 5 -10 10 -10 6 0 10 5 10 10 0 6 -4 10 -10 10 -5 0
-10 -4 -10 -10z"/>
<path d="M470 540 c0 -6 35 -10 85 -10 50 0 85 4 85 10 0 6 -35 10 -85 10 -50
0 -85 -4 -85 -10z"/>
<path d="M390 500 c0 -5 5 -10 10 -10 6 0 10 5 10 10 0 6 -4 10 -10 10 -5 0
-10 -4 -10 -10z"/>
<path d="M160 480 c0 -6 30 -10 70 -10 40 0 70 4 70 10 0 6 -30 10 -70 10 -40
0 -70 -4 -70 -10z"/>
<path d="M470 480 c0 -6 30 -10 70 -10 40 0 70 4 70 10 0 6 -30 10 -70 10 -40
0 -70 -4 -70 -10z"/>
<path d="M390 460 c0 -5 5 -10 10 -10 6 0 10 5 10 10 0 6 -4 10 -10 10 -5 0
-10 -4 -10 -10z"/>
<path d="M160 420 c0 -6 35 -10 85 -10 50 0 85 4 85 10 0 6 -35 10 -85 10 -50
0 -85 -4 -85 -10z"/>
<path d="M390 420 c0 -5 5 -10 10 -10 6 0 10 5 10 10 0 6 -4 10 -10 10 -5 0
-10 -4 -10 -10z"/>
<path d="M470 420 c0 -6 35 -10 85 -10 50 0 85 4 85 10 0 6 -35 10 -85 10 -50
0 -85 -4 -85 -10z"/>
<path d="M390 380 c0 -5 5 -10 10 -10 6 0 10 5 10 10 0 6 -4 10 -10 10 -5 0
-10 -4 -10 -10z"/>
<path d="M160 360 c0 -6 30 -10 70 -10 40 0 70 4 70 10 0 6 -30 10 -70 10 -40
0 -70 -4 -70 -10z"/>
<path d="M470 360 c0 -6 30 -10 70 -10 40 0 70 4 70 10 0 6 -30 10 -70 10 -40
0 -70 -4 -70 -10z"/>
<path d="M390 340 c0 -5 5 -10 10 -10 6 0 10 5 10 10 0 6 -4 10 -10 10 -5 0
-10 -4 -10 -10z"/>
<path d="M160 300 c0 -6 35 -10 85 -10 50 0 85 4 85 10 0 6 -35 10 -85 10 -50
0 -85 -4 -85 -10z"/>
<path d="M390 300 c0 -5 5 -10 10 -10 6 0 10 5 10 10 0 6 -4 10 -10 10 -5 0
-10 -4 -10 -10z"/>
<path d="M470 300 c0 -6 35 -10 85 -10 50 0 85 4 85 10 0 6 -35 10 -85 10 -50
0 -85 -4 -85 -10z"/>
<path d="M390 260 c0 -5 5 -10 10 -10 6 0 10 5 10 10 0 6 -4 10 -10 10 -5 0
-10 -4 -10 -10z"/>
<path d="M390 220 c0 -5 5 -10 10 -10 6 0 10 5 10 10 0 6 -4 10 -10 10 -5 0
-10 -4 -10 -10z"/>
</g>
</svg></button></li>
        <li><button className='reader_icon'><FullscreenComponent/>
</button></li>
        <li><button className='reader_icon'><NavItem><DropdownMenu  changeTheme={changeTheme}/></NavItem></button></li>
      </ul>
    </div>
  )
}

const FullscreenComponent = ({ children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
  };

  const enterFullscreen = () => {
    const element = document.documentElement;
    const requestFullscreen = element.requestFullscreen || 
                              element.mozRequestFullScreen || 
                              element.webkitRequestFullscreen || 
                              element.msRequestFullscreen;

    if (requestFullscreen) {
      requestFullscreen.call(element);
      setIsFullscreen(true);
    }
  };

  const exitFullscreen = () => {
    const exitFullscreen = document.exitFullscreen || 
                           document.mozCancelFullScreen || 
                           document.webkitExitFullscreen || 
                           document.msExitFullscreen;

    if (exitFullscreen) {
      exitFullscreen.call(document);
      setIsFullscreen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && isFullscreen) {
      exitFullscreen();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);


  return (
    <div>
      <button className='reader_icon' onClick={toggleFullscreen}>
        <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
          width="42" height="42" viewBox="0 0 50.000000 50.000000"
          preserveAspectRatio="xMidYMid meet">

          <g transform="translate(0.000000,50.000000) scale(0.100000,-0.100000)"
            stroke="none">
            <path d="M60 375 c0 -37 4 -65 10 -65 6 0 10 25 10 55 l0 55 55 0 c30 0 55 5
            55 10 0 6 -28 10 -65 10 l-65 0 0 -65z"/>
            <path d="M310 430 c0 -5 25 -10 55 -10 l55 0 0 -55 c0 -30 5 -55 10 -55 6 0
            10 28 10 65 l0 65 -65 0 c-37 0 -65 -4 -65 -10z"/>
            <path d="M60 115 l0 -65 65 0 c37 0 65 4 65 10 0 6 -25 10 -55 10 l-55 0 0 55
            c0 30 -4 55 -10 55 -6 0 -10 -28 -10 -65z"/>
            <path d="M420 125 l0 -55 -55 0 c-30 0 -55 -4 -55 -10 0 -6 28 -10 65 -10 l65
            0 0 65 c0 37 -4 65 -10 65 -5 0 -10 -25 -10 -55z"/>
          </g>
        </svg>
      </button>
    </div>
  );
};


function DropdownMenu({ changeTheme }) {

  const [menuHeight, setMenuHeight] = useState(null);
  const dropdownRef = useRef(null)

  useEffect(() => {
    setMenuHeight(dropdownRef.current?.firstChild.offsetHeight)
  }, [])
  

  
  
  return (
    <div className="dropdown" style = {{ height: menuHeight }} ref={dropdownRef}>
        <div className="dropdown-menu">
          <div className='dropdown-button'>
            <ul>
              <li>
                <ul className='drop_but'>
                  <div>
                  <li className='dropdown-icon'>Icon</li>
                  <li className='dropdown-text'>Text Size</li>
                  </div>
                  <li className='slider'><SliderFontSizer/></li>
                </ul>
              </li>
              <li>
                 <ul className='drop_but'>
                  <div>
                  <li className='dropdown-icon'>Icon</li>
                  <li className='dropdown-text'>Text Width</li>
                  </div>
                  <li className='slider'><TextWidthSlider/></li>
                 </ul>
              </li>
              <li>
                 <ul className='drop_but'>
                  <div>
                  <li className='dropdown-icon'>Icon</li>
                  <li className='dropdown-text'>Text Width</li>
                  </div>
                  <li className='slider'><LineHeightSlider/></li>
                 </ul>
              </li>
              <li>
                 <ul className='drop_but'>
                  <div>
                  <li className='dropdown-icon'>Icon</li>
                  <li className='dropdown-text'>Text Width</li>
                  </div>
                  <li className='slider'><FontSlider/></li>
                 </ul>
                 <ul>
                  <li><ThemeButton changeTheme={changeTheme}/></li>
                 </ul>
              </li>
            </ul>
          </div>

  

        </div>
    </div>
  );
};

function NavItem(props) {
  const [open, setOpen] = useState(false);
  const node = useRef();

  useEffect(() => {
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  const handleClick = (e) => {
    if (node.current.contains(e.target)) {
      return;
    }
    setOpen(false);
  };

  return (
    <li className="nav-item" ref={node}>
      <button className="icon-button" onClick={() => setOpen(!open)}>
        <svg className="burger-icon" version="1.0" xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 50.000000 50.000000" preserveAspectRatio="xMidYMid meet">
          <g transform="translate(0.000000,50.000000) scale(0.100000,-0.100000)" stroke="none">
            <path d="M210 456 c0 -24 -26 -60 -39 -54 -62 33 -61 33 -84 10 -21 -21 -21 -23 -4 -51 9 -16 17 -31 17 -34 0 -15 -34 -37 -56 -37 -23 0 -25 -3 -22 -37 3 -32 7 -38 34 -45 40 -10 48 -30 26 -68 -16 -28 -16 -30 5 -52 22 -22 24 -22 52 5 16 9 31 17 34 17 15 0 37 -34 37 -56 0 -23 3 -25 37 -22 32 3 38 7 45 34 10 40 32 49 69 27 28 -17 30 -17 52 5 21 22 21 24 5 52 -22 38 -14 58 26 68 27 7 31 13 34 45 3 34 1 37 -22 37 -22 0 -56 22 -56 37 0 3 8 18 17 34 17 28 17 30 -5 52 -22 21 -24 21 -52 5 -38 -22 -58 -14 -68 26 -7 27 -13 31 -45 34 -34 3 -37 1 -37 -22z m65 -28 c13 -43 55 -60 85 -33 16 14 22 15 35 5 13 -11 13 -15 -2 -41 -22 -38 -6 -74 36 -84 42 -9 41 -38 -1 -50 -43 -13 -60 -55 -33 -85 14 -16 15 -22 5 -35 -11 -13 -15 -13 -41 2 -38 23 -77 6 -85 -37 -9 -41 -40 -41 -49 1 -10 42 -46 58 -84 36 -26 -15 -30 -15 -41 -2 -10 13 -9 19 5 35 27 30 10 72 -33 85 -42 12 -43 41 -1 50 42 10 58 46 36 84 -15 26 -15 30 -2 41 13 10 19 9 35 -5 30 -27 71 -10 84 33 12 42 39 42 51 0z"/>
            <path d="M195 305 c-33 -32 -33 -78 0 -110 32 -33 78 -33 110 0 50 49 15 135 -55 135 -19 0 -40 -9 -55 -25z m95 -15 c11 -11 20 -29 20 -40 0 -26 -34 -60 -60 -60 -26 0 -60 34 -60 60 0 11 9 29 20 40 11 11 29 20 40 20 11 0 29 -9 40 -20z"/>
          </g>
        </svg>
      </button>

      {open && props.children}
    </li>
  );
}





function SliderFontSizer() {
  const { fontSize, setFontSize } = useFontSize(); // Получаем значение размера шрифта и функцию для его обновления из контекста

  const handleFontSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setFontSize(newSize); // Обновляем размер шрифта через контекст
  };

  return (
    <div>
      <input
      className='slider_burger'
        type="range"
        min="12"
        max="48"
        step="1"
        value={fontSize}
        onChange={handleFontSizeChange}
      />
    </div>
  );
}



function TextWidthSlider() {
  const { padding, updatePadding } = usePadding();

  const handlePaddingChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    updatePadding({ left: newSize, right: newSize });
  };

  return (
    <div>
      <input
      className='slider_burger active'
        type="range"
        min="12"
        max="200"
        step="1"
        value={padding.left} 
        onChange={handlePaddingChange}
      />
    </div>
  );
}

const LineHeightSlider = () => {
  const { lineHeight, updateLineHeight } = useLineHeight();

  const handleSliderChange = (event) => {
    const newLineHeight = parseFloat(event.target.value);
    updateLineHeight(newLineHeight);
  };

  return (
    <div>
      <input
      className='slider_burger active'
        type="range"
        min="1"
        max="3"
        step="0.1"
        value={lineHeight}
        onChange={handleSliderChange}
      />
    </div>
  );
};

function FontSlider() {
  const { fontFamily, setFont, fontList } = useFont();

  const handleFontChange = (event) => {
    const { value } = event.target;
    setFont(fontList[value]);
  }


  const selectedIndex = fontList.findIndex((font) => font === fontFamily);

  return (
    <input
    className='slider_burger'
      type="range"
      min="0"
      max={fontList.length - 1}
      value={selectedIndex}
      onChange={handleFontChange}
    />
  );
}




function ThemeButton({ changeTheme }) {
  return (
    <div>
      <button className='white' onClick={() => changeTheme('light')}>
        Light Theme
      </button>
      <button className='black' onClick={() => changeTheme('dark')}>
        Dark Theme
      </button>
      <button className='sepia' onClick={() => changeTheme('sepia')}>
        Sepia Theme
      </button>
    </div>
  );
}

function StudioMain() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [profileData, setProfileData] = useState({
  });
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem('token') || '';
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






  return (
    <div className='main'>
      <div className='container'>
        <StudioSidebar />
        <Outlet />
        <div className='studio_login'>          <div className='header-avatar'>
          <button className='header-avatar-btn' onClick={(e) => { e.preventDefault(); handleMenuOpen(); }}>
            <img className='header_avatar-img' src={profileData.profileimg} />
          </button>
          {menuOpen && (
            <div ref={menuRef} className="menu_stud">
              <Link to='/profile'><button className='menu_button'>Profile</button></Link>
              <button className='menu_button' onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div></div>
      </div>
    </div>
  )
}

function StudioMaker() {
  const [books, setBooks] = useState([]);
  const { book_id, chapter_id } = useParams();
  const [chapterTitle, setChapterTitle] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/book/${book_id}/chapter_side/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setBooks(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке глав:', error);
      }
    };

    if (token) {
      fetchBooks();
    }

  }, [token]);




  return(
    <div className='reader'>
    <div className='title-studio'>
      <div className='bookname-studio'>Studio/Books/{books.length > 0 ? books[0].book_name : ''}</div>
      <div className='chapter-studio'>/{books.title}</div>
    </div>
    <StudioNavigation book_id={book_id}/>

  </div>
  )
}

function StudioBooks() {
  const [books, setBooks] = useState([]);
  const token = localStorage.getItem('token');


  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/studio/books/`, {
          headers: {
            'Authorization': `Bearer ${token}` 
          }
        });
        setBooks(response.data);
      } catch (error) {
        console.error('Ошибка при получении книг:', error);
      }
    };

    fetchBooks();
  }, []);



  const updateVisibility = async (bookId, newVisibility) => {
    try {
      const response = await axios.patch(`${apiUrl}/api/studio/books/${bookId}/`, {
        visibility: newVisibility
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (response.status === 200) {
        // Обновляем состояние книги в локальном состоянии
        setBooks(books.map(book => book.id === bookId ? {...book, visibility: newVisibility} : book));
      }
    } catch (error) {
      console.error('Ошибка при обновлении видимости книги:', error);
    }
  };


  return (

        <div className='studio__books_page'>
          <div className='title-studio'>
            <div className='bookname-studio'>Studio</div>
            <div className='chapter-studio'>/Books</div>
          </div>
          <div className='studio__books_titles'>
              <div className='studio__books_colum'>
                <div className='studio__books_title'>Book Name</div>

              </div>
              <div className='studio__books_colum'>
                <div className='studio__books_title'>Cover</div>

              </div>
              <div className='studio__books_colum_min'>
                <div className='studio__books_title'>Volume</div>

              </div>
              <div className='studio__books_colum'>
                <div className='studio__books_title'>Series</div>

              </div>
              <div className='studio__books_colum'>
                <div className='studio__books_title'>Visibility</div>

              </div>
              <div className='studio__books_colum'>
                <div className='studio__books_title'>Restrictions</div>

              </div>
              <div className='studio__books_colum'>
                <div className='studio__books_title'>Date</div>

              </div>
            </div>
          {books.map((book, index) => (
            <div key={index} className='studio__books_titles'>
              <div className='studio__books_colum'>

                <div className='studio__books_text'>{book.last_chapter_info ? (
  <Link to={`/studio/${book.id}/chapter/${book.last_chapter_info.id}`}>
    {book.name}
  </Link>
) : (
  <Link to={`/studio/${book.id}/chapter/`}>
  {book.name}
</Link>
)}</div>
              </div>
              <div className='studio__books_colum'>

                <img className='studio__books_cover' src={book.coverpage} alt="" />
              </div>
              <div className='studio__books_colum_min'>

                <div className='studio__books_text'>{book.volume_number}</div>
              </div>
              <div className='studio__books_colum'>

                <div className='studio__books_text'><a href="">{book.series_id ? `${book.series_id}` : 'none'}</a></div>
              </div>
              <div className='studio__books_colum'>

                <div className='studio__books_visiblity'>
                <select className='studio__books_visiblity_select' value={book.visibility} onChange={(e) => updateVisibility(book.id, e.target.value)}>
      <option value="public">Public</option>
      <option value="private">Private</option>
      <option value="unlisted">Unlisted</option>
      <option value="followers">Followers</option>
    </select>
                </div>
              </div>
              <div className='studio__books_colum'>

                <div className='studio__books_text'>{book.is_adult ? <div className='adult_18'>18+</div> : 'none'}</div>
              </div>
              <div className='studio__books_colum'>

                <div className='studio__books_date'>{book.last_modified_formatted}<br/>{book.status}</div>
              </div>
            </div>
          ))}
        </div>
  );
}

function StudioSeries() {
  const [menuStates, setMenuStates] = useState([false, false]);

  const toggleMenu = index => {
    setMenuStates(prevStates => {
      const updatedStates = [...prevStates];
      updatedStates[index] = !updatedStates[index];
      return updatedStates;
    });
  };

  const moveTitle = (dragIndex, hoverIndex) => {
  };

  return (
    <DndProvider backend={HTML5Backend}>
          <div className='reader'>
            <div className='title-studio'>
              <div className='bookname-studio'>Studio</div>
              <div className='chapter-studio'>/Series</div>
            </div>
            {menuStates.map((isActive, index) => (
              <div key={index}>
                <button className={`studio__series_name ${isActive ? 'active' : ''}`} onClick={() => toggleMenu(index)}>
                  <div className="series_triangle"></div>Whore and Series<span className="series_number">1</span>
                </button>
                {isActive && (
                  <div className="studio__series_titles">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <StudioSeriesTitle key={i} id={`title_${i}`} index={i} moveTitle={moveTitle} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className='series-dotted-line'></div>
            <div className='studio__series_undefined'>Undefined</div>
            <div className="studio__series_titles">
            {Array.from({ length: 3 }).map((_, i) => (
                      <StudioSeriesTitle key={i} id={`title_${i}`} index={i} moveTitle={moveTitle} />
                    ))}
            </div>
          </div>
    </DndProvider>
  );
}

const StudioSeriesTitle = ({ id, index, moveTitle }) => {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [{ isDragging }, drag] = useDrag({
    type: 'studio__series_title',
    item: { id, index },
    collect: (monitor) => {
      return {
        isDragging: monitor.isDragging(),
        offset: monitor.getSourceClientOffset(),
      };
    },
  });

  useEffect(() => {
    if (isDragging && offset) {
      setOffset(offset);
    }
  }, [isDragging, offset]);

  drag(ref);

  const style = {
    opacity: isDragging ? 0 : 1,
    cursor: 'move',
    left: isDragging ? offset.x : 0,
    top: isDragging ? offset.y : 0,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={ref} className='studio__series_title' style={style}>
      
    </div>
  );
};

function StudioComments() {
  const [comments, setComments] = useState([]);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState({});

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/studio/comments/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setComments(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке комментариев', error);
      }
    };

    fetchComments();
  }, []);

  const toggleReplies = (commentId) => {
    setShowReplies((prevShowReplies) => ({
      ...prevShowReplies,
      [commentId]: !prevShowReplies[commentId],
    }));
  };

  return (
    <div className='studio__comments_page'>
      <div className='title-studio'>
        <div className='bookname-studio'>Studio</div>
        <div className='chapter-studio'>/Comments</div>
      </div>
      <div className='studio__comments_views_menu'>
        <div className='studio__comments_view_1'>Comment</div>
        <div className='studio__comments_view_2'>Date</div>
        <div className='studio__comments_view_3'>Book</div>
      </div>
      <div className='studio__comments_container'>
        {comments.map((comment) => (
          <div className='studio__comments_content' key={comment.id}>
            <div className='studio__comments_views'>
              <div className='studio__comment'>
                <img className='studio__comment_avatar' src={comment.author_profile_img} alt='' />
                <div className='studio__comment_autor_cont'>
                  <div className='studio__comment_avtor'>{comment.author_name}</div>
                  <div className='studio__comment_text'>{comment.text}</div>
                </div>
              </div>
              <div className='studio__buttons'>
                <button className='studio__reply' onClick={() => setShowReplyInput(prevState => ({...prevState, [comment.id]: !prevState[comment.id]}))}>Reply</button>
                <button className='studio_comment_reply_button' onClick={() => toggleReplies(comment.id)}>+</button>
                <div className='studio__reply_label'>{comment.replies_count} Replies</div>
                <div className='studio__comment_rating'>
                  <button><div className='triangle-up'></div></button>{comment.rating}<button><div className='triangle-down'></div></button>
                </div>
              </div>
              {showReplyInput[comment.id] && (
        <div className='studio__reply_container'>
          <img className='studio__comment_avatar' />
          <div className="reply__studio_input-container">
            <div className='studio__reply_view'>Reply</div>
            <textarea
              type="text"
              className='studio__reply-input'
              placeholder='Add a reply...'
              style={{ resize: 'none' }}
            />
            <div className='studio__reply_buttons' >
              <button className='studio__button' onClick={() => setShowReplyInput(false)}>Cancel</button>
              <button className='studio__button'>Reply</button>
            </div>
          </div>
        </div>
      )}

              {showReplies[comment.id] && (
                <div className='studio__replies_container'>
                  {comment.replies.map((reply) => (
                    <div className='studio__reply_content' key={reply.id}>
                      <div className='studio__reply_cont'>
                        <img className='studio__comment_avatar' src={reply.author_profile_img} alt='' />
                        <div className='studio__comment_autor_cont'>
                          <div className='studio__comment_avtor'>{reply.author_name}</div>
                          <div className='studio__comment_text'>{reply.text}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className='studio__comments_views_date'>
              <div className='studio__comment_date'>{comment.formatted_timestamp}</div>
            </div>
            <div className='studio__comments_views_book'>
              <div className='studio__comment_book_name'>{comment.book_name}</div>
              <img src={comment.book_coverpage} alt='' className='studio__comment_book_coverpage' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function StudioSidebar() {
  const [showComponent1, setShowComponent1] = useState(true);

  const toggleComponent = () => {
    setShowComponent1(!showComponent1);
  };



  return (
    <div className='sidebar'>
      <div className='sidebar_logo_but'>
      <button className='menu__button' onClick={toggleComponent}>
        <a href='#'>
        <svg className='studio_burger-icon' version="1.0" xmlns="http://www.w3.org/2000/svg"
  width="42" height="42" viewBox="0 0 50.000000 50.000000" 
  preserveAspectRatio="xMidYMid meet">

  <g transform="translate(0.000000,50.000000) scale(0.100000,-0.100000)" 
    stroke="none">
    <path d="M56 444 c-24 -23 -24 -365 0 -388 23 -24 365 -24 388 0 24 23 24 365
      0 388 -23 24 -365 24 -388 0z m379 -194 l0 -185 -185 0 -185 0 -3 175 c-1 96
      0 180 3 187 3 11 44 13 187 11 l183 -3 0 -185z"/>
    <path d="M120 340 c0 -6 50 -10 130 -10 80 0 130 4 130 10 0 6 -50 10 -130 10
      -80 0 -130 -4 -130 -10z"/>
    <path d="M120 250 c0 -6 50 -10 130 -10 80 0 130 4 130 10 0 6 -50 10 -130 10
      -80 0 -130 -4 -130 -10z"/>
    <path d="M120 160 c0 -6 50 -10 130 -10 80 0 130 4 130 10 0 6 -50 10 -130 10
      -80 0 -130 -4 -130 -10z"/>
  </g>
</svg>
        </a> 
      </button>
      <Link to={'/'}><a>  
        <div className='logo-mini'>
        <svg width="227" height="100" viewBox="0 0 227 100" xmlns="http://www.w3.org/2000/svg" fill='white'>
<g clip-path="url(#clip0_309_961)">
<path d="M35.9632 5.50044C35.9074 5.69934 35.8329 5.82518 35.9558 5.56133C35.9856 5.50044 36.1121 5.32589 36.1121 5.27312C36.1121 5.36648 35.7883 5.65469 36.0116 5.44361C36.0861 5.3746 36.3728 5.08233 36.0489 5.38678C35.6505 5.76023 36.1196 5.3543 36.1159 5.36242C36.0973 5.41925 35.5165 5.67498 35.8515 5.52885C35.967 5.47608 36.3541 5.31371 35.859 5.5045C35.3638 5.69528 35.7064 5.56539 35.818 5.53291C36.3392 5.38272 35.5277 5.57351 35.5277 5.58162C35.5351 5.55321 35.8143 5.55321 35.8404 5.54915C36.1308 5.50856 35.2187 5.52073 35.5016 5.54915C35.5947 5.55727 35.6915 5.55727 35.7883 5.56539C35.8851 5.5735 35.9744 5.5938 36.0675 5.60192C36.3281 5.61816 35.5388 5.45579 35.7845 5.54915C35.9558 5.6141 36.1419 5.65469 36.3169 5.71964C36.3914 5.74805 36.652 5.86577 36.3169 5.71152C35.967 5.55321 36.2834 5.7034 36.3616 5.74399C36.5105 5.82518 36.652 5.91854 36.7934 6.01596C36.9349 6.11339 37.0652 6.22704 37.203 6.33664C37.5082 6.58426 36.9796 6.08903 37.1285 6.26764C37.1918 6.34476 37.27 6.40971 37.3333 6.48278C37.8619 7.05513 38.2863 7.72897 38.6325 8.44746L38.4203 8.00095C38.9751 9.19031 39.2915 10.4812 39.3511 11.8167L39.3325 11.3174C39.3548 12.0521 39.2915 12.7746 39.1538 13.4972C39.0756 13.9153 38.9788 14.3293 38.8708 14.7393C38.815 14.9504 38.7554 15.1574 38.6921 15.3645C38.6623 15.47 38.6288 15.5715 38.5953 15.677C38.4799 16.0545 38.6661 15.4822 38.5842 15.7217C37.9922 17.4063 37.2811 19.03 36.5366 20.6415C35.9148 21.9892 35.2857 23.3328 34.7682 24.7332C34.1651 26.3772 33.6178 28.0497 33.1189 29.7383C31.1346 36.4564 29.7795 43.5642 29.6306 50.6354C29.5673 53.6149 29.3328 58.0882 32.3781 59.5008C34.7942 60.6212 37.5827 59.2004 39.124 57.1018C39.6601 56.3711 40.1217 55.5958 40.5424 54.7799C41.5736 52.7665 42.4374 50.6516 43.2973 48.5489C44.3025 46.0931 45.2705 43.621 46.2757 41.1611C47.1319 39.0665 47.9919 36.9557 49.0157 34.9504C49.2093 34.5729 49.4066 34.1994 49.6188 33.8382C49.7007 33.6961 49.7901 33.5581 49.8757 33.4201C50.0916 33.075 49.805 33.5987 49.7082 33.6555C49.7603 33.6271 49.8124 33.5094 49.8534 33.4566C50.0842 33.144 50.3299 32.8436 50.5905 32.5595C50.7059 32.4296 50.8474 32.3119 50.9591 32.1779C50.6091 32.6123 50.6612 32.4377 50.8139 32.32C50.8288 32.3078 51.1527 32.048 51.1601 32.0602C51.1638 32.0643 50.5347 32.4255 50.9218 32.2185C51.108 32.117 51.3909 32.0886 50.5979 32.3362C50.7022 32.3038 50.9553 32.251 50.49 32.3484C49.7715 32.4945 50.8325 32.3728 50.181 32.389C49.5295 32.4052 50.6352 32.5108 49.8348 32.3565C49.3396 32.2632 49.5071 32.2835 49.6077 32.3159C49.8534 32.3971 48.9934 31.9953 49.2614 32.1536C49.4662 32.2794 49.2428 32.3281 49.0194 31.9141C49.0418 31.9547 49.0902 31.9831 49.1162 32.0237C49.1758 32.117 49.2354 32.2023 49.2838 32.2997L49.0716 31.8532C49.4327 32.6204 49.4774 33.5581 49.5146 34.4024L49.496 33.9031C49.6188 37.049 49.2279 40.195 49.1609 43.3409C49.1348 44.6277 49.0641 46.0484 49.4066 47.2946C50.0954 49.7951 52.8168 49.6206 54.6373 48.7478C56.1004 48.0497 57.3215 46.7669 58.4458 45.5573C59.5701 44.3476 60.5455 43.1948 61.5544 41.9729C64.2982 38.6403 66.8819 35.1493 69.3055 31.5366C71.5057 28.2567 73.6836 24.8063 75.1318 21.0434C75.3254 20.54 75.4967 20.0285 75.6642 19.5171C75.8318 19.0056 75.3887 18.4536 75.0537 18.2262C74.5622 17.8893 73.799 17.8041 73.2406 17.8812C71.9413 18.0557 70.6867 18.6971 70.2288 20.0935C70.4745 19.3466 70.1878 20.195 70.1171 20.3858C70.0203 20.6496 69.9161 20.9094 69.8118 21.1651C69.5922 21.701 69.3539 22.2287 69.1045 22.7523C68.5609 23.893 67.9653 25.0011 67.3435 26.089C66.6511 27.2946 65.9251 28.4759 65.1731 29.6409C64.7859 30.2417 64.3913 30.8384 63.9892 31.431C63.8924 31.5772 63.7919 31.7192 63.6951 31.8654C63.643 31.9425 63.3377 32.3849 63.5648 32.0561C63.7919 31.7273 63.4419 32.2348 63.3973 32.2997C63.2856 32.4621 63.1739 32.6204 63.0585 32.7828C60.2626 36.7527 57.288 40.6456 54.0156 44.1649C53.7326 44.4694 53.4422 44.7738 53.1481 45.0661C53.029 45.1838 52.9099 45.2975 52.7907 45.4152C52.4668 45.7278 53.3008 44.9606 53.07 45.1595C53.0141 45.2082 52.962 45.2569 52.9061 45.3056C52.787 45.4071 52.6642 45.5086 52.5413 45.606C52.4594 45.6709 52.37 45.7278 52.2881 45.7968C52.0499 45.9957 52.8503 45.5694 52.4259 45.7156C52.4557 45.7075 53.1444 45.5086 52.7051 45.606C53.0513 45.5289 53.23 45.5004 53.539 45.4964C54.0826 45.4923 53.9262 45.4964 53.8071 45.4923C53.5763 45.4761 54.5628 45.6709 54.3208 45.5938C54.0379 45.5004 54.9165 45.9429 54.6745 45.7562C54.4958 45.6222 54.991 46.1621 54.924 45.9916C54.8867 45.8982 54.7862 45.8049 54.7378 45.7075L54.95 46.154C54.641 45.4923 54.6112 44.6764 54.5814 43.9457L54.6001 44.445C54.4847 41.3072 54.8867 38.1694 54.9426 35.0356C54.9649 33.6677 55.017 32.1779 54.6634 30.8465C54.5331 30.3472 54.3208 29.8114 53.9746 29.4501C52.8652 28.2892 51.1117 28.3703 49.7231 28.7884C45.7209 29.99 43.8297 34.4633 42.2289 38.2141C40.6131 41.9973 39.1575 45.8577 37.5678 49.6531C36.9014 51.2402 36.2238 52.8315 35.442 54.3577C35.1628 54.9057 34.8575 55.4253 34.5336 55.9409C34.8017 55.5106 34.8426 55.5106 34.6267 55.7947C34.422 56.0667 34.1986 56.3103 33.9789 56.566C33.7965 56.773 34.1874 56.3711 34.1762 56.3833C34.1018 56.4442 33.871 56.5863 34.2321 56.363C34.422 56.2453 34.6304 56.1519 34.8426 56.0911C34.7682 56.1114 35.5425 55.9815 35.2708 56.0058C34.999 56.0302 35.7734 56.0058 35.6952 56.0058C35.6058 56.0058 35.3899 55.9571 35.8031 56.0342C36.2164 56.1114 36.0116 56.0748 35.9186 56.0423C35.9632 56.0586 36.3839 56.3184 36.1605 56.1479C36.101 56.1032 35.7548 55.8313 36.0228 56.0667C36.276 56.2859 36.0079 56.0261 35.9521 55.9571C35.7957 55.7541 35.6654 55.5309 35.5463 55.2995L35.7585 55.746C35.2596 54.6987 35.1181 53.5703 35.066 52.4052L35.0846 52.9045C34.9171 48.7154 35.3341 44.5019 36.0005 40.3776C36.6929 36.0992 37.6832 31.8694 38.9788 27.7614C39.057 27.5179 39.1351 27.2784 39.2133 27.0348C39.3287 26.6817 39.2059 27.0511 39.1873 27.112C39.2319 26.9699 39.2803 26.8278 39.3287 26.6898C39.4851 26.2311 39.6452 25.7724 39.8127 25.3137C40.118 24.4775 40.453 23.6616 40.8179 22.8538C41.6667 20.9744 42.5714 19.1193 43.3085 17.183C44.0456 15.2467 44.8051 13.0507 44.7604 10.883C44.7195 8.87369 44.2318 7.0186 43.2341 5.31371C42.0688 3.32467 40.2036 2.09065 38.0816 1.74968C35.1554 1.2788 31.4474 2.80509 30.5166 6.08903C30.3752 6.59238 30.7735 7.14038 31.1272 7.37988C31.6186 7.7168 32.3818 7.80204 32.9402 7.72492C34.1911 7.55849 35.5537 6.91712 35.9521 5.51261L35.9632 5.50044Z" />
<path d="M37.5193 12.1638C39.3716 8.28416 39.0325 4.09428 36.7619 2.80548C34.4913 1.51668 31.149 3.61701 29.2967 7.49669C27.4444 11.3764 27.7836 15.5663 30.0542 16.8551C32.3248 18.1439 35.667 16.0435 37.5193 12.1638Z"  stroke="none" stroke-miterlimit="10"/>
<path d="M76.0353 36.3825C75.7599 35.2296 77.141 32.8387 78.5669 31.6859C80.1343 30.4194 82.234 31.0486 82.878 32.4206C83.5221 33.7967 82.6025 35.6234 80.9012 36.6625C79.1923 37.7058 76.4002 37.9047 76.0353 36.3825Z"  stroke="#none" stroke-miterlimit="10"/>
</g>
</svg> 
        </div>
      </a></Link></div>
      <div className={`reader__sidebar-menu ${showComponent1 ? 'show' : 'hide'}`}>
        {showComponent1 ? <StudioSidebarMenu/> : <StudioSidebarMenu2 />}  
      </div> 
    </div>
  );
}
function StudioSidebarMenu({ onSelectChapter }) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };
  

    checkAuth();
  

    window.addEventListener('storage', checkAuth);
  

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);


  useEffect(() => {
    const navigation = document.getElementById('navigation');
    if (location.hash && navigation) {
      navigation.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location]);

  const getButtonClass = (color) => {
    if (color === 'home' && location.pathname === '/') {
      return 'pool-button selected';
    }
    return selectedColor === color ? 'pool-button selected' : 'pool-button';
  };

  return (

      <div className="sidebar">
        <ul className='sidebar-menu'>
          <Link to={'/studio'}>
            <li className='pool'>
              <button
                className={getButtonClass('home')}
                onClick={() => setSelectedColor('home')}
              >
                <img className='pool_icon' src={Home} alt="Home" />
                Home
              </button>
            </li>
          </Link>

            <Link to="/studio/studio-books">
              <li className='pool'>
                <button
                  className={getButtonClass('library')}
                  onClick={() => setSelectedColor('library')}
                >
                  <img className='pool_icon' src={Library} alt="Books" />
                  Books
                </button>
              </li>
            </Link>

          <Link to={'/studio/studio-series'}>

              <li className='pool'>
                <button
                  className={getButtonClass('history')}
                  onClick={() => setSelectedColor('history')}
                >
                  <img className='pool_icon' src={History} alt="Series" />
                  Series
                </button>
              </li>

          </Link>
          <Link to={'/studio/studio-comments'}>
            <li className='pool'>
              <button
                className={getButtonClass('news')}
                onClick={() => setSelectedColor('news')}
              >
                <img className='pool_icon' src={CommentIcon} alt="Comments" />
                Comments
              </button>
            </li>
          </Link>
          <div className='book_button'>
            <button
              className={getButtonClass('books')}
              onClick={() => setSelectedColor('books')}
            >
              <img className='pool_icon' src={Book} alt="Earn" />
              Earn
            </button>
          </div>
          <div className='book_button'>
            <button
              className={getButtonClass('help')}
              onClick={() => setSelectedColor('help')}
            >
              <img className='pool_icon' src={Help} alt="Help" />
              Help
            </button>
          </div>
        </ul>
      </div>
  );
}

function StudioSidebarMenu2() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [chapters, setChapters] = useState([]);
  const { book_id } = useParams();
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/book/${book_id}/chapter_side/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setChapters(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке глав:', error);
      }
    };

    if (token) {
      fetchChapters();
    }

  }, [token]);
  const isPublished = chapters.some(chapter => chapter.published);


  return (
    <div className="sidebar">
      <ul className='sidebar-menu'>
      {chapters.map(chapter => (
        <li className='chapters_studio_maps' key={chapter.id}>
          <button 
            className='chapters__studio_title'
            // Добавьте обработчик событий onClick
            onClick={() => navigate(`/studio/${book_id}/chapter/${chapter.id}`)}
          >
            {isPublished ? (<div className='eye'><svg fill="#ffffff" width="32px" height="32px" viewBox="0 0 32 32"  version="1.1" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg" xmlnsSerif="http://www.serif.com/" xmlnsXlink="http://www.w3.org/1999/xlink"><path d="M5.112,18.784l-2.153,2.156c-0.585,0.586 -0.585,1.536 0.001,2.121c0.586,0.585 1.536,0.585 2.121,-0.001l2.666,-2.668c1.898,0.983 4.19,1.806 6.773,2.041l0,3.567c0,0.828 0.672,1.5 1.5,1.5c0.828,-0 1.5,-0.672 1.5,-1.5l0,-3.571c2.147,-0.201 4.091,-0.806 5.774,-1.571l3.199,3.202c0.585,0.586 1.535,0.586 2.121,0.001c0.586,-0.585 0.586,-1.535 0.001,-2.121l-2.579,-2.581c2.59,-1.665 4.091,-3.369 4.091,-3.369c0.546,-0.622 0.485,-1.57 -0.137,-2.117c-0.622,-0.546 -1.57,-0.485 -2.117,0.137c0,-0 -4.814,5.49 -11.873,5.49c-7.059,0 -11.873,-5.49 -11.873,-5.49c-0.547,-0.622 -1.495,-0.683 -2.117,-0.137c-0.622,0.547 -0.683,1.495 -0.137,2.117c0,0 1.175,1.334 3.239,2.794Z"/><g id="Icon"/></svg></div>):(<div className='eye'><svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21.335 11.4069L22.2682 11.0474L21.335 11.4069ZM21.335 12.5932L20.4018 12.2337L21.335 12.5932ZM2.66492 11.4068L1.73175 11.0474L2.66492 11.4068ZM2.66492 12.5932L1.73175 12.9526L2.66492 12.5932ZM3.5981 11.7663C4.89784 8.39171 8.17084 6 12 6V4C7.31641 4 3.31889 6.92667 1.73175 11.0474L3.5981 11.7663ZM12 6C15.8291 6 19.1021 8.39172 20.4018 11.7663L22.2682 11.0474C20.681 6.92668 16.6835 4 12 4V6ZM20.4018 12.2337C19.1021 15.6083 15.8291 18 12 18V20C16.6835 20 20.681 17.0733 22.2682 12.9526L20.4018 12.2337ZM12 18C8.17084 18 4.89784 15.6083 3.5981 12.2337L1.73175 12.9526C3.31889 17.0733 7.31641 20 12 20V18ZM20.4018 11.7663C20.4597 11.9165 20.4597 12.0835 20.4018 12.2337L22.2682 12.9526C22.5043 12.3396 22.5043 11.6604 22.2682 11.0474L20.4018 11.7663ZM1.73175 11.0474C1.49567 11.6604 1.49567 12.3396 1.73175 12.9526L3.5981 12.2337C3.54022 12.0835 3.54022 11.9165 3.5981 11.7663L1.73175 11.0474Z" fill="#ffffff"/>
<circle cx="12" cy="12" r="3" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg></div>)}{chapter.title}
          </button>
        </li>
      ))}
      </ul>
    </div>
  );
}


const StudioTextInput = () => {
  const [inputText, setInputText] = useState('');
  const [serverText, setServerText] = useState('');
  const [alignment, setAlignment] = useState('justify');
  const [textColor, setTextColor] = useState('#000000');
  const [showAlignmentOptions, setShowAlignmentOptions] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { studioPadding } = useStudioPadding();
  const { StudiolineHeight } = useStudioLineHeight();
  const { fontStudioFamily } = useStudioFont();
  const contentEditableRef = useRef();
  const textHistory = useRef([]);
  const colorHistory = useRef([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [modalOpen, setModalOpen] = useState(false);
  const token = localStorage.getItem('token')
  const { book_id } = useParams();
  const { chapter_id } = useParams();

  const handleOpen = () => {
    setModalOpen(true);
  };

  const handleClose = (event) => {
    if (event.target.classList.contains('studio_modal')) {
      setModalOpen(false);
    }
  };

  useEffect(() => {
    const storedText = localStorage.getItem('userText');
    const storedColor = localStorage.getItem('userTextColor');

    if (storedText) {
      setInputText(storedText);
      textHistory.current.push(storedText);
      setHistoryIndex(textHistory.current.length - 1);
    }

    if (storedColor) {
      setTextColor(storedColor);
      colorHistory.current.push(storedColor);
    }
  }, []);

  const handleToggleBoldClick = () => {
    document.execCommand('bold', false, null);
    updateHistory();
    updateLocalStorage();
  };

  const handleToggleItalicClick = () => {
    document.execCommand('italic', false, null);
    updateHistory();
    updateLocalStorage();
  };

  const handleUndoClick = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prevIndex) => prevIndex - 1);
      setInputText(textHistory.current[historyIndex - 1]);
      setTextColor(colorHistory.current[historyIndex - 1]);
    }
  };

  const handleRedoClick = () => {
    if (historyIndex < textHistory.current.length - 1) {
      setHistoryIndex((prevIndex) => prevIndex + 1);
      setInputText(textHistory.current[historyIndex + 1]);
      setTextColor(colorHistory.current[historyIndex + 1]);
    }
  };
  const handleToggleUnderlineClick = () => {
    document.execCommand('underline', false, null);
    updateHistory();
    updateLocalStorage();
  };
  
  const handleToggleStrikethroughClick = () => {
    document.execCommand('strikethrough', false, null);
    updateHistory();
    updateLocalStorage();
  };

  const handleClearClick = () => {
    setInputText('');
    updateHistory();
    updateLocalStorage();
  };

  const updateHistory = () => {
    textHistory.current = textHistory.current.slice(0, historyIndex + 1);
    colorHistory.current = colorHistory.current.slice(0, historyIndex + 1);

    textHistory.current.push(contentEditableRef.current.innerHTML);
    colorHistory.current.push(textColor);

    setHistoryIndex(textHistory.current.length - 1);
  };

  const handleAlignmentChange = (newAlignment) => {
    setAlignment(newAlignment);
    updateHistory();
    updateLocalStorage();
  };

  useEffect(() => {
   
    axios.get(`${apiUrl}/api/book/${book_id}/chapter/${chapter_id}/`, {
        headers: {
            Authorization: `Bearer ${token}` 
        }
    })
        .then(response => {
            setServerText(response.data.content);
        })
        .catch(error => {
            console.error('Ошибка получения данных с сервера:', error);
        });
}, [chapter_id]); 

const handleInputChange = (event) => {
    const newText = event.target.value;
    setInputText(newText);


    axios.put(`${apiUrl}/api/book/${book_id}/chapter/${chapter_id}/`, { content: newText }, {
        headers: {
            Authorization: `Bearer ${token}` 
        }
    })
        .then(response => {

        })
        .catch(error => {

            console.error('Ошибка при отправке данных на сервер:', error);
        });
};

  const handleColorPickerClick = () => {
    setShowColorPicker((prevShowColorPicker) => !prevShowColorPicker);
    setShowAlignmentOptions(false);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (contentEditableRef.current.requestFullscreen) {
        contentEditableRef.current.requestFullscreen();
      } else if (contentEditableRef.current.mozRequestFullScreen) {
        contentEditableRef.current.mozRequestFullScreen();
      } else if (contentEditableRef.current.webkitRequestFullscreen) {
        contentEditableRef.current.webkitRequestFullscreen();
      } else if (contentEditableRef.current.msRequestFullscreen) {
        contentEditableRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen((prevIsFullscreen) => !prevIsFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleColorChange = (color) => {
    setTextColor(color.hex);
    updateHistory();
    updateLocalStorage();
  };

  const handleAlignButtonClick = () => {
    setShowAlignmentOptions((prevShowAlignmentOptions) => !prevShowAlignmentOptions);
  };

  const updateLocalStorage = () => {
    localStorage.setItem('userText', contentEditableRef.current.innerHTML);
    localStorage.setItem('userTextColor', textColor);
  };

  const renderAlignmentOptions = () => (
    <ul className='studio-text-menu' style={{ listStyle: 'none', padding: 0, margin: 0, position: 'absolute', top: '100%', left: -30, zIndex: 2 }}>

      <li className='studio-button-li' onClick={() => handleAlignmentChange('left')} style={{ cursor: 'pointer' }}>

<svg  viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M27,3H5A1,1,0,0,0,5,5H27a1,1,0,0,0,0-2Z"/>
    <path d="M5,9H17a1,1,0,0,0,0-2H5A1,1,0,0,0,5,9Z"/>
    <path d="M27,11H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M5,17H17a1,1,0,0,0,0-2H5a1,1,0,0,0,0,2Z"/>
    <path d="M27,19H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M5,25H17a1,1,0,0,0,0-2H5a1,1,0,0,0,0,2Z"/>
    <path d="M27,27H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
</svg>

      </li>
      <li className='studio-button-li' onClick={() => handleAlignmentChange('center')} style={{ cursor: 'pointer' }}>
      <svg xmlns="http://www.w3.org/2000/svg">
    <path d="M27,3H5A1,1,0,0,0,5,5H27a1,1,0,0,0,0-2Z"/>
    <path d="M20,9a1,1,0,0,0,0-2H12a1,1,0,0,0,0,2Z"/>
    <path d="M27,11H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M20,17a1,1,0,0,0,0-2H12a1,1,0,0,0,0,2Z"/>
    <path d="M27,19H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M20,25a1,1,0,0,0,0-2H12a1,1,0,0,0,0,2Z"/>
    <path d="M27,27H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
</svg>

      </li>
      <li className='studio-button-li' onClick={() => handleAlignmentChange('right')} style={{ cursor: 'pointer' }}>
      <svg  xmlns="http://www.w3.org/2000/svg">
    <path d="M27,3H5A1,1,0,0,0,5,5H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,7H15a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,11H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,15H15a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,19H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,23H15a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,27H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
</svg>


      </li>
      <li className='studio-button-li' onClick={() => handleAlignmentChange('justify')} style={{ cursor: 'pointer' }}>
      <svg fill="#ffffff" width="18px" height="26px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M27,3H5A1,1,0,0,0,5,5H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,7H5A1,1,0,0,0,5,9H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,11H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,15H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,19H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,23H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,27H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
</svg>

      </li>
    </ul>
  );

  const handleSelectChange = (event) => {
    const selectedValue = event.target.value;
    console.log('Selected value:', selectedValue);
  };

  const style = {
    studioPaddingLeft: `${studioPadding.left}px`,
    studioPaddingRight: `${studioPadding.right}px`,
    StudiolineHeight,
    fontStudioFamily,
  };

  return (
    <div className='input-main-manu'>
      <div>
        <div className='studio-buttons'>
          <button className='studio-button' onClick={handleToggleBoldClick}><svg viewBox="0 0 31 32"  xmlns="http://www.w3.org/2000/svg">
<path d="M12.444 12.608C14.076 13.064 15.3 13.796 16.116 14.804C16.956 15.788 17.376 17.012 17.376 18.476C17.376 20.828 16.62 22.676 15.108 24.02C13.62 25.34 11.46 26 8.628 26H0.06V0.512H7.584C10.488 0.512 12.672 1.1 14.136 2.276C15.6 3.452 16.332 5.12 16.332 7.28C16.332 9.848 15.036 11.624 12.444 12.608ZM3.48 3.392V11.384H7.584C9.264 11.384 10.536 11.048 11.4 10.376C12.288 9.68 12.732 8.648 12.732 7.28C12.732 4.688 11.016 3.392 7.584 3.392H3.48ZM8.628 23.12C10.284 23.12 11.556 22.724 12.444 21.932C13.332 21.14 13.776 19.988 13.776 18.476C13.776 17.084 13.284 16.04 12.3 15.344C11.34 14.624 9.936 14.264 8.088 14.264H3.48V23.12H8.628Z" />
</svg>
</button>
          <button className='studio-button' onClick={handleToggleItalicClick}><svg  viewBox="0 0 31 31" xmlns="http://www.w3.org/2000/svg">
<path d="M10.828 31.572C9.076 31.572 7.444 31.224 5.932 30.528C4.444 29.832 3.232 28.86 2.296 27.612C1.384 26.364 0.928 24.912 0.928 23.256C0.928 22.776 0.964 22.284 1.036 21.78C1.132 21.252 1.276 20.724 1.468 20.196C1.828 19.188 2.392 18.3 3.16 17.532C3.952 16.74 4.864 16.128 5.896 15.696C6.928 15.24 7.972 15.012 9.028 15.012C9.292 15.012 9.544 15.036 9.784 15.084C10.024 15.108 10.264 15.144 10.504 15.192C11.056 15.312 11.584 15.528 12.088 15.84C12.616 16.152 13.048 16.548 13.384 17.028C13.648 17.388 13.876 17.832 14.068 18.36C14.26 18.888 14.356 19.392 14.356 19.872C14.356 20.184 14.272 20.436 14.104 20.628C13.96 20.82 13.792 20.916 13.6 20.916C13.432 20.916 13.264 20.844 13.096 20.7C12.952 20.532 12.844 20.28 12.772 19.944C12.676 19.536 12.616 19.236 12.592 19.044C12.568 18.852 12.412 18.564 12.124 18.18C11.956 17.964 11.716 17.76 11.404 17.568C11.116 17.352 10.84 17.196 10.576 17.1C10 16.908 9.448 16.812 8.92 16.812C8.104 16.812 7.3 16.992 6.508 17.352C5.74 17.688 5.056 18.156 4.456 18.756C3.88 19.356 3.46 20.04 3.196 20.808C2.884 21.672 2.728 22.512 2.728 23.328C2.728 24.648 3.1 25.8 3.844 26.784C4.588 27.744 5.572 28.488 6.796 29.016C8.044 29.544 9.388 29.808 10.828 29.808C12.46 29.808 13.84 29.508 14.968 28.908C16.12 28.308 17.068 27.516 17.812 26.532C18.556 25.524 19.144 24.408 19.576 23.184C20.008 21.936 20.332 20.676 20.548 19.404C20.764 18.108 20.908 16.884 20.98 15.732C20.476 15.876 19.972 15.948 19.468 15.948C18.556 15.948 17.68 15.732 16.84 15.3C16.024 14.844 15.364 14.22 14.86 13.428C14.356 12.636 14.104 11.7 14.104 10.62C14.104 10.068 14.176 9.492 14.32 8.892C14.488 8.292 14.74 7.656 15.076 6.984C15.604 5.976 16.324 5.1 17.236 4.356C18.172 3.612 19.204 3 20.332 2.52C21.484 2.04 22.624 1.716 23.752 1.548C23.968 1.356 24.268 1.128 24.652 0.864C25.036 0.599999 25.36 0.443999 25.624 0.395999C25.72 0.372 25.804 0.36 25.876 0.36C25.972 0.335999 26.056 0.323998 26.128 0.323998C26.584 0.323998 26.92 0.467998 27.136 0.755999C27.352 1.02 27.46 1.32 27.46 1.656C27.46 1.968 27.364 2.28 27.172 2.592C26.98 2.88 26.68 3.048 26.272 3.096L25.804 3.168C25.612 3.192 25.408 3.204 25.192 3.204C25 3.18 24.808 3.18 24.616 3.204C23.944 3.996 23.476 4.968 23.212 6.12C22.972 7.272 22.852 8.316 22.852 9.252V12.168C22.948 12.048 23.02 11.94 23.068 11.844C23.14 11.724 23.212 11.604 23.284 11.484C23.332 11.34 23.416 11.184 23.536 11.016C23.8 10.728 24.076 10.584 24.364 10.584C24.628 10.584 24.832 10.704 24.976 10.944C25.144 11.16 25.192 11.436 25.12 11.772C25.096 11.94 24.988 12.168 24.796 12.456C24.628 12.744 24.436 13.032 24.22 13.32C24.028 13.584 23.872 13.788 23.752 13.932C23.44 14.292 23.14 14.58 22.852 14.796C22.804 16.26 22.66 17.772 22.42 19.332C22.204 20.892 21.844 22.404 21.34 23.868C20.836 25.308 20.14 26.604 19.252 27.756C18.364 28.932 17.236 29.856 15.868 30.528C14.5 31.224 12.832 31.572 10.864 31.572H10.828ZM19.288 14.184C19.888 14.184 20.476 14.04 21.052 13.752C21.076 13.008 21.088 12.264 21.088 11.52C21.088 10.752 21.088 9.996 21.088 9.252C21.088 8.364 21.172 7.44 21.34 6.48C21.508 5.496 21.796 4.572 22.204 3.708C21.124 4.068 20.044 4.608 18.964 5.328C17.908 6.024 17.152 6.852 16.696 7.812C16.48 8.268 16.3 8.736 16.156 9.216C16.012 9.696 15.94 10.176 15.94 10.656C15.94 11.808 16.276 12.684 16.948 13.284C17.62 13.884 18.4 14.184 19.288 14.184Z" />
</svg>
</button>
          <button className='studio-button' onClick={handleToggleUnderlineClick}><svg viewBox="0 0 31 31" xmlns="http://www.w3.org/2000/svg">
<path d="M6.264 0.512V17.72C6.264 19.64 6.804 21.056 7.884 21.968C8.988 22.856 10.608 23.3 12.744 23.3C14.88 23.3 16.5 22.868 17.604 22.004C18.708 21.14 19.26 19.772 19.26 17.9V0.512H22.716V17.9C22.716 20.564 21.888 22.628 20.232 24.092C18.576 25.556 16.08 26.288 12.744 26.288C9.408 26.288 6.912 25.556 5.256 24.092C3.624 22.628 2.808 20.564 2.808 17.9V0.512H6.264Z" />
<path d="M0 29.6H25.524V31.4H0V29.6Z" />
</svg>
</button>
          <button className='studio-button' onClick={handleToggleStrikethroughClick}><svg  viewBox="0 0 31 31" xmlns="http://www.w3.org/2000/svg">
<path d="M2.664 22.04C2.856 22.112 3.348 22.316 4.14 22.652C4.932 22.988 5.76 23.264 6.624 23.48C7.512 23.672 8.388 23.768 9.252 23.768C10.86 23.768 12.132 23.384 13.068 22.616C14.004 21.824 14.472 20.744 14.472 19.376C14.472 18.44 14.232 17.684 13.752 17.108C13.296 16.532 12.708 16.088 11.988 15.776C11.268 15.464 10.308 15.128 9.108 14.768C7.596 14.312 6.384 13.868 5.472 13.436C4.584 13.004 3.816 12.332 3.168 11.42C2.544 10.508 2.232 9.284 2.232 7.748C2.232 5.612 2.952 3.884 4.392 2.564C5.856 1.244 8.028 0.583999 10.908 0.583999C12.876 0.583999 14.976 1.052 17.208 1.988L16.38 4.76C14.34 3.92 12.552 3.5 11.016 3.5C9.36 3.5 8.076 3.848 7.164 4.544C6.252 5.216 5.808 6.14 5.832 7.316C5.832 8.228 6.06 8.96 6.516 9.512C6.996 10.064 7.572 10.496 8.244 10.808C8.94 11.12 9.864 11.456 11.016 11.816C12.552 12.296 13.776 12.776 14.688 13.256C15.6 13.736 16.38 14.468 17.028 15.452C17.7 16.412 18.036 17.72 18.036 19.376C18.036 21.728 17.244 23.54 15.66 24.812C14.1 26.06 12.012 26.684 9.396 26.684C7.884 26.684 6.552 26.516 5.4 26.18C4.272 25.868 3.036 25.436 1.692 24.884L2.664 22.04Z" />
<path d="M0 14.912H19.728V16.712H0V14.912Z" />
</svg>
</button>
<div className='studio-buttons' style={{ display: 'inline-block', position: 'relative' }}>
            <button className='studio-button' onClick={handleAlignButtonClick}><svg fill="#ffffff" viewBox="0 0 31 31" xmlns="http://www.w3.org/2000/svg">
    <path d="M27,3H5A1,1,0,0,0,5,5H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,7H5A1,1,0,0,0,5,9H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,11H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,15H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,19H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,23H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
    <path d="M27,27H5a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"/>
</svg>
</button>
            {showAlignmentOptions && renderAlignmentOptions()}
          </div>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button className='studio-button' onClick={handleColorPickerClick} style={{ backgroundColor: textColor }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: textColor }}></div>
            </button>
            {showColorPicker && (
              <div style={{ position: 'absolute', top:100, left: 0, zIndex: 2 }}>
                <ChromePicker className='studio-button' color={textColor} onChange={(color) => handleColorChange(color)} />
              </div>
            )}
          </div>
          <button className='studio-button'>
          <svg viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
  <rect width="16" height="16" id="icon-bound" fill="none" />
  <path d="M0,8h5c0,3.084-1.916,5-5,5v2c4.188,0,7-2.812,7-7V1H0V8z M9,1v7h5c0,3.084-1.916,5-5,5v2c4.188,0,7-2.812,7-7V1H9z" />
</svg>
          </button>
          <button className='studio-button' onClick={handleClearClick}><svg viewBox="0 0 31 31" version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
	  xmlSpace="preserve">
<g>
	<path d="M28.7,8.9l-5.7-5.7c-1.1-1.1-3.1-1.1-4.2,0l-7.1,7.1c0,0,0,0,0,0s0,0,0,0l-7.5,7.5c-1.2,1.2-1.2,3.1,0,4.2l3.8,3.8
		c0.2,0.2,0.4,0.3,0.7,0.3h6.6c0.3,0,0.5-0.1,0.7-0.3l12.7-12.7c0,0,0,0,0,0C29.9,12,29.9,10.1,28.7,8.9z M14.9,24.1H9.2l-3.5-3.5
		c-0.4-0.4-0.4-1,0-1.4l6.8-6.8l7.1,7.1L14.9,24.1z"/>
	<path d="M27,28H5c-0.6,0-1,0.4-1,1s0.4,1,1,1h22c0.6,0,1-0.4,1-1S27.6,28,27,28z"/>
</g>
</svg>
</button>
          <button className='studio-button-stroke' onClick={toggleFullscreen}><svg stroke='none'viewBox="0 0 20 25" xmlns="http://www.w3.org/2000/svg"><path d="M4 9L4 6C4 4.89543 4.89543 4 6 4L9 4" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><path d="M20 15V18C20 19.1046 19.1046 20 18 20H15" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><path d="M15 4L18 4C19.1046 4 20 4.89543 20 6L20 9" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><path d="M9 20L6 20C4.89543 20 4 19.1046 4 18L4 15" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
</button>
          <button className='studio-button-stroke' onClick={handleUndoClick}><svg viewBox="0 0 20 25"  xmlns="http://www.w3.org/2000/svg">
<path d="M6 12H18M6 12L11 7M6 12L11 17" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</button>
          <button className='studio-button-stroke' onClick={handleRedoClick}><svg viewBox="0 0 20 25"  xmlns="http://www.w3.org/2000/svg">
<path d="M6 12H18M18 12L13 7M18 12L13 17" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</button>
<button className='studio-button'>
<svg  viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7.293,13.707a1,1,0,1,1,1.414-1.414L11,14.586V3a1,1,0,0,1,2,0V14.586l2.293-2.293a1,1,0,0,1,1.414,1.414l-4,4a1,1,0,0,1-.325.216.986.986,0,0,1-.764,0,1,1,0,0,1-.325-.216ZM22,12a1,1,0,0,0-1,1v7H3V13a1,1,0,0,0-2,0v8a1,1,0,0,0,1,1H22a1,1,0,0,0,1-1V13A1,1,0,0,0,22,12Z"/></svg>
</button>
<button className='studio-button'>
<svg className='welcome__upload' width="50px" height="50px" viewBox="0 -2 30 30" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" xmlnsSketch="http://www.bohemiancoding.com/sketch/ns">
          <g id="Page-1" stroke="none" stroke-width="1" fill-rule="evenodd" sketchType="MSPage">
            <g id="Icon-Set-Filled" sketchType="MSLayerGroup" transform="translate(-571.000000, -676.000000)" >
              <path d="M599,692 C597.896,692 597,692.896 597,694 L597,698 L575,698 L575,694 C575,692.896 574.104,692 573,692 C571.896,692 571,692.896 571,694 L571,701 C571,701.479 571.521,702 572,702 L600,702 C600.604,702 601,701.542 601,701 L601,694 C601,692.896 600.104,692 599,692 L599,692 Z M582,684 L584,684 L584,693 C584,694.104 584.896,695 586,695 C587.104,695 588,694.104 588,693 L588,684 L590,684 C590.704,684 591.326,684.095 591.719,683.7 C592.11,683.307 592.11,682.668 591.719,682.274 L586.776,676.283 C586.566,676.073 586.289,675.983 586.016,675.998 C585.742,675.983 585.465,676.073 585.256,676.283 L580.313,682.274 C579.921,682.668 579.921,683.307 580.313,683.7 C580.705,684.095 581.608,684 582,684 L582,684 Z" id="upload" sketchType="MSShapeGroup">
              </path>
            </g>
          </g>
        </svg>
</button>
          <button className='studio-button'><NavItem><StudioDropdownMenu/></NavItem></button>
          <select className='studio-select-button' onChange={handleSelectChange}>
            <option value="option1">Not Published</option>
            <option value="option2">Publish Chapter</option>
            <option value="option3">Publish Book</option>
          </select>
          <button onClick={modalOpen ? handleClose : handleOpen} className='mainset_info_button'><svg width="28px" height="28px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path fill="#3f3f3f" fill-rule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1118 0 9 9 0 01-18 0zm8-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm.01 8a1 1 0 102 0V9a1 1 0 10-2 0v5z"/>
</svg>{modalOpen && (
        <div className="studio_modal">
          <div className="studio_modal-content">
            <p className='mainset_modal-text'>Type of the book defines maximum length of Your book and therefore defines how much time reader will spend on average for reading it from first chapter to last. Please, choose this parameter correctly, because some people want to read long stories and other do not. Correctly chosen type of the book will better attract Your target audience.    </p>
          </div>
        </div>
      )}</button>
        </div>
      </div>
      <div className='textstudio'>
        <ContentEditable
          className='textstudio-input'
          html={serverText}
          onChange={handleInputChange}
          innerRef={contentEditableRef}
          style={{ textAlign: alignment, color: textColor, ...style }}
        />
      </div>
    </div>
  );
};

function StudioNavigation({book_id}) {
  const [activeTab, setActiveTab] = useState('tab1'); 

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };
 return (
    <div>
        <div className='studio-main'>
            <div className="navigation-tabs">
              <ul className="studio_navigation-tabs__ul">
              <li><a onClick={() => handleTabClick('tab1')}>Chapters</a></li>
              <li><a onClick={() => handleTabClick('tab2')}>Settings</a></li>
              <li><a onClick={() => handleTabClick('tab3')}>Illustration</a></li>
              <li><a onClick={() => handleTabClick('tab4')}>Put up for sale</a></li>
              </ul>
              <hr className='top-line'></hr>
            </div>
                <div className='studio__tab'>
                      {activeTab === 'tab1' && <StudioTextInput />}
                      {activeTab === 'tab2' && <StudioSetting book_id={book_id}/>}
                      {activeTab === 'tab3' && <StudioIllustartion book_id={book_id}/>}
                </div>
        </div>
    </div>
  );
}

function StudioSliderFontSizer() {
  const [studioFontSize, setStudioFontSize] = useState(16); 

  const handleFontSizeChange = (event) => {
    const newStudioSize = parseInt(event.target.value, 10);
    setStudioFontSize(newStudioSize);

    const elements = document.querySelectorAll('.book');
    elements.forEach((element) => {
      element.style.fontSize = `${newStudioSize}px`;
    });
  };

  return (
    <div>
      <input
        type="range"
        min="12"
        max="48"
        step="1"
        value={studioFontSize}
        onChange={handleFontSizeChange}
      />
    </div>
  );
}


function StudioTextWidthSlider() {
  const { studioPadding, updateStudioPadding } = useStudioPadding();

  const handlePaddingChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    updateStudioPadding({ left: newSize, right: newSize });
  };

  return (
    <div>
      <input
        type="range"
        min="12"
        max="400"
        step="1"
        value={studioPadding.left} 
        onChange={handlePaddingChange}
      />
    </div>
  );
}

const StudioLineHeightSlider = () => {
  const { studioLineHeight, updateStudioLineHeight } = useStudioLineHeight();

  const handleSliderChange = (event) => {
    const newLineHeight = parseFloat(event.target.value);
    updateStudioLineHeight(newLineHeight);
  };

  return (
    <div>
      <input
        type="range"
        min="1"
        max="3"
        step="0.1"
        value={studioLineHeight}
        onChange={handleSliderChange}
      />
    </div>
  );
};

function StudioFontSlider() {
  const { fontStudioFamily, setStudioFont, fontStudioList } = useStudioFont();

  const handleFontChange = (event) => {
    const { value } = event.target;
    setStudioFont(fontStudioList[value]);
  }


  const selectedIndex = fontStudioList.findIndex((font) => font === fontStudioFamily);

  return (
    <input
      type="range"
      min="0"
      max={fontStudioList.length - 1}
      value={selectedIndex}
      onChange={handleFontChange}
    />
  );
}

function StudioDropdownMenu() {

  const [menuHeight, setMenuHeight] = useState(null);
  const dropdownRef = useRef(null)

  useEffect(() => {
    setMenuHeight(dropdownRef.current?.firstChild.offsetHeight)
  }, [])
  

  
  
  return (
    <div className="dropdown" style = {{ height: menuHeight }} ref={dropdownRef}>
        <div className="dropdown-menu">
          <div className='dropdown-button'>
            <ul>
              <li>
                <ul>
                  <li className='dropdown-icon'>Icon</li>
                  <li className='dropdown-text'>Text Size</li>
                  <li className='slider'><StudioSliderFontSizer/></li>
                </ul>
              </li>
              <li>
                 <ul>
                  <li className='dropdown-icon'>Icon</li>
                  <li className='dropdown-text'>Text Width</li>
                  <li className='slider'><StudioTextWidthSlider/></li>
                 </ul>
              </li>
              <li>
                 <ul>
                  <li className='dropdown-icon'>Icon</li>
                  <li className='dropdown-text'>Text Width</li>
                  <li className='slider'><StudioLineHeightSlider/></li>
                 </ul>
              </li>
              <li>
                 <ul>
                  <li className='dropdown-icon'>Icon</li>
                  <li className='dropdown-text'>Text Width</li>
                  <li className='slider'><StudioFontSlider/></li>
                 </ul>
              </li>
            </ul>
          </div>

  

        </div>
    </div>
  );
};

function MainHistory() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [bookData, setBookData] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const token = localStorage.getItem('token');
  const { book_id } = useParams();
  const link = `http://localhost:3000/book_detail/${book_id}`;
  const handleMenuOpen = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.reload();
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
        const response = await axios.get(`${apiUrl}/api/history/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
  
        if (response.status === 200) {
          setBookData(response.data);
        } else {
        }
      } catch (error) {
        console.error('Ошибка при получении данных', error);
      }
    };


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
    fetchData();
  }, [book_id, token]);

  return(
      <div className='history'>
      <div className='history__title'>History</div>
      <div className='history_main'>
          <div className='history__content'>
          {Object.keys(bookData).map((period, index) => (
            <div key={index}>
              {bookData[period].length > 0 && (
                <div className='history__container'>
                  <div className='history_day'>{period}</div>
                  {bookData[period].map((book, bookIndex) => (
                    <div key={bookIndex} className='profile__book'>
                      <div className='profile__first_colum'>
                        <div>
                        <div className='profile__img'>
                          <img src={book.coverpage} className='profile__book-img' alt="Book Cover" />
                        </div>
                        <div className='profile__info'>
                          <div className="like-views__info">{book.views_count}</div>
                          <div className="cirlce">&bull;</div>
                          <div className="like-views__info">{book.upvotes}</div>
                          <div className="cirlce">&bull;</div>
                          <div className="like-views__info">Changed: {new Date(book.last_modified).toLocaleString()}</div>
                        </div>
                      </div>
                      </div>
                      <div className='profile__second_colum'>
                        <div className='books__views'>{book.author}</div>
                        <ul>
                          <li className='profile__books_name'>{book.book_name}</li>
                          <li>
                            <div className='profile__series_colum'>
                              <div className='profile__books_series'>Series: {book.series_name}</div>
                              <div className="cirlce">&bull;</div>
                              <div className='profile__books_volume'>Volume: {book.volume_number}</div>
                            </div>
                          </li>
                          <li className='profile__books_description'>{truncateText(book.description, 300)}</li>
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          </div>
          <HistoryBar clearHistory={clearHistory} />
          </div>
          </div>
  );
}

function truncateText(text, maxLength) {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...'; // добавляем троеточие
  } else {
    return text;
  }
}

function HistoryBar({ clearHistory }) {
  const [recordEnabled, setRecordEnabled] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchHistoryRecordState = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/history/record/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Данные от сервера:', response.data);
        setRecordEnabled(response.data.recordEnabled);
      } catch (error) {
        console.error('Ошибка при получении состояния записи истории:', error);
      }
    };
    fetchHistoryRecordState();
  }, [token]);


  const handleClearHistory = async () => {
    await clearHistory();
  };
  const toggleRecord = async () => {
    try {
      await axios.post(`${apiUrl}/api/history/record/`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRecordEnabled(!recordEnabled);
      console.log('Состояние записи истории успешно изменено');
    } catch (error) {
      console.error('Ошибка при изменении состояния записи истории:', error);
    }
  };

  return (
    <div className='history__bar'>
      <div className='search__history'>
        <input type="text" placeholder="Search History" className="search__history_input" />
      </div>
      <div className='history__clear'>
        <button className='history__clear_button' onClick={handleClearHistory }>Clear History</button>
      </div>
      <div className='record__button'>
        <label className='record-label'>Record History</label>
        <button className={recordEnabled ? 'notifications-button disabled' : 'notifications-button enabled'} onClick={toggleRecord}></button>
      </div>
    </div>
  );
}


// useEffect(() => {
//   const fetchData = async () => {
//     try {
//       const response = await axios.get(`http://127.0.0.1:8000/api/studio/books/${book_id}/settings/`, {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });
//       const data = response.data;
//       setBookName(data.name);
//       setNewName(data.name);
//       setNewCoAuthor(data.co_author);
//       setNewGenre(data.genre);
//       setNewDescription(data.description);
//       setNewBookType(data.book_type);
//       setNewAuthorsNote(data.authors_note);
//       setIsAdult(data.is_adult);
//       setVisibility(data.visibility);
//       setCommentAccess(data.comment_access);
//       setDownloadAccess(data.download_access);
//     } catch (error) {
//       console.error('Ошибка при получении данных книги:', error);
//     }
//   };

//   fetchData();
// }, [book_id, token]);


function StudioSetting({book_id}) {
  const [recordEnabled, setRecordEnabled] = useState(false);
  const token = localStorage.getItem('token');
  const [bookName, setBookName] = useState(''); 
  const [newName, setNewName] = useState('');
  const [newCoAuthor, setNewCoAuthor] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBookType, setNewBookType] = useState('');
  const [newAuthorsNote, setNewAuthorsNote] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [commentAccess, setCommentAccess] = useState('public');
  const [downloadAccess, setDownloadAccess] = useState('public');
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/studio/books/${book_id}/settings/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = response.data;
        setNewName(data.name);
        setNewDescription(data.description);
        setNewBookType(data.book_type);
        setNewAuthorsNote(data.authors_note);
        setVisibility(data.visibility);
        setCommentAccess(data.comment_access);
        setDownloadAccess(data.download_access);
      } catch (error) {
        console.error('Ошибка при получении данных книги:', error);
      }
    };

    fetchData();
  }, [book_id, token]);
  

  const handleChangeName = (e) => {
    setNewName(e.target.value);
  };

  const handleChangeCoAuthor = (e) => {
    setNewCoAuthor(e.target.value);
  };

  const handleChangeGenre = (e) => {
    setNewGenre(e.target.value);
  };

  const handleChangeDescription = (e) => {
    setNewDescription(e.target.value);
  };

  const handleChangeBookType = (e) => {
    setNewBookType(e.target.value);
  };

  const handleChangeAuthorsNote = (e) => {
    setNewAuthorsNote(e.target.value);
  };

  const handleClickIsAdult = () => {
    setIsAdult(!isAdult);
  };

  const handleChangeVisibility = (e) => {
    setVisibility(e.target.value);
  };

  const handleChangeCommentAccess = (e) => {
    setCommentAccess(e.target.value);
  };

  const handleChangeDownloadAccess = (e) => {
    setDownloadAccess(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedData = {};
    

    if (newName !== '') updatedData.name = newName;
    if (newCoAuthor !== '') updatedData.co_author = newCoAuthor;
    if (newGenre !== '') updatedData.genre = newGenre;
    if (newDescription !== '') updatedData.description = newDescription;
    if (newBookType !== '') updatedData.book_type = newBookType;
    if (newAuthorsNote !== '') updatedData.authors_note = newAuthorsNote;
    if (isAdult !== '') updatedData.is_adult = isAdult;
    updatedData.visibility = visibility;
    updatedData.comment_access = commentAccess;
    updatedData.download_access = downloadAccess;
    
    try {
      await axios.patch(
        `${apiUrl}/api/studio/books/${book_id}/settings/`,
        updatedData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      alert('Данные книги успешно обновлены!');
    } catch (error) {
      console.error('Ошибка при обновлении данных книги:', error);
    }
  };


  

  const [modalOpen1, setModalOpen1] = useState(false);
  const [modalOpen2, setModalOpen2] = useState(false);
  const [modalOpen3, setModalOpen3] = useState(false);
  const [modalOpen4, setModalOpen4] = useState(false);
  const [modalOpen5, setModalOpen5] = useState(false);
  const [modalOpen6, setModalOpen6] = useState(false);
  const [modalOpen7, setModalOpen7] = useState(false);
  const [modalOpen8, setModalOpen8] = useState(false);
  const [modalOpen9, setModalOpen9] = useState(false);
  
  const modalRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  
  const openModals = [
    () => setModalOpen1(true),
    () => setModalOpen2(true),
    () => setModalOpen3(true),
    () => setModalOpen4(true),
    () => setModalOpen5(true),
    () => setModalOpen6(true),
    () => setModalOpen7(true),
    () => setModalOpen8(true),
    () => setModalOpen9(true)
  ];
  
  const closeModals = [
    () => setModalOpen1(false),
    () => setModalOpen2(false),
    () => setModalOpen3(false),
    () => setModalOpen4(false),
    () => setModalOpen5(false),
    () => setModalOpen6(false),
    () => setModalOpen7(false),
    () => setModalOpen8(false),
    () => setModalOpen9(false)
  ];
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      modalRefs.forEach((modalRef, index) => {
        if (modalRef.current && !modalRef.current.contains(event.target) && modalOpen[index]) {
          closeModals[index]();
        }
      });
    };

  
  
    const modalOpen = [modalOpen1, modalOpen2, modalOpen3, modalOpen4, modalOpen5, modalOpen6, modalOpen7, modalOpen8, modalOpen9];
  
    if (modalOpen.some(Boolean)) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modalOpen1, modalOpen2, modalOpen3, modalOpen4, modalOpen5, modalOpen6, modalOpen7, modalOpen8, modalOpen9]);
  
  return(
    <div className='studio__settings'>
      <div className='main_settings'>
      <div className='main_settings_view'>Main Settings</div>
        <div className='mainset_container'>
        <div className='mainset_first_colum'>
          <div className='mainset_label_input'>
            <div className='mainset_label'>Book Name</div>
            <div className='mainset_inputsector'>
            <input className='mainset_input' type="text" placeholder='Book Name'              value={newName} 
            onChange={handleChangeName}/>
            <button onClick={openModals[0]} className='mainset_info_button'><svg width="28px" height="28px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path fill="#3f3f3f" fill-rule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1118 0 9 9 0 01-18 0zm8-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm.01 8a1 1 0 102 0V9a1 1 0 10-2 0v5z"/>
</svg>{modalOpen1 && (
        <div className="mainset_modal" ref={modalRefs[0]}>
          <div className="mainset_modal-content">
            <p className='mainset_modal-text'>Book Name - Defines which name will be displayed for readers on the Home page and on Book’s Page </p>
          </div>
        </div>
      )}</button>
</div>
          </div>
          <div className='mainset_label_input'>
            <div className='mainset_label'>Co-Author #1</div>
            <div className='mainset_inputsector'>
            <input
            type="text"
            className='mainset_input'
            placeholder="Co-Author's URL"
            value={newCoAuthor} 
            onChange={handleChangeCoAuthor}
          />
            <button onClick={openModals[1]} className='mainset_info_button'><svg className='mainset_info_button' width="28px" height="28px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path fill="#3f3f3f" fill-rule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1118 0 9 9 0 01-18 0zm8-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm.01 8a1 1 0 102 0V9a1 1 0 10-2 0v5z"/>
</svg>{modalOpen2 && (
        <div className="mainset_modal" ref={modalRefs[1]}>
          <div className="mainset_modal-content">
            <p className='mainset_modal-text'>Copy and Paste here link to the Co-Author’s Page if You are cooperating with someone. Go to Your Co-Author’s Profile and copy address in the top left corner in Your webbrowser  </p>
          </div>
        </div>
      )}</button><button class="mainset__add-input">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19M5 12H19" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
            </div>
          </div>
          <div className='mainset_label_input'>
            <div className='mainset_label'> Main Genre</div>
            <div className='mainset_inputsector'>
            <select className='mainset_input_selector'>
            <option disabled selected>Genre</option>
            </select>
            <button onClick={openModals[2]} className='mainset_info_button'><svg width="28px" height="28px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path fill="#3f3f3f" fill-rule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1118 0 9 9 0 01-18 0zm8-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm.01 8a1 1 0 102 0V9a1 1 0 10-2 0v5z"/>
</svg>{modalOpen3 && (
        <div className="mainset_modal_3" ref={modalRefs[2]}>
          <div className="mainset_modal-content_3">
            <p className='mainset_modal-text'>Book Genre is one of the most important parameter, which helps You find Your target audience. If Your book mostly consist of fantasy with element of other genre such as romantic or detective and e.t.c - then define fantasy as the main genre. Then simply press plus button and add sub genres.<br />Important: Many people firstly choose genre and then book itself. Correctly chosen genre is 50% of success.</p>
          </div>
        </div>
      )}</button>
</div>
          </div>
        </div>
        <div className='mainset_second_colum'>
          <div className='mainset_label_input'>
            <div className='mainset_label'>Type of Book</div>
            <div className='mainset_inputsector'>
            <select className='mainset_input_selector'value={newBookType} onChange={handleChangeBookType}>
            <option value="epic_novel">Epic Novel</option>
            <option value="novel">Novel</option>
            <option value="short_story_poem">Short Story/Poem</option>
            <option value="collection">Short Story/Poem Collection</option>
            </select>
            <button onClick={openModals[3]} className='mainset_info_button'><svg width="28px" height="28px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path fill="#3f3f3f" fill-rule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1118 0 9 9 0 01-18 0zm8-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm.01 8a1 1 0 102 0V9a1 1 0 10-2 0v5z"/>
</svg>{modalOpen4 && (
        <div className="mainset_modal_4" ref={modalRefs[3]}>
          <div className="mainset_modal-content_4">
            <p className='mainset_modal-text'>Type of the book defines maximum length of Your book and therefore defines how much time reader will spend on average for reading it from first chapter to last. Please, choose this parameter correctly, because some people want to read long stories and other do not. Correctly chosen type of the book will better attract Your target audience.    </p>
          </div>
        </div>
      )}</button>
</div>
          </div>
        </div>
        </div>
        <div className='mainset_label_input'>
          <div className='mainset_label_des'>Description</div>
          <textarea className='mainset_desc_input' type="text" placeholder="Book's Description" value={newDescription} onChange={handleChangeDescription}/>
        </div>
        <div className='mainset_label_input'>
          <div className='mainset_label_note' >Note</div>
          <textarea className='mainset_note_input' type="text" placeholder="Author's Note" value={newAuthorsNote} onChange={handleChangeAuthorsNote}/>
        </div>
      </div>
      <div className='restrictions_privacy'>
      <div class="dotted-line"></div>
      <div className='rest-views'>Restrictions & Privacy</div>
      <div className='rest__settings'>
        <div className='rest__first_colum'>
        <div className='mainset_label_input'>
            <div className='mainset_label'>Who can<br />download the<br />book</div>
            <div className='rest_inputsector'>
            <select className='rest_input_selector'value={downloadAccess} onChange={handleChangeDownloadAccess}>
              <option value="public">Public</option>
              <option value="followers">followers</option>
              <option value="private">Private</option>
            </select>
            <button onClick={openModals[4]} className='mainset_info_button'><svg width="28px" height="28px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path fill="#3f3f3f" fill-rule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1118 0 9 9 0 01-18 0zm8-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm.01 8a1 1 0 102 0V9a1 1 0 10-2 0v5z"/>
</svg>{modalOpen5 && (
        <div className="mainset_modal_5" ref={modalRefs[4]}>
          <div className="mainset_modal-content_5">
            <p className='mainset_modal-text'>Public - Everyone is able to download the book
Followers - Only those who follow Your profile can download the book
Private - No one can download the book</p>
          </div>
        </div>
      )}</button>
</div>
          </div>
          <div className='mainset_label_input'>
            <div className='mainset_label'>Who can see<br />the book</div>
            <div className='rest_inputsector'>
            <select className='rest_input_selector' value={visibility} onChange={handleChangeVisibility}>
            <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
            <button onClick={openModals[5]} className='mainset_info_button'><svg width="28px" height="28px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path fill="#3f3f3f" fill-rule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1118 0 9 9 0 01-18 0zm8-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm.01 8a1 1 0 102 0V9a1 1 0 10-2 0v5z"/>
</svg>{modalOpen6 && (
        <div className="mainset_modal_6" ref={modalRefs[5]}>
          <div className="mainset_modal-content_6">
            <p className='mainset_modal-text'>Public - Everyone is able to see the book on Home/Main page and book’s page.
Unlisted - Only those who have link on book’s page can see book’s page. This book will not be displayed on the Home/Main page
Private - No one is able to see the book on Home/Main page and book’s page.</p>
          </div>
        </div>
      )}</button>
</div>
          </div>
        </div>
        <div className='rest__second_colum'>
        <div className='mainset_label_input'>
            <div className='mainset_label'>Who can<br />leave a<br />comment</div>
            <div className='rest_inputsector'>
            <select className='rest_input_selector' value={commentAccess} onChange={handleChangeCommentAccess}>
              <option value="public">Public</option>
              <option value="followers">Followers</option>
              <option value="private">Private</option>
            </select>
            <button onClick={openModals[6]} className='mainset_info_button'><svg width="28px" height="28px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path fill="#3f3f3f" fill-rule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1118 0 9 9 0 01-18 0zm8-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm.01 8a1 1 0 102 0V9a1 1 0 10-2 0v5z"/>
</svg>{modalOpen7 && (
        <div className="mainset_modal_7" ref={modalRefs[6]}>
          <div className="mainset_modal-content_7">
            <p className='mainset_modal-text'>Public - Everyone is able to comment the book
Followers - Only those who follow Your profile can comment the book
Private - No one can comment the book</p>
          </div>
        </div>
      )}</button>
</div>
          </div>
          <div className='rest__buttons'>
            <div className='rest__age_buttons'>
            <div className='rest__button'>
        <label className='rest__button-label_age'>For 18+</label>
        <div className='rest__button_container'>
        <button className={isAdult ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={handleClickIsAdult} ></button>
        <button onClick={openModals[7]} className='mainset_info_button'><svg width="28px" height="28px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path fill="#3f3f3f" fill-rule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1118 0 9 9 0 01-18 0zm8-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm.01 8a1 1 0 102 0V9a1 1 0 10-2 0v5z"/>
</svg>{modalOpen8 && (
        <div className="mainset_modal_8" ref={modalRefs[7]}>
          <div className="mainset_modal-content_8">
            <p className='mainset_modal-text'>Please, turn on this slider if Your book contains violence, erotic scenes, cruelty, hate speech and abusive language.</p>
          </div>
        </div>
      )}</button></div>
      </div>
            </div>
            <div className='rest__age_buttons'>
            <div className='rest__button'>
        <label className='rest__button-label'>Demo Version</label>
        <div className='rest__button_container'>
        <button className={recordEnabled ? 'notifications-button disabled' : 'notifications-button enabled'} ></button>
        <button onClick={openModals[8]} className='mainset_info_button'><svg width="28px" height="28px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path fill="#3f3f3f" fill-rule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1118 0 9 9 0 01-18 0zm8-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm.01 8a1 1 0 102 0V9a1 1 0 10-2 0v5z"/>
</svg>{modalOpen9 && (
        <div className="mainset_modal_9" ref={modalRefs[8]}>
          <div className="mainset_modal-content_9">
            <p className='mainset_modal-text'>Please, turn on this slider if You are not planning to post whole book on this website. Readers will be warned, that full book is not available on Wormates.com website.</p>
          </div>
        </div>
      )}</button></div>
      </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <div className='bookname_autor'>
      </div>
      <div className='studio_settings_save'>
        <button className='studio_settings_save_button'onClick={handleSubmit}>Save</button>
        <button><svg width="32px" height="32px" viewBox="0 0 24 24" className='studio_settings_save_restore' fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3 3V8M3 8H8M3 8L6 5.29168C7.59227 3.86656 9.69494 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.71683 21 4.13247 18.008 3.22302 14" stroke="#3f3f3f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg></button>
      </div>
    </div>
  )
}

function StudioIllustartion ({ book_id }) {
  const [mainImage, setMainImage] = useState(null);
  const [libraryImage, setLibraryImage] = useState(null);
  const [isRightSide, setIsRightSide] = useState(false);
  const [mainKey, setMainKey] = useState(0);
  const [libraryKey, setLibraryKey] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [originalDescription, setOriginalDescription] = useState('');
  const token = localStorage.getItem('token')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/studio/books/${book_id}/illustrations/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = response.data;
        setMainImage(data.cover_page);
        setDescription(data.description);
        setOriginalDescription(data.description);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [book_id, token]);

  const handleInputChange = (e) => {
    setDescription(e.target.value);
  };

  const handleCancelChanges = () => {
    setDescription(originalDescription);
  };

  const handleSaveChanges = async () => {
    try {
      await axios.put(`${apiUrl}/api/studio/books/${book_id}/illustrations/`, {
        description: description
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setOriginalDescription(description);
    } catch (error) {
      console.error('Error saving description:', error);
    }
  };

  const openMenu = () => {
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleToggle = () => {
    setIsRightSide(prevState => !prevState);
  };

  const handleMainImageChange = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('main_image', file);

    try {
      const response = await axios.post(`${apiUrl}/api/studio/books/${book_id}/illustrations/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setMainImage(URL.createObjectURL(file));
    } catch (error) {
      console.error('Error uploading main image:', error);
    }
  };

  const handleLibraryImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      setLibraryImage(reader.result);
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveMainImage = async () => {
    try {
      await axios.delete(`${apiUrl}/api/studio/books/${book_id}/illustrations/main_image`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMainImage(null);
      setMainKey(prevKey => prevKey + 1);
    } catch (error) {
      console.error('Error removing main image:', error);
    }
  };

  const handleRemoveLibraryImage = () => {
    setLibraryImage(null);
    setLibraryKey(prevKey => prevKey + 1);
  };

  return(
    <div className='studio__illustration'>
      <div className='ill__covers'>
        <div className='ill__cover'>
          <div className='ill__views'>
            <div className='ill__view'>Main Book Cover</div>
            <div className='ill__info'></div>
          </div>
          <div className='ill__preview'>&#40;Preview Mode&#41;</div>
<img src={mainImage} alt="" className='ill__main_coverpage' />
          <div className='ill__main_buttons'>
          <div>
      <label htmlFor="upload-button" className='ill__update_button'>Upload</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleMainImageChange}
        style={{ display: 'none' }}
        id="upload-button"
        key={mainKey}
      />
    </div>
            <button onClick={handleRemoveMainImage}><svg className='ill__delete_button' fill="#3f3f3f" height="28px" width="28px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 50 50" enable-background="new 0 0 50 50" xmlSpace="preserve">
<path  d="M10.289,14.211h3.102l1.444,25.439c0.029,0.529,0.468,0.943,0.998,0.943h18.933
	c0.53,0,0.969-0.415,0.998-0.944l1.421-25.438h3.104c0.553,0,1-0.448,1-1s-0.447-1-1-1h-3.741c-0.055,0-0.103,0.023-0.156,0.031
	c-0.052-0.008-0.1-0.031-0.153-0.031h-5.246V9.594c0-0.552-0.447-1-1-1h-9.409c-0.553,0-1,0.448-1,1v2.617h-5.248
	c-0.046,0-0.087,0.021-0.132,0.027c-0.046-0.007-0.087-0.027-0.135-0.027h-3.779c-0.553,0-1,0.448-1,1S9.736,14.211,10.289,14.211z
	 M21.584,10.594h7.409v1.617h-7.409V10.594z M35.182,14.211L33.82,38.594H16.778l-1.384-24.383H35.182z"/>
<path  d="M20.337,36.719c0.02,0,0.038,0,0.058-0.001c0.552-0.031,0.973-0.504,0.941-1.055l-1.052-18.535
	c-0.031-0.552-0.517-0.967-1.055-0.942c-0.552,0.031-0.973,0.504-0.941,1.055l1.052,18.535
	C19.37,36.308,19.811,36.719,20.337,36.719z"/>
<path  d="M30.147,36.718c0.02,0.001,0.038,0.001,0.058,0.001c0.526,0,0.967-0.411,0.997-0.943l1.052-18.535
	c0.031-0.551-0.39-1.024-0.941-1.055c-0.543-0.023-1.023,0.39-1.055,0.942l-1.052,18.535C29.175,36.214,29.596,36.687,30.147,36.718
	z"/>
<path  d="M25.289,36.719c0.553,0,1-0.448,1-1V17.184c0-0.552-0.447-1-1-1s-1,0.448-1,1v18.535
	C24.289,36.271,24.736,36.719,25.289,36.719z"/>
</svg></button>
            <button className='ill__restore_button'></button>
          </div>
        </div>
        <div className='ill__cover'>
          <div className='ill__views'>
            <div className='ill__view'>Library Book Cover</div>
            <div className='ill__info'></div>
          </div>
          <div className='ill__preview'>&#40;Preview Mode&#41;</div>
          <div className="ill__library_coverpage">
        <img src={mainImage} alt="Library Coverpage" className={`ill__image ${isRightSide ? 'right-side' : ''}`} />
      </div>
          <div className='ill__library_buttons'>
            <div className='ill_library_left'>Left Half</div>
            <button className={`ill__switch-button ${isRightSide ? 'enabled' : 'disabled'}`} onClick={handleToggle}></button>
            <div className='ill_library_right'>Right Half</div>
          </div>
        </div>
      </div>
      {!isMenuOpen && (
        <button className='ill__plus' onClick={openMenu}>+</button>
      )}


 {isMenuOpen && (
<StudioIll />
      )}
    </div>
  )
}


function StudioIll() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const openMenu = () => {
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return(
    <div className='ill__second'>
    <div className='ill__covers'>
    <div className='ill__cover'>
      <div className='ill__views'>
        <div className='ill__view'>Main Book Cover</div>
        <div className='ill__info'></div>
      </div>
      <div className='ill__preview'>&#40;Preview Mode&#41;</div>
<img  alt="" className='ill__main_coverpage' />
      <div className='ill__main_buttons'>
      <div>
  <label htmlFor="library-upload-button" className='ill__update_button'>Upload</label>
  <input
    type="file"
    accept="image/*"

    style={{ display: 'none' }}
    id="library-upload-button"

  />
</div>
        <button ><svg className='ill__delete_button' fill="#3f3f3f" height="28px" width="28px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
viewBox="0 0 50 50" enable-background="new 0 0 50 50" xmlSpace="preserve">
<path  d="M10.289,14.211h3.102l1.444,25.439c0.029,0.529,0.468,0.943,0.998,0.943h18.933
c0.53,0,0.969-0.415,0.998-0.944l1.421-25.438h3.104c0.553,0,1-0.448,1-1s-0.447-1-1-1h-3.741c-0.055,0-0.103,0.023-0.156,0.031
c-0.052-0.008-0.1-0.031-0.153-0.031h-5.246V9.594c0-0.552-0.447-1-1-1h-9.409c-0.553,0-1,0.448-1,1v2.617h-5.248
c-0.046,0-0.087,0.021-0.132,0.027c-0.046-0.007-0.087-0.027-0.135-0.027h-3.779c-0.553,0-1,0.448-1,1S9.736,14.211,10.289,14.211z
M21.584,10.594h7.409v1.617h-7.409V10.594z M35.182,14.211L33.82,38.594H16.778l-1.384-24.383H35.182z"/>
<path  d="M20.337,36.719c0.02,0,0.038,0,0.058-0.001c0.552-0.031,0.973-0.504,0.941-1.055l-1.052-18.535
c-0.031-0.552-0.517-0.967-1.055-0.942c-0.552,0.031-0.973,0.504-0.941,1.055l1.052,18.535
C19.37,36.308,19.811,36.719,20.337,36.719z"/>
<path  d="M30.147,36.718c0.02,0.001,0.038,0.001,0.058,0.001c0.526,0,0.967-0.411,0.997-0.943l1.052-18.535
c0.031-0.551-0.39-1.024-0.941-1.055c-0.543-0.023-1.023,0.39-1.055,0.942l-1.052,18.535C29.175,36.214,29.596,36.687,30.147,36.718
z"/>
<path  d="M25.289,36.719c0.553,0,1-0.448,1-1V17.184c0-0.552-0.447-1-1-1s-1,0.448-1,1v18.535
C24.289,36.271,24.736,36.719,25.289,36.719z"/>
</svg></button>
        <button className='ill__restore_button'></button>
      </div>
    </div>
    <div className='ill__cover'>
      <div className='ill__views'>
        <div className='ill__view'>Library Book Cover</div>
        <div className='ill__info'></div>
      </div>
      <div className='ill__preview'>&#40;Preview Mode&#41;</div>
      <div className="ill__library_coverpage">
        <textarea className='ill__library_input' 
        type="text" 
        placeholder='Illustartion Description'


        />
  </div>
      <div className='ill__desc_buttons'>
        <button className='ill_library_save' >Save</button>
        <button ><svg width="32px" height="32px" viewBox="0 0 24 24" className='studio_settings_save_restore' fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3 3V8M3 8H8M3 8L6 5.29168C7.59227 3.86656 9.69494 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.71683 21 4.13247 18.008 3.22302 14" stroke="#3f3f3f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg></button>
      </div>
    </div>
  </div>
        <div className='ill__second-buttons'>
          <button className='ill__plus' onClick={openMenu}></button>

              {isMenuOpen && (
          <button className='ill__minus' onClick={closeMenu}></button>
        )}
        </div>
        {isMenuOpen && (
          <StudioIll />
        )}
  </div>
  )
}
function StudioWelcome() {

  const getToken = () => {
    return localStorage.getItem('token');
  };

  const handleButtonClick = (book_type) => {
    const token = getToken();

    const data = {
      book_type: book_type
    };

    axios.post('http://127.0.0.1:8000/api/studio/welcome/', data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log(response.data);
    })
    .catch(error => {
      console.error('There was an error!', error);
    });
  };

  return (
    <div className='welcome__studio'>
      <div className='welcome_main_view'>Welcome to Wormates Studio!</div>
      <div className='welcome_view'>What would You like to create?</div>
      <div className='welcome__buttons'>
        <div className='welcome__first_buttons'>
          <button className='welcome__button_block' onClick={() => handleButtonClick('epic_novel')}>
            <span className='welcome__button_title'>Epic Novel</span>
            <span className='welcome__button_text'>Length: 100000+ words</span>
            <span className='welcome__button_text'>Can contain many parts</span>
          </button>
          <button className='welcome__button_block' onClick={() => handleButtonClick('novel')}>
            <span className='welcome__button_title'>Novel</span>
            <span className='welcome__button_text'>Length: 50000 words to <br/> 100000 words</span>
            <span className='welcome__button_text'>Can contain many parts</span>
          </button>
          <button className='welcome__button_block' onClick={() => handleButtonClick('short_story_poem')}>
            <span className='welcome__button_title'>Short Story/Poem</span>
            <span className='welcome__button_text'>Length: Up 50000<br/>words</span>
            <span className='welcome__button_text'>Can contain only one part</span>
          </button>
        </div>
        <div className='welcome__second_buttons'>
          <button className='welcome__button_block' onClick={() => handleButtonClick('collection')}>
            <span className='welcome__button_title'>Short Story/Poem Collection</span>
            <span className='welcome__button_text'>Length: 100000+ words</span>
            <span className='welcome__button_text'>Please, use only one part<br/>for one story/poem</span>
          </button>
          <button className='welcome__button_block' onClick={() => handleButtonClick('Do not bother me!')}>
            <span className='welcome__button_title'>Do not bother me!</span>
            <span className='welcome__button_text'>Decide later...</span>
          </button>
        </div>
      </div>
      <div className='welcome_view'> Or</div>
      <hr className='welcome__hr' />
      <div className='welcome_view'> You can Upload book in the following formats <br/>&#40;TXT, PDF, DOCX, FB2, EPUB&#41; below:</div>
      <UploadButton/>
    </div>
  );
}

function UploadButton() {
  const fileInputRef = React.useRef();
  const token=localStorage.getItem('token')

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    axios.post(`${apiUrl}/api/studio/books/upload/`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      console.log(response.data);
      console.log(file)
    })
    .catch(error => {
      console.error(error);
    });
  };

  return (
    <div>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
      <button onClick={handleClick}>
        <svg className='welcome__upload' width="50px" height="50px" viewBox="0 -2 30 30" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" xmlnsSketch="http://www.bohemiancoding.com/sketch/ns">
          <g id="Page-1" stroke="none" stroke-width="1" fill-rule="evenodd" sketchType="MSPage">
            <g id="Icon-Set-Filled" sketchType="MSLayerGroup" transform="translate(-571.000000, -676.000000)" >
              <path d="M599,692 C597.896,692 597,692.896 597,694 L597,698 L575,698 L575,694 C575,692.896 574.104,692 573,692 C571.896,692 571,692.896 571,694 L571,701 C571,701.479 571.521,702 572,702 L600,702 C600.604,702 601,701.542 601,701 L601,694 C601,692.896 600.104,692 599,692 L599,692 Z M582,684 L584,684 L584,693 C584,694.104 584.896,695 586,695 C587.104,695 588,694.104 588,693 L588,684 L590,684 C590.704,684 591.326,684.095 591.719,683.7 C592.11,683.307 592.11,682.668 591.719,682.274 L586.776,676.283 C586.566,676.073 586.289,675.983 586.016,675.998 C585.742,675.983 585.465,676.073 585.256,676.283 L580.313,682.274 C579.921,682.668 579.921,683.307 580.313,683.7 C580.705,684.095 581.608,684 582,684 L582,684 Z" id="upload" sketchType="MSShapeGroup">
              </path>
            </g>
          </g>
        </svg>
      </button>
    </div>
  );
}

function News() {
  const [newsData, setNewsData] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`${apiUrl}/api/news/`, {
      headers: {
        Authorization: `Bearer ${token}` 
      }
    })
    .then(response => {
      setNewsData(response.data);
    })
    .catch(error => {
      console.error(error);
    });
  }, []);

  if (!newsData) {
    return <div>Loading...</div>;
  }

  return (
    <div className='news'>
      <div className='news__title'>
        <div className='news__bell'></div>
        <div className='news__updates_title'>Updates</div>
        <div className='news__updates_title'>Dev.Blog</div>
      </div>   
      <div className='news__content'>
        <div className='news__books'>
          <div className='news__books_title'>Books</div>
          {newsData.map((newsItem) => (
          <div className='news__books_detail' key={newsItem.id}>
              <div className='news__book'>
                <div className='news__book_img'></div>
                <div className='news__colum'>
                  <a href='#'><div className='news-coverpage'><div class='corner'><div className='news__cover_number'>+{newsItem.updates_count}</div></div><img src={newsItem.book.coverpage} class='news__image'/></div></a>
                  <div className='book-info'>
                    <a href='#'><div className='book_author__img'><img src={newsItem.book.author_profile_img}/></div></a>
                    <div>
                      <a href='#' className='books-name'>{newsItem.book.name}</a>
                      <div><a className='books-authorname' href='#'>{newsItem.book.author}</a></div>
                      <div className="viewins">{newsItem.book.views_count} Viewins</div>
                    </div>
                  </div>
                </div>
                </div>
                <div className='news__details_cont'>
{newsItem.updates_list.map((update, index) => (
  <div className='news__details' key={index}>
    <div className='news__detail'><div className='news__detail_plus'>+</div><Link to={`/reader/:book_id/chapter/:chapter_id`}>{update.chapter_title}</Link></div>
    <div className='news__detail'>{update.formatted_timestamp}</div>
  </div>
))}</div>
          </div>
                      ))}
        </div>
        <NewsBar/>
      </div>
    </div>
  );
}

function NewsBar() {
  const [value, setValue] = useState(0);
  const [settings, setSettings] = useState({});
  const thumbRef = useRef(null);
  const trackRef = useRef(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Access token not found');
        }

        const response = await axios.get(`${apiUrl}/users/api/settings/notifications/news/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Settings:', response.data); // Debugging log
        setSettings(response.data);
      } catch (error) {
        console.error(`Error fetching settings: ${error}`);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = async (event) => {
    const newValue = parseInt(event.target.value);
    setValue(newValue);
    // Отправка нового значения на сервер
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Access token not found');
      }
      await axios.patch(`${apiUrl}/users/api/settings/notifications/news/`, { chapter_notification_threshold: newValue }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error(`Error sending chapter_notification_threshold: ${error}`);
    }
  };

  const handleMouseDown = (event) => {
    isDragging.current = true;
    const trackRect = trackRef.current.getBoundingClientRect();
    const x = event.clientX - trackRect.left;
    const percent = (x / trackRect.width) * 100;
    const newValue = Math.round((percent / 100) * 4);
    setValue(newValue);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (event) => {
    if (isDragging.current) {
      const trackRect = trackRef.current.getBoundingClientRect();
      const x = event.clientX - trackRect.left;
      const percent = (x / trackRect.width) * 100;
      const newValue = Math.round((percent / 100) * 4);
      setValue(newValue);
    }
  };

  const handleMarkerClick = (value) => {
    setValue(value);
  };

  // Functions to toggle notification settings and send them to the server
  const toggleReading = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      notify_reading: !prevSettings.notify_reading
    }));
    sendSettingsToServer();
  };

  const toggleLiked = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      notify_liked: !prevSettings.notify_liked
    }));
    sendSettingsToServer();
  };

  const toggleWishlist = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      notify_wishlist: !prevSettings.notify_wishlist
    }));
    sendSettingsToServer();
  };

  const toggleFavorites = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      notify_favorites: !prevSettings.notify_favorites
    }));
    sendSettingsToServer();
  };

  // Function to send settings to the server
  const sendSettingsToServer = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Access token not found');
      }

      await axios.patch(`${apiUrl}/users/api/settings/notifications/news/`, settings, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error(`Error sending settings: ${error}`);
    }
  };

  const marks = [
    { value: 0, label: '1' },
    { value: 1, label: '3' },
    { value: 2, label: '5' },
    { value: 3, label: '10' },
    { value: 4, label: '30' }
  ];

  return (
    <div className='history__bar'>
      <div className='search__history'>
        <input type="text" placeholder="Search Book/Author" className="search__history_input" />
      </div>
      <div className='news__bar_title'>Notification Categories:</div>
      <div className='news__bar_button'>
        <label className='record-label'>Reading</label>
        <button className={settings.notify_reading ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={toggleReading}></button>
      </div>
      <div className='news__bar_button'>
        <label className='record-label'>Liked</label>
        <button className={settings.notify_liked ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={toggleLiked}></button>
      </div>
      <div className='news__bar_button'>
        <label className='record-label'>Wish List</label>
        <button className={settings.notify_wishlist ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={toggleWishlist}></button>
      </div>
      <div className='news__bar_button'>
        <label className='record-label'>Favorites</label>
        <button className={settings.notify_favorites ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={toggleFavorites}></button>
      </div>
      <div className='news__bar_req'>New chapters, required for notification</div>
      <div className="slider-container" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
        <input
          type="range"
          min="1"
          max="5"
          value={value}
          className="slider-input"
          onChange={handleChange}
        />
        <div ref={trackRef} className="slider-track" onMouseDown={handleMouseDown}></div>
        <div className="slider-fill" style={{ width: `${(value / 4) * 100}%` }}></div>
        <div ref={thumbRef} className="slider-thumb" style={{ left: `calc(${(value / 4) * 100}% - 10px)` }} onMouseDown={handleMouseDown}></div>
        <ul className="slider-marks">
          {marks.map(mark => (
            <li key={mark.value} className="slider-mark" style={{ left: `calc(${mark.value * 25}% - 5px)` }} onClick={() => handleMarkerClick(mark.value)}>
              <span className="slider-mark-label">{mark.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function AnonimHistory() {
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
      <div className='history'>
      <div className='history__title'>History</div>
      <div className='history_main'>
          <div className='history__content'>
          {Object.keys(bookData).map((period, index) => (
            <div key={index}>
              {bookData[period].length > 0 && (
                <div className='history__container'>
                  <div className='history_day'>{period}</div>
                  {bookData[period].map((book, bookIndex) => (
                    <div key={bookIndex} className='profile__book'>
                      <div className='profile__first_colum'>
                        <div>
                        <div className='profile__img'>
                          <img src={book.coverpage} className='profile__book-img' alt="Book Cover" />
                        </div>
                        <div className='profile__info'>
                          <div className="like-views__info">{book.views_count}</div>
                          <div className="cirlce">&bull;</div>
                          <div className="like-views__info">{book.upvotes}</div>
                          <div className="cirlce">&bull;</div>
                          <div className="like-views__info">Changed: {new Date(book.last_modified).toLocaleString()}</div>
                        </div>
                      </div>
                      </div>
                      <div className='profile__second_colum'>
                        <div className='books__views'>{book.author}</div>
                        <ul>
                          <li className='profile__books_name'>{book.book_name}</li>
                          <li>
                            <div className='profile__series_colum'>
                              <div className='profile__books_series'>Series: {book.series_name}</div>
                              <div className="cirlce">&bull;</div>
                              <div className='profile__books_volume'>Volume: {book.volume_number}</div>
                            </div>
                          </li>
                          <li className='profile__books_description'>{truncateText(book.description, 300)}</li>
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          </div>
          <HistoryBar clearHistory={clearHistory} />
          </div>
          </div>
  );
}

function BookPageNew() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [reviews, setReviews] = useState([]);
  const [bookData, setBookData] = useState({});
  const [infoData, setInfoData] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [isChaptersOpen, setIsChaptersOpen] = useState(false);
  const [isRewiewOpen, setIsRewiewOpen] = useState(false);
  const [items, setItems] = useState([]);
  const token = localStorage.getItem('token');

  const { book_id } = useParams();
  const [following, setFollowing] = useState(false);
  const [author, setAuthor] = useState('');
  const link = `https://wormates.com/book_detail/${book_id}`;
  const handleMenuOpen = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.reload();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bookResponse = await axios.get(`${apiUrl}/api/book_detail/${book_id}/`);
        
        if (bookResponse.status === 200) {
          setBookData(bookResponse.data);
          const { author } = bookResponse.data;
          setAuthor(author);
        } else {

        }
      } catch (error) {
        console.error('Ошибка при получении данных', error);
      }
    };

    const infoData = async () => {
      try {
        const infoResponse = await axios.get(`${apiUrl}/api/book_detail/${book_id}/info`);
        if (infoResponse.status === 200) {
          setInfoData(infoResponse.data);
        }else {

        }
      } catch (error) {

      }
    }

    const itemData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api`); 
        if (response.status === 200 && Array.isArray(response.data)) {

          setItems(response.data);
        }
      } catch (error) {

      }
    };

    const reviewsData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/book_detail/${book_id}/reviews/`);
        if (response.status === 200) {
          setReviews(response.data)
        }
      }catch (error) {

      }
    };
    const getProfile = async () => {
      try {
        const decodedToken = jwtDecode(token);
        const username = decodedToken.username
        
        const response = await axios.get(`${apiUrl}/users/api/${username}/`, {
        });

        if (response.status === 200) {
          setProfileData(response.data);
        } else {
          // Обработка ошибки
        }
      } catch (error) {

      }
    };
    getProfile();
    fetchData();
    infoData();
    itemData();
    reviewsData();
  }, [book_id]);



const followAuthor = async () => {
  try {
      await axios.post(`${apiUrl}/users/api/${author}/follow/`, {}, {
          headers: { Authorization: `Bearer ${token}` }
      });
      // После нажатия кнопки "Follow" снова проверяем статус подписки
      checkFollowing();
  } catch (error) {
      console.error("Error following author:", error);
  }
};
const checkFollowing = async () => {
  try {
      const decodedToken = jwtDecode(token);
      const username = decodedToken.username
      const response = await axios.get(`${apiUrl}/users/api/${username}/following/`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      const followingUsers = response.data;
      const isFollowing = followingUsers.some(user => user.username === author);
      setFollowing(isFollowing);
  } catch (error) {
      console.error("Error checking following status:", error);
  }
};
useEffect(() => {
  if (typeof token === 'string') {
    const decodedToken = jwtDecode(token);
    const username = decodedToken.username;
    if (username && author) {
        checkFollowing();
    }
  } else {
    console.error('Invalid token:', token);
  }
}, [author, token]);

const toggleChapters = () => {
  setIsChaptersOpen(!isChaptersOpen);
};
const toggleRewiews = () => {
  setIsRewiewOpen(!isRewiewOpen);
};
const distributeItems = (items) => {
  const columns = [[], [], []];
  let itemsPerColumn = 10;

  if (items.length > 30) {
    itemsPerColumn = Math.floor(items.length / 3);
  }

  items.forEach((item, index) => {
    if (columns[0].length < itemsPerColumn) {
      columns[0].push(item);
    } else if (columns[1].length < itemsPerColumn) {
      columns[1].push(item);
    } else {
      columns[2].push(item);
    }
  });

  return columns;
};

const columns = distributeItems(items);
  
  return(

      <div className="bookpage__books_mobile">
          <div className='bookpage__coverpage_new' style={{ backgroundImage: `url(${bookData.coverpage})` }}>
          <div class="bookpage__menu_new">
            <div className='vol'>Vol. {bookData.volume_number}</div>
            <div className='download_mobile'><svg  viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7.293,13.707a1,1,0,1,1,1.414-1.414L11,14.586V3a1,1,0,0,1,2,0V14.586l2.293-2.293a1,1,0,0,1,1.414,1.414l-4,4a1,1,0,0,1-.325.216.986.986,0,0,1-.764,0,1,1,0,0,1-.325-.216ZM22,12a1,1,0,0,0-1,1v7H3V13a1,1,0,0,0-2,0v8a1,1,0,0,0,1,1H22a1,1,0,0,0,1-1V13A1,1,0,0,0,22,12Z"/></svg></div>
            <button className='add_button_mobile'>Add</button>
            <Link to={`/reader/${book_id}/chapter/`}><div className='Read_button_mobile'>Read</div></Link>
            <div className='bookpage_votes_mobile'><svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5C13 20.5 14 19.7294 15.0383 18.9109C17.9806 16.5914 22 14 22 9.1371C22 4.27416 16.4998 0.825464 12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371Z" fill="#ffffff"/>
</svg>{bookData.upvotes}</div>
            <div className='bookpage_votes_mobile'><svg fill="#ffffff" height="20px" width="20px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
 viewBox="0 0 208.666 208.666" xmlSpace="preserve">
<g>
<path d="M54.715,24.957c-0.544,0.357-1.162,0.598-1.806,0.696l-28.871,4.403c-2.228,0.341-3.956,2.257-3.956,4.511v79.825
  c0,1.204,33.353,20.624,43.171,30.142c12.427,12.053,21.31,34.681,33.983,54.373c4.405,6.845,10.201,9.759,15.584,9.759
  c10.103,0,18.831-10.273,14.493-24.104c-4.018-12.804-8.195-24.237-13.934-34.529c-4.672-8.376,1.399-18.7,10.989-18.7h48.991
  c18.852,0,18.321-26.312,8.552-34.01c-1.676-1.32-2.182-3.682-1.175-5.563c3.519-6.572,2.86-20.571-6.054-25.363
  c-2.15-1.156-3.165-3.74-2.108-5.941c3.784-7.878,3.233-24.126-8.71-27.307c-2.242-0.598-3.699-2.703-3.405-5.006
  c0.909-7.13-0.509-20.86-22.856-26.447C133.112,0.573,128.281,0,123.136,0C104.047,0.001,80.683,7.903,54.715,24.957z"/>
</g>
</svg>{bookData.downvotes}</div>
<button className='share_button_mobile'><svg height="22px" width="22px" fill='#ffffff' version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
 viewBox="0 0 512 512"  xmlSpace="preserve">
<g>
<path class="st0" d="M512,230.431L283.498,44.621v94.807C60.776,141.244-21.842,307.324,4.826,467.379
  c48.696-99.493,149.915-138.677,278.672-143.14v92.003L512,230.431z"/>
</g>
</svg>Share</button>
          </div>
          </div>
          <div className='bookpage__name_mobile'>
            <div className='bookpage__name_views_mobile'>{bookData.name}</div>
            <div className='bookpage__count_price_mobile'>
              <div className='count_bookpage'><svg width="22px" fill="#858585" height="22px" viewBox="0 0 12 12" enable-background="new 0 0 12 12" id="Слой_1" version="1.1" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">

<g>

<circle cx="6" cy="6"  r="1.5"/>

<path d="M6,2C4,2,2,3,0,6c2,3,4,4,6,4s4-1,6-4C10,3,8,2,6,2z M6,8.5C4.621582,8.5,3.5,7.3789063,3.5,6   S4.621582,3.5,6,3.5S8.5,4.6210938,8.5,6S7.378418,8.5,6,8.5z" />

</g>

</svg> {bookData.views_count} Viewings</div>
<div className='price__bookpage'>
{bookData.display_price !== "Free" ? `${bookData.display_price} $` : "Free"}
</div>
            </div>
          </div>
          <div className='bookpage__author_mobile'>
            <div className='bookpage__author_info_mobile'>
              <img src={bookData.author_profile_img} alt="" />
              <div className='bookpage__author_name_mobile'>{bookData.author}</div>
              <div className='bookpage__author_fol_mobile'>{bookData.author_followers_count} Followers</div>
            </div>
            <div className='follow_button_mobile'>
            {following ? (
  <button className='fol_button_mob' onClick={followAuthor}>Following</button>
) : (<button className='fol_button_mob' onClick={followAuthor}>+ Follow</button>)}
            </div>
          </div>
          <div className='about_bookpage_mobile'>
            <div className='genres_mobile'>
              <div className='genre_mobile'>{bookData.genre}</div>
              <div className='genre_mobile'>{bookData.subgenres}</div>
            </div>
            <div className='about_book_mobile'>
              <div className='about_book_views_mobile'>About Book</div>
              <div className='about_volum_mobile'>Changed: {infoData.formatted_last_modified}</div>
              <div className='about_volum_mobile'>Total Pages: {infoData.total_pages}</div>
            </div>
            <div className='about_description_mobile'>{infoData.description}</div>
          </div>
          <div className='about_book_mobile'>
              <div className='about_book_views_mobile'>Author's Note</div>
            </div>
            <div className='about_description_mobile'>{infoData.description}</div>
            {isChaptersOpen && (
  <div className='chapters_list_mobile'>
  {columns.map((column, columnIndex) => (
    <div key={columnIndex} className='chapter_items_colum_mobile'>
      {column.map((item, itemIndex) => (
        <div key={itemIndex} className='chapter_item_new'>
          {item.genre} 
        </div>
      ))}
    </div>
  ))}
</div>
            )}
          <div className='bookpage_menu_mobile'>Chapters <button className='bookapage_menu_button_mobile' onClick={toggleChapters}><div className={`triangle-${isChaptersOpen ? 'up' : 'down'}_mobile`}></div></button></div>
          {isRewiewOpen && (
            <div className='bookpage_rewiews_mobile'>
    {reviews.map((review, index) => (
      <div className='reviews_container_mobile' key={index}>
        <div className='reviews__author_mobile'>
          <div className='reviews__author_avatar_mobile'><img src={review.author_profile_img} alt="" /></div>
          <div className='reviews__author_name_mobile'>{review.author_username}</div>
          <div className='reviews__author_time_mobile'>{review.formatted_timestamp}</div>
          <div className='reviews__like_mobile'><div className="heart_mobile"></div>{review.like_count}</div>
        </div>
        <div className='reviews_content_mobile'>
          <div className='reviews_colum_first'>
          <div className='reviews__title_mobile'>Reviews Comment</div>
          <div className='reviews__text_mobile'>{review.text}</div>
          </div>
          <div  className='reviews_colum_second'>
          <div className='reviews__rating_mobile'>
          <div className='reviews__rating_title_mobile'><span>Plot</span> <RatingStars rating={review.plot_rating}/></div>
          <div className='reviews__rating_title_mobile'><span>Characters</span> <RatingStars rating={review.characters_rating}/></div>
          <div className='reviews__rating_title_mobile'><span>Main Character</span> <RatingStars rating={review.main_character_rating}/></div>
          <div className='reviews__rating_title_mobile'><span>Genre Fit</span> <RatingStars rating={review.genre_fit_rating}/></div>
        </div>
          </div>
        </div>
      </div>
    ))}
            </div>
          )}
          <div className='bookpage_menu_mobile'>Reviews <button className='bookapage_menu_button_mobile'  onClick={toggleRewiews}><div className={`triangle-${isRewiewOpen ? 'up' : 'down'}_mobile`}></div></button></div>

          <div className='bookpage_menu_mobile'>Comments <button className='bookapage_menu_button_mobile'><div class="triangle-down_mobile"></div></button></div>
          <div className='bookpage_recomendations_mobile'></div>
      </div>
  )
}


const DownloadButton = () => {
  useEffect(() => {
    const handleInstallClick = () => {
      const isChrome = /chrome/i.test(navigator.userAgent);
      const isAndroid = /android/i.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

      if (isChrome && isAndroid && !isStandalone) {
        // Проверяем, поддерживается ли браузер Chrome на Android
        const promptEvent = window.matchMedia('(display-mode: browser)').matches;
        
        if (promptEvent) {
          // Отображаем баннер установки приложения
          window.addEventListener('beforeinstallprompt', (event) => {
            // Отменяем стандартное поведение браузера
            event.preventDefault();
            // Показываем баннер
            event.prompt();
          });
        }
      } else {
        // Для других браузеров или платформ вы можете предложить пользователю вручную скачать ваше приложение
        alert('Для установки приложения, пожалуйста, перейдите в настройки вашего браузера.');
      }
    };

    // Показываем кнопку скачивания
    const downloadButton = document.getElementById('downloadButton');
    downloadButton.style.display = 'block';
    downloadButton.addEventListener('click', handleInstallClick);

    // Очищаем обработчик события при размонтировании компонента
    return () => {
      downloadButton.removeEventListener('click', handleInstallClick);
    };
  }, []);

  return (
    <button id="downloadButton" className='app_download'>
      App
    </button>
  );
};




export default App;
