export default `
// Credit : 
// Based on the original work of struss from Shadertoy https://www.shadertoy.com/view/4sl3Dr#

uniform float iTime;           // Time passed (from Three.js)
uniform vec2 iResolution;      // Resolution of the canvas (from Three.js)

// 1D random numbers
float rand(float n) {
    return fract(sin(n) * 43758.5453123);
}

// 2D random numbers
vec2 rand2(in vec2 p) {
    return fract(vec2(sin(p.x * 591.32 + p.y * 154.077), cos(p.x * 391.32 + p.y * 49.077)));
}

// 1D noise
float noise1(float p) {
    float fl = floor(p);
    float fc = fract(p);
    return mix(rand(fl), rand(fl + 1.0), fc);
}

// voronoi distance noise, based on iq's articles
float voronoi(in vec2 x) {
    vec2 p = floor(x);
    vec2 f = fract(x);
    
    vec2 res = vec2(8.0);
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 b = vec2(i, j);
            vec2 r = vec2(b) - f + rand2(p + b);
            
            // chebyshev distance, one of many ways to do this
            float d = max(abs(r.x), abs(r.y));
            
            if (d < res.x) {
                res.y = res.x;
                res.x = d;
            } else if (d < res.y) {
                res.y = d;
            }
        }
    }
    return res.y - res.x;
}

void main() {
    // Flicker effect
    float flicker = noise1(iTime * 0.7) * 0.5 + 0.5;

    // UV Coordinates with screen resolution
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    uv = (uv - 0.5) * 2.0;
	uv *= 1.8;
    vec2 suv = uv;
    uv.x *= iResolution.x / iResolution.y;

    // Initial values for noise manipulation
    float v = 0.0;

    // Apply some camera movement
    uv *= 0.6 + sin(iTime * 0.1) * 0.04;
    uv.y += iTime * 0.02;

    // Add noise octaves
    float a = 0.6, f = 1.0;
    
    for (int i = 0; i < 3; i++) {
        float v1 = voronoi(uv * f + 20.0);
        float v2 = 0.0;
        
        // Make the moving electrons-effect for higher octaves
        if (i > 0) {
            v2 = voronoi(uv * f * 0.5 + 50.0 + iTime * 0.06);
            float va = 0.0, vb = 0.0;
            va = 1.0 - smoothstep(0.0, 0.1, v1);
            vb = 1.0 - smoothstep(0.0, 0.08, v2);
            v += a * pow(va * (0.5 + vb), 2.0);
        }
        
        // Make sharp edges
        v1 = 1.0 - smoothstep(0.0, 0.3, v1);
        
        // Noise is used as intensity map
        v2 = a * (noise1(v1 * 5.5 + 0.1));
        
        // Apply intensity changes
        if (i == 0) v += v2 * flicker;
        else v += v2;
        
        f *= 3.0;
        a *= 0.7;
    }

    // Slight vignetting effect
    v *= exp(-0.6 * length(suv)) * 1.2;

    // Color adjustment, force toward blue
    vec3 cexp = vec3(3.0, 2.0, 1.0);
    cexp *= 1.4;

    // Final color calculation
    vec3 col = vec3(pow(v, cexp.x), pow(v, cexp.y), pow(v, cexp.z)) * 2.0;
    
    // Output the color
    gl_FragColor = vec4(col, 1.0);
}
`;