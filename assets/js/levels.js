// Ball in a Hole Maze - Level Definitions

const levels = [
    {
        id: 1,
        name: "Beginner's Maze",
        difficulty: "easy",
        timeLimit: 60,
        parMoves: 15,
        maze: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 200, y: 100, width: 20, height: 400 },
            { x: 400, y: 200, width: 20, height: 300 }
        ],
        ballStart: { x: 100, y: 100 },
        holePosition: { x: 700, y: 500, radius: 25 }
    },
    {
        id: 2,
        name: "Simple Turns",
        difficulty: "easy",
        timeLimit: 75,
        parMoves: 20,
        maze: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 150, y: 100, width: 20, height: 300 },
            { x: 300, y: 200, width: 20, height: 300 },
            { x: 450, y: 100, width: 20, height: 300 },
            { x: 600, y: 200, width: 20, height: 300 }
        ],
        ballStart: { x: 100, y: 100 },
        holePosition: { x: 700, y: 100, radius: 25 }
    },
    {
        id: 3,
        name: "Dead End Challenge",
        difficulty: "medium",
        timeLimit: 90,
        parMoves: 25,
        maze: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 200, y: 100, width: 20, height: 200 },
            { x: 200, y: 400, width: 20, height: 200 },
            { x: 400, y: 0, width: 20, height: 300 },
            { x: 400, y: 400, width: 20, height: 200 },
            { x: 600, y: 100, width: 20, height: 200 },
            { x: 600, y: 400, width: 20, height: 200 }
        ],
        ballStart: { x: 100, y: 300 },
        holePosition: { x: 700, y: 300, radius: 25 }
    },
    {
        id: 4,
        name: "Spiral Maze",
        difficulty: "medium",
        timeLimit: 120,
        parMoves: 30,
        maze: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 100, y: 100, width: 600, height: 20 },
            { x: 100, y: 100, width: 20, height: 400 },
            { x: 100, y: 500, width: 600, height: 20 },
            { x: 700, y: 100, width: 20, height: 400 },
            { x: 200, y: 480, width: 500, height: 20 },
            { x: 200, y: 200, width: 20, height: 300 },
            { x: 200, y: 200, width: 400, height: 20 },
            { x: 600, y: 200, width: 20, height: 300 }
        ],
        ballStart: { x: 150, y: 150 },
        holePosition: { x: 400, y: 400, radius: 25 }
    },
    {
        id: 5,
        name: "Obstacle Course",
        difficulty: "hard",
        timeLimit: 150,
        parMoves: 35,
        maze: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 100, y: 100, width: 20, height: 400 },
            { x: 300, y: 100, width: 20, height: 400 },
            { x: 500, y: 100, width: 20, height: 400 },
            { x: 700, y: 100, width: 20, height: 400 },
            { x: 200, y: 200, width: 400, height: 20 },
            { x: 200, y: 400, width: 400, height: 20 }
        ],
        ballStart: { x: 50, y: 300 },
        holePosition: { x: 750, y: 300, radius: 25 }
    }
];

let currentLevelIndex = 0;

function getCurrentLevel() {
    return levels[currentLevelIndex];
}

function nextLevel() {
    if (currentLevelIndex < levels.length - 1) {
        currentLevelIndex++;
        return levels[currentLevelIndex];
    }
    return null;
}

function previousLevel() {
    if (currentLevelIndex > 0) {
        currentLevelIndex--;
        return levels[currentLevelIndex];
    }
    return null;
}

function resetLevel() {
    currentLevelIndex = 0;
    return levels[0];
}

function getLevelCount() {
    return levels.length;
}

function getLevelByIndex(index) {
    if (index >= 0 && index < levels.length) {
        return levels[index];
    }
    return null;
}

function getLevelProgress() {
    return {
        current: currentLevelIndex + 1,
        total: levels.length,
        percentage: Math.round(((currentLevelIndex + 1) / levels.length) * 100)
    };
}

function createRandomLevel() {
    const width = 800;
    const height = 600;
    const wallThickness = 20;
    const minWalls = 5;
    const maxWalls = 15;
    
    const maze = [
        { x: 0, y: 0, width: width, height: wallThickness },
        { x: 0, y: 0, width: wallThickness, height: height },
        { x: width - wallThickness, y: 0, width: wallThickness, height: height },
        { x: 0, y: height - wallThickness, width: width, height: wallThickness }
    ];
    
    const wallCount = Math.floor(Math.random() * (maxWalls - minWalls + 1)) + minWalls;
    
    for (let i = 0; i < wallCount; i++) {
        const wallWidth = Math.random() * 100 + 50;
        const wallHeight = Math.random() * 100 + 50;
        const x = Math.random() * (width - wallWidth - 100) + 50;
        const y = Math.random() * (height - wallHeight - 100) + 50;
        
        maze.push({ x, y, width: wallWidth, height: wallHeight });
    }
    
    const ballStart = {
        x: Math.random() * 100 + 50,
        y: Math.random() * 100 + 50
    };
    
    const holePosition = {
        x: Math.random() * 200 + 550,
        y: Math.random() * 200 + 350,
        radius: 25
    };
    
    return {
        id: levels.length + 1,
        name: "Random Challenge",
        difficulty: "random",
        timeLimit: 180,
        parMoves: 40,
        maze,
        ballStart,
        holePosition
    };
}

export {
    levels,
    getCurrentLevel,
    nextLevel,
    previousLevel,
    resetLevel,
    getLevelCount,
    getLevelByIndex,
    getLevelProgress,
    createRandomLevel
};