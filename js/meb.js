
function MEB(options) {
    GA.call(this, options);
}

$.extend(MEB.prototype, GA.prototype, {
    options: $.extend({}, GA.prototype.options, {
        Pm: 12,
        mutateRange: 20,
        randomCorrection: 0.2,
        BIPCount: 1,
    }),
    init: function() {
        var bipGenes = this.BIP();
        this.initRules = [
            {count: this.BIPCount, fn: GA.createFnFactory(function(i) {
                return bipGenes[i];
            })},
            {count: Infinity, fn: GA.createFnFactory(function() {
                return randInt(this.nGenes);
            })}
        ];
        GA.prototype.init.call(this);
    },
    BIP: function() {
        var genes = new Array(this.nGenes);
        for (var i = 0; i < this.nGenes; i++) {
            genes[i] = 0;
        }
        var nodes = {};
        nodes[this.sourceNode] = 1;
        var min, best;

        for (var j = 1; j < this.nGenes; j++) {
            min = Infinity;
            best = {};
            for (var n in nodes) {
                for (var i = genes[n]+1; i < this.nGenes; i++) {
                    var newNode = this.nodes[n].trans[i];
                    if (!(newNode in nodes)) {
                        var eNew = Math.pow(this.nodes[n].dist[newNode], this.alpha);
                        var eOld = Math.pow(this.nodes[n].dist[this.nodes[n].trans[genes[n]]], this.alpha);
                        var diff =  eNew - eOld;
                        if (diff < min) {
                            best = {n: n, i: i, node: newNode};
                            min = diff;
                        }
                        break;
                    }
                }
            }
            genes[best.n] = best.i;
            nodes[best.node] = 1;
        }
        return genes;
    },
    doBFS: function(ind, open, closed) {
        while(open.length > 0) {
            var node = open.shift(), child;
            for (var i = 1, len = ind.genes[node]; i <= len; i+=1) {
                child = this.nodes[node].trans[i];
                if (!closed[child]) {
                    closed[child] = 1;
                    open.push(child);
                }
            }
        }
    },
    correctPickRandom: function(node, ind, closed) {
        while (true) {
            var x = randInt(this.nGenes);
            if (closed[x] && this.nodes[x].trans.indexOf(node) > ind.genes[x]) {
                break;
            }
        }
        return x;
    },
    correctPickClosest: function(node, ind, closed) {
        for (var j = 0; j < this.nGenes; j+=1) {
            x =  this.nodes[node].trans[j];
            if (closed[x] && this.nodes[x].trans.indexOf(node) > ind.genes[x]) {
                break;
            }
        }
        return x;
    },
    correctPickMin: function(newNode, ind, nodes) {
        var x, min = Infinity;
        for (var n in nodes) {
            var eNew = Math.pow(this.nodes[n].dist[newNode], this.alpha);
            var eOld = Math.pow(this.nodes[n].dist[this.nodes[n].trans[ind.genes[n]]], this.alpha);
            var diff =  eNew - eOld;
            if (diff < min && diff > 0) {
                x = n;
                min = diff;
            }
        }
        return x;
    },
    correct: function(ind) {
        var closed = {};
        closed[this.sourceNode] = 1;

        this.doBFS(ind, [this.sourceNode], closed);

        var node, x;
        for (var i = 0; i < this.nGenes; i+=1) {
            node = this.nodes[this.sourceNode].trans[i];
            if (!closed[node]) {
                if (Math.random() >= this.randomCorrection) {
                    //x = this.correctPickClosest(node, ind, closed);
                    x = this.correctPickMin(node, ind, closed);
                } else {
                    x = this.correctPickRandom(node, ind, closed);
                }
                ind.genes[x] = this.nodes[x].trans.indexOf(node);
                this.doBFS(ind, [node], closed);
            }
        }
    },
    fitness: function(ind) {
        var sum = 0;
        for (var i = 0; i < ind.genes.length; i+=1) {
            sum += Math.pow(this.nodes[i].dist[this.nodes[i].trans[ind.genes[i]]], this.alpha);
        }
        ind.fitness = sum;
    },
    mutate: GA.mutateFnFactory(function(i, genes) {
        var gene = genes[i] + randInt(2*this.mutateRange+1)-this.mutateRange;
        gene = Math.max(0, Math.min(this.nGenes-1, gene));
        return gene;
    }),
    computeStats: function(pop) {
        GA.prototype.computeStats.call(this, pop);
        this.statdata.optimal = this.optimalResult;
        this.statdata.diffopt = ((this.statdata.fbest - this.optimalResult)/this.optimalResult)*100;
    },
    initProblem: function(problemTxt, alpha, optimalResult) {
        this.optimalResult = optimalResult;
        this.alpha = alpha;
        var numbers = $.trim(problemTxt).split(/\s+/);
        this.sourceNode = parseInt(numbers[0]);
        numbers = numbers.slice(1);
        var nodes = [];
        var i, j;
        for (i = 0; i < numbers.length; i+=2) {
            j = i/2;
            nodes[j] = {
                pos: [parseFloat(numbers[i]), parseFloat(numbers[i+1])],
                dist: []
            };
            nodes[j].dist[j] = 0;
        }
        this.nGenes = nodes.length;

        var dist;
        for (i = 0; i < nodes.length; i+=1) {
            for (j = i+1; j < nodes.length; j+=1) {
                dist = Math.sqrt(Math.pow(nodes[i].pos[0] - nodes[j].pos[0], 2)
                                +Math.pow(nodes[i].pos[1] - nodes[j].pos[1], 2));
                nodes[i].dist[j] = dist;
                nodes[j].dist[i] = dist;
            }
        }

        for (i = 0; i < nodes.length; i+=1) {
            var dists = nodes[i].dist.map(function(item, i) { return [i,item]});
            dists.sort(function(a, b){
                return a[1] - b[1];
            });
            nodes[i].trans = dists.map(function(item) {return item[0]});
        }

        this.nodes = nodes;
    }
});