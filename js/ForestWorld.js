class ForestWorld {

    /* =====================================================
       CELL STATES
       ===================================================== */

    static EMPTY = 0;
    static TREE = 1;
    static BURNING = 2;
    static BURNT = 3;


    /* =====================================================
       CONSTRUCTOR
       ===================================================== */

    constructor(columns = 120, rows = 80) {

        this.columns = columns;
        this.rows = rows;

        /*
         * Environmental settings.
         *
         * Probabilities are stored between 0 and 1.
         */

        this.treeDensity = 0.70;

        this.spreadProbability = 0.75;

        this.growthProbability = 0.02;

        this.lightningProbability = 0.001;


        /*
         * Wind.
         *
         * Direction can be:
         *
         * none
         * north
         * south
         * east
         * west
         */

        this.windDirection = "none";

        this.windStrength = 0;


        /*
         * Generation counter.
         */

        this.generation = 0;


        /*
         * Create initial grid.
         */

        this.grid =
            this.createEmptyGrid();
    }


    /* =====================================================
       CREATE EMPTY GRID
       ===================================================== */

    createEmptyGrid() {

        const grid = new Array(this.rows);

        for (let row = 0; row < this.rows; row++) {

            grid[row] =
                new Uint8Array(this.columns);

        }

        return grid;
    }


    /* =====================================================
       GENERATE RANDOM FOREST
       ===================================================== */

    generateForest() {

        for (let row = 0; row < this.rows; row++) {

            for (
                let column = 0;
                column < this.columns;
                column++
            ) {

                if (Math.random() < this.treeDensity) {

                    this.grid[row][column] =
                        ForestWorld.TREE;

                } else {

                    this.grid[row][column] =
                        ForestWorld.EMPTY;

                }

            }

        }

        this.generation = 0;
    }


    /* =====================================================
       CLEAR WORLD
       ===================================================== */

    clear() {

        this.grid =
            this.createEmptyGrid();

        this.generation = 0;
    }


    /* =====================================================
       GET CELL
       ===================================================== */

    getCell(column, row) {

        if (!this.isInside(column, row)) {

            return ForestWorld.EMPTY;
        }

        return this.grid[row][column];
    }


    /* =====================================================
       SET CELL
       ===================================================== */

    setCell(column, row, state) {

        if (!this.isInside(column, row)) {

            return;
        }

        this.grid[row][column] =
            state;
    }


    /* =====================================================
       CHECK BOUNDS
       ===================================================== */

    isInside(column, row) {

        return (
            column >= 0 &&
            column < this.columns &&
            row >= 0 &&
            row < this.rows
        );
    }


    /* =====================================================
       MANUAL TOOLS
       ===================================================== */

    plantTree(column, row) {

        this.setCell(
            column,
            row,
            ForestWorld.TREE
        );
    }


    ignite(column, row) {

        /*
         * Only trees can catch fire.
         */

        if (
            this.getCell(column, row)
            === ForestWorld.TREE
        ) {

            this.setCell(
                column,
                row,
                ForestWorld.BURNING
            );
        }
    }


    erase(column, row) {

        this.setCell(
            column,
            row,
            ForestWorld.EMPTY
        );
    }


    /* =====================================================
       STEP SIMULATION
       ===================================================== */

    step() {

        const nextGrid =
            this.createEmptyGrid();


        for (let row = 0; row < this.rows; row++) {

            for (
                let column = 0;
                column < this.columns;
                column++
            ) {

                const currentState =
                    this.grid[row][column];


                nextGrid[row][column] =
                    this.calculateNextState(
                        column,
                        row,
                        currentState
                    );

            }

        }


        this.grid =
            nextGrid;


        this.generation++;
    }


    /* =====================================================
       CALCULATE NEXT STATE
       ===================================================== */

    calculateNextState(column, row, state) {

        switch (state) {

            /*
             * EMPTY LAND
             *
             * Empty cells have a chance to grow
             * a new tree.
             */

            case ForestWorld.EMPTY:

                if (
                    Math.random()
                    < this.growthProbability
                ) {

                    return ForestWorld.TREE;
                }

                return ForestWorld.EMPTY;


            /*
             * TREE
             *
             * A tree can:
             *
             * 1. Catch fire from a neighbour.
             * 2. Be struck by lightning.
             * 3. Remain a tree.
             */

            case ForestWorld.TREE:

                if (
                    this.shouldCatchFire(
                        column,
                        row
                    )
                ) {

                    return ForestWorld.BURNING;
                }


                if (
                    Math.random()
                    < this.lightningProbability
                ) {

                    return ForestWorld.BURNING;
                }


                return ForestWorld.TREE;


            /*
             * BURNING
             *
             * A burning tree burns for one generation
             * and then becomes burnt ground.
             */

            case ForestWorld.BURNING:

                return ForestWorld.BURNT;


            /*
             * BURNT LAND
             *
             * Burnt ground becomes empty land.
             */

            case ForestWorld.BURNT:

                return ForestWorld.EMPTY;


            default:

                return ForestWorld.EMPTY;

        }

    }


    /* =====================================================
       SHOULD TREE CATCH FIRE?
       ===================================================== */

    shouldCatchFire(column, row) {

        /*
         * Check the four cardinal neighbours.
         *
         * Diagonal cells are deliberately excluded
         * from the basic model.
         */

        const neighbours = [

            {
                column: column,
                row: row - 1,
                direction: "north"
            },

            {
                column: column,
                row: row + 1,
                direction: "south"
            },

            {
                column: column - 1,
                row: row,
                direction: "west"
            },

            {
                column: column + 1,
                row: row,
                direction: "east"
            }

        ];


        for (const neighbour of neighbours) {

            if (
                this.getCell(
                    neighbour.column,
                    neighbour.row
                )
                !== ForestWorld.BURNING
            ) {

                continue;
            }


            /*
             * Determine probability that this
             * burning neighbour ignites the tree.
             */

            const probability =
                this.getSpreadProbability(
                    neighbour.direction
                );


            if (
                Math.random()
                < probability
            ) {

                return true;
            }

        }


        return false;
    }


    /* =====================================================
       FIRE SPREAD PROBABILITY
       ===================================================== */

    getSpreadProbability(neighbourDirection) {

        let probability =
            this.spreadProbability;


        /*
         * No wind means normal fire probability.
         */

        if (
            this.windDirection === "none" ||
            this.windStrength <= 0
        ) {

            return probability;
        }


        /*
         * IMPORTANT:
         *
         * neighbourDirection describes where the
         * burning cell is relative to the tree.
         *
         * Example:
         *
         *      FIRE
         *       ↓
         *      TREE
         *
         * Fire is north of the tree.
         *
         * For fire to spread south, the wind must
         * be blowing south.
         */

        const spreadDirection =
            this.getOppositeDirection(
                neighbourDirection
            );


        if (
            spreadDirection ===
            this.windDirection
        ) {

            /*
             * Wind is pushing the fire toward
             * this tree.
             */

            probability +=
                (1 - probability)
                * this.windStrength;

        } else if (
            neighbourDirection ===
            this.windDirection
        ) {

            /*
             * Fire is attempting to spread
             * directly against the wind.
             */

            probability *=
                (1 - this.windStrength);

        }


        /*
         * Clamp between 0 and 1.
         */

        return Math.max(
            0,
            Math.min(1, probability)
        );
    }


    /* =====================================================
       OPPOSITE DIRECTION
       ===================================================== */

    getOppositeDirection(direction) {

        switch (direction) {

            case "north":
                return "south";

            case "south":
                return "north";

            case "east":
                return "west";

            case "west":
                return "east";

            default:
                return "none";
        }
    }


    /* =====================================================
       ENVIRONMENT SETTINGS
       ===================================================== */

    setTreeDensity(value) {

        this.treeDensity =
            this.clampProbability(value);
    }


    setSpreadProbability(value) {

        this.spreadProbability =
            this.clampProbability(value);
    }


    setGrowthProbability(value) {

        this.growthProbability =
            this.clampProbability(value);
    }


    setLightningProbability(value) {

        this.lightningProbability =
            this.clampProbability(value);
    }


    setWind(direction, strength) {

        const validDirections = [
            "none",
            "north",
            "south",
            "east",
            "west"
        ];


        if (
            validDirections.includes(direction)
        ) {

            this.windDirection =
                direction;
        }


        this.windStrength =
            this.clampProbability(strength);
    }


    /* =====================================================
       PROBABILITY CLAMP
       ===================================================== */

    clampProbability(value) {

        value =
            Number(value);


        if (Number.isNaN(value)) {

            return 0;
        }


        return Math.max(
            0,
            Math.min(1, value)
        );
    }


    /* =====================================================
       STATISTICS
       ===================================================== */

    getStatistics() {

        let trees = 0;
        let burning = 0;
        let burnt = 0;
        let empty = 0;


        for (let row = 0; row < this.rows; row++) {

            for (
                let column = 0;
                column < this.columns;
                column++
            ) {

                switch (
                    this.grid[row][column]
                ) {

                    case ForestWorld.TREE:

                        trees++;

                        break;


                    case ForestWorld.BURNING:

                        burning++;

                        break;


                    case ForestWorld.BURNT:

                        burnt++;

                        break;


                    default:

                        empty++;

                        break;

                }

            }

        }


        return {

            generation:
                this.generation,

            trees:
                trees,

            burning:
                burning,

            burnt:
                burnt,

            empty:
                empty

        };
    }


    /* =====================================================
       RESIZE WORLD
       ===================================================== */

    resize(columns, rows) {

        columns =
            Math.max(
                1,
                Math.floor(columns)
            );


        rows =
            Math.max(
                1,
                Math.floor(rows)
            );


        this.columns =
            columns;


        this.rows =
            rows;


        this.grid =
            this.createEmptyGrid();


        this.generation = 0;
    }

}