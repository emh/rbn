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
const CONNECTION_WIDTH = 2;

const PALETTE = [
  "#4e79a7", // blue
  "#f28e2b", // orange
  "#e15759", // red
  "#76b7b2", // teal
  "#59a14f", // green
  "#edc949"  // yellow
];


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
const key = (arr) => arr.flatMap((x) => x).join('');

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
        paused: false,
        history: [],
        map: new Map(),
        cycleStart: null,
        cycleIndex: 0
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

const detectFrozenNodes = (history) => {
    const mask = history[0].map((row) => row.map(() => -1));

    for (let f = 1; f < history.length; f++) {
        const frame = history[f];

        for (let y = 0; y < frame.length; y++) {
            const row = frame[y];
            
            for (let x = 0; x < row.length; x++) {
                if (row[x] !== history[0][y][x]) {
                    mask[y][x] = 0;
                }
            }
        }
    }

    return mask;
};

const update = (state) => {
    const { nodes, values, connections, xdim, ydim, history, cycleStart, cycleIndex } = state;

    if (cycleStart !== null) {
        state.values = history[cycleIndex];
        state.cycleIndex = (cycleIndex + 1 - cycleStart) % (history.length - cycleStart) + cycleStart;

        return state;
    }

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

    const valuesKey = key(newValues);

    if (state.map.has(valuesKey)) {
        state.cycleStart = state.map.get(valuesKey);
        state.values = state.history[state.cycleStart];
        state.frozenMask = detectFrozenNodes(history.slice(state.cycleStart));
        state.cycleIndex = state.cycleStart;

        console.log(`Cycle detected! Length: ${state.history.length - state.cycleStart}`);
    } else {
        state.history.push(newValues);
        state.values = newValues;
        state.map.set(valuesKey, state.history.length);
    }

    return state;
};

const render = (state, ctx) => {
    const { canvas, nodes, values, connections, xdim, ydim, frozenMask } = state;

    const boardWidth = xdim * (NODE_SIZE + NODE_GAP) - NODE_GAP;
    const boardHeight = ydim * (NODE_SIZE + NODE_GAP) - NODE_GAP;
    const offsetX = (canvas.width - boardWidth) / 2;
    const offsetY = (canvas.height - boardHeight) / 2;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(offsetX, offsetY);

    for (let y = 0; y < ydim; y++) {
        for (let x = 0; x < xdim; x++) {
            if (frozenMask && frozenMask[y][x] === -1) {
                continue;
            }

            const color = frozenMask ? PALETTE[frozenMask[y][x]] : '#000';
            
            if (frozenMask && values[y][x]) {
                state.frozenMask[y][x] = (frozenMask[y][x] + 1) % PALETTE.length;
            }

            ctx.strokeStyle = color;
            ctx.fillStyle = values[y][x] ? color : '#fff';

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
            if (frozenMask && frozenMask[y][x] === -1) {
                continue;
            }

            ctx.fillStyle = frozenMask ? 'gray' : '#000';

            if (UP & connections[y][x] && (!frozenMask || frozenMask?.[y - 1]?.[x] > -1)) {
                ctx.fillRect(
                    x * (NODE_SIZE + NODE_GAP) + (NODE_SIZE / 2) - (3 * CONNECTION_WIDTH / 2) + 0.5,
                    y * (NODE_SIZE + NODE_GAP) - NODE_GAP + 0.5,
                    CONNECTION_WIDTH, NODE_GAP);
            }

            if (RIGHT & connections[y][x] && (!frozenMask || frozenMask?.[y]?.[x + 1] > -1)) {
                ctx.fillRect(
                    x * (NODE_SIZE + NODE_GAP) + NODE_SIZE + 0.5,
                    y * (NODE_SIZE + NODE_GAP) + (NODE_SIZE / 2) - (3 * CONNECTION_WIDTH / 2) + 0.5,
                    NODE_GAP, CONNECTION_WIDTH);
            }

            if (DOWN & connections[y][x] && (!frozenMask || frozenMask?.[y + 1]?.[x] > -1)) {
                ctx.fillRect(
                    x * (NODE_SIZE + NODE_GAP) + (NODE_SIZE / 2) + (CONNECTION_WIDTH / 2) + 0.5,
                    y * (NODE_SIZE + NODE_GAP) + NODE_SIZE + 0.5,
                    CONNECTION_WIDTH, NODE_GAP);
            }

            if (LEFT & connections[y][x] && (!frozenMask || frozenMask?.[y]?.[x - 1] > -1)) {
                ctx.fillRect(
                    x * (NODE_SIZE + NODE_GAP) - NODE_GAP + 0.5,
                    y * (NODE_SIZE + NODE_GAP) + (NODE_SIZE / 2) + (CONNECTION_WIDTH / 2) + 0.5,
                    NODE_GAP, CONNECTION_WIDTH);
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

        if ((state.cycleStart === null || ts - lastTs > 250) && !state.paused) {
            const ctx = canvas.getContext('2d');
            
            state = update(state);
            render(state, ctx);

            lastTs = ts;
        }
    }

    requestAnimationFrame(loop);
}

run();
