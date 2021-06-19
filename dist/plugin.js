"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InjectVersionPlugin = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const map_workspaces_1 = __importDefault(require("@npmcli/map-workspaces"));
const component_1 = require("typedoc/dist/lib/utils/component");
const components_1 = require("typedoc/dist/lib/converter/components");
const typedoc_1 = require("typedoc");
let InjectVersionPlugin = class InjectVersionPlugin extends components_1.ConverterComponent {
    initialize() {
        this.listenTo(this.owner, typedoc_1.Converter.EVENT_RESOLVE_END, this.onEndResolve);
    }
    onEndResolve(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const { packageInfo } = context.project;
            if (!packageInfo)
                return;
            const { name, version } = packageInfo;
            const foundVersions = { [name]: version };
            let directory = context.project.directory;
            while (directory.parent)
                directory = directory.parent;
            const workspaces = yield map_workspaces_1.default({
                cwd: directory.dirName || process.cwd(),
                pkg: packageInfo,
            });
            for (const [name, workspace] of workspaces.entries()) {
                const file = yield fs.readFile(path.resolve(workspace, 'package.json'), 'utf8');
                const { version } = JSON.parse(file);
                if (!foundVersions[name]) {
                    foundVersions[name] = version;
                }
            }
            const mapping = new Map();
            // TODO: add reasonable defaults
            const versionsMapping = typeof this.versionsMapping === 'string'
                ? { [this.versionsMapping || '__version__']: name }
                : this.versionsMapping;
            for (const [pattern, replacement] of Object.entries(versionsMapping)) {
                try {
                    mapping.set(new RegExp(pattern), replacement);
                }
                catch (_a) {
                    this.application.logger.error(`Failed to parse link pattern ${pattern}.`);
                }
            }
            context.project.getReflectionsByKind(typedoc_1.ReflectionKind.Variable).forEach(reflection => {
                mapping.forEach((replacement, reg) => {
                    const { defaultValue } = reflection;
                    if (!defaultValue)
                        return;
                    const char = defaultValue.charAt(0);
                    const pkg = defaultValue.substr(1, defaultValue.length - 2).replace(reg, replacement);
                    reflection.defaultValue = `${char}${foundVersions[pkg]}${char}`;
                });
            });
        });
    }
};
__decorate([
    typedoc_1.BindOption('versionsMapping')
], InjectVersionPlugin.prototype, "versionsMapping", void 0);
InjectVersionPlugin = __decorate([
    component_1.Component({ name: 'inject-version' })
], InjectVersionPlugin);
exports.InjectVersionPlugin = InjectVersionPlugin;
