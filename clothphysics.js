// Drape - a fabric simulation software
// Built using three.js starting from the simple cloth simulation
// http://threejs.org/examples/#webgl_animation_cloth

var guiEnabled = true;

var structuralSprings = true;
var shearSprings = false;
var bendingSprings = true;

var DAMPING = 0.03;
var DRAG = 1 - DAMPING;
var MASS = .1;

var restDistanceB = 2;
var restDistanceS = Math.sqrt(2);

var friction = 0.9; // similar to coefficient of friction. 0 = frictionless, 1 = cloth sticks in place

var xSegs = 30; // how many particles wide is the cloth
var ySegs = 30; // how many particles tall is the cloth

var fabricLength = 600; // sets the size of the cloth
var restDistance; // = fabricLength/xSegs;

//var newCollisionDetection = true;

var wind = true;
var windStrength;
var windForce = new THREE.Vector3( 0, 0, 0 );

var rotate = false;
var pinned = 'Corners';
var thing = 'Moving Ball';
var ballIsMoving = true;

var cornersPinned, oneEdgePinned, twoEdgesPinned, fourEdgesPinned, randomEdgesPinned;

var avoidClothSelfIntersection = false;

if(guiEnabled){

  // GUI controls
  //sliders

  guiControls = new function(){
    this.friction = friction;
    this.particles = xSegs;
    this.rotate = rotate;

    this.wind = wind;
    this.thing = thing;
    this.pinned = pinned;

    this.avoidClothSelfIntersection = avoidClothSelfIntersection;

    this.fabricLength = fabricLength;
    this.structuralSprings = structuralSprings;

    this.bendingSprings = bendingSprings;
    this.bendingSpringLengthMultiplier = restDistanceB;

    this.shearSprings = shearSprings;
    this.shearSpringLengthMultiplier = restDistanceS;

    this.clothColor = 0xaa2929;
    this.clothSpecular = 0x030303;

    this.groundColor = 0x404761;
    this.groundSpecular = 0x404761;

    this.fogColor = 0xcce0ff;

  };

  gui = new dat.GUI();

  var f0 = gui.add(guiControls, 'fabricLength', 200, 1000).step(20).name('Size').onChange(function(value){fabricLength = value; xSegs = Math.round(value/20); ySegs = Math.round(value/20); restartCloth();});

  var f4 = gui.addFolder('Interaction')

  f4.add(guiControls, 'rotate').name('auto rotate').onChange(function(value){rotate = value;});
  f4.add(guiControls, 'wind').name('wind').onChange(function(value){wind = value;});
  f4.add(guiControls, 'thing', ['None', 'Stationary Ball', 'Moving Ball', 'Table']).name('object').onChange(function(value){createThing(value);});
  f4.add(guiControls, 'pinned', ['None','Corners', 'OneEdge', 'TwoEdges','FourEdges']).name('pinned').onChange(function(value){pinCloth(value);});

  var f1 = gui.addFolder('Behavior');

  f1.add(guiControls, 'structuralSprings').name('cross grain').onChange(function(value){structuralSprings = value; restartCloth();});
  f1.add(guiControls, 'shearSprings').name('bias grain').onChange(function(value){shearSprings = value; restartCloth();});
  f1.add(guiControls, 'bendingSprings').name('drape').onChange(function(value){bendingSprings = value; restartCloth();});
  f1.add(guiControls, 'friction', 0, 1).onChange(function(value){friction = value;});
  f1.add(guiControls, 'avoidClothSelfIntersection').name('NoSelfIntersect').onChange(function(value){avoidClothSelfIntersection = value;});
  //f1.add(guiControls, 'weight', 0, 500).step(1).onChange(function(value){weight = value; restartCloth();});

  var f3 = gui.addFolder('Appearance');
  f3.addColor(guiControls, 'clothColor').name('cloth color').onChange(function(value){clothMaterial.color.setHex(value);});
  f3.addColor(guiControls, 'clothSpecular').name('cloth reflection').onChange(function(value){clothMaterial.specular.setHex(value);});
  f3.addColor(guiControls, 'groundColor').name('ground color').onChange(function(value){groundMaterial.color.setHex(value);});
  f3.addColor(guiControls, 'groundSpecular').name('gnd reflection').onChange(function(value){groundMaterial.specular.setHex(value);});
  f3.addColor(guiControls, 'fogColor').onChange(function(value){scene.fog.color.setHex(value); renderer.setClearColor(scene.fog.color);});

}

var clothInitialPosition = plane( 500, 500 );
var cloth = new Cloth( xSegs, ySegs, fabricLength );

var GRAVITY = 9.81 * 140; //
var gravity = new THREE.Vector3( 0, - GRAVITY, 0 ).multiplyScalar( MASS );


var TIMESTEP = 18 / 1000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;

//var pins = [];


var ballSize = 500/4; //40
var ballPosition = new THREE.Vector3( 0, -250+ballSize, 0 );
var prevBallPosition = new THREE.Vector3( 0, -250+ballSize, 0 );

var tmpForce = new THREE.Vector3();

var lastTime;

var pos;

// var ray = new THREE.Raycaster();
// var collisionResults, newCollisionResults;
var whereAmI, whereWasI;
// var directionOfMotion, distanceTraveled;

var posFriction = new THREE.Vector3( 0, 0, 0 );
var posNoFriction = new THREE.Vector3( 0, 0, 0 );

var diff = new THREE.Vector3();
var objectCenter = new THREE.Vector3();

var a,b,c,d,e,f;

var nearestX, nearestY, nearestZ;
var currentX, currentY, currentZ;
var xDist, yDist, zDist;
var randomPoints = [];
var rand, randX, randY;

function pinCloth(choice){
  if(choice == 'Corners')
  {
    cornersPinned = true;
    oneEdgePinned = false;
    twoEdgesPinned = false;
    fourEdgesPinned = false;
    randomEdgesPinned = false;
  }
  else if(choice == 'OneEdge')
  {
    cornersPinned = false;
    oneEdgePinned = true;
    twoEdgesPinned = false;
    fourEdgesPinned = false;
    randomEdgesPinned = false;
  }
  else if(choice == 'TwoEdges')
  {
    cornersPinned = false;
    oneEdgePinned = false;
    twoEdgesPinned = true;
    fourEdgesPinned = false;
    randomEdgesPinned = false;
  }
  else if(choice == 'FourEdges')
  {
    cornersPinned = false;
    oneEdgePinned = false;
    twoEdgesPinned = false;
    fourEdgesPinned = true;
    randomEdgesPinned = false;
  }
  else if(choice == 'Random')
  {
    cornersPinned = false;
    oneEdgePinned = false;
    twoEdgesPinned = false;
    fourEdgesPinned = false;
    randomEdgesPinned = true;

    rand = Math.round(Math.random()*10)+1;
    randomPoints = [];
    for (u=0;u<rand;u++){
      randX = Math.round(Math.random()*xSegs);
      randY = Math.round(Math.random()*ySegs);
      randomPoints.push([randX,randY]);
    }
  }
  else if(choice == 'None')
  {
    cornersPinned = false;
    oneEdgePinned = false;
    twoEdgesPinned = false;
    fourEdgesPinned = false;
    randomEdgesPinned = false;
  }
}

function createThing(thing){

  if(thing == 'Stationary Ball' || thing == 'stationary ball'){
    sphere.visible = true;
    table.visible = false;
    ballIsMoving = false;
    // currently ball takes last Moving Ball position-- how to reset position?
    restartCloth();
  }
  
  if(thing == 'Moving Ball' || thing == 'moving ball'){
    sphere.visible = true;
    table.visible = false;
    ballIsMoving = true;
    restartCloth();
  }
  
  else if(thing == 'Table' || thing == 'table'){

    // these variables are used in the table collision detection
    a = boundingBox.min.x;
    b = boundingBox.min.y;
    c = boundingBox.min.z;
    d = boundingBox.max.x;
    e = boundingBox.max.y;
    f = boundingBox.max.z;

    sphere.visible = false;
    table.visible = true;
    restartCloth();
  }
  else if(thing == 'None' || thing == 'none'){
    sphere.visible = false;
    table.visible = false;
  }

}


function wireFrame(){

  poleMat.wireframe = !poleMat.wireframe;
  clothMaterial.wireframe = !clothMaterial.wireframe;
  ballMaterial.wireframe = !ballMaterial.wireframe;

}

function plane( width, height ) {

  return function( u, v ) {

    var x = u * width - width/2;
    var y = 125; //height/2;
    var z = v * height - height/2;

    return new THREE.Vector3( x, y, z );

  };

}

function Particle( x, y, z, mass ) {

  this.position = clothInitialPosition( x, y ); // position
  this.previous = clothInitialPosition( x, y ); // previous
  this.original = clothInitialPosition( x, y ); // original
  this.a = new THREE.Vector3( 0, 0, 0 ); // acceleration
  this.mass = mass;
  this.invMass = 1 / mass;
  this.tmp = new THREE.Vector3();
  this.tmp2 = new THREE.Vector3();

}

Particle.prototype.lockToOriginal = function() {

    this.position.copy( this.original );
    this.previous.copy( this.original );
}

Particle.prototype.lock = function() {

    this.position.copy( this.previous );
    this.previous.copy( this.previous );

}


// Force -> Acceleration
Particle.prototype.addForce = function( force ) {

  this.a.add(
    this.tmp2.copy( force ).multiplyScalar( this.invMass )
  );

};


// Performs verlet integration
Particle.prototype.integrate = function( timesq ) {

  var newPos = this.tmp.subVectors( this.position, this.previous );
  newPos.multiplyScalar( DRAG ).add( this.position );
  newPos.add( this.a.multiplyScalar( timesq ) );

  this.tmp = this.previous;
  this.previous = this.position;
  this.position = newPos;

  this.a.set( 0, 0, 0 );

};



function satisifyConstrains( p1, p2, distance) {

  diff.subVectors( p2.position, p1.position );
  var currentDist = diff.length();
  if ( currentDist == 0 ) return; // prevents division by 0
  var correction = diff.multiplyScalar( (currentDist - distance) / currentDist);
  var correctionHalf = correction.multiplyScalar( 0.5 );
  p1.position.add( correctionHalf );
  p2.position.sub( correctionHalf );

}

function repelParticles( p1, p2, distance) {

  diff.subVectors( p2.position, p1.position );
  var currentDist = diff.length();
  if ( currentDist == 0 ) return; // prevents division by 0
  if (currentDist < distance){
    var correction = diff.multiplyScalar( (currentDist - distance) / currentDist);
    var correctionHalf = correction.multiplyScalar( 0.5 );
    p1.position.add( correctionHalf );
    p2.position.sub( correctionHalf );
  }

}


function Cloth( w, h, l ) {

  //w = w || 10;
  //h = h || 10;
  this.w = w;
  this.h = h;
  restDistance = l/w; // assuming square cloth for now


  var particles = [];
  var constrains = [];

  var u, v;

  // Create particles
  for (v=0; v<=h; v++) {
    for (u=0; u<=w; u++) {
      particles.push(
        new Particle(u/w, v/h, 0, MASS)
      );
    }
  }

    for (v=0; v<=h; v++) {
      for (u=0; u<=w; u++) {

        if(v<h && (u == 0 || u == w)){
          constrains.push( [
            particles[ index( u, v ) ],
            particles[ index( u, v + 1 ) ],
            restDistance
          ] );
        }

        if(u<w && (v == 0 || v == h)){
          constrains.push( [
            particles[ index( u, v ) ],
            particles[ index( u + 1, v ) ],
            restDistance
          ] );
        }
      }
    }


  // Structural

  if(structuralSprings){

    for (v=0; v<h; v++) {
      for (u=0; u<w; u++) {

        if(u!=0){
          constrains.push( [
            particles[ index( u, v ) ],
            particles[ index( u, v+1 ) ],
            restDistance
          ] );
        }

        if(v!=0){
          constrains.push( [
            particles[ index( u, v ) ],
            particles[ index( u+1, v ) ],
            restDistance
          ] );
        }

      }
    }
  }

  // Shear

  if(shearSprings){

   for (v=0;v<=h;v++)
   {
    for (u=0;u<=w;u++)
    {

      if(v<h && u<w){
        constrains.push([
          particles[index(u, v)],
          particles[index(u+1, v+1)],
          restDistanceS*restDistance
        ]);

        constrains.push([
          particles[index(u+1, v)],
          particles[index(u, v+1)],
          restDistanceS*restDistance
        ]);
      }

    }
   }
  }



// Bending springs

  if(bendingSprings){

    for (v=0; v<h; v++)
    {

      for (u=0; u<w; u++)
      {

        if(v<h-1){
          constrains.push( [
            particles[ index( u, v ) ],
            particles[ index( u, v+2 ) ],
            restDistanceB*restDistance
          ] );
        }

        if(u<w-1){
          constrains.push( [
            particles[ index( u, v ) ],
            particles[ index( u+2, v ) ],
            restDistanceB*restDistance
          ] );
        }


      }
    }
  }




  this.particles = particles;
  this.constrains = constrains;

  function index( u, v ) {

    return u + v * ( w + 1 );

  }

  this.index = index;

}

function map(n, start1, stop1, start2, stop2) {
  return ((n-start1)/(stop1-start1))*(stop2-start2)+start2;
}

function simulate( time ) {

  if ( ! lastTime ) {

    lastTime = time;
    return;

  }

  var i, il, particles, particle, pt, constrains, constrain;

  // Aerodynamics forces
  if ( wind )
  {

    windStrength = Math.cos( time / 7000 ) * 20 + 40;
    windForce.set(
      Math.sin( time / 2000 ),
      Math.cos( time / 3000 ),
      Math.sin( time / 1000 )
      ).normalize().multiplyScalar( windStrength);

    // apply the wind force to the cloth particles
    var face, faces = clothGeometry.faces, normal;
    particles = cloth.particles;
    for ( i = 0, il = faces.length; i < il; i ++ ) {
      face = faces[ i ];
      normal = face.normal;
      tmpForce.copy( normal ).normalize().multiplyScalar( normal.dot( windForce ) );
      particles[ face.a ].addForce( tmpForce );
      particles[ face.b ].addForce( tmpForce );
      particles[ face.c ].addForce( tmpForce );
    }

  }

  for ( particles = cloth.particles, i = 0, il = particles.length ; i < il; i ++ )
  {
    particle = particles[ i ];
    particle.addForce( gravity );
    particle.integrate( TIMESTEP_SQ ); // performs verlet integration
  }

  // Start Constrains

  constrains = cloth.constrains,
  il = constrains.length;
  for ( i = 0; i < il; i ++ ) {
    constrain = constrains[ i ];
    satisifyConstrains( constrain[ 0 ], constrain[ 1 ], constrain[ 2 ], constrain[ 3] );
  }

  if (ballIsMoving == true){
    prevBallPosition.copy(ballPosition);
    ballPosition.y = 50*Math.sin(Date.now()/600);
    ballPosition.x = 50*Math.sin(Date.now()/600);
    ballPosition.z = 50*Math.cos(Date.now()/600);
    sphere.position.copy( ballPosition ); //maybe remove this since it's also in render()
  }

  if(avoidClothSelfIntersection){
    for ( i = 0; i < particles.length; i ++ ){
      p_i = particles[i];
      for ( j = 0; j < particles.length; j ++ ){
        p_j = particles[j];
        repelParticles(p_i,p_j,restDistance);
      }
    }
  }

  for ( particles = cloth.particles, i = 0, il = particles.length; i < il; i ++ )
  {

    particle = particles[ i ];
    whereAmI = particle.position;
    whereWasI = particle.previous;

    // check to see if point is inside sphere
    if(sphere.visible){

      diff.subVectors( whereAmI, ballPosition );
      if ( diff.length() < ballSize ) {
        // if yes, we've collided, so take correcting action

        // no friction behavior:
        // project point out to nearest point on sphere surface
        diff.normalize().multiplyScalar( ballSize );
        posNoFriction.copy( ballPosition ).add( diff );

        diff.subVectors(whereWasI,ballPosition);

        if (diff.length() > ballSize) {
          // with friction behavior:
          // add the distance that the sphere moved in the last frame
          // to the previous position of the particle
          diff.subVectors(ballPosition,prevBallPosition);
          posFriction.copy(whereWasI).add(diff);

          posNoFriction.multiplyScalar(1-friction);
          posFriction.multiplyScalar(friction);
          whereAmI.copy(posFriction.add(posNoFriction));
        }
        else{
          whereAmI.copy(posNoFriction);
        }
      }
    }

    // check to see if point is inside table
    if(table.visible){
      if(boundingBox.containsPoint(whereAmI)){
        // if yes, we've collided, so take correcting action

        // no friction behavior:
        // place point at the nearest point on the surface of the cube
        currentX = whereAmI.x;
        currentY = whereAmI.y;
        currentZ = whereAmI.z;

        if(currentX <= (a + d)/2){nearestX = a;}
        else{nearestX = d;}

        if(currentY <= (b + e)/2){nearestY = b;}
        else{nearestY = e;}

        if(currentZ <= (c + f)/2){nearestZ = c;}
        else{nearestZ = f;}

        xDist = Math.abs(nearestX-currentX);
        yDist = Math.abs(nearestY-currentY);
        zDist = Math.abs(nearestZ-currentZ);

        posNoFriction.copy(whereAmI);

        if(zDist<=xDist && zDist<=yDist)
        {
          posNoFriction.z = nearestZ;
        }
        else if(yDist<=xDist && yDist<=zDist)
        {
          posNoFriction.y = nearestY;
        }
        else if(xDist<=yDist && xDist<=zDist)
        {
          posNoFriction.x = nearestX;
        }

        if(!boundingBox.containsPoint(whereWasI)){
          // with friction behavior:
          // set particle to its previous position
          posFriction.copy(whereWasI);
          whereAmI.copy(posFriction.multiplyScalar(friction).add(posNoFriction.multiplyScalar(1-friction)));
        }
        else{
          whereAmI.copy(posNoFriction);
        }
      }
    }
  }

  // Floor Constains
  for ( particles = cloth.particles, i = 0, il = particles.length
      ; i < il; i ++ )
  {
    particle = particles[ i ];
    pos = particle.position;
    if ( pos.y < - 249 ) {pos.y = - 249;}
  }

  // Pin Constrains
  if(cornersPinned){
    // could also do particles[blah].lock() which will lock particles to wherever they are, not to their original position
    particles[cloth.index(0,0)].lockToOriginal();
    particles[cloth.index(xSegs,0)].lockToOriginal();
    particles[cloth.index(0,ySegs)].lockToOriginal();
    particles[cloth.index(xSegs,ySegs)].lockToOriginal();
  }

  else if(oneEdgePinned){
   for (u=0;u<=xSegs;u++)
   {
    particles[cloth.index(u,0)].lockToOriginal();
   }
  }

  else if(twoEdgesPinned){
   for (u=0;u<=xSegs;u++)
   {
    particles[cloth.index(0,u)].lockToOriginal();
    particles[cloth.index(xSegs,u)].lockToOriginal();
   }
  }

  else if(fourEdgesPinned){
   for (u=0;u<=xSegs;u++)
   {
    particles[cloth.index(0,u)].lockToOriginal();
    particles[cloth.index(xSegs,u)].lockToOriginal();
    particles[cloth.index(u,0)].lockToOriginal();
    particles[cloth.index(u,xSegs)].lockToOriginal();
   }
  }

  else if(randomEdgesPinned)
  {
   for (u=0;u<randomPoints.length;u++){
    rand = randomPoints[u];
    randX = rand[0];
    randY = rand[1];
    particles[cloth.index(randX,randY)].lockToOriginal();
   }
  }

}
