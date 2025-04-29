import React, { useState } from 'react';
import './WindSpeedSelector.css';

const WindSpeedSelector = ({ 
  windSpeeds, 
  selectedWindSpeed, 
  onSelectWindSpeed,
  onAddWindSpeed,
  onDeleteWindSpeed
}) => {
  const [newWindSpeed, setNewWindSpeed] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddWindSpeed = (e) => {
    e.preventDefault();
    const speedValue = parseInt(newWindSpeed, 10);
    
    if (isNaN(speedValue) || speedValue <= 0) {
      alert('Please enter a valid positive number');
      return;
    }
    
    onAddWindSpeed(speedValue);
    setNewWindSpeed('');
    setShowAddForm(false);
  };

  return (
    <div className="wind-speed-selector">
      <h2>Wind Speed</h2>
      <div className="speed-buttons">
        {windSpeeds.map(speed => (
          <div key={speed} className="speed-button-container">
            <button
              className={`speed-button ${selectedWindSpeed === speed ? 'selected' : ''}`}
              onClick={() => onSelectWindSpeed(speed)}
            >
              {speed} knots
            </button>
            <button 
              className="delete-button"
              onClick={() => onDeleteWindSpeed(speed)}
              title="Delete this wind speed"
            >
              ×
            </button>
          </div>
        ))}
        
        {!showAddForm ? (
          <button 
            className="add-button"
            onClick={() => setShowAddForm(true)}
          >
            + Add Wind Speed
          </button>
        ) : (
          <form onSubmit={handleAddWindSpeed} className="add-speed-form">
            <input
              type="number"
              min="1"
              step="1"
              value={newWindSpeed}
              onChange={(e) => setNewWindSpeed(e.target.value)}
              placeholder="Enter wind speed"
              required
              autoFocus
            />
            <button type="submit">Add</button>
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default WindSpeedSelector;
