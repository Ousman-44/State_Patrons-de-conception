import Konva from "konva";
import { setup, createActor } from "xstate";

const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 10;
let polyline; // La polyline en cours de construction

const polylineMachine = setup({
    // Quelques actions et gardes que vous pouvez utiliser dans votre machine
    actions: {
        // Créer une nouvelle polyline
        createLine: () => {
            const pos = stage.getPointerPosition();
            polyline = new Konva.Line({
                points: [pos.x, pos.y, pos.x, pos.y],
                stroke: "red",
                strokeWidth: 2,
            });
            layer.add(polyline);
        },
        // Mettre à jour le dernier point (provisoire) de la polyline
        setLastPoint: () => {
            const pos = stage.getPointerPosition();
            const currentPoints = polyline.points(); // Get the current points of the line
            const size = currentPoints.length;

            const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
            polyline.points(newPoints.concat([pos.x, pos.y]));
            layer.batchDraw();
        },
        // Enregistrer la polyline
        saveLine: () => {
            const currentPoints = polyline.points(); // Get the current points of the line
            const size = currentPoints.length;
            // Le dernier point(provisoire) ne fait pas partie de la polyline
            const newPoints = currentPoints.slice(0, size - 2);
            polyline.points(newPoints);
            layer.batchDraw();
        },
        // Ajouter un point à la polyline
        addPoint: () => {
            const pos = stage.getPointerPosition();
            const currentPoints = polyline.points(); // Get the current points of the line
            const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
            polyline.points(newPoints); // Set the updated points to the line
            layer.batchDraw(); // Redraw the layer to reflect the changes
        },
        // Abandonner le tracé de la polyline
        abandon: () => {
            polyline.destroy();
            polyline = null;
            layer.batchDraw();
        },
        // Supprimer le dernier point de la polyline
        removeLastPoint: () => {
            const currentPoints = polyline.points(); // Get the current points of the line
            const size = currentPoints.length;
            const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
            const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
            polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
            layer.batchDraw(); // Redraw the layer to reflect the changes
        },
    },
    guards: {
        auMoinsDeuxPoints: () => {
            return polyline.points().length >= 6;
        },
        // On peut encore ajouter un point
        pasPlein: () => {
            return (polyline.points().length / 2) - 1 < MAX_POINTS;
        },
        // On peut enlever un point
        plusDeDeuxPoints: () => {
            // Deux coordonnées pour chaque point, plus le point provisoire
            return polyline.points().length > 6;
        },
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiALQA2ACxFVADgCcO1QCY+AVj59tWgDQhMiTUW26jendv0BGN0f0Bfb1bRYeIREEABOAIYA7gRQ1PTMtABqTPxCSCBoYpLSsgoIbgDs6gX6+sr6qnwAzJplBVVWNgjuykQFbsrGVW6mbtoFRqq+-hg4BMRhUTFxjKwc3KmymRJSMul5HQX29cqafYa1aqqNiG7qDgXK5tp9fMqeRm7DGaNBExHR+LEAQuEAxgBrWDIf5gRbpZbZNagPKaPj2TT1UpGEr1AolE4IRTtBGIzw3bRVK7uZ4BMbBSafWJMfDiMChcEiLKrXKnIxVBH3IzaYlaTQozE9IwaEyXfQ1PiVZRVAqk17jEIfaZMWB-cLIMGCJaiFY5dZKcpEKr9TQGVS6TqaXaYxTaeF6c0FPhnK0lTS+PwgfCoCBwbWBcba5l6mFKDz6DQ6PSGExmSzWMMFOx3DzKaW7dllIaeslvEhkMBB3XQ+SIPiC1TZkYBilKr5FqGshDlhPNJNEWOmEx7Ab6dke7xAA */
    id: "polyLine",
    initial: "idle",
    states: {
        idle: {
            on: {
                MOUSECLICK: {
                    target: "drawing",
                    actions: ["createLine"],
                },
            },
        },
        drawing: {
            on: {
                MOUSEMOVE: {
                    actions: ["setLastPoint"],
                },
                MOUSECLICK: {
                    guard: "pasPlein",
                    actions: ["addPoint"],
                },
                Backspace: {
                    guard: "plusDeDeuxPoints",
                    actions: ["removeLastPoint"],
                },
                Enter: {
                    guard: "auMoinsDeuxPoints",
                    target: "idle",
                    actions: ["saveLine"],
                },
                Escape: {
                    target: "idle",
                    actions: ["abandon"],
                },
            },
        },
    },
});

// On démarre la machine
const polylineActor = createActor(polylineMachine);
polylineActor.subscribe((snapshot) => {
    console.log("Current state:", snapshot.value);
});
polylineActor.start();

// On envoie les événements à la machine
stage.on("click", () => {
    polylineActor.send({ type: "MOUSECLICK" });
});

stage.on("mousemove", () => {
    polylineActor.send({ type: "MOUSEMOVE" });
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    // Enverra "a", "b", "c", "Escape", "Backspace", "Enter"... à la machine
    polylineActor.send({ type: event.key });
});
