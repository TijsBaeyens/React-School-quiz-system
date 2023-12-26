const csv = require('csv-parser');
const fs = require('fs');
const mysql = require('mysql');

// Maak een nieuwe MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'studentopvolging',
});

// Open de MySQL connection
connection.connect();

// Er kan maar 1 csv file tegelijk worden ingelezen, zet 'Lees de 2e CSV file' in comment en uncomment 'Lees de 1e CSV file'

/*
// Lees de 1e CSV file
fs.createReadStream('StudentenEnGroepen001.csv')
  .pipe(csv())  
  .on('data', (row) => {
    const values = Object.values(row);
    var query = `INSERT INTO student (Code, Gebruikersnaam, Familienaam, Voornaam, Sorteernaam, Email) VALUES (? ,? ,? ,? ,? ,?)`;
    connection.query(query, [values[0], values[1], values[2], values[3], values[4], values[5]]);
    query = `INSERT INTO groep (Naam) VALUES (?)`
    connection.query(query, [values[8]]);
  })
  .on('end', () => {
    console.log('Finished importing CSV data');
    connection.end();
  });
*/

// Lees de 2e CSV file
fs.createReadStream('OpdrachtMetDeelopdrachten001.csv')
  .pipe(csv())  
  .on('data', (row) => {
    const values = Object.values(row);
    var query = `INSERT INTO opdracht (Naam) VALUES (?)`;
    connection.query(query, values[2]);
    var query = `INSERT INTO opdrachtelement (OpdrachtID, beschrijving, minuten) VALUES (LAST_INSERT_ID(), ?, ?);
    `;
    connection.query(query, [values[2], values[3]]);
  })
  .on('end', () => {
    console.log('Finished importing CSV data');
    connection.end();
  });
