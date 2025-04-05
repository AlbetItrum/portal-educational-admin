import React from 'react'
import img500 from './500.png';
import img403 from './403.png';
import img404 from './404.png';

let img_obj = {img500, img403, img404};

class NotFound extends React.Component {

  render() {
    let {code = 404} = this.props;

    let img = img_obj['img' + code] || img_obj['img404']
    return (<div className="text-center">
      <img src={img} height={250}></img>
      <h2>
        Opps... Something went wrong ...
      </h2>
    </div>)
  }

}

export default NotFound
