import {combineReducers} from 'redux';
// import all app reducers
import counter from './counter';


const rootReducer = combineReducers({
  counter,
});

export default rootReducer;
