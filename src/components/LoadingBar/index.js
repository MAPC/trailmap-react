import React from 'react';
import '../../styles/LoadingBar.scss';

const LoadingBar = ({ isLoading, progress = 0, message = "Loading..." }) => {
  if (!isLoading) return null;

  return (
    <div className="LoadingBar">
      <div className="LoadingBar__overlay">
        <div className="LoadingBar__content">
          <div className="LoadingBar__spinner">
            <div className="LoadingBar__spinner-inner"></div>
          </div>
          <div className="LoadingBar__message">{message}</div>
          {progress > 0 && (
            <div className="LoadingBar__progress">
              <div 
                className="LoadingBar__progress-bar" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingBar;
