'use strict'

const hapi = require('@hapi/hapi');
const vision = require('@hapi/vision');
const inert = require('@hapi/inert');
const handlebars = require('handlebars');
const fs = require('fs')
const os = require('os');

var blocktypeconfig_json = null;

const server = new hapi.Server({
    host: 'localhost',
    port: 6178,
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
        fs.readFile('blocktypeconfig.json', function read(err, data) {

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
