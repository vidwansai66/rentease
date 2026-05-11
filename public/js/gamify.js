const Gamify = (() => {
    // Count up animation for stats
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Simple Confetti Effect
    function celebration() {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            
            // Create a temporary div for confetti particle
            for(let i=0; i<10; i++) {
                const conf = document.createElement('div');
                conf.style.position = 'fixed';
                conf.style.width = '10px';
                conf.style.height = '10px';
                conf.style.backgroundColor = ['#F4A623', '#27AE60', '#2980B9', '#E74C3C'][Math.floor(Math.random()*4)];
                conf.style.left = Math.random() * 100 + 'vw';
                conf.style.top = '-10px';
                conf.style.zIndex = '9999';
                conf.style.borderRadius = '2px';
                conf.style.transform = `rotate(${Math.random()*360}deg)`;
                document.body.appendChild(conf);

                const anim = conf.animate([
                    { top: '-10px', transform: `translateX(0) rotate(0deg)`, opacity: 1 },
                    { top: '100vh', transform: `translateX(${randomInRange(-100, 100)}px) rotate(720deg)`, opacity: 0 }
                ], {
                    duration: randomInRange(2000, 4000),
                    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                });

                anim.onfinish = () => conf.remove();
            }
        }, 250);
    }

    return { animateValue, celebration };
})();
