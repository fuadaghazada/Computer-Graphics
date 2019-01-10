const WIDTH = 100;
const HEIGHT = 100;

var points = [];
var norms = [];

var a1 = 1;
var a2 = 1;
var a3 = 1;

var t_radius = 1.4;

var e1 = 2;
var e2 = 2;

// Parametric formular for super ellipsoid
function super_ellipsoid_formula(u, v)
{
    var x = (Math.cos(v) !== 0 && Math.cos(u) !== 0) ? a1 * ((Math.cos(v)) * Math.pow(Math.abs(Math.cos(v)), 2 / e1 - 1)) * (Math.cos(u)) * Math.pow(Math.abs(Math.cos(u)), 2 / e2 - 1) : 0;
    var y = (Math.cos(v) !== 0 && Math.sin(u) !== 0) ? a2 * ((Math.cos(v)) * Math.pow(Math.abs(Math.cos(v)), 2 / e1 - 1)) * (Math.sin(u)) * Math.pow(Math.abs(Math.sin(u)), 2 / e2 - 1) : 0;
    var z = (Math.sin(v) !== 0) ? a3 * (Math.sin(v)) * Math.pow(Math.abs(Math.sin(v)), 2 / e1 - 1) : 0;

    var nx = (Math.cos(v) !== 0 && Math.cos(u) !== 0) ? (1 / a1) * (Math.cos(v)) * Math.pow(Math.abs(Math.cos(v)), 1 - 2 / e1) * (Math.cos(u)) * Math.pow(Math.abs(Math.cos(u)), 1 - 2 / e2) : 0;
    var ny = (Math.cos(v) !== 0 && Math.sin(u) !== 0) ? (1 / a2) * (Math.cos(v)) * Math.pow(Math.abs(Math.cos(v)), 1 - 2 / e1) * (Math.sin(u)) * Math.pow(Math.abs(Math.sin(u)), 1 - 2 / e2) : 0;
    var nz = (Math.sin(v) !== 0) ? (1 / a3) * (Math.sin(v)) * Math.pow(Math.abs(Math.sin(v)), 1 - 2 / e1) : 0;

    x = (isNaN(x)) ? 0 : x;
    y = (isNaN(y)) ? 0 : y;
    z = (isNaN(z)) ? 0 : z;

    var points = vec4(x, y, z);
    var normal = vec4(nx, ny, nz);

    return {
        point: points,
        normal: normal
    };
}

// Parametric formular for super toroid
function torus_formula(u, v)
{
    var a4 = t_radius / Math.sqrt(a1 * a1 + a2 * a2);

    var x = (Math.cos(v) !== 0 && Math.cos(u) !== 0) ? a1 * ((Math.cos(v)) * Math.pow(Math.abs(Math.cos(v)), 2 / e1 - 1) + a4) * (Math.cos(u)) * Math.pow(Math.abs(Math.cos(u)), 2 / e2 - 1) : 0;
    var y = (Math.cos(v) !== 0 && Math.sin(u) !== 0) ? a2 * ((Math.cos(v)) * Math.pow(Math.abs(Math.cos(v)), 2 / e1 - 1) + a4) * (Math.sin(u)) * Math.pow(Math.abs(Math.sin(u)), 2 / e2 - 1) : 0;
    var z = (Math.sin(v) !== 0) ? a3 * (Math.sin(v)) * Math.pow(Math.abs(Math.sin(v)), 2 / e1 - 1) : 0;

    var nx = (Math.cos(v) !== 0 && Math.cos(u) !== 0) ? (1 / a1) * (Math.cos(v)) * Math.pow(Math.abs(Math.cos(v)), 1 - 2 / e1) * (Math.cos(u)) * Math.pow(Math.abs(Math.cos(u)), 1 - 2 / e2) : 0;
    var ny = (Math.cos(v) !== 0 && Math.sin(u) !== 0) ? (1 / a2) * (Math.cos(v)) * Math.pow(Math.abs(Math.cos(v)), 1 - 2 / e1) * (Math.sin(u)) * Math.pow(Math.abs(Math.sin(u)), 1 - 2 / e2) : 0;
    var nz = (Math.sin(v) !== 0) ? (1 / a3) * (Math.sin(v)) * Math.pow(Math.abs(Math.sin(v)), 1 - 2 / e1) : 0;

    x = (isNaN(x)) ? 0 : x;
    y = (isNaN(y)) ? 0 : y;
    z = (isNaN(z)) ? 0 : z;

    var points = vec4(x, y, z);
    var normal = vec4(nx, ny, nz);

    return {
        point: points,
        normal: normal
    };
}

/**
    Generates Vertices according to the given model
    Supertorus | Superellipsoid
*/
function generate_vertices(model)
{
    // Points
    points = new Array(HEIGHT + 1);
    for(var i = 0; i < HEIGHT + 1; i++)
    {
        points[i] = new Array(WIDTH + 1);
    }

    // Normals
    norms = new Array(HEIGHT + 1);
    for(var i = 0; i < HEIGHT + 1; i++)
    {
        norms[i] = new Array(WIDTH + 1);
    }

    var du = 2 * Math.PI / HEIGHT;
    var dv = (model === "ellipse") ? Math.PI / WIDTH : 2 * Math.PI / WIDTH;

    for(var i = 0; i <= WIDTH; i++)
    {
        var u = - Math.PI + i * du;

        for(var j = 0; j <= HEIGHT; j++)
        {
            var v = (model === "ellipse") ? - Math.PI / 2 + j * dv : - Math.PI + j * dv;

            points[i][j] = (model === "ellipse") ? super_ellipsoid_formula(u, v).point : torus_formula(u, v).point;
            norms[i][j] = (model === "ellipse") ? super_ellipsoid_formula(u, v).normal : torus_formula(u, v).normal;
        }
    }

    for(var i = 0; i < WIDTH; i++)
    {
        for(var j = 0; j < HEIGHT; j++)
        {
            // Vertices
            vertices.push(points[i][j]);
            vertices.push(points[i][j + 1]);
            vertices.push(points[i + 1][j]);

            vertices.push(points[i][j + 1]);
            vertices.push(points[i + 1][j + 1]);
            vertices.push(points[i + 1][j]);

            // Texture
            textCoords.push(points[i][j]);
            textCoords.push(points[i][j + 1]);
            textCoords.push(points[i + 1][j]);

            textCoords.push(points[i][j + 1]);
            textCoords.push(points[i + 1][j + 1]);
            textCoords.push(points[i + 1][j]);

            // Normals
            normals.push(norms[i][j]);
            normals.push(norms[i][j + 1]);
            normals.push(norms[i + 1][j]);

            normals.push(norms[i][j + 1]);
            normals.push(norms[i + 1][j + 1]);
            normals.push(norms[i + 1][j]);
        }
    }
}
