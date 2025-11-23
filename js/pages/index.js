// js/pages/index.js
// ... (The code remains identical to your last provided version)
class HomePage {
    constructor() {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
            this.initAnimations();
        }
        this.initEvents();
        if (window.lucide) window.lucide.createIcons();
    }

    initAnimations() {
        const heroTl = gsap.timeline();
        heroTl.from(".hero-anim", {
            y: 40, opacity: 0, duration: 1, stagger: 0.15, ease: "power3.out"
        })
            .from(".hero-image img", {
                x: 50, opacity: 0, duration: 1.2, rotation: 2, ease: "power2.out"
            }, "-=0.8");

        gsap.from(".stat-item", {
            scrollTrigger: {
                trigger: ".stats", start: "top 80%", toggleActions: "play none none reverse"
            },
            scale: 0.5, opacity: 0, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)"
        });

        gsap.set(".scene", { autoAlpha: 0, scale: 0.9, y: 50 });

        const storyTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".story-section", start: "top top", end: "bottom bottom", scrub: 1, pin: ".story-sticky"
            }
        });

        storyTl.to(".story-progress-bar", { width: "100%", duration: 3, ease: "none" }, 0);

        storyTl.to(".scene-1", { autoAlpha: 1, scale: 1, y: 0, duration: 0.8 }, 0)
            .to(".scene-1", { autoAlpha: 0, scale: 0.9, y: -50, duration: 0.8 }, 1);

        storyTl.to(".scene-2", { autoAlpha: 1, scale: 1, y: 0, duration: 0.8 }, 1)
            .to(".check-circle", { scale: 1, duration: 0.4, ease: "back.out(1.7)" }, 1.2)
            .to(".scene-2", { autoAlpha: 0, scale: 0.9, y: -50, duration: 0.8 }, 2);

        storyTl.to(".scene-3", { autoAlpha: 1, scale: 1, y: 0, duration: 0.8 }, 2);

        gsap.from(".omg-category-card", {
            scrollTrigger: {
                trigger: ".omg-category-grid", start: "top 80%", toggleActions: "play none none reverse"
            },
            y: 40, opacity: 0, scale: 0.9, duration: 0.6,
            stagger: { amount: 0.8, grid: "auto", from: "center" }, ease: "back.out(1.2)"
        });

        this.createMarquee(".track-1", "left");
        this.createMarquee(".track-2", "right");
    }

    createMarquee(selector, direction) {
        const track = document.querySelector(selector);
        if (!track) return;

        const endValue = direction === 'left' ? -50 : 0;
        const startValue = direction === 'left' ? 0 : -50;
        const tween = gsap.fromTo(track, {
            xPercent: startValue
        }, {
            xPercent: endValue,
            duration: 20,
            ease: "none",
            repeat: -1
        });

        track.addEventListener("mouseenter", () => tween.pause());
        track.addEventListener("mouseleave", () => tween.play());
    }

    initEvents() {
        const btn = document.querySelector('.hero button');
        if (btn && typeof gsap !== 'undefined') {
            btn.addEventListener('mouseenter', () => gsap.to(btn, { scale: 1.05, duration: 0.2 }));
            btn.addEventListener('mouseleave', () => gsap.to(btn, { scale: 1, duration: 0.2 }));
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.homePage = new HomePage();
});