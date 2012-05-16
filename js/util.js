// Simple JavaScript Templating
// John Resig - http://ejohn.org/ - MIT Licensed
// http://ejohn.org/blog/javascript-micro-templating/
// i replaced <% with {{ and %> with }}
(function(){
  var cache = {};

  this.tmpl = function tmpl(str, data){
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/\W/.test(str) ?
      cache[str] = cache[str] ||
        tmpl(document.getElementById(str).innerHTML) :

      // Generate a reusable function that will serve as a template
      // generator (and which will be cached).
      new Function("obj",
        "var p=[],print=function(){p.push.apply(p,arguments);};" +

        // Introduce the data as local variables using with(){}
        "with(obj){p.push('" +

        // Convert the template into pure JavaScript
        // quote fix from:
        // http://www.west-wind.com/weblog/posts/2008/Oct/13/Client-Templating-with-jQuery
        str.replace(/[\r\t\n]/g, " ")
            .replace(/'(?=[^%]*}})/g,"\t")
            .split("'").join("\\'")
            .split("\t").join("'")
            .replace(/{{=(.+?)}}/g, "',$1,'")
            .split("{{").join("');")
            .split("}}").join("p.push('")
            + "');}return p.join('');");
//         str
//           .replace(/[\r\t\n]/g, " ")
//           .split("{{").join("\t")
//           .replace(/((^|}})[^\t]*)'/g, "$1\r")
//           .replace(/\t=(.*?)}}/g, "',$1,'")
//           .split("\t").join("');")
//           .split("}}").join("p.push('")
//           .split("\r").join("\\'")
//       + "');}return p.join('');");

    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
  };
})();


function randInt(x) {
    return Math.floor(Math.random()*x);
}

function round(num, dec) {
    return Math.round(num*Math.pow(10, dec))/Math.pow(10, dec);
}

function pluck(obj, key) {
    return obj.map(function(value){ return value[key]; });
};

Rickshaw.namespace('Rickshaw.Graph.Axis.X');

Rickshaw.Graph.Axis.X = function(args) {

    var self = this;

    this.graph = args.graph;
    this.elements = [];
    this.ticksTreatment = args.ticksTreatment || 'plain';
    this.fixedTimeUnit = args.timeUnit;

    var time = new Rickshaw.Fixtures.Time();

    this.appropriateTimeUnit = function() {

        var unit;
        var units = time.units;

        var domain = this.graph.x.domain();
        var rangeSeconds = domain[1] - domain[0];

        units.forEach( function(u) {
            if (Math.floor(rangeSeconds / u.seconds) >= 2) {
                unit = unit || u;
            }
        } );

        return (unit || time.units[time.units.length - 1]);
    };

    this.tickOffsets = function() {

        var domain = this.graph.x.domain();

        var unit = this.fixedTimeUnit || this.appropriateTimeUnit();
        var count = Math.ceil((domain[1] - domain[0]) / unit.seconds);

        var runningTick = domain[0];

        var offsets = [];

        for (var i = 0; i < count; i++) {

            tickValue = time.ceil(runningTick, unit);
            runningTick = tickValue + unit.seconds / 2;

            offsets.push( { value: tickValue, unit: unit } );
        }

        return offsets;
    };

    this.render = function() {

        this.elements.forEach( function(e) {
            e.parentNode.removeChild(e);
        } );

        this.elements = [];

        var offsets = this.tickOffsets();

        offsets.forEach( function(o) {

            if (self.graph.x(o.value) > self.graph.x.range()[1]) return;

            var element = document.createElement('div');
            element.style.left = self.graph.x(o.value) + 'px';
            element.classList.add('x_tick');
            element.classList.add(self.ticksTreatment);

            var title = document.createElement('div');
            title.classList.add('title');
            title.innerHTML = o.value;
            element.appendChild(title);

            self.graph.element.appendChild(element);
            self.elements.push(element);

        } );
    };

    this.graph.onUpdate( function() { self.render() } );
};