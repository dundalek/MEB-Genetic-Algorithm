function MEBVisualization(options) {
    this.options = $.extend({}, MEBVisualization.prototype.options, options||{});
}

$.extend(MEBVisualization.prototype, {
    options: {
        size: 380,
        radius: 4,
        padding: 100
    },
    init: function(meb) {
        this.nodes = meb.nodes;

        var data = pluck(this.nodes, 'pos');

        var radius = this.options.radius,
            padding = this.options.padding,
            size = this.options.size,
            datax = pluck(data, 0),
            datay = pluck(data, 1),
            minx = d3.min(datax),
            maxx = d3.max(datax),
            miny = d3.min(datay),
            maxy = d3.max(datay),
            dataw = maxx-minx,
            datah = maxy-miny,
            w, h,
            ratio;

            ratio = size/dataw;
            w = size+2*padding;
            h = datah/dataw*w;

//         if (dataw > datah) {
//             ratio = size/dataw;
//             w = size+2*padding;
//             h = Math.round(datah/dataw*w);
//         } else {
//             ratio = size/datah;
//             h = size+2*padding;
//             w = Math.round(dataw/datah*h);
//         }

        var s = this.s = function(val) {
            return val*ratio;
        }

        function x(val) {
            return s(val-minx)+padding;
        }

        function y(val) {
            return s(val-miny)+padding;
        }

        $(this.options.selector).html('');
        var svg = this.svg = d3.select(this.options.selector).append("svg")
            .attr("width", w)
            .attr("height", h);

        var c = svg.selectAll('circle')
                   .data(data)
                   .enter();
        c.append('g').append('text');
        c.append('circle').attr('class', 'beam');
        c.append('circle').attr('class', 'node');

        svg.selectAll('g')
            .attr('transform', function(d) {
                return 'translate('+x(d[0])+','+y(d[1])+')'
            })
            .select('text').text(function(d, i) {
                return i
            })
            .attr('dy', '-10px')
            .attr('dx', '-5px');

        svg.selectAll('circle.beam')
                .attr('cx', function(d) {
                    return x(d[0]);
                })
                .attr('cy', function(d) {
                    return y(d[1]);
                });
        svg.selectAll('circle.node')
                    .attr('cx', function(d) {
                        return x(d[0]);
                    })
                    .attr('cy', function(d) {
                        return y(d[1]);
                    })
                    .attr('r', radius);
    },
    draw: function (gene) {
        if (!this.svg) {
            return;
        }
        this.svg.selectAll('circle.beam')
            .data(gene)
            .transition()
                .duration(0)
                .attr('r', function(d, i) {
                    return this.s(this.nodes[i].dist[this.nodes[i].trans[d]]);
                }.bind(this));
    }
});