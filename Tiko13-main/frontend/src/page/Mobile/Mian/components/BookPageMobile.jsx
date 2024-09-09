import React, {useState, useEffect, useHistory, useCallback, useRef, useLayoutEffect,createContext, useContext} from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate, NavLink, useParams,useLocation, Switch, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import apiUrl from '../../../../apiUrl';
import { jwtDecode } from 'jwt-decode';



function BookPageMobile() {
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
          const response = await axios.get(`${apiUrl}/api/book_detail/${book_id}/content`); 
          if (response.status === 200 && Array.isArray(response.data)) {

            setItems(response.data);
            console.log(response)
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
        await axios.post(`http://127.0.0.1:8000/users/api/${author}/follow/`, {}, {
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
        const response = await axios.get(`http://127.0.0.1:8000/users/api/${username}/following/`, {
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
            <div className='bookpage__coverpage_mobile' style={{ backgroundImage: `url(${bookData.coverpage})` }}>
            <div class="bookpage__menu_mobile">
              <div className='vol'>Vol. {bookData.volume_number}</div>
              <div className='download_mobile'><svg  viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7.293,13.707a1,1,0,1,1,1.414-1.414L11,14.586V3a1,1,0,0,1,2,0V14.586l2.293-2.293a1,1,0,0,1,1.414,1.414l-4,4a1,1,0,0,1-.325.216.986.986,0,0,1-.764,0,1,1,0,0,1-.325-.216ZM22,12a1,1,0,0,0-1,1v7H3V13a1,1,0,0,0-2,0v8a1,1,0,0,0,1,1H22a1,1,0,0,0,1-1V13A1,1,0,0,0,22,12Z"/></svg></div>
              <button className='add_button_mobile'>Add</button>
              <Link to={`/reader/${book_id}/chapter/`}><div className='Read_button_mobile'>Read</div></Link>
              <div className='bookpage_votes_mobile'><svg width="15px" height="15px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5C13 20.5 14 19.7294 15.0383 18.9109C17.9806 16.5914 22 14 22 9.1371C22 4.27416 16.4998 0.825464 12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371Z" fill="#ffffff"/>
</svg>{bookData.upvotes}</div>
              <div className='bookpage_votes_mobile'><svg fill="#ffffff" height="15px" width="15px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
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
<button className='share_button_mobile'><svg height="15px" width="15px" fill='#ffffff' version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
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
          <div key={itemIndex} className='chapter_item_mobile'>
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

  const Star = ({ filled, half }) => {
    const fillColor = filled ? '#BD00FF' : 'none';
    const halfColor = half ? 'url(#half)' : 'none';
  
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
      <div className='star_line' style={{ display: 'flex' }}>
        {stars}
      </div>
    );
  };

export default BookPageMobile;