// src/data/index.js
import databaseData from './database.json';

export const db = {
  users: databaseData.users,
  locations: databaseData.locations,
  frequency_types: databaseData.frequency_types,
  chores: databaseData.chores
};
