import * as types from '../constants/actionTypes';


const initialState = 0;

export default function counter(state = initialState, action) {
  switch (action.type) {
    case types.INCREMENT:
      return state + 1;
    case types.DECREMENT:
      return state - 1;
    default:
      return state;
  }
}
