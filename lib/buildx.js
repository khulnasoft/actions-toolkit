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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommand = exports.satisfies = exports.parseVersion = exports.getVersion = exports.parseInspect = exports.inspect = exports.isAvailable = exports.hasGitAuthToken = exports.hasLocalOrTarExporter = exports.hasTarExporter = exports.hasLocalExporter = exports.getSecret = exports.getSecretFile = exports.getSecretString = exports.getDigest = exports.getMetadata = exports.getMetadataFile = exports.getImageID = exports.getImageIDFile = void 0;
const sync_1 = require("csv-parse/sync");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const semver = __importStar(require("semver"));
const exec = __importStar(require("@actions/exec"));
const util = __importStar(require("./util"));
function getImageIDFile() {
    return __awaiter(this, void 0, void 0, function* () {
        return path_1.default.join(util.tmpDir(), 'iidfile').split(path_1.default.sep).join(path_1.default.posix.sep);
    });
}
exports.getImageIDFile = getImageIDFile;
function getImageID() {
    return __awaiter(this, void 0, void 0, function* () {
        const iidFile = yield getImageIDFile();
        if (!fs_1.default.existsSync(iidFile)) {
            return undefined;
        }
        return fs_1.default.readFileSync(iidFile, { encoding: 'utf-8' }).trim();
    });
}
exports.getImageID = getImageID;
function getMetadataFile() {
    return __awaiter(this, void 0, void 0, function* () {
        return path_1.default.join(util.tmpDir(), 'metadata-file').split(path_1.default.sep).join(path_1.default.posix.sep);
    });
}
exports.getMetadataFile = getMetadataFile;
function getMetadata() {
    return __awaiter(this, void 0, void 0, function* () {
        const metadataFile = yield getMetadataFile();
        if (!fs_1.default.existsSync(metadataFile)) {
            return undefined;
        }
        const content = fs_1.default.readFileSync(metadataFile, { encoding: 'utf-8' }).trim();
        if (content === 'null') {
            return undefined;
        }
        return content;
    });
}
exports.getMetadata = getMetadata;
function getDigest(metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        if (metadata === undefined) {
            return undefined;
        }
        const metadataJSON = JSON.parse(metadata);
        if (metadataJSON['containerimage.digest']) {
            return metadataJSON['containerimage.digest'];
        }
        return undefined;
    });
}
exports.getDigest = getDigest;
function getSecretString(kvp) {
    return __awaiter(this, void 0, void 0, function* () {
        return getSecret(kvp, false);
    });
}
exports.getSecretString = getSecretString;
function getSecretFile(kvp) {
    return __awaiter(this, void 0, void 0, function* () {
        return getSecret(kvp, true);
    });
}
exports.getSecretFile = getSecretFile;
function getSecret(kvp, file) {
    return __awaiter(this, void 0, void 0, function* () {
        const delimiterIndex = kvp.indexOf('=');
        const key = kvp.substring(0, delimiterIndex);
        let value = kvp.substring(delimiterIndex + 1);
        if (key.length == 0 || value.length == 0) {
            throw new Error(`${kvp} is not a valid secret`);
        }
        if (file) {
            if (!fs_1.default.existsSync(value)) {
                throw new Error(`secret file ${value} not found`);
            }
            value = fs_1.default.readFileSync(value, { encoding: 'utf-8' });
        }
        const secretFile = util.tmpNameSync({
            tmpdir: util.tmpDir()
        });
        fs_1.default.writeFileSync(secretFile, value);
        return `id=${key},src=${secretFile}`;
    });
}
exports.getSecret = getSecret;
function hasLocalExporter(outputs) {
    return hasExporterType('local', outputs);
}
exports.hasLocalExporter = hasLocalExporter;
function hasTarExporter(outputs) {
    return hasExporterType('tar', outputs);
}
exports.hasTarExporter = hasTarExporter;
function hasLocalOrTarExporter(outputs) {
    return hasLocalExporter(outputs) || hasTarExporter(outputs);
}
exports.hasLocalOrTarExporter = hasLocalOrTarExporter;
function hasExporterType(name, outputs) {
    const records = (0, sync_1.parse)(outputs.join(`\n`), {
        delimiter: ',',
        trim: true,
        columns: false,
        relaxColumnCount: true
    });
    for (const record of records) {
        if (record.length == 1 && !record[0].startsWith('type=')) {
            // Local if no type is defined
            // https://github.com/docker/buildx/blob/d2bf42f8b4784d83fde17acb3ed84703ddc2156b/build/output.go#L29-L43
            return name == 'local';
        }
        for (const [key, value] of record.map(chunk => chunk.split('=').map(item => item.trim()))) {
            if (key == 'type' && value == name) {
                return true;
            }
        }
    }
    return false;
}
function hasGitAuthToken(secrets) {
    for (const secret of secrets) {
        if (secret.startsWith('GIT_AUTH_TOKEN=')) {
            return true;
        }
    }
    return false;
}
exports.hasGitAuthToken = hasGitAuthToken;
function isAvailable(standalone) {
    return __awaiter(this, void 0, void 0, function* () {
        const cmd = getCommand([], standalone);
        return yield exec
            .getExecOutput(cmd.command, cmd.args, {
            ignoreReturnCode: true,
            silent: true
        })
            .then(res => {
            if (res.stderr.length > 0 && res.exitCode != 0) {
                return false;
            }
            return res.exitCode == 0;
        })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .catch(error => {
            return false;
        });
    });
}
exports.isAvailable = isAvailable;
function inspect(name, standalone) {
    return __awaiter(this, void 0, void 0, function* () {
        const cmd = getCommand(['inspect', name], standalone);
        return yield exec
            .getExecOutput(cmd.command, cmd.args, {
            ignoreReturnCode: true,
            silent: true
        })
            .then(res => {
            if (res.stderr.length > 0 && res.exitCode != 0) {
                throw new Error(res.stderr.trim());
            }
            return parseInspect(res.stdout);
        });
    });
}
exports.inspect = inspect;
function parseInspect(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const builder = {
            nodes: []
        };
        let node = {};
        for (const line of data.trim().split(`\n`)) {
            const [key, ...rest] = line.split(':');
            const value = rest.map(v => v.trim()).join(':');
            if (key.length == 0 || value.length == 0) {
                continue;
            }
            switch (key.toLowerCase()) {
                case 'name': {
                    if (builder.name == undefined) {
                        builder.name = value;
                    }
                    else {
                        if (Object.keys(node).length > 0) {
                            builder.nodes.push(node);
                            node = {};
                        }
                        node.name = value;
                    }
                    break;
                }
                case 'driver': {
                    builder.driver = value;
                    break;
                }
                case 'last activity': {
                    builder['last-activity'] = new Date(value);
                    break;
                }
                case 'endpoint': {
                    node.endpoint = value;
                    break;
                }
                case 'driver options': {
                    node['driver-opts'] = (value.match(/(\w+)="([^"]*)"/g) || []).map(v => v.replace(/^(.*)="(.*)"$/g, '$1=$2'));
                    break;
                }
                case 'status': {
                    node.status = value;
                    break;
                }
                case 'flags': {
                    node['buildkitd-flags'] = value;
                    break;
                }
                case 'buildkit': {
                    node.buildkit = value;
                    break;
                }
                case 'platforms': {
                    let platforms = [];
                    // if a preferred platform is being set then use only these
                    // https://docs.docker.com/engine/reference/commandline/buildx_inspect/#get-information-about-a-builder-instance
                    if (value.includes('*')) {
                        for (const platform of value.split(', ')) {
                            if (platform.includes('*')) {
                                platforms.push(platform.replace('*', ''));
                            }
                        }
                    }
                    else {
                        // otherwise set all platforms available
                        platforms = value.split(', ');
                    }
                    node.platforms = platforms.join(',');
                    break;
                }
            }
        }
        if (Object.keys(node).length > 0) {
            builder.nodes.push(node);
        }
        return builder;
    });
}
exports.parseInspect = parseInspect;
function getVersion(standalone) {
    return __awaiter(this, void 0, void 0, function* () {
        const cmd = getCommand(['version'], standalone);
        return yield exec
            .getExecOutput(cmd.command, cmd.args, {
            ignoreReturnCode: true,
            silent: true
        })
            .then(res => {
            if (res.stderr.length > 0 && res.exitCode != 0) {
                throw new Error(res.stderr.trim());
            }
            return parseVersion(res.stdout.trim());
        });
    });
}
exports.getVersion = getVersion;
function parseVersion(stdout) {
    const matches = /\sv?([0-9a-f]{7}|[0-9.]+)/.exec(stdout);
    if (!matches) {
        throw new Error(`Cannot parse buildx version`);
    }
    return matches[1];
}
exports.parseVersion = parseVersion;
function satisfies(version, range) {
    return semver.satisfies(version, range) || /^[0-9a-f]{7}$/.exec(version) !== null;
}
exports.satisfies = satisfies;
function getCommand(args, standalone) {
    return {
        command: standalone ? 'buildx' : 'docker',
        args: standalone ? args : ['buildx', ...args]
    };
}
exports.getCommand = getCommand;
