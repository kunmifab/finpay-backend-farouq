const SwaggerParser = require('@apidevtools/swagger-parser');
const spec = require('../src/docs/openapi');

(async () => {
    try {
        await SwaggerParser.validate(spec);
        console.log('OpenAPI specification is valid');
    } catch (error) {
        console.error('OpenAPI specification validation failed');
        console.error(error.message);
        if (error.details) {
            error.details.forEach((detail) => console.error(`- ${detail}`));
        }
        process.exitCode = 1;
    }
})();
