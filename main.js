'use strict'

const hapi = require('@hapi/hapi');
const vision = require('@hapi/vision');
const inert = require('@hapi/inert');
const handlebars = require('handlebars');
const fs = require('fs');
const os = require('os');
const child_process = require('child_process');

var blocktypeconfig_json = null;

const CONSOLE_MAX_LINES = 100;
const console_print_lines = [];
var console_written_lines = 0;

var server_host = '127.0.0.1';
var server_port = 6178;

var blocktypeconfig_path = 'blocktypeconfig.json';
var blocks_run_command = null;

function parseArguments() {

    const package_json = JSON.parse(fs.readFileSync('package.json'));
    const ArgumentParser = require('argparse').ArgumentParser;

    const parser = new ArgumentParser({

        version: package_json.version,
        addHelp: true,
        description: package_json.description
    });

    parser.addArgument([ '-H', '--host' ], {
        help: 'Server host ip'
    });

    parser.addArgument([ '-p', '--port' ], {
        help: 'Server network port'
    });

    parser.addArgument([ '-t', '--blocktypeconfig-file' ], {
        help: 'Specify where is the file with the block types information'
    });

    parser.addArgument([ '-r', '--run-command' ], {
        help: 'Specify the command that will run when the \'run\' is pressed'
    });

    let args = parser.parseArgs();

    if(args.host) server_host = args.host;
    if(args.port) server_port = args.port;
    if(args.blocktypeconfig_file) {
        blocktypeconfig_path = args.blocktypeconfig_file;
    }
    if(args.run_command) blocks_run_command = args.run_command;
}

parseArguments();

const server = new hapi.Server({
    host: server_host,
    port: server_port,
});

server.route({
    method: 'POST',
    path: '/console/write',
    handler: (request, reply) => {

        if(console_print_lines.length >= CONSOLE_MAX_LINES) {

            console_print_lines.shift();
        }

        console_print_lines.push(request.payload);

        console_written_lines++;

        return 'wrote';
    }
});

server.route({
    method: 'GET',
    path: '/console/read',
    handler: (request, reply) => {

        return {

            default: console_print_lines.join('\n')
        };
    }
});

server.route({
    method: 'GET',
    path: '/console/read/after/{update_ntimes}',
    handler: (request, reply) => {

        let new_lines_qtd = console_written_lines - parseInt(
            request.params.update_ntimes, 10);

        if(new_lines_qtd <= 0) {

            return {
                console: {},
                line: {}
            }
        }

        return {

            console: {

                default: console_print_lines.slice(
                    console_print_lines.length - new_lines_qtd,
                    console_print_lines.length).join('\n')
            },
            current_line: {

                default: console_written_lines
            }
        };
    }
});

server.route({
    method: 'GET',
    path: '/',
    handler: (request, reply) => {

        return reply.view('index');
    }
});

server.route({
    method: 'GET',
    path: '/config/blocks/types',
    handler: (request, reply) => {

        return blocktypeconfig_json;
    }
});

server.route({
    method: 'GET',
    path: '/blocks/run',
    handler: (request, reply) => {

        if(blocks_run_command != null) {
            child_process.exec(blocks_run_command).unref();
        }

        return 'success';
    }
});

server.route({
    method: 'GET',
    path: '/blocks/load',
    handler: (request, reply) => {

        return reply.file('blockjsonfiles/blocks.json');
    }
});

server.route({
    method: 'POST',
    path: '/blocks/save',
    handler: (request, reply) => {

        fs.writeFile('blockjsonfiles/blocks.json',
                     JSON.stringify(request.payload),
                     (err) => { if(err) throw err; });

        return 'Saved';
    }
});

function add_directory_routes() {

    server.route({
        method: 'GET',
        path: '/static/axios/dist/{param}',
        handler: {
            directory: {
                path: 'node_modules/axios/dist',
                redirectToSlash: true,
                index: true,
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/static/jsdragblocks/blocks.js',
        handler: {
            file: 'node_modules/jsdragblocks/src/blocks.js'
        }
    });

    server.route({
        method: 'GET',
        path: '/static/{param*}',
        handler: {
            directory: {
                path: 'static',
                redirectToSlash: true,
                index: true,
            }
        }
    });
}

const launch = async () => {

    try {

        fs.mkdir('blockjsonfiles', (err) => {});
        fs.readFile(blocktypeconfig_path, function read(err, data) {

            if(err) throw err;

            blocktypeconfig_json = JSON.parse(data);
        });

        await server.register(vision);

        server.views({
            engines: { html: handlebars },
            relativeTo: __dirname,
            path: 'templates'
        });

        await server.register(inert);

        add_directory_routes();

        await server.start();

    } catch (err) {

        console.error(err);
        process.exit(1);
    };
    console.log(`Server running at ${server.info.uri}`);
}

launch();
