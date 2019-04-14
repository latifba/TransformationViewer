
function WriteMatrixToTable(matrix, table) {
    for (var i = 0; i < table.rows.length; i++)
        for (var j = 0; j < table.rows[i].children.length; j++)
            table.rows[i].children[j].innerHTML = Math.round(matrix[i][j] * 100)/100
}

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

function WriteTableToMatrix(table, matrix) {
    for (var i = 0; i < matrix.length; i++)
        for (var j = 0; j < matrix[i].length; j++)
            matrix[i][j] = parseFloat(table.rows[i].children[j].children[0].value)
}

function IndexOfChild(child) {
    var i = 0
    while( (child = child.previousSibling) != null )
        i++
    return i
}

function UpdateFinalMatrix() {
    let transList = document.getElementById('individual-matrices')
    let finalMatrix = document.getElementById('final-matrix')

    while (transList.hasChildNodes())
        transList.firstChild.remove()

    WriteMatrixToTable(obj.transMat, finalMatrix)

    for (var i = 0; i < obj.transMats.length; i++) {
        let mat = obj.transMats[i]
        let table = finalMatrix.cloneNode(true)

        if (infoArr[i].edit)
            WriteMatrixEditable(mat, table)
        else
            WriteMatrixToTable(mat, table)

        let matDiv = document.createElement("div")
        matDiv.className = "matrix"

        let info = document.createElement("h3")
        info.innerHTML = infoArr[i].info

        let deleteBtn = document.createElement("input")
        deleteBtn.type = "submit"
        deleteBtn.value = "Delete"
        deleteBtn.onclick = function() {
            this.parentNode.remove()
            obj.transMats.splice(IndexOfChild(this.parentNode), 1)
            infoArr.splice(IndexOfChild(this.parentNode), 1)
            obj.Recalculate()
            UpdateFinalMatrix()
        }

        let editBtn = document.createElement("input")
        editBtn.type = "submit"
        if (infoArr[i].edit)
            editBtn.value = "Submit"
        else
            editBtn.value = "Edit"

        editBtn.onclick = function() {
            let index = IndexOfChild(this.parentNode)
            if (infoArr[index].edit)
                WriteTableToMatrix(this.parentNode.children[1], obj.transMats[index])

            infoArr[index].edit = infoArr[index].edit ? false : true

            obj.Recalculate()
            UpdateFinalMatrix()
        }

        let upBtn = document.createElement("input")
        upBtn.innerHTML = "up"
        upBtn.type = "submit"
        upBtn.value = '<'
        upBtn.onclick = function() {
            let index = IndexOfChild(this.parentNode)
            if (index <= 0)
                return

            let temp = obj.transMats[index]
            obj.transMats[index] = obj.transMats[index-1]
            obj.transMats[index-1] = temp

            let temp2 = infoArr[index]
            infoArr[index] = infoArr[index-1]
            infoArr[index-1] = temp2

            obj.Recalculate()
            UpdateFinalMatrix()
        }

        let downBtn = document.createElement("input")
        downBtn.innerHTML = "down"
        downBtn.type = "submit"
        downBtn.value = '>'
        downBtn.onclick = function() {
            let index = IndexOfChild(this.parentNode)
            if (index >= this.parentNode.parentNode.children.length-1)
                return

            let temp = obj.transMats[index]
            obj.transMats[index] = obj.transMats[index+1]
            obj.transMats[index+1] = temp

            let temp2 = infoArr[index]
            infoArr[index] = infoArr[index+1]
            infoArr[index+1] = temp2

            obj.Recalculate()
            UpdateFinalMatrix()
        }

        transList.appendChild(matDiv)
        matDiv.appendChild(info)
        matDiv.appendChild(table)
        matDiv.appendChild(upBtn)
        matDiv.appendChild(editBtn)
        matDiv.appendChild(deleteBtn)
        matDiv.appendChild(downBtn)
    }

    DoRedisplay(canvas, sceneObjects)
    DoRedisplay(canvas, lineObjects, "LINES")
}

function AddTransformation() {
    let scaleVal = document.getElementById('scale-in').value
    let rotateDeg = document.getElementById('rotate-in').value
    let rotateDim = document.getElementById('rotate-dim-in').value.split(',')
    let transX = document.getElementById('translate-x-in').value
    let transY = document.getElementById('translate-y-in').value
    let transZ = document.getElementById('translate-z-in').value

    let rotateAxis = ""
    if (rotateDim[0] == 1)
        rotateAxis = "x"
    else if (rotateDim[1] == 1)
        rotateAxis = "y"
    else
        rotateAxis = "z"

    let infoO = {}
    let info = "Scale: " + scaleVal + ", Rotate: " + rotateDeg + " (" + rotateAxis + "-axis), Translate: (" + transX + ", " + transY + ", " + transZ + ")"

    let scaleMat = scalem(scaleVal, scaleVal, scaleVal)
    let rotateMat = rotate(rotateDeg, rotateDim)
    let transMat = translate(transX, transY, transZ)

    let finalMat = mat4(1)
    finalMat = mult(finalMat, scaleMat)
    finalMat = mult(finalMat, rotateMat)
    finalMat = mult(finalMat, transMat)
    obj.Push(finalMat)

    infoO.info = info
    infoO.edit = false
    infoArr.push(infoO)

    UpdateFinalMatrix()
}
