(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
    /*global describe*/
    /*global require*/
    /*global module*/
    /*global it*/
    /*global console*/
    /*global process*/
    /*jshint -W083 */
    
     /*************************************************************
     * Method: to_JSON
     * Scope: Public:
     * Agruments: input: Whatever the user gives us
     * Purpose: Convert an unfriendly formatted LP
     *          into something that our library can
     *          work with
     **************************************************************/
    function to_JSON(input){
        var rxo = {
            /* jshint ignore:start */
            "is_blank": /^\W{0,}$/,
            "is_objective": /(max|min)(imize){0,}\:/i,
            "is_int": /^(?!\/\*)\W{0,}int/i,
            "is_bin": /^(?!\/\*)\W{0,}bin/i,
            "is_constraint": /(\>|\<){0,}\=/i,
            "is_unrestricted": /^\S{0,}unrestricted/i,
            "parse_lhs":  /(\-|\+){0,1}\s{0,1}\d{0,}\.{0,}\d{0,}\s{0,}[A-Za-z]\S{0,}/gi,
            "parse_rhs": /(\-|\+){0,1}\d{1,}\.{0,}\d{0,}\W{0,}\;{0,1}$/i,
            "parse_dir": /(\>|\<){0,}\=/gi,
            "parse_int": /[^\s|^\,]+/gi,
            "parse_bin": /[^\s|^\,]+/gi,
            "get_num": /(\-|\+){0,1}(\W|^)\d+\.{0,1}\d{0,}/g,
            "get_word": /[A-Za-z].*/
            /* jshint ignore:end */
        },
        model = {
            "opType": "",
            "optimize": "_obj",
            "constraints": {},
            "variables": {}
        },
        constraints = {
            ">=": "min",
            "<=": "max",
            "=": "equal"
        },
        tmp = "", tst = 0, ary = null, hldr = "", hldr2 = "",
        constraint = "", rhs = 0;
    
        // Handle input if its coming
        // to us as a hard string
        // instead of as an array of
        // strings
        if(typeof input === "string"){
            input = input.split("\n");
        }
    
        // Start iterating over the rows
        // to see what all we have
        for(var i = 0; i < input.length; i++){
    
            constraint = "__" + i;
    
            // Get the string we're working with
            tmp = input[i];
    
            // Set the test = 0
            tst = 0;
    
            // Reset the array
            ary = null;
    
            // Test to see if we're the objective
            if(rxo.is_objective.test(tmp)){
                // Set up in model the opType
                model.opType = tmp.match(/(max|min)/gi)[0];
    
                // Pull apart lhs
                ary = tmp.match(rxo.parse_lhs).map(function(d){
                    return d.replace(/\s+/,"");
                }).slice(1);
    
    
    
                // *** STEP 1 *** ///
                // Get the variables out
                ary.forEach(function(d){
    
                    // Get the number if its there
                    hldr = d.match(rxo.get_num);
    
                    // If it isn't a number, it might
                    // be a standalone variable
                    if(hldr === null){
                        if(d.substr(0,1) === "-"){
                            hldr = -1;
                        } else {
                            hldr = 1;
                        }
                    } else {
                        hldr = hldr[0];
                    }
    
                    hldr = parseFloat(hldr);
    
                    // Get the variable type
                    hldr2 = d.match(rxo.get_word)[0].replace(/\;$/,"");
    
                    // Make sure the variable is in the model
                    model.variables[hldr2] = model.variables[hldr2] || {};
                    model.variables[hldr2]._obj = hldr;
    
                });
            ////////////////////////////////////
            }else if(rxo.is_int.test(tmp)){
                // Get the array of ints
                ary = tmp.match(rxo.parse_int).slice(1);
    
                // Since we have an int, our model should too
                model.ints = model.ints || {};
    
                ary.forEach(function(d){
                    d = d.replace(";","");
                    model.ints[d] = 1;
                });
            ////////////////////////////////////
            } else if(rxo.is_bin.test(tmp)){
                // Get the array of bins
                ary = tmp.match(rxo.parse_bin).slice(1);
    
                // Since we have an binary, our model should too
                model.binaries = model.binaries || {};
    
                ary.forEach(function(d){
                    d = d.replace(";","");
                    model.binaries[d] = 1;
                });
            ////////////////////////////////////
            } else if(rxo.is_constraint.test(tmp)){
                var separatorIndex = tmp.indexOf(":");
                var constraintExpression = (separatorIndex === -1) ? tmp : tmp.slice(separatorIndex + 1);
    
                // Pull apart lhs
                ary = constraintExpression.match(rxo.parse_lhs).map(function(d){
                    return d.replace(/\s+/,"");
                });
    
                // *** STEP 1 *** ///
                // Get the variables out
                ary.forEach(function(d){
                    // Get the number if its there
                    hldr = d.match(rxo.get_num);
    
                    if(hldr === null){
                        if(d.substr(0,1) === "-"){
                            hldr = -1;
                        } else {
                            hldr = 1;
                        }
                    } else {
                        hldr = hldr[0];
                    }
    
                    hldr = parseFloat(hldr);
    
    
                    // Get the variable name
                    hldr2 = d.match(rxo.get_word)[0];
    
                    // Make sure the variable is in the model
                    model.variables[hldr2] = model.variables[hldr2] || {};
                    model.variables[hldr2][constraint] = hldr;
    
                });
    
                // *** STEP 2 *** ///
                // Get the RHS out
                rhs = parseFloat(tmp.match(rxo.parse_rhs)[0]);
    
                // *** STEP 3 *** ///
                // Get the Constrainer out
                tmp = constraints[tmp.match(rxo.parse_dir)[0]];
                model.constraints[constraint] = model.constraints[constraint] || {};
                model.constraints[constraint][tmp] = rhs;
            ////////////////////////////////////
            } else if(rxo.is_unrestricted.test(tmp)){
                // Get the array of unrestricted
                ary = tmp.match(rxo.parse_int).slice(1);
    
                // Since we have an int, our model should too
                model.unrestricted = model.unrestricted || {};
    
                ary.forEach(function(d){
                    d = d.replace(";","");
                    model.unrestricted[d] = 1;
                });
            }
        }
        return model;
    }
    
    
     /*************************************************************
     * Method: from_JSON
     * Scope: Public:
     * Agruments: model: The model we want solver to operate on
     * Purpose: Convert a friendly JSON model into a model for a
     *          real solving library...in this case
     *          lp_solver
     **************************************************************/
    function from_JSON(model){
        // Make sure we at least have a model
        if (!model) {
            throw new Error("Solver requires a model to operate on");
        }
    
        var output = "",
            ary = [],
            norm = 1,
            lookup = {
                "max": "<=",
                "min": ">=",
                "equal": "="
            },
            rxClean = new RegExp("[^A-Za-z0-9_\[\{\}\/\.\&\#\$\%\~\'\@\^]", "gi");
    
        // Build the objective statement
        
        if(model.opType){
            
            output += model.opType + ":";
    
            // Iterate over the variables
            for(var x in model.variables){
                // Give each variable a self of 1 unless
                // it exists already
                model.variables[x][x] = model.variables[x][x] ? model.variables[x][x] : 1;
    
                // Does our objective exist here?
                if(model.variables[x][model.optimize]){
                    output += " " + model.variables[x][model.optimize] + " " + x.replace(rxClean,"_");
                }
            }
        } else {
            output += "max:";
        }
        
    
    
        // Add some closure to our line thing
        output += ";\n\n";
    
        // And now... to iterate over the constraints
        for(var xx in model.constraints){
            for(var y in model.constraints[xx]){
                if(typeof lookup[y] !== "undefined"){
                    
                    for(var z in model.variables){
    
                        // Does our Constraint exist here?
                        if(typeof model.variables[z][xx] !== "undefined"){
                            output += " " + model.variables[z][xx] + " " + z.replace(rxClean,"_");
                        }
                    }
                    // Add the constraint type and value...
    
                    output += " " + lookup[y] + " " + model.constraints[xx][y];
                    output += ";\n";
                    
                }
            }
        }
    
        // Are there any ints?
        if(model.ints){
            output += "\n\n";
            for(var xxx in model.ints){
                output += "int " + xxx.replace(rxClean,"_") + ";\n";
            }
        }
    
        // Are there any unrestricted?
        if(model.unrestricted){
            output += "\n\n";
            for(var xxxx in model.unrestricted){
                output += "unrestricted " + xxxx.replace(rxClean,"_") + ";\n";
            }
        }
    
        // And kick the string back
        return output;
    
    }
    
    
    module.exports = function (model) {
        // If the user is giving us an array
        // or a string, convert it to a JSON Model
        // otherwise, spit it out as a string
        if(model.length){
            return to_JSON(model);
        } else {
            return from_JSON(model);
        }
    };
    
    },{}],2:[function(require,module,exports){
    /*global describe*/
    /*global require*/
    /*global it*/
    /*global console*/
    /*global process*/
    /*global exports*/
    /*global Promise*/
    
    
    // LP SOLVE CLI REFERENCE:
    // http://lpsolve.sourceforge.net/5.5/lp_solve.htm
    //
    //
    
    // var reformat = require("./Reformat.js");
    
    exports.reformat = require("./Reformat.js");
    
    function clean_data(data){
    
        //
        // Clean Up
        // And Reformatting...
        //
        data = data.replace("\\r\\n","\r\n");
    
    
        data = data.split("\r\n");
        data = data.filter(function(x){
            
            var rx;
            
            //
            // Test 1
            rx = new RegExp(" 0$","gi");
            if(rx.test(x) === true){
                return false;
            }
    
            //
            // Test 2
            rx = new RegExp("\\d$","gi");
            if(rx.test(x) === false){
                return false;
            }
            
    
            return true;
        })
        .map(function(x){
            return x.split(/\:{0,1} +(?=\d)/);
        })
        .reduce(function(o,k,i){
            o[k[0]] = k[1];
            return o;
        },{});
        
        return data;
    }
    
    
    
    
    
    exports.solve = function(model){
        //
        return new Promise(function(res, rej){
            //
            // Exit if we're in the browser...
            //
            if(typeof window !== "undefined"){
                rej("Function Not Available in Browser");
            }
            //
            // Convert JSON model to lp_solve format
            //
            var data = require("./Reformat.js")(model);
            
            
            if(!model.external){
                rej("Data for this function must be contained in the 'external' attribute. Not seeing anything there.");
            }
            
            // 
            // In the args, they *SHALL* have provided an executable
            // path to the solver they're piping the data into
            //
            if(!model.external.binPath){
                rej("No Executable | Binary path provided in arguments as 'binPath'");
            }
            
            //
            // They also need to provide an arg_array
            //
            if(!model.external.args){
                rej("No arguments array for cli | bash provided on 'args' attribute");
            }
            
            //
            // They also need a tempName so we know where to store
            // the temp file we're creating...
            //
            if(!model.external.tempName){
                rej("No 'tempName' given. This is necessary to produce a staging file for the solver to operate on");
            }
            
            
            
            //
            // To my knowledge, in Windows, you cannot directly pipe text into
            // an exe...
            //
            // Thus, our process looks like this...
            //
            // 1.) Convert a model to something an external solver can use
            // 2.) Save the results from step 1 as a temp-text file
            // 3.) Pump the results into an exe | whatever-linux-uses
            // 4.) 
            // 
            //
            
            var fs = require("fs");
            
            fs.writeFile(model.external.tempName, data, function(fe, fd){
                if(fe){
                    rej(fe);
                } else {
                    //
                    // So it looks like we wrote to a file and closed it.
                    // Neat.
                    //
                    // Now we need to execute our CLI...
                    var exec = require("child_process").execFile;
                    
                    //
                    // Put the temp file name in the args array...
                    //
                    model.external.args.push(model.external.tempName);
                    
                    exec(model.external.binPath, model.external.args, function(e,data){
                        if(e){
                            
                            if(e.code === 1){
                                res(clean_data(data));
                            } else {
                                
                                var codes = {
                                    "-2": "Out of Memory",
                                    "1": "SUBOPTIMAL",
                                    "2": "INFEASIBLE",
                                    "3": "UNBOUNDED",
                                    "4": "DEGENERATE",
                                    "5": "NUMFAILURE",
                                    "6": "USER-ABORT",
                                    "7": "TIMEOUT",
                                    "9": "PRESOLVED",
                                    "25": "ACCURACY ERROR",
                                    "255": "FILE-ERROR"
                                };
                                
                                var ret_obj = {
                                    "code": e.code,
                                    "meaning": codes[e.code],
                                    "data": data
                                };
                                
                                rej(ret_obj);
                            }
    
                        } else {
                            // And finally...return it.
                            res(clean_data(data));
                        }
                    });
                }
            });
        });
    };
    
    
    
    
    
    /*
    model.external = {
        "binPath": "C:/lpsolve/lp_solve.exe",
        "tempName": "C:/temp/out.txt",
        "args": [
            "-S2"
        ]
        
    }
    
    */
    },{"./Reformat.js":1,"child_process":23,"fs":23}],3:[function(require,module,exports){
    /*global describe*/
    /*global require*/
    /*global it*/
    /*global console*/
    /*global process*/
    /*global exports*/
    /*global Promise*/
    /*global module*/
    
    module.exports = {
        "lpsolve": require("./lpsolve/main.js")
    };
    },{"./lpsolve/main.js":2}],4:[function(require,module,exports){
    /*global describe*/
    /*global require*/
    /*global module*/
    /*global it*/
    /*global console*/
    /*global process*/
    
    var Tableau = require("./Tableau/Tableau.js");
    var branchAndCut = require("./Tableau/branchAndCut.js");
    var expressions = require("./expressions.js");
    var Constraint = expressions.Constraint;
    var Equality = expressions.Equality;
    var Variable = expressions.Variable;
    var IntegerVariable = expressions.IntegerVariable;
    var Term = expressions.Term;
    
    /*************************************************************
     * Class: Model
     * Description: Holds the model of a linear optimisation problem
     **************************************************************/
    function Model(precision, name) {
        this.tableau = new Tableau(precision);
    
        this.name = name;
    
        this.variables = [];
    
        this.integerVariables = [];
    
        this.unrestrictedVariables = {};
    
        this.constraints = [];
    
        this.nConstraints = 0;
    
        this.nVariables = 0;
    
        this.isMinimization = true;
    
        this.tableauInitialized = false;
        
        this.relaxationIndex = 1;
    
        this.useMIRCuts = false;
    
        this.checkForCycles = true;
        
        //
        // Quick and dirty way to leave useful information
        // for the end user without hitting the console
        // or modifying the primary return object...
        //
        this.messages = [];
    }
    module.exports = Model;
    
    Model.prototype.minimize = function () {
        this.isMinimization = true;
        return this;
    };
    
    Model.prototype.maximize = function () {
        this.isMinimization = false;
        return this;
    };
    
    // Model.prototype.addConstraint = function (constraint) {
    //     // TODO: make sure that the constraint does not belong do another model
    //     // and make
    //     this.constraints.push(constraint);
    //     return this;
    // };
    
    Model.prototype._getNewElementIndex = function () {
        if (this.availableIndexes.length > 0) {
            return this.availableIndexes.pop();
        }
    
        var index = this.lastElementIndex;
        this.lastElementIndex += 1;
        return index;
    };
    
    Model.prototype._addConstraint = function (constraint) {
        var slackVariable = constraint.slack;
        this.tableau.variablesPerIndex[slackVariable.index] = slackVariable;
        this.constraints.push(constraint);
        this.nConstraints += 1;
        if (this.tableauInitialized === true) {
            this.tableau.addConstraint(constraint);
        }
    };
    
    Model.prototype.smallerThan = function (rhs) {
        var constraint = new Constraint(rhs, true, this.tableau.getNewElementIndex(), this);
        this._addConstraint(constraint);
        return constraint;
    };
    
    Model.prototype.greaterThan = function (rhs) {
        var constraint = new Constraint(rhs, false, this.tableau.getNewElementIndex(), this);
        this._addConstraint(constraint);
        return constraint;
    };
    
    Model.prototype.equal = function (rhs) {
        var constraintUpper = new Constraint(rhs, true, this.tableau.getNewElementIndex(), this);
        this._addConstraint(constraintUpper);
    
        var constraintLower = new Constraint(rhs, false, this.tableau.getNewElementIndex(), this);
        this._addConstraint(constraintLower);
    
        return new Equality(constraintUpper, constraintLower);
    };
    
    Model.prototype.addVariable = function (cost, id, isInteger, isUnrestricted, priority) {
        if (typeof priority === "string") {
            switch (priority) {
            case "required":
                priority = 0;
                break;
            case "strong":
                priority = 1;
                break;
            case "medium":
                priority = 2;
                break;
            case "weak":
                priority = 3;
                break;
            default:
                priority = 0;
                break;
            }
        }
    
        var varIndex = this.tableau.getNewElementIndex();
        if (id === null || id === undefined) {
            id = "v" + varIndex;
        }
    
        if (cost === null || cost === undefined) {
            cost = 0;
        }
    
        if (priority === null || priority === undefined) {
            priority = 0;
        }
    
        var variable;
        if (isInteger) {
            variable = new IntegerVariable(id, cost, varIndex, priority);
            this.integerVariables.push(variable);
        } else {
            variable = new Variable(id, cost, varIndex, priority);
        }
    
        this.variables.push(variable);
        this.tableau.variablesPerIndex[varIndex] = variable;
    
        if (isUnrestricted) {
            this.unrestrictedVariables[varIndex] = true;
        }
    
        this.nVariables += 1;
    
        if (this.tableauInitialized === true) {
            this.tableau.addVariable(variable);
        }
    
        return variable;
    };
    
    Model.prototype._removeConstraint = function (constraint) {
        var idx = this.constraints.indexOf(constraint);
        if (idx === -1) {
            console.warn("[Model.removeConstraint] Constraint not present in model");
            return;
        }
    
        this.constraints.splice(idx, 1);
        this.nConstraints -= 1;
    
        if (this.tableauInitialized === true) {
            this.tableau.removeConstraint(constraint);
        }
    
        if (constraint.relaxation) {
            this.removeVariable(constraint.relaxation);
        }
    };
    
    //-------------------------------------------------------------------
    // For dynamic model modification
    //-------------------------------------------------------------------
    Model.prototype.removeConstraint = function (constraint) {
        if (constraint.isEquality) {
            this._removeConstraint(constraint.upperBound);
            this._removeConstraint(constraint.lowerBound);
        } else {
            this._removeConstraint(constraint);
        }
    
        return this;
    };
    
    Model.prototype.removeVariable = function (variable) {
        var idx = this.variables.indexOf(variable);
        if (idx === -1) {
            console.warn("[Model.removeVariable] Variable not present in model");
            return;
        }
        this.variables.splice(idx, 1);
    
        if (this.tableauInitialized === true) {
            this.tableau.removeVariable(variable);
        }
    
        return this;
    };
    
    Model.prototype.updateRightHandSide = function (constraint, difference) {
        if (this.tableauInitialized === true) {
            this.tableau.updateRightHandSide(constraint, difference);
        }
        return this;
    };
    
    Model.prototype.updateConstraintCoefficient = function (constraint, variable, difference) {
        if (this.tableauInitialized === true) {
            this.tableau.updateConstraintCoefficient(constraint, variable, difference);
        }
        return this;
    };
    
    
    Model.prototype.setCost = function (cost, variable) {
        var difference = cost - variable.cost;
        if (this.isMinimization === false) {
            difference = -difference;
        }
    
        variable.cost = cost;
        this.tableau.updateCost(variable, difference);
        return this;
    };
    
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    Model.prototype.loadJson = function (jsonModel) {
        this.isMinimization = (jsonModel.opType !== "max");
    
        var variables = jsonModel.variables;
        var constraints = jsonModel.constraints;
    
        var constraintsMin = {};
        var constraintsMax = {};
    
        // Instantiating constraints
        var constraintIds = Object.keys(constraints);
        var nConstraintIds = constraintIds.length;
    
        for (var c = 0; c < nConstraintIds; c += 1) {
            var constraintId = constraintIds[c];
            var constraint = constraints[constraintId];
            var equal = constraint.equal;
    
            var weight = constraint.weight;
            var priority = constraint.priority;
            var relaxed = weight !== undefined || priority !== undefined;
    
            var lowerBound, upperBound;
            if (equal === undefined) {
                var min = constraint.min;
                if (min !== undefined) {
                    lowerBound = this.greaterThan(min);
                    constraintsMin[constraintId] = lowerBound;
                    if (relaxed) { lowerBound.relax(weight, priority); }
                }
    
                var max = constraint.max;
                if (max !== undefined) {
                    upperBound = this.smallerThan(max);
                    constraintsMax[constraintId] = upperBound;
                    if (relaxed) { upperBound.relax(weight, priority); }
                }
            } else {
                lowerBound = this.greaterThan(equal);
                constraintsMin[constraintId] = lowerBound;
    
                upperBound = this.smallerThan(equal);
                constraintsMax[constraintId] = upperBound;
    
                var equality = new Equality(lowerBound, upperBound);
                if (relaxed) { equality.relax(weight, priority); }
            }
        }
    
        var variableIds = Object.keys(variables);
        var nVariables = variableIds.length;
        
        
        
    //
    //
    // *** OPTIONS ***
    //
    //
    
        this.tolerance = jsonModel.tolerance || 0;
        
        if(jsonModel.timeout){
            this.timeout = jsonModel.timeout;
        }
        
        //
        //
        // The model is getting too sloppy with options added to it...
        // mebe it needs an "options" option...?
        //
        // YES! IT DOES!
        // DO IT!
        // NOW!
        // HERE!!!
        //
        if(jsonModel.options){
            
            //
            // TIMEOUT
            //
            if(jsonModel.options.timeout){
                this.timeout = jsonModel.options.timeout;
            }
            
            //
            // TOLERANCE
            //
            if(this.tolerance === 0){
                this.tolerance = jsonModel.options.tolerance || 0;
            }
            
            //
            // MIR CUTS - (NOT WORKING)
            //
            if(jsonModel.options.useMIRCuts){
                this.useMIRCuts = jsonModel.options.useMIRCuts;
            }
            
            //
            // CYCLE CHECK...tricky because it defaults to false
            //
            //
            // This should maybe be on by default...
            //
            if(typeof jsonModel.options.exitOnCycles === "undefined"){
                this.checkForCycles = true;
            } else {
                this.checkForCycles = jsonModel.options.exitOnCycles;
            }
    
            
        }
        
        
    //
    //
    // /// OPTIONS \\\
    //
    //
        
        var integerVarIds = jsonModel.ints || {};
        var binaryVarIds = jsonModel.binaries || {};
        var unrestrictedVarIds = jsonModel.unrestricted || {};
    
        // Instantiating variables and constraint terms
        var objectiveName = jsonModel.optimize;
        for (var v = 0; v < nVariables; v += 1) {
            // Creation of the variables
            var variableId = variableIds[v];
            var variableConstraints = variables[variableId];
            var cost = variableConstraints[objectiveName] || 0;
            var isBinary = !!binaryVarIds[variableId];
            var isInteger = !!integerVarIds[variableId] || isBinary;
            var isUnrestricted = !!unrestrictedVarIds[variableId];
            var variable = this.addVariable(cost, variableId, isInteger, isUnrestricted);
    
            if (isBinary) {
                // Creating an upperbound constraint for this variable
                this.smallerThan(1).addTerm(1, variable);
            }
    
            var constraintNames = Object.keys(variableConstraints);
            for (c = 0; c < constraintNames.length; c += 1) {
                var constraintName = constraintNames[c];
                if (constraintName === objectiveName) {
                    continue;
                }
    
                var coefficient = variableConstraints[constraintName];
    
                var constraintMin = constraintsMin[constraintName];
                if (constraintMin !== undefined) {
                    constraintMin.addTerm(coefficient, variable);
                }
    
                var constraintMax = constraintsMax[constraintName];
                if (constraintMax !== undefined) {
                    constraintMax.addTerm(coefficient, variable);
                }
            }
        }
    
        return this;
    };
    
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    Model.prototype.getNumberOfIntegerVariables = function () {
        return this.integerVariables.length;
    };
    
    Model.prototype.solve = function () {
        // Setting tableau if not done
        if (this.tableauInitialized === false) {
            this.tableau.setModel(this);
            this.tableauInitialized = true;
        }
    
        return this.tableau.solve();
    };
    
    Model.prototype.isFeasible = function () {
        return this.tableau.feasible;
    };
    
    Model.prototype.save = function () {
        return this.tableau.save();
    };
    
    Model.prototype.restore = function () {
        return this.tableau.restore();
    };
    
    Model.prototype.activateMIRCuts = function (useMIRCuts) {
        this.useMIRCuts = useMIRCuts;
    };
    
    Model.prototype.debug = function (debugCheckForCycles) {
        this.checkForCycles = debugCheckForCycles;
    };
    
    Model.prototype.log = function (message) {
        return this.tableau.log(message);
    };
    
    },{"./Tableau/Tableau.js":8,"./Tableau/branchAndCut.js":10,"./expressions.js":19}],5:[function(require,module,exports){
    /*global describe*/
    /*global require*/
    /*global module*/
    /*global it*/
    /*global console*/
    /*global process*/
    
        /***************************************************************
         * Method: polyopt
         * Scope: private
         * Agruments:
         *        model: The model we want solver to operate on.
                         Because we're in here, we're assuming that
                         we're solving a multi-objective optimization
                         problem. Poly-Optimization. polyopt.
    
                         This model has to be formed a little differently
                         because it has multiple objective functions.
                         Normally, a model has 2 attributes: opType (string,
                         "max" or "min"), and optimize (string, whatever
                         attribute we're optimizing.
    
                         Now, there is no opType attribute on the model,
                         and optimize is an object of attributes to be
                         optimized, and how they're to be optimized.
                         For example:
    
                         ...
                         "optimize": {
                            "pancakes": "max",
                            "cost": "minimize"
                         }
                         ...
    
    
         **************************************************************/
    
    module.exports = function(solver, model){
    
        // I have no idea if this is actually works, or what,
        // but here is my algorithm to solve linear programs
        // with multiple objective functions
    
        // 1. Optimize for each constraint
        // 2. The results for each solution is a vector
        //    representing a vertex on the polytope we're creating
        // 3. The results for all solutions describes the shape
        //    of the polytope (would be nice to have the equation
        //    representing this)
        // 4. Find the mid-point between all vertices by doing the
        //    following (a_1 + a_2 ... a_n) / n;
        var objectives = model.optimize,
            new_constraints = JSON.parse(JSON.stringify(model.optimize)),
            keys = Object.keys(model.optimize),
            tmp,
            counter = 0,
            vectors = {},
            vector_key = "",
            obj = {},
            pareto = [],
            i,j,x,y,z;
    
        // Delete the optimize object from the model
        delete model.optimize;
    
        // Iterate and Clear
        for(i = 0; i < keys.length; i++){
            // Clean up the new_constraints
            new_constraints[keys[i]] = 0;
        }
    
        // Solve and add
        for(i = 0; i < keys.length; i++){
    
            // Prep the model
            model.optimize = keys[i];
            model.opType = objectives[keys[i]];
    
            // solve the model
            tmp = solver.Solve(model, undefined, undefined, true);
    
            // Only the variables make it into the solution;
            // not the attributes.
            //
            // Because of this, we have to add the attributes
            // back onto the solution so we can do math with
            // them later...
    
            // Loop over the keys
            for(y in keys){
                // We're only worried about attributes, not variables
                if(!model.variables[keys[y]]){
                    // Create space for the attribute in the tmp object
                    tmp[keys[y]] = tmp[keys[y]] ? tmp[keys[y]] : 0;
                    // Go over each of the variables
                    for(x in model.variables){
                        // Does the variable exist in tmp *and* does attribute exist in this model?
                        if(model.variables[x][keys[y]] && tmp[x]){
                            // Add it to tmp
                            tmp[keys[y]] += tmp[x] * model.variables[x][keys[y]];
                        }
                    }
                }
            }
    
            // clear our key
            vector_key = "base";
            // this makes sure that if we get
            // the same vector more than once,
            // we only count it once when finding
            // the midpoint
            for(j = 0; j < keys.length; j++){
                if(tmp[keys[j]]){
                    vector_key += "-" + ((tmp[keys[j]] * 1000) | 0) / 1000;
                } else {
                    vector_key += "-0";
                }
            }
    
            // Check here to ensure it doesn't exist
            if(!vectors[vector_key]){
                // Add the vector-key in
                vectors[vector_key] = 1;
                counter++;
                
                // Iterate over the keys
                // and update our new constraints
                for(j = 0; j < keys.length; j++){
                    if(tmp[keys[j]]){
                        new_constraints[keys[j]] += tmp[keys[j]];
                    }
                }
                
                // Push the solution into the paretos
                // array after cleaning it of some
                // excess data markers
                
                delete tmp.feasible;
                delete tmp.result;            
                pareto.push(tmp);
            }
        }
    
        // Trying to find the mid-point
        // divide each constraint by the
        // number of constraints
        // *midpoint formula*
        // (x1 + x2 + x3) / 3
        for(i = 0; i < keys.length; i++){
            model.constraints[keys[i]] = {"equal": new_constraints[keys[i]] / counter};
        }
    
        // Give the model a fake thing to optimize on
        model.optimize = "cheater-" + Math.random();
        model.opType = "max";
    
        // And add the fake attribute to the variables
        // in the model
        for(i in model.variables){
            model.variables[i].cheater = 1;
        }
        
        // Build out the object with all attributes
        for(i in pareto){
            for(x in pareto[i]){
                obj[x] = obj[x] || {min: 1e99, max: -1e99};
            }
        }
        
        // Give each pareto a full attribute list
        // while getting the max and min values
        // for each attribute
        for(i in obj){
            for(x in pareto){
                if(pareto[x][i]){
                    if(pareto[x][i] > obj[i].max){
                        obj[i].max = pareto[x][i];
                    } 
                    if(pareto[x][i] < obj[i].min){
                        obj[i].min = pareto[x][i];
                    }
                } else {
                    pareto[x][i] = 0;
                    obj[i].min = 0;
                }
            }
        }
        // Solve the model for the midpoints
        tmp =  solver.Solve(model, undefined, undefined, true);
        
        return {
            midpoint: tmp,
            vertices: pareto,
            ranges: obj
        };    
    
    };
    
    },{}],6:[function(require,module,exports){
    /*global module*/
    /*global require*/
    var Solution = require("./Solution.js");
    
    function MilpSolution(tableau, evaluation, feasible, bounded, branchAndCutIterations) {
        Solution.call(this, tableau, evaluation, feasible, bounded);
        this.iter = branchAndCutIterations;
    }
    module.exports = MilpSolution;
    MilpSolution.prototype = Object.create(Solution.prototype);
    MilpSolution.constructor = MilpSolution;
    
    },{"./Solution.js":7}],7:[function(require,module,exports){
    /*global module*/
    
    function Solution(tableau, evaluation, feasible, bounded) {
        this.feasible = feasible;
        this.evaluation = evaluation;
        this.bounded = bounded;
        this._tableau = tableau;
    }
    module.exports = Solution;
    
    Solution.prototype.generateSolutionSet = function () {
        var solutionSet = {};
    
        var tableau = this._tableau;
        var varIndexByRow = tableau.varIndexByRow;
        var variablesPerIndex = tableau.variablesPerIndex;
        var matrix = tableau.matrix;
        var rhsColumn = tableau.rhsColumn;
        var lastRow = tableau.height - 1;
        var roundingCoeff = Math.round(1 / tableau.precision);
    
        for (var r = 1; r <= lastRow; r += 1) {
            var varIndex = varIndexByRow[r];
            var variable = variablesPerIndex[varIndex];
            if (variable === undefined || variable.isSlack === true) {
                continue;
            }
    
            var varValue = matrix[r][rhsColumn];
            solutionSet[variable.id] =
                Math.round((Number.EPSILON + varValue) * roundingCoeff) / roundingCoeff;
        }
    
        return solutionSet;
    };
    
    },{}],8:[function(require,module,exports){
    /*global describe*/
    /*global require*/
    /*global module*/
    /*global it*/
    /*global console*/
    /*global process*/
    var Solution = require("./Solution.js");
    var MilpSolution = require("./MilpSolution.js");
    
    /*************************************************************
     * Class: Tableau
     * Description: Simplex tableau, holding a the tableau matrix
     *              and all the information necessary to perform
     *              the simplex algorithm
     * Agruments:
     *        precision: If we're solving a MILP, how tight
     *                   do we want to define an integer, given
     *                   that 20.000000000000001 is not an integer.
     *                   (defaults to 1e-8)
     **************************************************************/
    function Tableau(precision) {
        this.model = null;
    
        this.matrix = null;
        this.width = 0;
        this.height = 0;
    
        this.costRowIndex = 0;
        this.rhsColumn = 0;
    
        this.variablesPerIndex = [];
        this.unrestrictedVars = null;
    
        // Solution attributes
        this.feasible = true; // until proven guilty
        this.evaluation = 0;
        this.simplexIters = 0;
    
        this.varIndexByRow = null;
        this.varIndexByCol = null;
    
        this.rowByVarIndex = null;
        this.colByVarIndex = null;
    
        this.precision = precision || 1e-8;
    
        this.optionalObjectives = [];
        this.objectivesByPriority = {};
    
        this.savedState = null;
    
        this.availableIndexes = [];
        this.lastElementIndex = 0;
    
        this.variables = null;
        this.nVars = 0;
    
        this.bounded = true;
        this.unboundedVarIndex = null;
    
        this.branchAndCutIterations = 0;
    }
    module.exports = Tableau;
    
    Tableau.prototype.solve = function () {
        if (this.model.getNumberOfIntegerVariables() > 0) {
            this.branchAndCut();
        } else {
            this.simplex();
        }
        this.updateVariableValues();
        return this.getSolution();
    };
    
    function OptionalObjective(priority, nColumns) {
        this.priority = priority;
        this.reducedCosts = new Array(nColumns);
        for (var c = 0; c < nColumns; c += 1) {
            this.reducedCosts[c] = 0;
        }
    }
    
    OptionalObjective.prototype.copy = function () {
        var copy = new OptionalObjective(this.priority, this.reducedCosts.length);
        copy.reducedCosts = this.reducedCosts.slice();
        return copy;
    };
    
    Tableau.prototype.setOptionalObjective = function (priority, column, cost) {
        var objectiveForPriority = this.objectivesByPriority[priority];
        if (objectiveForPriority === undefined) {
            var nColumns = Math.max(this.width, column + 1);
            objectiveForPriority = new OptionalObjective(priority, nColumns);
            this.objectivesByPriority[priority] = objectiveForPriority;
            this.optionalObjectives.push(objectiveForPriority);
            this.optionalObjectives.sort(function (a, b) {
                return a.priority - b.priority;
            });
        }
    
        objectiveForPriority.reducedCosts[column] = cost;
    };
    
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    Tableau.prototype.initialize = function (width, height, variables, unrestrictedVars) {
        this.variables = variables;
        this.unrestrictedVars = unrestrictedVars;
    
        this.width = width;
        this.height = height;
    
    
    // console.time("tableau_build");
        // BUILD AN EMPTY ARRAY OF THAT WIDTH
        var tmpRow = new Array(width);
        for (var i = 0; i < width; i++) {
            tmpRow[i] = 0;
        }
    
        // BUILD AN EMPTY TABLEAU
        this.matrix = new Array(height);
        for (var j = 0; j < height; j++) {
            this.matrix[j] = tmpRow.slice();
        }
    
    //
    // TODO: Benchmark This
    //this.matrix = new Array(height).fill(0).map(() => new Array(width).fill(0));
    
    // console.timeEnd("tableau_build");
    // console.log("height",height);
    // console.log("width",width);
    // console.log("------");
    // console.log("");
    
    
        this.varIndexByRow = new Array(this.height);
        this.varIndexByCol = new Array(this.width);
    
        this.varIndexByRow[0] = -1;
        this.varIndexByCol[0] = -1;
    
        this.nVars = width + height - 2;
        this.rowByVarIndex = new Array(this.nVars);
        this.colByVarIndex = new Array(this.nVars);
    
        this.lastElementIndex = this.nVars;
    };
    
    Tableau.prototype._resetMatrix = function () {
        var variables = this.model.variables;
        var constraints = this.model.constraints;
    
        var nVars = variables.length;
        var nConstraints = constraints.length;
    
        var v, varIndex;
        var costRow = this.matrix[0];
        var coeff = (this.model.isMinimization === true) ? -1 : 1;
        for (v = 0; v < nVars; v += 1) {
            var variable = variables[v];
            var priority = variable.priority;
            var cost = coeff * variable.cost;
            if (priority === 0) {
                costRow[v + 1] = cost;
            } else {
                this.setOptionalObjective(priority, v + 1, cost);
            }
    
            varIndex = variables[v].index;
            this.rowByVarIndex[varIndex] = -1;
            this.colByVarIndex[varIndex] = v + 1;
            this.varIndexByCol[v + 1] = varIndex;
        }
    
        var rowIndex = 1;
        for (var c = 0; c < nConstraints; c += 1) {
            var constraint = constraints[c];
    
            var constraintIndex = constraint.index;
            this.rowByVarIndex[constraintIndex] = rowIndex;
            this.colByVarIndex[constraintIndex] = -1;
            this.varIndexByRow[rowIndex] = constraintIndex;
    
            var t, term, column;
            var terms = constraint.terms;
            var nTerms = terms.length;
            var row = this.matrix[rowIndex++];
            if (constraint.isUpperBound) {
                for (t = 0; t < nTerms; t += 1) {
                    term = terms[t];
                    column = this.colByVarIndex[term.variable.index];
                    row[column] = term.coefficient;
                }
    
                row[0] = constraint.rhs;
            } else {
                for (t = 0; t < nTerms; t += 1) {
                    term = terms[t];
                    column = this.colByVarIndex[term.variable.index];
                    row[column] = -term.coefficient;
                }
    
                row[0] = -constraint.rhs;
            }
        }
    };
    
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    Tableau.prototype.setModel = function (model) {
        this.model = model;
    
        var width = model.nVariables + 1;
        var height = model.nConstraints + 1;
    
    
        this.initialize(width, height, model.variables, model.unrestrictedVariables);
        this._resetMatrix();
        return this;
    };
    
    Tableau.prototype.getNewElementIndex = function () {
        if (this.availableIndexes.length > 0) {
            return this.availableIndexes.pop();
        }
    
        var index = this.lastElementIndex;
        this.lastElementIndex += 1;
        return index;
    };
    
    Tableau.prototype.density = function () {
        var density = 0;
    
        var matrix = this.matrix;
        for (var r = 0; r < this.height; r++) {
            var row = matrix[r];
            for (var c = 0; c < this.width; c++) {
                if (row[c] !== 0) {
                    density += 1;
                }
            }
        }
    
        return density / (this.height * this.width);
    };
    
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    Tableau.prototype.setEvaluation = function () {
        // Rounding objective value
        var roundingCoeff = Math.round(1 / this.precision);
        var evaluation = this.matrix[this.costRowIndex][this.rhsColumn];
        var roundedEvaluation =
            Math.round((Number.EPSILON + evaluation) * roundingCoeff) / roundingCoeff;
    
        this.evaluation = roundedEvaluation;
        if (this.simplexIters === 0) {
            this.bestPossibleEval = roundedEvaluation;
        }
    };
    
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    Tableau.prototype.getSolution = function () {
        var evaluation = (this.model.isMinimization === true) ?
            this.evaluation : -this.evaluation;
    
        if (this.model.getNumberOfIntegerVariables() > 0) {
            return new MilpSolution(this, evaluation, this.feasible, this.bounded, this.branchAndCutIterations);
        } else {
            return new Solution(this, evaluation, this.feasible, this.bounded);
        }
    };
    
    },{"./MilpSolution.js":6,"./Solution.js":7}],9:[function(require,module,exports){
    /*global require*/
    var Tableau = require("./Tableau.js");
    
    Tableau.prototype.copy = function () {
        var copy = new Tableau(this.precision);
    
        copy.width = this.width;
        copy.height = this.height;
    
        copy.nVars = this.nVars;
        copy.model = this.model;
    
        // Making a shallow copy of integer variable indexes
        // and variable ids
        copy.variables = this.variables;
        copy.variablesPerIndex = this.variablesPerIndex;
        copy.unrestrictedVars = this.unrestrictedVars;
        copy.lastElementIndex = this.lastElementIndex;
    
        // All the other arrays are deep copied
        copy.varIndexByRow = this.varIndexByRow.slice();
        copy.varIndexByCol = this.varIndexByCol.slice();
    
        copy.rowByVarIndex = this.rowByVarIndex.slice();
        copy.colByVarIndex = this.colByVarIndex.slice();
    
        copy.availableIndexes = this.availableIndexes.slice();
    
        var optionalObjectivesCopy = [];
        for(var o = 0; o < this.optionalObjectives.length; o++){
            optionalObjectivesCopy[o] = this.optionalObjectives[o].copy();
        }
        copy.optionalObjectives = optionalObjectivesCopy;
    
    
        var matrix = this.matrix;
        var matrixCopy = new Array(this.height);
        for (var r = 0; r < this.height; r++) {
            matrixCopy[r] = matrix[r].slice();
        }
    
        copy.matrix = matrixCopy;
    
        return copy;
    };
    
    Tableau.prototype.save = function () {
        this.savedState = this.copy();
    };
    
    Tableau.prototype.restore = function () {
        if (this.savedState === null) {
            return;
        }
    
        var save = this.savedState;
        var savedMatrix = save.matrix;
        this.nVars = save.nVars;
        this.model = save.model;
    
        // Shallow restore
        this.variables = save.variables;
        this.variablesPerIndex = save.variablesPerIndex;
        this.unrestrictedVars = save.unrestrictedVars;
        this.lastElementIndex = save.lastElementIndex;
    
        this.width = save.width;
        this.height = save.height;
    
        // Restoring matrix
        var r, c;
        for (r = 0; r < this.height; r += 1) {
            var savedRow = savedMatrix[r];
            var row = this.matrix[r];
            for (c = 0; c < this.width; c += 1) {
                row[c] = savedRow[c];
            }
        }
    
        // Restoring all the other structures
        var savedBasicIndexes = save.varIndexByRow;
        for (c = 0; c < this.height; c += 1) {
            this.varIndexByRow[c] = savedBasicIndexes[c];
        }
    
        while (this.varIndexByRow.length > this.height) {
            this.varIndexByRow.pop();
        }
    
        var savedNonBasicIndexes = save.varIndexByCol;
        for (r = 0; r < this.width; r += 1) {
            this.varIndexByCol[r] = savedNonBasicIndexes[r];
        }
    
        while (this.varIndexByCol.length > this.width) {
            this.varIndexByCol.pop();
        }
    
        var savedRows = save.rowByVarIndex;
        var savedCols = save.colByVarIndex;
        for (var v = 0; v < this.nVars; v += 1) {
            this.rowByVarIndex[v] = savedRows[v];
            this.colByVarIndex[v] = savedCols[v];
        }
    
    
        if (save.optionalObjectives.length > 0 && this.optionalObjectives.length > 0) {
            this.optionalObjectives = [];
            this.optionalObjectivePerPriority = {};
            for(var o = 0; o < save.optionalObjectives.length; o++){
                var optionalObjectiveCopy = save.optionalObjectives[o].copy();
                this.optionalObjectives[o] = optionalObjectiveCopy;
                this.optionalObjectivePerPriority[optionalObjectiveCopy.priority] = optionalObjectiveCopy;
            }
        }
    };
    
    },{"./Tableau.js":8}],10:[function(require,module,exports){
    /*global describe*/
    /*global require*/
    /*global module*/
    /*global it*/
    /*global console*/
    /*global process*/
    var Tableau = require("./Tableau.js");
    
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    function Cut(type, varIndex, value) {
        this.type = type;
        this.varIndex = varIndex;
        this.value = value;
    }
    
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    function Branch(relaxedEvaluation, cuts) {
        this.relaxedEvaluation = relaxedEvaluation;
        this.cuts = cuts;
    }
    
    //-------------------------------------------------------------------
    // Branch sorting strategies
    //-------------------------------------------------------------------
    function sortByEvaluation(a, b) {
        return b.relaxedEvaluation - a.relaxedEvaluation;
    }
    
    
    //-------------------------------------------------------------------
    // Applying cuts on a tableau and resolving
    //-------------------------------------------------------------------
    Tableau.prototype.applyCuts = function (branchingCuts){
        // Restoring initial solution
        this.restore();
    
        this.addCutConstraints(branchingCuts);
        this.simplex();
        // Adding MIR cuts
        if (this.model.useMIRCuts){
            var fractionalVolumeImproved = true;
            while(fractionalVolumeImproved){
                var fractionalVolumeBefore = this.computeFractionalVolume(true);
                this.applyMIRCuts();
                this.simplex();
    
                var fractionalVolumeAfter = this.computeFractionalVolume(true);
    
                // If the new fractional volume is bigger than 90% of the previous one
                // we assume there is no improvement from the MIR cuts
                if(fractionalVolumeAfter >= 0.9 * fractionalVolumeBefore){
                    fractionalVolumeImproved = false;
                }
            }
        }
    };
    
    //-------------------------------------------------------------------
    // Function: MILP
    // Detail: Main function, my attempt at a mixed integer linear programming
    //         solver
    //-------------------------------------------------------------------
    Tableau.prototype.branchAndCut = function () {
        var branches = [];
        var iterations = 0;
        var tolerance = this.model.tolerance;
        var toleranceFlag = true;
        var terminalTime = 1e99;
        
        //
        // Set Start Time on model...
        // Let's build out a way to *gracefully* quit
        // after {{time}} milliseconds
        //
        
        // 1.) Check to see if there's a timeout on the model
        //
        if(this.model.timeout){
            // 2.) Hooray! There is!
            //     Calculate the final date
            //
            terminalTime = Date.now() + this.model.timeout;
        }
    
        // This is the default result
        // If nothing is both *integral* and *feasible*
        var bestEvaluation = Infinity;
        var bestBranch = null;
        var bestOptionalObjectivesEvaluations = [];
        for (var oInit = 0; oInit < this.optionalObjectives.length; oInit += 1){
            bestOptionalObjectivesEvaluations.push(Infinity);
        }
    
        // And here...we...go!
    
        // 1.) Load a model into the queue
        var branch = new Branch(-Infinity, []);
        var acceptableThreshold;
        
        branches.push(branch);
        // If all branches have been exhausted terminate the loop
        while (branches.length > 0 && toleranceFlag === true && Date.now() < terminalTime) {
            
            if(this.model.isMinimization){
                acceptableThreshold = this.bestPossibleEval * (1 + tolerance);
            } else {
                acceptableThreshold = this.bestPossibleEval * (1 - tolerance);
            }
            
            // Abort while loop if termination tolerance is both specified and condition is met
            if (tolerance > 0) {
                if (bestEvaluation < acceptableThreshold) {
                    toleranceFlag = false;
                }
            }
            
            // Get a model from the queue
            branch = branches.pop();
            if (branch.relaxedEvaluation > bestEvaluation) {
                continue;
            }
    
            // Solving from initial relaxed solution
            // with additional cut constraints
    
            // Adding cut constraints
            var cuts = branch.cuts;
            this.applyCuts(cuts);
    
            iterations++;
            if (this.feasible === false) {
                continue;
            }
    
            var evaluation = this.evaluation;
            if (evaluation > bestEvaluation) {
                // This branch does not contain the optimal solution
                continue;
            }
    
            // To deal with the optional objectives
            if (evaluation === bestEvaluation){
                var isCurrentEvaluationWorse = true;
                for (var o = 0; o < this.optionalObjectives.length; o += 1){
                    if (this.optionalObjectives[o].reducedCosts[0] > bestOptionalObjectivesEvaluations[o]){
                        break;
                    } else if (this.optionalObjectives[o].reducedCosts[0] < bestOptionalObjectivesEvaluations[o]) {
                        isCurrentEvaluationWorse = false;
                        break;
                    }
                }
    
                if (isCurrentEvaluationWorse){
                    continue;
                }
            }
    
            // Is the model both integral and feasible?
            if (this.isIntegral() === true) {
                
                //
                // Store the fact that we are integral
                //
                this.__isIntegral = true;
                
                
                if (iterations === 1) {
                    this.branchAndCutIterations = iterations;
                    return;
                }
                // Store the solution as the bestSolution
                bestBranch = branch;
                bestEvaluation = evaluation;
                for (var oCopy = 0; oCopy < this.optionalObjectives.length; oCopy += 1){
                    bestOptionalObjectivesEvaluations[oCopy] = this.optionalObjectives[oCopy].reducedCosts[0];
                }
            } else {
                if (iterations === 1) {
                    // Saving the first iteration
                    // TODO: implement a better strategy for saving the tableau?
                    this.save();
                }
    
                // If the solution is
                //  a. Feasible
                //  b. Better than the current solution
                //  c. but *NOT* integral
    
                // So the solution isn't integral? How do we solve this.
                // We create 2 new models, that are mirror images of the prior
                // model, with 1 exception.
    
                // Say we're trying to solve some stupid problem requiring you get
                // animals for your daughter's kindergarten petting zoo party
                // and you have to choose how many ducks, goats, and lambs to get.
    
                // Say that the optimal solution to this problem if we didn't have
                // to make it integral was {duck: 8, lambs: 3.5}
                //
                // To keep from traumatizing your daughter and the other children
                // you're going to want to have whole animals
    
                // What we would do is find the most fractional variable (lambs)
                // and create new models from the old models, but with a new constraint
                // on apples. The constraints on the low model would look like:
                // constraints: {...
                //   lamb: {max: 3}
                //   ...
                // }
                //
                // while the constraints on the high model would look like:
                //
                // constraints: {...
                //   lamb: {min: 4}
                //   ...
                // }
                // If neither of these models is feasible because of this constraint,
                // the model is not integral at this point, and fails.
    
                // Find out where we want to split the solution
                var variable = this.getMostFractionalVar();
    
                var varIndex = variable.index;
    
                var cutsHigh = [];
                var cutsLow = [];
    
                var nCuts = cuts.length;
                for (var c = 0; c < nCuts; c += 1) {
                    var cut = cuts[c];
                    if (cut.varIndex === varIndex) {
                        if (cut.type === "min") {
                            cutsLow.push(cut);
                        } else {
                            cutsHigh.push(cut);
                        }
                    } else {
                        cutsHigh.push(cut);
                        cutsLow.push(cut);
                    }
                }
    
                var min = Math.ceil(variable.value);
                var max = Math.floor(variable.value);
    
                var cutHigh = new Cut("min", varIndex, min);
                cutsHigh.push(cutHigh);
    
                var cutLow = new Cut("max", varIndex, max);
                cutsLow.push(cutLow);
    
                branches.push(new Branch(evaluation, cutsHigh));
                branches.push(new Branch(evaluation, cutsLow));
    
                // Sorting branches
                // Branches with the most promising lower bounds
                // will be picked first
                branches.sort(sortByEvaluation);
            }
        }
    
        // Adding cut constraints for the optimal solution
        if (bestBranch !== null) {
            // The model is feasible
            this.applyCuts(bestBranch.cuts);
        }
        this.branchAndCutIterations = iterations;
    };
    
    },{"./Tableau.js":8}],11:[function(require,module,exports){
    /*global require*/
    var Tableau = require("./Tableau.js");
    
    function VariableData(index, value) {
        this.index = index;
        this.value = value;
    }
    
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    Tableau.prototype.getMostFractionalVar = function () {
        var biggestFraction = 0;
        var selectedVarIndex = null;
        var selectedVarValue = null;
        var mid = 0.5;
    
        var integerVariables = this.model.integerVariables;
        var nIntegerVars = integerVariables.length;
        for (var v = 0; v < nIntegerVars; v++) {
            var varIndex = integerVariables[v].index;
            var varRow = this.rowByVarIndex[varIndex];
            if (varRow === -1) {
                continue;
            }
    
            var varValue = this.matrix[varRow][this.rhsColumn];
            var fraction = Math.abs(varValue - Math.round(varValue));
            if (biggestFraction < fraction) {
                biggestFraction = fraction;
                selectedVarIndex = varIndex;
                selectedVarValue = varValue;
            }
        }
    
        return new VariableData(selectedVarIndex, selectedVarValue);
    };
    
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    Tableau.prototype.getFractionalVarWithLowestCost = function () {
        var highestCost = Infinity;
        var selectedVarIndex = null;
        var selectedVarValue = null;
    
        var integerVariables = this.model.integerVariables;
        var nIntegerVars = integerVariables.length;
        for (var v = 0; v < nIntegerVars; v++) {
            var variable = integerVariables[v];
            var varIndex = variable.index;
            var varRow = this.rowByVarIndex[varIndex];
            if (varRow === -1) {
                // Variable value is non basic
                // its value is 0
                continue;
            }
    
            var varValue = this.matrix[varRow][this.rhsColumn];
            if (Math.abs(varValue - Math.round(varValue)) > this.precision) {
                var cost = variable.cost;
                if (highestCost > cost) {
                    highestCost = cost;
                    selectedVarIndex = varIndex;
                    selectedVarValue = varValue;
                }
            }
        }
    
        return new VariableData(selectedVarIndex, selectedVarValue);
    };
    
    },{"./Tableau.js":8}],12:[function(require,module,exports){
    /*global require*/
    var Tableau = require("./Tableau.js");
    var SlackVariable = require("../expressions.js").SlackVariable;
    
    Tableau.prototype.addCutConstraints = function (cutConstraints) {
        var nCutConstraints = cutConstraints.length;
    
        var height = this.height;
        var heightWithCuts = height + nCutConstraints;
    
        // Adding rows to hold cut constraints
        for (var h = height; h < heightWithCuts; h += 1) {
            if (this.matrix[h] === undefined) {
                this.matrix[h] = this.matrix[h - 1].slice();
            }
        }
    
        // Adding cut constraints
        this.height = heightWithCuts;
        this.nVars = this.width + this.height - 2;
    
        var c;
        var lastColumn = this.width - 1;
        for (var i = 0; i < nCutConstraints; i += 1) {
            var cut = cutConstraints[i];
    
            // Constraint row index
            var r = height + i;
    
            var sign = (cut.type === "min") ? -1 : 1;
    
            // Variable on which the cut is applied
            var varIndex = cut.varIndex;
            var varRowIndex = this.rowByVarIndex[varIndex];
            var constraintRow = this.matrix[r];
            if (varRowIndex === -1) {
                // Variable is non basic
                constraintRow[this.rhsColumn] = sign * cut.value;
                for (c = 1; c <= lastColumn; c += 1) {
                    constraintRow[c] = 0;
                }
                constraintRow[this.colByVarIndex[varIndex]] = sign;
            } else {
                // Variable is basic
                var varRow = this.matrix[varRowIndex];
                var varValue = varRow[this.rhsColumn];
                constraintRow[this.rhsColumn] = sign * (cut.value - varValue);
                for (c = 1; c <= lastColumn; c += 1) {
                    constraintRow[c] = -sign * varRow[c];
                }
            }
    
            // Creating slack variable
            var slackVarIndex = this.getNewElementIndex();
            this.varIndexByRow[r] = slackVarIndex;
            this.rowByVarIndex[slackVarIndex] = r;
            this.colByVarIndex[slackVarIndex] = -1;
            this.variablesPerIndex[slackVarIndex] = new SlackVariable("s"+slackVarIndex, slackVarIndex);
            this.nVars += 1;
        }
    };
    
    Tableau.prototype._addLowerBoundMIRCut = function(rowIndex) {
    
        if(rowIndex === this.costRowIndex) {
            //console.log("! IN MIR CUTS : The index of the row corresponds to the cost row. !");
            return false;
        }
    
        var model = this.model;
        var matrix = this.matrix;
    
        var intVar = this.variablesPerIndex[this.varIndexByRow[rowIndex]];
        if (!intVar.isInteger) {
            return false;
        }
    
        var d = matrix[rowIndex][this.rhsColumn];
        var frac_d = d - Math.floor(d);
    
        if (frac_d < this.precision || 1 - this.precision < frac_d) {
            return false;
        }
    
        //Adding a row
        var r = this.height;
        matrix[r] = matrix[r - 1].slice();
        this.height += 1;
    
        // Creating slack variable
        this.nVars += 1;
        var slackVarIndex = this.getNewElementIndex();
        this.varIndexByRow[r] = slackVarIndex;
        this.rowByVarIndex[slackVarIndex] = r;
        this.colByVarIndex[slackVarIndex] = -1;
        this.variablesPerIndex[slackVarIndex] = new SlackVariable("s"+slackVarIndex, slackVarIndex);
    
        matrix[r][this.rhsColumn] = Math.floor(d);
    
        for (var colIndex = 1; colIndex < this.varIndexByCol.length; colIndex += 1) {
            var variable = this.variablesPerIndex[this.varIndexByCol[colIndex]];
    
            if (!variable.isInteger) {
                matrix[r][colIndex] = Math.min(0, matrix[rowIndex][colIndex] / (1 - frac_d));
            } else {
                var coef = matrix[rowIndex][colIndex];
                var termCoeff = Math.floor(coef)+Math.max(0, coef - Math.floor(coef) - frac_d) / (1 - frac_d);
                matrix[r][colIndex] = termCoeff;
            }
        }
    
        for(var c = 0; c < this.width; c += 1) {
            matrix[r][c] -= matrix[rowIndex][c];
        }
    
        return true;
    };
    
    Tableau.prototype._addUpperBoundMIRCut = function(rowIndex) {
    
        if (rowIndex === this.costRowIndex) {
            //console.log("! IN MIR CUTS : The index of the row corresponds to the cost row. !");
            return false;
        }
    
        var model = this.model;
        var matrix = this.matrix;
    
        var intVar = this.variablesPerIndex[this.varIndexByRow[rowIndex]];
        if (!intVar.isInteger) {
            return false;
        }
    
        var b = matrix[rowIndex][this.rhsColumn];
        var f = b - Math.floor(b);
    
        if (f < this.precision || 1 - this.precision < f) {
            return false;
        }
    
        //Adding a row
        var r = this.height;
        matrix[r] = matrix[r - 1].slice();
        this.height += 1;
    
        // Creating slack variable
        
        this.nVars += 1;
        var slackVarIndex = this.getNewElementIndex();
        this.varIndexByRow[r] = slackVarIndex;
        this.rowByVarIndex[slackVarIndex] = r;
        this.colByVarIndex[slackVarIndex] = -1;
        this.variablesPerIndex[slackVarIndex] = new SlackVariable("s"+slackVarIndex, slackVarIndex);
    
        matrix[r][this.rhsColumn] = -f;
    
    
        for(var colIndex = 1; colIndex < this.varIndexByCol.length; colIndex += 1) {
            var variable = this.variablesPerIndex[this.varIndexByCol[colIndex]];
    
            var aj = matrix[rowIndex][colIndex];
            var fj = aj - Math.floor(aj);
    
            if(variable.isInteger) {
                if(fj <= f) {
                    matrix[r][colIndex] = -fj;
                } else {
                    matrix[r][colIndex] = -(1 - fj) * f / fj;
                }
            } else {
                if (aj >= 0) {
                    matrix[r][colIndex] = -aj;
                } else {
                    matrix[r][colIndex] = aj * f / (1 - f);
                }
            }
        }
    
        return true;
    };
    
    
    //
    // THIS MAKES SOME MILP PROBLEMS PROVIDE INCORRECT
    // ANSWERS...
    //
    // QUICK FIX: MAKE THE FUNCTION EMPTY...
    //
    Tableau.prototype.applyMIRCuts = function () {
        
        // var nRows = this.height;
        // for (var cst = 0; cst < nRows; cst += 1) {
        //    this._addUpperBoundMIRCut(cst);
        // }
    
    
        // // nRows = tableau.height;
        // for (cst = 0; cst < nRows; cst += 1) {
        //    this._addLowerBoundMIRCut(cst);
        // }
        
    };
    
    },{"../expressions.js":19,"./Tableau.js":8}],13:[function(require,module,exports){
    /*global require*/
    /*global console*/
    var Tableau = require("./Tableau.js");
    
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    Tableau.prototype._putInBase = function (varIndex) {
        // Is varIndex in the base?
        var r = this.rowByVarIndex[varIndex];
        if (r === -1) {
            // Outside the base
            // pivoting to take it out
            var c = this.colByVarIndex[varIndex];
    
            // Selecting pivot row
            // (Any row with coefficient different from 0)
            for (var r1 = 1; r1 < this.height; r1 += 1) {
                var coefficient = this.matrix[r1][c];
                if (coefficient < -this.precision || this.precision < coefficient) {
                    r = r1;
                    break;
                }
            }
    
            this.pivot(r, c);
        }
    
        return r;
    };
    
    Tableau.prototype._takeOutOfBase = function (varIndex) {
        // Is varIndex in the base?
        var c = this.colByVarIndex[varIndex];
        if (c === -1) {
            // Inside the base
            // pivoting to take it out
            var r = this.rowByVarIndex[varIndex];
    
            // Selecting pivot column
            // (Any column with coefficient different from 0)
            var pivotRow = this.matrix[r];
            for (var c1 = 1; c1 < this.height; c1 += 1) {
                var coefficient = pivotRow[c1];
                if (coefficient < -this.precision || this.precision < coefficient) {
                    c = c1;
                    break;
                }
            }
    
            this.pivot(r, c);
        }
    
        return c;
    };
    
    Tableau.prototype.updateVariableValues = function () {
        var nVars = this.variables.length;
        var roundingCoeff = Math.round(1 / this.precision);
        for (var v = 0; v < nVars; v += 1) {
            var variable = this.variables[v];
            var varIndex = variable.index;
    
            var r = this.rowByVarIndex[varIndex];
            if (r === -1) {
                // Variable is non basic
                variable.value = 0;
            } else {
                // Variable is basic
                var varValue = this.matrix[r][this.rhsColumn];
                variable.value = Math.round((varValue + Number.EPSILON) * roundingCoeff) / roundingCoeff;
            }
        }
    };
    
    Tableau.prototype.updateRightHandSide = function (constraint, difference) {
        // Updates RHS of given constraint
        var lastRow = this.height - 1;
        var constraintRow = this.rowByVarIndex[constraint.index];
        if (constraintRow === -1) {
            // Slack is not in base
            var slackColumn = this.colByVarIndex[constraint.index];
    
            // Upading all the RHS values
            for (var r = 0; r <= lastRow; r += 1) {
                var row = this.matrix[r];
                row[this.rhsColumn] -= difference * row[slackColumn];
            }
    
            var nOptionalObjectives = this.optionalObjectives.length;
            if (nOptionalObjectives > 0) {
                for (var o = 0; o < nOptionalObjectives; o += 1) {
                    var reducedCosts = this.optionalObjectives[o].reducedCosts;
                    reducedCosts[this.rhsColumn] -= difference * reducedCosts[slackColumn];
                }
            }
        } else {
            // Slack variable of constraint is in base
            // Updating RHS with the difference between the old and the new one
            this.matrix[constraintRow][this.rhsColumn] -= difference;
        }
    };
    
    Tableau.prototype.updateConstraintCoefficient = function (constraint, variable, difference) {
        // Updates variable coefficient within a constraint
        if (constraint.index === variable.index) {
            throw new Error("[Tableau.updateConstraintCoefficient] constraint index should not be equal to variable index !");
        }
    
        var r = this._putInBase(constraint.index);
    
        var colVar = this.colByVarIndex[variable.index];
        if (colVar === -1) {
            var rowVar = this.rowByVarIndex[variable.index];
            for (var c = 0; c < this.width; c += 1){
                this.matrix[r][c] += difference * this.matrix[rowVar][c];
            }
        } else {
            this.matrix[r][colVar] -= difference;
        }
    };
    
    Tableau.prototype.updateCost = function (variable, difference) {
        // Updates variable coefficient within the objective function
        var varIndex = variable.index;
        var lastColumn = this.width - 1;
        var varColumn = this.colByVarIndex[varIndex];
        if (varColumn === -1) {
            // Variable is in base
            var variableRow = this.matrix[this.rowByVarIndex[varIndex]];
    
            var c;
            if (variable.priority === 0) {
                var costRow = this.matrix[0];
    
                // Upading all the reduced costs
                for (c = 0; c <= lastColumn; c += 1) {
                    costRow[c] += difference * variableRow[c];
                }
            } else {
                var reducedCosts = this.objectivesByPriority[variable.priority].reducedCosts;
                for (c = 0; c <= lastColumn; c += 1) {
                    reducedCosts[c] += difference * variableRow[c];
                }
            }
        } else {
            // Variable is not in the base
            // Updating coefficient with difference
            this.matrix[0][varColumn] -= difference;
        }
    };
    
    Tableau.prototype.addConstraint = function (constraint) {
        // Adds a constraint to the tableau
        var sign = constraint.isUpperBound ? 1 : -1;
        var lastRow = this.height;
    
        var constraintRow = this.matrix[lastRow];
        if (constraintRow === undefined) {
            constraintRow = this.matrix[0].slice();
            this.matrix[lastRow] = constraintRow;
        }
    
        // Setting all row cells to 0
        var lastColumn = this.width - 1;
        for (var c = 0; c <= lastColumn; c += 1) {
            constraintRow[c] = 0;
        }
    
        // Initializing RHS
        constraintRow[this.rhsColumn] = sign * constraint.rhs;
    
        var terms = constraint.terms;
        var nTerms = terms.length;
        for (var t = 0; t < nTerms; t += 1) {
            var term = terms[t];
            var coefficient = term.coefficient;
            var varIndex = term.variable.index;
    
            var varRowIndex = this.rowByVarIndex[varIndex];
            if (varRowIndex === -1) {
                // Variable is non basic
                constraintRow[this.colByVarIndex[varIndex]] += sign * coefficient;
            } else {
                // Variable is basic
                var varRow = this.matrix[varRowIndex];
                var varValue = varRow[this.rhsColumn];
                for (c = 0; c <= lastColumn; c += 1) {
                    constraintRow[c] -= sign * coefficient * varRow[c];
                }
            }
        }
        // Creating slack variable
        var slackIndex = constraint.index;
        this.varIndexByRow[lastRow] = slackIndex;
        this.rowByVarIndex[slackIndex] = lastRow;
        this.colByVarIndex[slackIndex] = -1;
    
        this.height += 1;
    };
    
    Tableau.prototype.removeConstraint = function (constraint) {
        var slackIndex = constraint.index;
        var lastRow = this.height - 1;
    
        // Putting the constraint's slack in the base
        var r = this._putInBase(slackIndex);
    
        // Removing constraint
        // by putting the corresponding row at the bottom of the matrix
        // and virtually reducing the height of the matrix by 1
        var tmpRow = this.matrix[lastRow];
        this.matrix[lastRow] = this.matrix[r];
        this.matrix[r] = tmpRow;
    
        // Removing associated slack variable from basic variables
        this.varIndexByRow[r] = this.varIndexByRow[lastRow];
        this.varIndexByRow[lastRow] = -1;
        this.rowByVarIndex[slackIndex] = -1;
    
        // Putting associated slack variable index in index manager
        this.availableIndexes[this.availableIndexes.length] = slackIndex;
    
        constraint.slack.index = -1;
    
        this.height -= 1;
    };
    
    Tableau.prototype.addVariable = function (variable) {
        // Adds a variable to the tableau
        // var sign = constraint.isUpperBound ? 1 : -1;
    
        var lastRow = this.height - 1;
        var lastColumn = this.width;
        var cost = this.model.isMinimization === true ? -variable.cost : variable.cost;
        var priority = variable.priority;
    
        // Setting reduced costs
        var nOptionalObjectives = this.optionalObjectives.length;
        if (nOptionalObjectives > 0) {
            for (var o = 0; o < nOptionalObjectives; o += 1) {
                this.optionalObjectives[o].reducedCosts[lastColumn] = 0;
            }
        }
    
        if (priority === 0) {
            this.matrix[0][lastColumn] = cost;
        } else {
            this.setOptionalObjective(priority, lastColumn, cost);
            this.matrix[0][lastColumn] = 0;
        }
    
        // Setting all other column cells to 0
        for (var r = 1; r <= lastRow; r += 1) {
            this.matrix[r][lastColumn] = 0;
        }
    
        // Adding variable to trackers
        var varIndex = variable.index;
        this.varIndexByCol[lastColumn] = varIndex;
    
        this.rowByVarIndex[varIndex] = -1;
        this.colByVarIndex[varIndex] = lastColumn;
    
        this.width += 1;
    };
    
    
    Tableau.prototype.removeVariable = function (variable) {
        var varIndex = variable.index;
    
        // Putting the variable out of the base
        var c = this._takeOutOfBase(varIndex);
        var lastColumn = this.width - 1;
        if (c !== lastColumn) {
            var lastRow = this.height - 1;
            for (var r = 0; r <= lastRow; r += 1) {
                var row = this.matrix[r];
                row[c] = row[lastColumn];
            }
    
            var nOptionalObjectives = this.optionalObjectives.length;
            if (nOptionalObjectives > 0) {
                for (var o = 0; o < nOptionalObjectives; o += 1) {
                    var reducedCosts = this.optionalObjectives[o].reducedCosts;
                    reducedCosts[c] = reducedCosts[lastColumn];
                }
            }
    
            var switchVarIndex = this.varIndexByCol[lastColumn];
            this.varIndexByCol[c] = switchVarIndex;
            this.colByVarIndex[switchVarIndex] = c;
        }
    
        // Removing variable from non basic variables
        this.varIndexByCol[lastColumn] = -1;
        this.colByVarIndex[varIndex] = -1;
    
        // Adding index into index manager
        this.availableIndexes[this.availableIndexes.length] = varIndex;
    
        variable.index = -1;
    
        this.width -= 1;
    };
    
    },{"./Tableau.js":8}],14:[function(require,module,exports){
    /*global require*/
    /*global module*/
    require("./simplex.js");
    require("./cuttingStrategies.js");
    require("./dynamicModification.js");
    require("./log.js");
    require("./backup.js");
    require("./branchingStrategies.js");
    require("./integerProperties.js");
    
    module.exports = require("./Tableau.js");
    
    },{"./Tableau.js":8,"./backup.js":9,"./branchingStrategies.js":11,"./cuttingStrategies.js":12,"./dynamicModification.js":13,"./integerProperties.js":15,"./log.js":16,"./simplex.js":17}],15:[function(require,module,exports){
    /*global require*/
    var Tableau = require("./Tableau.js");
    
    Tableau.prototype.countIntegerValues = function(){
        var count = 0;
        for (var r = 1; r < this.height; r += 1) {
            if (this.variablesPerIndex[this.varIndexByRow[r]].isInteger) {
                var decimalPart = this.matrix[r][this.rhsColumn];
                decimalPart = decimalPart - Math.floor(decimalPart);
                if (decimalPart < this.precision && -decimalPart < this.precision) {
                    count += 1;
                }
            }
        }
    
        return count;
    };
    
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    Tableau.prototype.isIntegral = function () {
        var integerVariables = this.model.integerVariables;
        var nIntegerVars = integerVariables.length;
        for (var v = 0; v < nIntegerVars; v++) {
            var varRow = this.rowByVarIndex[integerVariables[v].index];
            if (varRow === -1) {
                continue;
            }
    
            var varValue = this.matrix[varRow][this.rhsColumn];
            if (Math.abs(varValue - Math.round(varValue)) > this.precision) {
                return false;
            }
        }
        return true;
    };
    
    // Multiply all the fractional parts of variables supposed to be integer
    Tableau.prototype.computeFractionalVolume = function(ignoreIntegerValues) {
        var volume = -1;
        // var integerVariables = this.model.integerVariables;
        // var nIntegerVars = integerVariables.length;
        // for (var v = 0; v < nIntegerVars; v++) {
        //     var r = this.rowByVarIndex[integerVariables[v].index];
        //     if (r === -1) {
        //         continue;
        //     }
        //     var rhs = this.matrix[r][this.rhsColumn];
        //     rhs = Math.abs(rhs);
        //     var decimalPart = Math.min(rhs - Math.floor(rhs), Math.floor(rhs + 1));
        //     if (decimalPart < this.precision) {
        //         if (!ignoreIntegerValues) {
        //             return 0;
        //         }
        //     } else {
        //         if (volume === -1) {
        //             volume = rhs;
        //         } else {
        //             volume *= rhs;
        //         }
        //     }
        // }
    
        for (var r = 1; r < this.height; r += 1) {
            if (this.variablesPerIndex[this.varIndexByRow[r]].isInteger) {
                var rhs = this.matrix[r][this.rhsColumn];
                rhs = Math.abs(rhs);
                var decimalPart = Math.min(rhs - Math.floor(rhs), Math.floor(rhs + 1));
                if (decimalPart < this.precision) {
                    if (!ignoreIntegerValues) {
                        return 0;
                    }
                } else {
                    if (volume === -1) {
                        volume = rhs;
                    } else {
                        volume *= rhs;
                    }
                }
            }
        }
    
        if (volume === -1){
            return 0;
        }
        return volume;
    };
    
    },{"./Tableau.js":8}],16:[function(require,module,exports){
    /*global require*/
    /*global console*/
    var Tableau = require("./Tableau.js");
    
    //-------------------------------------------------------------------
    // Description: Display a tableau matrix
    //              and additional tableau information
    //
    //-------------------------------------------------------------------
    Tableau.prototype.log = function (message, force) {
        if (false && !force) {
            return;
        }
    
        console.log("****", message, "****");
        console.log("Nb Variables", this.width - 1);
        console.log("Nb Constraints", this.height - 1);
        // console.log("Variable Ids", this.variablesPerIndex);
        console.log("Basic Indexes", this.varIndexByRow);
        console.log("Non Basic Indexes", this.varIndexByCol);
        console.log("Rows", this.rowByVarIndex);
        console.log("Cols", this.colByVarIndex);
    
        var digitPrecision = 5;
    
        // Variable declaration
        var varNameRowString = "",
            spacePerColumn = [" "],
            j,
            c,
            s,
            r,
            variable,
            varIndex,
            varName,
            varNameLength,
            nSpaces,
            valueSpace,
            nameSpace;
    
        var row,
            rowString;
    
        for (c = 1; c < this.width; c += 1) {
            varIndex = this.varIndexByCol[c];
            variable = this.variablesPerIndex[varIndex];
            if (variable === undefined) {
                varName = "c" + varIndex;
            } else {
                varName = variable.id;
            }
    
            varNameLength = varName.length;
            nSpaces = Math.abs(varNameLength - 5);
            valueSpace = " ";
            nameSpace = "\t";
    
            ///////////
            /*valueSpace = " ";
            nameSpace = " ";
    
            for (s = 0; s < nSpaces; s += 1) {
                if (varNameLength > 5) {
                    valueSpace += " ";
                } else {
                    nameSpace += " ";
                }
            }*/
    
            ///////////
            if (varNameLength > 5) {
                valueSpace += " ";
            } else {
                nameSpace += "\t";
            }
    
            spacePerColumn[c] = valueSpace;
    
            varNameRowString += nameSpace + varName;
        }
        console.log(varNameRowString);
    
        var signSpace;
    
        // Displaying reduced costs
        var firstRow = this.matrix[this.costRowIndex];
        var firstRowString = "\t";
    
        ///////////
        /*for (j = 1; j < this.width; j += 1) {
            signSpace = firstRow[j] < 0 ? "" : " ";
            firstRowString += signSpace;
            firstRowString += spacePerColumn[j];
            firstRowString += firstRow[j].toFixed(2);
        }
        signSpace = firstRow[0] < 0 ? "" : " ";
        firstRowString += signSpace + spacePerColumn[0] +
            firstRow[0].toFixed(2);
        console.log(firstRowString + " Z");*/
    
        ///////////
        for (j = 1; j < this.width; j += 1) {
            signSpace = "\t";
            firstRowString += signSpace;
            firstRowString += spacePerColumn[j];
            firstRowString += firstRow[j].toFixed(digitPrecision);
        }
        signSpace = "\t";
        firstRowString += signSpace + spacePerColumn[0] +
            firstRow[0].toFixed(digitPrecision);
        console.log(firstRowString + "\tZ");
    
    
        // Then the basic variable rowByVarIndex
        for (r = 1; r < this.height; r += 1) {
            row = this.matrix[r];
            rowString = "\t";
    
            ///////////
            /*for (c = 1; c < this.width; c += 1) {
                signSpace = row[c] < 0 ? "" : " ";
                rowString += signSpace + spacePerColumn[c] + row[c].toFixed(2);
            }
            signSpace = row[0] < 0 ? "" : " ";
            rowString += signSpace + spacePerColumn[0] + row[0].toFixed(2);*/
    
            ///////////
            for (c = 1; c < this.width; c += 1) {
                signSpace = "\t";
                rowString += signSpace + spacePerColumn[c] + row[c].toFixed(digitPrecision);
            }
            signSpace = "\t";
            rowString += signSpace + spacePerColumn[0] + row[0].toFixed(digitPrecision);
    
    
            varIndex = this.varIndexByRow[r];
            variable = this.variablesPerIndex[varIndex];
            if (variable === undefined) {
                varName = "c" + varIndex;
            } else {
                varName = variable.id;
            }
            console.log(rowString + "\t" + varName);
        }
        console.log("");
    
        // Then reduced costs for optional objectives
        var nOptionalObjectives = this.optionalObjectives.length;
        if (nOptionalObjectives > 0) {
            console.log("    Optional objectives:");
            for (var o = 0; o < nOptionalObjectives; o += 1) {
                var reducedCosts = this.optionalObjectives[o].reducedCosts;
                var reducedCostsString = "";
                for (j = 1; j < this.width; j += 1) {
                    signSpace = reducedCosts[j] < 0 ? "" : " ";
                    reducedCostsString += signSpace;
                    reducedCostsString += spacePerColumn[j];
                    reducedCostsString += reducedCosts[j].toFixed(digitPrecision);
                }
                signSpace = reducedCosts[0] < 0 ? "" : " ";
                reducedCostsString += signSpace + spacePerColumn[0] +
                    reducedCosts[0].toFixed(digitPrecision);
                console.log(reducedCostsString + " z" + o);
            }
        }
        console.log("Feasible?", this.feasible);
        console.log("evaluation", this.evaluation);
    
        return this;
    };
    
    },{"./Tableau.js":8}],17:[function(require,module,exports){
    /*global describe*/
    /*global require*/
    /*global module*/
    /*global it*/
    /*global console*/
    /*global process*/
    
    var Tableau = require("./Tableau.js");
    
    //-------------------------------------------------------------------
    // Function: solve
    // Detail: Main function, linear programming solver
    //-------------------------------------------------------------------
    Tableau.prototype.simplex = function () {
        // Bounded until proven otherwise
        this.bounded = true;
    
        // Execute Phase 1 to obtain a Basic Feasible Solution (BFS)
        this.phase1();
    
        // Execute Phase 2
        if (this.feasible === true) {
            // Running simplex on Initial Basic Feasible Solution (BFS)
            // N.B current solution is feasible
            this.phase2();
        }
    
        return this;
    };
    
    //-------------------------------------------------------------------
    // Description: Convert a non standard form tableau
    //              to a standard form tableau by eliminating
    //              all negative values in the Right Hand Side (RHS)
    //              This results in a Basic Feasible Solution (BFS)
    //
    //-------------------------------------------------------------------
    Tableau.prototype.phase1 = function () {
        var debugCheckForCycles = this.model.checkForCycles;
        var varIndexesCycle = [];
    
        var matrix = this.matrix;
        var rhsColumn = this.rhsColumn;
        var lastColumn = this.width - 1;
        var lastRow = this.height - 1;
    
        var unrestricted;
        var iterations = 0;
    
        while (true) {
            // ******************************************
            // ** PHASE 1 - STEP  1 : FIND PIVOT ROW **
            //
            // Selecting leaving variable (feasibility condition):
            // Basic variable with most negative value
            //
            // ******************************************
            var leavingRowIndex = 0;
            var rhsValue = -this.precision;
            for (var r = 1; r <= lastRow; r++) {
                unrestricted = this.unrestrictedVars[this.varIndexByRow[r]] === true;
                
                //
                // *Don't think this does anything...
                //
                //if (unrestricted) {
                //    continue;
                //}
    
                var value = matrix[r][rhsColumn];
                if (value < rhsValue) {
                    rhsValue = value;
                    leavingRowIndex = r;
                }
            }
    
            // If nothing is strictly smaller than 0; we're done with phase 1.
            if (leavingRowIndex === 0) {
                // Feasible, champagne!
                this.feasible = true;
                return iterations;
            }
    
    
            // ******************************************
            // ** PHASE 1 - STEP  2 : FIND PIVOT COLUMN **
            //
            //
            // ******************************************
            // Selecting entering variable
            var enteringColumn = 0;
            var maxQuotient = -Infinity;
            var costRow = matrix[0];
            var leavingRow = matrix[leavingRowIndex];
            for (var c = 1; c <= lastColumn; c++) {
                var coefficient = leavingRow[c];
                //
                // *Don't think this does anything...
                //
                //if (-this.precision < coefficient && coefficient < this.precision) {
                //    continue;
                //}
                //
    
                unrestricted = this.unrestrictedVars[this.varIndexByCol[c]] === true;
                if (unrestricted || coefficient < -this.precision) {
                    var quotient = -costRow[c] / coefficient;
                    if (maxQuotient < quotient) {
                        maxQuotient = quotient;
                        enteringColumn = c;
                    }
                }
            }
    
            if (enteringColumn === 0) {
                // Not feasible
                this.feasible = false;
                return iterations;
            }
    
            if(debugCheckForCycles){
                varIndexesCycle.push([this.varIndexByRow[leavingRowIndex], this.varIndexByCol[enteringColumn]]);
    
                var cycleData = this.checkForCycles(varIndexesCycle);
                if(cycleData.length > 0){
    
                    this.model.messages.push("Cycle in phase 1");
                    this.model.messages.push("Start :"+ cycleData[0]);
                    this.model.messages.push("Length :"+ cycleData[1]);
    
                    this.feasible = false;
                    return iterations;
                    
                }
            }
    
            this.pivot(leavingRowIndex, enteringColumn);
            iterations += 1;
        }
    };
    
    //-------------------------------------------------------------------
    // Description: Apply simplex to obtain optimal solution
    //              used as phase2 of the simplex
    //
    //-------------------------------------------------------------------
    Tableau.prototype.phase2 = function () {
        var debugCheckForCycles = this.model.checkForCycles;
        var varIndexesCycle = [];
    
        var matrix = this.matrix;
        var rhsColumn = this.rhsColumn;
        var lastColumn = this.width - 1;
        var lastRow = this.height - 1;
    
        var precision = this.precision;
        var nOptionalObjectives = this.optionalObjectives.length;
        var optionalCostsColumns = null;
    
        var iterations = 0;
        var reducedCost, unrestricted;
    
        while (true) {
            var costRow = matrix[this.costRowIndex];
    
            // Selecting entering variable (optimality condition)
            if (nOptionalObjectives > 0) {
                optionalCostsColumns = [];
            }
    
            var enteringColumn = 0;
            var enteringValue = precision;
            var isReducedCostNegative = false;
            for (var c = 1; c <= lastColumn; c++) {
                reducedCost = costRow[c];
                unrestricted = this.unrestrictedVars[this.varIndexByCol[c]] === true;
    
                if (nOptionalObjectives > 0 && -precision < reducedCost && reducedCost < precision) {
                    optionalCostsColumns.push(c);
                    continue;
                }
    
                if (unrestricted && reducedCost < 0) {
                    if (-reducedCost > enteringValue) {
                        enteringValue = -reducedCost;
                        enteringColumn = c;
                        isReducedCostNegative = true;
                    }
                    continue;
                }
    
                if (reducedCost > enteringValue) {
                    enteringValue = reducedCost;
                    enteringColumn = c;
                    isReducedCostNegative = false;
                }
            }
    
            if (nOptionalObjectives > 0) {
                // There exist optional improvable objectives
                var o = 0;
                while (enteringColumn === 0 && optionalCostsColumns.length > 0 && o < nOptionalObjectives) {
                    var optionalCostsColumns2 = [];
                    var reducedCosts = this.optionalObjectives[o].reducedCosts;
    
                    enteringValue = precision;
    
                    for (var i = 0; i < optionalCostsColumns.length; i++) {
                        c = optionalCostsColumns[i];
    
                        reducedCost = reducedCosts[c];
                        unrestricted = this.unrestrictedVars[this.varIndexByCol[c]] === true;
    
                        if (-precision < reducedCost && reducedCost < precision) {
                            optionalCostsColumns2.push(c);
                            continue;
                        }
    
                        if (unrestricted && reducedCost < 0) {
                            if (-reducedCost > enteringValue) {
                                enteringValue = -reducedCost;
                                enteringColumn = c;
                                isReducedCostNegative = true;
                            }
                            continue;
                        }
    
                        if (reducedCost > enteringValue) {
                            enteringValue = reducedCost;
                            enteringColumn = c;
                            isReducedCostNegative = false;
                        }
                    }
                    optionalCostsColumns = optionalCostsColumns2;
                    o += 1;
                }
            }
    
    
            // If no entering column could be found we're done with phase 2.
            if (enteringColumn === 0) {
                this.setEvaluation();
                this.simplexIters += 1;
                return iterations;
            }
    
            // Selecting leaving variable
            var leavingRow = 0;
            var minQuotient = Infinity;
    
            var varIndexByRow = this.varIndexByRow;
    
            for (var r = 1; r <= lastRow; r++) {
                var row = matrix[r];
                var rhsValue = row[rhsColumn];
                var colValue = row[enteringColumn];
    
                if (-precision < colValue && colValue < precision) {
                    continue;
                }
    
                if (colValue > 0 && precision > rhsValue && rhsValue > -precision) {
                    minQuotient = 0;
                    leavingRow = r;
                    break;
                }
    
                var quotient = isReducedCostNegative ? -rhsValue / colValue : rhsValue / colValue;
                if (quotient > precision && minQuotient > quotient) {
                    minQuotient = quotient;
                    leavingRow = r;
                }
            }
    
            if (minQuotient === Infinity) {
                // optimal value is -Infinity
                this.evaluation = -Infinity;
                this.bounded = false;
                this.unboundedVarIndex = this.varIndexByCol[enteringColumn];
                return iterations;
            }
    
            if(debugCheckForCycles){
                varIndexesCycle.push([this.varIndexByRow[leavingRow], this.varIndexByCol[enteringColumn]]);
    
                var cycleData = this.checkForCycles(varIndexesCycle);
                if(cycleData.length > 0){
    
                    this.model.messages.push("Cycle in phase 2");
                    this.model.messages.push("Start :"+ cycleData[0]);
                    this.model.messages.push("Length :"+ cycleData[1]);
    
                    this.feasible = false;
                    return iterations;
                }
            }
    
            this.pivot(leavingRow, enteringColumn, true);
            iterations += 1;
        }
    };
    
    // Array holding the column indexes for which the value is not null
    // on the pivot row
    // Shared by all tableaux for smaller overhead and lower memory usage
    var nonZeroColumns = [];
    
    
    //-------------------------------------------------------------------
    // Description: Execute pivot operations over a 2d array,
    //          on a given row, and column
    //
    //-------------------------------------------------------------------
    Tableau.prototype.pivot = function (pivotRowIndex, pivotColumnIndex) {
        var matrix = this.matrix;
    
        var quotient = matrix[pivotRowIndex][pivotColumnIndex];
    
        var lastRow = this.height - 1;
        var lastColumn = this.width - 1;
    
        var leavingBasicIndex = this.varIndexByRow[pivotRowIndex];
        var enteringBasicIndex = this.varIndexByCol[pivotColumnIndex];
    
        this.varIndexByRow[pivotRowIndex] = enteringBasicIndex;
        this.varIndexByCol[pivotColumnIndex] = leavingBasicIndex;
    
        this.rowByVarIndex[enteringBasicIndex] = pivotRowIndex;
        this.rowByVarIndex[leavingBasicIndex] = -1;
    
        this.colByVarIndex[enteringBasicIndex] = -1;
        this.colByVarIndex[leavingBasicIndex] = pivotColumnIndex;
    
        // Divide everything in the target row by the element @
        // the target column
        var pivotRow = matrix[pivotRowIndex];
        var nNonZeroColumns = 0;
        for (var c = 0; c <= lastColumn; c++) {
            if (!(pivotRow[c] >= -1e-16 && pivotRow[c] <= 1e-16)) {
                pivotRow[c] /= quotient;
                nonZeroColumns[nNonZeroColumns] = c;
                nNonZeroColumns += 1;
            } else {
                pivotRow[c] = 0;
            }
        }
        pivotRow[pivotColumnIndex] = 1 / quotient;
    
        // for every row EXCEPT the pivot row,
        // set the value in the pivot column = 0 by
        // multiplying the value of all elements in the objective
        // row by ... yuck... just look below; better explanation later
        var coefficient, i, v0;
        var precision = this.precision;
        
        // //////////////////////////////////////
        //
        // This is step 2 of the pivot function.
        // It is, by far, the most expensive piece of
        // this whole process where the code can be optimized (faster code)
        // without changing the whole algorithm (fewer cycles)
        //
        // 1.) For every row but the pivot row
        // 2.) Update each column to 
        //    a.) itself
        //        less
        //    b.) active-row's pivot column
        //        times
        //    c.) whatever-the-hell this is: nonZeroColumns[i]
        // 
        // //////////////////////////////////////
        // console.time("step-2");
        for (var r = 0; r <= lastRow; r++) {
            if (r !== pivotRowIndex) {
                //if(1 === 1){
                if(!(matrix[r][pivotColumnIndex] >= -1e-16 && matrix[r][pivotColumnIndex] <= 1e-16)){
                //if((matrix[r][pivotColumnIndex] !== 0)){
                    // Set reference to the row we're working on
                    //
                    var row = matrix[r];
    
                    // Catch the coefficient that we're going to end up dividing everything by
                    coefficient = row[pivotColumnIndex];
                    
                    // No point Burning Cycles if
                    // Zero to the thing
                    if (!(coefficient >= -1e-16 && coefficient <= 1e-16)) {
                        for (i = 0; i < nNonZeroColumns; i++) {
                            c = nonZeroColumns[i];
                            // No point in doing math if you're just adding
                            // Zero to the thing
                            v0 = pivotRow[c];
                            if (!(v0 >= -1e-16 && v0 <= 1e-16)) {
                                row[c] = row[c] - coefficient * v0;
                            } else {
                                if(v0 !== 0){
                                    pivotRow[c] = 0;
                                }
                            }
                        }
    
                        row[pivotColumnIndex] = -coefficient / quotient;
                    } else {
                        if(coefficient !== 0){
                            row[pivotColumnIndex] = 0;
                        }
                    }
                }
            }
        }
        // console.timeEnd("step-2");
    
        var nOptionalObjectives = this.optionalObjectives.length;
        if (nOptionalObjectives > 0) {
            for (var o = 0; o < nOptionalObjectives; o += 1) {
                var reducedCosts = this.optionalObjectives[o].reducedCosts;
                coefficient = reducedCosts[pivotColumnIndex];
                if (coefficient !== 0) {
                    for (i = 0; i < nNonZeroColumns; i++) {
                        c = nonZeroColumns[i];
                        v0 = pivotRow[c];
                        if (v0 !== 0) {
                            reducedCosts[c] = reducedCosts[c] - coefficient * v0;
                        }
                    }
    
                    reducedCosts[pivotColumnIndex] = -coefficient / quotient;
                }
            }
        }
    };
    
    
    
    Tableau.prototype.checkForCycles = function (varIndexes) {
        for (var e1 = 0; e1 < varIndexes.length - 1; e1++) {
            for (var e2 = e1 + 1; e2 < varIndexes.length; e2++) {
                var elt1 = varIndexes[e1];
                var elt2 = varIndexes[e2];
                if (elt1[0] === elt2[0] && elt1[1] === elt2[1]) {
                    if (e2 - e1 > varIndexes.length - e2) {
                        break;
                    }
                    var cycleFound = true;
                    for (var i = 1; i < e2 - e1; i++) {
                        var tmp1 = varIndexes[e1+i];
                        var tmp2 = varIndexes[e2+i];
                        if(tmp1[0] !== tmp2[0] || tmp1[1] !== tmp2[1]) {
                            cycleFound = false;
                            break;
                        }
                    }
                    if (cycleFound) {
                        return [e1, e2 - e1];
                    }
                }
            }
        }
        return [];
    };
    
    },{"./Tableau.js":8}],18:[function(require,module,exports){
    /*global describe*/
    /*global require*/
    /*global module*/
    /*global it*/
    /*global console*/
    /*global process*/
    /*global exports*/
    
    
    // All functions in this module that
    // get exported to main ***MUST***
    // return a functional LPSolve JSON style
    // model or throw an error
    
    exports.CleanObjectiveAttributes = function(model){
      // Test to see if the objective attribute
      // is also used by one of the constraints
      //
      // If so...create a new attribute on each
      // variable
        var fakeAttr,
            x, z;
      
        if(typeof model.optimize === "string"){
            if(model.constraints[model.optimize]){
                // Create the new attribute
                fakeAttr = Math.random();
    
                // Go over each variable and check
                for(x in model.variables){
                    // Is it there?
                    if(model.variables[x][model.optimize]){
                        model.variables[x][fakeAttr] = model.variables[x][model.optimize];
                    }
                }
    
            // Now that we've cleaned up the variables
            // we need to clean up the constraints
                model.constraints[fakeAttr] = model.constraints[model.optimize];
                delete model.constraints[model.optimize];
                return model;
            } else {    
                return model;
            }  
        } else {
            // We're assuming its an object?
            for(z in model.optimize){
                if(model.constraints[z]){
                // Make sure that the constraint
                // being optimized isn't constrained
                // by an equity collar
                    if(model.constraints[z] === "equal"){
                        // Its constrained by an equal sign;
                        // delete that objective and move on
                        delete model.optimize[z];
                    
                    } else {
                        // Create the new attribute
                        fakeAttr = Math.random();
    
                        // Go over each variable and check
                        for(x in model.variables){
                            // Is it there?
                            if(model.variables[x][z]){
                                model.variables[x][fakeAttr] = model.variables[x][z];
                            }
                        }
                    // Now that we've cleaned up the variables
                    // we need to clean up the constraints
                        model.constraints[fakeAttr] = model.constraints[z];
                        delete model.constraints[z];            
                    }
                }    
            }
            return model;
        }
    };
    
    },{}],19:[function(require,module,exports){
    /*global describe*/
    /*global require*/
    /*global module*/
    /*global it*/
    /*global console*/
    /*global process*/
    
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    function Variable(id, cost, index, priority) {
        this.id = id;
        this.cost = cost;
        this.index = index;
        this.value = 0;
        this.priority = priority;
    }
    
    function IntegerVariable(id, cost, index, priority) {
        Variable.call(this, id, cost, index, priority);
    }
    IntegerVariable.prototype.isInteger = true;
    
    function SlackVariable(id, index) {
        Variable.call(this, id, 0, index, 0);
    }
    SlackVariable.prototype.isSlack = true;
    
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    function Term(variable, coefficient) {
        this.variable = variable;
        this.coefficient = coefficient;
    }
    
    function createRelaxationVariable(model, weight, priority) {
        if (priority === 0 || priority === "required") {
            return null;
        }
    
        weight = weight || 1;
        priority = priority || 1;
    
        if (model.isMinimization === false) {
            weight = -weight;
        }
    
        return model.addVariable(weight, "r" + (model.relaxationIndex++), false, false, priority);
    }
    
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    function Constraint(rhs, isUpperBound, index, model) {
        this.slack = new SlackVariable("s" + index, index);
        this.index = index;
        this.model = model;
        this.rhs = rhs;
        this.isUpperBound = isUpperBound;
    
        this.terms = [];
        this.termsByVarIndex = {};
    
        // Error variable in case the constraint is relaxed
        this.relaxation = null;
    }
    
    Constraint.prototype.addTerm = function (coefficient, variable) {
        var varIndex = variable.index;
        var term = this.termsByVarIndex[varIndex];
        if (term === undefined) {
            // No term for given variable
            term = new Term(variable, coefficient);
            this.termsByVarIndex[varIndex] = term;
            this.terms.push(term);
            if (this.isUpperBound === true) {
                coefficient = -coefficient;
            }
            this.model.updateConstraintCoefficient(this, variable, coefficient);
        } else {
            // Term for given variable already exists
            // updating its coefficient
            var newCoefficient = term.coefficient + coefficient;
            this.setVariableCoefficient(newCoefficient, variable);
        }
    
        return this;
    };
    
    Constraint.prototype.removeTerm = function (term) {
        // TODO
        return this;
    };
    
    Constraint.prototype.setRightHandSide = function (newRhs) {
        if (newRhs !== this.rhs) {
            var difference = newRhs - this.rhs;
            if (this.isUpperBound === true) {
                difference = -difference;
            }
    
            this.rhs = newRhs;
            this.model.updateRightHandSide(this, difference);
        }
    
        return this;
    };
    
    Constraint.prototype.setVariableCoefficient = function (newCoefficient, variable) {
        var varIndex = variable.index;
        if (varIndex === -1) {
            console.warn("[Constraint.setVariableCoefficient] Trying to change coefficient of inexistant variable.");
            return;
        }
    
        var term = this.termsByVarIndex[varIndex];
        if (term === undefined) {
            // No term for given variable
            this.addTerm(newCoefficient, variable);
        } else {
            // Term for given variable already exists
            // updating its coefficient if changed
            if (newCoefficient !== term.coefficient) {
                var difference = newCoefficient - term.coefficient;
                if (this.isUpperBound === true) {
                    difference = -difference;
                }
    
                term.coefficient = newCoefficient;
                this.model.updateConstraintCoefficient(this, variable, difference);
            }
        }
    
        return this;
    };
    
    Constraint.prototype.relax = function (weight, priority) {
        this.relaxation = createRelaxationVariable(this.model, weight, priority);
        this._relax(this.relaxation);
    };
    
    Constraint.prototype._relax = function (relaxationVariable) {
        if (relaxationVariable === null) {
            // Relaxation variable not created, priority was probably "required"
            return;
        }
    
        if (this.isUpperBound) {
            this.setVariableCoefficient(-1, relaxationVariable);
        } else {
            this.setVariableCoefficient(1, relaxationVariable);
        }
    };
    
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    function Equality(constraintUpper, constraintLower) {
        this.upperBound = constraintUpper;
        this.lowerBound = constraintLower;
        this.model = constraintUpper.model;
        this.rhs = constraintUpper.rhs;
        this.relaxation = null;
    }
    
    Equality.prototype.isEquality = true;
    
    Equality.prototype.addTerm = function (coefficient, variable) {
        this.upperBound.addTerm(coefficient, variable);
        this.lowerBound.addTerm(coefficient, variable);
        return this;
    };
    
    Equality.prototype.removeTerm = function (term) {
        this.upperBound.removeTerm(term);
        this.lowerBound.removeTerm(term);
        return this;
    };
    
    Equality.prototype.setRightHandSide = function (rhs) {
        this.upperBound.setRightHandSide(rhs);
        this.lowerBound.setRightHandSide(rhs);
        this.rhs = rhs;
    };
    
    Equality.prototype.relax = function (weight, priority) {
        this.relaxation = createRelaxationVariable(this.model, weight, priority);
        this.upperBound.relaxation = this.relaxation;
        this.upperBound._relax(this.relaxation);
        this.lowerBound.relaxation = this.relaxation;
        this.lowerBound._relax(this.relaxation);
    };
    
    
    module.exports = {
        Constraint: Constraint,
        Variable: Variable,
        IntegerVariable: IntegerVariable,
        SlackVariable: SlackVariable,
        Equality: Equality,
        Term: Term
    };
    
    },{}],20:[function(require,module,exports){
    /*global describe*/
    /*global require*/
    /*global module*/
    /*global it*/
    /*global console*/
    /*global process*/
    /*global setTimeout*/
    /*global self*/
    
    
    //-------------------------------------------------------------------
    // SimplexJS
    // https://github.com/
    // An Object-Oriented Linear Programming Solver
    //
    // By Justin Wolcott (c)
    // Licensed under the MIT License.
    //-------------------------------------------------------------------
    
    var Tableau = require("./Tableau/index.js");
    var Model = require("./Model");
    var branchAndCut = require("./Tableau/branchAndCut");
    var expressions = require("./expressions.js");
    var validation = require("./Validation");
    var Constraint = expressions.Constraint;
    var Variable = expressions.Variable;
    var Numeral = expressions.Numeral;
    var Term = expressions.Term;
    var External = require("./External/main.js");
    
    // Place everything under the Solver Name Space
    var Solver = function () {
    
        "use strict";
    
        this.Model = Model;
        this.branchAndCut = branchAndCut;
        this.Constraint = Constraint;
        this.Variable = Variable;
        this.Numeral = Numeral;
        this.Term = Term;
        this.Tableau = Tableau;
        this.lastSolvedModel = null;
    
        this.External = External;
    
        /*************************************************************
         * Method: Solve
         * Scope: Public:
         * Agruments:
         *        model: The model we want solver to operate on
         *        precision: If we're solving a MILP, how tight
         *                   do we want to define an integer, given
         *                   that 20.000000000000001 is not an integer.
         *                   (defaults to 1e-9)
         *            full: *get better description*
         *        validate: if left blank, it will get ignored; otherwise
         *                  it will run the model through all validation
         *                  functions in the *Validate* module
         **************************************************************/
        this.Solve = function (model, precision, full, validate) {
            //
            // Run our validations on the model
            // if the model doesn't have a validate
            // attribute set to false
            //
            if(validate){
                for(var test in validation){
                    model = validation[test](model);
                }
            }
    
            // Make sure we at least have a model
            if (!model) {
                throw new Error("Solver requires a model to operate on");
            }
    
            //
            // If the objective function contains multiple objectives,
            // pass it to the multi-solver thing...
            //
            if(typeof model.optimize === "object"){
                if(Object.keys(model.optimize > 1)){
                    return require("./Polyopt")(this, model);
                }
            }
    
    // /////////////////////////////////////////////////////////////////////
    // *********************************************************************
    // START
    // Try our hand at handling external solvers...
    // START
    // *********************************************************************
    // /////////////////////////////////////////////////////////////////////
            if(model.external){
    
                var solvers = Object.keys(External);
                solvers = JSON.stringify(solvers);
                
                //
                // The model needs to have a "solver" attribute if nothing else
                // for us to pass data into
                //
                if(!model.external.solver){
                    throw new Error("The model you provided has an 'external' object that doesn't have a solver attribute. Use one of the following:" + solvers);
                }
                
                //
                // If the solver they request doesn't exist; provide them
                // with a list of possible options:
                //
                if(!External[model.external.solver]){
                    throw new Error("No support (yet) for " + model.external.solver + ". Please use one of these instead:" + solvers);
                }
                
                return External[model.external.solver].solve(model);
                
    
    // /////////////////////////////////////////////////////////////////////
    // *********************************************************************
    //  END
    // Try our hand at handling external solvers...
    //  END
    // *********************************************************************
    // /////////////////////////////////////////////////////////////////////
    
            } else {
    
                if (model instanceof Model === false) {
                    model = new Model(precision).loadJson(model);
                }
    
                var solution = model.solve();
                this.lastSolvedModel = model;
                solution.solutionSet = solution.generateSolutionSet();
    
                // If the user asks for a full breakdown
                // of the tableau (e.g. full === true)
                // this will return it
                if (full) {
                    return solution;
                } else {
                    // Otherwise; give the user the bare
                    // minimum of info necessary to carry on
    
                    var store = {};
    
                    // 1.) Add in feasibility to store;
                    store.feasible = solution.feasible;
    
                    // 2.) Add in the objective value
                    store.result = solution.evaluation;
    
                    store.bounded = solution.bounded;
                    
                    if(solution._tableau.__isIntegral){
                        store.isIntegral = true;
                    }
    
                    // 3.) Load all of the variable values
                    Object.keys(solution.solutionSet)
                        .forEach(function (d) {
                            //
                            // When returning data in standard format,
                            // Remove all 0's
                            //
                            if(solution.solutionSet[d] !== 0){
                                store[d] = solution.solutionSet[d];
                            }
                            
                        });
    
                    return store;
                }
    
            }
    
        };
    
        /*************************************************************
         * Method: ReformatLP
         * Scope: Public:
         * Agruments: model: The model we want solver to operate on
         * Purpose: Convert a friendly JSON model into a model for a
         *          real solving library...in this case
         *          lp_solver
         **************************************************************/
        this.ReformatLP = require("./External/lpsolve/Reformat.js");
    
    
         /*************************************************************
         * Method: MultiObjective
         * Scope: Public:
         * Agruments:
         *        model: The model we want solver to operate on
         *        detail: if false, or undefined; it will return the
         *                result of using the mid-point formula; otherwise
         *                it will return an object containing:
         *
         *                1. The results from the mid point formula
         *                2. The solution for each objective solved
         *                   in isolation (pareto)
         *                3. The min and max of each variable along
         *                   the frontier of the polytope (ranges)
         * Purpose: Solve a model with multiple objective functions.
         *          Since a potential infinite number of solutions exist
         *          this naively returns the mid-point between
         *
         * Note: The model has to be changed a little to work with this.
         *       Before an *opType* was required. No more. The objective
         *       attribute of the model is now an object instead of a
         *       string.
         *
         *  *EXAMPLE MODEL*
         *
         *   model = {
         *       optimize: {scotch: "max", soda: "max"},
         *       constraints: {fluid: {equal: 100}},
         *       variables: {
         *           scotch: {fluid: 1, scotch: 1},
         *           soda: {fluid: 1, soda: 1}
         *       }
         *   }
         *
         **************************************************************/
        this.MultiObjective = function(model){
            return require("./Polyopt")(this, model);
        };
    };
    
    // var define = define || undefined;
    // var window = window || undefined;
    
    // If the project is loading through require.js, use `define` and exit
    if (typeof define === "function") {
        define([], function () {
            return new Solver();
        });
    // If the project doesn't see define, but sees window, put solver on window
    } else if (typeof window === "object"){
        window.solver = new Solver();
    } else if (typeof self === "object"){
        self.solver = new Solver();
    }
    // Ensure that its available in node.js env
    module.exports = new Solver();
    
    },{"./External/lpsolve/Reformat.js":1,"./External/main.js":3,"./Model":4,"./Polyopt":5,"./Tableau/branchAndCut":10,"./Tableau/index.js":14,"./Validation":18,"./expressions.js":19}],21:[function(require,module,exports){
    "object"==typeof exports&&(module.exports=require("./main")),function s(r,n,a){function o(e,t){if(!n[e]){if(!r[e]){var i="function"==typeof require&&require;if(!t&&i)return i(e,!0);if(h)return h(e,!0);throw(i=new Error("Cannot find module '"+e+"'")).code="MODULE_NOT_FOUND",i}i=n[e]={exports:{}},r[e][0].call(i.exports,function(t){return o(r[e][1][t]||t)},i,i.exports,s,r,n,a)}return n[e].exports}for(var h="function"==typeof require&&require,t=0;t<a.length;t++)o(a[t]);return o}({1:[function(t,e,i){},{}],2:[function(t,e,i){e.exports=function(t){return(t.length?function(t){var e={is_blank:/^\W{0,}$/,is_objective:/(max|min)(imize){0,}\:/i,is_int:/^(?!\/\*)\W{0,}int/i,is_bin:/^(?!\/\*)\W{0,}bin/i,is_constraint:/(\>|\<){0,}\=/i,is_unrestricted:/^\S{0,}unrestricted/i,parse_lhs:/(\-|\+){0,1}\s{0,1}\d{0,}\.{0,}\d{0,}\s{0,}[A-Za-z]\S{0,}/gi,parse_rhs:/(\-|\+){0,1}\d{1,}\.{0,}\d{0,}\W{0,}\;{0,1}$/i,parse_dir:/(\>|\<){0,}\=/gi,parse_int:/[^\s|^\,]+/gi,parse_bin:/[^\s|^\,]+/gi,get_num:/(\-|\+){0,1}(\W|^)\d+\.{0,1}\d{0,}/g,get_word:/[A-Za-z].*/},i={opType:"",optimize:"_obj",constraints:{},variables:{}},s={">=":"min","<=":"max","=":"equal"},r="",n=null,a="",o="";"string"==typeof t&&(t=t.split("\n"));for(var h=0;h<t.length;h++){var l,u="__"+h,r=t[h];n=null,e.is_objective.test(r)?(i.opType=r.match(/(max|min)/gi)[0],(n=r.match(e.parse_lhs).map(function(t){return t.replace(/\s+/,"")}).slice(1)).forEach(function(t){a=null===(a=t.match(e.get_num))?"-"===t.substr(0,1)?-1:1:a[0],a=parseFloat(a),o=t.match(e.get_word)[0].replace(/\;$/,""),i.variables[o]=i.variables[o]||{},i.variables[o]._obj=a})):e.is_int.test(r)?(n=r.match(e.parse_int).slice(1),i.ints=i.ints||{},n.forEach(function(t){t=t.replace(";",""),i.ints[t]=1})):e.is_bin.test(r)?(n=r.match(e.parse_bin).slice(1),i.binaries=i.binaries||{},n.forEach(function(t){t=t.replace(";",""),i.binaries[t]=1})):e.is_constraint.test(r)?((n=(-1===(l=r.indexOf(":"))?r:r.slice(l+1)).match(e.parse_lhs).map(function(t){return t.replace(/\s+/,"")})).forEach(function(t){a=null===(a=t.match(e.get_num))?"-"===t.substr(0,1)?-1:1:a[0],a=parseFloat(a),o=t.match(e.get_word)[0],i.variables[o]=i.variables[o]||{},i.variables[o][u]=a}),l=parseFloat(r.match(e.parse_rhs)[0]),r=s[r.match(e.parse_dir)[0]],i.constraints[u]=i.constraints[u]||{},i.constraints[u][r]=l):e.is_unrestricted.test(r)&&(n=r.match(e.parse_int).slice(1),i.unrestricted=i.unrestricted||{},n.forEach(function(t){t=t.replace(";",""),i.unrestricted[t]=1}))}return i}:function(t){if(!t)throw new Error("Solver requires a model to operate on");var e,i="",s={max:"<=",min:">=",equal:"="},r=new RegExp("[^A-Za-z0-9_[{}/.&#$%~'@^]","gi");if(t.opType)for(var n in i+=t.opType+":",t.variables)t.variables[n][n]=t.variables[n][n]||1,t.variables[n][t.optimize]&&(i+=" "+t.variables[n][t.optimize]+" "+n.replace(r,"_"));else i+="max:";for(e in i+=";\n\n",t.constraints)for(var a in t.constraints[e])if(void 0!==s[a]){for(var o in t.variables)void 0!==t.variables[o][e]&&(i+=" "+t.variables[o][e]+" "+o.replace(r,"_"));i+=" "+s[a]+" "+t.constraints[e][a],i+=";\n"}if(t.ints)for(var h in i+="\n\n",t.ints)i+="int "+h.replace(r,"_")+";\n";if(t.unrestricted)for(var l in i+="\n\n",t.unrestricted)i+="unrestricted "+l.replace(r,"_")+";\n";return i})(t)}},{}],3:[function(n,t,e){function a(t){return t=(t=(t=t.replace("\\r\\n","\r\n")).split("\r\n")).filter(function(t){var e=new RegExp(" 0$","gi");return!0!==e.test(t)&&!1!==(e=new RegExp("\\d$","gi")).test(t)}).map(function(t){return t.split(/\:{0,1} +(?=\d)/)}).reduce(function(t,e,i){return t[e[0]]=e[1],t},{})}e.reformat=n("./Reformat.js"),e.solve=function(r){return new Promise(function(i,s){"undefined"!=typeof window&&s("Function Not Available in Browser");var t=n("./Reformat.js")(r);r.external||s("Data for this function must be contained in the 'external' attribute. Not seeing anything there."),r.external.binPath||s("No Executable | Binary path provided in arguments as 'binPath'"),r.external.args||s("No arguments array for cli | bash provided on 'args' attribute"),r.external.tempName||s("No 'tempName' given. This is necessary to produce a staging file for the solver to operate on"),n("fs").writeFile(r.external.tempName,t,function(t,e){t?s(t):(t=n("child_process").execFile,r.external.args.push(r.external.tempName),t(r.external.binPath,r.external.args,function(t,e){!t||1===t.code?i(a(e)):(e={code:t.code,meaning:{"-2":"Out of Memory",1:"SUBOPTIMAL",2:"INFEASIBLE",3:"UNBOUNDED",4:"DEGENERATE",5:"NUMFAILURE",6:"USER-ABORT",7:"TIMEOUT",9:"PRESOLVED",25:"ACCURACY ERROR",255:"FILE-ERROR"}[t.code],data:e},s(e))}))})})}},{"./Reformat.js":2,child_process:1,fs:1}],4:[function(t,e,i){e.exports={lpsolve:t("./lpsolve/main.js")}},{"./lpsolve/main.js":3}],5:[function(t,e,i){var s=t("./Tableau/Tableau.js"),t=(t("./Tableau/branchAndCut.js"),t("./expressions.js")),r=t.Constraint,P=t.Equality,o=t.Variable,h=t.IntegerVariable;t.Term;function n(t,e){this.tableau=new s(t),this.name=e,this.variables=[],this.integerVariables=[],this.unrestrictedVariables={},this.constraints=[],this.nConstraints=0,this.nVariables=0,this.isMinimization=!0,this.tableauInitialized=!1,this.relaxationIndex=1,this.useMIRCuts=!1,this.checkForCycles=!0,this.messages=[]}(e.exports=n).prototype.minimize=function(){return this.isMinimization=!0,this},n.prototype.maximize=function(){return this.isMinimization=!1,this},n.prototype._getNewElementIndex=function(){if(0<this.availableIndexes.length)return this.availableIndexes.pop();var t=this.lastElementIndex;return this.lastElementIndex+=1,t},n.prototype._addConstraint=function(t){var e=t.slack;this.tableau.variablesPerIndex[e.index]=e,this.constraints.push(t),this.nConstraints+=1,!0===this.tableauInitialized&&this.tableau.addConstraint(t)},n.prototype.smallerThan=function(t){t=new r(t,!0,this.tableau.getNewElementIndex(),this);return this._addConstraint(t),t},n.prototype.greaterThan=function(t){t=new r(t,!1,this.tableau.getNewElementIndex(),this);return this._addConstraint(t),t},n.prototype.equal=function(t){var e=new r(t,!0,this.tableau.getNewElementIndex(),this);this._addConstraint(e);t=new r(t,!1,this.tableau.getNewElementIndex(),this);return this._addConstraint(t),new P(e,t)},n.prototype.addVariable=function(t,e,i,s,r){if("string"==typeof r)switch(r){case"required":r=0;break;case"strong":r=1;break;case"medium":r=2;break;case"weak":r=3;break;default:r=0}var n,a=this.tableau.getNewElementIndex();return null==e&&(e="v"+a),null==t&&(t=0),null==r&&(r=0),i?(n=new h(e,t,a,r),this.integerVariables.push(n)):n=new o(e,t,a,r),this.variables.push(n),this.tableau.variablesPerIndex[a]=n,s&&(this.unrestrictedVariables[a]=!0),this.nVariables+=1,!0===this.tableauInitialized&&this.tableau.addVariable(n),n},n.prototype._removeConstraint=function(t){var e=this.constraints.indexOf(t);-1!==e?(this.constraints.splice(e,1),--this.nConstraints,!0===this.tableauInitialized&&this.tableau.removeConstraint(t),t.relaxation&&this.removeVariable(t.relaxation)):console.warn("[Model.removeConstraint] Constraint not present in model")},n.prototype.removeConstraint=function(t){return t.isEquality?(this._removeConstraint(t.upperBound),this._removeConstraint(t.lowerBound)):this._removeConstraint(t),this},n.prototype.removeVariable=function(t){var e=this.variables.indexOf(t);if(-1!==e)return this.variables.splice(e,1),!0===this.tableauInitialized&&this.tableau.removeVariable(t),this;console.warn("[Model.removeVariable] Variable not present in model")},n.prototype.updateRightHandSide=function(t,e){return!0===this.tableauInitialized&&this.tableau.updateRightHandSide(t,e),this},n.prototype.updateConstraintCoefficient=function(t,e,i){return!0===this.tableauInitialized&&this.tableau.updateConstraintCoefficient(t,e,i),this},n.prototype.setCost=function(t,e){var i=t-e.cost;return!1===this.isMinimization&&(i=-i),e.cost=t,this.tableau.updateCost(e,i),this},n.prototype.loadJson=function(t){this.isMinimization="max"!==t.opType;for(var e=t.variables,i=t.constraints,s={},r={},n=Object.keys(i),a=n.length,o=0;o<a;o+=1){var h,l,u,d=n[o],c=i[d],p=c.equal,v=c.weight,f=c.priority,x=void 0!==v||void 0!==f;void 0===p?(void 0!==(u=c.min)&&(h=this.greaterThan(u),s[d]=h,x&&h.relax(v,f)),void 0!==(c=c.max)&&(l=this.smallerThan(c),r[d]=l,x&&l.relax(v,f))):(h=this.greaterThan(p),s[d]=h,l=this.smallerThan(p),r[d]=l,d=new P(h,l),x&&d.relax(v,f))}var b=Object.keys(e),m=b.length;this.tolerance=t.tolerance||0,t.timeout&&(this.timeout=t.timeout),t.options&&(t.options.timeout&&(this.timeout=t.options.timeout),0===this.tolerance&&(this.tolerance=t.options.tolerance||0),t.options.useMIRCuts&&(this.useMIRCuts=t.options.useMIRCuts),void 0===t.options.exitOnCycles?this.checkForCycles=!0:this.checkForCycles=t.options.exitOnCycles);for(var y=t.ints||{},I=t.binaries||{},g=t.unrestricted||{},w=t.optimize,C=0;C<m;C+=1){var B=b[C],V=e[B],j=V[w]||0,O=!!I[B],R=!!y[B]||O,M=!!g[B],E=this.addVariable(j,B,R,M);O&&this.smallerThan(1).addTerm(1,E);for(var _=Object.keys(V),o=0;o<_.length;o+=1){var T,S,z=_[o];z!==w&&(T=V[z],void 0!==(S=s[z])&&S.addTerm(T,E),void 0!==(z=r[z])&&z.addTerm(T,E))}}return this},n.prototype.getNumberOfIntegerVariables=function(){return this.integerVariables.length},n.prototype.solve=function(){return!1===this.tableauInitialized&&(this.tableau.setModel(this),this.tableauInitialized=!0),this.tableau.solve()},n.prototype.isFeasible=function(){return this.tableau.feasible},n.prototype.save=function(){return this.tableau.save()},n.prototype.restore=function(){return this.tableau.restore()},n.prototype.activateMIRCuts=function(t){this.useMIRCuts=t},n.prototype.debug=function(t){this.checkForCycles=t},n.prototype.log=function(t){return this.tableau.log(t)}},{"./Tableau/Tableau.js":9,"./Tableau/branchAndCut.js":11,"./expressions.js":20}],6:[function(t,e,i){e.exports=function(t,e){var i,s,r,n,a,o=e.optimize,h=JSON.parse(JSON.stringify(e.optimize)),l=Object.keys(e.optimize),u=0,d={},c="",p={},v=[];for(delete e.optimize,s=0;s<l.length;s++)h[l[s]]=0;for(s=0;s<l.length;s++){for(a in e.optimize=l[s],e.opType=o[l[s]],i=t.Solve(e,void 0,void 0,!0),l)if(!e.variables[l[a]])for(n in i[l[a]]=i[l[a]]||0,e.variables)e.variables[n][l[a]]&&i[n]&&(i[l[a]]+=i[n]*e.variables[n][l[a]]);for(c="base",r=0;r<l.length;r++)i[l[r]]?c+="-"+(1e3*i[l[r]]|0)/1e3:c+="-0";if(!d[c]){for(d[c]=1,u++,r=0;r<l.length;r++)i[l[r]]&&(h[l[r]]+=i[l[r]]);delete i.feasible,delete i.result,v.push(i)}}for(s=0;s<l.length;s++)e.constraints[l[s]]={equal:h[l[s]]/u};for(s in e.optimize="cheater-"+Math.random(),e.opType="max",e.variables)e.variables[s].cheater=1;for(s in v)for(n in v[s])p[n]=p[n]||{min:1e99,max:-1e99};for(s in p)for(n in v)v[n][s]?(v[n][s]>p[s].max&&(p[s].max=v[n][s]),v[n][s]<p[s].min&&(p[s].min=v[n][s])):(v[n][s]=0,p[s].min=0);return{midpoint:i=t.Solve(e,void 0,void 0,!0),vertices:v,ranges:p}}},{}],7:[function(t,e,i){var n=t("./Solution.js");function s(t,e,i,s,r){n.call(this,t,e,i,s),this.iter=r}(e.exports=s).prototype=Object.create(n.prototype),s.constructor=s},{"./Solution.js":8}],8:[function(t,e,i){function s(t,e,i,s){this.feasible=i,this.evaluation=e,this.bounded=s,this._tableau=t}(e.exports=s).prototype.generateSolutionSet=function(){for(var t={},e=this._tableau,i=e.varIndexByRow,s=e.variablesPerIndex,r=e.matrix,n=e.rhsColumn,a=e.height-1,o=Math.round(1/e.precision),h=1;h<=a;h+=1){var l,u=s[i[h]];void 0!==u&&!0!==u.isSlack&&(l=r[h][n],t[u.id]=Math.round((Number.EPSILON+l)*o)/o)}return t}},{}],9:[function(t,e,i){var s=t("./Solution.js"),r=t("./MilpSolution.js");function n(t){this.model=null,this.matrix=null,this.width=0,this.height=0,this.costRowIndex=0,this.rhsColumn=0,this.variablesPerIndex=[],this.unrestrictedVars=null,this.feasible=!0,this.evaluation=0,this.simplexIters=0,this.varIndexByRow=null,this.varIndexByCol=null,this.rowByVarIndex=null,this.colByVarIndex=null,this.precision=t||1e-8,this.optionalObjectives=[],this.objectivesByPriority={},this.savedState=null,this.availableIndexes=[],this.lastElementIndex=0,this.variables=null,this.nVars=0,this.bounded=!0,this.unboundedVarIndex=null,this.branchAndCutIterations=0}function a(t,e){this.priority=t,this.reducedCosts=new Array(e);for(var i=0;i<e;i+=1)this.reducedCosts[i]=0}(e.exports=n).prototype.solve=function(){return 0<this.model.getNumberOfIntegerVariables()?this.branchAndCut():this.simplex(),this.updateVariableValues(),this.getSolution()},a.prototype.copy=function(){var t=new a(this.priority,this.reducedCosts.length);return t.reducedCosts=this.reducedCosts.slice(),t},n.prototype.setOptionalObjective=function(t,e,i){var s=this.objectivesByPriority[t];void 0===s&&(s=new a(t,Math.max(this.width,e+1)),this.objectivesByPriority[t]=s,this.optionalObjectives.push(s),this.optionalObjectives.sort(function(t,e){return t.priority-e.priority})),s.reducedCosts[e]=i},n.prototype.initialize=function(t,e,i,s){this.variables=i,this.unrestrictedVars=s,this.width=t,this.height=e;for(var r=new Array(t),n=0;n<t;n++)r[n]=0;this.matrix=new Array(e);for(var a=0;a<e;a++)this.matrix[a]=r.slice();this.varIndexByRow=new Array(this.height),this.varIndexByCol=new Array(this.width),this.varIndexByRow[0]=-1,this.varIndexByCol[0]=-1,this.nVars=t+e-2,this.rowByVarIndex=new Array(this.nVars),this.colByVarIndex=new Array(this.nVars),this.lastElementIndex=this.nVars},n.prototype._resetMatrix=function(){for(var t=this.model.variables,e=this.model.constraints,i=t.length,s=e.length,r=this.matrix[0],n=!0===this.model.isMinimization?-1:1,a=0;a<i;a+=1){var o=t[a],h=o.priority,o=n*o.cost;0===h?r[a+1]=o:this.setOptionalObjective(h,a+1,o),o=t[a].index,this.rowByVarIndex[o]=-1,this.colByVarIndex[o]=a+1,this.varIndexByCol[a+1]=o}for(var l=1,u=0;u<s;u+=1){var d,c,p=e[u],v=p.index;this.rowByVarIndex[v]=l,this.colByVarIndex[v]=-1,this.varIndexByRow[l]=v;var f=p.terms,x=f.length,b=this.matrix[l++];if(p.isUpperBound){for(d=0;d<x;d+=1)c=f[d],b[this.colByVarIndex[c.variable.index]]=c.coefficient;b[0]=p.rhs}else{for(d=0;d<x;d+=1)c=f[d],b[this.colByVarIndex[c.variable.index]]=-c.coefficient;b[0]=-p.rhs}}},n.prototype.setModel=function(t){var e=(this.model=t).nVariables+1,i=t.nConstraints+1;return this.initialize(e,i,t.variables,t.unrestrictedVariables),this._resetMatrix(),this},n.prototype.getNewElementIndex=function(){if(0<this.availableIndexes.length)return this.availableIndexes.pop();var t=this.lastElementIndex;return this.lastElementIndex+=1,t},n.prototype.density=function(){for(var t=0,e=this.matrix,i=0;i<this.height;i++)for(var s=e[i],r=0;r<this.width;r++)0!==s[r]&&(t+=1);return t/(this.height*this.width)},n.prototype.setEvaluation=function(){var t=Math.round(1/this.precision),e=this.matrix[this.costRowIndex][this.rhsColumn],t=Math.round((Number.EPSILON+e)*t)/t;this.evaluation=t,0===this.simplexIters&&(this.bestPossibleEval=t)},n.prototype.getSolution=function(){var t=!0===this.model.isMinimization?this.evaluation:-this.evaluation;return 0<this.model.getNumberOfIntegerVariables()?new r(this,t,this.feasible,this.bounded,this.branchAndCutIterations):new s(this,t,this.feasible,this.bounded)}},{"./MilpSolution.js":7,"./Solution.js":8}],10:[function(t,e,i){var a=t("./Tableau.js");a.prototype.copy=function(){var t=new a(this.precision);t.width=this.width,t.height=this.height,t.nVars=this.nVars,t.model=this.model,t.variables=this.variables,t.variablesPerIndex=this.variablesPerIndex,t.unrestrictedVars=this.unrestrictedVars,t.lastElementIndex=this.lastElementIndex,t.varIndexByRow=this.varIndexByRow.slice(),t.varIndexByCol=this.varIndexByCol.slice(),t.rowByVarIndex=this.rowByVarIndex.slice(),t.colByVarIndex=this.colByVarIndex.slice(),t.availableIndexes=this.availableIndexes.slice();for(var e=[],i=0;i<this.optionalObjectives.length;i++)e[i]=this.optionalObjectives[i].copy();t.optionalObjectives=e;for(var s=this.matrix,r=new Array(this.height),n=0;n<this.height;n++)r[n]=s[n].slice();return t.matrix=r,t},a.prototype.save=function(){this.savedState=this.copy()},a.prototype.restore=function(){if(null!==this.savedState){var t=this.savedState,e=t.matrix;for(this.nVars=t.nVars,this.model=t.model,this.variables=t.variables,this.variablesPerIndex=t.variablesPerIndex,this.unrestrictedVars=t.unrestrictedVars,this.lastElementIndex=t.lastElementIndex,this.width=t.width,this.height=t.height,o=0;o<this.height;o+=1)for(var i=e[o],s=this.matrix[o],r=0;r<this.width;r+=1)s[r]=i[r];var n=t.varIndexByRow;for(r=0;r<this.height;r+=1)this.varIndexByRow[r]=n[r];for(;this.varIndexByRow.length>this.height;)this.varIndexByRow.pop();for(var a=t.varIndexByCol,o=0;o<this.width;o+=1)this.varIndexByCol[o]=a[o];for(;this.varIndexByCol.length>this.width;)this.varIndexByCol.pop();for(var h=t.rowByVarIndex,l=t.colByVarIndex,u=0;u<this.nVars;u+=1)this.rowByVarIndex[u]=h[u],this.colByVarIndex[u]=l[u];if(0<t.optionalObjectives.length&&0<this.optionalObjectives.length){this.optionalObjectives=[],this.optionalObjectivePerPriority={};for(var d=0;d<t.optionalObjectives.length;d++){var c=t.optionalObjectives[d].copy();this.optionalObjectives[d]=c,this.optionalObjectivePerPriority[c.priority]=c}}}}},{"./Tableau.js":9}],11:[function(t,e,i){t=t("./Tableau.js");function C(t,e,i){this.type=t,this.varIndex=e,this.value=i}function B(t,e){this.relaxedEvaluation=t,this.cuts=e}function V(t,e){return e.relaxedEvaluation-t.relaxedEvaluation}t.prototype.applyCuts=function(t){if(this.restore(),this.addCutConstraints(t),this.simplex(),this.model.useMIRCuts)for(var e=!0;e;){var i=this.computeFractionalVolume(!0);this.applyMIRCuts(),this.simplex(),.9*i<=this.computeFractionalVolume(!0)&&(e=!1)}},t.prototype.branchAndCut=function(){var t=[],e=0,i=this.model.tolerance,s=!0,r=1e99;this.model.timeout&&(r=Date.now()+this.model.timeout);for(var n=1/0,a=null,o=[],h=0;h<this.optionalObjectives.length;h+=1)o.push(1/0);var l=new B(-1/0,[]);for(t.push(l);0<t.length&&!0===s&&Date.now()<r;)if(w=this.model.isMinimization?this.bestPossibleEval*(1+i):this.bestPossibleEval*(1-i),0<i&&n<w&&(s=!1),!((l=t.pop()).relaxedEvaluation>n)){var u=l.cuts;if(this.applyCuts(u),e++,!1!==this.feasible){var d=this.evaluation;if(!(n<d)){if(d===n){for(var c=!0,p=0;p<this.optionalObjectives.length&&!(this.optionalObjectives[p].reducedCosts[0]>o[p]);p+=1)if(this.optionalObjectives[p].reducedCosts[0]<o[p]){c=!1;break}if(c)continue}if(!0===this.isIntegral()){if(this.__isIntegral=!0,1===e)return void(this.branchAndCutIterations=e);for(var a=l,n=d,v=0;v<this.optionalObjectives.length;v+=1)o[v]=this.optionalObjectives[v].reducedCosts[0]}else{1===e&&this.save();for(var f=this.getMostFractionalVar(),x=f.index,b=[],m=[],y=u.length,I=0;I<y;I+=1){var g=u[I];g.varIndex===x?("min"===g.type?m:b).push(g):(b.push(g),m.push(g))}var w=Math.ceil(f.value),f=Math.floor(f.value),w=new C("min",x,w);b.push(w);f=new C("max",x,f);m.push(f),t.push(new B(d,b)),t.push(new B(d,m)),t.sort(V)}}}}null!==a&&this.applyCuts(a.cuts),this.branchAndCutIterations=e}},{"./Tableau.js":9}],12:[function(t,e,i){t=t("./Tableau.js");function l(t,e){this.index=t,this.value=e}t.prototype.getMostFractionalVar=function(){for(var t=0,e=null,i=null,s=this.model.integerVariables,r=s.length,n=0;n<r;n++){var a,o=s[n].index,h=this.rowByVarIndex[o];-1!==h&&(a=this.matrix[h][this.rhsColumn],t<(h=Math.abs(a-Math.round(a)))&&(t=h,e=o,i=a))}return new l(e,i)},t.prototype.getFractionalVarWithLowestCost=function(){for(var t=1/0,e=null,i=null,s=this.model.integerVariables,r=s.length,n=0;n<r;n++){var a=s[n],o=a.index,h=this.rowByVarIndex[o];-1!==h&&(h=this.matrix[h][this.rhsColumn],Math.abs(h-Math.round(h))>this.precision&&((a=a.cost)<t&&(t=a,e=o,i=h)))}return new l(e,i)}},{"./Tableau.js":9}],13:[function(t,e,i){var s=t("./Tableau.js"),x=t("../expressions.js").SlackVariable;s.prototype.addCutConstraints=function(t){for(var e,i=t.length,s=this.height,r=s+i,n=s;n<r;n+=1)void 0===this.matrix[n]&&(this.matrix[n]=this.matrix[n-1].slice());this.height=r,this.nVars=this.width+this.height-2;for(var a=this.width-1,o=0;o<i;o+=1){var h=t[o],l=s+o,u="min"===h.type?-1:1,d=h.varIndex,c=this.rowByVarIndex[d],p=this.matrix[l];if(-1===c){for(p[this.rhsColumn]=u*h.value,e=1;e<=a;e+=1)p[e]=0;p[this.colByVarIndex[d]]=u}else{var v=this.matrix[c],f=v[this.rhsColumn];for(p[this.rhsColumn]=u*(h.value-f),e=1;e<=a;e+=1)p[e]=-u*v[e]}f=this.getNewElementIndex();this.varIndexByRow[l]=f,this.rowByVarIndex[f]=l,this.colByVarIndex[f]=-1,this.variablesPerIndex[f]=new x("s"+f,f),this.nVars+=1}},s.prototype._addLowerBoundMIRCut=function(t){if(t===this.costRowIndex)return!1;this.model;var e=this.matrix;if(!this.variablesPerIndex[this.varIndexByRow[t]].isInteger)return!1;var i=e[t][this.rhsColumn],s=i-Math.floor(i);if(s<this.precision||1-this.precision<s)return!1;var r=this.height;e[r]=e[r-1].slice(),this.height+=1,this.nVars+=1;var n=this.getNewElementIndex();this.varIndexByRow[r]=n,this.rowByVarIndex[n]=r,this.colByVarIndex[n]=-1,this.variablesPerIndex[n]=new x("s"+n,n),e[r][this.rhsColumn]=Math.floor(i);for(var a,o=1;o<this.varIndexByCol.length;o+=1)this.variablesPerIndex[this.varIndexByCol[o]].isInteger?(a=e[t][o],a=Math.floor(a)+Math.max(0,a-Math.floor(a)-s)/(1-s),e[r][o]=a):e[r][o]=Math.min(0,e[t][o]/(1-s));for(var h=0;h<this.width;h+=1)e[r][h]-=e[t][h];return!0},s.prototype._addUpperBoundMIRCut=function(t){if(t===this.costRowIndex)return!1;this.model;var e=this.matrix;if(!this.variablesPerIndex[this.varIndexByRow[t]].isInteger)return!1;var i=e[t][this.rhsColumn],s=i-Math.floor(i);if(s<this.precision||1-this.precision<s)return!1;var r=this.height;e[r]=e[r-1].slice(),this.height+=1,this.nVars+=1;i=this.getNewElementIndex();this.varIndexByRow[r]=i,this.rowByVarIndex[i]=r,this.colByVarIndex[i]=-1,this.variablesPerIndex[i]=new x("s"+i,i),e[r][this.rhsColumn]=-s;for(var n=1;n<this.varIndexByCol.length;n+=1){var a=this.variablesPerIndex[this.varIndexByCol[n]],o=e[t][n],h=o-Math.floor(o);a.isInteger?e[r][n]=h<=s?-h:-(1-h)*s/h:e[r][n]=0<=o?-o:o*s/(1-s)}return!0},s.prototype.applyMIRCuts=function(){}},{"../expressions.js":20,"./Tableau.js":9}],14:[function(t,e,i){t=t("./Tableau.js");t.prototype._putInBase=function(t){var e=this.rowByVarIndex[t];if(-1===e){for(var i=this.colByVarIndex[t],s=1;s<this.height;s+=1){var r=this.matrix[s][i];if(r<-this.precision||this.precision<r){e=s;break}}this.pivot(e,i)}return e},t.prototype._takeOutOfBase=function(t){var e=this.colByVarIndex[t];if(-1===e){for(var t=this.rowByVarIndex[t],i=this.matrix[t],s=1;s<this.height;s+=1){var r=i[s];if(r<-this.precision||this.precision<r){e=s;break}}this.pivot(t,e)}return e},t.prototype.updateVariableValues=function(){for(var t=this.variables.length,e=Math.round(1/this.precision),i=0;i<t;i+=1){var s=this.variables[i],r=s.index,r=this.rowByVarIndex[r];-1===r?s.value=0:(r=this.matrix[r][this.rhsColumn],s.value=Math.round((r+Number.EPSILON)*e)/e)}},t.prototype.updateRightHandSide=function(t,e){var i=this.height-1,s=this.rowByVarIndex[t.index];if(-1===s){for(var r=this.colByVarIndex[t.index],n=0;n<=i;n+=1){var a=this.matrix[n];a[this.rhsColumn]-=e*a[r]}var o=this.optionalObjectives.length;if(0<o)for(var h=0;h<o;h+=1){var l=this.optionalObjectives[h].reducedCosts;l[this.rhsColumn]-=e*l[r]}}else this.matrix[s][this.rhsColumn]-=e},t.prototype.updateConstraintCoefficient=function(t,e,i){if(t.index===e.index)throw new Error("[Tableau.updateConstraintCoefficient] constraint index should not be equal to variable index !");var s=this._putInBase(t.index),t=this.colByVarIndex[e.index];if(-1===t)for(var r=this.rowByVarIndex[e.index],n=0;n<this.width;n+=1)this.matrix[s][n]+=i*this.matrix[r][n];else this.matrix[s][t]-=i},t.prototype.updateCost=function(t,e){var i=t.index,s=this.width-1,r=this.colByVarIndex[i];if(-1===r){var n=this.matrix[this.rowByVarIndex[i]];if(0===t.priority)for(var a=this.matrix[0],o=0;o<=s;o+=1)a[o]+=e*n[o];else{var h=this.objectivesByPriority[t.priority].reducedCosts;for(o=0;o<=s;o+=1)h[o]+=e*n[o]}}else this.matrix[0][r]-=e},t.prototype.addConstraint=function(t){var e=t.isUpperBound?1:-1,i=this.height,s=this.matrix[i];void 0===s&&(s=this.matrix[0].slice(),this.matrix[i]=s);for(var r=this.width-1,n=0;n<=r;n+=1)s[n]=0;s[this.rhsColumn]=e*t.rhs;for(var a=t.terms,o=a.length,h=0;h<o;h+=1){var l=a[h],u=l.coefficient,d=l.variable.index,l=this.rowByVarIndex[d];if(-1===l)s[this.colByVarIndex[d]]+=e*u;else for(var c=this.matrix[l],n=(c[this.rhsColumn],0);n<=r;n+=1)s[n]-=e*u*c[n]}t=t.index;this.varIndexByRow[i]=t,this.rowByVarIndex[t]=i,this.colByVarIndex[t]=-1,this.height+=1},t.prototype.removeConstraint=function(t){var e=t.index,i=this.height-1,s=this._putInBase(e),r=this.matrix[i];this.matrix[i]=this.matrix[s],this.matrix[s]=r,this.varIndexByRow[s]=this.varIndexByRow[i],this.varIndexByRow[i]=-1,this.rowByVarIndex[e]=-1,this.availableIndexes[this.availableIndexes.length]=e,t.slack.index=-1,--this.height},t.prototype.addVariable=function(t){var e=this.height-1,i=this.width,s=!0===this.model.isMinimization?-t.cost:t.cost,r=t.priority,n=this.optionalObjectives.length;if(0<n)for(var a=0;a<n;a+=1)this.optionalObjectives[a].reducedCosts[i]=0;0===r?this.matrix[0][i]=s:(this.setOptionalObjective(r,i,s),this.matrix[0][i]=0);for(var o=1;o<=e;o+=1)this.matrix[o][i]=0;t=t.index;this.varIndexByCol[i]=t,this.rowByVarIndex[t]=-1,this.colByVarIndex[t]=i,this.width+=1},t.prototype.removeVariable=function(t){var e=t.index,i=this._takeOutOfBase(e),s=this.width-1;if(i!==s){for(var r=this.height-1,n=0;n<=r;n+=1){var a=this.matrix[n];a[i]=a[s]}var o=this.optionalObjectives.length;if(0<o)for(var h=0;h<o;h+=1){var l=this.optionalObjectives[h].reducedCosts;l[i]=l[s]}var u=this.varIndexByCol[s];this.varIndexByCol[i]=u,this.colByVarIndex[u]=i}this.varIndexByCol[s]=-1,this.colByVarIndex[e]=-1,this.availableIndexes[this.availableIndexes.length]=e,t.index=-1,--this.width}},{"./Tableau.js":9}],15:[function(t,e,i){t("./simplex.js"),t("./cuttingStrategies.js"),t("./dynamicModification.js"),t("./log.js"),t("./backup.js"),t("./branchingStrategies.js"),t("./integerProperties.js"),e.exports=t("./Tableau.js")},{"./Tableau.js":9,"./backup.js":10,"./branchingStrategies.js":12,"./cuttingStrategies.js":13,"./dynamicModification.js":14,"./integerProperties.js":16,"./log.js":17,"./simplex.js":18}],16:[function(t,e,i){t=t("./Tableau.js");t.prototype.countIntegerValues=function(){for(var t,e=0,i=1;i<this.height;i+=1)this.variablesPerIndex[this.varIndexByRow[i]].isInteger&&(t=this.matrix[i][this.rhsColumn],(t-=Math.floor(t))<this.precision&&-t<this.precision&&(e+=1));return e},t.prototype.isIntegral=function(){for(var t=this.model.integerVariables,e=t.length,i=0;i<e;i++){var s=this.rowByVarIndex[t[i].index];if(-1!==s){s=this.matrix[s][this.rhsColumn];if(Math.abs(s-Math.round(s))>this.precision)return!1}}return!0},t.prototype.computeFractionalVolume=function(t){for(var e=-1,i=1;i<this.height;i+=1)if(this.variablesPerIndex[this.varIndexByRow[i]].isInteger){var s=this.matrix[i][this.rhsColumn],s=Math.abs(s);if(Math.min(s-Math.floor(s),Math.floor(s+1))<this.precision){if(!t)return 0}else-1===e?e=s:e*=s}return-1===e?0:e}},{"./Tableau.js":9}],17:[function(t,e,i){t("./Tableau.js").prototype.log=function(t,e){console.log("****",t,"****"),console.log("Nb Variables",this.width-1),console.log("Nb Constraints",this.height-1),console.log("Basic Indexes",this.varIndexByRow),console.log("Non Basic Indexes",this.varIndexByCol),console.log("Rows",this.rowByVarIndex),console.log("Cols",this.colByVarIndex);for(var i,s,r,n,a,o,h,l,u,d="",c=[" "],p=1;p<this.width;p+=1)r=this.varIndexByCol[p],a=(n=void 0===(s=this.variablesPerIndex[r])?"c"+r:s.id).length,Math.abs(a-5),o=" ",h="\t",5<a?o+=" ":h+="\t",c[p]=o,d+=h+n;console.log(d);var v=this.matrix[this.costRowIndex],f="\t";for(I=1;I<this.width;I+=1)f+="\t",f+=c[I],f+=v[I].toFixed(5);for(f+="\t"+c[0]+v[0].toFixed(5),console.log(f+"\tZ"),i=1;i<this.height;i+=1){for(l=this.matrix[i],u="\t",p=1;p<this.width;p+=1)u+="\t"+c[p]+l[p].toFixed(5);u+="\t"+c[0]+l[0].toFixed(5),r=this.varIndexByRow[i],n=void 0===(s=this.variablesPerIndex[r])?"c"+r:s.id,console.log(u+"\t"+n)}console.log("");var x=this.optionalObjectives.length;if(0<x){console.log("    Optional objectives:");for(var b=0;b<x;b+=1){for(var m=this.optionalObjectives[b].reducedCosts,y="",I=1;I<this.width;I+=1)y+=m[I]<0?"":" ",y+=c[I],y+=m[I].toFixed(5);y+=(m[0]<0?"":" ")+c[0]+m[0].toFixed(5),console.log(y+" z"+b)}}return console.log("Feasible?",this.feasible),console.log("evaluation",this.evaluation),this}},{"./Tableau.js":9}],18:[function(t,e,i){t=t("./Tableau.js");t.prototype.simplex=function(){return this.bounded=!0,this.phase1(),!0===this.feasible&&this.phase2(),this},t.prototype.phase1=function(){for(var t=this.model.checkForCycles,e=[],i=this.matrix,s=this.rhsColumn,r=this.width-1,n=this.height-1,a=0;;){for(var o=0,h=-this.precision,l=1;l<=n;l++){this.unrestrictedVars[this.varIndexByRow[l]];var u=i[l][s];u<h&&(h=u,o=l)}if(0===o)return this.feasible=!0,a;for(var d=0,c=-1/0,p=i[0],v=i[o],f=1;f<=r;f++){var x=v[f];!(!0===this.unrestrictedVars[this.varIndexByCol[f]]||x<-this.precision)||c<(x=-p[f]/x)&&(c=x,d=f)}if(0===d)return this.feasible=!1,a;if(t){e.push([this.varIndexByRow[o],this.varIndexByCol[d]]);var b=this.checkForCycles(e);if(0<b.length)return this.model.messages.push("Cycle in phase 1"),this.model.messages.push("Start :"+b[0]),this.model.messages.push("Length :"+b[1]),this.feasible=!1,a}this.pivot(o,d),a+=1}},t.prototype.phase2=function(){for(var t,e,i=this.model.checkForCycles,s=[],r=this.matrix,n=this.rhsColumn,a=this.width-1,o=this.height-1,h=this.precision,l=this.optionalObjectives.length,u=null,d=0;;){var c=r[this.costRowIndex];0<l&&(u=[]);for(var p=0,v=h,f=!1,x=1;x<=a;x++)t=c[x],e=!0===this.unrestrictedVars[this.varIndexByCol[x]],0<l&&-h<t&&t<h?u.push(x):e&&t<0?v<-t&&(v=-t,p=x,f=!0):v<t&&(v=t,p=x,f=!1);if(0<l)for(var b=0;0===p&&0<u.length&&b<l;){for(var m=[],y=this.optionalObjectives[b].reducedCosts,v=h,I=0;I<u.length;I++)t=y[x=u[I]],e=!0===this.unrestrictedVars[this.varIndexByCol[x]],-h<t&&t<h?m.push(x):e&&t<0?v<-t&&(v=-t,p=x,f=!0):v<t&&(v=t,p=x,f=!1);u=m,b+=1}if(0===p)return this.setEvaluation(),this.simplexIters+=1,d;for(var g=0,w=1/0,C=(this.varIndexByRow,1);C<=o;C++){var B=r[C],V=B[n],B=B[p];if(!(-h<B&&B<h)){if(0<B&&V<h&&-h<V){w=0,g=C;break}B=f?-V/B:V/B;h<B&&B<w&&(w=B,g=C)}}if(w===1/0)return this.evaluation=-1/0,this.bounded=!1,this.unboundedVarIndex=this.varIndexByCol[p],d;if(i){s.push([this.varIndexByRow[g],this.varIndexByCol[p]]);var j=this.checkForCycles(s);if(0<j.length)return this.model.messages.push("Cycle in phase 2"),this.model.messages.push("Start :"+j[0]),this.model.messages.push("Length :"+j[1]),this.feasible=!1,d}this.pivot(g,p,!0),d+=1}};var y=[];t.prototype.pivot=function(t,e){var i=this.matrix,s=i[t][e],r=this.height-1,n=this.width-1,a=this.varIndexByRow[t],o=this.varIndexByCol[e];this.varIndexByRow[t]=o,this.varIndexByCol[e]=a,this.rowByVarIndex[o]=t,this.rowByVarIndex[a]=-1,this.colByVarIndex[o]=-1,this.colByVarIndex[a]=e;for(var h,l,u=i[t],d=0,c=0;c<=n;c++)-1e-16<=u[c]&&u[c]<=1e-16?u[c]=0:(u[c]/=s,y[d]=c,d+=1);u[e]=1/s;this.precision;for(var p=0;p<=r;p++)if(p!==t&&!(-1e-16<=i[p][e]&&i[p][e]<=1e-16)){var v,f=i[p];if(-1e-16<=(v=f[e])&&v<=1e-16)0!==v&&(f[e]=0);else{for(h=0;h<d;h++)-1e-16<=(l=u[c=y[h]])&&l<=1e-16?0!==l&&(u[c]=0):f[c]=f[c]-v*l;f[e]=-v/s}}var x=this.optionalObjectives.length;if(0<x)for(var b=0;b<x;b+=1){var m=this.optionalObjectives[b].reducedCosts;if(0!==(v=m[e])){for(h=0;h<d;h++)0!==(l=u[c=y[h]])&&(m[c]=m[c]-v*l);m[e]=-v/s}}},t.prototype.checkForCycles=function(t){for(var e=0;e<t.length-1;e++)for(var i=e+1;i<t.length;i++){var s=t[e],r=t[i];if(s[0]===r[0]&&s[1]===r[1]){if(i-e>t.length-i)break;for(var n=!0,a=1;a<i-e;a++){var o=t[e+a],h=t[i+a];if(o[0]!==h[0]||o[1]!==h[1]){n=!1;break}}if(n)return[e,i-e]}}return[]}},{"./Tableau.js":9}],19:[function(t,e,i){i.CleanObjectiveAttributes=function(t){var e,i,s;if("string"==typeof t.optimize){if(t.constraints[t.optimize]){for(i in e=Math.random(),t.variables)t.variables[i][t.optimize]&&(t.variables[i][e]=t.variables[i][t.optimize]);return t.constraints[e]=t.constraints[t.optimize],delete t.constraints[t.optimize],t}return t}for(s in t.optimize)if(t.constraints[s])if("equal"===t.constraints[s])delete t.optimize[s];else{for(i in e=Math.random(),t.variables)t.variables[i][s]&&(t.variables[i][e]=t.variables[i][s]);t.constraints[e]=t.constraints[s],delete t.constraints[s]}return t}},{}],20:[function(t,e,i){function r(t,e,i,s){this.id=t,this.cost=e,this.index=i,this.value=0,this.priority=s}function s(t,e,i,s){r.call(this,t,e,i,s)}function n(t,e){r.call(this,t,0,e,0)}function a(t,e){this.variable=t,this.coefficient=e}function o(t,e,i){return 0===i||"required"===i?null:(e=e||1,i=i||1,!1===t.isMinimization&&(e=-e),t.addVariable(e,"r"+t.relaxationIndex++,!1,!1,i))}function h(t,e,i,s){this.slack=new n("s"+i,i),this.index=i,this.model=s,this.rhs=t,this.isUpperBound=e,this.terms=[],this.termsByVarIndex={},this.relaxation=null}function l(t,e){this.upperBound=t,this.lowerBound=e,this.model=t.model,this.rhs=t.rhs,this.relaxation=null}n.prototype.isSlack=s.prototype.isInteger=!0,h.prototype.addTerm=function(t,e){var i=e.index,s=this.termsByVarIndex[i];return void 0===s?(s=new a(e,t),this.termsByVarIndex[i]=s,this.terms.push(s),!0===this.isUpperBound&&(t=-t),this.model.updateConstraintCoefficient(this,e,t)):(t=s.coefficient+t,this.setVariableCoefficient(t,e)),this},h.prototype.removeTerm=function(t){return this},h.prototype.setRightHandSide=function(t){var e;return t!==this.rhs&&(e=t-this.rhs,!0===this.isUpperBound&&(e=-e),this.rhs=t,this.model.updateRightHandSide(this,e)),this},h.prototype.setVariableCoefficient=function(t,e){var i=e.index;if(-1!==i){var s=this.termsByVarIndex[i];return void 0===s?this.addTerm(t,e):t!==s.coefficient&&(i=t-s.coefficient,!0===this.isUpperBound&&(i=-i),s.coefficient=t,this.model.updateConstraintCoefficient(this,e,i)),this}console.warn("[Constraint.setVariableCoefficient] Trying to change coefficient of inexistant variable.")},h.prototype.relax=function(t,e){this.relaxation=o(this.model,t,e),this._relax(this.relaxation)},h.prototype._relax=function(t){null!==t&&(this.isUpperBound?this.setVariableCoefficient(-1,t):this.setVariableCoefficient(1,t))},l.prototype.isEquality=!0,l.prototype.addTerm=function(t,e){return this.upperBound.addTerm(t,e),this.lowerBound.addTerm(t,e),this},l.prototype.removeTerm=function(t){return this.upperBound.removeTerm(t),this.lowerBound.removeTerm(t),this},l.prototype.setRightHandSide=function(t){this.upperBound.setRightHandSide(t),this.lowerBound.setRightHandSide(t),this.rhs=t},l.prototype.relax=function(t,e){this.relaxation=o(this.model,t,e),this.upperBound.relaxation=this.relaxation,this.upperBound._relax(this.relaxation),this.lowerBound.relaxation=this.relaxation,this.lowerBound._relax(this.relaxation)},e.exports={Constraint:h,Variable:r,IntegerVariable:s,SlackVariable:n,Equality:l,Term:a}},{}],21:[function(o,t,e){function i(){"use strict";this.Model=h,this.branchAndCut=r,this.Constraint=a,this.Variable=u,this.Numeral=d,this.Term=c,this.Tableau=s,this.lastSolvedModel=null,this.External=p,this.Solve=function(t,e,i,s){if(s)for(var r in l)t=l[r](t);if(!t)throw new Error("Solver requires a model to operate on");if("object"==typeof t.optimize&&Object.keys(1<t.optimize))return o("./Polyopt")(this,t);if(t.external){s=Object.keys(p),s=JSON.stringify(s);if(!t.external.solver)throw new Error("The model you provided has an 'external' object that doesn't have a solver attribute. Use one of the following:"+s);if(!p[t.external.solver])throw new Error("No support (yet) for "+t.external.solver+". Please use one of these instead:"+s);return p[t.external.solver].solve(t)}var n=(t=t instanceof h==!1?new h(e).loadJson(t):t).solve();if(this.lastSolvedModel=t,n.solutionSet=n.generateSolutionSet(),i)return n;var a={};return a.feasible=n.feasible,a.result=n.evaluation,a.bounded=n.bounded,n._tableau.__isIntegral&&(a.isIntegral=!0),Object.keys(n.solutionSet).forEach(function(t){0!==n.solutionSet[t]&&(a[t]=n.solutionSet[t])}),a},this.ReformatLP=o("./External/lpsolve/Reformat.js"),this.MultiObjective=function(t){return o("./Polyopt")(this,t)}}var s=o("./Tableau/index.js"),h=o("./Model"),r=o("./Tableau/branchAndCut"),n=o("./expressions.js"),l=o("./Validation"),a=n.Constraint,u=n.Variable,d=n.Numeral,c=n.Term,p=o("./External/main.js");"function"==typeof define?define([],function(){return new i}):"object"==typeof window?window.solver=new i:"object"==typeof self&&(self.solver=new i),t.exports=new i},{"./External/lpsolve/Reformat.js":2,"./External/main.js":4,"./Model":5,"./Polyopt":6,"./Tableau/branchAndCut":11,"./Tableau/index.js":15,"./Validation":19,"./expressions.js":20}]},{},[21]);
    
    
    },{"./main":20}],22:[function(require,module,exports){
    
        function NewIteratedDominanceStep() {
            if (!ValidateInputs()) return
            if (document.querySelector('[data-locked]').dataset.locked === "false") {Lock()}
            const next_step_button = document.querySelector('[data-next-step-button]') 
            var current_key = next_step_button.dataset.currentKey
            var current_player = next_step_button.dataset.rowOrCol
            const ORIGINAL_KEY = current_key
            const ORIGINAL_PLAYER = current_player

            while (true) {
                // if current player is column player:
                if (current_player === "col") {
                    const ColPlayerVariables = createColPlayerVariables()
                    const constraints = createConstraints(ColPlayerVariables , current_key)
                    const previous_key = current_key
                    
                    // updating current key and player:
                    const col_keys = Object.keys(ColPlayerVariables)
                    // if current column is last live column:
                    if (col_keys.indexOf(current_key) == col_keys.length - 1) {
                        const RowPlayerVariables = createRowPlayerVariables()
                        const row_keys = Object.keys(RowPlayerVariables)
                        current_key = row_keys[0]
                        current_player = "row"
                    } else {
                        current_key = col_keys[col_keys.indexOf(current_key) + 1]
                    }

                    if (IsDominated(constraints, ColPlayerVariables)) {
                        EliminateColumn(previous_key)
                        // todo: display to viewer mathematical reasoning for elimination (ie weighted combination of columns or rows that eliminated current column/row)
                        printDominationResults(getDominationResults(constraints, ColPlayerVariables) , "Column" , previous_key)

                        next_step_button.dataset.currentKey = current_key
                        next_step_button.dataset.rowOrCol = current_player
                        return
                    }

                }
                // if current player is row player:
                else {
                    const RowPlayerVariables = createRowPlayerVariables()
                    const constraints = createConstraints(RowPlayerVariables , current_key)
                    const previous_key = current_key

                    // updating current key and player:
                    const row_keys = Object.keys(RowPlayerVariables)
                    if (row_keys.indexOf(current_key) == row_keys.length - 1) {
                        const ColPlayerVariables = createColPlayerVariables()
                        const col_keys = Object.keys(ColPlayerVariables)
                        current_key = col_keys[0]
                        current_player = "col"
                    } else {
                        current_key = row_keys[row_keys.indexOf(current_key) + 1]
                    }
                    
                    if (IsDominated(constraints, RowPlayerVariables)) {
                        EliminateRow(previous_key)
                        // todo: display to viewer mathematical reas... etc.
                        printDominationResults(getDominationResults(constraints, RowPlayerVariables) , "Row" , previous_key)

                        next_step_button.dataset.currentKey = current_key
                        next_step_button.dataset.rowOrCol = current_player
                        return
                    }
                }

                if (current_key === ORIGINAL_KEY) {
                    addTextToOutput("Iterated Strict Dominance has completed.")
                    const next_step_button = document.querySelector('[data-next-step-button]') 
                    next_step_button.disabled = true
                    return
                }
            }
        }

        function IteratedDominanceStep() {
            if (document.querySelector('[data-locked]').dataset.locked === "false") return
            const ColPlayerVariables = createColPlayerVariables()
            const RowPlayerVariables = createRowPlayerVariables()
            console.log(ColPlayerVariables)
            const col_keys = Object.keys(ColPlayerVariables)
            col_keys.forEach( (key) => {
                const constraints = createConstraints(ColPlayerVariables , key)
                if (IsDominated(constraints, ColPlayerVariables)) {
                    EliminateColumn(key)
                }
        
            })
        
            const row_keys = Object.keys(RowPlayerVariables)
            row_keys.forEach( (key) => {
                const constraints = createConstraints(RowPlayerVariables , key)
                if (IsDominated(constraints, RowPlayerVariables)) {
                    EliminateRow(key)
                }
            })
        }
        
        function EliminateColumn(key) {
            const column_no = key.charCodeAt(0) - ASCII_CODE_OF_a
            
            const column_identifyer = document.querySelectorAll("[data-col-is-live]")[column_no]
            column_identifyer.dataset.colIsLive = "false"
            greyOutColumn(column_no)
            const rows = document.querySelectorAll("[data-row-is-live]")
            rows.forEach( (row) => {
                const column = row.childNodes[column_no+1]
        
                const col_element = column.querySelector('[data-col-player-input]')
                col_element.dataset.colPlayerInput = 'eliminated'
        
                const row_element = column.querySelector('[data-row-player-input]')
                row_element.dataset.rowPlayerInput = 'eliminated'
            })
        }
        
        function EliminateRow(key) {
            const row_no = key.charCodeAt(0) - ASCII_CODE_OF_A
            greyOutRow(row_no)
            const rows = document.querySelectorAll("[data-row-is-live]")
            const row = rows[row_no]
            row.dataset.rowIsLive = 'false'
            
            const row_elements = row.querySelectorAll('[data-row-player-input="live"]')
            row_elements.forEach( (element) => {
                element.dataset.rowPlayerInput = 'eliminated'
            })
        
            const col_elements = row.querySelectorAll('[data-col-player-input="live"]')
            col_elements.forEach( (element) => {
                element.dataset.colPlayerInput = 'eliminated'
            })
        }
        
        function getDominationResults(constraints , variables) {
            var solver = require("../javascript-lp-solver/src/solver.js")
        
            const model = {
                "optimize": "sumofp",
                "opType": "min",
                "constraints": constraints,
                "variables": variables,
            }
            return solver.Solve(model)
        }

        function printDominationResults(model_output , player , key) {
            const remaining_weight = 1 - model_output.result
            delete model_output.feasible
            delete model_output.result
            delete model_output.bounded
            
            var output_line = `${player} ${key} is dominated by`
            all_keys = Object.keys(model_output)
            const last_index = all_keys.length - 1
            var separator = ' + '

            if (last_index == 0) {
                output_line += ` ${all_keys[0]}.`
            } else{
                all_keys.forEach( (key , index) => {
                    if (index == 0) {model_output[key] += remaining_weight}
                    if (index == last_index) {separator = '.'}

                    output_line += ` ${model_output[key].toFixed(2)}*${key}${separator}`
                })
            }

            addTextToOutput(output_line)
        }

        function addTextToOutput(text) {
            const p_line = document.createElement("p")
            p_line.style.height = "20px"
            p_line.innerHTML = text
            const output_div = document.querySelector('[data-output-div]')
            output_div.appendChild(p_line)
        }
        
        function IsDominated(constraints , variables) {
            results = getDominationResults(constraints , variables)
            const result = results["result"]
            if (result < 1) {
                return true
            } 
            return false
        }
        
        function createConstraints(VariablesObject , VariableAttribute) {
            const data = VariablesObject[VariableAttribute]
            const keys = Object.keys(data)
            const constraints = {}
        
            keys.forEach( (key) => {
                if (key != "sumofp") {
                    const value = data[key]
                    constraints[key] = { "min" : value }
                }
            })
            return constraints
        }
        
        function greyOutSquare(square) {
            square.style.backgroundColor = GREY_1
            square.querySelector('[data-player-background-color="col"]').style.backgroundColor = GREY_2
            square.querySelector('[data-player-background-color="row"]').style.backgroundColor = GREY_2
            square.querySelector('[data-player-background-color="blend"]').style.backgroundColor = GREY_3
        }

        function greyOutColumn(column_no) {
            // grey out column button
            const deletebuttons = document.querySelectorAll('[data-delete-column-button]')
            deletebuttons[column_no].style.backgroundColor = GREY_2

            const rows = document.querySelectorAll('[data-row]')
            rows.forEach( (row) => {
                const board_elements = row.childNodes
                greyOutSquare(board_elements[column_no+1])
            })
        }
        
        function greyOutRow(row_no) {
            // grey out row button
            const deletebuttons = document.querySelectorAll('[data-delete-row-button]')
            deletebuttons[row_no].style.backgroundColor = GREY_2
            const row = document.querySelectorAll('[data-row]')[row_no]
            const board_elements = row.childNodes
            for(let i = 1; i < board_elements.length; i++) {
                greyOutSquare(board_elements[i])
            }
        }
        
        function getLowestNegativeInput(player_data_attribute) {
            const all_live_inputs = document.querySelectorAll(`[${player_data_attribute}="live"]`)
            
            let lowest = 0
            all_live_inputs.forEach( (input) => {
                const value = input.value
                if (parseFloat(value) < lowest) {
                    lowest = parseFloat(value)
                }
            })
            return lowest
        }

        function createRowPlayerVariables() {
            const variables = {}
        
            const live_rows = document.querySelectorAll('[data-row-is-live="true"]')
            const row_player_inputs = document.querySelectorAll('[data-row-player-input="live"]')
            const number_of_rows = getNumberOfLiveRows()
            const number_of_columns = getNumberOfLiveColumns()
            const add_to_make_positive = 1 - getLowestNegativeInput('data-row-player-input')
            
            for (let i = 0; i < parseInt(number_of_rows); i++) {
                const obj_label = live_rows[i].firstChild.firstChild.firstChild.innerHTML
                variables[obj_label] = { "sumofp" : 1 }
        
                for (let j = 0; j < parseInt(number_of_columns); j++) {
                    const cur_label = String.fromCharCode(j + ASCII_CODE_OF_a)
                    const cur_data = row_player_inputs[ (i*number_of_columns) + j ].value
                    
                    variables[obj_label][cur_label] = parseInt(cur_data) + add_to_make_positive
                }
            }
            return variables
        }
        
        function createColPlayerVariables() {
            const variables = {}
        
            const live_columns = document.querySelectorAll('[data-col-is-live="true"]')
            const col_player_inputs = document.querySelectorAll('[data-col-player-input="live"]')
            const number_of_rows = getNumberOfLiveRows()
            const number_of_columns = getNumberOfLiveColumns()
            const add_to_make_positive = 1 - getLowestNegativeInput('data-col-player-input') 
        
            for (let i = 0; i < number_of_columns*number_of_rows; i++) {
            }
            for (let i = 0; i < parseInt(number_of_columns); i++) {
                // label is set to label of column - firstChild.firstChild.innerHTML gets the label value from the <span> within the <button> within the parent <div>
                const obj_label = live_columns[i].firstChild.firstChild.innerHTML
                variables[obj_label] = { "sumofp" : 1 }
        
                for (let j = 0; j < parseInt(number_of_rows); j++) {
                    const cur_label = String.fromCharCode(j + ASCII_CODE_OF_A) 
                    const cur_data = col_player_inputs[ (j*number_of_columns) + i ].value
        
                    variables[obj_label][cur_label] = parseInt(cur_data) + add_to_make_positive
                }
            }
            return variables
        }
        
        function getNumberOfLiveRows() {
            const rows = BOARD.querySelectorAll('[data-row-is-live="true"]')
            return rows.length
        }
        
        function getNumberOfLiveColumns() {
            const row_player_inputs = document.querySelectorAll('[data-row-player-input="live"]')
            const total_elements = row_player_inputs.length
            const num_of_rows = getNumberOfLiveRows()
            return parseInt(total_elements / num_of_rows)
        }
        
        function removeBoardColor() {
            const color_divs = document.querySelectorAll('[data-player-background-color]')

            color_divs.forEach( (div) => {
                div.style.backgroundColor = null
            })
        }

        function addBoardColor() {
            const color_divs = document.querySelectorAll('[data-player-background-color]')

            color_divs.forEach( (div) => {
                if (div.dataset.playerBackgroundColor === "col") {
                    div.style.backgroundColor = COL_PLAYER_COLOR
                } else if (div.dataset.playerBackgroundColor === "row") {
                    div.style.backgroundColor = ROW_PLAYER_COLOR
                } else {
                    div.style.backgroundColor = BLEND_COLOR
                }
            })

            const board_elements = document.querySelectorAll('[data-board-element]')
            board_elements.forEach( (element) => {
                element.style.backgroundColor = ""
            })

            const col_delete_buttons = document.querySelectorAll('[data-delete-column-button')
            const row_delete_buttons = document.querySelectorAll('[data-delete-row-button]')

            col_delete_buttons.forEach( (button) => {
                button.style.backgroundColor = COL_PLAYER_COLOR
            })

            row_delete_buttons.forEach( (button) => {
                button.style.backgroundColor = ROW_PLAYER_COLOR
            })
        }

        function Unlock() {
            reEnableBoard()
            const button = document.querySelector('[data-locked]')
            const next_step_button = document.querySelector('[data-next-step-button]')
            next_step_button.disabled = false
            button.dataset.locked = false
            button.disabled = true
            button.innerHTML = '<li class="fas fa-lock-open" aria-hidden="true"></li>'
            addBoardColor() 
        }

        function Lock() {
            if (!ValidateInputs()) return
            resetDomination()
            const button = document.querySelector('[data-locked]')
            const next_step_button = document.querySelector('[data-next-step-button]')

            next_step_button.dataset.currentKey = "a"
            next_step_button.dataset.rowOrCol = "col"

            
            disableBoard()
            button.dataset.locked = true
            button.disabled = false
            button.innerHTML = '<li class="fas fa-lock" aria-hidden="true"></li>'
        }

        function lockButton() {
            const button = document.querySelector('[data-locked]')
            // unlock:
            if (button.dataset.locked == "true") {
                Unlock()
            } // lock:
            else {
                Lock()
            }
        }
        
        function disableBoard() {
            disableAllInputs()
            disableRowAndColumnButtons()
        }
        
        function reEnableBoard() {
            disableAllInputs(disable=false)
            disableRowAndColumnButtons(disable=false)
        }
        
        function disableRowAndColumnButtons(disable=true) {
            const row_buttons = document.querySelectorAll("[data-delete-row-button]")
            const col_buttons = document.querySelectorAll("[data-delete-column-button]")
        
            row_buttons.forEach( (button) => {
                button.disabled = disable
            })
        
            col_buttons.forEach( (button) => {
                button.disabled = disable
            })
        
            const add_row_button = document.querySelector("[data-add-new-row-button]")
            const add_col_button = document.querySelector("[data-add-new-col-button]")
        
            add_row_button.disabled = disable
            add_col_button.disabled = disable
        }
        
        function disableAllInputs(disable=true) {
            const row_player_inputs = document.querySelectorAll("[data-row-player-input]")
            const col_player_inputs = document.querySelectorAll("[data-col-player-input]")
        
            row_player_inputs.forEach( (input) => {
                input.disabled = disable
            })
        
            col_player_inputs.forEach( (input) => {
                input.disabled = disable
            })
        }
        function ValidateInputs(error_color="red") {
            const row_player_inputs = document.querySelectorAll("[data-row-player-input]")
            const col_player_inputs = document.querySelectorAll("[data-col-player-input]")
        
            var valid_input_flag = true
        
            row_player_inputs.forEach( (input) => {
                if (isNaN(parseFloat(input.value))) {
                    setInputBorderColor(input , error_color)
                    valid_input_flag = false
                } else {
                    setInputBorderColor(input)
                }
            })
            col_player_inputs.forEach( (input) => {
                if (isNaN(parseFloat(input.value))) {
                    setInputBorderColor(input , error_color)
                    valid_input_flag = false
                } else {
                    setInputBorderColor(input)
                }
            })
            return valid_input_flag
        }
        
        function setInputBorderColor(element , color="rgba(143, 189, 187, 0.308)") {
            element.style.setProperty('--background-color', `${color}`)
        }
        
        function revertBoardColor(color="white") {
            const number_of_rows = document.querySelectorAll("[data-row-is-live]").length
            for (let i = 0; i < number_of_rows; i++) {
                greyOutRow(i , "white" , "white" , "white")
            }
        }
        
        function resetDomination() {
            const all_rows = document.querySelectorAll('[data-row-is-live]')
            all_rows.forEach( (row) => {
                row.dataset.rowIsLive = "true"
            })
        
            const all_columns = document.querySelectorAll('[data-col-is-live]')
            all_columns.forEach( (col) => {
                col.dataset.colIsLive = "true"
            })
            const row_player_inputs = document.querySelectorAll('[data-row-player-input]')
            const col_player_inputs = document.querySelectorAll('[data-col-player-input]')
        
            row_player_inputs.forEach( (input) => {
                input.dataset.rowPlayerInput = "live"
            })
        
            col_player_inputs.forEach( (input) => {
                input.dataset.colPlayerInput = "live"
            })
        
        }
        
        const next_step_button = document.querySelector('[data-next-step-button]')
        next_step_button.addEventListener('click' , NewIteratedDominanceStep)
        
        const lock_button = document.querySelector('[data-locked]')
        lock_button.addEventListener('click' , lockButton)

        function CreateExamplesMenu() {
            const examples_menu_content = document.querySelector("[data-examples-menu-content]")
        
            ARRAY_EXAMPLES.forEach( (example, index) => {
                const element = document.createElement("div")
                const text = document.createElement("p")
                element.classList.add("mouse-click-icon")
                element.classList.add("hover-grey")
                element.dataset.index = index
                text.innerHTML = example.name
                element.appendChild(text)
                element.addEventListener('click', () => {
                    clearOutput()
                    CreateCustomBoard(element.dataset.index)
                })
                examples_menu_content.appendChild(element)
            })
        }
        
        function CreateCustomBoard(index) {
        
            ClearBoard()
        
            const setup_obj = ARRAY_EXAMPLES[parseInt(index)]
        
            for (let i = 0; i < setup_obj.x_dimension; i++) {AddCol()}
            for (let i = 0; i < setup_obj.y_dimension; i++) {AddRow()}
        
            const custom_row_inputs = setup_obj.row_body
            const custom_col_inputs = setup_obj.column_body
        
            const row_player_inputs = document.querySelectorAll("[data-row-player-input]")
            const col_player_inputs = document.querySelectorAll("[data-col-player-input]")
        
            row_player_inputs.forEach( (input, index) => {
                input.value = custom_row_inputs[index]
            })
        
            col_player_inputs.forEach( (input, index) => {
                input.value = custom_col_inputs[index]
            })
        
            Unlock()
        }
        
        function ClearBoard() {
            const number_of_columns = getComputedStyle(BOARD).getPropertyValue('--num-of-cols') - 1
            const number_of_rows = getComputedStyle(BOARD).getPropertyValue('--num-of-rows') - 1
            const delete_col_divs = document.querySelectorAll("[data-delete-col-div]")
            const delete_row_divs = document.querySelectorAll("[data-delete-row-div]")
        
            for (let i = number_of_columns-1; i >= 0; i--) {DeleteColumn(delete_col_divs[i] , validate=false)}
            for (let i =number_of_rows-1; i >= 0; i--) {DeleteRow(delete_row_divs[i] , validate=false)}
        }
        CreateExamplesMenu()
        CreateCustomBoard(0)
    },{"../javascript-lp-solver/src/solver.js":21}],23:[function(require,module,exports){
    
    },{}]},{},[22]);
    
