

    // ===== CURSOR =====
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');

if (!cursor || !ring) {
    console.warn("Cursor elements não encontrados");
} else {

    let mx = 0, my = 0;
    let rx = 0, ry = 0;

    let cursorScale = 1;
    let ringScale = 1;
    let ringOpacity = 0.6;

    // movimento do mouse
    document.addEventListener('mousemove', (e) => {
        mx = e.clientX;
        my = e.clientY;

        cursor.style.transform =
            `translate3d(${mx - 5}px, ${my - 5}px, 0) scale(${cursorScale})`;
    });

    // animação suave do ring
    function animateRing() {
        rx += (mx - rx) * 0.12;
        ry += (my - ry) * 0.12;

        ring.style.transform =
            `translate3d(${rx - 18}px, ${ry - 18}px, 0) scale(${ringScale})`;

        ring.style.opacity = ringOpacity;

        requestAnimationFrame(animateRing);
    }

    animateRing();

    // hover states
    const targets = document.querySelectorAll('a, button, .project-item');

    targets.forEach(el => {

        el.addEventListener('mouseenter', () => {
            cursorScale = 2.5;
            ringScale = 1.5;
            ringOpacity = 0.3;
        });

        el.addEventListener('mouseleave', () => {
            cursorScale = 1;
            ringScale = 1;
            ringOpacity = 0.6;
        });

    });
}
    // ===== CANVAS =====
    const canvas = document.getElementById('stars');

    if (canvas) {
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const stars = [];

        for (let i = 0; i < 200; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.5,
                opacity: Math.random()
            });
        }

        function drawStars() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            stars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${star.opacity})`;
                ctx.fill();
            });

            requestAnimationFrame(drawStars);
        }

        drawStars();
    }

    // ===== SCROLL =====
    let currentScroll = 0;
    let targetScroll = 0;

    window.addEventListener('scroll', () => {
        targetScroll = window.scrollY;

        document.body.classList.toggle('show', window.scrollY > 400);
    });

    function animate() {
        currentScroll += (targetScroll - currentScroll) * 0.05;

        const moveY = currentScroll * 0.03;
        const moveX = Math.sin(currentScroll * 0.002) * 20;
        const rotate = Math.sin(currentScroll * 0.0015) * 3;

        document.body.style.setProperty('--ship-y', `${moveY}px`);
        document.body.style.setProperty('--ship-x', `${moveX}px`);
        document.body.style.setProperty('--ship-rotate', `${rotate}deg`);

        requestAnimationFrame(animate);
    }

    animate();