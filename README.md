# Polar Chart Application

An interactive application for visualizing and editing polar data for boat performance.

## Features

- Interactive polar chart visualization
- Multiple wind speed selection
- Drag-and-drop editing of anchor points
- File loading and parsing
- Smooth curve interpolation

## Development

### Prerequisites

- Node.js (v14 or later)
- npm

### Installation

```bash
npm install
```

### Running in Development Mode

```bash
npm run dev
```

This will start both the React frontend and the Express backend server.

## Packaging and Deployment

### Building Docker Container

To build and package the application as a Docker container:

```bash
npm run package
```

This will:
1. Build the React application
2. Create a Docker image named `polar-chart-app`

### Running with Docker Compose

For a complete deployment with both frontend and backend:

```bash
docker-compose up -d
```

This will start:
- The frontend on port 80
- The backend API on port 3001

### Running Individual Containers

To run just the frontend:

```bash
docker run -p 80:80 polar-chart-app
```

To run just the backend:

```bash
docker build -f Dockerfile.server -t polar-chart-backend .
docker run -p 3001:3001 -v $(pwd)/data:/app/data polar-chart-backend
```

## Testing

Place your polar data files in the `data` directory. They should be tab-separated with the format:

```
! Comments start with !
<wind_speed> <angle1> <boat_speed1> <angle2> <boat_speed2> ...
```

Example:
```
! Polar data for Sample Boat
5 0 0 45 2.5 90 3.8 135 3.2 180 2.0
10 0 0 45 4.2 90 6.1 135 5.0 180 3.5
```

## License

MIT
