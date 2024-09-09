import React, {useState, useEffect, useHistory, useCallback, useRef, useLayoutEffect,createContext, useContext} from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate, NavLink, useParams,useLocation, Switch, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import BookLibraryItem from './BookLibraryItem'

function LoginLibrary({ onWidthToggle }) {
    const [activeTab, setActiveTab] = useState('tab1');
  
    const handleTabClick = (tabId) => {
      setActiveTab(tabId);
    };

    return (
      <div className="library_log_mobile">
        <ul className="library_log_nav">
          <li className={activeTab === 'tab1' ? 'active' : ''}><a onClick={() => handleTabClick('tab1')}>All</a></li>
          <li className={activeTab === 'tab2' ? 'active' : ''}><a onClick={() => handleTabClick('tab2')}>Reading</a></li>
          <li className={activeTab === 'tab3' ? 'active' : ''}><a onClick={() => handleTabClick('tab3')}>Liked</a></li>
          <li className={activeTab === 'tab4' ? 'active' : ''}><a onClick={() => handleTabClick('tab4')}>Wish list</a></li>
          <li className={activeTab === 'tab5' ? 'active' : ''}><a onClick={() => handleTabClick('tab5')}>Favorites</a></li>
          <li className={activeTab === 'tab6' ? 'active' : ''}><a onClick={() => handleTabClick('tab6')}>Finished</a></li>
        </ul>
        <div className='library_log_content'>   
          {activeTab === 'tab1' && <BookLibraryItem filterBy=''/>}
          {activeTab === 'tab2' && <BookLibraryItem filterBy='reading'/>}
          {activeTab === 'tab3' && <BookLibraryItem filterBy='liked'/>}
          {activeTab === 'tab4' && <BookLibraryItem filterBy='wish_list'/>}
          {activeTab === 'tab5' && <BookLibraryItem filterBy='favorites'/>}
          {activeTab === 'tab6' && <BookLibraryItem filterBy='finished'/>}
        </div>
      </div>
    );
  }
  
  export default LoginLibrary;