//**** Global properties ****
var canvas, gl, program, options;

var random_gen = false, timer = null;

var house_num = 0;
var house_story = 1;


// Elements
var sunn;
var sky;
var ground;
var houses = [];
var trees = [];
var clouds = [];

var cloud_points = [];


/*
    Loading the Window content
*/
window.onload = function init()
{
    // Loading storage files
    options = document.getElementById("storage");
    loadNames();

    // Setting up canvas and WebGL
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) alert("WebGL is not available!");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Loading the shaders and using them
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Elements
    generateHouses();

    generateEnvironment();

    // Events
    handleEvents();

    // Render
    render();
};

/*
    Loads file names to options
*/
function loadNames()
{
    options.innerHTML = "";
    for(var i = 0; i < Object.keys(localStorage).length; i++)
    {
        var option = document.createElement("option");
        option.value = i;
        option.innerHTML = Object.keys(localStorage)[i];
        options.appendChild(option);
    }
}

/*
    Handles UI inputs/events
*/
function handleEvents()
{
    // Click event for adding cloud vertices
    canvas.addEventListener("mousedown", function(event)
    {
        var pos = getNoPaddingNoBorderCanvasRelativeMousePosition(event, canvas);
        var x = pos.x;
        var y = pos.y;

        point = vec2(2 * x / canvas.width - 1,
                     2 * (canvas.height - y) / canvas.height - 1);

        // Clouds should be only in sky
        if(point[1] > -0.3)
        {
            cloud_points.push(point);
        }

        // Max restriction
        if(cloud_points.length == max_cloud_points)
        {
            generateCloud(cloud_points);
            cloud_points = [];
        }
    });

    // Generate Cloud
    document.addEventListener('keydown', function(event)
    {
        // Space
        if(event.keyCode == 13)
        {
            generateCloud(cloud_points);
        }
    });

    // # of houses
    document.getElementById("num-houses").oninput = function()
    {
        document.getElementById("house").innerHTML = this.value;
        house_num = parseInt(this.value);
    }

    // # of houses
    document.getElementById("num-stories").oninput = function()
    {
        document.getElementById("story").innerHTML = this.value;
        house_story = parseInt(this.value);
    }

    // Generate
    document.getElementById("generate").addEventListener("click", function()
    {
        generateHouses();
    });

    // Randomly create
    document.getElementById("randomize").addEventListener("click", function()
    {
        random_gen = !random_gen;

        // Changin button text
        var btn_txt = (!random_gen) ? "Randomize" : "Stop";
        document.getElementById("randomize").innerHTML = btn_txt;

        if(random_gen == true)
        {
            timer = setInterval(function()
            {
                house_num = Math.floor(Math.random() * 7 + 1);
                house_story = Math.floor(Math.random() * 3 + 1);

                document.getElementById("num-houses").value = "" + house_num;
                document.getElementById("house").innerHTML = "" + house_num;
                document.getElementById("num-stories").value = "" + house_story;
                document.getElementById("story").innerHTML = "" + house_story;

                generateHouses();
            }, 500);
        }
        else
        {
            clearInterval(timer);
        }
    });

    // Save
    document.getElementById("save").addEventListener("click", function()
    {
        if (typeof(Storage) !== "undefined")
        {
            // The content that will be saved
            var content = {
                "house_num": house_num,
                "house_story": house_story,
                "houses": houses,
                "trees": trees,
                "clouds": clouds
            }

            // Save with any name
            if(!document.getElementById("save-content").value)
            {
                alert("Please enter a name!");
                return;
            }

            var c_name = document.getElementById("save-content").value;
            localStorage.setItem(c_name, JSON.stringify(content));
            loadNames();
        }
        else
        {
            alert("No Web Storage Support!");
        }
    });

    // Load
    document.getElementById("load").addEventListener("click", function()
    {
        if (typeof(Storage) !== "undefined")
        {
            if(options.selectedIndex == -1)
            {
                alert("No key is chosen!");
                return;
            }

            var c_name = options[options.selectedIndex].text;
            var result = localStorage.getItem(c_name);

            if(!result)
            {
                alert("No result found for '" + c_name + "'");
            }
            else
            {
                result = JSON.parse(result);

                // generating the same houses and trees
                generateHouses(result);

                // generating the clouds
                loadClouds(result.clouds);

                // Updating Slider values
                document.getElementById("num-houses").value = "" + result.house_num;
                document.getElementById("house").innerHTML = "" + result.house_num;
                document.getElementById("num-stories").value = "" + result.house_story;
                document.getElementById("story").innerHTML = "" + result.house_story;
            }
        }
        else
        {
            alert("No Web Storage Support!");
        }
    });

    // Load
    document.getElementById("remove").addEventListener("click", function()
    {
        if (typeof(Storage) !== "undefined")
        {
            if(options.selectedIndex == -1)
            {
                alert("No key is chosen!");
                return;
            }

            var c_name = options[options.selectedIndex].text;
            localStorage.removeItem(c_name);
            loadNames();
            alert("'" + c_name + "' is removed successfully!");
        }
        else
        {
            alert("No Web Storage Support!");
        }
    });

    // Clear
    document.getElementById("clear").addEventListener("click", function()
    {
        if (typeof(Storage) !== "undefined")
        {
            if(localStorage.length == 0)
            {
                alert("Local Storage is already empty!");
                return;
            }
            localStorage.clear();
            loadNames();
        }
        else
        {
            alert("No Web Storage Support!");
        }
    });
};

/*
    For resetting some properties
*/
function reset()
{
    houses = [];
    trees = [];
}

/*
    Generate environment
*/
function generateEnvironment()
{
    var s_circle = generateCircle(sun_center_vertices, sun_radius, sun_color);
    sunn = draw(s_circle.vertices, s_circle.color);

    ground = draw(ground_vertices, ground_color);
    sky = draw(sky_vertices, sky_color);
}

function generateHouses(load=null)
{
    reset();

    var h_temp;

    // Load
    if(load)
    {
        h_temp = load.houses;
        house_num = load.house_num;
        house_story = load.house_story;
    }

    for(var i = 0; i < house_num; i++)
    {
        var h = (load) ? house(i, h_temp[i].color, h_temp[i].stories) : house(i);
        houses.push(h);

        if(i != house_num - 1)
        {
            t = tree(h, program);
            trees.push(t);
        }
    }
}

/*
    Draws a house with index and total number of houses

    i - index of house

*/
function house(i, color=null, story=null)
{
    var house_components = [];

    // ------ Body -------
    var max_stories = house_story;
    var stories = (story) ? story : Math.floor(Math.random() * max_stories + 1);

    var b_width = 0.25;
    var min_house_height = b_width;
    var b_height = min_house_height * stories;

    var b_margin = (2 - house_num * b_width) / (house_num + 1);
    var loc = -1 + (i + 1) * b_margin +  (b_width / 2) * (2 * i + 1);


    if(b_margin < 0.02)
    {
        b_width *= 0.1 * (house_num);
        b_height *= 0.1 * (house_num);
    }

    var b_vertices = [
        vec2(loc + b_width / 2, ground_level + b_height),
        vec2(loc - b_width / 2, ground_level + b_height),
        vec2(loc - b_width / 2, ground_level),
        vec2(loc + b_width / 2, ground_level)
    ];

    // Color
    if(!color)
    {
        var r = Math.random();
        var g = Math.random();
        var b = Math.random();

        var b_color = [
            vec3(r, g, b),
            vec3(r, g, b),
            vec3(r, g, b),
            vec3(r, g, b)
        ];
    }
    else
    {
        var b_color = color;
    }

    // ------ ---- -------

    // ------- Roof -------
    var roof_height = b_width * 0.86;

    var r_vertices = [
        vec2(loc + b_width / 2, ground_level + b_height),
        vec2(loc - b_width / 2, ground_level + b_height),
        vec2(loc, ground_level + b_height + roof_height),
    ];
    // ------ ---- -------

    // ------- Windows -------
    for(var a = 0; a < stories; a++)
    {
        // H
        var w_in_row = 2;
        var w_h_margin = 0.04;
        var w_width = (b_width - ((w_in_row + 1) * w_h_margin)) / w_in_row;

        // V
        var w_v_margin = 0.05; //w_width * 2.27;
        var w_height = (b_height - ((stories + 1) * w_v_margin)) / stories;

        var w_loc_y = ground_level + (a + 1) * w_v_margin + (w_height / 2) * (2 * a + 1);

        for(var j = 0; j < w_in_row; j++)
        {
            var w_loc_x = (loc - b_width / 2) + (j + 1) * w_h_margin + (w_width / 2) * (2 * j + 1);

            var w_vertices = [
                vec2(w_loc_x + w_width / 2, w_loc_y + w_height / 2),
                vec2(w_loc_x - w_width / 2, w_loc_y + w_height / 2),
                vec2(w_loc_x - w_width / 2, w_loc_y),
                vec2(w_loc_x + w_width / 2, w_loc_y)
            ];

            var windoww = draw(w_vertices, window_color);
            house_components.push(windoww);
        }
    }

    // ------ ---- -------

    // -- Pushing into array ---
    // Body
    var body = draw(b_vertices, b_color);
    house_components.push(body);

    // Roof
    var roof = draw(r_vertices, roof_color);
    house_components.push(roof);

    return {
        components: house_components,
        x: loc,
        stories: stories,
        color: b_color,
        h_margin: b_margin,
        width: b_width,
        height: b_height
    };
}

/*
    Draws a tree

    h_x - house x
    h_w - house width
*/
function tree(house)
{
    // All tree components
    var tree_components = [];

    // ------ Trunk -------
    var t_width = house.width / 20;
    var t_height = t_width * 10;

    var loc = house.x + house.width / 2 + house.h_margin / 2;
    var loc_y = ground_level - 0.05;

    var t_vertices = [
        vec2(loc + t_width / 2, loc_y + t_height),
        vec2(loc - t_width / 2, loc_y + t_height),
        vec2(loc - t_width / 2, loc_y),
        vec2(loc + t_width / 2, loc_y)
    ];
    // ----- ----- --------

    var trunk = draw(t_vertices, tree_trunk_color);
    tree_components.push(trunk);

    // ------ Leaves -------
    var radius = t_width * 4;

    var leaf_circle = generateCircle(vec2(loc, ground_level - 0.05 + t_height + radius), radius, tree_leaf_color);
    var leaves = draw(leaf_circle.vertices, leaf_circle.color);
    tree_components.push(leaves);
    // ----- ----- --------

    return tree_components;
}

/*
    Draws shape according to the given vertices and colors
*/
function draw(vertices, color)
{
    // Loading data to GPU through the buffer

    // Color
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(color), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.enableVertexAttribArray(vColor);

    // Vertices
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    return {
        vertices: vertices,
        color: color,
        vBuffer: vBuffer,
        cBuffer: cBuffer,
        vPosition: vPosition,
        vColor: vColor
    };
}

/*
    Generates a cloud with the given points
*/
function generateCloud(vertices)
{
    if(cloud_points.length >= 3)
    {
        var colors = [];

        for(var i = 0; i < vertices.length; i++)
        {
            colors.push(cloud_color);
        }

        var cloud = draw(vertices, colors);
        clouds.push(cloud);
        cloud_points = [];
    }
}

/*
    Generates multiple clouds
*/
function loadClouds(load)
{
    clouds = [];
    for(var i = 0; i < load.length; i++)
    {
        for(var j = 0; j < load[i].vertices.length; j++)
        {
            var point = vec2(load[i].vertices[j][0], load[i].vertices[j][1]);
            cloud_points.push(point);
        }
        generateCloud(cloud_points);
        cloud_points = [];
    }
}

/*
    Generates circle with the given center point, radius and color

    Reference: https://stackoverflow.com/questions/32780958/drawing-a-circle-with-triangles-webgl
*/
function generateCircle(center, radius, color)
{
    var points = [];
    points.push(center);

    var n = 360;

    for(var i = 0; i <= n; i++)
    {
        var scale = canvas.height / canvas.width;

        var x = scale * radius * Math.cos((i / n) * 2.0 * Math.PI);
        var y = radius * Math.sin((i / n) * 2.0 * Math.PI);

        // console.log("*******************");
        // console.log("i: " + i);
        // console.log("x: " + x);
        // console.log("y: " + y);
        // console.log("*******************");

        var p = add(center, vec2(x, y));

        points.push(p);
    }

    var colors = [];
    for(var i = 0; i < points.length; i++)
    {
        colors.push(color);
    }

    return {
        vertices: points,
        color: colors
    }
}

/*
    Linking shader variables with the buffer
*/
function link_shader_buff(vBuffer, cBuffer, vPosition, vColor)
{
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
}

/*
    Renders the objects to screen
*/
function render()
{
    // Clearing color/depth buffer for z index
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // trees
    for(var j = 0; j < trees.length; j++)
    {
        for(var i = 0; i < trees[j].length; i++)
        {
            link_shader_buff(trees[j][i].vBuffer, trees[j][i].cBuffer, trees[j][i].vPosition, trees[j][i].vColor);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, trees[j][i].vertices.length);
        }
    }

    // Houses
    for(var j = 0; j < houses.length; j++)
    {
        for(var i = 0; i < houses[j].components.length; i++)
        {
            link_shader_buff(houses[j].components[i].vBuffer, houses[j].components[i].cBuffer, houses[j].components[i].vPosition, houses[j].components[i].vColor);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, houses[j].components[i].vertices.length);
        }
    }

    // Clouds
    for(var i = 0; i < clouds.length; i++)
    {
        link_shader_buff(clouds[i].vBuffer, clouds[i].cBuffer, clouds[i].vPosition, clouds[i].vColor);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, clouds[i].vertices.length);
    }

    // Sun
    link_shader_buff(sunn.vBuffer, sunn.cBuffer, sunn.vPosition, sunn.vColor);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, sunn.vertices.length);

    // Ground
    link_shader_buff(ground.vBuffer, ground.cBuffer, ground.vPosition, ground.vColor);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, ground.vertices.length);

    // Sky
    link_shader_buff(sky.vBuffer, sky.cBuffer, sky.vPosition, sky.vColor);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, sky.vertices.length);

    requestAnimFrame(render);
}

/*
    Canvas is centered so positions are also changed.

    https://stackoverflow.com/questions/42309715/how-to-correctly-pass-mouse-coordinates-to-webgl
*/

function getRelativeMousePosition(event, target)
{
    target = target || event.target;
    var rect = target.getBoundingClientRect();

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    }
}

// assumes target or event.target is canvas
function getNoPaddingNoBorderCanvasRelativeMousePosition(event, target)
{
    target = target || event.target;
    var pos = getRelativeMousePosition(event, target);

    pos.x = pos.x * target.width  / target.clientWidth;
    pos.y = pos.y * target.height / target.clientHeight;

    return pos;
}
