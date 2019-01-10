// ** Global WebGL main properties **
var canvas, gl, program;

// Matrices
var projectionMatrix, modelViewMatrix, instanceMatrix;
var modelViewMatrixLoc;

var body_parts = [];  // Array for keeping body parts
var stack = [];       // Matrix stack for traversal algorithm

// For keeping vertices in quad form
var points = [];
var normals = [];
var colors = [];

// Vertex and Color and Texture buffer
var vBuffer, cBuffer, nBuffer, tBuffer;

// Default initing nodes
for(var i = 0; i < node_num; i++)
{
    body_parts[i] = createNode(null, null, null, null);
}

// **** ANIMATION ****
var key_frames = [];    // Joint angles and global x&y

// **** Lighting & Shading ****
var lightPos = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.0, 0.7, 0.0, 1.0);
var lightDiffuse = vec4(0.0, 0.7, 0.0, 1.0);
var lightSpecular = vec4(0.0, 0.7, 0.0, 1.0);

var materialAmbient = vec4(0.0, 0.7, 0.0, 1.0);
var materialDiffuse = vec4(0.0, 0.6, 0.0, 1.0);
var materialSpecular = vec4(0.0, 0.7, 0.0, 1.0);
var materialShininess = 100.0;

// **** TEXTURE ****
var texCoordsArray = [];
var texture;
var texSize = 256;

// Texture URL : Reference: https://imgur.com
var tex_url = "https://i.imgur.com/bEZZfeY.jpg";


var test_tex = new Uint8Array(4 * texSize * texSize);
var c;
var numChecks = 3;
for ( var i = 0; i < texSize; i++ ) {
    for ( var j = 0; j <texSize; j++ ) {
        var patchx = Math.floor(i/(texSize/numChecks));
        var patchy = Math.floor(j/(texSize/numChecks));
        if(patchx%2 ^ patchy%2) c = 255;
        else c = 0;
        //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
        test_tex[4*i*texSize+4*j] = c;
        test_tex[4*i*texSize+4*j+1] = c;
        test_tex[4*i*texSize+4*j+2] = c;
        test_tex[4*i*texSize+4*j+3] = 255;
    }
}

// ***********************************************************

/**
    WINDOW ONLOAD
*/
window.onload = function init()
{
    document.body.style.zoom = "80%";   // Setting zoom
    updateSliders();

    // Setting up canvas and WebGL
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) alert("WebGL is not available!");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.enable(gl.DEPTH_TEST);

    // Loading the shaders and using them
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    instanceMatrix = mat4();
    projectionMatrix = ortho(-40.0,40.0,-22.0, 22.0,-40.0,40.0);
    modelViewMatrix = mat4();

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")

    cube();

    // Sending color properties to GPU through buffer
    // cBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    // var vColor = gl.getAttribLocation(program, "vColor");
    // gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(vColor);

    // Sending normal properties to GPU through buffer
    nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    // Sending vertex properties to GPU through buffer
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(vPosition);

    tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    // Lighting and Shading
    var ambientProd = mult(lightAmbient, materialAmbient);
    var diffuseProd = mult(lightDiffuse, materialDiffuse);
    var specularProd = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProd"), flatten(ambientProd));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProd"), flatten(diffuseProd));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProd"), flatten(specularProd));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), flatten(lightPos));

    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
    // ********* ---------------------- **************************

    configureTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    handleEvents();
    initAllNodes();

    // Calling render
    render();
}

/**
    Render to screen
*/
var render = function()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Traverse
    traverse(torso.id);

    requestAnimFrame(render);
}

function updateSliders()
{
    document.getElementById('head-x').value = "" + theta[head.id];
    document.getElementById('head-y').value = "" + theta[head.id2];

    document.getElementById('neck').value = "" + theta[neck.id];

    document.getElementById('ant-l').value = "" + theta[anthenna.left_id];
    document.getElementById('ant-r').value = "" + theta[anthenna.right_id];

    document.getElementById('torso-r-x').value = "" + theta[torso.id];
    document.getElementById('torso-r-y').value = "" + theta[torso.id2];
    document.getElementById('torso-r-z').value = "" + theta[torso.id3];

    document.getElementById('front-r-u-x').value = "" + theta[front_limbs.upper.right_id];
    document.getElementById('front-r-u-z').value = "" + theta[front_limbs.upper.right_id2];
    document.getElementById('front-r-l').value = "" + theta[front_limbs.lower.right_id];
    document.getElementById('front-m-l').value = "" + theta[front_limbs.middle.left_id];
    document.getElementById('front-m-r').value = "" + theta[front_limbs.middle.right_id];
    document.getElementById('front-l-l').value = "" + theta[front_limbs.lower.left_id];
    document.getElementById('front-l-u-x').value = "" + theta[front_limbs.lower.right_id];
    document.getElementById('front-l-u-x').value = "" + theta[front_limbs.lower.right_id2];

    document.getElementById('back-r-u').value = "" + theta[back_limbs.upper.right_id];
    document.getElementById('back-r-l').value = "" + theta[back_limbs.lower.right_id];
    document.getElementById('back-l-u').value = "" + theta[back_limbs.upper.left_id];
    document.getElementById('back-l-l').value = "" + theta[back_limbs.lower.left_id];

    document.getElementById('mid-r-u').value = "" + theta[middle_limbs.upper.right_id];
    document.getElementById('mid-r-l').value = "" + theta[middle_limbs.lower.right_id];
    document.getElementById('mid-l-u').value = "" + theta[middle_limbs.upper.left_id];
    document.getElementById('mid-l-l').value = "" + theta[middle_limbs.lower.right_id];
}

/**
    Handling event actions
*/
function handleEvents()
{
    // BUTTONS  ----------------------------
    // Save key frame
    document.getElementById('save-k-f').addEventListener("click", function()
    {
        if(key_frames.length == 0)
        {
            key_frames.push(theta.slice());
        }
        else
        {
            var neww = theta.slice();
            var last = key_frames.pop();

            var diff = [];
            for(var i = 0; i < last.length; i++)
            {
                diff.push(last[i] - neww[i]);
            }

            var temp_diff = diff.slice();
            for(var i = 0; i < temp_diff.length; i++)
            {
                temp_diff[i] = (temp_diff[i] < 0) ? temp_diff[i] * (-1) : temp_diff[i];
            }

            var min_diff = Math.min.apply(null, temp_diff.filter(Boolean));

            for(var i = 0; i < last.length; i++)
            {
                diff[i] /= min_diff;
            }

            for(var i = 0; i < Math.abs(min_diff); i++)
            {
                var last = last.map(function (num, idx) {
                  return num - diff[idx];
                });
                key_frames.push(last);
            }
        }

        toastr.success("Posture has been saved!");
    });

    // Load last key frame
    document.getElementById('load-l-k-f').addEventListener("click", function()
    {
        if(key_frames.length == 0)
        {
            toastr.warning("Key Frame list is already empty!");
        }
        else
        {
            loadLastFrame();
            toastr.success("Last Frame is successfully loaded!");
        }
    });

    // Save key frame
    document.getElementById('clear-k-f').addEventListener("click", function()
    {
        if(key_frames.length == 0)
        {
            toastr.warning("Key Frame list is already empty!");
        }
        else
        {
            key_frames = [];
            toastr.success("All Key Frames have been cleared!");
        }
    });

    // Save animation
    document.getElementById('save-anim').addEventListener("click", function()
    {
        var saved_data = "";

        for(var i = 0; i < key_frames.length; i++)
        {
            saved_data += key_frames[i];
            saved_data = (i == key_frames.length - 1) ? saved_data : saved_data + splitter;
        }

        download("animation.txt", saved_data);
        toastr.success("Animation has been successfully downloaded!");
    });

    // Load animation
    document.getElementById('run-anim').addEventListener("click", function()
    {
        if(key_frames.length == 0)
        {
            toastr.warning("No animation frame has been set");
        }
        else
        {
            var k = 0;
            function animate()
            {
                document.getElementById('run-anim').disabled = true;
                document.getElementById('anim-speed').disabled = true;
                if(k == key_frames.length)
                {
                    k = 0;
                    if(!document.getElementById('is-loop').checked)
                    {
                        document.getElementById('run-anim').disabled = false;
                        document.getElementById('anim-speed').disabled = false;
                        clearInterval(animation);

                        setTimeout(function()
                        {
                            theta = default_theta.slice();
                            initAllNodes();
                            toastr.success("Default position has been set! You can view last key frame using 'Load Last Key Frame' button");
                        }, 1000);
                    }
                }
                else
                {
                    theta = key_frames[k];
                    initAllNodes();
                    k++;
                }
            }
            var animation = setInterval(animate, anim_delay);
        }
    });

    // Run animation
    document.getElementById('load-anim').onchange = function()
    {
        var file = this.files[0];
        var fileReader = new FileReader();

        // Reference:   https://blog.teamtreehouse.com/reading-files-using-the-html5-filereader-api
        fileReader.onload = function(e)
        {
            key_frames = [];    // Clearing the array of frames

            var data = this.result;
            data = data.split(splitter);

            for(var i = 0; i < data.length; i++)
            {
                var parsed_data = JSON.parse("[" + data[i] + "]")
                key_frames.push(parsed_data);
            }
        };

        fileReader.readAsText(file);
        toastr.success("Animation has been successfully loaded! Click Run!");
    };

    // SLIDERS  ----------------------------

    // Animation speed
    document.getElementById('anim-speed').onchange = function()
    {
        switch (parseInt(this.value)) {
            case 1:
                anim_delay = 30;
                break;
            case 2:
                anim_delay = 20;
                break;
            case 3:
                anim_delay = 10;
                break;
        };
    };

    // Position X
    document.getElementById('pos-x').onchange = function()
    {
        position_x = parseFloat(this.value);
        theta[angle_num] = position_x;
        gl.viewport(0 + position_x, 0 + position_y, canvas.width, canvas.height);
        initNodes(torso.id);
    };

    // Position Y
    document.getElementById('pos-y').onchange = function()
    {
        position_y = parseFloat(this.value);
        theta[angle_num + 1] = position_y;
        gl.viewport(0 + position_x, 0 + position_y, canvas.width, canvas.height);
        initNodes(torso.id);
    };

    // HEAD
    document.getElementById('head-x').onchange = function()
    {
        theta[head.id] = parseFloat(this.value);
        initNodes(head.id);
    };

    document.getElementById('head-y').onchange = function()
    {
        theta[head.id2] = parseFloat(this.value);
        initNodes(head.id2);
    };
    // --------------

    // NECK
    document.getElementById('neck').onchange = function()
    {
        theta[neck.id] = parseFloat(this.value);
        initNodes(neck.id);
    };
    // --------------

    // ANTHENNA
    document.getElementById('ant-r').onchange = function()
    {
        theta[anthenna.right_id] = parseFloat(this.value);
        initNodes(anthenna.right_id);
    };

    document.getElementById('ant-l').onchange = function()
    {
        theta[anthenna.left_id] = parseFloat(this.value);
        initNodes(anthenna.left_id);
    };
    // --------------

    // TORSO
    document.getElementById('torso-r-x').onchange = function()
    {
        theta[torso.id] = parseFloat(this.value);
        initNodes(torso.id);
    };

    document.getElementById('torso-r-y').onchange = function()
    {
        theta[torso.id2] = parseFloat(this.value);
        initNodes(torso.id2);
    };

    document.getElementById('torso-r-z').onchange = function()
    {
        theta[torso.id3] = parseFloat(this.value);
        initNodes(torso.id3);
    };
    // --------------

    // FRONT
    document.getElementById('front-r-u-x').onchange = function()
    {
        theta[front_limbs.upper.right_id] = parseFloat(this.value);
        initNodes(front_limbs.upper.right_id);
    };

    document.getElementById('front-r-u-z').onchange = function()
    {
        theta[front_limbs.upper.right_id2] = parseFloat(this.value);
        initNodes(front_limbs.upper.right_id2);
    };

    document.getElementById('front-m-r').onchange = function()
    {
        theta[front_limbs.middle.right_id] = parseFloat(this.value);
        initNodes(front_limbs.middle.right_id);
    };

    document.getElementById('front-r-l').onchange = function()
    {
        theta[front_limbs.lower.right_id] = parseFloat(this.value);
        initNodes(front_limbs.lower.right_id);
    };

    document.getElementById('front-l-u-x').onchange = function()
    {
        theta[front_limbs.upper.left_id] = parseFloat(this.value);
        initNodes(front_limbs.upper.left_id);
    };

    document.getElementById('front-l-u-z').onchange = function()
    {
        theta[front_limbs.upper.left_id2] = parseFloat(this.value);
        initNodes(front_limbs.upper.left_id2);
    };

    document.getElementById('front-m-l').onchange = function()
    {
        theta[front_limbs.middle.left_id] = parseFloat(this.value);
        initNodes(front_limbs.middle.left_id);
    };

    document.getElementById('front-l-l').onchange = function()
    {
        theta[front_limbs.lower.left_id] = parseFloat(this.value);
        initNodes(front_limbs.lower.left_id);
    };
    // --------------

    // BACK
    document.getElementById('back-r-u').onchange = function()
    {
        theta[back_limbs.upper.right_id] = parseFloat(this.value);
        initNodes(back_limbs.upper.right_id);
    };

    document.getElementById('back-r-l').onchange = function()
    {
        theta[back_limbs.lower.right_id] = parseFloat(this.value);
        initNodes(back_limbs.lower.right_id);
    };

    document.getElementById('back-l-u').onchange = function()
    {
        theta[back_limbs.upper.left_id] = parseFloat(this.value);
        initNodes(back_limbs.upper.left_id);
    };

    document.getElementById('back-l-l').onchange = function()
    {
        theta[back_limbs.lower.left_id] = parseFloat(this.value);
        initNodes(back_limbs.lower.left_id);
    };
    // --------------

    // MIDDLE
    document.getElementById('mid-r-u').onchange = function()
    {
        theta[middle_limbs.upper.right_id] = parseFloat(this.value);
        initNodes(middle_limbs.upper.right_id);
    };

    document.getElementById('mid-r-l').onchange = function()
    {
        theta[middle_limbs.lower.right_id] = parseFloat(this.value);
        initNodes(middle_limbs.lower.right_id);
    };

    document.getElementById('mid-l-u').onchange = function()
    {
        theta[middle_limbs.upper.left_id] = parseFloat(this.value);
        initNodes(middle_limbs.upper.left_id);
    };

    document.getElementById('mid-l-l').onchange = function()
    {
        theta[middle_limbs.lower.left_id] = parseFloat(this.value);
        initNodes(middle_limbs.lower.left_id);
    };

    // --------------
}

/**
    Initializing all nodes
*/
function initAllNodes()
{
    for(var i = 0; i < node_num; i++)
    {
        initNodes(i);
    }
    // Change global position
    position_x = theta[theta.length - 2];
    position_y = theta[theta.length - 1];

    gl.viewport(0 + position_x, 0 + position_y, canvas.width, canvas.height);

    // Change Sliders too
    updateSliders();
}

/**
    Load the last key frame for continue editing the animation
*/
function loadLastFrame()
{
    theta = key_frames[key_frames.length - 1].slice();
    initAllNodes();
}

/**
    Initializing nodes for body parts
*/
function initNodes(id)
{
    var m = mat4();

    switch (id) {
        // TORSO
        case torso.id:
        case torso.id1:
        case torso.id2:
        case torso.id3:

            m = mult(m, rotate(theta[torso.id1], 1, 0, 0));
            m = mult(m, rotate(theta[torso.id2], 0, 1, 0));
            m = mult(m, rotate(theta[torso.id3], 0, 0, 1));
            body_parts[torso.id] = createNode(m, render_torso, null, back_limbs.upper.right_id);

            break;
        // -----------------

        // NECK
        case neck.id:
            m = translate(0.0, -neck.height/2 - 0.7, 0.0);
            m = mult(m, rotate(theta[neck.id], 1, 0, 0));
            body_parts[neck.id] = createNode(m, render_neck, null, head.id);

            break;
        // -----------------

        // HEAD
        case head.id:
        case head.id2:
            m = translate(0.0, -neck.height, 0.0);
            m = mult(m, rotate(theta[head.id], 1, 0, 0));
            m = mult(m, rotate(theta[head.id2], 0, 1, 0));
            body_parts[head.id] = createNode(m, render_head, front_limbs.upper.left_id, anthenna.left_id);

            break;
        // -----------------

        // ANTHENNA
        case anthenna.left_id:
            m = translate(-(head.width / 2 - head.width / 4), -(head.height / 2 + 1), 0.0);
            m = mult(m, rotate(theta[anthenna.left_id], 1, 0, 0));
            m = mult(m, rotate(-10, 0, 0, 1));
            body_parts[anthenna.left_id] = createNode(m, render_anthenna, anthenna.right_id, null);

            break;
        // -----------------
        case anthenna.right_id:
            m = translate((head.width / 2 - head.width / 4), -(head.height / 2 + 1), 0.0);
            m = mult(m, rotate(theta[anthenna.right_id], 1, 0, 0));
            m = mult(m, rotate(10, 0, 0, 1));
            body_parts[anthenna.right_id] = createNode(m, render_anthenna, null, null);

            break;
        // -----------------

        // FRONT LIMBS
        case front_limbs.upper.left_id:
        case front_limbs.upper.left_id2:
            m = translate(-(neck.width / 2 + front_limbs.upper.width / 2), -(front_limbs.upper.height + 1), 0.0);
            m = mult(m, rotate(theta[front_limbs.upper.left_id], 1, 0, 0));
            m = mult(m, rotate(theta[front_limbs.upper.left_id2], 0, 0, 1));
            body_parts[front_limbs.upper.left_id] = createNode(m, render_front_upper, front_limbs.upper.right_id, front_limbs.middle.left_id);

            break;
        // -----------------
        case front_limbs.upper.right_id:
        case front_limbs.upper.right_id2:
            m = translate((neck.width / 2 + front_limbs.upper.width / 2), -(front_limbs.upper.height + 1), 0.0);
            m = mult(m, rotate(theta[front_limbs.upper.right_id], 1, 0, 0));
            m = mult(m, rotate(theta[front_limbs.upper.right_id2], 0, 0, 1));
            body_parts[front_limbs.upper.right_id] = createNode(m, render_front_upper, null, front_limbs.middle.right_id);
            break;
        // -----------------
        case front_limbs.middle.left_id:
            m = translate(0.0, front_limbs.upper.height, 0.0);
            m = mult(m, rotate(theta[front_limbs.middle.left_id], 1, 0, 0));
            body_parts[front_limbs.middle.left_id] = createNode(m, render_front_middle, null, front_limbs.lower.left_id);

            break;
        // -----------------
        case front_limbs.middle.right_id:
            m = translate(0.0, front_limbs.upper.height, 0.0);
            m = mult(m, rotate(theta[front_limbs.middle.right_id], 1, 0, 0));
            body_parts[front_limbs.middle.right_id] = createNode(m, render_front_middle, null, front_limbs.lower.right_id);

            break;
        // -----------------
        case front_limbs.lower.left_id:
            m = translate(0.0, front_limbs.middle.height, 0.0);
            m = mult(m, rotate(theta[front_limbs.lower.left_id], 1, 0, 0));
            body_parts[front_limbs.lower.left_id] = createNode(m, render_front_lower, null, null);

            break;
        // -----------------
        case front_limbs.lower.right_id:
            m = translate(0.0, front_limbs.middle.height, 0.0);
            m = mult(m, rotate(theta[front_limbs.lower.right_id], 1, 0, 0));
            body_parts[front_limbs.lower.right_id] = createNode(m, render_front_lower, null, null);

            break;
        // ----------------

        // MIDDLE LIMBS
        case middle_limbs.upper.left_id:
            m = translate(-(torso.width / 2 + middle_limbs.upper.width / 2), -(torso.height / 2 - 0.4), 0.0);
            m = mult(m, rotate(theta[middle_limbs.upper.left_id], 0, 0, 1));
            body_parts[middle_limbs.upper.left_id] = createNode(m, render_mid_upper, middle_limbs.upper.right_id, middle_limbs.lower.left_id);

            break;
        // -----------------
        case middle_limbs.upper.right_id:
            m = translate((torso.width / 2 + middle_limbs.upper.width / 2), -(torso.height / 2 - 0.4), 0.0);
            m = mult(m, rotate(theta[middle_limbs.upper.right_id], 0, 0, 1));
            body_parts[middle_limbs.upper.right_id] = createNode(m, render_mid_upper, neck.id, middle_limbs.lower.right_id);

            break;
        // -----------------
        case middle_limbs.lower.left_id:
            m = translate(0.0, middle_limbs.upper.height, 0.0);
            m = mult(m, rotate(theta[middle_limbs.lower.left_id], 1, 0, 0));
            body_parts[middle_limbs.lower.left_id] = createNode(m, render_mid_lower, null, null);

            break;
        // -----------------
        case middle_limbs.lower.right_id:
            m = translate(0.0, middle_limbs.upper.height, 0.0);
            m = mult(m, rotate(theta[middle_limbs.lower.right_id], 1, 0, 0));
            body_parts[middle_limbs.lower.right_id] = createNode(m, render_mid_lower, null, null);

            break;

        // BACK LIMBS
        case back_limbs.upper.left_id:
            m = translate(-(torso.width / 2 + back_limbs.upper.width / 2), -2.0, 0.0);
            m = mult(m, rotate(theta[back_limbs.upper.left_id], 0, 0, 1));
            m = mult(m, rotate(-60, 1, 0, 0));
            body_parts[back_limbs.upper.left_id] = createNode(m, render_back_upper, middle_limbs.upper.left_id, back_limbs.lower.left_id);

            break;
        // -----------------
        case back_limbs.upper.right_id:
            m = translate(torso.width / 2 + back_limbs.upper.width / 2, -2.0, 0.0);
            m = mult(m, rotate(theta[back_limbs.upper.right_id], 0, 0, 1));
            m = mult(m, rotate(-60, 1, 0, 0));
            body_parts[back_limbs.upper.right_id] = createNode(m, render_back_upper, back_limbs.upper.left_id, back_limbs.lower.right_id);

            break;
        // -----------------
        case back_limbs.lower.left_id:
            m = translate(0.0, back_limbs.upper.height, 1.20);
            m = mult(m, rotate(theta[back_limbs.lower.left_id], 1, 0, 0));
            body_parts[back_limbs.lower.left_id] = createNode(m, render_back_lower, null, null);

            break;
        // -----------------
            case back_limbs.lower.right_id:
            m = translate(0.0, back_limbs.upper.height, 1.20);
            m = mult(m, rotate(theta[back_limbs.lower.right_id], 1, 0, 0));
            body_parts[back_limbs.lower.right_id] = createNode(m, render_back_lower, null, null);

            break;
    }
}

/** Body component functions **/
function render_torso()
{
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4( torso.width, torso.height, torso.width));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    for(var i = 0; i < 6; i++)
        gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function render_head()
{
    instanceMatrix = mult(modelViewMatrix, translate(0.0, -1.2 * head.height/2, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4( head.id, head.height, head.width));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    for(var i = 0; i < 6; i++)
        gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function render_anthenna()
{
    instanceMatrix = mult(modelViewMatrix, translate(0.0, -head.height - 0.1, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4( anthenna.width, anthenna.height, anthenna.width));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    for(var i = 0; i < 6; i++)
        gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function render_neck()
{
    instanceMatrix = mult(modelViewMatrix, translate(0.0, -1.2 * neck.height/2, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4( neck.id, neck.height, neck.width));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    for(var i = 0; i < 6; i++)
        gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function render_front_upper()
{
    instanceMatrix = mult(modelViewMatrix, translate(0.0, front_limbs.upper.height * 0.5, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4( front_limbs.upper.width, front_limbs.upper.height, front_limbs.upper.width));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    for(var i = 0; i < 6; i++)
        gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function render_front_middle()
{
    instanceMatrix = mult(modelViewMatrix, translate(0.0, front_limbs.middle.height * 0.5, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4( front_limbs.middle.width, front_limbs.middle.height, front_limbs.middle.width));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    for(var i = 0; i < 6; i++)
        gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function render_front_lower()
{
    instanceMatrix = mult(modelViewMatrix, translate(0.0, front_limbs.lower.height * 0.5, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4( front_limbs.lower.width, front_limbs.lower.height, front_limbs.lower.width));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    for(var i = 0; i < 6; i++)
        gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function render_mid_upper()
{
    instanceMatrix = mult(modelViewMatrix, translate(0.0, middle_limbs.upper.height * 0.5, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4( middle_limbs.upper.width, middle_limbs.upper.height, middle_limbs.upper.width));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    for(var i = 0; i < 6; i++)
        gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function render_mid_lower()
{
    instanceMatrix = mult(modelViewMatrix, translate(0.0, middle_limbs.lower.height * 0.4, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4( middle_limbs.lower.width, middle_limbs.lower.height, middle_limbs.upper.width));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    for(var i = 0; i < 6; i++)
        gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function render_back_upper()
{
    instanceMatrix = mult(modelViewMatrix, translate(0.0, back_limbs.upper.height * 0.5, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4( back_limbs.upper.width, back_limbs.upper.height, back_limbs.upper.width));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    for(var i = 0; i < 6; i++)
        gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function render_back_lower()
{
    instanceMatrix = mult(modelViewMatrix, translate(0.0, back_limbs.lower.height * 0.4, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4( back_limbs.lower.width, back_limbs.lower.height, back_limbs.upper.width));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    for(var i = 0; i < 6; i++)
        gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}


/**
    Recursive preorder traversal algorithm for hierarchical model

    id : id of the body part
*/
function traverse(id)
{
    if(id == null)
        return;

    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, body_parts[id].transform);
    body_parts[id].render();

    if(body_parts[id].child != null)
        traverse(body_parts[id].child);

    modelViewMatrix = stack.pop();

    if(body_parts[id].sibling != null)
        traverse(body_parts[id].sibling);
}

/**
    For Creating node for each body component
*/
function createNode(transform, render, sibling, child)
{
    var node =
    {
        transform: transform,
        render: render,
        sibling: sibling,
        child: child,
    }
    return node;
}

/**
    Applying a scale to the cube (or any 3D figure)
*/
function scale4(a, b, c)
{
    var result = mat4();
    result[0][0] = a;
    result[1][1] = b;
    result[2][2] = c;

    return result;
}
/**
    Adding respective vertices to points
*/
function quad(a, b, c, d)
{
    // Calculating normal
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    var normal = vec3(normal);

    normals.push(normal);
    normals.push(normal);
    normals.push(normal);
    normals.push(normal);

    points.push(vertices[a]);
    points.push(vertices[b]);
    points.push(vertices[c]);
    points.push(vertices[d]);

    colors.push(v_colors[a]);
    colors.push(v_colors[b]);
    colors.push(v_colors[c]);
    colors.push(v_colors[d]);

    texCoordsArray.push(texCoord[0]);
    texCoordsArray.push(texCoord[1]);
    texCoordsArray.push(texCoord[2]);
    texCoordsArray.push(texCoord[3]);
}

/**
    Rendering a cube with ordered indices
*/
function cube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

/**
    Configuring texture

    Reference:

    Obtained from Lecture codes
    +
    https://webglfundamentals.org/webgl/lessons/webgl-cors-permission.html

*/
function configureTexture()
{
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    var textureInfo =
    {
        width: 1,
        height: 1,
        texture: texture,
    };

    var img = new Image();
    img.addEventListener('load', function()
    {
        textureInfo.width = img.width;
        textureInfo.height = img.height;

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, test_tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    });

    requestCORSIfNotSameOrigin(img, tex_url);
    img.src = tex_url;
}

/**
    Reference:

    https://webglfundamentals.org/webgl/lessons/webgl-cors-permission.html
*/
function requestCORSIfNotSameOrigin(img, tex_url)
{
    if ((new URL(tex_url)).origin !== window.location.origin)
    {
        img.crossOrigin = "";
    }
}

/**
    Reference:

    https://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
*/
function download(filename, text)
{
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
