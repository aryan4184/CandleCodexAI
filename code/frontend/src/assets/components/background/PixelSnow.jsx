import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const PixelSnow = ({
    color = "#ffffff",
    flakeSize = 0.01,
    minFlakeSize = 0.5,
    pixelResolution = 200,
    speed = 1.0,
    density = 0.3,
    direction = 125, // Wind direction in degrees? Or vector?
    brightness = 1,
    depthFade = 8,
    farPlane = 20,
    gamma = 0.4545,
    variant = "square" // 'square' or 'circle'
}) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        // Scene Setup
        const scene = new THREE.Scene();
        scene.background = null; // Transparent

        // Camera
        const aspect = container.clientWidth / container.clientHeight;
        // Orthographic might be better for "pixel" look, but Perspective is standard for depth
        const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, farPlane);
        camera.position.z = 5;

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: false // Important for pixel look? 
        });
        renderer.setPixelRatio(window.devicePixelRatio); // Or ignore for pixel effect?
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        // Pixelation Effect Mechanism: 
        // Usually done by rendering to a small render target and scaling up, 
        // OR just relying on the flake size/shape.
        // Given the prop "pixelResolution", it suggests render target scaling.

        // Particles
        const particleCount = Math.floor(density * 1000); // Approximate scaling
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20; // x
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10; // z

            sizes[i] = Math.random() * (1 - minFlakeSize) + minFlakeSize; // Variation
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Shader Material for Custom Pixel Points
        // Simple PointsMaterial if variant is square
        let material;

        if (variant === 'square') {
            material = new THREE.PointsMaterial({
                color: new THREE.Color(color).multiplyScalar(brightness),
                size: flakeSize,
                sizeAttenuation: true, // Scale with depth
                transparent: true,
                opacity: 1.0,
            });
        } else {
            // Circle (using map or canvas)
            // For now default to square as requested
            material = new THREE.PointsMaterial({
                color: new THREE.Color(color).multiplyScalar(brightness),
                size: flakeSize,
                sizeAttenuation: true,
            });
        }

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        // Animation Loop
        let animationId;
        const clock = new THREE.Clock();

        const animate = () => {
            animationId = requestAnimationFrame(animate);

            const dt = clock.getDelta();
            const positions = particles.geometry.attributes.position.array;

            // Move Particles
            // Convert direction (degrees) to vector
            // 125 degrees... assuming 0 is up? 
            const windX = Math.cos((direction * Math.PI) / 180) * 0.5;
            const windY = -Math.abs(speed); // Always fall down relative to y?

            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += windX * dt * speed; // X
                positions[i * 3 + 1] += windY * dt * speed; // Y

                // Reset if out of bounds (simple box wrap)
                if (positions[i * 3 + 1] < -10) {
                    positions[i * 3 + 1] = 10;
                    positions[i * 3] = (Math.random() - 0.5) * 20; // Reset X to prevent clumping
                }

                if (positions[i * 3] > 10) positions[i * 3] = -10;
                if (positions[i * 3] < -10) positions[i * 3] = 10;
            }

            particles.geometry.attributes.position.needsUpdate = true;

            // Handle Resize (if window changes)
            // renderer.setSize...

            renderer.render(scene, camera);
        };

        animate();

        // Resize Observer
        const handleResize = () => {
            if (!container) return;
            const width = container.clientWidth;
            const height = container.clientHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            geometry.dispose();
            material.dispose();
        };

    }, [color, flakeSize, speed, density, direction, brightness, variant, farPlane, minFlakeSize]);

    return <div ref={containerRef} style={{ width: "100%", height: "100%", overflow: "hidden" }} />;
};

export default PixelSnow;
