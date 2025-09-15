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
  InsertDriveFile as FileIcon,
  DataUsage as DataSourceIcon,
  Visibility as ViewIcon,
  EmojiEvents as RaceIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';

const NavigationDrawer = ({ 
  isOpen, 
  onToggle, 
  activeTab, 
  onTabChange,
  children 
}) => {
  const drawerWidth = 80; // Narrow for icon-only display

  const menuItems = [
    {
      id: 0,
      label: 'Polar Files',
      icon: <FileIcon />
    },
    {
      id: 1,
      label: 'Data Source',
      icon: <DataSourceIcon />
    },
    {
      id: 2,
      label: 'View Settings',
      icon: <ViewIcon />
    },
    {
      id: 3,
      label: 'Race Details',
      icon: <RaceIcon />
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
                  selected={activeTab === item.id}
                  onClick={() => onTabChange(item.id)}
                  sx={{
                    minHeight: 64,
                    justifyContent: 'center',
                    px: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                  title={item.label}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      justifyContent: 'center',
                      color: activeTab === item.id ? 'primary.main' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          
        </Box>
      </Drawer>
    </>
  );
};

export default NavigationDrawer;
