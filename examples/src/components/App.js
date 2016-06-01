import React, {PropTypes, Component} from 'react';
import {Link} from 'react-router';


export default class App extends Component {

  static propTypes = {
    children: PropTypes.element.isRequired,
  }

  render() {

    return (
      <main>
        <Link to="cool-cat">Cool cat</Link>
        {this.props.children}
      </main>
    );
  }
}
