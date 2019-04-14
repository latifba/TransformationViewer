// constructor
function SceneObject(canvas, modelDisplay) {
    this.modelDisplay = modelDisplay
    this.transMats = [] // all translations
    this.transMat = mat4(1) // product of all translations
    this.lineColor = [0, 0, 0, 1]
}

SceneObject.prototype = {
	Display: function(type) {
        type = type ? type : "TRIANGLES" // if type is null, type = TRIANGLES

		canvas.gl.uniform4fv(canvas.edgeColorPos, flatten(this.lineColor))
		canvas.gl.uniformMatrix4fv(canvas.transMatPos, false, flatten(this.transMat))
		this.modelDisplay.Display(type)
	},

	Color: function(color) { this.lineColor = color },

	Recalculate: function() { // updates transMat
		this.transMat = mat4(1)
		for (let i = 0; i < this.transMats.length; i++)
			this.transMat = mult(this.transMat, this.transMats[i])
	},

	// transMats minipulation methods
	Push: function(mat) {
		this.transMats.push(mat)
		this.Recalculate()
	},
	Pop: function() {
		this.transMats.pop()
		this.Recalculate()
	},
	Top: function() { return this.transMats[this.transMats.length - 1] }
}
