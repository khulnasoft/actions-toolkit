"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.satisfies = exports.getVersion = exports.getConfig = exports.getConfigFile = exports.getConfigInline = void 0;
const fs = __importStar(require("fs"));
const semver = __importStar(require("semver"));
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const buildx = __importStar(require("./buildx"));
const util = __importStar(require("./util"));
function getConfigInline(s) {
    return __awaiter(this, void 0, void 0, function* () {
        return getConfig(s, false);
    });
}
exports.getConfigInline = getConfigInline;
function getConfigFile(s) {
    return __awaiter(this, void 0, void 0, function* () {
        return getConfig(s, true);
    });
}
exports.getConfigFile = getConfigFile;
function getConfig(s, file) {
    return __awaiter(this, void 0, void 0, function* () {
        if (file) {
            if (!fs.existsSync(s)) {
                throw new Error(`config file ${s} not found`);
            }
            s = fs.readFileSync(s, { encoding: 'utf-8' });
        }
        const configFile = util.tmpNameSync({
            tmpdir: util.tmpDir()
        });
        fs.writeFileSync(configFile, s);
        return configFile;
    });
}
exports.getConfig = getConfig;
function getVersion(builderName, standalone) {
    return __awaiter(this, void 0, void 0, function* () {
        const builder = yield buildx.inspect(builderName, standalone);
        if (builder.nodes.length == 0) {
            // a builder always have on node, should not happen.
            return undefined;
        }
        // TODO: get version for all nodes
        const node = builder.nodes[0];
        if (!node.buildkit && node.name) {
            try {
                return yield getVersionWithinImage(node.name);
            }
            catch (e) {
                core.warning(e);
            }
        }
        return node.buildkit;
    });
}
exports.getVersion = getVersion;
function getVersionWithinImage(nodeName) {
    return __awaiter(this, void 0, void 0, function* () {
        return exec
            .getExecOutput(`docker`, ['inspect', '--format', '{{.Config.Image}}', `buildx_buildkit_${nodeName}`], {
            ignoreReturnCode: true,
            silent: true
        })
            .then(bkitimage => {
            if (bkitimage.exitCode == 0 && bkitimage.stdout.length > 0) {
                return exec
                    .getExecOutput(`docker`, ['run', '--rm', bkitimage.stdout.trim(), '--version'], {
                    ignoreReturnCode: true,
                    silent: true
                })
                    .then(bkitversion => {
                    if (bkitversion.exitCode == 0 && bkitversion.stdout.length > 0) {
                        return `${bkitimage.stdout.trim()} => ${bkitversion.stdout.trim()}`;
                    }
                    else if (bkitversion.stderr.length > 0) {
                        throw new Error(bkitimage.stderr.trim());
                    }
                    return bkitversion.stdout.trim();
                });
            }
            else if (bkitimage.stderr.length > 0) {
                throw new Error(bkitimage.stderr.trim());
            }
            return bkitimage.stdout.trim();
        });
    });
}
function satisfies(builderName, range, standalone) {
    return __awaiter(this, void 0, void 0, function* () {
        const builder = yield buildx.inspect(builderName, standalone);
        for (const node of builder.nodes) {
            let bkversion = node.buildkit;
            if (!bkversion) {
                try {
                    bkversion = yield getVersionWithinImage(node.name || '');
                }
                catch (e) {
                    return false;
                }
            }
            // BuildKit version reported by moby is in the format of `v0.11.0-moby`
            if (builder.driver == 'docker' && !bkversion.endsWith('-moby')) {
                return false;
            }
            if (!semver.satisfies(bkversion.replace(/-moby$/, ''), range)) {
                return false;
            }
        }
        return true;
    });
}
exports.satisfies = satisfies;
