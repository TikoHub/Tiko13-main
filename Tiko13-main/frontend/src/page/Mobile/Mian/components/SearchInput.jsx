import React, {useState, useEffect, useHistory, useCallback, useRef, useLayoutEffect,createContext, useContext} from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate, NavLink, useParams,useLocation, Switch, useSearchParams } from 'react-router-dom';
import {SearchContext} from '../../../../context/SearchContext.jsx'
import axios from 'axios';

function SearchInput() {
    const { searchQuery, setSearchQuery } = useContext(SearchContext);
    return (
      <input type="text" placeholder="search" className="search-input_mobile" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
    );
  }

export default SearchInput;