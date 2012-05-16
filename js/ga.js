
function GA(options) {
    this.setOptions(options);
}

GA.createFnFactory = function(fn) {
    return function() {
        var ind = {genes: new Array(this.nGenes)};
        for (var k = 0; k < this.nGenes; k+=1) {
            ind.genes[k] = fn.call(this, k);
        }
        return [ind];
    };
};

GA.mutateFnFactory = function(fn) {
    return function(ind) {
        var genes = ind.genes;
        for (var i = 0; i < this.nGenes; i+=1) {
            if(Math.random()*100 < this.Pm) {
                genes[i] = fn.call(this, i, genes);
            }
        }
    };
};

$.extend(GA.prototype, {
    options: {
        PopSize: 100,              // population size
        maxGenerations: 10000,     // stopping criterion
        select_1: 3, select_2: 3,  // parameters of tournament selection
        Pc: 75,                    // probability of crossover [%]
        Pm: 5,                     // probability of mutation [%]
        reportStep: 20             // display stats every 20 iterations
    },
    initRules: [
        {count: Infinity, fn: GA.createFnFactory(function() {
            randInt(this.nGenes);
        })}
    ],
    offspringRules: [
         // elitism - select the one best individial
        {count: 1, fn: function() {
            return [this.statdata.indbest];
        }},
        // fill the rest of population using regular parents crossover with mutation
        {count: Infinity, fn: function() {
            var parents,
                offsprings = [];

            // choose parents
            parents = this.selectParents(this.population);

            //------- create two new chromosomes
            if (Math.random()*100 < this.Pc) {
                offsprings = this.crossover(parents);
            }
            else {
                offsprings[0] = this.copyIndividual(parents[0]);
                offsprings[1] = this.copyIndividual(parents[1]);
            }

            // mutate
            this.mutate(offsprings[0]);
            this.mutate(offsprings[1]);

            return offsprings;
        }}
    ],
    terminationCondition: function() {
        return this.curGen >= this.maxGenerations;
    },
    correct: function(ind) {
        // by default do nothing
    },
    fitness: function(ind) {
        return 0;
    },
    compare: function(a, b) {
        // if return value is less than 0, sort a to a lower index than b.
        // if return value is greater than 0, sort b to a lower index than a.
        // if return value is 0, leave order unchanged
        return a.fitness - b.fitness; // minimize
        // return b.fitness - a.fitness; // maximize
    },
    selectParents: function(pop) {
        var par1, par2;

        //------- 1st parent
        par1 = this.select_tournament(pop, this.select_1);

        //------- chooses 2nd parent to be different than the 1st one
        do {
            par2 = this.select_tournament(pop, this.select_2);
        } while(par1 === par2);

        return [par1, par2];
    },
    select_tournament: function(pop, tournamentSize) {
        var cand, tempbest;

        //------- 1st competitor
        tempbest = pop[randInt(this.PopSize)]; //--- best-so-far candidate
        tournamentSize--;

        //------- try remaining competitors
        while (tournamentSize > 0){
            cand = pop[randInt(this.PopSize)];
            if(this.compare(cand,tempbest) < 0) {
                tempbest = cand;
            }
            tournamentSize--;
        }
        return tempbest;
    },
    mutate: GA.mutateFnFactory(function() {
        randInt(this.nGenes);
    }),
    // 2point crossover
    crossover: function(parents) {
        var i, lp,rp,pom;
        var parent1 = parents[0].genes,
            parent2 = parents[1].genes,
            child1 = new Array(this.nGenes),
            child2 = new Array(this.nGenes);

        //------- choose two crossing points - left and right
        lp=randInt(this.nGenes);
        do {
            rp=(randInt(this.nGenes));
        } while(lp==rp);
        if(lp > rp){
            pom=lp;
            lp=rp;
            rp=pom;
        }

        //------- head section
        for(i=0; i<lp; i++){
            child1[i] = parent1[i];
            child2[i] = parent2[i];
        }

        //------- middle section
        for(i=lp;i<rp;i++){
            child2[i] = parent1[i];
            child1[i] = parent2[i];
        }

        //------- end section
        for(i=rp;i<this.nGenes;i++){
            child1[i] = parent1[i];
            child2[i] = parent2[i];
        }

        return [{genes:child1}, {genes:child2}];
    },
    reportStats: function() {
        console.log(JSON.stringify(this.statdata));
    },
    copyIndividual: function(ind) {
        return {genes: ind.genes.slice()};
    },

    // =====================================================
    // common methods - one should not need to overide these
    setOptions: function(options) {
        this.options = $.extend({}, this.constructor.prototype.options, options || {});
        for (var o in this.options) {
            this[o] = this.options[o];
        }
    },
    init: function() {
        this.running = false;
        this.statdata = {};
        this.curGen = 0;
        this.population = this.createPopulation(this.initRules);
        this.computeStats(this.population);
    },
    createPopulation: function(rules) {
        var population = new Array(this.PopSize),
            i = 0, len, inds, ind, rule;

        for (var j = 0; j < rules.length; j++) {
            rule = rules[j];
            for (len = i+rule.count; i < len;) {
                inds = rule.fn.call(this);
                for (var k = 0; k < inds.length; k+=1, i+=1) {
                    if (i >= this.PopSize) {
                        return population;
                    }
                    ind = inds[k];
                    this.correct(ind);
                    this.fitness(ind);
                    population[i] = ind;
                }

            }
        }

        return population;
    },
    run: function(callback) {
        this.running = true;
        this.statdata.time_started = new Date();
        this.reportStats();

        var that = this,
            genNum = 0;

        (function() {
            genNum = Math.min(genNum + that.reportStep, that.maxGenerations);
            while (that.curGen < genNum) {
                that.step();
            }
            that.reportStats();
            if (that.running && !that.terminationCondition()) {
                setTimeout(arguments.callee, 1);
            } else {
                that.statdata.time_finished = new Date();
                callback();
            }
        })();
    },
    stop: function() {
        this.running = false;
    },
    step: function() {
        this.curGen += 1;

        //------- create and switch populations
        this.population = this.createPopulation(this.offspringRules);

        this.computeStats(this.population);
    },
    computeStats: function(pop) {
        var statdata = this.statdata;
        statdata.fsum = 0.0;
        statdata.gen = this.curGen;
        for (var i = 0; i < this.PopSize; i+=1) {
            var ind = pop[i];
            if (!statdata.indbest || this.compare(ind, statdata.indbest) < 0) {
                statdata.indbest = ind;
                statdata.time_bestfound = new Date();
                statdata.gen_bestfound = this.curGen;
            }
            if (!statdata.indworst || this.compare(ind, statdata.indworst) > 0) {
                statdata.indworst = ind;
            }
            statdata.fsum += ind.fitness
        }
        statdata.favg = statdata.fsum / this.PopSize;
        statdata.fbest = statdata.indbest.fitness;
        statdata.fworst = statdata.indworst.fitness;
    }
});