/**
 * 
 * Generate the OpenAPI documentation for the API using swagger-jsdoc
 * Use the command "node generateDoc.js" to generate the documentation automagically.
 * 
 */
const fs = require('fs')
const swaggerJSDoc = require('swagger-jsdoc')

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Shared Music API',
            version: '1.0.0',
            description: 'API to share music with friends using Spotify.',
        },
    },
    apis: ['./controllers/*.js']
}

// Generate the doc using swagger-jsdoc
const openapiSpecification = swaggerJSDoc(options)

// Write the doc to disk
fs.writeFile('./docs/swagger-output.json', JSON.stringify(openapiSpecification, null, 2), (err) => {
    if (err) {
        console.log(err)
    } else {
        console.log('API Documentation generated successfully')
    }
})