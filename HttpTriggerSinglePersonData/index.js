    var Connection = require('tedious').Connection;
    var Request = require('tedious').Request
    var TYPES = require('tedious').TYPES;

    // This function takes a connection, and emp_id and a callback
    // It creates a request to the connection and returns the rows, then it calls the callback function with the result
    function query_emp_id_data(connection, emp_id, callback) {
        // Array to store result of query
        var result = []

        // Create the request and set it to call the callback with the result 
        request = new Request("SELECT EMP_ID, PERSON_ID, FIRST_NAME, LAST_NAME, TITLE FROM Person WHERE EMP_ID = " + String(emp_id) + ";", function(error) {

            // Pass the results array through the callback
            callback(error, result);
        });
        
        // Actions to perform when retrieving rows from the request
        request.on('row', function(columns) {
            // Store the row in the result array

            // // Decide what should be returned from the result
            result.push({
                EMP_ID:     columns.EMP_ID.value, 
                PERSON_ID:  columns.PERSON_ID.value, 
                FIRST_NAME: columns.FIRST_NAME.value, 
                LAST_NAME:  columns.LAST_NAME.value, 
                TITLE:      columns.TITLE.value
            });

        });

        // Execute the request
        connection.execSql(request);
    }


    module.exports = function (context, req) {
        emp_id = -1;
        if(req.body && req.body.emp_id){
            emp_id = req.body.emp_id
        }
        else if(req.query.emp_id){
            emp_id = req.query.emp_id
        }
        
        

        
        if (Number.isInteger(emp_id) && emp_id !== -1 && !isNaN(emp_id)){
            emp_id = parseInt(emp_id, 10)

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
                query_emp_id_data(connection, emp_id, 
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
        }
        else { // If the query does not satisfy the requirements of the HttpTrigger
            context.res = {
                status: 400,
                body: "Please pass an emp_id of the person you want data about"

            };
            context.done();
        }
    };
