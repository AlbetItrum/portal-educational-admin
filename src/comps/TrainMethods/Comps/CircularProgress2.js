import React, {useState} from 'react';
import CircularProgress from '@mui/material/CircularProgress';

export function CircularProgress2(props) {
  return (
      <div className="ProgressCircle" style={{zoom: props.zoom || 1}} title={props.title}>
        <small>{props.name}</small>
        <CircularProgress
            variant="determinate"
            thickness={10}
            value={props.value || 2} // Set your progress value
            size={20} // Set your circle size
        />
      </div>
  );
}


export default CircularProgress2

