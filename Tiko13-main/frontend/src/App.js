import axios from 'axios';
import React, {useState, useEffect, useHistory, useCallback, useRef, useLayoutEffect, useLocation} from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate, NavLink, useParams } from 'react-router-dom';
import { FontSizeProvider } from './context/SizeContext';
import {WidthProvider} from './context/WidthContext';
import {usePadding} from './context/WidthContext';
import { useLineHeight, LineHeightProvider } from './context/LineContext';
import { FontProvider, useFont } from './context/FontContext';
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


const apiUrl = 'http://127.0.0.1:8000'


function App() {
  return (
    <Router>
    <Routes>
      <Route path='/' element={<MainPage />} />
      <Route path='/profile' element={<Main/>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<TwoStepRegistration />} />
      <Route path='/book_detail/:book_id' element={<BookPage />} />
      <Route path='/reader/:book_id/chapter/:chapter_id' element={<ReaderContext />} />
      <Route path='/studio' element={<StudioContext />} />
    </Routes>
    </Router>
  )
}
function ReaderContext() {
  return(
    <FontProvider>
    <WidthProvider>
    <LineHeightProvider>
    <FontSizeProvider>
      <ReaderMain />
    </FontSizeProvider>
    </LineHeightProvider>
    </WidthProvider>
    </FontProvider>
  )
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
function MainPage(){
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState({
  });
  const token = localStorage.getItem('token');
  const logout = () => {
    localStorage.removeItem('authToken');
  };

  const handleMenuOpen = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
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
          <input type="text" placeholder="search" class="search-input"></input>
        </div>
        {isLoggedIn ? (
          <div className='header-avatar'>
          <button className='header-avatar-btn' onClick={(e) => { e.preventDefault(); handleMenuOpen(); }}>
            <img className='header_avatar-img' src={profileData.profileimg} />
          </button>
          {menuOpen && (
            <div className="menu">
              <Link to='/profile'><button className='menu_button'>Profile</button></Link>
              <button className='menu_button'>Settings</button>
              <button className='menu_button' onClick={handleLogout}>Logout</button>
            </div>
          )}
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
      <Sidebar />
      <div className="books">
        <div className='top-viewed'>
          <BookItem />
        </div>
      </div>
  </div>
  )
}


function BookPage() {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bookResponse = await axios.get(`${apiUrl}/api/book_detail/${book_id}/`);
        
        if (bookResponse.status === 200) {
          setBookData(bookResponse.data);

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
    <div className='main'>
      <header className='header'>
      <Link to='/'><a><img className='logo' src={Logo}></img></a></Link>
        <div className='header-search'>
          <input type="text" placeholder="search" class="search-input"></input>
        </div>
        {isLoggedIn ? (
          <div className='header-avatar'>
          <button className='header-avatar-btn' onClick={(e) => { e.preventDefault(); handleMenuOpen(); }}>
            <img className='header_avatar-img' src={profileData.profileimg} />
          </button>
          {menuOpen && (
            <div className="menu">
              <Link to='/profile'><button className='menu_button'>Profile</button></Link>
              <button className='menu_button'>Settings</button>
              <button className='menu_button' onClick={handleLogout}>Logout</button>
            </div>
          )}
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
      <Sidebar />
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
                <div className='bookpage__autor_img'><img src={bookData.author_profile_img} /></div>
                <div>
                  <div className='bookapage__author_name'>{bookData.author}</div>
                  <div className='bookpage__author_followers'>{bookData.author_followers_count}Followers</div>
                </div>
                </div>
                <div className='bookpage__button_menu'>
                <Link to={`/reader/${book_id}/chapter/${bookData.first_chapter_info?.id}`}>
  <button className='bookpage__button_read'>Read</button>
</Link>
                  <button className='bookpage__button_free'>{bookData.display_price}</button>
                  <button className='bookpage__button_add'>+Add</button>
                  <button className='bookpage__button_download'></button>
                </div>
                </div>
                <div className='bookpage__autor_button_second'>
                <div className='bookpage__like_view'>
                  <div className='bookpage__like'>{bookData.upvotes}</div>
                  <div className='bookpage__like'>{bookData.downvotes}</div>
                  <div className='bookpage__like'>{bookData.views_count}</div>
                  <CopyToClipboardButton textToCopy={link} />
                </div>
                </div>
              </div>
            </div>
            
        </div>
        <div className='bookpage__content'>
         <BookpageNavigation  book_id={book_id}/> 
        </div> 
      </div>
  </div>
  )
}



function Main() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState({});
  const token = localStorage.getItem('token');


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
        if (token) {
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
            // Обработка ошибки
          }
        }
      } catch (error) {
        console.error('Ошибка при получении профиля', error);
      }
    };

    fetchData();
  }, [token]);

  return (
    <div className='main'>
      <header className='header'>
        <Link to='/'>
          <a>
            <img className='logo' src={Logo} alt="Logo"></img>
          </a>
        </Link>
        <div className='header-search'>
          <input type="text" placeholder="search" className="search-input"></input>
        </div>

          <div className='header-avatar'>
          <button className='header-avatar-btn' onClick={(e) => { e.preventDefault(); handleMenuOpen(); }}>
            <img className='header_avatar-img' src={profileData.profileimg} />
          </button>
          {menuOpen && (
            <div className="menu">
              <Link to='/profile'><button className='menu_button'>Profile</button></Link>
              <button className='menu_button'>Settings</button>
              <button className='menu_button' onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </header>
      <Sidebar />
      <main className='profile-page'>
        <Profile />
        <Navigation />
      </main>
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
      <a className='bookpage__like' onClick={handleCopy}>Share</a>
    </>
  );
};

function BookItem() {
  const [books, setBooks] = useState([]);

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

return (
  <div className='book-item'>
    {books.map(book => (
      <div className='colum' key={book.id}>
        <div className='book-coverpage'><img src={book.coverpage} /></div>
        <div className='book-info'>
          <a href={`book_detail/${book.id}`} className='books-name'>{book.name}</a>
          <div className='books-authorname'><a href={`profile/${book.author}`}>{book.author}</a></div>
          <ul className='books-info-ul'>
            <li className="viewins">{book.views_count} Viewins</li>
            <li className="read"></li>
          </ul>
        </div>
      </div>
    ))}
  </div>
);
}

const Sidebar = () => {
  return (
    <div>
      <div className="sidebar">
        <ul className='sidebar-menu'>
          <li className='pool'><button className='pool-button'><img className='pool_icon' src={Home}></img>Home</button></li>
          <li className='pool'><button className='pool-button'><img className='pool_icon' src={Library}></img>Library</button></li>
          <li className='pool'><button className='pool-button'><img className='pool_icon' src={History}></img>History</button></li>
          <hr className='sidebar_hr'></hr>
          <div className='book_button'><button className='pool-button'><img className='pool_icon' src={Book}></img>Books</button></div>
          <Books />
          <hr className='sidebar_hr'></hr>
          <div className='followings'>Followings</div>
          <List />
          <hr className='sidebar_hr'></hr>
          <div className='book_button'><button className='pool-button'><img className='pool_icon' src={Setting}></img>Settings</button></div>
          <div className='book_button'><button className='pool-button'><img className='pool_icon' src={Help}></img>Help</button></div>
        </ul>
      </div>
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
  const token = localStorage.getItem('token');


  useEffect(() => {
    const getProfile = async () => {
      try {
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
          // Обработка ошибки
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
    } catch (error) {
      console.error('Ошибка при обновлении данных:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingAbout(false);
    setNewAbout(profileData.about);
  };

  return (
    <div>
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
              </div>
                {editingAbout ? (
                  <div className='about_input'>
                    <textarea 
                      className='about-textarea' 
                      value={newAbout} 
                      onChange={handleAboutChange}
                    />
                    <button className='about-button' onClick={handleSaveAbout}>Save</button>
                    <button className='about-button' onClick={handleCancelEdit}>Cancel</button>
                  </div>
                ) : (
                    <div className='about-description'>{profileData.about}<button className='about-button' onClick={handleAboutEdit}>Edit</button></div>
                )}
              </div>
            </div>  
          </div>
        </div>
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
        </div>
    </div>
  );
}

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

  const handleInputChange = (event) => {
    setReplyText(event.target.value);
  };

  const handleReplySubmit = () => {

    console.log('Reply submitted:', replyText);
    setReplyText('');
  };

  return (
    <div className='book_comment-reply' key={comment.id}>
      <div className='book_comment-info'>
        <img className='book_comment-img' src={comment.profileimg} alt="User Avatar" />
        <div className='book_comment-name'>{comment.username}</div>
        <div className='book_comment-time_since'>{comment.time_since}</div>
      </div>
      <p className='book_comment-text'>{comment.text}</p>

      {comment.replies && comment.replies.length > 0 && (
        <div className='replies_open-button'>
          <button className='reply_button' onClick={() => onToggleReplyButtons(comment.id)}>
            {showReplyButtons[comment.id] ? '-' : '+'}
          </button>
          <p className='open-replies' onClick={() => onToggleReplyButtons(comment.id)}>Open replies</p>
        </div>
      )}

      {showReplyButtons[comment.id] && (
        <>
          {comment.replies.map((nestedReply) => (
            <Comment
              key={nestedReply.id}
              comment={nestedReply}
              showReplyButtons={showReplyButtons}
              onToggleReplyButtons={onToggleReplyButtons}
            />
          ))}

          <div className="reply-input-container">
            <div className='reply-text'>Reply</div>
            <input
              type="text"
              value={replyText}
              onChange={handleInputChange}
              className='reply-input'
            />
            <button className='reply-input-container__button' onClick={handleReplySubmit}>Reply</button>
          </div>
        </>
      )}
    </div>
  );
}


function AddComment() {
  const { book_id } = useParams();
  const handleSubmit = async (event) => {
    event.preventDefault();

    const commentInput = event.target.elements.comment.value;

    try {
      const token = localStorage.getItem('token'); 
      if (!token) {
        throw new Error('Access token not found');
      }

      const response = await axios.post(`http://127.0.0.1:8000/api/book_detail/${book_id}/comments/`, {
        comment: commentInput
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Comment added successfully:', response.data);
      // Additional actions after successful comment addition
    } catch (error) {
      console.error('Error adding comment:', error);
      // Error handling, e.g., displaying error message to user
    }
  };

  return (
    <div className='add_comment'>
      <form className="reply-input-container" onSubmit={handleSubmit}>
        <div className='reply-text'>Add a comment</div>
        <input
          type="text"
          name="comment"
          className='reply-input'
        />
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
          headers: {
            Authorization: `Bearer ${token}`, 
          },
        });
        setComments(response.data.comments);
        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке комментариев', error);
        setLoading(false);
      }
    };

    fetchComments();
  }, [book_id, token]);

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
      {loading && <p>Загрузка комментариев...</p>}
      {!loading && (
        <div>
          {comments.map((comment) => (
            <div key={comment.id} className='book_comment'>
              {/* Основной комментарий */}
              <Comment
                comment={comment}
                showReplyButtons={showReplyButtons}
                onToggleReplyButtons={toggleReplyButtons}
              />
              {/* Проверяем наличие ответов и их отображение */}
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
      <div><AddComment /></div>
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


function ProfileDescription() {
  const [userData, setUserData] = useState(null);
  const [newDescription, setNewDescription] = useState('');
  const [inputVisible, setInputVisible] = useState(false);
  const token = localStorage.getItem('token');

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
          Authorization: `Bearer ${token}` // Включение JWT токена в заголовок запроса
        }
      }); 

      setUserData(response.data);
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
          <input type="text" className='input_description' value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          <div>
            <button className='change_description' onClick={handleChangeDescription}>save</button>
            <button className='change_description' onClick={() => setInputVisible(false)}>cancel</button>
          </div>
        </div>
      ) : (
        <div className="description-container">
          {userData && userData.description ? (
            <div className='prof_description'>
              <p className='profile_description'>{userData.description}</p>
              <button className='change_description' onClick={handleShowInput}>Change</button>
            </div>
          ) : (
            <div>
              <p className='description-none'>You do not have any description yet:&lang;</p>
              <button className='change_description' onClick={handleShowInput}>Add description</button>
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
  const itemsPerPage = 3;
  const [visibleItems, setVisibleItems] = useState(itemsPerPage);
  const allItems = [
    <div className='book_button'><a className='pool-button'><img className='pool_icon' src={Book} alt="Book"></img>4elovek Pidor</a></div>,
    <div className='book_button'><a className='pool-button'><img className='pool_icon' src={Book} alt="Book"></img>4elovek Pidor</a></div>,
    <div className='book_button'><a className='pool-button'><img className='pool_icon' src={Book} alt="Book"></img>4elovek Pidor</a></div>,
    <div className='book_button'><a className='pool-button'><img className='pool_icon' src={Book} alt="Book"></img>4elovek Pidor</a></div>,
    <div className='book_button'><a className='pool-button'><img className='pool_icon' src={Book} alt="Book"></img>4elovek Pidor</a></div>,
    <div className='book_button'><a className='pool-button'><img className='pool_icon' src={Book} alt="Book"></img>4elovek Pidor</a></div>,
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
          <li key={index} dangerouslySetInnerHTML={{ __html: item.props.children }} />
        ))}
      </ul>
      <a onClick={showMoreOrLessItems}>
        <div className='svg-container'>
          <ul>
            <li><img src={Drop} alt="Drop"></img></li>
            <li><img className='drop-svg' src={Drop} alt="Drop"></img></li>
          </ul>
        </div>
      </a>
    </div>
  );
}



function ProfileLibrary() {
  const [activeTab, setActiveTab] = useState('tab1');

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };
 return (
    <div>
        <div>
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
    <div>
      {books.map((book) => (
        <div className='books-items' key={book.id}>
          <div className='nav-book-items'>
            <div className='bookitem-coverpage'><img src={book.coverpage} alt={book.name} /></div>
            <div className='book-name'>{book.name}</div>
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
              <img src={book.coverpage} className='profile__book-img'/>
            </div>
            <div className='profile__info'>
              <div className="like-views__info">{book.views_count}</div>
              <div className="cirlce">&bull;</div>
              <div className="like-views__info">{book.upvote_count}</div>
              <div className="cirlce">&bull;</div>
              <div className="like-views__info">Changed:{book.formatted_last_modified}</div>
            </div>
          </div>
          <div className='profile__second_colum'>
            <div className='books__views'>{book.author}</div>
            <ul>
              <li className='profile__books_name'>{book.name}</li>
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
            <div className='comment-content'>{comment.book_name}</div>
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

  const [visibleSeries, setVisibleSeries] = useState({});

  const handleButtonClick = (seriesId) => {
    setVisibleSeries((prevVisibleSeries) => ({
      ...prevVisibleSeries,
      [seriesId]: !prevVisibleSeries[seriesId],
    }));
  };

  return (
    <div className='profile-series'>
      {seriesData && seriesData.map((series) => (
        <ul className="series-ul" key={series.id}>
          <li className='series-li'>
            <a className="series-a" onClick={() => handleButtonClick(series.id)}>{series.name}</a>
            {visibleSeries[series.id] && <ProfileSeriesItem seriesId={series.id} />}
          </li>
        </ul>
      ))}
    </div>
  );
};



function ProfileSeriesItem() {
  const [seriesData, setSeriesData] = useState([]);
  const token = localStorage.getItem('token');
  const [hoveredSeries, setHoveredSeries] = useState(null);

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

  const handleMouseEnter = (seriesId) => {
    setHoveredSeries(seriesId);
  };

  const handleMouseLeave = () => {
    setHoveredSeries(null);
  };

  return (
    <div className='profile_book'>
      {seriesData && seriesData.map((series) => (
        <div
          className='profile__book'
          key={series.id}
          onMouseEnter={() => handleMouseEnter(series.id)}
          onMouseLeave={handleMouseLeave}
        >
          <div className='profile__first_colum'>
            <div className={`profile__img-container${hoveredSeries === series.id ? ' darkened' : ''}`}>
              <img
                src={series.books[0].coverpage}
                className='profile__book-img'
                alt={`${series.name}`}
              />
              <div className={`profile__img-info${hoveredSeries === series.id ? ' visible' : ''}`}>
                <div className='profile__genre'>{series.books[0].genre}</div>
                <div className='profile__subgenres'>{series.books[0].subgenres.join(', ')}</div>
              </div>
            </div>
            <div className='profile__info'>
              <div className="like-views__info">{series.books[0].views_count}</div>
              <div className="cirlce">&bull;</div>
              <div className="like-views__info">{series.books[0].upvote_count}</div>
              <div className="cirlce">&bull;</div>
              <div className="like-views__info">Changed:{series.books[0].formatted_last_modified}</div>
            </div>
          </div>
          <div className='profile__second_colum'>
            <div className='books__views'>{series.books[0].author}</div>
            <ul>
              <li className='profile__books_name'>{series.name}</li>
              <li>
                <div className='profile__series_colum'>
                  <div className='profile__books_series'>Series:{series.books[0].series}</div>
                  <div className="cirlce">&bull;</div>
                  <div className='profile__books_volume'>Value:{series.books[0].volume_number}</div>
                </div>
              </li>
              <li className='profile__books_description'>
                {series.books.map((book) => (
                  <div key={book.id}>{book.description}</div>
                ))}
              </li>
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}


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
              <li><a onClick={() => handleTabClick('tab2')}>Privacy</a></li>
              <li><a onClick={() => handleTabClick('tab3')}>Security</a></li>
              <li><a onClick={() => handleTabClick('tab4')}>Notifications</a></li>
              <li><a onClick={() => handleTabClick('tab5')}>Series</a></li>
              <li><a onClick={() => handleTabClick('tab6')}>Books</a></li>
              </ul>
            </div>
            <div>
                      {activeTab === 'tab1' && <ProfileSettings />}
                      {activeTab === 'tab2' && <Privacy />}
                      {activeTab === 'tab3' && <Security />}
                      {activeTab === 'tab4' && <Notifications />}
                      {activeTab === 'tab7' && <ProfileSettingsNav />}
        </div>
        </div>
    </div>
  );
}
function ProfileSettings() {
  const [profileData, setProfileData] = useState({
    user:{
    first_name: '',
    last_name: '',
    at_username: '',
  }
  });
  const token = localStorage.getItem('token');



  const handleFirstNameChange = (e) => {
    setFirstName(e.target.value);
    setProfileData((prevData) => ({
      ...prevData,
      user: {
        ...prevData.user,
        first_name: e.target.value,
      },
    }));
  };

  const handleLastNameChange = (e) => {
    setLastName(e.target.value);
    setProfileData((prevData) => ({
      ...prevData,
      user: {
        ...prevData.user,
        last_name: e.target.value,
      },
    }));
  };
  
  const handleAtUsernameChange = (e) => {
    setAtUsername(e.target.value);
    setProfileData((prevData) => ({
      ...prevData,
      user: {
        ...prevData.user,
        at_username: e.target.value,
      },
    }));
  };

  const handleAvatarProfileChange = (e) => {
    setAtUsername(e.target.value);
    setProfileData((prevData) => ({
      ...prevData,
      user: {
        ...prevData.user,
        profileimg: e.target.value,
      },
    }));
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
        } else {
          // Обработка ошибки
        }
      } catch (error) {
        console.error('Ошибка при получении профиля', error);
      }
    };

    getProfile();
  }, [token]);



  const { user } = profileData;

  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [atUsername, setAtUsername] = useState(user.at_username);


  useEffect(() => {
    setFirstName(user.first_name);
    setLastName(user.last_name);
    setAtUsername(user.at_username);
  }, [user.first_name, user.last_name, user.at_username]);





  return (
    <div className='profile-settings'>
      <div className="settings-views">Preview (This is how others see Your profile)</div>
    <div className="profile-info">
      <div className='avatar'><img className='avatar-img' src={profileData.profileimg} alt="#" /></div>
      <div className='user-info'>
          <div className='user-name'>
            <div className='first_name'>{firstName}</div>
            <div className='last_name'>{lastName}</div>
          </div>
        <div className='user-colum'>
        <div className='user-first__colum'>
          <div className='user-tag'>{atUsername}</div>
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
                <input type="file" name='img' accept='image/*' />
                <input type="submit" value='Download' />
              </form>
            </li>
            <li className='change-li'>
              <label htmlFor='FirstName'>Firstname</label> 
              <input type="text" className='change-input'      id="firstName"
      value={firstName}
      onChange={handleFirstNameChange}/>
              </li>
            <li className='change-li'>
            <label className='change-label'>Lastname</label>
            <input type="text" className='change-input' id="lastName"
      value={lastName}
      onChange={handleLastNameChange}/>
            </li>
            <li className='change-li'>
              <label className='change-label'>Username</label>
              <input type="text" className='change-input' id="atUsername"
      value={atUsername}
      onChange={handleAtUsernameChange}/>
            </li>
            <li className='change-li'>
              <label className='change-label'>Date of Birth</label>
                <BirthSelector />
            </li>
            <li className='change-li'>
              <label className='change-label'>Date of Birth Visibility</label>
              <select className='change-input'>
              <option value="1" >No One</option>
              <option value="2" >Friends Only(Default)</option>
              <option value="3" >Everyone</option>
              </select>
               </li>
            <li className='change-li'>
              <label className='change-label'>Gender</label>
              <select className='change-input'>
              <option value="1" >Not Specifield</option>
              <option value="2" >Male</option>
              <option value="3" >Female</option>
              <option value="3" >Other</option>
              </select>
            </li>
          </ul>
          <div className="change-buttons">
            <button className='save-button'>Save</button>
            <button className='discard-button'>Discard</button>
         </div>
        </div>
      </div>
      </div>
  )
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

function Login () {
  const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [loggedIn, setLoggedIn] = useState(false);
   


    const handleLogin = async () => {
      try {
          const response = await axios.post(`${apiUrl}/users/api/login/`, {
              email,
              password,
          });

          if (response.status === 200) {
              const token = response.data.access
              localStorage.setItem('token', String(token));
              setLoggedIn(true);
              navigate('/'); 
              alert('вы успешно зашли')
              console.log(token)
          } else {
          }
      } catch (error) {
          console.error('Ошибка при входе', error);
      }
  };



  return (
      <div className='formContainer'>
          <div className='formWrapper'>
          <Link to='/'><span className='logo-register'><img src={Logo}></img></span></Link>
              <span className='google'><div className='google_button'><a className='google-button'><img className='google_icon' src={Google}></img>Sign in via Google</a></div></span>
              <span className='google'><div className='face_button'><a className='face-button'><img className='face_icon' src={Face}></img>Sign in via Facebook</a></div></span>

            <hr className='login_hr'></hr>
              <form className='log-form'>
                  <input type="email" placeholder='email' className='em-log' value={email} onChange={e => setEmail(e.target.value)}/>
                  <input type="password" placeholder='password' className='pas-log' value={password} onChange={e => setPassword(e.target.value)}/>
                  <span ><a className='forgot-log'>Forgot Password?</a></span>
                  <Link to='/register'><a className='create-log'>Create Account</a></Link>
                  <button type='button' className='button-log' onClick={handleLogin}>Sign in</button>
              </form>
          </div>
      </div>
  )
}




function Register () {
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth_month: '',
    date_of_birth_year: '',
    email: '',
    password: '',
    password2: '',
});

const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
};

const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch(`${apiUrl}/users/auth/users/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });

    if (response.status === 201) {
        // Регистрация успешна
    } else {
        // Обработка ошибки
    }
};
const nextStep = () => {
  setCurrentStep(currentStep + 1);
};

const prevStep = () => {
  setCurrentStep(currentStep - 1);
};
  return (  
    <div>
      {currentStep === 1 && (
        <RegisterStep1 formData={formData} setFormData={setFormData} nextStep={nextStep} />
      )}
      {currentStep === 2 && (
        <RegisterStep2 formData={formData} setFormData={setFormData} prevStep={prevStep} nextStep={nextStep} />
      )}
      {currentStep === 3 && (
        <RegisterStep3 formData={formData} prevStep={prevStep} />
      )}
    </div>    
  )
}



function RegisterStep1 () {

    const navigate = useNavigate();
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      date_of_birth_month: '',
      date_of_birth_year: '',
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
        <form >
            <input name="first_name" type="text" placeholder='First name' className='register-name' value={formData.first_name} onChange={handleChange}/>
            <input name="last_name"  type="text" placeholder='Last name (optional)' className='register-last' value={formData.last_name} onChange={handleChange}/>
            <p className='register-date'>Date of birth (optional)</p>
            <select name="date_of_birth_month"  className='month' value={formData.date_of_birth_month} onChange={handleChange}>
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
            <input name="date_of_birth_year"  type='number' placeholder='Year' className='year' value={formData.date_of_birth_year} onChange={handleChange}/>
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
              <form >
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




function UserList() {
    const [users, setUsers] = useState([]);
    const [sortByRating, setSortByRating] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/users/');
                const sortedUsers = sortByRating
                    ? response.data.sort((a, b) => b.rating - a.rating)
                    : response.data;
                setUsers(sortedUsers);
            } catch (error) {
                console.error('Ошибка при загрузке пользователей', error);
            }
        };

        fetchData();
    }, [sortByRating]);

    return (
        <div>
            <button onClick={() => setSortByRating(!sortByRating)}>
                Сортировать по рейтингу
            </button>
            <ul>
                {users.map((user) => (
                    <li key={user.id}>
                        {user.username} - Рейтинг: {user.rating}
                    </li>
                ))}
            </ul>
        </div>
    );
}

 
function TwoStepRegistration() {
  const [first_name, setFirstName] = useState('')
  const [last_name, setLastName] = useState('')
  const [date_of_birth_month, setDateOfBirthMonth] = useState('')
  const [date_of_birth_year, setDateOfBirthYear] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [currentStep, setCurrentStep] = useState(1);

  const handleRegister = async () => {

      try {
        await axios.post(`${apiUrl}/users/api/register/`, {
          email: email,
          password: password,
          password2: password2,
          first_name: first_name,
          last_name: last_name,
          date_of_birth_month: date_of_birth_month,
          date_of_birth_year: date_of_birth_year,
        });
        console.log('Регистрация успешно завершена');
      } catch (error) {
        console.error('Ошибка регистрации:', error);
      }
  };

  return (
    <div>
      {currentStep === 1 && (
        <div className='formContainer'>
        <div className='formWrapper'>
        <Link to='/'><span className='logo-register'><img src={Logo}></img></span></Link>
            <span className='register-title'>Create a Wormates Account</span>
            <span className='info'>Basic information</span> 
            <form >
                <input name="first_name" type="text" placeholder='First name' className='register-name' value={first_name} onChange={(e) => setFirstName(e.target.value)}/>
                <input name="last_name"  type="text" placeholder='Last name (optional)' className='register-last' value={last_name} onChange={(e) => setLastName(e.target.value)}/>
                <p className='register-date'>Date of birth (optional)</p>
                <select name="date_of_birth_month"  className='month' value={date_of_birth_month} onChange={(e) => setDateOfBirthMonth(e.target.value)}>
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
                <input name="date_of_birth_year"  type='number' placeholder='Year' className='year' value={date_of_birth_year} onChange={(e) => setDateOfBirthYear(e.target.value)}/>
                <div><button type='submit' className='next-button' onClick={() => setCurrentStep(2)}>Next</button></div>
            </form>
        </div>
    </div>
      )}

      {currentStep === 2 && (
        <div className='formContainer'>
                 <div className='formWrapper'>
                 <Link to='/'><span className='logo-register'><img src={Logo}></img></span></Link>
                     <span className='register-title'>Enter your email and password</span>
                     <form >
                       <div>
                         <input type="email" placeholder='Email' name="email" className='register-mail' value={email} onChange={(e) => setEmail(e.target.value)}/>
                       </div> 
                       <div>
                         <input type="password" placeholder='password' name="password" className='register-password' value={password} onChange={(e) => setPassword(e.target.value)}/>
                         <input type="password" placeholder='Repeat password' name="password2" className='register-password' value={password2} onChange={(e) => setPassword2(e.target.value)}/>
                       </div> 
                       <button className='back-button'>Back</button>
                       <Link to='/login'><button type='button' className='next-button'onClick={handleRegister}>Next</button></Link> 
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
   return(
      <div className='privacy-setting'>
         <div className='privacy-info'>
            <ul className='privacy-setting-ul'>
               <li className='privacy-setting-li'>
                  <label className='privacy-label'>Auto add books to<br></br>the library</label>
                  <select className='privacy-input'>
                     <option value="1" >Active (Recommended)</option>
                     <option value="2" >Off</option>
                  </select>
               </li>
               <li className='privacy-setting-li'>
                  <label className='privacy-label'>Who can see your<br></br>Library</label>
                  <select className='privacy-input'>
                     <option value="1" >No One</option>
                     <option value="2" >Friends Only (Default)</option>
                     <option value="3" >Everyone</option>
                  </select>
               </li>
            </ul>
         </div>
         <div className="change-buttons">
            <button className='save-button'>Save</button>
            <button className='discard-button'>Discard</button>
         </div>
      </div>
   )
}

function Security() {
   return(
      <div className='setting-security'>
         <div className='setting-views'>We do not share and disclose Your personal information to anyone</div>
         <div className='setting-password-change'>Password Change</div>
         <div className='security-info'>
            <ul className="security-info-ul">
               <li className='security-info-li'>
                  <label className='security-label'>Current Password</label>
                  <input type="text" className='security-input' />
               </li>
               <li className="security-info-li">
                  <div className='pw-change-menu'>
                     <div className='security-change-pw'>                  <label className='security-pw-label'>New Password</label>
                  <input type="text" className='security-input' /></div>
                     <div className='security-change-pw'>                  <label className='security-pw-label'>Repeat Password</label>
                  <input type="text" className='security-input' /></div>
                  </div>
               </li>
            </ul>
         </div>
         <div className="change-buttons">
            <button className='save-button'>Save</button>
            <button className='discard-button'>Cancel</button>
         </div>
      </div>
   )
}

function Notifications() {
   const [isToggled, setIsToggled] = useState(false);

   const notificationsButton = () => {
     setIsToggled(!isToggled);
   };


   
   return(
      <div className='setting-notifications'>
         <div className='notifications-views'>General Notifications</div>
         <div className='notifications-menu'>
            <ul className='notifications-ul'>
               <li className='notifications-li'>
                  <label className='notifications-label'>Group notifications by author</label>
                  <button className={isToggled ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={notificationsButton}></button>
               </li>
               <li className='notifications-li'>
                  <label className='notifications-label'>Show book’s updates</label>
                  <button className={isToggled ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={notificationsButton}></button>
               </li>
               <li className='notifications-li'>
                  <label className='notifications-label'>Show author’s updates</label>
                  <button className={isToggled ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={notificationsButton}></button>
               </li>
            </ul>
         </div>
         <div className='notifications-views'>Book’s Updates</div>
         <div className='notifications-menu'>
            <ul>
               <li className='notifications-li'>
                  <label className='notifications-label'>New Ebooks</label>
                  <button className={isToggled ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={notificationsButton}></button>
               </li>
               <li className='notifications-li'>
                  <label className='notifications-label'>Library reading list updates</label>
                  <button className={isToggled ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={notificationsButton}></button>
               </li>
               <li className='notifications-li'>
                  <label className='notifications-label'>Library wish list updates</label>
                  <button className={isToggled ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={notificationsButton}></button>
               </li>
               <li className='notifications-li'>
                  <label className='notifications-label'>Library liked updates</label>
                  <button className={isToggled ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={notificationsButton}></button>
               </li>
            </ul>
         </div>
         <div className='notifications-views'>Social Updates</div>
         <div className='notifications-menu'>
            <ul>
               <li className='notifications-li'>
                  <label className='notifications-label'>New Reviews</label>
                  <button className={isToggled ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={notificationsButton}></button>
               </li>
               <li className='notifications-li'>
                  <label className='notifications-label'>New Followers</label>
                  <button className={isToggled ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={notificationsButton}></button>
               </li>
               <li className='notifications-li'>
                  <label className='notifications-label'>New Comments</label>
                  <button className={isToggled ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={notificationsButton}></button>
               </li>
               <li className='notifications-li'>
                  <label className='notifications-label'>Responses to my comments</label>
                  <button className={isToggled ? 'notifications-button enabled' : 'notifications-button disabled'} onClick={notificationsButton}></button>
               </li>
            </ul>
         </div>
         <div className="change-buttons">
            <button className='save-button'>Save</button>
            <button className='discard-button'>Discard</button>
         </div>
      </div>
   )
}

function ReaderMain() {

  const {padding} = usePadding();
  const {lineHeight} = useLineHeight();
  const {fontFamily} = useFont();
  
  const [book, setBook] = useState(null);
  const { book_id, chapter_id } = useParams();
  const token = localStorage.getItem('token');

  const style = {
    paddingLeft: `${padding.left}px`,
    paddingRight: `${padding.right}px`,
    lineHeight: `${lineHeight * 100}%`,
    fontFamily,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/reader/${book_id}/chapter/${chapter_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.status === 200) {
          setBook(response.data);
          console.log(response.data);
        } else {
          console.log(response);
        }
      } catch (error) {
        console.error('Ошибка при получении данных:', error);
      }
    };
  
    fetchData();
  }, [book_id, chapter_id, token]);

  if (!book) {
    return <div>Loading...</div>;
  }

  const { id, title, content } = book;

  return (
    <div className='main'>
      <div className='container'>
        <ReaderSidebar book_id={book_id}/>
        <div className='reader'>
          <div key={id}>
            <div className='title'>{title}</div>
            <hr className='top-line'></hr>
            <div className='book' style={style}>&emsp;{content}</div>
          </div>
        </div>
        <ButtonMenu />
      </div>
    </div>
  );
}

function ReaderSidebar({book_id}) {

  const [showComponent1, setShowComponent1] = useState(true);

  const toggleComponent = () => {
    setShowComponent1(!showComponent1);
  };

  return (
    <div className='sidebar'>
      <button className='menu__button'onClick={toggleComponent}><a href='#'></a><svg className='burger-icon' version="1.0" xmlns="http://www.w3.org/2000/svg"
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
          </svg><a/></button>
        <a><div className='logo-mini'><svg width="227" height="100" viewBox="0 0 227 100" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_309_961)">
<path d="M35.9632 5.50044C35.9074 5.69934 35.8329 5.82518 35.9558 5.56133C35.9856 5.50044 36.1121 5.32589 36.1121 5.27312C36.1121 5.36648 35.7883 5.65469 36.0116 5.44361C36.0861 5.3746 36.3728 5.08233 36.0489 5.38678C35.6505 5.76023 36.1196 5.3543 36.1159 5.36242C36.0973 5.41925 35.5165 5.67498 35.8515 5.52885C35.967 5.47608 36.3541 5.31371 35.859 5.5045C35.3638 5.69528 35.7064 5.56539 35.818 5.53291C36.3392 5.38272 35.5277 5.57351 35.5277 5.58162C35.5351 5.55321 35.8143 5.55321 35.8404 5.54915C36.1308 5.50856 35.2187 5.52073 35.5016 5.54915C35.5947 5.55727 35.6915 5.55727 35.7883 5.56539C35.8851 5.5735 35.9744 5.5938 36.0675 5.60192C36.3281 5.61816 35.5388 5.45579 35.7845 5.54915C35.9558 5.6141 36.1419 5.65469 36.3169 5.71964C36.3914 5.74805 36.652 5.86577 36.3169 5.71152C35.967 5.55321 36.2834 5.7034 36.3616 5.74399C36.5105 5.82518 36.652 5.91854 36.7934 6.01596C36.9349 6.11339 37.0652 6.22704 37.203 6.33664C37.5082 6.58426 36.9796 6.08903 37.1285 6.26764C37.1918 6.34476 37.27 6.40971 37.3333 6.48278C37.8619 7.05513 38.2863 7.72897 38.6325 8.44746L38.4203 8.00095C38.9751 9.19031 39.2915 10.4812 39.3511 11.8167L39.3325 11.3174C39.3548 12.0521 39.2915 12.7746 39.1538 13.4972C39.0756 13.9153 38.9788 14.3293 38.8708 14.7393C38.815 14.9504 38.7554 15.1574 38.6921 15.3645C38.6623 15.47 38.6288 15.5715 38.5953 15.677C38.4799 16.0545 38.6661 15.4822 38.5842 15.7217C37.9922 17.4063 37.2811 19.03 36.5366 20.6415C35.9148 21.9892 35.2857 23.3328 34.7682 24.7332C34.1651 26.3772 33.6178 28.0497 33.1189 29.7383C31.1346 36.4564 29.7795 43.5642 29.6306 50.6354C29.5673 53.6149 29.3328 58.0882 32.3781 59.5008C34.7942 60.6212 37.5827 59.2004 39.124 57.1018C39.6601 56.3711 40.1217 55.5958 40.5424 54.7799C41.5736 52.7665 42.4374 50.6516 43.2973 48.5489C44.3025 46.0931 45.2705 43.621 46.2757 41.1611C47.1319 39.0665 47.9919 36.9557 49.0157 34.9504C49.2093 34.5729 49.4066 34.1994 49.6188 33.8382C49.7007 33.6961 49.7901 33.5581 49.8757 33.4201C50.0916 33.075 49.805 33.5987 49.7082 33.6555C49.7603 33.6271 49.8124 33.5094 49.8534 33.4566C50.0842 33.144 50.3299 32.8436 50.5905 32.5595C50.7059 32.4296 50.8474 32.3119 50.9591 32.1779C50.6091 32.6123 50.6612 32.4377 50.8139 32.32C50.8288 32.3078 51.1527 32.048 51.1601 32.0602C51.1638 32.0643 50.5347 32.4255 50.9218 32.2185C51.108 32.117 51.3909 32.0886 50.5979 32.3362C50.7022 32.3038 50.9553 32.251 50.49 32.3484C49.7715 32.4945 50.8325 32.3728 50.181 32.389C49.5295 32.4052 50.6352 32.5108 49.8348 32.3565C49.3396 32.2632 49.5071 32.2835 49.6077 32.3159C49.8534 32.3971 48.9934 31.9953 49.2614 32.1536C49.4662 32.2794 49.2428 32.3281 49.0194 31.9141C49.0418 31.9547 49.0902 31.9831 49.1162 32.0237C49.1758 32.117 49.2354 32.2023 49.2838 32.2997L49.0716 31.8532C49.4327 32.6204 49.4774 33.5581 49.5146 34.4024L49.496 33.9031C49.6188 37.049 49.2279 40.195 49.1609 43.3409C49.1348 44.6277 49.0641 46.0484 49.4066 47.2946C50.0954 49.7951 52.8168 49.6206 54.6373 48.7478C56.1004 48.0497 57.3215 46.7669 58.4458 45.5573C59.5701 44.3476 60.5455 43.1948 61.5544 41.9729C64.2982 38.6403 66.8819 35.1493 69.3055 31.5366C71.5057 28.2567 73.6836 24.8063 75.1318 21.0434C75.3254 20.54 75.4967 20.0285 75.6642 19.5171C75.8318 19.0056 75.3887 18.4536 75.0537 18.2262C74.5622 17.8893 73.799 17.8041 73.2406 17.8812C71.9413 18.0557 70.6867 18.6971 70.2288 20.0935C70.4745 19.3466 70.1878 20.195 70.1171 20.3858C70.0203 20.6496 69.9161 20.9094 69.8118 21.1651C69.5922 21.701 69.3539 22.2287 69.1045 22.7523C68.5609 23.893 67.9653 25.0011 67.3435 26.089C66.6511 27.2946 65.9251 28.4759 65.1731 29.6409C64.7859 30.2417 64.3913 30.8384 63.9892 31.431C63.8924 31.5772 63.7919 31.7192 63.6951 31.8654C63.643 31.9425 63.3377 32.3849 63.5648 32.0561C63.7919 31.7273 63.4419 32.2348 63.3973 32.2997C63.2856 32.4621 63.1739 32.6204 63.0585 32.7828C60.2626 36.7527 57.288 40.6456 54.0156 44.1649C53.7326 44.4694 53.4422 44.7738 53.1481 45.0661C53.029 45.1838 52.9099 45.2975 52.7907 45.4152C52.4668 45.7278 53.3008 44.9606 53.07 45.1595C53.0141 45.2082 52.962 45.2569 52.9061 45.3056C52.787 45.4071 52.6642 45.5086 52.5413 45.606C52.4594 45.6709 52.37 45.7278 52.2881 45.7968C52.0499 45.9957 52.8503 45.5694 52.4259 45.7156C52.4557 45.7075 53.1444 45.5086 52.7051 45.606C53.0513 45.5289 53.23 45.5004 53.539 45.4964C54.0826 45.4923 53.9262 45.4964 53.8071 45.4923C53.5763 45.4761 54.5628 45.6709 54.3208 45.5938C54.0379 45.5004 54.9165 45.9429 54.6745 45.7562C54.4958 45.6222 54.991 46.1621 54.924 45.9916C54.8867 45.8982 54.7862 45.8049 54.7378 45.7075L54.95 46.154C54.641 45.4923 54.6112 44.6764 54.5814 43.9457L54.6001 44.445C54.4847 41.3072 54.8867 38.1694 54.9426 35.0356C54.9649 33.6677 55.017 32.1779 54.6634 30.8465C54.5331 30.3472 54.3208 29.8114 53.9746 29.4501C52.8652 28.2892 51.1117 28.3703 49.7231 28.7884C45.7209 29.99 43.8297 34.4633 42.2289 38.2141C40.6131 41.9973 39.1575 45.8577 37.5678 49.6531C36.9014 51.2402 36.2238 52.8315 35.442 54.3577C35.1628 54.9057 34.8575 55.4253 34.5336 55.9409C34.8017 55.5106 34.8426 55.5106 34.6267 55.7947C34.422 56.0667 34.1986 56.3103 33.9789 56.566C33.7965 56.773 34.1874 56.3711 34.1762 56.3833C34.1018 56.4442 33.871 56.5863 34.2321 56.363C34.422 56.2453 34.6304 56.1519 34.8426 56.0911C34.7682 56.1114 35.5425 55.9815 35.2708 56.0058C34.999 56.0302 35.7734 56.0058 35.6952 56.0058C35.6058 56.0058 35.3899 55.9571 35.8031 56.0342C36.2164 56.1114 36.0116 56.0748 35.9186 56.0423C35.9632 56.0586 36.3839 56.3184 36.1605 56.1479C36.101 56.1032 35.7548 55.8313 36.0228 56.0667C36.276 56.2859 36.0079 56.0261 35.9521 55.9571C35.7957 55.7541 35.6654 55.5309 35.5463 55.2995L35.7585 55.746C35.2596 54.6987 35.1181 53.5703 35.066 52.4052L35.0846 52.9045C34.9171 48.7154 35.3341 44.5019 36.0005 40.3776C36.6929 36.0992 37.6832 31.8694 38.9788 27.7614C39.057 27.5179 39.1351 27.2784 39.2133 27.0348C39.3287 26.6817 39.2059 27.0511 39.1873 27.112C39.2319 26.9699 39.2803 26.8278 39.3287 26.6898C39.4851 26.2311 39.6452 25.7724 39.8127 25.3137C40.118 24.4775 40.453 23.6616 40.8179 22.8538C41.6667 20.9744 42.5714 19.1193 43.3085 17.183C44.0456 15.2467 44.8051 13.0507 44.7604 10.883C44.7195 8.87369 44.2318 7.0186 43.2341 5.31371C42.0688 3.32467 40.2036 2.09065 38.0816 1.74968C35.1554 1.2788 31.4474 2.80509 30.5166 6.08903C30.3752 6.59238 30.7735 7.14038 31.1272 7.37988C31.6186 7.7168 32.3818 7.80204 32.9402 7.72492C34.1911 7.55849 35.5537 6.91712 35.9521 5.51261L35.9632 5.50044Z" />
<path d="M37.5193 12.1638C39.3716 8.28416 39.0325 4.09428 36.7619 2.80548C34.4913 1.51668 31.149 3.61701 29.2967 7.49669C27.4444 11.3764 27.7836 15.5663 30.0542 16.8551C32.3248 18.1439 35.667 16.0435 37.5193 12.1638Z"  stroke="none" stroke-miterlimit="10"/>
<path d="M76.0353 36.3825C75.7599 35.2296 77.141 32.8387 78.5669 31.6859C80.1343 30.4194 82.234 31.0486 82.878 32.4206C83.5221 33.7967 82.6025 35.6234 80.9012 36.6625C79.1923 37.7058 76.4002 37.9047 76.0353 36.3825Z"  stroke="#none" stroke-miterlimit="10"/>
</g>
</svg>
</div></a>
<div className={`reader__sidebar-menu ${showComponent1 ? 'show' : 'hide'}`}>

      {showComponent1 ? <SidebarMenu book_id={book_id}/> : <SidebarMenu2 />} 
  </div> 
    </div>
  );
};

function SidebarMenu() {
  const [chapters, setChapters] = useState([]);
  const { book_id } = useParams();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const booksResponse = await axios.get(`${apiUrl}/api/reader/${book_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (booksResponse.status === 200) {
          setChapters(booksResponse.data);
        } else {
        }
      } catch (error) {
        console.error('Ошибка при получении данных', error);
      }
    };
  
    fetchData();
  }, [book_id, token]);

  return (
    <ul className='reader__sidebar-menu'>
      <li className='chapter-menu'>
      {chapters.map(chapter => (  
        <ul className='chapter-list'>
        <li className="chapters" key={book_id}>
                <a href={`${chapter.id}`} className='chapters'>{chapter.title}</a>
              </li>
        </ul>
      ))}
      </li>
    </ul>
  );
}

function SidebarMenu2() {
  return(
    <div className='reader__sidebar-menu-2'>
    <ul className='reader__sidebar-menu-2'>
        <li className='pool'><button className='pool-button'>
        <div className='sidebar-svg'></div>
          Home</button></li>
        <li className='pool'><button className='pool-button'>
          <div className='sidebar-svg'>
</div>
          Library</button></li>
        <li className='pool'><button className='pool-button'>History</button></li>
        <hr className='reader__sidebar_hr'></hr>
        <div className='book_button'><button className='pool-button'>Books</button></div>
        <hr className='reader__sidebar_hr'></hr>
        <div className='book_button'><button className='pool-button'>Settings</button></div>
        <div className='book_button'><button className='pool-button'>Help</button></div>
    </ul>
  </div>
  )
}

function ButtonMenu () {
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
        <li><button className='reader_icon'><NavItem><DropdownMenu/></NavItem></button></li>
      </ul>
    </div>
  )
}

const FullscreenComponent = ({ children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      // Включение полноэкранного режима
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }
    } else {
      // Выключение полноэкранного режима
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch((err) => console.error("Failed to exit fullscreen:", err));
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
        setIsFullscreen(false);
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
        setIsFullscreen(false);
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (isFullscreen) {
        toggleFullscreen();
      }
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
      <button className='reader_icon' onClick={toggleFullscreen}><svg version="1.0" xmlns="http://www.w3.org/2000/svg"
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
</svg></button>
    </div>
  );
};


function DropdownMenu() {

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
                  <li className='slider'><SliderFontSizer/></li>
                </ul>
              </li>
              <li>
                 <ul>
                  <li className='dropdown-icon'>Icon</li>
                  <li className='dropdown-text'>Text Width</li>
                  <li className='slider'><TextWidthSlider/></li>
                 </ul>
              </li>
              <li>
                 <ul>
                  <li className='dropdown-icon'>Icon</li>
                  <li className='dropdown-text'>Text Width</li>
                  <li className='slider'><LineHeightSlider/></li>
                 </ul>
              </li>
              <li>
                 <ul>
                  <li className='dropdown-icon'>Icon</li>
                  <li className='dropdown-text'>Text Width</li>
                  <li className='slider'><FontSlider/></li>
                 </ul>
                 <ul>
                  <li><ThemeButton/></li>
                 </ul>
              </li>
            </ul>
          </div>

  

        </div>
    </div>
  );
};

function NavItem(props) {

  const [open, setOpen] = useState(true);

  return (
    <li className="nav-item">
      <button href="#" className="icon-button" onClick={() => setOpen(!open)}>
      <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 width="42" height="42" viewBox="0 0 50.000000 50.000000" 
 preserveAspectRatio="xMidYMid meet">

<g transform="translate(0.000000,50.000000) scale(0.100000,-0.100000)"
 stroke="none">
<path d="M210 456 c0 -24 -26 -60 -39 -54 -62 33 -61 33 -84 10 -21 -21 -21
-23 -4 -51 9 -16 17 -31 17 -34 0 -15 -34 -37 -56 -37 -23 0 -25 -3 -22 -37 3
-32 7 -38 34 -45 40 -10 48 -30 26 -68 -16 -28 -16 -30 5 -52 22 -22 24 -22
52 -5 16 9 31 17 34 17 15 0 37 -34 37 -56 0 -23 3 -25 37 -22 32 3 38 7 45
34 10 40 32 49 69 27 28 -17 30 -17 52 5 21 22 21 24 5 52 -22 38 -14 58 26
68 27 7 31 13 34 45 3 34 1 37 -22 37 -22 0 -56 22 -56 37 0 3 8 18 17 34 17
28 17 30 -5 52 -22 21 -24 21 -52 5 -38 -22 -58 -14 -68 26 -7 27 -13 31 -45
34 -34 3 -37 1 -37 -22z m65 -28 c13 -43 55 -60 85 -33 16 14 22 15 35 5 13
-11 13 -15 -2 -41 -22 -38 -6 -74 36 -84 42 -9 41 -38 -1 -50 -43 -13 -60 -55
-33 -85 14 -16 15 -22 5 -35 -11 -13 -15 -13 -41 2 -38 23 -77 6 -85 -37 -9
-41 -40 -41 -49 1 -10 42 -46 58 -84 36 -26 -15 -30 -15 -41 -2 -10 13 -9 19
5 35 27 30 10 72 -33 85 -42 12 -43 41 -1 50 42 10 58 46 36 84 -15 26 -15 30
-2 41 13 10 19 9 35 -5 30 -27 71 -10 84 33 12 42 39 42 51 0z"/>
<path d="M195 305 c-33 -32 -33 -78 0 -110 32 -33 78 -33 110 0 50 49 15 135
-55 135 -19 0 -40 -9 -55 -25z m95 -15 c11 -11 20 -29 20 -40 0 -26 -34 -60
-60 -60 -26 0 -60 34 -60 60 0 11 9 29 20 40 11 11 29 20 40 20 11 0 29 -9 40
-20z"/>
</g>
</svg>
      </button>

      {open && props.children}
    </li>
  );
};





function SliderFontSizer() {
  const [fontSize, setFontSize] = useState(16); 

  const handleFontSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setFontSize(newSize);

    const elements = document.querySelectorAll('.book');
    elements.forEach((element) => {
      element.style.fontSize = `${newSize}px`;
    });
  };

  return (
    <div>
      <input
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
        type="range"
        min="12"
        max="400"
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
      type="range"
      min="0"
      max={fontList.length - 1}
      value={selectedIndex}
      onChange={handleFontChange}
    />
  );
}

const isDarkTheme = window?.matchMedia('(prefers-color-scheme: dark)').matches
const defaultTheme = isDarkTheme ? 'dark' : 'light'

export const useTheme = () => {
  const [theme, setTheme] = useState(
    localStorage.getItem('app-theme') || defaultTheme
  )

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('app-theme', theme)
  }, [theme])

  return { theme, setTheme }
}


function ThemeButton() {
  const { theme, setTheme } = useTheme('')

  const handleLightThemeClick = () => {
    setTheme('light')
  }
  const handleDarkThemeClick = () => {
    setTheme('dark')
  }
  const handleSepiaThemeClick = () => {
    setTheme('sepia')
  }
  return(
    <div><button className='white' onClick={handleLightThemeClick}>Hello</button>
    <button className='black' onClick={handleDarkThemeClick}>Hello</button>
    <button className='sepia' onClick={handleSepiaThemeClick}>Hello</button>
    </div>
    
  )
}

function StudioMain() {






  return (
    <div className='main'>
      <div className='container'>
        <StudioSidebar />
        <div className='reader'>
          <div className='title-studio'>
            <div className='bookname-studio'>The Forgotten Goddes</div>
            <div className='chapter-studio'>/Chapter 1</div>
          </div>
          <StudioNavigation />

        </div>
      </div>
    </div>
  )
}

function StudioSidebar() {

  const [showComponent1, setShowComponent1] = useState(true);

  const toggleComponent = () => {
    setShowComponent1(!showComponent1);
  };

  return (
    <div className='sidebar'>
      <Link to='/'><a><img  src={Logo}></img></a></Link>
      <SidebarStudioMenu />
    </div>
  );
};

function SidebarStudioMenu() {
  return(
    <ul className='reader__sidebar-menu'>
       <li className='chapter-menu'><ul className='chapter-list' >
              <li className="chapters"><button href="#" className='chapters'>Chapter 1</button></li>
              <li className="chapters"><button href="#" className='chapters'>Chapter 2</button></li>
              <li className="chapters"><button href="#" className='chapters'>Chapter 3</button></li>
              <li className="chapters"><button href="#" className='chapters'>Chapter 4</button></li>
            </ul>
        </li>
        </ul>
  )
}


const StudioTextInput = () => {
  const [inputText, setInputText] = useState('');
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

  const handleInputChange = (event) => {
    setInputText(event.target.value);
    updateHistory();
    updateLocalStorage();
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
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, position: 'absolute', top: '100%', left: 0, zIndex: 2 }}>
      <li onClick={() => handleAlignmentChange('right')} style={{ cursor: 'pointer' }}>
      <svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.444 12.608C14.076 13.064 15.3 13.796 16.116 14.804C16.956 15.788 17.376 17.012 17.376 18.476C17.376 20.828 16.62 22.676 15.108 24.02C13.62 25.34 11.46 26 8.628 26H0.06V0.512H7.584C10.488 0.512 12.672 1.1 14.136 2.276C15.6 3.452 16.332 5.12 16.332 7.28C16.332 9.848 15.036 11.624 12.444 12.608ZM3.48 3.392V11.384H7.584C9.264 11.384 10.536 11.048 11.4 10.376C12.288 9.68 12.732 8.648 12.732 7.28C12.732 4.688 11.016 3.392 7.584 3.392H3.48ZM8.628 23.12C10.284 23.12 11.556 22.724 12.444 21.932C13.332 21.14 13.776 19.988 13.776 18.476C13.776 17.084 13.284 16.04 12.3 15.344C11.34 14.624 9.936 14.264 8.088 14.264H3.48V23.12H8.628Z" fill="white"/>
</svg>

      </li>
      <li onClick={() => handleAlignmentChange('center')} style={{ cursor: 'pointer' }}>
      <svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.444 12.608C14.076 13.064 15.3 13.796 16.116 14.804C16.956 15.788 17.376 17.012 17.376 18.476C17.376 20.828 16.62 22.676 15.108 24.02C13.62 25.34 11.46 26 8.628 26H0.06V0.512H7.584C10.488 0.512 12.672 1.1 14.136 2.276C15.6 3.452 16.332 5.12 16.332 7.28C16.332 9.848 15.036 11.624 12.444 12.608ZM3.48 3.392V11.384H7.584C9.264 11.384 10.536 11.048 11.4 10.376C12.288 9.68 12.732 8.648 12.732 7.28C12.732 4.688 11.016 3.392 7.584 3.392H3.48ZM8.628 23.12C10.284 23.12 11.556 22.724 12.444 21.932C13.332 21.14 13.776 19.988 13.776 18.476C13.776 17.084 13.284 16.04 12.3 15.344C11.34 14.624 9.936 14.264 8.088 14.264H3.48V23.12H8.628Z" fill="white"/>
</svg>

      </li>
      <li onClick={() => handleAlignmentChange('left')} style={{ cursor: 'pointer' }}>
      <svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.444 12.608C14.076 13.064 15.3 13.796 16.116 14.804C16.956 15.788 17.376 17.012 17.376 18.476C17.376 20.828 16.62 22.676 15.108 24.02C13.62 25.34 11.46 26 8.628 26H0.06V0.512H7.584C10.488 0.512 12.672 1.1 14.136 2.276C15.6 3.452 16.332 5.12 16.332 7.28C16.332 9.848 15.036 11.624 12.444 12.608ZM3.48 3.392V11.384H7.584C9.264 11.384 10.536 11.048 11.4 10.376C12.288 9.68 12.732 8.648 12.732 7.28C12.732 4.688 11.016 3.392 7.584 3.392H3.48ZM8.628 23.12C10.284 23.12 11.556 22.724 12.444 21.932C13.332 21.14 13.776 19.988 13.776 18.476C13.776 17.084 13.284 16.04 12.3 15.344C11.34 14.624 9.936 14.264 8.088 14.264H3.48V23.12H8.628Z" fill="white"/>
</svg>

      </li>
      <li onClick={() => handleAlignmentChange('justify')} style={{ cursor: 'pointer' }}>
      <svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.444 12.608C14.076 13.064 15.3 13.796 16.116 14.804C16.956 15.788 17.376 17.012 17.376 18.476C17.376 20.828 16.62 22.676 15.108 24.02C13.62 25.34 11.46 26 8.628 26H0.06V0.512H7.584C10.488 0.512 12.672 1.1 14.136 2.276C15.6 3.452 16.332 5.12 16.332 7.28C16.332 9.848 15.036 11.624 12.444 12.608ZM3.48 3.392V11.384H7.584C9.264 11.384 10.536 11.048 11.4 10.376C12.288 9.68 12.732 8.648 12.732 7.28C12.732 4.688 11.016 3.392 7.584 3.392H3.48ZM8.628 23.12C10.284 23.12 11.556 22.724 12.444 21.932C13.332 21.14 13.776 19.988 13.776 18.476C13.776 17.084 13.284 16.04 12.3 15.344C11.34 14.624 9.936 14.264 8.088 14.264H3.48V23.12H8.628Z" fill="white"/>
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
    <div className='book'>
      <div>
        <div>
          <button className='studio-button' onClick={handleToggleBoldClick}><svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.444 12.608C14.076 13.064 15.3 13.796 16.116 14.804C16.956 15.788 17.376 17.012 17.376 18.476C17.376 20.828 16.62 22.676 15.108 24.02C13.62 25.34 11.46 26 8.628 26H0.06V0.512H7.584C10.488 0.512 12.672 1.1 14.136 2.276C15.6 3.452 16.332 5.12 16.332 7.28C16.332 9.848 15.036 11.624 12.444 12.608ZM3.48 3.392V11.384H7.584C9.264 11.384 10.536 11.048 11.4 10.376C12.288 9.68 12.732 8.648 12.732 7.28C12.732 4.688 11.016 3.392 7.584 3.392H3.48ZM8.628 23.12C10.284 23.12 11.556 22.724 12.444 21.932C13.332 21.14 13.776 19.988 13.776 18.476C13.776 17.084 13.284 16.04 12.3 15.344C11.34 14.624 9.936 14.264 8.088 14.264H3.48V23.12H8.628Z" fill="white"/>
</svg>
</button>
          <button className='studio-button' onClick={handleToggleItalicClick}><svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.828 31.572C9.076 31.572 7.444 31.224 5.932 30.528C4.444 29.832 3.232 28.86 2.296 27.612C1.384 26.364 0.928 24.912 0.928 23.256C0.928 22.776 0.964 22.284 1.036 21.78C1.132 21.252 1.276 20.724 1.468 20.196C1.828 19.188 2.392 18.3 3.16 17.532C3.952 16.74 4.864 16.128 5.896 15.696C6.928 15.24 7.972 15.012 9.028 15.012C9.292 15.012 9.544 15.036 9.784 15.084C10.024 15.108 10.264 15.144 10.504 15.192C11.056 15.312 11.584 15.528 12.088 15.84C12.616 16.152 13.048 16.548 13.384 17.028C13.648 17.388 13.876 17.832 14.068 18.36C14.26 18.888 14.356 19.392 14.356 19.872C14.356 20.184 14.272 20.436 14.104 20.628C13.96 20.82 13.792 20.916 13.6 20.916C13.432 20.916 13.264 20.844 13.096 20.7C12.952 20.532 12.844 20.28 12.772 19.944C12.676 19.536 12.616 19.236 12.592 19.044C12.568 18.852 12.412 18.564 12.124 18.18C11.956 17.964 11.716 17.76 11.404 17.568C11.116 17.352 10.84 17.196 10.576 17.1C10 16.908 9.448 16.812 8.92 16.812C8.104 16.812 7.3 16.992 6.508 17.352C5.74 17.688 5.056 18.156 4.456 18.756C3.88 19.356 3.46 20.04 3.196 20.808C2.884 21.672 2.728 22.512 2.728 23.328C2.728 24.648 3.1 25.8 3.844 26.784C4.588 27.744 5.572 28.488 6.796 29.016C8.044 29.544 9.388 29.808 10.828 29.808C12.46 29.808 13.84 29.508 14.968 28.908C16.12 28.308 17.068 27.516 17.812 26.532C18.556 25.524 19.144 24.408 19.576 23.184C20.008 21.936 20.332 20.676 20.548 19.404C20.764 18.108 20.908 16.884 20.98 15.732C20.476 15.876 19.972 15.948 19.468 15.948C18.556 15.948 17.68 15.732 16.84 15.3C16.024 14.844 15.364 14.22 14.86 13.428C14.356 12.636 14.104 11.7 14.104 10.62C14.104 10.068 14.176 9.492 14.32 8.892C14.488 8.292 14.74 7.656 15.076 6.984C15.604 5.976 16.324 5.1 17.236 4.356C18.172 3.612 19.204 3 20.332 2.52C21.484 2.04 22.624 1.716 23.752 1.548C23.968 1.356 24.268 1.128 24.652 0.864C25.036 0.599999 25.36 0.443999 25.624 0.395999C25.72 0.372 25.804 0.36 25.876 0.36C25.972 0.335999 26.056 0.323998 26.128 0.323998C26.584 0.323998 26.92 0.467998 27.136 0.755999C27.352 1.02 27.46 1.32 27.46 1.656C27.46 1.968 27.364 2.28 27.172 2.592C26.98 2.88 26.68 3.048 26.272 3.096L25.804 3.168C25.612 3.192 25.408 3.204 25.192 3.204C25 3.18 24.808 3.18 24.616 3.204C23.944 3.996 23.476 4.968 23.212 6.12C22.972 7.272 22.852 8.316 22.852 9.252V12.168C22.948 12.048 23.02 11.94 23.068 11.844C23.14 11.724 23.212 11.604 23.284 11.484C23.332 11.34 23.416 11.184 23.536 11.016C23.8 10.728 24.076 10.584 24.364 10.584C24.628 10.584 24.832 10.704 24.976 10.944C25.144 11.16 25.192 11.436 25.12 11.772C25.096 11.94 24.988 12.168 24.796 12.456C24.628 12.744 24.436 13.032 24.22 13.32C24.028 13.584 23.872 13.788 23.752 13.932C23.44 14.292 23.14 14.58 22.852 14.796C22.804 16.26 22.66 17.772 22.42 19.332C22.204 20.892 21.844 22.404 21.34 23.868C20.836 25.308 20.14 26.604 19.252 27.756C18.364 28.932 17.236 29.856 15.868 30.528C14.5 31.224 12.832 31.572 10.864 31.572H10.828ZM19.288 14.184C19.888 14.184 20.476 14.04 21.052 13.752C21.076 13.008 21.088 12.264 21.088 11.52C21.088 10.752 21.088 9.996 21.088 9.252C21.088 8.364 21.172 7.44 21.34 6.48C21.508 5.496 21.796 4.572 22.204 3.708C21.124 4.068 20.044 4.608 18.964 5.328C17.908 6.024 17.152 6.852 16.696 7.812C16.48 8.268 16.3 8.736 16.156 9.216C16.012 9.696 15.94 10.176 15.94 10.656C15.94 11.808 16.276 12.684 16.948 13.284C17.62 13.884 18.4 14.184 19.288 14.184Z" fill="white"/>
</svg>
</button>
          <button className='studio-button' onClick={handleToggleUnderlineClick}><svg width="26" height="32" viewBox="0 0 26 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.264 0.512V17.72C6.264 19.64 6.804 21.056 7.884 21.968C8.988 22.856 10.608 23.3 12.744 23.3C14.88 23.3 16.5 22.868 17.604 22.004C18.708 21.14 19.26 19.772 19.26 17.9V0.512H22.716V17.9C22.716 20.564 21.888 22.628 20.232 24.092C18.576 25.556 16.08 26.288 12.744 26.288C9.408 26.288 6.912 25.556 5.256 24.092C3.624 22.628 2.808 20.564 2.808 17.9V0.512H6.264Z" fill="white"/>
<path d="M0 29.6H25.524V31.4H0V29.6Z" fill="white"/>
</svg>
</button>
          <button className='studio-button' onClick={handleToggleStrikethroughClick}><svg width="20" height="27" viewBox="0 0 20 27" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.664 22.04C2.856 22.112 3.348 22.316 4.14 22.652C4.932 22.988 5.76 23.264 6.624 23.48C7.512 23.672 8.388 23.768 9.252 23.768C10.86 23.768 12.132 23.384 13.068 22.616C14.004 21.824 14.472 20.744 14.472 19.376C14.472 18.44 14.232 17.684 13.752 17.108C13.296 16.532 12.708 16.088 11.988 15.776C11.268 15.464 10.308 15.128 9.108 14.768C7.596 14.312 6.384 13.868 5.472 13.436C4.584 13.004 3.816 12.332 3.168 11.42C2.544 10.508 2.232 9.284 2.232 7.748C2.232 5.612 2.952 3.884 4.392 2.564C5.856 1.244 8.028 0.583999 10.908 0.583999C12.876 0.583999 14.976 1.052 17.208 1.988L16.38 4.76C14.34 3.92 12.552 3.5 11.016 3.5C9.36 3.5 8.076 3.848 7.164 4.544C6.252 5.216 5.808 6.14 5.832 7.316C5.832 8.228 6.06 8.96 6.516 9.512C6.996 10.064 7.572 10.496 8.244 10.808C8.94 11.12 9.864 11.456 11.016 11.816C12.552 12.296 13.776 12.776 14.688 13.256C15.6 13.736 16.38 14.468 17.028 15.452C17.7 16.412 18.036 17.72 18.036 19.376C18.036 21.728 17.244 23.54 15.66 24.812C14.1 26.06 12.012 26.684 9.396 26.684C7.884 26.684 6.552 26.516 5.4 26.18C4.272 25.868 3.036 25.436 1.692 24.884L2.664 22.04Z" fill="white"/>
<path d="M0 14.912H19.728V16.712H0V14.912Z" fill="white"/>
</svg>
</button>
<div style={{ display: 'inline-block', position: 'relative' }}>
            <button className='studio-button' onClick={handleAlignButtonClick}><svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.444 12.608C14.076 13.064 15.3 13.796 16.116 14.804C16.956 15.788 17.376 17.012 17.376 18.476C17.376 20.828 16.62 22.676 15.108 24.02C13.62 25.34 11.46 26 8.628 26H0.06V0.512H7.584C10.488 0.512 12.672 1.1 14.136 2.276C15.6 3.452 16.332 5.12 16.332 7.28C16.332 9.848 15.036 11.624 12.444 12.608ZM3.48 3.392V11.384H7.584C9.264 11.384 10.536 11.048 11.4 10.376C12.288 9.68 12.732 8.648 12.732 7.28C12.732 4.688 11.016 3.392 7.584 3.392H3.48ZM8.628 23.12C10.284 23.12 11.556 22.724 12.444 21.932C13.332 21.14 13.776 19.988 13.776 18.476C13.776 17.084 13.284 16.04 12.3 15.344C11.34 14.624 9.936 14.264 8.088 14.264H3.48V23.12H8.628Z" fill="white"/>
</svg>
</button>
            {showAlignmentOptions && renderAlignmentOptions()}
          </div>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button className='studio-button' onClick={handleColorPickerClick} style={{ backgroundColor: textColor }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: textColor }}></div>
            </button>
            {showColorPicker && (
              <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 2 }}>
                <ChromePicker className='studio-button' color={textColor} onChange={(color) => handleColorChange(color)} />
              </div>
            )}
          </div>
          <button className='studio-button' onClick={handleClearClick}><svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.444 12.608C14.076 13.064 15.3 13.796 16.116 14.804C16.956 15.788 17.376 17.012 17.376 18.476C17.376 20.828 16.62 22.676 15.108 24.02C13.62 25.34 11.46 26 8.628 26H0.06V0.512H7.584C10.488 0.512 12.672 1.1 14.136 2.276C15.6 3.452 16.332 5.12 16.332 7.28C16.332 9.848 15.036 11.624 12.444 12.608ZM3.48 3.392V11.384H7.584C9.264 11.384 10.536 11.048 11.4 10.376C12.288 9.68 12.732 8.648 12.732 7.28C12.732 4.688 11.016 3.392 7.584 3.392H3.48ZM8.628 23.12C10.284 23.12 11.556 22.724 12.444 21.932C13.332 21.14 13.776 19.988 13.776 18.476C13.776 17.084 13.284 16.04 12.3 15.344C11.34 14.624 9.936 14.264 8.088 14.264H3.48V23.12H8.628Z" fill="white"/>
</svg>
</button>
          <button className='studio-button' onClick={toggleFullscreen}><svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.444 12.608C14.076 13.064 15.3 13.796 16.116 14.804C16.956 15.788 17.376 17.012 17.376 18.476C17.376 20.828 16.62 22.676 15.108 24.02C13.62 25.34 11.46 26 8.628 26H0.06V0.512H7.584C10.488 0.512 12.672 1.1 14.136 2.276C15.6 3.452 16.332 5.12 16.332 7.28C16.332 9.848 15.036 11.624 12.444 12.608ZM3.48 3.392V11.384H7.584C9.264 11.384 10.536 11.048 11.4 10.376C12.288 9.68 12.732 8.648 12.732 7.28C12.732 4.688 11.016 3.392 7.584 3.392H3.48ZM8.628 23.12C10.284 23.12 11.556 22.724 12.444 21.932C13.332 21.14 13.776 19.988 13.776 18.476C13.776 17.084 13.284 16.04 12.3 15.344C11.34 14.624 9.936 14.264 8.088 14.264H3.48V23.12H8.628Z" fill="white"/>
</svg>
</button>
          <button className='studio-button' onClick={handleUndoClick}><svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.444 12.608C14.076 13.064 15.3 13.796 16.116 14.804C16.956 15.788 17.376 17.012 17.376 18.476C17.376 20.828 16.62 22.676 15.108 24.02C13.62 25.34 11.46 26 8.628 26H0.06V0.512H7.584C10.488 0.512 12.672 1.1 14.136 2.276C15.6 3.452 16.332 5.12 16.332 7.28C16.332 9.848 15.036 11.624 12.444 12.608ZM3.48 3.392V11.384H7.584C9.264 11.384 10.536 11.048 11.4 10.376C12.288 9.68 12.732 8.648 12.732 7.28C12.732 4.688 11.016 3.392 7.584 3.392H3.48ZM8.628 23.12C10.284 23.12 11.556 22.724 12.444 21.932C13.332 21.14 13.776 19.988 13.776 18.476C13.776 17.084 13.284 16.04 12.3 15.344C11.34 14.624 9.936 14.264 8.088 14.264H3.48V23.12H8.628Z" fill="white"/>
</svg>
</button>
          <button className='studio-button' onClick={handleRedoClick}><svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.444 12.608C14.076 13.064 15.3 13.796 16.116 14.804C16.956 15.788 17.376 17.012 17.376 18.476C17.376 20.828 16.62 22.676 15.108 24.02C13.62 25.34 11.46 26 8.628 26H0.06V0.512H7.584C10.488 0.512 12.672 1.1 14.136 2.276C15.6 3.452 16.332 5.12 16.332 7.28C16.332 9.848 15.036 11.624 12.444 12.608ZM3.48 3.392V11.384H7.584C9.264 11.384 10.536 11.048 11.4 10.376C12.288 9.68 12.732 8.648 12.732 7.28C12.732 4.688 11.016 3.392 7.584 3.392H3.48ZM8.628 23.12C10.284 23.12 11.556 22.724 12.444 21.932C13.332 21.14 13.776 19.988 13.776 18.476C13.776 17.084 13.284 16.04 12.3 15.344C11.34 14.624 9.936 14.264 8.088 14.264H3.48V23.12H8.628Z" fill="white"/>
</svg>
</button>
          <button className='studio-button'><NavItem><StudioDropdownMenu/></NavItem></button>
          <select className='studio-select-button' onChange={handleSelectChange}>
            <option value="option1">Not Published</option>
            <option value="option2">Publish Chapter</option>
            <option value="option3">Publish Book</option>
          </select>
        </div>
      </div>
      <div className='textstudio'>
        <ContentEditable
          className='textstudio-input'
          html={inputText}
          onChange={handleInputChange}
          innerRef={contentEditableRef}
          style={{ textAlign: alignment, color: textColor, ...style }}
        />
      </div>
    </div>
  );
};

function StudioNavigation() {
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
                      {activeTab === 'tab1' && <StudioTextInput />}
                      {activeTab === 'tab2' && <BookContent />}
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

export default App;
