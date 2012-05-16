
function printParams() {
    $('.params').html(tmpl('params_tmpl', {options: ga.options}));
}

var statLabels = {
    'gen': 'Generation',
    'fbest': 'Best fitness',
    'fworst': 'Worst fitness',
    'favg': 'Average fitness',
};

function printStats(stats) {
    $('.stats').html(tmpl('stats_tmpl', {stats: stats, labels: statLabels}));
}

function setParams() {
    var options = {};
    $('.params input[type=text]').each(function() {
        options[$(this).attr('id').replace(/^param-/, '')] = parseFloat($(this).val());
    });
    ga.setOptions(options);
}

function checkInitialized(force) {
    setParams();
    if (force || !ga.population) {
        ga.init();
        graph.reset();
        $('#chart').html('');
        $('#legend').html('');
        ga.reportStats();
    }
}

function stop() {
    $(controlSelector).prop('disabled', false);
    $('.buttons #start-stop').val('start');
    ga.stop();
}

function start() {
    $(controlSelector).prop('disabled', true);
    $('.buttons #start-stop').val('stop').prop('disabled', false);
    checkInitialized();
    ga.run(stop);
}

$('.buttons #start-stop').click(function() {
    if (ga.running) {
        stop();
    } else {
        start();
    }
});

$('.buttons #step').click(function() {
    checkInitialized();
    ga.step();
    ga.reportStats();
});

$('.buttons #reset').click(function() {
    checkInitialized(true);
});

$('.buttons #runtests').click(toggleTestRunning);

$('input#default').click(function() {
    ga.setOptions();
    printParams();
});


var problemSizes = ['20', '50'],
    problemCount = 30;
    //problems = {};

$('#chooser').html(tmpl('chooser_tmpl', {}));
$('#problemSize').change(loadInstance);
$('#problemInstance').change(loadInstance);
$('#showFitnessGraph').change(function() {
    graph.enable($(this).is(':checked'));
});

var controlSelector = '.buttons input, #chooser select, #group-params input';

function loadDatafile(p, callback) {
    if (p in problems) {
        callback(problems[p]);
        return
    }
    var url = 'data/problems'+p+'.txt',
        urlBests = 'data/bests'+p+'.txt';
    $.get(url, function (data) {
        var lines = data.split('\n');
        var numbers = lines.shift().split(/\s+/);
        var nodes = parseInt(numbers[1])+1;

        var problem = [];
        for (var i = 0, len = parseInt(numbers[0]); i < len; i++) {
            problem[i] = lines.slice(i*nodes, (i+1)*nodes).join('\n');
        }

        var result = {
            alpha: parseInt(numbers[2]),
            num: parseInt(numbers[0]),
            problems: problem
        };
        $.get(urlBests, function (data) {
            result.bests = $.trim(data).split(/\s+/).map(function(x) {
                return parseFloat(x);
            });
            problems[p] = result;
            callback(result);
        });
    });
};

function loadInstance() {
    var p = parseInt($('#problemSize').val()),
        i = parseInt($('#problemInstance').val());
    loadDatafile(p, function(problem) {
        ga = new MEB({});
        setParams();
        printParams();
        ga.reportStats = function() {
            vis.draw(this.statdata.indbest.genes);
            printStats(this.statdata);
            graph.update(this.statdata);
        };
        ga.initProblem(problem.problems[i], problem.alpha, problem.bests[i]);
        vis.init(ga);
    });
}

var testRunning = false,
    runCount = 3;

function toggleTestRunning() {
    if (testRunning) {
        testRunning = false;
    } else {
        testRunning = true;
        $('#result').html('');
        $(controlSelector).prop('disabled', true);
        $('.buttons #runtests').val('stop tests').prop('disabled', false);
        $('#vis, .group').hide();
        $('#group-controls, #group-params, #result').show();
        runInstanceR(0, 0, 0, []);
    }
}

function runInstanceR(l, j, k, results) {
    if (!testRunning) {
        ga = new MEB({});
        loadInstance();
        $('.group').show();
        $('#vis').show();
        $('.buttons #runtests').val('run tests');
        $(controlSelector).prop('disabled', false);
        return;
    }
    setTimeout(function() {
    var i = problemSizes[l];
    if (k >= runCount) {

        var summary = results.reduce(function(a, b) {
            var ret = {};
            for (var p in a) {
                ret[p] = a[p] + b[p];
            }
            return ret;
        });

        summary.excess = round(summary.excess / runCount, 2) + ' %';
        summary.time = round(summary.time / runCount, 2) + ' s';
        summary.found_after = round(summary.found_after / runCount, 2) + ' s';
        summary.gen_found = round(summary.gen_found / runCount, 0);
        summary.gen_total = round(summary.gen_total / runCount, 0);
        summary.opt_found += '/'+runCount;
        summary.instance = 'p'+i+'.'+j;
        $('#result table').last().append(tmpl('tablerow_tmpl', summary)+'\n');
        results = [];
        k = 0;
        j += 1;
    }
    if (j >= problemCount) {
        j = 0;
        l += 1;
        if (l >= problemSizes.length) {
            testRunning = false;
            runInstanceR();
            return;
        }
        i = problemSizes[l];
    }
    if (j === 0 && k === 0) {
        $('#result').append(tmpl('table_tmpl', {}));
    }
    ga = new MEB({});
    setParams();
    ga.reportStats = function() {
//         printStats(this.statdata);
    };
    ga.terminationCondition = function () {
        return !testRunning || this.curGen >= this.maxGenerations || this.curGen > this.statdata.gen_bestfound + 2000; // Math.abs(this.statdata.fbest - this.optimalResult) < 1
    };
    var problem = problems[i];
    ga.initProblem(problem.problems[j], problem.alpha, problem.bests[j]);
    ga.init();
    ga.run(function() {
        results.push({
            excess: Math.round(ga.statdata.diffopt*100)/100,
            opt_found: (Math.abs(ga.statdata.fbest - ga.optimalResult) < 1 ? 1 : 0),
            found_after: (ga.statdata.time_bestfound - ga.statdata.time_started) / 1000,
            gen_found: ga.statdata.gen_bestfound,
            gen_total: ga.curGen,
            time: (ga.statdata.time_finished - ga.statdata.time_started) / 1000
        });
        runInstanceR(l, j, k+1, results);
    });
    }, 10);
}

var ga,
    graph = new FitnessGraph({
        graph: '#chart',
        legend: '#legend'
    }),
    vis = new MEBVisualization({
        selector: '#vis'
    });

loadInstance();