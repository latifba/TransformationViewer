// populate cells of a table element
function WriteMatrixToTable(matrix, table) {
    for (var i = 0; i < table.rows.length; i++)
        for (var j = 0; j < table.rows[i].children.length; j++)
            table.rows[i].children[j].innerHTML = Math.round(matrix[i][j] * 100)/100
}

// populate cells of a table element with input elements
function WriteMatrixEditable(matrix, table) {
    for (var i = 0; i < table.rows.length; i++)
        for (var j = 0; j < table.rows[i].children.length; j++) {
            let input = document.createElement("input")
            input.type = "text"
            input.size = "2"
            input.value = Math.round(matrix[i][j] * 100)/100
            table.rows[i].children[j].innerHTML = ""
            table.rows[i].children[j].appendChild(input)
        }
}

// populate matrix with table input cells
function WriteTableToMatrix(table, matrix) {
    for (var i = 0; i < matrix.length; i++)
        for (var j = 0; j < matrix[i].length; j++)
            matrix[i][j] = parseFloat(table.rows[i].children[j].children[0].value)
}

// return index of an element's child
function IndexOfChild(child) {
    var i = 0
    while( (child = child.previousSibling) != null )
        i++
    return i
}

function UpdateFinalMatrix() {
    // clear transformation list
    while (transList.hasChildNodes())
        transList.firstChild.remove()

    // display final transformation
    WriteMatrixToTable(obj.transMat, finalMatrix)

    // loop transformation matrices / infoArr
    for (var i = 0; i < obj.transMats.length; i++) {
        let mat = obj.transMats[i]
        let table = finalMatrix.cloneNode(true)

        if (infoArr[i].edit) // if edit mode is on for this matrix
            WriteMatrixEditable(mat, table)
        else
            WriteMatrixToTable(mat, table)

        // create matrix div
        let matDiv = document.createElement("div")
        matDiv.className = "matrix"

        // add info
        let info = document.createElement("h3")
        info.innerHTML = infoArr[i].info

        // delete button
        let deleteBtn = document.createElement("input")
        deleteBtn.type = "submit"
        deleteBtn.value = "Delete"
        deleteBtn.onclick = function() {
            this.parentNode.remove() // delete matrix div

            // delete elements from both arrays
            obj.transMats.splice(IndexOfChild(this.parentNode), 1)
            infoArr.splice(IndexOfChild(this.parentNode), 1)

            // update obj and redisplay it
            obj.Recalculate()
            UpdateFinalMatrix()
        }

        // edit button
        let editBtn = document.createElement("input")
        editBtn.type = "submit"

        // changes text if the matrix is in edit mode or not
        if (infoArr[i].edit)
            editBtn.value = "Submit"
        else
            editBtn.value = "Edit"

        editBtn.onclick = function() {
            let index = IndexOfChild(this.parentNode)
            if (infoArr[index].edit) // if user submits an edit
                WriteTableToMatrix(this.parentNode.children[1], obj.transMats[index]) // update obj with the matrix input table

            infoArr[index].edit = infoArr[index].edit ? false : true // toggle edit mode

            // update obj and redisplay it
            obj.Recalculate()
            UpdateFinalMatrix()
        }

        // move up/left button
        let upBtn = document.createElement("input")
        upBtn.innerHTML = "up"
        upBtn.type = "submit"
        upBtn.value = '<'
        upBtn.onclick = function() {
            let index = IndexOfChild(this.parentNode)
            if (index <= 0) // if first element, do nothing
                return

            // swap transformation matrix left
            let temp = obj.transMats[index]
            obj.transMats[index] = obj.transMats[index-1]
            obj.transMats[index-1] = temp

            // swap transformation matrix info left
            let temp2 = infoArr[index]
            infoArr[index] = infoArr[index-1]
            infoArr[index-1] = temp2

            // update obj and redisplay it
            obj.Recalculate()
            UpdateFinalMatrix()
        }

        // down/right button
        let downBtn = document.createElement("input")
        downBtn.innerHTML = "down"
        downBtn.type = "submit"
        downBtn.value = '>'
        downBtn.onclick = function() {
            let index = IndexOfChild(this.parentNode)
            if (index >= this.parentNode.parentNode.children.length-1) // if its the last element, do nothing
                return

            // swap transformation matrix right
            let temp = obj.transMats[index]
            obj.transMats[index] = obj.transMats[index+1]
            obj.transMats[index+1] = temp

            // swap transformation matrix info right
            let temp2 = infoArr[index]
            infoArr[index] = infoArr[index+1]
            infoArr[index+1] = temp2

            // update obj and redisplay it
            obj.Recalculate()
            UpdateFinalMatrix()
        }

        // add all of to the div
        transList.appendChild(matDiv)
        matDiv.appendChild(info)
        matDiv.appendChild(table)
        matDiv.appendChild(upBtn)
        matDiv.appendChild(editBtn)
        matDiv.appendChild(deleteBtn)
        matDiv.appendChild(downBtn)
    }

    // update 3D obj display10
    DoRedisplay(canvas, sceneObjects)
    DoRedisplay(canvas, lineObjects, "LINES")
}

// read in data & add transformation matrix & info to the obj & infoArr
function AddTransformation() {
    // input
    let scaleVal = document.getElementById('scale-in').value
    let rotateDeg = document.getElementById('rotate-in').value
    let rotateDim = document.getElementById('rotate-dim-in').value.split(',') // [x,y,x] - each dimension is 0 or 1
    let transX = document.getElementById('translate-x-in').value
    let transY = document.getElementById('translate-y-in').value
    let transZ = document.getElementById('translate-z-in').value

    let rotateAxis = ""
    if (rotateDim[0] == 1) // [1,0,0]
        rotateAxis = "x"
    else if (rotateDim[1] == 1) // [0,1,0]
        rotateAxis = "y"
    else // [0,0,1]
        rotateAxis = "z"

    // info stuff
    let infoO = {}
    let info = "Scale: " + scaleVal + ", Rotate: " + rotateDeg + " (" + rotateAxis + "-axis), Translate: (" + transX + ", " + transY + ", " + transZ + ")"
    infoO.info = info
    infoO.edit = false // default
    infoArr.push(infoO)

    // matrix stuff
    let scaleMat = scalem(scaleVal, scaleVal, scaleVal)
    let rotateMat = rotate(rotateDeg, rotateDim)
    let transMat = translate(transX, transY, transZ)

    let finalMat = mat4(1)
    finalMat = mult(finalMat, scaleMat)
    finalMat = mult(finalMat, rotateMat)
    finalMat = mult(finalMat, transMat)
    obj.Push(finalMat)

    UpdateFinalMatrix()
}
