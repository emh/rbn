const AND = '∧';
const NAND = '⊼';
const OR = '∨';
const NOR = '⊽';
const XOR = '⊕';
const XNOR = '⊙';
const OPS = [AND, NAND, OR, NOR, XOR, XNOR];
const K = 2;
const UP = 1;
const RIGHT = 2;
const DOWN = 4;
const LEFT = 8;

const NODE_SIZE = 20;
const NODE_GAP = 10;
const CONNECTTION_WIDTH = 5;

const arr = (n) => Array.from({ length: n }, () => null);
const rnd = (n) => Math.floor(Math.random() * n);

const pickOperator = () => OPS[rnd(OPS.length)];
const pickValue = () => rnd(2);
const pickConnection = (x, y, xdim, ydim) => {
    const bits = [];
    if (y > 0) bits.push(UP);
    if (x < xdim - 1) bits.push(RIGHT);
    if (y < ydim - 1) bits.push(DOWN);
    if (x > 0) bits.push(LEFT);

    let num = 0;
    for (let i = 0; i < K; i++) {
        const index = rnd(bits.length);
        num |= bits[index];
        bits.splice(index, 1);
    }

    return num;
};

const init = () => {
    const canvas = document.querySelector('canvas');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const xdim = Math.floor(canvas.width / (NODE_SIZE + NODE_GAP));
    const ydim = Math.floor(canvas.height / (NODE_SIZE + NODE_GAP));

    const state = {
        canvas,
        nodes: arr(ydim).map(() => arr(xdim).map(pickOperator)),
        values: arr(ydim).map(() => arr(xdim).map(pickValue)),
        connections: arr(ydim).map((_, y) => arr(xdim).map((_, x) => pickConnection(x, y, xdim, ydim))),
        xdim,
        ydim,
        paused: false
    };

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    window.addEventListener('keydown', (e) => {
        state.paused = !state.paused;
    });

    window.addEventListener('pointerdown', () => {
        state.paused = !state.paused;
    });

    return state;
}

const applyOp = (op, inputs) => {
    switch (op) {
        case AND: return inputs.reduce((a, b) => a & b, 1);
        case NAND: return inputs.reduce((a, b) => ~(a & b) & 1, 1);
        case OR: return inputs.reduce((a, b) => a | b, 0);
        case NOR: return inputs.reduce((a, b) => ~(a | b) & 1, 0);
        case XOR: return inputs.reduce((a, b) => a ^ b, 0);
        case XNOR: return inputs.reduce((a, b) => ~(a ^ b) & 1, 0);
        default: return 0;
    }
};

const update = (state) => {
    const { nodes, values, connections, xdim, ydim } = state;

    const newValues = arr(ydim).map(() => arr(xdim).map(() => 0));

    for (let y = 0; y < ydim; y++) {
        for (let x = 0; x < xdim; x++) {
            const op = nodes[y][x];
            const con = connections[y][x];

            const inputs = [];

            if (con & UP) inputs.push(values[y - 1][x]);
            if (con & RIGHT) inputs.push(values[y][x + 1]);
            if (con & DOWN) inputs.push(values[y + 1][x]);
            if (con & LEFT) inputs.push(values[y][x - 1]);

            newValues[y][x] = applyOp(op, inputs);
        }
    }

    state.values = newValues;

    return state;
};

const render = (state, ctx) => {
    const { canvas, nodes, values, connections, xdim, ydim } = state;

    const boardWidth = xdim * (NODE_SIZE + NODE_GAP) - NODE_GAP;
    const boardHeight = ydim * (NODE_SIZE + NODE_GAP) - NODE_GAP;
    const offsetX = (canvas.width - boardWidth) / 2;
    const offsetY = (canvas.height - boardHeight) / 2;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(offsetX, offsetY);

    ctx.strokeStyle = '#000';

    for (let y = 0; y < ydim; y++) {
        for (let x = 0; x < xdim; x++) {
            ctx.fillStyle = values[y][x] ? '#000' : '#fff';

            ctx.beginPath();
            ctx.rect(x * (NODE_SIZE + NODE_GAP) + 0.5, y * (NODE_SIZE + NODE_GAP) + 0.5, NODE_SIZE, NODE_SIZE);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();

            ctx.fillStyle = values[y][x] ? '#fff' : '#000';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(nodes[y][x], x * (NODE_SIZE + NODE_GAP) + (NODE_SIZE / 2), y * (NODE_SIZE + NODE_GAP) + (NODE_SIZE / 2));
        }
    }


    for (let y = 0; y < ydim; y++) {
        for (let x = 0; x < xdim; x++) {
            ctx.fillStyle = '#000';

            if (UP & connections[y][x]) {
                ctx.fillRect(
                    x * (NODE_SIZE + NODE_GAP) + (NODE_SIZE / 2) - (3 * CONNECTTION_WIDTH / 2) + 0.5,
                    y * (NODE_SIZE + NODE_GAP) - NODE_GAP + 0.5,
                    CONNECTTION_WIDTH, NODE_GAP);
            }

            ctx.fillStyle = '#000';

            if (RIGHT & connections[y][x]) {
                ctx.fillRect(
                    x * (NODE_SIZE + NODE_GAP) + NODE_SIZE + 0.5,
                    y * (NODE_SIZE + NODE_GAP) + (NODE_SIZE / 2) - (3 * CONNECTTION_WIDTH / 2) + 0.5,
                    NODE_GAP, CONNECTTION_WIDTH);
            }

            ctx.fillStyle = '#000';

            if (DOWN & connections[y][x]) {
                ctx.fillRect(
                    x * (NODE_SIZE + NODE_GAP) + (NODE_SIZE / 2) + (CONNECTTION_WIDTH / 2) + 0.5,
                    y * (NODE_SIZE + NODE_GAP) + NODE_SIZE + 0.5,
                    CONNECTTION_WIDTH, NODE_GAP);
            }

            ctx.fillStyle = '#000';

            if (LEFT & connections[y][x]) {
                ctx.fillRect(
                    x * (NODE_SIZE + NODE_GAP) - NODE_GAP + 0.5,
                    y * (NODE_SIZE + NODE_GAP) + (NODE_SIZE / 2) + (CONNECTTION_WIDTH / 2) + 0.5,
                    NODE_GAP, CONNECTTION_WIDTH);
            }
        }
    }

    ctx.restore();
};

const run = () => {
    let state = init();
    const { canvas } = state;

    let lastTs = null;
    let fps = 0;

    const loop = (ts) => {
        requestAnimationFrame(loop);

        if (lastTs) fps = Math.round(1000 / (ts - lastTs));

        if (ts - lastTs > 500 && !state.paused) {
            const ctx = canvas.getContext('2d');
            
            state = update(state);
            render(state, ctx);

            lastTs = ts;
        }
    }

    requestAnimationFrame(loop);
}

run();
