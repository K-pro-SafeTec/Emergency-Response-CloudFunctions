var Connection = require('tedious').Connection;
var Request = require('tedious').Request
var TYPES = require('tedious').TYPES;

function queryEmpData(connection, callback) {
    var result = []

    // Create the request
    request = new Request("SELECT EMP_ID, PERSON_ID, FIRST_NAME, LAST_NAME, TITLE FROM Person;", function(error) {
        if (error) {context.log(error);}
        // pass the results array on through the callback
        callback(error, result);
    });
    
    // On receiving returned values for each row
    request.on('row', function(columns) {
        // Store the row in array
        result.push({
            EMP_ID:     columns.EMP_ID.value, 
            PERSON_ID:  columns.PERSON_ID.value, 
            FIRST_NAME: columns.FIRST_NAME.value, 
            LAST_NAME:  columns.LAST_NAME.value, 
            TITLE:      columns.TITLE.value
        });
        // result.push(columns)

    });

     // Execute the request
    connection.execSql(request);
}


module.exports = function (context, req) {


    if (req.query.emp_id || (req.body && req.body.emp_id)) {
        
        // Get connection details to connect to DB from env variable. Can do this since I've set a connection string for the database in the Function context
        context.log(process.env.SQLAZURECONNSTR_EmergencyResponseDB)
        var connection_details = JSON.parse(process.env.SQLAZURECONNSTR_EmergencyResponseDB)

        // // Debug print
        // context.log(process.env.SQLAZURECONNSTR_EmergencyResponseDB)
        // context.log(connection_details)

        // Connection config hold credentials to connect to database
        var config = {
            userName: connection_details.username,
            password: connection_details.password,
            server: connection_details.server,
            options: {encrypt: true, database: connection_details.db_name, useColumnNames: true}
        };

        // Create a connection using the config
        var connection = new Connection(config);

        // When connecting to database
        connection.on('connect', function(error) {
            // Log error if any
            if (error) {context.log(error);}

            // Debug/status print
            context.log('DEBUG: Connected to ' + config.options.database)

            queryEmpData(connection, function(error, result) {
                if (error) {context.log(error)}
            //    // Debug print
            //     console.log(result[0].ID)

            // Attach result of qurey to output variable from Azure Function
                context.res = {
                    body: result
                };

                // Calling context.done() terminates the cloud Function
                context.done();

            });

        });

        // Calling context.done() terminates the cloud Function
        context.done();
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass an emp id"
        };
    }

    
    
};