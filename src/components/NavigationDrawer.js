import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Divider,
  Typography
} from '@mui/material';
import {
  Menu as MenuIcon,
  DataUsage as DataSourceIcon,
  InsertDriveFile as FileIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';

const NavigationDrawer = ({ 
  isOpen, 
  onToggle, 
  activeSection, 
  onSectionChange,
  children 
}) => {
  const drawerWidth = 600;

  const menuItems = [
    {
      id: 'dataSource',
      label: 'Data Source Selection',
      icon: <DataSourceIcon />
    },
    {
      id: 'files',
      label: 'Polar Data Files',
      icon: <FileIcon />
    },
    {
      id: 'raceDetails',
      label: 'Race Details',
      icon: <SettingsIcon />
    }
  ];

  return (
    <>
      {/* Menu button when drawer is closed */}
      {!isOpen && (
        <IconButton
          onClick={onToggle}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1200,
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Drawer
        variant="persistent"
        anchor="left"
        open={isOpen}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
            <Typography variant="h6" component="div">
              Navigation
            </Typography>
            <IconButton onClick={onToggle}>
              <ChevronLeftIcon />
            </IconButton>
          </Box>
          <Divider />
          
          {/* Navigation Menu */}
          <List sx={{ flexShrink: 0 }}>
            {menuItems.map((item) => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  selected={activeSection === item.id}
                  onClick={() => onSectionChange(item.id)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: activeSection === item.id ? 'primary.main' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          
          <Divider />
          
          {/* Content Area */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {children}
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default NavigationDrawer;
