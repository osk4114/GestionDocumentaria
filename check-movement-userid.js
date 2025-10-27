const {sequelize} = require('./config/sequelize');

sequelize.query(`
  SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'sgd_db'
    AND TABLE_NAME = 'document_movements'
    AND COLUMN_NAME = 'user_id'
`)
.then(([result]) => {
  console.table(result);
  return sequelize.close();
})
.catch(err => {
  console.error(err);
  sequelize.close();
});
