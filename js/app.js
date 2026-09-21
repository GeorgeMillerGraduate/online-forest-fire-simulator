$(document).ready(function () {

    /* =====================================================
       CREATE WORLD
       ===================================================== */

    const canvas =
        document.getElementById("forestCanvas");


    /*
     * Simulation resolution.
     *
     * More cells = finer forest, but more processing.
     */

    const world =
        new ForestWorld(
            140,
            90
        );


    const renderer =
        new ForestRenderer(
            canvas,
            world
        );


    /* =====================================================
       APPLICATION STATE
       ===================================================== */

    let simulationTimer = null;

    let simulationRunning = false;

    let simulationSpeed = 50;

    let selectedTool = "fire";

    let windDirection = "none";

    let mouseDown = false;


    /* =====================================================
       ENVIRONMENT SETTINGS
       ===================================================== */

    function updateEnvironmentSettings() {

        /*
         * Tree density.
         */

        const treeDensity =
            parseInt(
                $("#treeDensity").val()
            ) / 100;


        /*
         * Normal fire spread probability.
         */

        const spreadProbability =
            parseInt(
                $("#spreadProbability").val()
            ) / 100;


        /*
         * Growth probability.
         */

        const growthProbability =
            parseInt(
                $("#growthProbability").val()
            ) / 100;


        /*
         * Lightning slider uses tenths of a percent.
         *
         * Slider value:
         *
         * 1 = 0.1%
         * 5 = 0.5%
         * 10 = 1%
         */

        const lightningSlider =
            parseInt(
                $("#lightningProbability").val()
            );


        const lightningProbability =
            lightningSlider / 1000;


        /*
         * Wind.
         */

        const windStrength =
            parseInt(
                $("#windStrength").val()
            ) / 100;


        /*
         * Speed.
         */

        simulationSpeed =
            parseInt(
                $("#simulationSpeed").val()
            );


        /*
         * Send values to ForestWorld.
         */

        world.setTreeDensity(
            treeDensity
        );


        world.setSpreadProbability(
            spreadProbability
        );


        world.setGrowthProbability(
            growthProbability
        );


        world.setLightningProbability(
            lightningProbability
        );


        world.setWind(
            windDirection,
            windStrength
        );

    }


    /* =====================================================
       UPDATE CONTROL LABELS
       ===================================================== */

    function updateControlLabels() {

        $("#treeDensityValue")
            .text(
                $("#treeDensity").val() + "%"
            );


        $("#spreadProbabilityValue")
            .text(
                $("#spreadProbability").val() + "%"
            );


        $("#growthProbabilityValue")
            .text(
                $("#growthProbability").val() + "%"
            );


        /*
         * Lightning is displayed as tenths
         * of a percent.
         */

        const lightning =
            parseInt(
                $("#lightningProbability").val()
            ) / 10;


        $("#lightningProbabilityValue")
            .text(
                lightning.toFixed(1) + "%"
            );


        $("#simulationSpeedValue")
            .text(
                $("#simulationSpeed").val()
                + " ms"
            );


        $("#windStrengthValue")
            .text(
                $("#windStrength").val()
                + "%"
            );

    }


    /* =====================================================
       STATISTICS
       ===================================================== */

    function updateStatistics() {

        const statistics =
            world.getStatistics();


        $("#generationCount")
            .text(
                statistics.generation
            );


        $("#treeCount")
            .text(
                statistics.trees
            );


        $("#burningCount")
            .text(
                statistics.burning
            );

    }


    /* =====================================================
       RENDER
       ===================================================== */

    function render() {

        renderer.render();

        updateStatistics();

    }


    /* =====================================================
       GENERATE FOREST
       ===================================================== */

    function generateForest() {

        pauseSimulation();

        updateEnvironmentSettings();


        world.generateForest();


        $("#canvasMessage")
            .hide();


        render();
    }


    /* =====================================================
       STEP SIMULATION
       ===================================================== */

    function stepSimulation() {

        updateEnvironmentSettings();


        world.step();


        render();
    }


    /* =====================================================
       START SIMULATION
       ===================================================== */

    function startSimulation() {

        if (simulationRunning) {

            return;
        }


        /*
         * Make sure settings are current.
         */

        updateEnvironmentSettings();


        simulationRunning = true;


        $("#startButton")
            .text("Running");


        /*
         * Create animation timer.
         */

        simulationTimer =
            setInterval(
                function () {

                    stepSimulation();

                },
                simulationSpeed
            );

    }


    /* =====================================================
       PAUSE SIMULATION
       ===================================================== */

    function pauseSimulation() {

        if (simulationTimer !== null) {

            clearInterval(
                simulationTimer
            );


            simulationTimer = null;
        }


        simulationRunning = false;


        $("#startButton")
            .text("Start");

    }


    /* =====================================================
       RESTART TIMER
       ===================================================== */

    function restartSimulationTimer() {

        if (!simulationRunning) {

            return;
        }


        /*
         * Speed changed while running.
         *
         * Recreate interval with the new speed.
         */

        clearInterval(
            simulationTimer
        );


        simulationTimer =
            setInterval(
                function () {

                    stepSimulation();

                },
                simulationSpeed
            );

    }


    /* =====================================================
       RESET
       ===================================================== */

    function resetSimulation() {

        pauseSimulation();


        /*
         * Restore default controls.
         */

        $("#treeDensity")
            .val(70);


        $("#spreadProbability")
            .val(75);


        $("#growthProbability")
            .val(2);


        $("#lightningProbability")
            .val(1);


        $("#simulationSpeed")
            .val(50);


        $("#windStrength")
            .val(0);


        windDirection =
            "none";


        $(".wind-button")
            .removeClass("active");


        $('.wind-button[data-direction="none"]')
            .addClass("active");


        selectedTool =
            "fire";


        $(".tool-button")
            .removeClass("active");


        $('.tool-button[data-tool="fire"]')
            .addClass("active");


        updateControlLabels();

        updateEnvironmentSettings();


        /*
         * Generate a new default forest.
         */

        world.generateForest();


        $("#canvasMessage")
            .hide();


        render();

    }


    /* =====================================================
       APPLY DRAWING TOOL
       ===================================================== */

    function applyTool(event) {

        const position =
            renderer.getGridPosition(
                event
            );


        if (position === null) {

            return;
        }


        const column =
            position.column;


        const row =
            position.row;


        switch (selectedTool) {

            case "fire":

                world.ignite(
                    column,
                    row
                );

                break;


            case "tree":

                world.plantTree(
                    column,
                    row
                );

                break;


            case "erase":

                world.erase(
                    column,
                    row
                );

                break;

        }


        /*
         * Only redraw the modified cell.
         *
         * Much cheaper than redrawing the
         * complete forest while dragging.
         */

        renderer.renderCell(
            column,
            row
        );


        updateStatistics();

    }


    /* =====================================================
       GENERATE BUTTON
       ===================================================== */

    $("#generateForest")
        .on(
            "click",
            function () {

                generateForest();

            }
        );


    /* =====================================================
       START BUTTON
       ===================================================== */

    $("#startButton")
        .on(
            "click",
            function () {

                startSimulation();

            }
        );


    /* =====================================================
       PAUSE BUTTON
       ===================================================== */

    $("#pauseButton")
        .on(
            "click",
            function () {

                pauseSimulation();

            }
        );


    /* =====================================================
       STEP BUTTON
       ===================================================== */

    $("#stepButton")
        .on(
            "click",
            function () {

                /*
                 * Pause first so Step always means
                 * exactly one generation.
                 */

                pauseSimulation();

                stepSimulation();

            }
        );


    /* =====================================================
       RESET BUTTON
       ===================================================== */

    $("#resetButton")
        .on(
            "click",
            function () {

                resetSimulation();

            }
        );


    /* =====================================================
       ENVIRONMENT SLIDERS
       ===================================================== */

    $(
        "#treeDensity, " +
        "#spreadProbability, " +
        "#growthProbability, " +
        "#lightningProbability, " +
        "#windStrength"
    )
        .on(
            "input",
            function () {

                updateControlLabels();

                updateEnvironmentSettings();

            }
        );


    /* =====================================================
       SPEED SLIDER
       ===================================================== */

    $("#simulationSpeed")
        .on(
            "input",
            function () {

                updateControlLabels();


                simulationSpeed =
                    parseInt(
                        $(this).val()
                    );


                /*
                 * Apply speed immediately if
                 * simulation is running.
                 */

                restartSimulationTimer();

            }
        );


    /* =====================================================
       WIND BUTTONS
       ===================================================== */

    $(".wind-button")
        .on(
            "click",
            function () {

                windDirection =
                    $(this)
                        .data("direction");


                $(".wind-button")
                    .removeClass("active");


                $(this)
                    .addClass("active");


                /*
                 * Selecting no wind automatically
                 * sets wind strength to zero.
                 */

                if (
                    windDirection === "none"
                ) {

                    $("#windStrength")
                        .val(0);


                    $("#windStrengthValue")
                        .text("0%");

                } else {

                    /*
                     * If the user selects a direction
                     * while wind is zero, give it a
                     * useful default strength.
                     */

                    if (
                        parseInt(
                            $("#windStrength").val()
                        ) === 0
                    ) {

                        $("#windStrength")
                            .val(50);


                        $("#windStrengthValue")
                            .text("50%");

                    }

                }


                updateEnvironmentSettings();

            }
        );


    /* =====================================================
       TOOL BUTTONS
       ===================================================== */

    $(".tool-button")
        .on(
            "click",
            function () {

                selectedTool =
                    $(this)
                        .data("tool");


                $(".tool-button")
                    .removeClass("active");


                $(this)
                    .addClass("active");

            }
        );


    /* =====================================================
       CANVAS MOUSE DOWN
       ===================================================== */

    $(canvas)
        .on(
            "mousedown",
            function (event) {

                mouseDown = true;


                applyTool(
                    event
                );

            }
        );


    /* =====================================================
       CANVAS MOUSE MOVE
       ===================================================== */

    $(canvas)
        .on(
            "mousemove",
            function (event) {

                if (!mouseDown) {

                    return;
                }


                applyTool(
                    event
                );

            }
        );


    /* =====================================================
       MOUSE RELEASE
       ===================================================== */

    $(document)
        .on(
            "mouseup",
            function () {

                mouseDown = false;

            }
        );


    /* =====================================================
       PREVENT CANVAS DRAGGING
       ===================================================== */

    $(canvas)
        .on(
            "dragstart",
            function (event) {

                event.preventDefault();

            }
        );


    /* =====================================================
       WINDOW RESIZE
       ===================================================== */

    $(window)
        .on(
            "resize",
            function () {

                renderer.resize();

            }
        );


    /* =====================================================
       INITIALISE
       ===================================================== */

    updateControlLabels();

    updateEnvironmentSettings();


    /*
     * Generate the initial forest immediately.
     */

    world.generateForest();


    $("#canvasMessage")
        .hide();


    render();

});