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
            description: 'API to share music with friends using Spotify.'
        },
        components: {
            // Definition of the security scheme
            securitySchemes: { 
                bearerAuth: { // Name of the security scheme, can be referenced in the security array of the route
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT' // Incidates that the token is a JWT
                }
            }
        },

        security: [{
            bearerAuth: [], 
          }],
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