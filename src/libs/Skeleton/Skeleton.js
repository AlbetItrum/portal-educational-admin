import React from 'react'
import './skeleton.css'

class Skeleton extends React.Component {


  render() {

    let {width = '100%', height = '10', key, title, label} = this.props;
    height = height + 'px';

    return <div style={{width}} title={key || title} className={'skeleton-wrap'}>
      {label && <small>{label}</small>}
      <div className="skeleton" style={{height}}>
      </div>
      <div className="skeleton skeleton-second" style={{height}}>
      </div>
      <div className="skeleton skeleton-third" style={{height}}>
      </div>
    </div>
  }

}

// global.Table = Table;

export default Skeleton
