/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const up = async (db, client) => {
  await db
    .collection("messages")
    .updateMany({}, { $set: { isEdited: false } });
};

export const down = async (db, client) => {
  await db.collection("messages").updateMany({}, { $unset: { isEdited: "" } });
};
