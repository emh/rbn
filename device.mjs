export const device = {
    width: window.innerWidth, 
    height: window.innerHeight,
    mouse: {
        x: 0,
        y: 0,
        buttons: {
            left: false,
            middle: false,
            right: false
        }
    },
    viewport: {
        dx: 0,
        dy: 0
    }
};

window.addEventListener('resize', () => {
    device.width = window.innerWidth;
    device.height = window.innerHeight;
});

const handlePointerEvent = (e) => {
    device.mouse.x = e.x;
    device.mouse.y = e.y;
    device.mouse.buttons.left = (e.buttons & 1 !== 0) && !e.ctrlKey;
    device.mouse.buttons.right = (e.buttons & 2 !== 0) || ((e.buttons & 1 !== 0) && e.ctrlKey) ;
    device.mouse.buttons.middle = (e.buttons & 4) !== 0;
};

const handleWheelEvent = (e) => {
    e.preventDefault();

    device.viewport.dx -= Math.round(e.deltaX);
    device.viewport.dy -= Math.round(e.deltaY);
};

window.addEventListener('pointermove', handlePointerEvent);
window.addEventListener('pointerdown', handlePointerEvent);
window.addEventListener('pointerup', handlePointerEvent);
window.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('wheel', handleWheelEvent, { passive: false });