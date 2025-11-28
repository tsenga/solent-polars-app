import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import {
  loadRaceDetails,
  selectAllRaces,
  selectSelectedRace,
  selectRace,
} from '../store/raceDetailsSlice';
import {
  setStartTime,
  setEndTime,
  setTimeFilterMode,
} from '../store/filterSlice';

const RaceSelector = () => {
  const dispatch = useDispatch();
  const races = useSelector(selectAllRaces);
  const selectedRace = useSelector(selectSelectedRace);

  // Load race details on component mount
  useEffect(() => {
    dispatch(loadRaceDetails());
  }, [dispatch]);

  const handleRaceSelect = (raceId) => {
    dispatch(selectRace(raceId));
    
    // Find the selected race and set its times as filter times
    const race = races.find(r => r.id === raceId);
    if (race) {
      // Convert to datetime-local format
      const startTime = new Date(race.startDateTime).toISOString().slice(0, 16);
      const endTime = new Date(race.finishDateTime).toISOString().slice(0, 16);
      
      dispatch(setStartTime(startTime));
      dispatch(setEndTime(endTime));
      dispatch(setTimeFilterMode('race'));
    }
  };

  // not used
  const handleClearRaceSelection = () => {
    dispatch(selectRace(null));
    dispatch(setTimeFilterMode('none'));
    dispatch(setStartTime(''));
    dispatch(setEndTime(''));
  };

  /*
                <Button 
                variant="outlined" 
                size="small" 
                onClick={handleClearRaceSelection}
                sx={{ alignSelf: 'flex-start' }}
              >
                Clear Race Selection
              </Button>
  */

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
    <Box>
      {races.length > 0 ? (
        <Box>
          <FormControl size="small" sx={{ mb: 2, minWidth: 250 }}>
            <InputLabel>Select Race for Time Filter</InputLabel>
            <Select
              value={selectedRace?.id || ''}
              label="Select Race for Time Filter"
              onChange={(e) => handleRaceSelect(e.target.value)}
            >
              {races.map((race) => (
                <MenuItem key={race.id} value={race.id}>
                  {race.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedRace && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip 
                  label={selectedRace.name}
                  color="primary"
                  variant="filled"
                  size="small"
                />
                <Chip 
                  label={`Duration: ${calculateDuration(selectedRace.startDateTime, selectedRace.finishDateTime)}`}
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Start:</strong> {formatDateTime(selectedRace.startDateTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Finish:</strong> {formatDateTime(selectedRace.finishDateTime)}
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No races available. Create races in the Race Details section.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RaceSelector;
