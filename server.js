'use strict'

const hapi = require('hapi');
const vision = require('vision');
const handlebars = require('handlebars');
const inert = require('inert');
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

        fs.writeFile(os.homedir() + '/blockconnection_blocks.json',
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
