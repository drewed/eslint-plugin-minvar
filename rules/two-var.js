/**
 * ESLint Rule: two-var
 *
 * Ensures that you have one block for require() statements and another block for
 * all of the rest of your var statements.
 */

"use strict";

module.exports = function (context) {

	var MODE_ALWAYS = "always",
		MODE_NEVER = "never";

	var mode = context.options[0] || "always"; // new default

	var options = {
	};

	if (typeof mode === "string") { // simple options configuration with just a string
		options.var = { uninitialized: mode, initialized: mode};
		options.let = { uninitialized: mode, initialized: mode};
		options.const = { uninitialized: mode, initialized: mode};
	} else if (typeof mode === "object") { // options configuration is an object
		if (mode.hasOwnProperty("var") && typeof mode.var === "string") {
			options.var = { uninitialized: mode.var, initialized: mode.var};
		}
		if (mode.hasOwnProperty("let") && typeof mode.let === "string") {
			options.let = { uninitialized: mode.let, initialized: mode.let};
		}
		if (mode.hasOwnProperty("const") && typeof mode.const === "string") {
			options.const = { uninitialized: mode.const, initialized: mode.const};
		}
		if (mode.hasOwnProperty("uninitialized")) {
			if (!options.var) {
				options.var = {};
			}
			if (!options.let) {
				options.let = {};
			}
			if (!options.const) {
				options.const = {};
			}
			options.var.uninitialized = mode.uninitialized;
			options.let.uninitialized = mode.uninitialized;
			options.const.uninitialized = mode.uninitialized;
		}
		if (mode.hasOwnProperty("initialized")) {
			if (!options.var) {
				options.var = {};
			}
			if (!options.let) {
				options.let = {};
			}
			if (!options.const) {
				options.const = {};
			}
			options.var.initialized = mode.initialized;
			options.let.initialized = mode.initialized;
			options.const.initialized = mode.initialized;
		}
	}

	//--------------------------------------------------------------------------
	// Helpers
	//--------------------------------------------------------------------------

	var functionStack = [];
	var blockStack = [];

	/**
	 * Increments the blockStack counter.
	 * @returns {void}
	 * @private
	 */
	function startBlock() {
		blockStack.push({
			let: {initialized: false, uninitialized: false},
			const: {initialized: false, uninitialized: false}
		});
	}

	/**
	 * Increments the functionStack counter.
	 * @returns {void}
	 * @private
	 */
	function startFunction() {
		functionStack.push({initialized: false, uninitialized: false});
		startBlock();
	}

	/**
	 * Decrements the blockStack counter.
	 * @returns {void}
	 * @private
	 */
	function endBlock() {
		blockStack.pop();
	}

	/**
	 * Decrements the functionStack counter.
	 * @returns {void}
	 * @private
	 */
	function endFunction() {
		functionStack.pop();
		endBlock();
	}

	/**
	 * Records whether initialized or uninitialized variables are defined in current scope.
	 * @param {string} statementType node.kind, one of: "var", "let", or "const"
	 * @param {ASTNode[]} declarations List of declarations
	 * @param {Object} currentScope The scope being investigated
	 * @returns {void}
	 * @private
	 */
	function recordTypes(statementType, declarations, currentScope) {
		for (var i = 0; i < declarations.length; i++) {
			if (declarations[i].init === null) {
				if (options[statementType] && options[statementType].uninitialized === MODE_ALWAYS) {
					currentScope.uninitialized = true;
				}
			} else {
				if (options[statementType] && options[statementType].initialized === MODE_ALWAYS) {
					currentScope.initialized = true;
				}
			}
		}
	}

	/**
	 * Determines the current scope (function or block)
	 * @param  {string} statementType node.kind, one of: "var", "let", or "const"
	 * @returns {Object} The scope associated with statementType
	 */
	function getCurrentScope(statementType) {
		var currentScope;
		if (statementType === "var") {
			currentScope = functionStack[functionStack.length - 1];
		} else if (statementType === "let") {
			currentScope = blockStack[blockStack.length - 1].let;
		} else if (statementType === "const") {
			currentScope = blockStack[blockStack.length - 1].const;
		}
		return currentScope;
	}

	/**
	 * Counts the number of initialized and uninitialized declarations in a list of declarations
	 * @param {ASTNode[]} declarations List of declarations
	 * @returns {Object} Counts of 'uninitialized' and 'initialized' declarations
	 * @private
	 */
	function countDeclarations(declarations) {
		var counts = { uninitialized: 0, initialized: 0 };
		for (var i = 0; i < declarations.length; i++) {
			if (declarations[i].init === null) {
				counts.uninitialized++;
			} else {
				counts.initialized++;
			}
		}
		return counts;
	}

	/**
	 * Determines if there is more than one var statement in the current scope.
	 * @param {string} statementType node.kind, one of: "var", "let", or "const"
	 * @param {ASTNode[]} declarations List of declarations
	 * @returns {boolean} Returns true if it is the first var declaration, false if not.
	 * @private
	 */
	function hasOnlyOneStatement(statementType, declarations) {

		var declarationCounts = countDeclarations(declarations);
		var currentOptions = options[statementType] || {};
		var currentScope = getCurrentScope(statementType);

		if (currentOptions.uninitialized === MODE_ALWAYS && currentOptions.initialized === MODE_ALWAYS) {
			if (currentScope.uninitialized || currentScope.initialized) {
				return false;
			}
		}

		if (declarationCounts.uninitialized > 0) {
			if (currentOptions.uninitialized === MODE_ALWAYS && currentScope.uninitialized) {
				return false;
			}
		}
		if (declarationCounts.initialized > 0) {
			if (currentOptions.initialized === MODE_ALWAYS && currentScope.initialized) {
				return false;
			}
		}
		recordTypes(statementType, declarations, currentScope);
		return true;
	}

	/**
	 * Returns the list of built-in modules.
	 *
	 * @returns {string[]} An array of built-in Node.js modules.
	 */
	function getBuiltinModules() {
		// This list is generated using `require("repl")._builtinLibs.concat('repl').sort()`
		// This particular list is as per nodejs v0.12.2 and iojs v0.7.1
		return [
			"assert", "buffer", "child_process", "cluster", "crypto",
			"dgram", "dns", "domain", "events", "fs", "http", "https",
			"net", "os", "path", "punycode", "querystring", "readline",
			"repl", "smalloc", "stream", "string_decoder", "tls", "tty",
			"url", "util", "v8", "vm", "zlib"
		];
	}

	var BUILTIN_MODULES = getBuiltinModules();

	var DECL_REQUIRE = "require",
		DECL_UNINITIALIZED = "uninitialized",
		DECL_OTHER = "other";

	var REQ_CORE = "core",
		REQ_FILE = "file",
		REQ_MODULE = "module",
		REQ_COMPUTED = "computed";

	/**
	 * Determines the type of a declaration statement.
	 * @param {ASTNode} initExpression The init node of the VariableDeclarator.
	 * @returns {string} The type of declaration represented by the expression.
	 */
	function getDeclarationType(initExpression) {
		if (!initExpression) {
			// "var x;"
			return DECL_UNINITIALIZED;
		}

		if (initExpression.type === "CallExpression" &&
			initExpression.callee.type === "Identifier" &&
			initExpression.callee.name === "require"
		) {
			// "var x = require('util');"
			return DECL_REQUIRE;
		} else if (initExpression.type === "MemberExpression") {
			// "var x = require('glob').Glob;"
			return getDeclarationType(initExpression.object);
		}

		// "var x = 42;"
		return DECL_OTHER;
	}

	/**
	 * Determines the type of module that is loaded via require.
	 * @param {ASTNode} initExpression The init node of the VariableDeclarator.
	 * @returns {string} The module type.
	 */
	function inferModuleType(initExpression) {
		if (initExpression.type === "MemberExpression") {
			// "var x = require('glob').Glob;"
			return inferModuleType(initExpression.object);
		} else if (initExpression.arguments.length === 0) {
			// "var x = require();"
			return REQ_COMPUTED;
		}

		var arg = initExpression.arguments[0];

		if (arg.type !== "Literal" || typeof arg.value !== "string") {
			// "var x = require(42);"
			return REQ_COMPUTED;
		}

		if (BUILTIN_MODULES.indexOf(arg.value) !== -1) {
			// "var fs = require('fs');"
			return REQ_CORE;
		} else if (/^\.{0,2}\//.test(arg.value)) {
			// "var utils = require('./utils');"
			return REQ_FILE;
		} else {
			// "var async = require('async');"
			return REQ_MODULE;
		}
	}

	/**
	 * Check if the list of variable declarations is mixed, i.e. whether it
	 * contains both require and other declarations.
	 * @param {ASTNode} declarations The list of VariableDeclarators.
	 * @returns {boolean} True if the declarations are mixed, false if not.
	 */
	function isMixed(declarations) {
		var contains = {};

		declarations.forEach(function(declaration) {
			var type = getDeclarationType(declaration.init);
			contains[type] = true;
		});

		return !!(
			contains[DECL_REQUIRE] &&
			(contains[DECL_UNINITIALIZED] || contains[DECL_OTHER])
		);
	}

	/**
	 * Check if all require declarations in the given list are of the same
	 * type.
	 * @param {ASTNode} declarations The list of VariableDeclarators.
	 * @returns {boolean} True if the declarations are grouped, false if not.
	 */
	function isGrouped(declarations) {
		var found = {};

		declarations.forEach(function(declaration) {
			if (getDeclarationType(declaration.init) === DECL_REQUIRE) {
				found[inferModuleType(declaration.init)] = true;
			}
		});

		return Object.keys(found).length <= 1;
	}

	function varDeclOneVar(node) {
		var parent = node.parent,
			type, declarations, declarationCounts;

		type = node.kind;
		if (!options[type]) {
			return;
		}

		declarations = node.declarations;
		declarationCounts = countDeclarations(declarations);

		// always
		if (!hasOnlyOneStatement(type, declarations)) {
			if (options[type].initialized === MODE_ALWAYS && options[type].uninitialized === MODE_ALWAYS) {
				context.report(node, "Combine this with the previous '" + type + "' statement.");
			} else {
				if (options[type].initialized === MODE_ALWAYS) {
					context.report(node, "Combine this with the previous '" + type + "' statement with initialized variables.");
				}
				if (options[type].uninitialized === MODE_ALWAYS) {
					context.report(node, "Combine this with the previous '" + type + "' statement with uninitialized variables.");
				}
			}
		}
		// never
		if (parent.type !== "ForStatement" || parent.init !== node) {
			var totalDeclarations = declarationCounts.uninitialized + declarationCounts.initialized;
			if (totalDeclarations > 1) {
				// both initialized and uninitialized
				if (options[type].initialized === MODE_NEVER && options[type].uninitialized === MODE_NEVER) {
					context.report(node, "Split '" + type + "' declarations into multiple statements.");
					// initialized
				} else if (options[type].initialized === MODE_NEVER && declarationCounts.initialized > 0) {
					context.report(node, "Split initialized '" + type + "' declarations into multiple statements.");
					// uninitialized
				} else if (options[type].uninitialized === MODE_NEVER && declarationCounts.uninitialized > 0) {
					context.report(node, "Split uninitialized '" + type + "' declarations into multiple statements.");
				}
			}
		}
	}

	function varDeclNoMixed(node) {
		var grouping = !!context.options[0];

		if (isMixed(node.declarations)) {
			context.report(
				node,
				"Do not mix 'require' and other declarations."
			);
		} else if (grouping && !isGrouped(node.declarations)) {
			context.report(
				node,
				"Do not mix core, module, file and computed requires."
			);
		}
	}

	return {
		"Program": startFunction,
		"FunctionDeclaration": startFunction,
		"FunctionExpression": startFunction,
		"ArrowFunctionExpression": startFunction,
		"BlockStatement": startBlock,
		"ForStatement": startBlock,
		"ForInStatement": startBlock,
		"ForOfStatement": startBlock,
		"SwitchStatement": startBlock,
		"ForStatement:exit": endBlock,
		"ForOfStatement:exit": endBlock,
		"ForInStatement:exit": endBlock,
		"SwitchStatement:exit": endBlock,
		"BlockStatement:exit": endBlock,
		"Program:exit": endFunction,
		"FunctionDeclaration:exit": endFunction,
		"FunctionExpression:exit": endFunction,
		"ArrowFunctionExpression:exit": endFunction,
		"VariableDeclaration": function(node) {
			varDeclOneVar(node);
			varDeclNoMixed(node);
		}
	};

};
