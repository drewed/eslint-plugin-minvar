/**
 * ESLint Plugin: two-var
 *
 * A simple plugin that exports the two-var rule.
 */
"use strict";

module.exports = {
	rules: {
		"two-var": require("./rules/two-var")
	}
};
