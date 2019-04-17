// set up the canvas
let canvas = new Canvas(1080, 720, 'gl-canvas');

// objects to transform & display
let sceneObjects = [];
let lineObjects = [];

// mouse dragging vars
let mouseStart = {x: 0, y: 0};
let mouseEnd = {x: 0, y: 0};
let mousedown = false;

// json output vars
let outJSON = "";
let copyText = document.getElementById('JSON');

// input object file element
let fileInput = document.getElementById('file');

// matrix divs
let transList = document.getElementById('individual-matrices')
let finalMatrix = document.getElementById('final-matrix')

let obj = sceneObjects[0] // object being transformed
let infoArr = [] // stores transformation info corresponds to obj.transMats

// returns axis object to draw
function CreateAxis() {
    let lines = {
        Triangles: [[1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]],
        BC: []
    }

    for (var i = 0; i < lines.Triangles.length/2; i++) {
        lines.BC.push([1,0,0], [0,1,0], [0,0,1])
    }

    return lines
}

//add a callback for left click down
canvas.disp.addEventListener("mousedown", function(e) {
    mousedown = true;
    // store click location
    mouseStart.x = e.x;
    mouseStart.y = e.y;
});

//add a callback for mouse movement
canvas.disp.addEventListener('mousemove', function(e) {
    if (!mousedown) // if user isn't dragging, do nothing
      return;

    // store location moved to
    mouseEnd.x = e.x;
    mouseEnd.y = e.y;

    // rotate the scene porpotional to the distance dragged
    canvas.yr = mouseEnd.x - mouseStart.x;
    canvas.xr = mouseStart.y - mouseEnd.y;
    DoRedisplay(canvas, sceneObjects);
    DoRedisplay(canvas, lineObjects, "LINES");
});

//add a callback for left click release
canvas.disp.addEventListener("mouseup", function(e) {
    mousedown = false;
});

//add a callback for mouse wheel
canvas.disp.addEventListener("wheel", function(e) {
    //move the camera further or closer to the object depending on scroll direction
    canvas.ez -= e.deltaY / (-4*Math.abs(e.deltaY)); // scale scroll value
    canvas.RedoCameraMat();
    DoRedisplay(canvas, sceneObjects);
    DoRedisplay(canvas, lineObjects, "LINES");
});

function MakeSceneObj(model) {
    let modelObj = new ModelDisplay(canvas, model)
    let sceneObj = new SceneObject(canvas, modelObj)

    return sceneObj
}

// when the input file changes, most comonly, from no file to some file
fileInput.addEventListener("change", function(e){
  let reader = new FileReader();

  reader.onload = function() { // when the file is loaded
    let fileName = fileInput.files[0].name; // file name w/ extension
    let model = LoadModelFile(fileName, reader.result); // parse file
    sceneObjects[0] = MakeSceneObj(model); // reset obj
    obj = sceneObjects[0];
    infoArr = []; // clear infoArr
    UpdateFinalMatrix();
    DoRedisplay(canvas, sceneObjects); // display obj
    DoRedisplay(canvas, lineObjects, "LINES"); // display axis
  }

  reader.readAsText(fileInput.files[0]);
})

// build the scene
MakeScene(sceneObjects);

// redisplay it.
DoRedisplay(canvas, sceneObjects);
DoRedisplay(canvas, lineObjects, "LINES");

// displays an array of scene objects onto the canvas
function DoRedisplay(canvas, objects, type) {
   type = type ? type : "TRIANGLES"; // if type is null, type = TRIANGLES
   canvas.Redisplay(); // clear canvas

   if (type == "LINES") { // if we want to display lines
        for (let i = 0; i < sceneObjects.length; i++) // display sceneObjects first
            sceneObjects[i].Display()
    }

   for (let i = 0; i< objects.length; i++) // display object array
        objects[i].Display(type);
};

function MakeScene(objectList) {
    // setup axis
    let axisModel = new ModelDisplay(canvas, CreateAxis())
    let axisObj = new SceneObject(canvas, axisModel)
    axisObj.Color([1,0,0,1])
    lineObjects = [axisObj]

    // a dragon placeholder (just for fun)
    let dragon = LoadModelFile("dragon.json")
    let x = LoadModelFile("X.json")
    let y = LoadModelFile("Y.json")

    // create obj and the axis label
    let dragonObj = MakeSceneObj(dragon)
    let xObj = MakeSceneObj(x)
    let yObj = MakeSceneObj(y)

    xObj.Push(translate(1, -0.075, 0))
    xObj.Push(scalem(.1, .1, .1))

    yObj.Push(translate(-0.05, 1, 0))
    yObj.Push(scalem(.1, .1, .1))

    sceneObjects = [dragonObj, xObj, yObj]
    obj = dragonObj

    return;
}
