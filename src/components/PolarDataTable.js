import React, { useState } from 'react';
import './PolarDataTable.css';
import {
  Paper, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton,
  TextField, Button, FormControl, InputLabel, Select,
  MenuItem, Divider
} from '@mui/material';
import { Edit, Delete, Save, Cancel } from '@mui/icons-material';

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
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Polar Data
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="edit-wind-speed-label">Editing Wind Speed</InputLabel>
          <Select
            labelId="edit-wind-speed-label"
            id="edit-wind-speed"
            value={windSpeed}
            label="Editing Wind Speed"
            onChange={(e) => onChangeWindSpeed(Number(e.target.value))}
          >
            {availableWindSpeeds.map(speed => (
              <MenuItem key={speed} value={speed}>{speed} knots</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
        Only anchor points are shown. The chart displays a smooth curve through these points.
      </Typography>
      
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Angle (°)</TableCell>
              <TableCell>Boat Speed (knots)</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.filter(item => item.isAnchor).map((item) => (
              <TableRow key={item.angle} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">
                  {item.angle}°
                </TableCell>
                <TableCell>
                  {editingCell === item.angle ? (
                    <TextField
                      type="number"
                      size="small"
                      inputProps={{ 
                        step: "0.1",
                        min: "0"
                      }}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      sx={{ width: '100px' }}
                    />
                  ) : (
                    <Typography 
                      variant="body2" 
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', borderRadius: 1, p: 0.5 } }}
                      onClick={() => startEditing(item.angle, item.boatSpeed)}
                    >
                      {item.boatSpeed}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  {editingCell === item.angle ? (
                    <>
                      <IconButton size="small" color="primary" onClick={saveEdit} title="Save">
                        <Save fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={cancelEdit} title="Cancel">
                        <Cancel fontSize="small" />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => startEditing(item.angle, item.boatSpeed)}
                        title="Edit"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => onDeleteAngleEntry(item.angle)}
                        disabled={item.angle === 0 || item.angle === 180}
                        title="Delete"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Divider sx={{ my: 2 }} />
      
      <Box component="form" onSubmit={handleAddEntry} sx={{ mt: 3 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          Add New Entry
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
          <TextField
            label="Angle (°)"
            type="number"
            InputProps={{ 
              inputProps: { 
                min: 0,
                max: 180,
                step: 1
              } 
            }}
            value={newAngle}
            onChange={(e) => setNewAngle(e.target.value)}
            required
            fullWidth
          />
          
          <TextField
            label="Boat Speed (knots)"
            type="number"
            InputProps={{ 
              inputProps: { 
                min: 0,
                step: 0.1
              } 
            }}
            value={newSpeed}
            onChange={(e) => setNewSpeed(e.target.value)}
            required
            fullWidth
          />
        </Box>
        
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
        >
          Add Entry
        </Button>
      </Box>
    </Paper>
  );
};

export default PolarDataTable;
