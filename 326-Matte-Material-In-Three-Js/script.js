// https://discourse.threejs.org/t/matte-material-is-it-possible/89797


import * as THREE from "three";


// general setup, boring, skip to the next comment

console.clear( );

var scene = new THREE.Scene();
    scene.background = new THREE.Color( 'linen' );

var camera = new THREE.PerspectiveCamera( 30, innerWidth/innerHeight );
    camera.position.set( 0, 0, 20 );
    camera.lookAt( scene.position );

var renderer = new THREE.WebGLRenderer( {antialias: true} );
    renderer.setSize( innerWidth, innerHeight );
    renderer.setAnimationLoop( animationLoop );
    document.body.appendChild( renderer.domElement );
			
var light = new THREE.DirectionalLight( 'white', 2.5 );
    light.position.set( 1, 1, 1 );
    scene.add( light );

var canvas = document.createElement( 'CANVAS' );
    canvas.width = 32;
    canvas.height = 32;

var context = canvas.getContext( '2d' );
    context.fillStyle = 'linen';
    context.fillRect( 0, 0, 32, 32 );
    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.strokeRect( 3, 3, 27, 27 );

var texture = new THREE.CanvasTexture( canvas );
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(innerWidth/20,innerHeight/20)

scene.background = texture;

window.addEventListener( "resize", (event) => {
		texture.repeat.set(innerWidth/20,innerHeight/20)
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix( );
    renderer.setSize( innerWidth, innerHeight );
});

const N = 200;

var geometry = new THREE.BoxGeometry( 2, 0.2, 0.5 );
var things = [];

for( var i=0; i<N; i++ )
	{
			var color = new THREE.Color().setHSL(Math.random(),1,0.5);
			var object = new THREE.Mesh(
					geometry,
 	   			new THREE.MeshPhongMaterial( {color:color, shininess: 10} )
    	);	
			object.position.set( 16*Math.random()-8, 10*Math.random()-5, 10*Math.random()-5 );
			things.push( object );
			scene.add( object );
	}


// next comment

var matteSphere = new THREE.Mesh(
		new THREE.SphereGeometry( 2 ),
		new THREE.MeshLambertMaterial({
			blending: THREE.CustomBlending,
			blendDst: THREE.OneFactor,
			blendDstAlpha: THREE.OneFactor,
			blendSrc: THREE.ZeroFactor,
			blendSrcAlpha: THREE.ZeroFactor,
		}),
);
matteSphere.renderOrder = -100;

scene.add( matteSphere );


function animationLoop( t )
{
		matteSphere.position.x = 2*Math.sin(t/1300);
		matteSphere.position.y = Math.cos(t/900);
		matteSphere.position.z = 2;
	
		for( var i=0; i<N; i++ )
    		things[i].rotation.set( t/700+i, t/1000-i, i/1000 );

    renderer.render( scene, camera );
}