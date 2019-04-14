// return data object given a list of vertices
function rangeXYZ(triangles) {
	// object that holds model information
	let range = {
		scaler: 0, // min and max values of all vertex coords
		max: [0,0,0], // [max of xs, min of ys, max of zs]
		min: [0,0,0], // [min of xs, min of ys, min of zs]
		center: [0, 0, 0] // center of model
	}

	triangles.forEach((el)=>{ // loop through each vertex
		// find max & min of x
		if (el[0] > range.max[0])
			range.max[0] = el[0]
		if (el[0] < range.min[0])
			range.min[0] = el[0]
		// ...y
		if (el[1] > range.max[1])
			range.max[1] = el[1]
		if (el[1] < range.min[1])
			range.min[1] = el[1]
		// ...z
		if (el[2] > range.max[2])
			range.max[2] = el[2]
		if (el[2] < range.min[2])
			range.min[2] = el[2]
	})
	// take an average of min & max to find center
	range.center = [(range.min[0] + range.max[0])/2,
	                (range.min[1] + range.max[1])/2,
	                (range.min[2] + range.max[2])/2]

	// loop through min & max to find longest span (across x, y, or z)
	for (var i = 0; i < 3; i++) {
		let span = Math.abs(range.max[i] - range.min[i])
		if (range.scaler < span)
			range.scaler = span
	}

	return range
}

// scale and center model
function standardTransform(triangles) {
	let range = rangeXYZ(triangles)

	for (let i = 0; i < triangles.length; i++) {
		triangles[i] = subtract(triangles[i], range.center)
		triangles[i] = scale(1/range.scaler, triangles[i])
	}

	return triangles
}

function OFFparse(offObj, fileArr) {
	// remove first two lines, js' arrays make them useless
	if (fileArr[0].search("OFF") != -1) {
		fileArr[0] = ""
		fileArr[1] = ""
	}

	let triVerts = [] // stores all verts used in the model

	fileArr.forEach((el)=>{
		el = el.split(" ") // create an array of numbers in the line
		if (el.length == 3) // if there are only 3 numbers, it's just a vert
			triVerts.push([parseFloat(el[0]), parseFloat(el[1]), parseFloat(el[2])])
		if (el.length > 3) { // if there are more than 3, it's a list of vert indices (polygon)
			let verts = parseInt(el[0]) // number of vert indices
			for (let i = 1; i <= verts-2; i++) { // convert polygon to triangles (fan method)
				offObj.Triangles.push(triVerts[parseInt(el[1])].slice())
				for (let j = 1; j < 3; j++) // use first 3 indices then shift to the right by 1
					offObj.Triangles.push(triVerts[parseInt(el[i+j])].slice())
				offObj.BC.push([1,0,0],[0,1,0],[0,0,1]) // bericentric coordinates are constant for each triangle
			}
		}
	})

	return offObj
}

function OBJparse(objObj, fileArr) {

	let triVerts = []

	fileArr.forEach((el)=>{
		el = el.split(" ")
		if (el[0] == "v") // if line begins with 'v', it's just a vert
			triVerts.push([parseFloat(el[1]), parseFloat(el[2]), parseFloat(el[3])]) // skip the 'v'
		if (el[0] == "f") { // if  line begins with 'v', it's a list of vert indices (polygon)
			for (let i = 1; i <= el.length-3; i++) { // convert polygon to triangles (fan method), skip the 'f'
				for (let j = 0; j < 3; j++) {
					let vertIdx = parseInt(el[i+j].split("/")[0]) // obj has other values for verts concatinated by '/', we want the first value (the index)
					if (vertIdx < 0) // sometimes indices are negative meaning 'count backwards'
						vertIdx += triVerts.length
					objObj.Triangles.push(triVerts[vertIdx].slice())
				}
				objObj.BC.push([1,0,0],[0,1,0],[0,0,1])
			}
		}
	})

	return objObj
}

// takes file name and its content
// returns model object for the modelDisplay constructor
function ParseModelFile(fileName, content) {
	let modelName = fileName.split('.')[0]
	let fileExt = fileName.split(".")[1] // "filename.ext" -> ["filename", "ext"]
	let fileArr = content.split("\n") // make file into an array of lines

	let fileObj = {
		name: modelName,
		Triangles: [],
		BC: [],
		vertNormals: []
	}

	// determine file extension
	if (fileExt == "off")
		fileObj = OFFparse(fileObj, fileArr)
	if (fileExt == "obj")
		fileObj = OBJparse(fileObj, fileArr)
	if (fileExt == "json")
		fileObj = JSON.parse(content)

	fileObj.Triangles = standardTransform(fileObj.Triangles)
	fileObj.vertNormals = getNormals(fileObj.Triangles)

	return fileObj
}

// return vertex and normal pairs
function getNormals(triangles) {
	let normals = [] // each normal corresponding vertex
	let verts = {} // maps a vertex to an array of normals {[...]: [[...],[...],[...]], ...}
	let vertArr = [] // each vertex in model
	let vertNormals = {
		verts: [],
		normals: []
	}

	for (var i = 0; i < triangles.length; i+=3) { // loop through all triangles
		// calculate a surface normal for a triangle
		let u = subtract(triangles[i+1], triangles[i])
		let v = subtract(triangles[i+2], triangles[i])
		let normal = cross(u, v)
		scaleNormal(normal) // scale normal

		for (var j = 0; j < 3; j++) { // loop through each vertex of the triangle
			if (verts[triangles[i+j]])  { // if this vertex exists in our map
				if (!containsArr(verts[triangles[i+j]], normal)) // and if its normal is unique
					verts[triangles[i+j]].push(normal) // add to the vertex's list of normals
			}
			else { // else add the vertex to the map and initialize its normal array
				verts[triangles[i+j]] = [normal]
				vertArr.push(triangles[i+j]) // add vertex to our list of verices (no duplicates)
			}
		}
	}

	for (var i = 0; i < vertArr.length; i++) { // loop through each unique vertex
		let normAvg = [0,0,0]
		let normNum = verts[vertArr[i]].length // number of normals associated with the vertex

		for (var j = 0; j < normNum; j++) // sum of normals
			normAvg = add(verts[vertArr[i]][j], normAvg)

		normAvg = scale(1/normNum, normAvg) // devide sum by number of normals
		normals.push(normAvg) // store average
	}

	for (var i = 0; i < normals.length; i++)
		normals[i] = add(normals[i], vertArr[i]) // translate normal to their corresponding vertex

	// save in obj
	vertNormals.verts = vertArr
	vertNormals.normals = normals

	return vertNormals
}

// return if arr1 == arr2
function isSameArr(arr1, arr2) {
	if (arr1.length != arr2.length)
		return false

	for (var i = 0; i < arr1.length; i++)
		if (arr1[i] != arr2[i])
			return false

	return true
}

// return if arr2 is in arr1
function containsArr(arr1, arr2) {
	for (var i = 0; i < arr1.length; i++)
		if (isSameArr(arr1[i], arr2))
			return true
	return false
}

// make normal lines the same length
function scaleNormal(normal) {
	// find max value in the vector
	let max = 0
	for (var i = 0; i < normal.length; i++)
		if (Math.abs(normal[i]) > max)
			max = Math.abs(normal[i])

	if (max == 0)
		return

	for (var i = 0; i < normal.length; i++)
		normal[i] /= (4*max) // scale down by max*4
}

// return a file's content from its url
function readTextFile(file)
{
	let content = ""
    var rawFile = new XMLHttpRequest()

    rawFile.onreadystatechange = function ()
    {
        if(rawFile.status === 200 || rawFile.readyState == 4)
			content = rawFile.responseText
    }
	rawFile.open("GET", file, false)
    rawFile.send()
	return content
}

function LoadModelFile(fileName, content) {
	const PROXY = "https://cors-anywhere.herokuapp.com/"
	const MODEL_DIR = "csci323.cs.edinboro.edu/~l804564b/Models/"

	if (content)
		return ParseModelFile(fileName, content) // parse local file
	else
		return ParseModelFile(fileName, readTextFile(PROXY + MODEL_DIR + fileName)) // parse file from server
}
