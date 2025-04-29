import React, { useState } from 'react';
import './PolarDataTable.css';

const PolarDataTable = ({ 
  data, 
  windSpeed, 
  availableWindSpeeds,
  onChangeWindSpeed,
  onUpdateBoatSpeed, 
  onAddAngleEntry, 
  onDeleteAngleEntry 
}) => {
  const [newAngle, setNewAngle] = useState('');
  const [newSpeed, setNewSpeed] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleAddEntry = (e) => {
    e.preventDefault();
    const angleValue = parseInt(newAngle, 10);
    const speedValue = parseFloat(newSpeed);
    
    if (isNaN(angleValue) || isNaN(speedValue)) {
      alert('Please enter valid numbers');
      return;
    }
    
    if (angleValue < 0 || angleValue > 180) {
      alert('Angle must be between 0 and 180 degrees');
      return;
    }
    
    if (speedValue < 0) {
      alert('Boat speed cannot be negative');
      return;
    }
    
    onAddAngleEntry(angleValue, speedValue);
    setNewAngle('');
    setNewSpeed('');
  };

  const startEditing = (angle, currentSpeed) => {
    setEditingCell(angle);
    setEditValue(currentSpeed.toString());
  };

  const saveEdit = () => {
    const speedValue = parseFloat(editValue);
    if (isNaN(speedValue) || speedValue < 0) {
      alert('Please enter a valid positive number');
      return;
    }
    
    onUpdateBoatSpeed(editingCell, speedValue);
    setEditingCell(null);
  };

  const cancelEdit = () => {
    setEditingCell(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="polar-data-table">
      <div className="table-header">
        <h2>Polar Data</h2>
        <div className="wind-speed-selector">
          <label htmlFor="edit-wind-speed">Editing Wind Speed: </label>
          <select 
            id="edit-wind-speed" 
            value={windSpeed}
            onChange={(e) => onChangeWindSpeed(Number(e.target.value))}
          >
            {availableWindSpeeds.map(speed => (
              <option key={speed} value={speed}>{speed} knots</option>
            ))}
          </select>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Angle (°)</th>
            <th>Boat Speed (knots)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.angle}>
              <td>{item.angle}°</td>
              <td>
                {editingCell === item.angle ? (
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                ) : (
                  <span onClick={() => startEditing(item.angle, item.boatSpeed)}>
                    {item.boatSpeed}
                  </span>
                )}
              </td>
              <td>
                {editingCell === item.angle ? (
                  <>
                    <button onClick={saveEdit}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEditing(item.angle, item.boatSpeed)}>Edit</button>
                    <button 
                      onClick={() => onDeleteAngleEntry(item.angle)}
                      disabled={item.angle === 0 || item.angle === 180}
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <form onSubmit={handleAddEntry} className="add-entry-form">
        <h3>Add New Entry</h3>
        <div className="form-group">
          <label>
            Angle (°):
            <input
              type="number"
              min="0"
              max="180"
              step="1"
              value={newAngle}
              onChange={(e) => setNewAngle(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="form-group">
          <label>
            Boat Speed (knots):
            <input
              type="number"
              min="0"
              step="0.1"
              value={newSpeed}
              onChange={(e) => setNewSpeed(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit">Add Entry</button>
      </form>
    </div>
  );
};

export default PolarDataTable;
