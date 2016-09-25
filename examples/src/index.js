import React from 'react';
import ReactDOM from 'react-dom';
import App from 'components/App';
import {Provider} from 'react-redux';

import {createStore} from 'redux';
import rootReducer from './reducers';


const
  STORE = createStore(rootReducer),
  ROOT_ELEMENT = 'main';


// handle client side rendering
if (typeof document !== 'undefined') {

  ReactDOM.render(
    <Provider store={STORE}>
      <App />
    </Provider>,
    document.getElementById(ROOT_ELEMENT)
  );
}
