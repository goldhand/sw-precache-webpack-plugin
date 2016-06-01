import * as types from '../constants/actionTypes';


export function incrementCounter() {
  return {
    type: types.INCREMENT,
  };
}

export function decrementCounter() {
  return {
    type: types.DECREMENT,
  };
}
