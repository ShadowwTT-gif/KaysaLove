window.requestAnimationFrame =
    window.__requestAnimationFrame ||
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    (function () {
        return function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
    })();

window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));

var loaded = false;

var init = function () {
    if (loaded) return;
    loaded = true;

    var mobile = window.isDevice;
    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');

    // Set canvas dimensions to full viewport size
    var width = canvas.width = window.innerWidth;
    var height = canvas.height = window.innerHeight;

    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, width, height);

    // Display "Kaysa" and fade-out animation
    var opacity = 1.0; // Initial opacity
    ctx.font = `${mobile ? 50 : 100}px 'Brush Script MT', cursive`; // Adjust font size for mobile
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    var fadeOutText = function () {
        ctx.fillStyle = `rgba(0, 0, 0, 0.1)`; // Dim the background slightly
        ctx.fillRect(0, 0, width, height); // Clear and apply fading
        ctx.fillStyle = `rgba(128, 0, 128, ${opacity})`; // Purple fading text
        ctx.fillText("Kaysa", width / 2, height / 2); // Center text

        opacity -= 0.02; // Reduce opacity gradually
        if (opacity > 0) {
            window.requestAnimationFrame(fadeOutText);
        } else {
            startHeartAnimation(ctx, width, height); // Start the heart animation after fade-out
        }
    };

    fadeOutText(); // Start the fade-out effect
};

var startHeartAnimation = function (ctx, width, height) {
    var rand = Math.random;

    var heartPosition = function (rad) {
        return [
            Math.pow(Math.sin(rad), 3),
            -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))
        ];
    };

    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    var traceCount = 50; // Set trace count
    var pointsOrigin = [];
    var dr = 0.1; // Angle increment

    // Create heart shape points
    for (let i = 0; i < Math.PI * 2; i += dr) {
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
    }
    for (let i = 0; i < Math.PI * 2; i += dr) {
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
    }
    for (let i = 0; i < Math.PI * 2; i += dr) {
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), 90, 5, 0, 0));
    }

    var heartPointsCount = pointsOrigin.length;

    // Set target points based on the heart shape
    var targetPoints = [];
    var pulse = function (kx, ky) {
        for (let i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [
                kx * pointsOrigin[i][0] + width / 2, // Centered on canvas
                ky * pointsOrigin[i][1] + height / 2  // Centered on canvas
            ];
        }
    };

    var e = [];
    // Initialize particles for heart animation
    for (let i = 0; i < heartPointsCount; i++) {
        var x = width / 2; // Start particles at the center
        var y = height / 2; // Start particles at the center
        e[i] = {
            vx: 0,
            vy: 0,
            R: 2,
            speed: rand() + 5,
            q: ~~(rand() * heartPointsCount),
            D: 2 * (i % 2) - 1,
            force: 0.2 * rand() + 0.7,
            f: "hsla(270," + ~~(40 * rand() + 60) + "%," + ~~(60 * rand() + 20) + "%,.3)", // Purple heart particles
            trace: []
        };
        for (var k = 0; k < traceCount; k++) {
            e[i].trace[k] = { x: x, y: y }; // Keep trace positions at center
        }
    }

    var config = {
        traceK: 0.4,
        timeDelta: 0.01
    };

    var time = 0;
    var loop = function () {
        var n = -Math.cos(time);
        pulse((1 + n) * 0.5, (1 + n) * 0.5);
        time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? 0.2 : 1) * config.timeDelta;

        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(0, 0, width, height);

        for (let i = e.length; i--;) {
            var u = e[i];
            var q = targetPoints[u.q];
            var dx = u.trace[0].x - q[0];
            var dy = u.trace[0].y - q[1];
            var length = Math.sqrt(dx * dx + dy * dy);

            // Check if particle is near the target point
            if (length < 10) {
                if (rand() < 0.95) {
                    u.q = ~~(rand() * heartPointsCount);
                } else {
                    if (rand() < 0.99) {
                        u.D *= -1; // Randomly reverse direction
                    }
                    u.q += u.D;
                    u.q %= heartPointsCount;
                    if (u.q < 0) {
                        u.q += heartPointsCount;
                    }
                }
            }

            u.vx += -dx / length * u.speed;
            u.vy += -dy / length * u.speed;
            u.trace[0].x += u.vx;
            u.trace[0].y += u.vy;
            u.vx *= u.force;
            u.vy *= u.force;

            for (let k = 0; k < u.trace.length - 1;) {
                var T = u.trace[k];
                var N = u.trace[++k];
                N.x -= config.traceK * (N.x - T.x);
                N.y -= config.traceK * (N.y - T.y);
            }

            ctx.fillStyle = u.f;
            for (let k = 0; k < u.trace.length; k++) {
                ctx.fillRect(u.trace[k].x, u.trace[k].y, 1, 1);
            }
        }

        window.requestAnimationFrame(loop);
    };

    loop();
};

// Initialize the canvas on page load
var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);
