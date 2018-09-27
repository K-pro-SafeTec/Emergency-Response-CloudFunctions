var Connection = require('tedious').Connection;
var Request = require('tedious').Request
var TYPES = require('tedious').TYPES;

function querySQLDatabase(connection, callback) {
    var result = []

    // Create the request
    request = new Request("SELECT ID, FIVEKMTIME  FROM RunnerPerformance WHERE FIVEKMTIME < 30;", function(error) {
        if (error) {context.log(error);}
        // pass the results array on through the callback
        callback(null, result);
    });
    
    // On receiving returned values for each row
    request.on('row', function(columns) {
        // Store the row in array
        result.push({
            ID:   columns.ID.value,
            VALUE: columns.FIVEKMTIME.value
        });
        // result.push(columns)

    });

     // Execute the request
    connection.execSql(request);
}


module.exports = function (context) {

    // Get connection details to connect to DB from env variable
    context.log(process.env.SQLAZURECONNSTR_EmergencyResponseDB)
    var connection_details = JSON.parse(process.env.SQLAZURECONNSTR_EmergencyResponseDB)

    // Debug print
    context.log(process.env.SQLAZURECONNSTR_EmergencyResponseDB)
    context.log(connection_details)

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
        if (error) {context.log(error);}

        context.log('DEBUG: Connected to ' + config.options.database)

        querySQLDatabase(connection, function(error, result) {
        //    // Debug print
        //     console.log(result[0].ID)

        // Attach result of qurey to output variable from Azure Function
            context.res = {
                body: result
            };

            context.done();

        });
    });
    
};