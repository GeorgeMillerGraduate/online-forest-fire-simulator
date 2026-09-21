class ForestRenderer {

    constructor(canvas, world) {

        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.world = world;

        /*
         * Colours for each cell state.
         *
         * These should correspond to the constants
         * defined later in ForestWorld.
         */

        this.colours = {
            empty: "#080d12",
            tree: "#248c62",
            burning: "#e75c3c",
            burnt: "#3e4650"
        };


        /*
         * Logical size of each cell.
         *
         * This is recalculated whenever the
         * canvas is resized.
         */

        this.cellWidth = 1;
        this.cellHeight = 1;


        this.resize();
    }


    /* =====================================================
       RESIZE CANVAS
       ===================================================== */

    resize() {

        /*
         * Use the displayed CSS dimensions of the canvas.
         */

        const rect =
            this.canvas.getBoundingClientRect();


        /*
         * Device pixel ratio keeps the canvas sharp
         * on high-DPI displays.
         */

        const pixelRatio =
            window.devicePixelRatio || 1;


        this.canvas.width =
            Math.floor(rect.width * pixelRatio);


        this.canvas.height =
            Math.floor(rect.height * pixelRatio);


        /*
         * Calculate the number of physical pixels
         * available to each simulation cell.
         */

        this.cellWidth =
            this.canvas.width /
            this.world.columns;


        this.cellHeight =
            this.canvas.height /
            this.world.rows;


        this.render();
    }


    /* =====================================================
       CLEAR CANVAS
       ===================================================== */

    clear() {

        this.context.fillStyle =
            this.colours.empty;


        this.context.fillRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
    }


    /* =====================================================
       RENDER COMPLETE FOREST
       ===================================================== */

    render() {

        this.clear();


        for (
            let row = 0;
            row < this.world.rows;
            row++
        ) {

            for (
                let column = 0;
                column < this.world.columns;
                column++
            ) {

                const state =
                    this.world.getCell(
                        column,
                        row
                    );


                this.drawCell(
                    column,
                    row,
                    state
                );

            }

        }

    }


    /* =====================================================
       DRAW CELL
       ===================================================== */

    drawCell(column, row, state) {

        let colour;


        switch (state) {

            case ForestWorld.TREE:

                colour =
                    this.colours.tree;

                break;


            case ForestWorld.BURNING:

                colour =
                    this.colours.burning;

                break;


            case ForestWorld.BURNT:

                colour =
                    this.colours.burnt;

                break;


            case ForestWorld.EMPTY:

            default:

                colour =
                    this.colours.empty;

                break;

        }


        this.context.fillStyle =
            colour;


        /*
         * Slight overlap prevents tiny gaps appearing
         * between cells because of fractional scaling.
         */

        const x =
            column * this.cellWidth;


        const y =
            row * this.cellHeight;


        this.context.fillRect(

            Math.floor(x),

            Math.floor(y),

            Math.ceil(this.cellWidth + 0.5),

            Math.ceil(this.cellHeight + 0.5)

        );

    }


    /* =====================================================
       CANVAS POSITION -> GRID POSITION
       ===================================================== */

    getGridPosition(event) {

        const rect =
            this.canvas.getBoundingClientRect();


        /*
         * Mouse position relative to canvas.
         */

        const mouseX =
            event.clientX - rect.left;


        const mouseY =
            event.clientY - rect.top;


        /*
         * Convert from CSS canvas dimensions into
         * simulation grid coordinates.
         */

        const column =
            Math.floor(
                (mouseX / rect.width)
                * this.world.columns
            );


        const row =
            Math.floor(
                (mouseY / rect.height)
                * this.world.rows
            );


        /*
         * Make sure the position is inside the grid.
         */

        if (
            column < 0 ||
            column >= this.world.columns ||
            row < 0 ||
            row >= this.world.rows
        ) {

            return null;
        }


        return {
            column: column,
            row: row
        };
    }


    /* =====================================================
       DRAW A SINGLE CELL IMMEDIATELY
       ===================================================== */

    renderCell(column, row) {

        if (
            column < 0 ||
            column >= this.world.columns ||
            row < 0 ||
            row >= this.world.rows
        ) {

            return;
        }


        const state =
            this.world.getCell(
                column,
                row
            );


        this.drawCell(
            column,
            row,
            state
        );
    }


    /* =====================================================
       CHANGE COLOUR
       ===================================================== */

    setColour(state, colour) {

        if (
            Object.prototype.hasOwnProperty.call(
                this.colours,
                state
            )
        ) {

            this.colours[state] =
                colour;


            this.render();
        }

    }

}