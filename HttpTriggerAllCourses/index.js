var Connection = require('tedious').Connection;
var Request = require('tedious').Request
var TYPES = require('tedious').TYPES;

// This function takes a connection, and emp_id and a callback
// It creates a request to the connection and returns the rows, then it calls the callback function with the result
function query_all_courses(connection, callback) {
    // Array to store result of query
    var result = []

    // Create the request and set it to call the callback with the result 
    request = new Request("SELECT * FROM Courses;", function(error) {

        // Pass the results array through the callback
        callback(error, result);
    });
    
    // Actions to perform when retrieving rows from the request
    request.on('row', function(columns) {
        // Store the row in the result array

        // // Decide what should be returned from the result
        result.push({
            // course_id:              columns[0].value
            course_id:              columns.course_id.value,
            course_name:            columns.course_name.value,
            course_duration_hrs:    columns.course_duration_hrs.value,
            course_freq_req_days:   columns.course_freq_req_days.value
        });

    });

    // Execute the request
    connection.execSql(request);
}


module.exports = function (context) {

    // Get connection details to connect to DB from env variable. Can do this since I've set a connection string for the Azure function to the database
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

    // Decide what happens when connecting to database 
    connection.on('connect', function(error) {
        // Log error if any
        if (error) {context.log(error);}

        // Debug/status print
        // context.log('DEBUG: Connected to ' + config.options.database)

        // Call function to get data of the employee with emp_id
        query_all_courses(connection, 
            function(error, result) { // Callback function
                // Log error if any
                if (error) {context.log(error)}

                // Attach result of query to the body output variable of the Azure function res
                context.res = {
                    body: result
                };

                // Calling context.done() terminates the cloud Function
                context.done();
            });
    });
    
};