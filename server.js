'use strict'

const Hapi = require('hapi');
const Vision = require('vision');
const Handlebars = require('handlebars');
const Inert = require('inert');

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
    method: 'GET',
    path: '/static/blocks.js',
    handler: (request, reply) => {

        return reply.file('jsdragblocks/blocks.js');
    }
});

const launch = async () => {

    try {
        await server.register(Vision);

        server.views({
            engines: { html: Handlebars },
            relativeTo: __dirname,
            path: '.'
        });

        await server.register(Inert);

        await server.start();
    } catch (err) {
        console.error(err);
        process.exit(1);
    };
    console.log(`Server running at ${server.info.uri}`);
}

launch();
