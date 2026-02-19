uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform vec2 resolution;
uniform vec3 lightPosition;
uniform float lightIntensity;
uniform float density;
uniform float decay;
uniform float weight;
uniform float exposure;

varying vec2 vUv;

void main() {
    vec2 texCoord = vUv;
    vec2 deltaTexCoord = (texCoord - lightPosition.xy) / float(64.0) * density;
    
    float illuminationDecay = 1.0;
    vec4 color = texture2D(tDiffuse, texCoord);
    
    for(int i = 0; i < 64; i++) {
        texCoord -= deltaTexCoord;
        vec4 sample = texture2D(tDiffuse, texCoord);
        sample *= illuminationDecay * weight;
        color += sample;
        illuminationDecay *= decay;
    }
    
    color *= exposure;
    color = mix(texture2D(tDiffuse, vUv), color, 0.5);
    
    gl_FragColor = color;
}
