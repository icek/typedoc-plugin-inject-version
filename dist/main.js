"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.load = void 0;
const plugin_1 = require("./plugin");
const utils_1 = require("typedoc/dist/lib/utils");
function load(app) {
    app.options.addDeclaration({
        name: 'versionsMapping',
        type: utils_1.ParameterType.Mixed,
        help: '',
    });
    app.converter.addComponent('inject-version', new plugin_1.InjectVersionPlugin(app.converter));
}
exports.load = load;
