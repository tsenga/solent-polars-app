import React, { useState } from 'react';
import './WindSpeedSelector.css';
import { 
  Box, Typography, Button, TextField, Paper,
  Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';

const WindSpeedSelector = ({ 
  windSpeeds, 
  selectedWindSpeeds, 
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
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom align="center">
        Wind Speed
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
        {windSpeeds.map(speed => (
          <Chip
            key={speed}
            label={`${speed} knots`}
            onClick={() => {
              // Toggle selection
              if (selectedWindSpeeds.includes(speed)) {
                // Don't allow deselecting the last wind speed
                if (selectedWindSpeeds.length > 1) {
                  onSelectWindSpeed(selectedWindSpeeds.filter(s => s !== speed));
                }
              } else {
                onSelectWindSpeed([...selectedWindSpeeds, speed]);
              }
            }}
            onDelete={() => onDeleteWindSpeed(speed)}
            color={selectedWindSpeeds.includes(speed) ? "primary" : "default"}
            variant={selectedWindSpeeds.includes(speed) ? "filled" : "outlined"}
            sx={{ m: 0.5 }}
          />
        ))}
        
        <Button 
          variant="outlined" 
          color="success" 
          startIcon={<Add />}
          onClick={() => setShowAddForm(true)}
          size="small"
          sx={{ m: 0.5 }}
        >
          Add Wind Speed
        </Button>
      </Box>
      
      <Dialog open={showAddForm} onClose={() => setShowAddForm(false)}>
        <DialogTitle>Add New Wind Speed</DialogTitle>
        <form onSubmit={handleAddWindSpeed}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Wind Speed (knots)"
              type="number"
              fullWidth
              variant="outlined"
              value={newWindSpeed}
              onChange={(e) => setNewWindSpeed(e.target.value)}
              inputProps={{ min: 1, step: 1 }}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddForm(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" color="primary" variant="contained">
              Add
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  );
};

export default WindSpeedSelector;
