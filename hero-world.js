// Ajustes do percurso. Durações são unidades da timeline, distribuídas pelo scroll.
const WORLD_SETTINGS = {
    transitionDuration: 1.2,
    holdDuration: 1.8,
    zoomIntensity: 0.035,
    scrollHeightVh: 700,
    parallaxPercent: 1.5,
    cardDuration: 0.35,
    scrub: 1,
    resizeDebounceMs: 200
};

(() => {
    const root = document.querySelector('.hero-world');
    if (!root || !window.gsap || !window.ScrollTrigger) return; // HTML remains a usable vertical list.
    gsap.registerPlugin(ScrollTrigger);
    const frames = [...root.querySelectorAll('.hw-frame')];
    const cards = [...root.querySelectorAll('.hw-card')];
    const counter = root.querySelector('.hw-counter');
    const meter = root.querySelector('.hw-progress span');
    const hint = root.querySelector('.hw-hint');
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let context, timeline, timer, ready = false;
    const checkpoints = [], transitions = [];
    function reset() {
        context?.revert(); context = undefined; timeline = undefined;
        root.classList.remove('hw-ready', 'hw-exploring'); root.style.removeProperty('--hw-scroll');
        cards.forEach(c => { c.inert = false; c.removeAttribute('aria-hidden'); c.style.removeProperty('pointer-events'); c.style.removeProperty('will-change'); });
        frames.forEach(f => f.style.removeProperty('will-change'));
    }
    function build() {
        reset(); if (preference.matches || !ready) return;
        const S = WORLD_SETTINGS;
        root.style.setProperty('--hw-scroll', Math.max(300, S.scrollHeightVh) + 'vh');
        root.classList.add('hw-ready'); checkpoints.length = 0; transitions.length = 0;
        context = gsap.context(() => {
            gsap.set(frames, { opacity: 0, scale: 1, xPercent: 0, yPercent: 0 }); gsap.set(frames[0], { opacity: 1 });
            gsap.set(cards, { opacity: 0, y: 20 }); gsap.set(cards[0], { opacity: 1, y: 0 });
            timeline = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: S.scrub, invalidateOnRefresh: true }, onUpdate: sync });
            timeline.to(hint, { opacity: 0, duration: .3 }, .15);
            let at = S.holdDuration;
            checkpoints.push({ start: 0, end: at, card: 0, space: 1 });
            for (let step = 1; step <= 6; step++) {
                const prev = step - 1; const next = step === 6 ? 0 : step;
                timeline.to(cards[step - 1], { opacity: 0, y: -16, duration: S.cardDuration }, at);
                at += S.cardDuration;
                const begin = at;
                if (step === 6) timeline.set(frames[0], { zIndex: 7 }, at);
                timeline.fromTo(frames[next], { opacity: 0, scale: 1, xPercent: 0, yPercent: 0 }, { opacity: 1, scale: 1 + S.zoomIntensity, xPercent: step % 2 ? -S.parallaxPercent : S.parallaxPercent, yPercent: -1, duration: S.transitionDuration, ease: 'sine.inOut', immediateRender: false }, at);
                timeline.to(frames[prev], { opacity: 0, scale: 1, xPercent: 0, yPercent: 0, duration: S.transitionDuration, ease: 'sine.inOut' }, at);
                at += S.transitionDuration;
                transitions.push({ start: begin, end: at, prev, next });
                timeline.to(cards[step], { opacity: 1, y: 0, duration: S.cardDuration, ease: 'power2.out' }, at);
                const cardStart = at; at += S.cardDuration + S.holdDuration;
                checkpoints.push({ start: cardStart, end: at, card: step, space: Math.min(step, 5) });
            }
            // Give the final CTA a complete reading interval before the regular page resumes.
            timeline.to({}, { duration: S.holdDuration }, at - S.holdDuration);
            timeline.fromTo(meter, { scaleX: 0 }, { scaleX: 1, duration: at }, 0);
            sync();
        }, root);
        ScrollTrigger.refresh();
    }
    function sync() {
        if (!timeline) return;
        const time = timeline.time();
        const current = checkpoints.find(p => time >= p.start && time <= p.end)
            ?? (timeline.progress() >= 1 ? checkpoints[checkpoints.length - 1] : undefined);
        const active = current?.card ?? -1;
        root.classList.toggle('hw-exploring', time > WORLD_SETTINGS.holdDuration);
        cards.forEach((card, i) => {
            const shown = i === active;
            // Do not leave a focused link inside an inert outgoing card.
            if (!shown && card.contains(document.activeElement)) root.querySelector('.hw-top-right a[href="#projetos"]').focus({ preventScroll: true });
            card.inert = !shown; card.setAttribute('aria-hidden', String(!shown)); card.style.pointerEvents = shown ? 'auto' : 'none';
            const moving = shown && (time < current.start + WORLD_SETTINGS.cardDuration);
            card.style.willChange = moving ? 'transform, opacity' : '';
        });
        const latest = [...checkpoints].reverse().find(p => time >= p.start);
        const space = latest?.space || 1;
        counter.textContent = String(space).padStart(2, '0') + ' / 05'; counter.setAttribute('aria-label', `Espaço ${space} de 5`);
        const changing = transitions.find(t => time >= t.start && time <= t.end);
        frames.forEach((frame, i) => frame.style.willChange = changing && (i === changing.prev || i === changing.next) ? 'transform, opacity' : '');
    }
    // Preload links begin downloads together. Decode before enabling the layered narrative.
    Promise.all(frames.map(img => img.decode().catch(() => null))).then(() => {
        ready = frames.every(img => img.complete && img.naturalWidth > 0); build();
    });
    window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(build, WORLD_SETTINGS.resizeDebounceMs); });
    preference.addEventListener('change', build);
    window.addEventListener('pageshow', event => { if (event.persisted) build(); });
    window.addEventListener('pagehide', () => { clearTimeout(timer); reset(); });
})();
