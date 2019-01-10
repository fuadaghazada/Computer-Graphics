// Some constants
const max_cloud_points = 20;

const sun_radius = 0.1;
const ground_level = -0.8;

/*
    Here we will have some vertex and color values
*/

// ------- Vertex ----------

const sky_vertices = [
    vec2(1.0, 1.0),
    vec2(-1.0, 1.0),
    vec2(-1.0, -1.0),
    vec2(1.0, -1.0)
];

const ground_vertices = [
    vec2(1.0, -0.3),
    vec2(-1.0, -0.3),
    vec2(-1.0, -1.0),
    vec2(1.0, -1.0)
];

const sun_center_vertices = vec2(0.75, 0.75);


// ------- Colors ----------

const ground_color = [
    vec3(0.78, 0.35, 0.0),
    vec3(0.78, 0.35, 0.0),
    vec3(0.78, 0.35, 0.0),
    vec3(0.78, 0.35, 0.0)
];

const sky_color = [
    vec3(0.0, 0.69, 0.95),
    vec3(0.0, 0.69, 0.95),
    vec3(0.0, 0.69, 0.95),
    vec3(0.0, 0.69, 0.95)
];

const dark_sky_color = [
    vec3(0.07, 0.09, 0.38),
    vec3(0.07, 0.09, 0.38),
    vec3(0.07, 0.09, 0.38),
    vec3(0.07, 0.09, 0.38)
];

// Sun | Moon
const sun_color = vec3(1.0, 0.76, 0.0);
const moon_color = vec3(0.84, 0.86, 0.89);

// Cloud colors
const cloud_color = vec3(0.84, 0.86, 0.89);
const gray_color = vec3(0.66, 0.66, 0.66);

// Roof color
const roof_color = [
    vec3(0.76, 0.0, 0.0),
    vec3(0.76, 0.0, 0.0),
    vec3(0.76, 0.0, 0.0),
];

// Roof color
const window_color = [
    vec3(0.70, 0.78, 0.9),
    vec3(0.70, 0.78, 0.9),
    vec3(0.70, 0.78, 0.9),
    vec3(0.70, 0.78, 0.9)
];

// Tree Trunk color
const tree_trunk_color = [
    vec3(0.52, 0.24, 0.0),
    vec3(0.52, 0.24, 0.0),
    vec3(0.52, 0.24, 0.0),
    vec3(0.52, 0.24, 0.0)
];

// Tree Leaf color
const tree_leaf_color = vec3(0.56, 0.82, 0.27);
