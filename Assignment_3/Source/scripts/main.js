// Canvas props
var canvas, gl, program;

// Matrices
var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;

// Buffers
var vBuffer, nBuffer, tBuffer;
var vPosition, vNormal, vTexCoord;

var model = 0;          // 0: ellipse / 1: torus
var shading = 0;        // 0: wireframe / 1: phong / 2: Gouraud
var env_map = false;

var vertices = [];
var normals = [];
var textCoords = [];

// Texture / Environment mapping
var texture, t_ind = 0;
var tex_url = img_urls[t_ind];
var cubeMap;

// Onload
window.onload = function init()
{
    loadTextures();
    document.body.style.zoom = "90%";   // Setting zoom

    // Canvas
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl)
        alert("WebGL isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.enable(gl.DEPTH_TEST);

    updateProgram();

    updateSliders();
    handleEvents();
    render();
}

// SUperquadrics
function generate_superquadrics()
{
    vertices = [];
    normals = [];

    if(model == 0)
        generate_vertices("ellipse");
    else if(model == 1)
        generate_vertices("torus");

    if(shading === 1 || shading === 2)
    {
        nBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

        vNormal = gl.getAttribLocation(program, "vNormal");
        gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);

        tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(textCoords), gl.STATIC_DRAW );

        vTexCoord = gl.getAttribLocation(program, "vTexCoord");
        gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vTexCoord);

        // Environment map
        configureCubeMap();

        gl.activeTexture( gl.TEXTURE0);
        gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

        // Texture map
        configureTexture();

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    }

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

// Rendering
function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius * Math.sin(theta) * Math.cos(phi), radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta));

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));

    // Draw
    for(var j = 0; j < vertices.length; j += 3)
    {
        if(shading === 0)
            gl.drawArrays(gl.LINES, j, 3);
        else
            gl.drawArrays(gl.TRIANGLES, j, 3);
    }

    requestAnimFrame(render);
}

// Handling listeners/events
function handleEvents()
{
    // Options
    // Shading
    document.getElementById('shading-type').addEventListener("change", function()
    {
        shading = parseInt(document.getElementById('shading-type').value);
        updateSliders();
        updateProgram();
    });

    // Model
    document.getElementById('model').addEventListener("change", function()
    {
        options = document.getElementById("model");

        model = (options.selectedIndex == 0) ? 0 : 1;

        updateSliders();
        generate_superquadrics();
    });

    // Environment mapping
    document.getElementById('env-active').addEventListener("change", function()
    {
        env_map = this.checked;
        document.getElementById("texture").disabled = env_map;
        updateProgram();
    });

    // Texture
    document.getElementById('texture').addEventListener("change", function()
    {
        options = document.getElementById("texture");

        t_ind = options.selectedIndex;
        tex_url = img_urls[t_ind];

        updateSliders();
        generate_superquadrics();
    });

    // Slider
    document.getElementById('e1').onchange = function()
    {
        e1 = parseFloat(this.value);
        updateSliders();
        generate_superquadrics();
    };

    document.getElementById('e2').onchange = function()
    {
        e2 = parseFloat(this.value);
        updateSliders();
        generate_superquadrics();
    };

    document.getElementById('a1').onchange = function()
    {
        a1 = parseFloat(this.value);
        updateSliders();
        generate_superquadrics();
    };

    document.getElementById('a2').onchange = function()
    {
        a2 = parseFloat(this.value);
        updateSliders();
        generate_superquadrics();
    };

    document.getElementById('a3').onchange = function()
    {
        a3 = parseFloat(this.value);
        updateSliders();
        generate_superquadrics();
    };

    document.getElementById('t-r').onchange = function()
    {
        t_radius = parseFloat(this.value);
        updateSliders();
        generate_superquadrics();
    };

    // Mouse events
    var down_point;
    var cur_position;

    // Down
    canvas.addEventListener('mousedown', function(evt)
    {
        down_point = getMousePosition(canvas, evt);
    }, false);

    // Move
    canvas.addEventListener('mousemove', function(evt)
    {
        cur_position = getMousePosition(canvas, evt);

        if(down_point !== undefined)
        {
            var dx = cur_position.x - down_point.x;
            var dy = cur_position.y - down_point.y;

            theta += dx * 0.01;
            phi += dy * 0.01;

            // phi = (phi < -Math.PI / 2 + 0.001) ? -Math.PI / 2 + 0.001 : phi;
            // phi = (phi > Math.PI / 2 - 0.001) ?  Math.PI / 2 - 0.001 : phi;

            // Reference: https://github.com/sicKitchen/SuperQuadric/blob/master/superquadric.html
            if(phi < -Math.PI / 2 + 0.001)
                phi = -Math.PI / 2 + 0.001;
            else if(phi > Math.PI / 2 - 0.001)
                phi = Math.PI / 2 - 0.001;

            down_point = cur_position;
        }

    }, false);

    // Up
    canvas.addEventListener('mouseup', function(evt)
    {
        cur_position = getMousePosition(canvas, evt);
        down_point = undefined;
    }, false);

    // Touch (for mobile)
    // start
    canvas.addEventListener('touchstart', function(evt)
    {
        down_point = getTouchPosition(canvas, evt);
        console.log(down_point);
    }, false);

    // Move
    canvas.addEventListener('touchmove', function(evt)
    {
        cur_position = getTouchPosition(canvas, evt);

        if(down_point !== undefined)
        {
            var dx = cur_position.x - down_point.x;
            var dy = cur_position.y - down_point.y;

            theta += dx * 0.01;
            phi += dy * 0.01;

            // Reference: https://github.com/sicKitchen/SuperQuadric/blob/master/superquadric.html
            if(phi < -Math.PI / 2 + 0.001)
                phi = -Math.PI / 2 + 0.001;
            else if(phi > Math.PI / 2 - 0.001)
                phi = Math.PI / 2 - 0.001;

            down_point = cur_position;
        }

    }, false);

    // end
    canvas.addEventListener('touchend', function(evt)
    {
        cur_position = getMousePosition(canvas, evt);
        down_point = undefined;
    }, false);


    // Getting mouse position on canvas
    function getMousePosition(canvas, event)
    {
        var boundary = canvas.getBoundingClientRect();
        return {
            x: event.clientX - boundary.left,
            y: event.clientY - boundary.top
        };
    }

    // Getting touch position on canvas
    function getTouchPosition(canvas, event)
    {
        var boundary = canvas.getBoundingClientRect();
        return {
            x: event.touches[0].clientX - boundary.left,
            y: event.touches[0].clientY - boundary.top
        };
    }

    // Buttons
    document.getElementById("theta+").onclick = function(){ theta += dr; };
    document.getElementById("theta-").onclick = function(){ theta -= dr; };
    document.getElementById("phi+").onclick = function(){ phi += dr; };
    document.getElementById("phi-").onclick = function(){ phi -= dr; };

    document.getElementById("zoom-in").onclick = function(){ updateZoom('+'); };
    document.getElementById("zoom-out").onclick = function(){ updateZoom('-'); };

    document.getElementById("save").onclick = function()
    {
        var filename = (model === 0) ? "superellipsoid.txt" : "supertoroid.txt";

        var data = {
            model: model,
            shading: shading,
            a1: a1,
            a2: a2,
            a3: a3,
            t_radius: t_radius,
            t_ind: t_ind,
            e1: e1,
            e2: e2
        };

        download(filename, JSON.stringify(data));
        toastr.success("Model has been successfully downloaded!");
    };

    document.getElementById("load").onchange = function()
    {
        var file = this.files[0];
        var fileReader = new FileReader();

        // Reference:   https://blog.teamtreehouse.com/reading-files-using-the-html5-filereader-api
        fileReader.onload = function(e)
        {
            var loaded_string = this.result;
            var data = JSON.parse(loaded_string);

            model = data.model;

            shading = data.shading;

            t_ind = data.t_ind; // texture index
            tex_url = img_urls[t_ind];

            a1 = data.a1;
            a2 = data.a2;
            a3 = data.a3;

            t_radius = data.t_radius;
            e1 = data.e1;
            e2 = data.e2;

            updateProgram();
            updateSliders();
            generate_superquadrics();
        };

        fileReader.readAsText(file);
        toastr.success("Model has been successfully loaded!");
    };
}

// Updating slider
function updateSliders()
{
    if(model === 0)
        document.getElementById('torus').style.display = "none";
    else
        document.getElementById('torus').style.display = "block";

    document.getElementById('env-active').disabled = (shading === 0);
    document.getElementById("texture").disabled = (shading === 0);

    document.getElementById('e1').value = "" + e1;
    document.getElementById('e1').value = "" + e1;
    document.getElementById('e1_val').innerHTML = "" + e1;

    document.getElementById('e2').value = "" + e2;
    document.getElementById('e2').value = "" + e2;
    document.getElementById('e2_val').innerHTML = "" + e2;

    document.getElementById('a1').value = "" + a1;
    document.getElementById('a2').value = "" + a2;
    document.getElementById('a3').value = "" + a3;
    document.getElementById('a1_val').innerHTML = "" + a1;
    document.getElementById('a2_val').innerHTML = "" + a2;
    document.getElementById('a3_val').innerHTML = "" + a3;

    document.getElementById('t-r').value = "" + t_radius;
    document.getElementById('t-r_val').innerHTML = "" + t_radius;

    document.getElementById("shading-type").value = shading;
    document.getElementById("model").value = model + 1;
    document.getElementById("texture").value = t_ind + 1;
}

// Update program
function updateProgram()
{
    if(shading === 0)
        program = initShaders(gl, "wire-frame-vertex-shader", "wire-frame-fragment-shader");
    else if(shading === 1)
        program = (!env_map) ? initShaders(gl, "phong-vertex-shader", "phong-fragment-shader") : initShaders(gl, "phong-vertex-shader", "phong-fragment-shader-env");
    else if(shading === 2)
        program = (!env_map) ? initShaders(gl, "gouraud-vertex-shader", "gouraud-fragment-shader") : initShaders(gl, "gouraud-vertex-shader", "gouraud-fragment-shader-env");

    gl.useProgram(program);

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    // Generating vertices
    generate_superquadrics();

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );

    handleEvents();

    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct));
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct));
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct));
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition));
    gl.uniform1f( gl.getUniformLocation(program, "shininess"), materialShininess);
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
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    });

    requestCORSIfNotSameOrigin(img, tex_url);
    img.src = tex_url;
}

/**
    Obtained from Lecture codes
*/
function configureCubeMap() {

    cubeMap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pattern);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pattern);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pattern);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pattern);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pattern);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pattern);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
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

function loadTextures()
{
    document.getElementById("texture").innerHTML = "";
    for(var i = 0; i < img_urls.length; i++)
    {
        var option = document.createElement("option");
        option.value = i + 1;
        option.innerHTML = "" + (i + 1);
        document.getElementById("texture").appendChild(option);
    }
}
