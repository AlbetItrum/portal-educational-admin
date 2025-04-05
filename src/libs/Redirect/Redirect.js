import React from 'react';
import {withRouter} from 'react-router-dom'


class Redirect extends React.Component {

  constructor(props) {
    super(props);
   // console.log'*........ ## herererer', global.user.get_token());
    if (global.user.get_token()) {
      this.props.history.push(global.env.redirect_after_login || '/admin/content')
    } else {
      this.props.history.push('/login')
    }

  }


  render() {
    return (<div>11</div>)
  }

}

global.Redirect = withRouter(Redirect)

export default Redirect;
