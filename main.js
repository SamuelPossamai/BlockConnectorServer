'use strict'

const hapi = require('@hapi/hapi');
const vision = require('@hapi/vision');
const inert = require('@hapi/inert');
const handlebars = require('handlebars');
const fs = require('fs')
const os = require('os');

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
    method: 'POST',
    path: '/blocks/save',
    handler: (request, reply) => {

        fs.writeFile('blockjsonfiles/blocks.json',
                     JSON.stringify(request.payload),
                     (err) => { if(err) throw err; });

        return 'Saved';
    }
});

server.route({
    method: 'GET',
    path: '/static/blocks.js',
    handler: (request, reply) => {

        return reply.file('jsdragblocks/blocks.js');
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
}

const launch = async () => {

    try {

        fs.mkdir('blockjsonfiles', (err) => {});

        await server.register(vision);

        server.views({
            engines: { html: handlebars },
            relativeTo: __dirname,
            path: '.'
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
