function FitnessGraph(options) {
    this.options = $.extend({}, FitnessGraph.prototype.options, options||{});
    this.enabled = true;
    this.reset();
}

$.extend(FitnessGraph.prototype, {
    options: {
        colors: ['tomato', 'limegreen', 'steelblue'],
        names: ['worst', 'average', 'best'],
        renderer: 'line',
        width: 400,
        height: 200,
        ticksTreatment: 'glow',
        pixelsPerTick: 50
    },
    reset: function() {
        this.data = [[], [], []];
        this.graph = null;
    },
    create: function(options) {
        var graph = new Rickshaw.Graph(options);

        var legend = new Rickshaw.Graph.Legend( {
            graph: graph,
            element: $(this.options.legend).get(0)

        } );

        var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
            graph: graph,
            legend: legend
        } );

        var highlight = new Rickshaw.Graph.Behavior.Series.Highlight( {
            graph: graph,
            legend: legend
        } );

        var xAxis = new Rickshaw.Graph.Axis.X( {
            graph: graph
        } );

        xAxis.render();

        var yAxis = new Rickshaw.Graph.Axis.Y( {
            graph: graph,
            //tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
            ticksTreatment: this.options.ticksTreatment,
            ticks: Math.floor(graph.height / this.options.pixelsPerTick)
        } );

        yAxis.render();

        return graph;
    },
    update: function(statdata) {
        this.data[0].push({x: statdata.gen, y:statdata.fworst});
        this.data[1].push({x: statdata.gen, y:statdata.favg});
        this.data[2].push({x: statdata.gen, y:statdata.fbest});

        if (!this.graph) {
            this.graph = this.create({
                element: $(this.options.graph).get(0),
                width: this.options.width,
                height: this.options.height,
                renderer: this.options.renderer,
                series: this.data.map(function(item, i) {
                    return {
                        color: this.options.colors[i],
                        name: this.options.names[i],
                        data: item
                    }
                }.bind(this))
            });
        }

        if (this.enabled) {
            this.graph.update();
        }
    },
    enable: function(bool) {
        this.enabled = bool;
        var action = bool ? 'show' : 'hide';
        $(this.options.graph)[action]();
        $(this.options.legend)[action]();
    }
});
