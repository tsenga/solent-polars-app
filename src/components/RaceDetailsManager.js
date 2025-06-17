import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import {
  addRace,
  updateRace,
  deleteRace,
  selectRace,
  setIsEditing,
  selectAllRaces,
  selectSelectedRace,
  selectIsEditing,
} from '../store/raceDetailsSlice';

const RaceDetailsManager = () => {
  const dispatch = useDispatch();
  const races = useSelector(selectAllRaces);
  const selectedRace = useSelector(selectSelectedRace);
  const isEditing = useSelector(selectIsEditing);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDateTime: '',
    finishDateTime: '',
  });

  const handleAddRace = () => {
    setFormData({
      name: '',
      startDateTime: '',
      finishDateTime: '',
    });
    setShowAddDialog(true);
  };

  const handleSaveNewRace = () => {
    if (!formData.name || !formData.startDateTime || !formData.finishDateTime) {
      alert('Please fill in all fields');
      return;
    }

    if (new Date(formData.startDateTime) >= new Date(formData.finishDateTime)) {
      alert('Start date/time must be before finish date/time');
      return;
    }

    dispatch(addRace(formData));
    setShowAddDialog(false);
    setFormData({ name: '', startDateTime: '', finishDateTime: '' });
  };

  const handleEditRace = () => {
    if (selectedRace) {
      setFormData({
        name: selectedRace.name,
        startDateTime: selectedRace.startDateTime,
        finishDateTime: selectedRace.finishDateTime,
      });
      dispatch(setIsEditing(true));
    }
  };

  const handleSaveEdit = () => {
    if (!formData.name || !formData.startDateTime || !formData.finishDateTime) {
      alert('Please fill in all fields');
      return;
    }

    if (new Date(formData.startDateTime) >= new Date(formData.finishDateTime)) {
      alert('Start date/time must be before finish date/time');
      return;
    }

    dispatch(updateRace({
      id: selectedRace.id,
      ...formData,
    }));
    dispatch(setIsEditing(false));
  };

  const handleCancelEdit = () => {
    dispatch(setIsEditing(false));
    if (selectedRace) {
      setFormData({
        name: selectedRace.name,
        startDateTime: selectedRace.startDateTime,
        finishDateTime: selectedRace.finishDateTime,
      });
    }
  };

  const handleDeleteRace = (raceId) => {
    if (window.confirm('Are you sure you want to delete this race?')) {
      dispatch(deleteRace(raceId));
    }
  };

  const handleSelectRace = (raceId) => {
    dispatch(selectRace(raceId));
    const race = races.find(r => r.id === raceId);
    if (race) {
      setFormData({
        name: race.name,
        startDateTime: race.startDateTime,
        finishDateTime: race.finishDateTime,
      });
    }
    dispatch(setIsEditing(false));
  };

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString();
  };

  const calculateDuration = (start, finish) => {
    const startDate = new Date(start);
    const finishDate = new Date(finish);
    const durationMs = finishDate - startDate;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Race Details</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddRace}
          size="small"
        >
          Add Race
        </Button>
      </Box>

      {/* Race Selection */}
      {races.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Select Race</InputLabel>
            <Select
              value={selectedRace?.id || ''}
              label="Select Race"
              onChange={(e) => handleSelectRace(e.target.value)}
            >
              {races.map((race) => (
                <MenuItem key={race.id} value={race.id}>
                  {race.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Selected Race Details */}
      {selectedRace && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Race Information</Typography>
            <Box>
              {!isEditing ? (
                <>
                  <IconButton size="small" onClick={handleEditRace} title="Edit race">
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleDeleteRace(selectedRace.id)}
                    title="Delete race"
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              ) : (
                <>
                  <IconButton size="small" color="primary" onClick={handleSaveEdit} title="Save changes">
                    <SaveIcon />
                  </IconButton>
                  <IconButton size="small" onClick={handleCancelEdit} title="Cancel editing">
                    <CancelIcon />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>

          {isEditing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Race Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                size="small"
              />
              <TextField
                label="Start Date & Time"
                type="datetime-local"
                value={formData.startDateTime}
                onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Finish Date & Time"
                type="datetime-local"
                value={formData.finishDateTime}
                onChange={(e) => setFormData({ ...formData, finishDateTime: e.target.value })}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">
                <strong>Name:</strong> {selectedRace.name}
              </Typography>
              <Typography variant="body2">
                <strong>Start:</strong> {formatDateTime(selectedRace.startDateTime)}
              </Typography>
              <Typography variant="body2">
                <strong>Finish:</strong> {formatDateTime(selectedRace.finishDateTime)}
              </Typography>
              <Typography variant="body2">
                <strong>Duration:</strong> {calculateDuration(selectedRace.startDateTime, selectedRace.finishDateTime)}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip 
                  label={`${races.length} race${races.length !== 1 ? 's' : ''} total`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* No races message */}
      {races.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No races defined. Click "Add Race" to create your first race.
          </Typography>
        </Box>
      )}

      {/* Add Race Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Race</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Race Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              autoFocus
            />
            <TextField
              label="Start Date & Time"
              type="datetime-local"
              value={formData.startDateTime}
              onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Finish Date & Time"
              type="datetime-local"
              value={formData.finishDateTime}
              onChange={(e) => setFormData({ ...formData, finishDateTime: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveNewRace} variant="contained">Add Race</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default RaceDetailsManager;
