'use strict'

const Hapi = require('hapi');
const Vision = require('vision');
const Handlebars = require('handlebars');
const Inert = require('inert');
const fs = require('fs')
const os = require('os');

const server = new Hapi.Server({
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
        await server.register(Vision);

        server.views({
            engines: { html: Handlebars },
            relativeTo: __dirname,
            path: '.'
        });

        await server.register(Inert);

        add_directory_routes();

        await server.start();
    } catch (err) {
        console.error(err);
        process.exit(1);
    };
    console.log(`Server running at ${server.info.uri}`);
}

launch();
