'use strict';
/*
   ModelDisplay is responsible for
           Maintaining a connection between the vertex buffer and the model
	   Displaying the model when called.
*/
function ModelDisplay(canvas, model) {
     this.gl = canvas.gl;
     var gl = canvas.gl;

     this.vboTriangles = gl.createBuffer();
     gl.bindBuffer(gl.ARRAY_BUFFER, this.vboTriangles);
     this.pointCount = model.Triangles.length;

     this.vPos = gl.getAttribLocation(canvas.program, "aPosition");
     gl.vertexAttribPointer(this.vPos,3,gl.FLOAT, false,0,0);
     gl.enableVertexAttribArray(this.vPos);

     gl.bufferData(gl.ARRAY_BUFFER,flatten(model.Triangles),gl.STATIC_DRAW);

     this.vboBC = gl.createBuffer();
     gl.bindBuffer(gl.ARRAY_BUFFER, this.vboBC);

     this.vBC = gl.getAttribLocation(canvas.program, "aBC");
     gl.vertexAttribPointer(this.vBC,3,gl.FLOAT, false,0,0);
     gl.enableVertexAttribArray(this.vBC);

     gl.bufferData(gl.ARRAY_BUFFER,flatten(model.BC),gl.STATIC_DRAW);
};

ModelDisplay.prototype= {
    Display(type) {
        type = type ? type : "TRIANGLES"; // if type is null, type = TRIANGLES

        var gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vboTriangles);
        gl.vertexAttribPointer(this.vPos,3,gl.FLOAT, false,0,0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vboBC);
        gl.vertexAttribPointer(this.vBC,3,gl.FLOAT, false,0,0);

        gl.drawArrays(gl[type], 0, this.pointCount);
    }
};
