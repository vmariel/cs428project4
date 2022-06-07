"use strict";

var gl;
var positions = []; // 0-19 are spokes points, the rest are cart data

var turn = mat2(Math.cos(0.025), -(Math.sin(0.025)), Math.sin(0.025), Math.cos(0.025)); // rotation matrix for spokes
var speed = 50; // time before next frame
var cart = 1; // selected cart
var cartDefault = []; // stores the coordinates if the cart wasn't spinning
var theta = 0; // rotation of the individual spinning cart

var program;

window.onload = function init(){

    var canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    //  Configure WebGL

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    //  Load shaders and initialize attribute buffers

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram( program );
    
    // creating the ferris wheel frame information

    var start = vec2(0, 0.75);

    var rad = radians(36);
    var rotation = mat2(Math.cos(rad), -(Math.sin(rad)), Math.sin(rad), Math.cos(rad));

    for (var i = 0; i < 10; i++) {
        
        positions.push(start);
        start = mult(rotation, start);
        
        positions.push(vec2(0, 0));

    }
    
    // Initialize event handlers

    document.getElementById("slider").onchange = function(event) {
        theta = 0; // resets cart angle
        cart = event.target.value; // redefines cart
    };

    document.getElementById("slider2").onchange = function(event) {
        speed = event.target.value; // redefines cart
    };

    render();

};

function render(){
    
    findPos();
    
    gl.clear( gl.COLOR_BUFFER_BIT );

    gl.drawArrays(gl.LINES, 0, 20);

    for (var i = 20; i < positions.length; i += 3) {
        gl.drawArrays(gl.LINE_LOOP, i, 3)
    }

    setTimeout(
        function () {requestAnimationFrame(render);},
        speed
    );

}

// calculate the resting seat positions

function findPos() {
    
    for (var i = 0; i < 10; i++) {

        positions[2*i] = mult(turn, positions[2*i]);
        var anchor = positions[2*i];
        
        positions.splice(
            20 + (i * 3), 3, 
            anchor,
            add(anchor, vec2(-0.08, -0.1)),
            add(anchor, vec2(0.08, -0.1))
        );

    }

    theta += 0.2;
    var rMat = mat2(Math.cos(theta), -(Math.sin(theta)), Math.sin(theta), Math.cos(theta));

    //19 anchor ll lr anc2 ll2 lr2 ach3 ll3 lr3
    var pointer = 17 + cart * 3;
    cartDefault= [positions[pointer+1], positions[pointer+2]];
    
    var radius = positions[pointer];
    positions[pointer+1] = add(mult(rMat, vec2(-0.08, -0.1)), radius);
    positions[pointer+2] = add(mult(rMat, vec2(0.08, -0.1)), radius);

    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    
    // Associate out shader variables with our data buffer

    var positionLoc = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( positionLoc, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(positionLoc);

    positions.splice(pointer+1, 2, cartDefault);
    
}