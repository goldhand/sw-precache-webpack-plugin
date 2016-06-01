import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as CounterActions from '../actions/counterActions';
import Counter from '../components/Counter';


class CounterApp extends Component {

  static propTypes = {
    value: PropTypes.number.isRequired,
    actions: PropTypes.object.isRequired,
  }

  render() {
    return (
      <div>
        <Counter
          value={this.props.value}
          {...this.props.actions}
        />
      </div>
    );
  }
}
function mapStateToProps(state) {
  return {
    value: state.counter,
  };
}
function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(CounterActions, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CounterApp);
