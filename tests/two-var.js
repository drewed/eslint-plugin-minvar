"use strict";

var eslint = require("eslint"),
	ESLintTester = require("eslint-tester");

var linter = eslint.linter,
	eslintTester = new ESLintTester(linter);

eslintTester.addRuleTest("rules/two-var", {
	valid: [
		"var validVariable = true",
		"var x = 1, y = 1",
		"var x = 1;",
		"var x = 1; var y = require('z');",
		"var x = 1;\n\nvar y = require('z');"
	],

	invalid: [
		{
			code: "var x = 1; var y = 1;",
			errors: [ { message: "Unexpected invalid variable." } ]
		},
		{
			code: "var x = require('z'), y = 1;",
			errors: [ { message: "Unexpected invalid variable." } ]
		},
		{
			code: "var x = require('a'); var y = require('b');",
			errors: [ { message: "Unexpected invalid variable." } ]
		}
	]
});

