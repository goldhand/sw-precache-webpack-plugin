import React from 'react';
import {Route, IndexRoute, Redirect} from 'react-router';

import App from './components/App';
import CounterApp from './containers/CounterApp';
import CoolCat from './components/CoolCat';


export default (
  <Route path="/" component={App}>
    <IndexRoute component={CounterApp} />
    <Route path="cool-cat" component={CoolCat} />
    <Redirect from="*" to="/" />
  </Route>
);
