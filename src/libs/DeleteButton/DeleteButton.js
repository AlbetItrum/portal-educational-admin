import React from 'react'
import ReactExtender from './../ReactExtender/ReactExtender';
//let {ReactExtender} = window.my;

class DeleteButton extends ReactExtender {

  render() {
    return (<div className="pull-right absolute-delete" style={{opacity: this.props.opacity || 1}} onClick={(e) => this.props.onClick && this.props.onClick(e)}>
       <i className="fa fa-times"></i>
    </div>)
  }

}

global.DeleteButton = DeleteButton;

export default DeleteButton
