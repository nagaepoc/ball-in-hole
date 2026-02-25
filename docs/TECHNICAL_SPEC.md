# Technical Specification: Ball in a Hole Maze PWA

## 1. Overview

### 1.1 Project Description
A Progressive Web App (PWA) maze game that uses device orientation (tilt controls) to roll a virtual ball into a hole. The game is a static web application hosted on GitHub Pages with full PWA capabilities.

### 1.2 Core Features
- Device orientation-based tilt controls
- 2D physics simulation using Matter.js
- Progressive Web App (installable, offline capable)
- Multiple levels with increasing difficulty
- Score tracking and timer
- Responsive design for all screen sizes

## 2. Technical Architecture

### 2.1 System Architecture
```
┌─────────────────────────────────────────────────┐
│                 User Device                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Browser   │  │ Accelerometer│  │ Storage │ │
│  └──────┬──────┘  └──────┬──────┘  └────┬────┘ │
│         │                │               │      │
│  ┌──────▼──────┐  ┌─────▼─────┐  ┌──────▼─────┐│
│  │   HTML/CSS  │  │ JavaScript │  │ Service   ││
│  │   Canvas    │  │  Physics   │  │  Worker   ││
│  └──────┬──────┘  └─────┬─────┘  └──────┬─────┘│
│         │               │                │      │
│  ┌──────▼───────────────▼────────────────▼─────┐│
│  │           Game Engine (Matter.js)           ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│            GitHub Pages (Static Hosting)        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   HTML      │  │    CSS      │  │   JS    │ │
│  │   Files     │  │   Files     │  │  Files  │ │
│  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

#### Frontend
- **HTML5**: Semantic markup, canvas element
- **CSS3**: Flexbox/Grid, animations, responsive design
- **JavaScript (ES6+)**: Modern JavaScript with modules
- **Canvas API**: 2D rendering for game graphics

#### Libraries & APIs
- **Matter.js**: 2D physics engine (CDN: https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.18.0/matter.min.js)
- **Device Orientation API**: Native browser API for tilt controls
- **Service Worker API**: Offline functionality and caching
- **Web App Manifest**: PWA installation metadata

#### Development Tools
- **Git**: Version control
- **GitHub Pages**: Static hosting
- **Local HTTP Server**: For PWA testing (Python, Node.js, etc.)
- **Browser DevTools**: Debugging and testing

## 3. Detailed Specifications

### 3.1 Game Physics

#### Ball Properties
```javascript
{
  radius: 20,           // pixels
  density: 0.001,       // kg/m²
  friction: 0.01,       // friction coefficient
  frictionAir: 0.01,    // air friction
  restitution: 0.3,     // bounciness
  render: {
    fillStyle: '#3498db',
    strokeStyle: '#2980b9',
    lineWidth: 2
  }
}
```

#### Maze Walls
```javascript
{
  isStatic: true,       // Immovable objects
  render: {
    fillStyle: '#2c3e50',
    strokeStyle: '#34495e',
    lineWidth: 3
  }
}
```

#### Gravity Simulation
- Base gravity: { x: 0, y: 0 }
- Tilt-controlled gravity: Maps device orientation to gravity vector
- Maximum tilt angle: ±45 degrees
- Gravity scaling factor: 0.001

### 3.2 Device Orientation Controls

#### API Usage
```javascript
// Check support
if (window.DeviceOrientationEvent) {
  // Request permission (iOS)
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      });
  } else {
    window.addEventListener('deviceorientation', handleOrientation);
  }
}
```

#### Orientation Mapping
```
Device Tilt → Gravity Vector
─────────────────────────────
Beta (x-axis):    Forward/Backward tilt → Y gravity
Gamma (y-axis):   Left/Right tilt → X gravity

Range: -45° to +45° (clamped)
Mapping: Tilt angle → Gravity force (0 to 1)
```

#### Fallback Controls
- **Desktop**: Arrow keys, WASD, mouse drag
- **Touch**: Virtual joystick, swipe gestures
- **Gamepad**: Optional support

### 3.3 PWA Requirements

#### Web App Manifest (`manifest.json`)
```json
{
  "name": "Ball in a Hole Maze",
  "short_name": "BallMaze",
  "description": "Tilt-controlled ball maze game",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2196f3",
  "orientation": "portrait",
  "icons": [
    {
      "src": "assets/images/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "assets/images/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["games", "entertainment"],
  "screenshots": [
    {
      "src": "assets/images/screenshots/screenshot1.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}
```

#### Service Worker (`sw.js`)
- **Cache Strategy**: Cache-first with network fallback
- **Cache Name**: `ball-maze-v1`
- **Cached Resources**:
  - HTML, CSS, JavaScript files
  - Game assets (images, sounds)
  - Level data
- **Update Strategy**: Version-based cache invalidation

### 3.4 Level Design

#### Level Structure
```javascript
{
  id: 1,
  name: "Beginner's Maze",
  difficulty: "easy",
  timeLimit: 60,        // seconds
  parMoves: 15,         // target move count
  maze: [
    // Array of wall coordinates
    { x: 0, y: 0, width: 800, height: 20 },    // Top wall
    { x: 0, y: 0, width: 20, height: 600 },    // Left wall
    // ... more walls
  ],
  ballStart: { x: 100, y: 100 },
  holePosition: { x: 700, y: 500, radius: 25 },
  obstacles: [
    // Optional moving or static obstacles
  ]
}
```

#### Level Progression
1. **Level 1-3**: Basic mazes, straight paths
2. **Level 4-6**: Simple turns, dead ends
3. **Level 7-10**: Multiple paths, obstacles
4. **Level 11+**: Moving obstacles, time pressure

### 3.5 Performance Requirements

#### Frame Rate
- Target: 60 FPS (16.67ms per frame)
- Minimum: 30 FPS (33.33ms per frame)
- Physics updates: 60Hz fixed timestep

#### Memory Usage
- Max heap size: < 256MB
- Asset loading: Lazy loading for levels
- Cache size: < 50MB

#### Load Times
- First load: < 3 seconds (with service worker)
- Subsequent loads: < 1 second (from cache)
- Level transitions: < 500ms

### 3.6 Browser Compatibility

#### Required APIs
- **Canvas 2D Context**: All modern browsers
- **Device Orientation API**: Chrome 50+, Firefox 60+, Safari 13+
- **Service Worker API**: Chrome 40+, Firefox 44+, Safari 11.3+
- **ES6 Modules**: Chrome 61+, Firefox 60+, Safari 11+

#### Polyfills (if needed)
- **Device Orientation**: `orientation-polyfill`
- **Service Worker**: None (feature detection)
- **ES6 Features**: Babel (optional)

## 4. Data Flow

### 4.1 Game Loop
```
1. Input Processing
   ↓
2. Physics Update (Matter.js Engine)
   ↓
3. Collision Detection
   ↓
4. Game State Update
   ↓
5. Canvas Rendering
   ↓
6. UI Update (Score, Timer)
   ↓
7. Request Next Frame
```

### 4.2 Control Flow
```
Device Orientation → Orientation Handler → Gravity Calculator → Physics Engine
        ↑                    ↑                    ↑
   Permission         Event Listener         Tilt Mapping
        │                    │                    │
   (iOS only)         (All devices)        (Scale: -1 to 1)
```

### 4.3 PWA Lifecycle
```
1. User visits site
2. Service Worker registration
3. Asset caching (first visit)
4. Game loads from cache
5. User plays game (offline capable)
6. Periodic cache updates
7. New version notification
```

## 5. Security Considerations

### 5.1 HTTPS Requirement
- GitHub Pages provides automatic HTTPS
- Device Orientation API requires secure context
- Service Worker requires HTTPS (except localhost)

### 5.2 Data Privacy
- No user data collection
- No analytics without consent
- No third-party tracking
- Local storage only for game progress

### 5.3 Content Security
- Static content only
- No user-generated content
- No server-side processing
- All assets from same origin

## 6. Testing Requirements

### 6.1 Functional Testing
- Device orientation on actual devices
- Physics simulation accuracy
- Collision detection
- Level completion logic
- PWA installation and offline play

### 6.2 Performance Testing
- Frame rate consistency
- Memory usage profiling
- Load time optimization
- Cache efficiency

### 6.3 Cross-browser Testing
- Chrome (Desktop, Android)
- Firefox (Desktop, Android)
- Safari (iOS, macOS)
- Edge (Desktop)

### 6.4 Device Testing
- Mobile phones (iOS, Android)
- Tablets (iOS, Android)
- Desktop computers
- Different screen sizes

## 7. Deployment Specifications

### 7.1 GitHub Pages Configuration
- Repository name: `ball-in-hole`
- Branch: `main` or `gh-pages`
- Custom domain: Optional
- HTTPS: Automatic

### 7.2 Build Process
- No build step required (static files)
- Optional: Minification, bundling
- Asset optimization: Image compression

### 7.3 Monitoring
- GitHub Pages traffic analytics
- Browser console error logging
- User feedback collection

## 8. Future Enhancements

### 8.1 Phase 2 Features
- Level editor
- User-generated levels
- Social sharing
- Leaderboards
- Achievements system

### 8.2 Phase 3 Features
- 3D rendering with Three.js
- Multiplayer mode
- VR support
- Advanced physics (fluid simulation)

### 8.3 Technical Debt
- Code modularization
- Test coverage
- Documentation
- Performance optimization

---

*Last Updated: February 25, 2026*
*Version: 1.0.0*