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
			errors: [ { message: "Combine this with the previous \'var\' statement." } ]
		},
		{
			code: "var x = require('z'), y = 1;",
			errors: [ { message: "Do not mix \'require\' and other declarations." } ]
		},
		{
			code: "var x = require('a'); var y = require('b');",
			errors: [ { message: "Combine this with the previous \'var\' statement." } ]
		}
	]
});

