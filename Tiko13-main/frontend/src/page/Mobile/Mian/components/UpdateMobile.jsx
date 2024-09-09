import React, {useState, useEffect, useHistory, useCallback, useRef, useLayoutEffect,createContext, useContext} from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate, NavLink, useParams,useLocation, Switch, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import apiUrl from '../../../../apiUrl';
import { jwtDecode } from 'jwt-decode';

function UpdateMobile() {
    const [newsData, setNewsData] = useState([]);
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
  
    return (
      <div className='news_mobile'>
        <div className='news_mobile_views'>
          <div className='views_update'>Updates</div>
          <div className='views_dev'>Dev.'s Blog</div>
        </div>
        <div className='news_mobile_container'>
          {newsData && newsData.map((newsItem, index) => (
            <div key={index} className='news_mobile_content'>
              <div className='news_author_cont'>
                <div className='news_mobile_author'>
                  <img className='news_mobile_userimg' src={newsItem.book.author_profile_img || 'default_profile_img_url'} alt='Author' />
                  <div className='news_mobile_authorname'>{newsItem.book.author_username}</div>
                </div>
                <div className='news_mobile_con'>
                  <div className='news_mobile_text'>
                    {newsItem.book.author_username} added new chapter to:<br/>{newsItem.book.name}
                  </div>
                  {newsItem.updates_list.map((update, updateIndex) => (
                    <div key={updateIndex} className='news_mobile_chapter'>
                      {update.chapter_title || 'Untitled Chapter'}
                    </div>
                  ))}
                </div>
              </div>
              {newsItem.updates_list.map((update, updateIndex) => (
                <div key={updateIndex} className='news_mobile_time'>
                  {update.formatted_timestamp}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
  

  export default UpdateMobile;