// Ball in a Hole Maze - Physics Engine Integration

const Matter = window.Matter;
const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const Body = Matter.Body;

let engine;
let runner;

function initPhysics(canvas, isMobile = false) {
    engine = Engine.create();
    engine.world.gravity.x = 0;
    engine.world.gravity.y = 0;
    
    if (isMobile) {
        engine.world.gravity.scale = 0.001;
    }
    
    const render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: canvas.width,
            height: canvas.height,
            wireframes: false,
            background: 'transparent',
            showVelocity: false,
            showCollisions: false
        }
    });
    
    runner = Runner.create();
    Runner.run(runner, engine);
    
    return engine;
}

function createBall(x, y, isMobile = false) {
    const radius = isMobile ? 15 : 20;
    const density = isMobile ? 0.0005 : 0.001;
    const frictionAir = isMobile ? 0.005 : 0.01;
    
    const ball = Bodies.circle(x, y, radius, {
        density: density,
        friction: 0.01,
        frictionAir: frictionAir,
        restitution: 0.3,
        render: {
            fillStyle: '#3498db',
            strokeStyle: '#2980b9',
            lineWidth: 2
        }
    });
    
    Composite.add(engine.world, ball);
    return ball;
}

function createHole(x, y, radius = 25, isMobile = false) {
    const holeRadius = isMobile ? 20 : radius;
    const hole = Bodies.circle(x, y, holeRadius, {
        isStatic: true,
        isSensor: true,
        render: {
            fillStyle: '#000',
            strokeStyle: '#333',
            lineWidth: 2
        }
    });
    
    Composite.add(engine.world, hole);
    return hole;
}

function createWalls(wallsData, isMobile = false, scale = 1) {
    const walls = [];
    
    wallsData.forEach(wallData => {
        const x = (wallData.x + wallData.width / 2) * scale;
        const y = (wallData.y + wallData.height / 2) * scale;
        const width = wallData.width * scale;
        const height = wallData.height * scale;
        
        const wall = Bodies.rectangle(
            x, y, width, height,
            {
                isStatic: true,
                render: {
                    fillStyle: '#2c3e50',
                    strokeStyle: '#1a252f',
                    lineWidth: 2
                }
            }
        );
        
        walls.push(wall);
        Composite.add(engine.world, wall);
    });
    
    return walls;
}

function updatePhysics(engine) {
    Engine.update(engine);
}

function checkHoleCollision(ball, hole) {
    if (!ball || !hole) return false;
    
    const dx = ball.position.x - hole.position.x;
    const dy = ball.position.y - hole.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const ballRadius = ball.circleRadius || 20;
    const holeRadius = hole.circleRadius || 25;
    
    return distance < (ballRadius + holeRadius) * 0.8;
}

function applyForce(body, force) {
    Body.applyForce(body, body.position, force);
}

function setGravity(x, y) {
    if (engine) {
        engine.world.gravity.x = x;
        engine.world.gravity.y = y;
    }
}

function resetPhysics() {
    if (engine) {
        Matter.World.clear(engine.world);
        Matter.Engine.clear(engine);
    }
}

export {
    initPhysics,
    createBall,
    createHole,
    createWalls,
    updatePhysics,
    checkHoleCollision,
    applyForce,
    setGravity,
    resetPhysics
};