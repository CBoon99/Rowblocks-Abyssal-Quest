uniform float time;
uniform vec2 resolution;
uniform sampler2D tDiffuse;
uniform vec3 lightPosition;
uniform float lightIntensity;

varying vec2 vUv;

// Noise function for caustics
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float caustics(vec2 uv, float time) {
    float scale = 2.0;
    float speed = 0.5;
    
    vec2 p = uv * scale + vec2(time * speed, time * speed * 0.7);
    
    float n = 0.0;
    n += smoothNoise(p) * 0.5;
    n += smoothNoise(p * 2.0) * 0.25;
    n += smoothNoise(p * 4.0) * 0.125;
    n += smoothNoise(p * 8.0) * 0.0625;
    
    // Create caustic pattern
    float caustic = sin(n * 3.14159) * 0.5 + 0.5;
    caustic = pow(caustic, 2.0);
    
    return caustic;
}

void main() {
    vec2 uv = vUv;
    vec4 color = texture2D(tDiffuse, uv);
    
    // Calculate caustics
    float caustic = caustics(uv, time);
    
    // Add caustic light to the scene
    vec3 causticColor = vec3(0.5, 0.8, 1.0) * caustic * lightIntensity * 0.3;
    
    // Apply caustics
    color.rgb += causticColor;
    
    // Enhance underwater feel with blue tint
    color.rgb = mix(color.rgb, vec3(0.2, 0.4, 0.6), 0.1);
    
    gl_FragColor = color;
}
