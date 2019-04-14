'use strict';

function MakeCanvas(width, height, locID) {

    if (width == undefined || width < 0) {
       width = 300;
    }

    if (height == undefined || height < 0) {
       height = 300;
    }

    var canvas = document.createElement('canvas')
    canvas.tabIndex = 0;
    canvas.height = height;
    canvas.width = width;
    canvas.style.border = "1px solid #0000FF";

    if(!locID) {
        document.body.appendChild(canvas);
    } else {
        let div = document.getElementById(locID);
        if (null == div) {
            document.body.appendChild(canvas);
        } else {
            div.appendChild(canvas);
        }
    }

    return canvas;
}

function InitGL(canvas) {
    var gl =  WebGLUtils.setupWebGL(canvas,'OES_standard_derivatives');
    if (!gl) {
        alert ("WebGL isn't available");
    }

    gl.getExtension('OES_standard_derivatives');
    return gl;
}

function Canvas(width, height, locID) {
    this.disp = MakeCanvas(width, height, locID);

    var gl = InitGL(this.disp);
    this.gl = gl;

    var tmpCanvas = this;
    this.x = this.disp.offsetLeft;
    this.y = this.disp.offsetTop;

    gl.viewport(0,0, width, height);

    this.program = initShaders(gl, "vertex-shader","fragment-shader");
    gl.useProgram(this.program);

    this.transMatPos = gl.getUniformLocation(this.program, "uTransMat");
    this.worldMatPos = gl.getUniformLocation(this.program, "uWorld");
    this.edgeColorPos = gl.getUniformLocation(this.program, "uEdgeColor");
    this.worldMatPos = gl.getUniformLocation(this.program, "uWorld");
    this.cameraMatPos = gl.getUniformLocation(this.program, "uCamera");
    this.projectionMatPos = gl.getUniformLocation(this.program, "uProject");
    this.edgeColorPos = gl.getUniformLocation(this.program, "uEdgeColor");


    this.Init();
    return this;
}

Canvas.prototype = {

    Init: function() {
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);
        this.gl.depthMask(this.gl.TRUE);

        this.shaderChoice = false;
        this.gl.uniform1f(this.shaderLoc, 0.0);

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.frontFace(this.gl.CCW);
        this.gl.cullFace(this.gl.BACK);

        this.Reset();
    },

    Rotate: function(axis, dir) {
        var change = 5;
        if (dir =='r') {
            change = -5;
        }
        switch(axis) {
           case 'x': this.xr += change; break;
           case 'y': this.yr += change; break;
           case 'z': this.zr += change; break;
        }
    },

    Reset: function() {
        this.xr = 0;
        this.yr = 0;
        this.zr = 0;

        this.ex = 0;
        this.ey = 0;
        this.ez = 1.2;

        this.atx = 0;
        this.aty = 0;
        this.atz = 0;
        this.RedoCameraMat();

        this.fovy = 90;
        this.aspect = 1;
        this.near = .1;
        this.far = 60;

        this.rotMV = 0;
        this.rotAtX = 0;
        this.rotAtY = 0;
        this.d = this.atz - this.ez;

        this.RedoProjectionMatrix();
    },

    RedoProjectionMatrix: function() {
        var mat = perspective(this.fovy, this.aspect, this.near, this.far);
        this.gl.uniformMatrix4fv(this.projectionMatPos,false,flatten(mat));
    },

    ChangeNear(dir) {
        this.near +=dir * 0.1;
        this.near = Math.max(this.near, 0.1)
        this.RedoProjectionMatrix();
    },

    MoveCamera: function(dvec) {
        var posDelta = 1;
        var rot = (2*Math.PI)*(this.rotMV/360);

        if (this.ex <= -99 && dvec[0] > 0 || this.ex >= 99 && dvec[0] < 0) {dvec[0] = 0}
        if (this.ez <= -99 && dvec[2] < 0 || this.ez >= 99 && dvec[2] < 0) {dvec[2] = 0}

        this.ex -= dvec[0]*Math.sin(rot);
        this.ey += dvec[1]*posDelta;
        this.ez += dvec[2]*Math.cos(rot);

        this.atx -= dvec[0]*Math.sin(rot);
        this.aty += dvec[1]*posDelta;
        this.atz += dvec[2]*Math.cos(rot);

        this.RedoCameraMat();
    },

    TurnMoveVector: function(dir) {
        var rotDelta = 5;

        this.rotMV += dir*rotDelta;
    },

    MoveEye: function(dvec) {
        var posDelta = 1;
        var rotDelta = 1;
        console.log('d: ', this.d);

        this.rotAtX -= dvec[0]*rotDelta;
        this.rotAtY += dvec[1]*rotDelta;

        if (this.rotAtY > 89) {this.rotAtY = 89}
        if (this.rotAtY < -89) {this.rotAtY = -89}

        var rotX = (2*Math.PI)*(this.rotAtX/360);
        var rotY = (2*Math.PI)*(this.rotAtY/360);

        if (dvec[0] != 0) {
            this.atx = this.ex + this.d*Math.sin(rotX);
            this.atz = this.ez + this.d*Math.cos(rotX);
        }
        else
            this.aty = this.d*Math.sin(rotY);

        this.RedoCameraMat();
    },

    ChangeFOV: function(dir) {
        var delta = 1;

        this.fovy += dir * delta;

        if (this.fovy < 20) { this.fovy = 20 }
        if (this.fovy > 180) { this.fovy = 180 }

        this.RedoProjectionMatrix();
    },

    ChangeAspect: function(dir) {
        var delta = .1;

        this.aspect += dir * delta;

        if (this.aspect < .1) { this.aspect = .1 }
        if (this.aspect > 2) { this.aspect = 2 }

        this.RedoProjectionMatrix();
    },

    RedoCameraMat: function() {
    var cameraMatrix = lookAt([this.ex, this.ey, this.ez],
                               [this.atx, this.aty, this.atz],
                   [0,1,0]);
        this.gl.uniformMatrix4fv(this.cameraMatPos,false,flatten(cameraMatrix));
    },



    Redisplay: function() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        var transform = mat4(1);
        transform = mult(transform, rotate(this.xr, [1,0,0]));
        transform = mult(transform, rotate(this.yr, [0,1,0]));
        transform = mult(transform, rotate(this.zr, [0,0,1]));
        this.gl.uniformMatrix4fv(this.worldMatPos,false, flatten(transform));

        return;
    }
};
