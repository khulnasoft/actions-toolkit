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
exports.isValidUrl = exports.asyncForEach = exports.getInputList = exports.select = exports.tmpNameSync = exports.tmpDir = exports.defaultContext = void 0;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const tmp = __importStar(require("tmp"));
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const sync_1 = require("csv-parse/sync");
let _defaultContext, _tmpDir;
function defaultContext() {
    if (!_defaultContext) {
        let ref = github.context.ref;
        if (github.context.sha && ref && !ref.startsWith('refs/')) {
            ref = `refs/heads/${github.context.ref}`;
        }
        if (github.context.sha && !ref.startsWith(`refs/pull/`)) {
            ref = github.context.sha;
        }
        _defaultContext = `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${github.context.repo.owner}/${github.context.repo.repo}.git#${ref}`;
    }
    return _defaultContext;
}
exports.defaultContext = defaultContext;
function tmpDir() {
    if (!_tmpDir) {
        _tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docker-actions-toolkit-')).split(path.sep).join(path.posix.sep);
    }
    return _tmpDir;
}
exports.tmpDir = tmpDir;
function tmpNameSync(options) {
    return tmp.tmpNameSync(options);
}
exports.tmpNameSync = tmpNameSync;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function select(obj, path) {
    if (!obj) {
        return undefined;
    }
    const i = path.indexOf('.');
    if (i < 0) {
        return obj[path];
    }
    const key = path.slice(0, i);
    return select(obj[key], path.slice(i + 1));
}
exports.select = select;
function getInputList(name, ignoreComma) {
    const res = [];
    const items = core.getInput(name);
    if (items == '') {
        return res;
    }
    const records = (0, sync_1.parse)(items, {
        columns: false,
        relaxQuotes: true,
        comment: '#',
        relaxColumnCount: true,
        skipEmptyLines: true
    });
    for (const record of records) {
        if (record.length == 1) {
            res.push(record[0]);
            continue;
        }
        else if (!ignoreComma) {
            res.push(...record);
            continue;
        }
        res.push(record.join(','));
    }
    return res.filter(item => item).map(pat => pat.trim());
}
exports.getInputList = getInputList;
const asyncForEach = (array, callback) => __awaiter(void 0, void 0, void 0, function* () {
    for (let index = 0; index < array.length; index++) {
        yield callback(array[index], index, array);
    }
});
exports.asyncForEach = asyncForEach;
function isValidUrl(url) {
    try {
        new URL(url);
    }
    catch (e) {
        return false;
    }
    return true;
}
exports.isValidUrl = isValidUrl;
