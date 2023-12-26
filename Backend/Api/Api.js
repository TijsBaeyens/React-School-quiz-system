const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mysql = require('mysql2');

const app = express();

// Connect db
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'studentopvolging',
});

// Cors, helmet en express middleware
app.use(cors());
app.use(helmet());
app.use(express.json());


app.get('/', (req, res) => {
  connection.query('SELECT * FROM opdracht', (err, data) => {
    if (err) {
      res.status(500).send('Error querying database');
    } else {
      connection.query('SELECT Minuten FROM opdrachtelement WHERE OpdrachtID IN (SELECT DISTINCT ID FROM opdracht)', (err, Minuten) => {
        if (err) {
          res.status(500).send('Error querying database');
        } else {
          res.json({data, Minuten});
        }
      });
    }
  });
});


app.get('/opdrachtLeerlingen/:id', (req, res) => {
  connection.query('SELECT naam FROM opdracht WHERE ID = ?', req.params.id, (err, data) => {
    if (err) {
      res.status(500).send('Error querying database');
    } else {
      connection.query('SELECT * FROM student', (err, additionalData) => {
        if (err) {
          res.status(500).send('Error querying database');
        } else {
          res.json({ data, additionalData });
        }
      });
    }
  });
});

app.get('/opdrachtLeerlingen/:id/status', (req, res) => {
  connection.query('SELECT status, studentID FROM rapport WHERE OpdrachtElementID = (SELECT id FROM opdrachtelement WHERE opdrachtID = (?))', req.params.id, (err, data) => {
    if (err) {
      res.status(500).send('Error querying database');
    } else {
      res.json(data);
    }
  });
});

app.get('/opdrachtLeerlingen/:id/:student', (req, res) => {
  connection.query('SELECT naam FROM opdracht WHERE ID = ?', req.params.id, (err, opdracht) => {
    if (err) {
      res.status(500).send('Error querying database');
    } else {
      connection.query('SELECT * FROM student WHERE Voornaam = ?', req.params.student, (err, student) => {
        if (err) {
          res.status(500).send('Error querying database');
        } else {
          connection.query('SELECT * FROM rapport WHERE StudentID = (SELECT ID FROM student WHERE Voornaam = (?))', req.params.student, (err, rapport) => {
            if (err) {
              res.status(500).send('Error querying database');
            } else {
              connection.query(`SELECT * FROM vraagstudent WHERE RapportID = (SELECT ID FROM rapport WHERE StudentID = (SELECT ID FROM student WHERE Voornaam = (?)))`, req.params.student, (err, vraagstudent) => {
                if (err) {
                  res.status(500).send('Error querying database');
                } else {
                  res.json({ opdracht, student, rapport, vraagstudent });
                }
              });
            }
          });
        };
      });
    };
  });
})

//Leerling get functies

app.get('/leerling', (req, res) => {
  connection.query('SELECT o.naam, e.minuten, o.id FROM opdracht AS o JOIN opdrachtelement AS e ON e.Opdrachtid = o.id WHERE o.geldig = 1', (err, data) => {
    if (err) {
      res.status(500).send('Error querying database');
    } else {
      res.json(data);
    }
  });
});

app.get('/leerling/:id', (req, res) => {
  connection.query('SELECT o.naam, e.minuten, o.id FROM opdracht AS o JOIN opdrachtelement AS e ON e.Opdrachtid = o.id WHERE o.geldig = 1', (err, data) => {
    if (err) {
      res.status(500).send('Error querying database');
    } else {
      res.json(data);
    }
  });
});

app.get('/:email', (req, res) => {
  connection.query('SELECT id FROM student WHERE email = (?)', req.params.email, (err, data) => {
    if (err) {
      res.status(500).send('Error querying database');
    } else {
      res.json(data);
    }
  });
});

app.post('/status/:Userid/:OpdrachtId', (req, res) => {
  const [status, extraMinuten, beschrijving] = req.body;
  
connection.promise().query(`DELETE FROM vraagstudent WHERE RapportID IN (SELECT id FROM rapport WHERE StudentId = (?) AND OpdrachtElementID = (?))`, [req.params.Userid, req.params.OpdrachtId])
  .then(() => {
    connection.promise().query(`DELETE FROM rapport WHERE StudentId = (?) AND OpdrachtElementID = (?)`, [parseInt(req.params.Userid), parseInt(req.params.OpdrachtId)])
      .then(() => {
        connection.promise().query('INSERT INTO rapport (StudentId, OpdrachtElementID, Status, ExtraMinuten) VALUES (?, ?, ?, ?)', [parseInt(req.params.Userid), parseInt(req.params.OpdrachtId), status, extraMinuten])
          .then(() => {
            for (let i = 0; i < beschrijving.length; i++) {
              const element = beschrijving[i];
              connection.promise().query(`
                INSERT INTO vraagstudent (RapportID, beschrijving)
                VALUES ((SELECT id FROM rapport WHERE StudentId = ? AND OpdrachtElementID = ?), ?)
              `, [parseInt(req.params.Userid), parseInt(req.params.OpdrachtId), element])
            }
            
            Promise.all(beschrijving.map(description => {
            }))
              .then(() => {
                res.send('Data inserted successfully');
              })
              .catch(err => {
                res.status(500).send(err);
              });
            
          })
          .catch((error) => {
            res.status(500).send('Error inserting data into database 1 '+ error);
          });
      })
      .catch((error) => {
        res.status(500).send('Error deleting data from database 2' + error);
      });
  })
  .catch((error) => {
    res.status(500).send('Error deleting data from database 1' + error);
  });
}); 


app.post('/opdracht', (req, res) => {
  const data = req.body;

  connection.query('INSERT INTO opdracht SET ?', data[0], (err) => {
    if (err) {
      res.status(500).send('Error inserting data into database');
    } else {
      res.send('Data inserted successfully');
    }
  });
  connection.query('INSERT INTO opdrachtelement SET (?, ?)', [data[1], data[2]], (err) => {
    if (err) {
      res.status(500).send('Error inserting data into database');
    } else {
      res.send('Data inserted successfully');
    }
  });
});

app.post('/deleteOpdracht', (req, res) => {
  const data = req.body;
  connection.query('DELETE FROM opdrachtElement WHERE OpdrachtID = (?)', data.ID, (err) => {
    if (err) {
      res.status(500).send('Error deleting data from database');
    } else {
      connection.query('DELETE FROM opdracht WHERE id = (?)', data.ID, (err) => {
        if (err) {
          res.status(500).send('Error deleting data from database' + err);
        } else {
          res.send('Data inserted successfully');
        }
      })
    }
  })
});

app.post('/changeOpdracht', (req, res) => {
  const data = req.body;
  connection.query('DELETE FROM opdrachtElement WHERE OpdrachtID = (?)', data.ID, (err) => {
    if (err) {
      res.status(500).send('Error deleting data from database');
    } else {
      connection.query('DELETE FROM opdracht WHERE id = (?)', data.ID, (err) => {
        if (err) {
          res.status(500).send('Error deleting data from database' + err);
        } else {
          res.send('Data inserted successfully');
        }
      })
    }
  })
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});
