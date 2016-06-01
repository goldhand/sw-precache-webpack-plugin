import './Counter.less';

import React, {PropTypes, Component} from 'react';


export default class Counter extends Component {

  static propTypes = {
    value: PropTypes.number.isRequired,
    incrementCounter: PropTypes.func.isRequired,
    decrementCounter: PropTypes.func.isRequired,
  }

  render() {
    return (
      <div className="counter">
        <h1>Counter: {this.props.value}</h1>
        <button onClick={this.props.incrementCounter}>+</button>
        <button onClick={this.props.decrementCounter}>-</button>
      </div>
    );
  }
}
