const c = document.querySelector('#c')
const ctx = c.getContext('2d')

const dpr = Math.min(2, window.devicePixelRatio)

c.style.imageRendering = 'pixelated'
c.style.width = '100vw'
c.style.height = '100vh'

const palettes = [
   [
    "#222",
    "#444",
    "#666",
    "#888",
    "#aaa",
    "#ccc",
    "#eee",
  ],
   [
    // '#001219',
    "#80FFDB",
    "#72EFDD",
    "#64DFDF",
    "#56CFE1",
    "#48BFE3",
    "#4EA8DE",
    "#5390D9",
    "#5E60CE",
    "#6930C3",
    "#7400B8"
  ],
  [
    '#003049',
    '#d62828',
    '#f77f00',
    '#fcbf49',
    '#eae2b7',
  ],


  [
    "#f72585",
    "#b5179e",
    "#3f37c9",
    "#4361ee",
    "#4895ef",
    "#4cc9f0"
  ],

  [
    // '#001219',
    "#4f000b",
    "#720026",
    "#ce4257",
    "#ff7f51",
    "#ff9b54",
    "#4EA8DE",
    "#5390D9",
    "#5E60CE",
    "#6930C3",
    "#7400B8"
  ],

  [
    '#390099',
    '#9e0059',
    '#ff0054',
    '#ff5400',
    '#ffbd00',
  ]
]

var b2Common = Box2D.Common,
    b2Math = Box2D.Common.Math,
    b2Collision = Box2D.Collision,
    b2Shapes = Box2D.Collision.Shapes,
    b2Dynamics = Box2D.Dynamics,
    b2Contacts = Box2D.Dynamics.Contacts,
    b2Controllers = Box2D.Dynamics.Controllers,
    b2Joints = Box2D.Dynamics.Joints;

const SCALE = 1;

const world = new b2Dynamics.b2World(new b2Math.b2Vec2(0, 50), true);

function createBox(size, letter, i, y) {
  var bodyDef = new b2Dynamics.b2BodyDef();
  bodyDef.type = b2Dynamics.b2Body.b2_dynamicBody;
  bodyDef.position.x = Math.random() * c.width;
  bodyDef.position.y = y;

  var shape = new b2Shapes.b2PolygonShape();
  shape.SetAsBox(size / 2, size / 2);

  var fixDef = new b2Dynamics.b2FixtureDef();
  fixDef.density = 1;
  fixDef.mass = 100;
  fixDef.friction = .5;
  fixDef.restitution = .25;
  fixDef.shape = shape;

  var boxBody = world.CreateBody(bodyDef);
  boxBody.CreateFixture(fixDef);

  boxBody.SetAngularVelocity(Math.random() * 2 - 1);
  
  boxBody.SetUserData({ letter, size, i })

  return boxBody;
}

function createWallsAndFloor() {
  const w = c.width;
  const h = c.height;
  // create walls and floor
  var fixDef = new b2Dynamics.b2FixtureDef();
  fixDef.density = 1;
  fixDef.friction = .5;

  var bodyDef = new b2Dynamics.b2BodyDef();
  bodyDef.type = b2Dynamics.b2Body.b2_staticBody;

  // FLOOR
  var floorShape = new b2Shapes.b2PolygonShape();
  floorShape.SetAsBox(w / 2, 10);

  fixDef.shape = floorShape;

  bodyDef.position.x = w / 2;
  bodyDef.position.y = (h + 10);

  var floor = world.CreateBody(bodyDef);
  floor.CreateFixture(fixDef);

  // WALLS
  var wallShape = new b2Shapes.b2PolygonShape();
  wallShape.SetAsBox(10, h / 2);

  // left wall
  fixDef.shape = wallShape;

  bodyDef.position.x = -10;
  bodyDef.position.y = h / 2;

  var leftWall = world.CreateBody(bodyDef);
  leftWall.CreateFixture(fixDef);

  // right wall
  bodyDef.position.x = (w + 10);

  var rightWall = world.CreateBody(bodyDef);
  rightWall.CreateFixture(fixDef);
}

let prevTime = 0

const setup = () => {
  c.width = window.innerWidth * dpr
  c.height = window.innerHeight * dpr
}

const animate = (time) => {
  requestAnimationFrame(animate)
  
  const delta = time - prevTime
  const scroll = time / 50;
  
  world.Step(delta / 100, 8, 2);
  world.ClearForces();
  
  ctx.resetTransform();
  
  ctx.clearRect(0, 0, c.width, c.height);
  
  for (var body = world.GetBodyList(); body; body = body.GetNext()) {
    const userData = body.GetUserData();
    if (userData?.letter) {
      const left = body.GetPosition().x;
      const top = body.GetPosition().y;
      const angle = body.GetAngle();
      
      ctx.resetTransform();
      
      ctx.translate(left, top + scroll);
      ctx.rotate(angle);
      
      const s = userData.size
      const i = userData.i
      
      const palette = palettes[2];
      
      ctx.fillStyle = palette[i % palette.length]
      ctx.fillRect(-s / 2, -s / 2, s, s)
      
      ctx.fillStyle = 'white';
      ctx.font = `bold ${s}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillText(userData.letter, 0, 0);
     
      const velocity = body.GetLinearVelocity();
      const speedSquared = velocity.y * velocity.y;
      const pos = body.GetPosition();

      if (speedSquared < 0.001 && pos.y > 10) {
        body.SetType(b2Dynamics.b2Body.b2_staticBody);
      }

    }
  }
  
  prevTime = time 
}

window.addEventListener('resize', () => {
  setup()
})
setup()

createWallsAndFloor()

const code = document.body.parentElement.innerHTML;

for(let i = 0; i < code.length; i++) {
  const size = Math.floor(40 + Math.random() * 40);
  const y = i * 10;
  
  createBox(size, code[i], i, -y + c.height);
} 

requestAnimationFrame(animate);