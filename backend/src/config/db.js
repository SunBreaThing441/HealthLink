import pg from 'pg';
import crypto from 'crypto';
import { newDb } from 'pg-mem';

const rawUri = (process.env.DATABASE_URL || "").trim();

let activePool = null;
if (rawUri) {
  activePool = new pg.Pool({
    connectionString: rawUri,
    connectionTimeoutMillis: 5000,
  });
}

const pool = new Proxy({}, {
  get(target, prop) {
    if (!activePool) {
      const memDb = newDb();
      const memPg = memDb.adapters.createPg();
      activePool = new memPg.Pool();
    }
    const val = activePool[prop];
    return typeof val === 'function' ? val.bind(activePool) : val;
  }
});


// Mock Mongoose setup
const registeredModels = {};

class Schema {
  constructor(definition, options) {
    this.definition = definition;
    this.options = options;
    this.methods = {};
    this.statics = {};
    this.hooks = { pre: {}, post: {} };
  }
  pre(event, fn) {
    if (!this.hooks.pre[event]) this.hooks.pre[event] = [];
    this.hooks.pre[event].push(fn);
  }
  post(event, fn) {
    if (!this.hooks.post[event]) this.hooks.post[event] = [];
    this.hooks.post[event].push(fn);
  }
  index() {
    return this;
  }
}

Schema.Types = {
  ObjectId: String,
  Mixed: Object
};

class MongooseQuery {
  constructor(executeFn) {
    this.executeFn = executeFn;
    this.populatePaths = [];
    this.selectFields = null;
    this.sortOptions = null;
    this.limitVal = null;
    this.skipVal = null;
    this.isLean = false;
  }
  
  populate(path, select) {
    if (typeof path === 'object') {
      this.populatePaths.push(path);
    } else {
      this.populatePaths.push({ path, select });
    }
    return this;
  }
  select(fields) {
    this.selectFields = fields;
    return this;
  }
  sort(options) {
    this.sortOptions = options;
    return this;
  }
  limit(val) {
    this.limitVal = parseInt(val);
    return this;
  }
  skip(val) {
    this.skipVal = parseInt(val);
    return this;
  }
  lean() {
    this.isLean = true;
    return this;
  }
  
  async then(onFulfilled, onRejected) {
    try {
      const result = await this.executeFn(this);
      return onFulfilled ? onFulfilled(result) : result;
    } catch (err) {
      if (onRejected) return onRejected(err);
      throw err;
    }
  }
  
  async catch(onRejected) {
    return this.then(null, onRejected);
  }
}

function buildWhereClause(queryObj, paramIdx = 1) {
  const clauses = [];
  const values = [];
  
  if (!queryObj || Object.keys(queryObj).length === 0) {
    return { sql: '1=1', values, paramIdx };
  }

  for (const [key, val] of Object.entries(queryObj)) {
    if (key === '$or') {
      const orClauses = [];
      for (const subQuery of val) {
        const sub = buildWhereClause(subQuery, paramIdx);
        if (sub.sql) {
          orClauses.push(`(${sub.sql})`);
          values.push(...sub.values);
          paramIdx = sub.paramIdx;
        }
      }
      if (orClauses.length > 0) {
        clauses.push(`(${orClauses.join(' OR ')})`);
      }
      continue;
    }

    if (key === '$and') {
      const andClauses = [];
      for (const subQuery of val) {
        const sub = buildWhereClause(subQuery, paramIdx);
        if (sub.sql) {
          andClauses.push(`(${sub.sql})`);
          values.push(...sub.values);
          paramIdx = sub.paramIdx;
        }
      }
      if (andClauses.length > 0) {
        clauses.push(`(${andClauses.join(' AND ')})`);
      }
      continue;
    }

    // Handle participants.userId query
    if (key === 'participants.userId') {
      clauses.push(`data->'participants' @> $${paramIdx}`);
      values.push(JSON.stringify([{ userId: val.toString() }]));
      paramIdx++;
      continue;
    }

    // Handle direct ID query
    if (key === '_id') {
      clauses.push(`id = $${paramIdx}`);
      values.push(val.toString());
      paramIdx++;
      continue;
    }

    // Handle operator queries
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      const ops = Object.keys(val);
      for (const op of ops) {
        if (op === '$regex') {
          const pattern = val.$regex;
          const options = val.$options || '';
          const caseInsensitive = options.includes('i');
          const likeOp = caseInsensitive ? 'ILIKE' : 'LIKE';
          clauses.push(`data->>'${key}' ${likeOp} $${paramIdx}`);
          const likePattern = '%' + pattern.replace(/^\^|\$$/g, '').replace(/\\\w/g, '') + '%';
          values.push(likePattern);
          paramIdx++;
        } else if (op === '$gte') {
          clauses.push(`CAST(data->>'${key}' AS NUMERIC) >= $${paramIdx}`);
          values.push(val.$gte);
          paramIdx++;
        } else if (op === '$lte') {
          clauses.push(`CAST(data->>'${key}' AS NUMERIC) <= $${paramIdx}`);
          values.push(val.$lte);
          paramIdx++;
        } else if (op === '$gt') {
          clauses.push(`CAST(data->>'${key}' AS NUMERIC) > $${paramIdx}`);
          values.push(val.$gt);
          paramIdx++;
        } else if (op === '$lt') {
          clauses.push(`CAST(data->>'${key}' AS NUMERIC) < $${paramIdx}`);
          values.push(val.$lt);
          paramIdx++;
        } else if (op === '$ne') {
          if (val.$ne === null) {
            clauses.push(`(data->>'${key}') IS DISTINCT FROM NULL`);
          } else {
            clauses.push(`data->>'${key}' != $${paramIdx}`);
            values.push(val.$ne.toString());
            paramIdx++;
          }
        } else if (op === '$in') {
          const inPlaceholders = val.$in.map((_, i) => `$${paramIdx + i}`).join(', ');
          if (key === '_id') {
            clauses.push(`id IN (${inPlaceholders})`);
          } else {
            clauses.push(`data->>'${key}' IN (${inPlaceholders})`);
          }
          values.push(...val.$in.map(v => v.toString()));
          paramIdx += val.$in.length;
        }
      }
      continue;
    }

    // Standard equality
    if (val === null) {
      clauses.push(`(data->>'${key}') IS NULL`);
    } else {
      clauses.push(`data->>'${key}' = $${paramIdx}`);
      values.push(val.toString());
      paramIdx++;
    }
  }

  return {
    sql: clauses.length > 0 ? clauses.join(' AND ') : '1=1',
    values,
    paramIdx
  };
}

async function populateField(doc, path, select, customModel) {
  if (!doc) return;
  
  if (typeof path === 'object') {
    select = path.select;
    customModel = path.model;
    path = path.path;
  }

  const parts = path.split('.');
  if (parts.length === 1) {
    const field = parts[0];
    const val = doc[field];
    if (!val) return;
    
    let targetModelName = customModel;
    if (!targetModelName) {
      if (field === 'patientId') targetModelName = 'Client';
      else if (field === 'doctorId') targetModelName = 'Doctor';
      else if (field === 'slotRequestId') targetModelName = 'SlotRequest';
      else if (field === 'scheduleId') targetModelName = 'Schedule';
      else if (field === 'senderId') {
        targetModelName = doc.senderType === 'Doctor' ? 'Doctor' : 'Client';
      } else if (field === 'receiverId') {
        targetModelName = doc.receiverType === 'Doctor' ? 'Doctor' : 'Client';
      }
    }

    if (targetModelName) {
      const TargetModel = registeredModels[targetModelName];
      if (TargetModel) {
        const refDoc = await TargetModel.findById(val);
        if (refDoc) {
          let populatedVal = refDoc;
          if (select) {
            const selectFields = select.split(' ').map(f => f.trim()).filter(Boolean);
            const cleanDoc = {};
            for (const field of selectFields) {
              cleanDoc[field] = refDoc[field];
            }
            cleanDoc._id = refDoc._id;
            populatedVal = cleanDoc;
          }
          doc[field] = populatedVal;
        }
      }
    }
  } else if (parts.length === 2 && parts[0] === 'participants' && parts[1] === 'userId') {
    const array = doc.participants || [];
    for (const item of array) {
      if (item.userId) {
        const targetModelName = item.userType === 'Doctor' ? 'Doctor' : 'Client';
        const TargetModel = registeredModels[targetModelName];
        if (TargetModel) {
          const refDoc = await TargetModel.findById(item.userId);
          if (refDoc) {
            let populatedVal = refDoc;
            if (select) {
              const selectFields = select.split(' ').map(f => f.trim()).filter(Boolean);
              const cleanDoc = {};
              for (const field of selectFields) {
                cleanDoc[field] = refDoc[field];
              }
              cleanDoc._id = refDoc._id;
              populatedVal = cleanDoc;
            }
            item.userId = populatedVal;
          }
        }
      }
    }
  }
}

function createModelClass(modelName, schema) {
  const tableName = modelName.toLowerCase() === 'videocall' ? 'video' : modelName.toLowerCase();
  
  class ModelInstance {
    constructor(data = {}) {
      this._id = data._id || data.id || mongoose.Types.ObjectId();
      this._initialData = JSON.parse(JSON.stringify(data));
      
      Object.assign(this, data);
      
      if (schema && schema.methods) {
        for (const [methodName, methodFn] of Object.entries(schema.methods)) {
          this[methodName] = methodFn.bind(this);
        }
      }
    }

    isModified(field) {
      return JSON.stringify(this[field]) !== JSON.stringify(this._initialData[field]);
    }

    async save() {
      if (schema && schema.hooks && schema.hooks.pre && schema.hooks.pre['save']) {
        for (const hookFn of schema.hooks.pre['save']) {
          await new Promise((resolve, reject) => {
            hookFn.call(this, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      }

      const dataToSave = {};
      for (const key of Object.keys(this)) {
        if (key.startsWith('_') && key !== '_id') continue;
        if (typeof this[key] === 'function') continue;
        dataToSave[key] = this[key];
      }
      dataToSave._id = this._id;

      const now = new Date();
      if (!this.createdAt) {
        dataToSave.createdAt = now;
        this.createdAt = now;
      }
      dataToSave.updatedAt = now;
      this.updatedAt = now;

      const sql = `
        INSERT INTO ${tableName} (id, data)
        VALUES ($1, $2)
        ON CONFLICT (id)
        DO UPDATE SET data = $2, updated_at = NOW()
        RETURNING *
      `;
      await pool.query(sql, [this._id, JSON.stringify(dataToSave)]);
      
      this._initialData = JSON.parse(JSON.stringify(dataToSave));
      return this;
    }

    async deleteOne() {
      await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [this._id]);
    }
    
    async populate(path, select) {
      await populateField(this, path, select);
      return this;
    }

    toObject() {
      const obj = {};
      for (const key of Object.keys(this)) {
        if (key.startsWith('_')) continue;
        if (typeof this[key] === 'function') continue;
        obj[key] = this[key];
      }
      obj._id = this._id;
      return obj;
    }

    toJSON() {
      return this.toObject();
    }
  }

  if (schema && schema.statics) {
    for (const [staticName, staticFn] of Object.entries(schema.statics)) {
      ModelInstance[staticName] = staticFn.bind(ModelInstance);
    }
  }

  ModelInstance.modelName = modelName;
  
  ModelInstance.findById = (id) => {
    return new MongooseQuery(async (q) => {
      if (!id) return null;
      const res = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id.toString()]);
      if (res.rows.length === 0) return null;
      
      const doc = new ModelInstance(res.rows[0].data);
      for (const pathObj of q.populatePaths) {
        await populateField(doc, pathObj);
      }
      return doc;
    });
  };

  ModelInstance.findOne = (query) => {
    return new MongooseQuery(async (q) => {
      const where = buildWhereClause(query);
      const sql = `SELECT * FROM ${tableName} WHERE ${where.sql} LIMIT 1`;
      const res = await pool.query(sql, where.values);
      if (res.rows.length === 0) return null;
      
      const doc = new ModelInstance(res.rows[0].data);
      for (const pathObj of q.populatePaths) {
        await populateField(doc, pathObj);
      }
      return doc;
    });
  };

  ModelInstance.find = (query) => {
    return new MongooseQuery(async (q) => {
      const where = buildWhereClause(query);
      let sql = `SELECT * FROM ${tableName} WHERE ${where.sql}`;
      
      if (q.sortOptions) {
        const sortClauses = [];
        for (const [k, v] of Object.entries(q.sortOptions)) {
          const dir = v === -1 || v === 'desc' ? 'DESC' : 'ASC';
          if (k === 'createdAt') {
            sortClauses.push(`(data->>'createdAt') ${dir}`);
          } else if (k === 'lastMessage') {
            sortClauses.push(`(data->'lastMessage'->>'createdAt') ${dir}`);
          } else {
            sortClauses.push(`(data->>'${k}') ${dir}`);
          }
        }
        if (sortClauses.length > 0) {
          sql += ` ORDER BY ${sortClauses.join(', ')}`;
        }
      }
      
      if (q.limitVal !== null) {
        sql += ` LIMIT ${q.limitVal}`;
      }
      if (q.skipVal !== null) {
        sql += ` OFFSET ${q.skipVal}`;
      }

      const res = await pool.query(sql, where.values);
      const docs = res.rows.map(row => new ModelInstance(row.data));
      
      for (const doc of docs) {
        for (const pathObj of q.populatePaths) {
          await populateField(doc, pathObj);
        }
      }
      
      return docs;
    });
  };

  ModelInstance.countDocuments = (query) => {
    return new MongooseQuery(async (q) => {
      const where = buildWhereClause(query);
      const sql = `SELECT COUNT(*) FROM ${tableName} WHERE ${where.sql}`;
      const res = await pool.query(sql, where.values);
      return parseInt(res.rows[0].count);
    });
  };

  ModelInstance.create = async (data) => {
    const list = Array.isArray(data) ? data : [data];
    const createdDocs = [];
    
    for (const item of list) {
      const doc = new ModelInstance(item);
      await doc.save();
      createdDocs.push(doc);
    }
    
    return Array.isArray(data) ? createdDocs : createdDocs[0];
  };

  ModelInstance.findByIdAndUpdate = (id, update, options = {}) => {
    return new MongooseQuery(async (q) => {
      const doc = await ModelInstance.findById(id);
      if (!doc) return null;
      
      const updateData = update.$set || update;
      Object.assign(doc, updateData);
      
      if (update.$unset) {
        for (const key of Object.keys(update.$unset)) {
          delete doc[key];
        }
      }

      await doc.save();
      return doc;
    });
  };

  ModelInstance.findOneAndUpdate = (query, update, options = {}) => {
    return new MongooseQuery(async (q) => {
      const doc = await ModelInstance.findOne(query);
      if (!doc) return null;
      
      const updateData = update.$set || update;
      Object.assign(doc, updateData);
      
      if (update.$unset) {
        for (const key of Object.keys(update.$unset)) {
          delete doc[key];
        }
      }

      await doc.save();
      return doc;
    });
  };

  ModelInstance.updateMany = async (query, update, options = {}) => {
    const docs = await ModelInstance.find(query);
    const updateData = update.$set || update;
    
    for (const doc of docs) {
      Object.assign(doc, updateData);
      if (update.$unset) {
        for (const key of Object.keys(update.$unset)) {
          delete doc[key];
        }
      }
      await doc.save();
    }
    return { modifiedCount: docs.length, matchedCount: docs.length };
  };

  ModelInstance.deleteMany = async (query) => {
    const where = buildWhereClause(query);
    const sql = `DELETE FROM ${tableName} WHERE ${where.sql}`;
    const res = await pool.query(sql, where.values);
    return { deletedCount: res.rowCount };
  };

  ModelInstance.findOneAndDelete = (query) => {
    return new MongooseQuery(async (q) => {
      const doc = await ModelInstance.findOne(query);
      if (!doc) return null;
      await doc.deleteOne();
      return doc;
    });
  };

  ModelInstance.findByIdAndDelete = (id) => {
    return new MongooseQuery(async (q) => {
      const doc = await ModelInstance.findById(id);
      if (!doc) return null;
      await doc.deleteOne();
      return doc;
    });
  };

  return ModelInstance;
}

const mongoose = {
  Schema,
  models: registeredModels,
  model: (name, schema) => {
    if (schema) {
      const ModelClass = createModelClass(name, schema);
      registeredModels[name] = ModelClass;
      return ModelClass;
    }
    return registeredModels[name];
  },
  connect: async () => {
    return mongoose.connection;
  },
  connection: {
    host: 'PostgreSQL',
    on: () => {},
    once: () => {},
    close: async () => {
      await pool.end();
    }
  },
  Types: {
    ObjectId: () => crypto.randomBytes(12).toString('hex')
  }
};

const tables = ['client', 'doctor', 'chat', 'message', 'video', 'schedule', 'slotrequest', 'payment', 'medicine'];

const connectDB = async () => {
  let connected = false;
  if (activePool) {
    try {
      const client = await activePool.connect();
      console.log(`\n✅ PostgreSQL Connected to DB host: ${client.host || 'PostgreSQL'}`);
      client.release();
      connected = true;
    } catch (err) {
      console.warn("⚠️ Failed to connect to DATABASE_URL:", err.message);
      console.log("🔄 Falling back to in-memory PostgreSQL engine (pg-mem)...");
      const memDb = newDb();
      const memPg = memDb.adapters.createPg();
      activePool = new memPg.Pool();
    }
  } else {
    const memDb = newDb();
    const memPg = memDb.adapters.createPg();
    activePool = new memPg.Pool();
    console.log("\n✅ In-Memory PostgreSQL (pg-mem) initialized successfully!");
  }

  try {
    for (const table of tables) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${table} (
          id VARCHAR(50) PRIMARY KEY,
          data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      try {
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_${table}_data ON ${table} USING gin (data)`);
      } catch (idxErr) {
        // Index notice non-fatal
      }
    }

    console.log("✅ All PostgreSQL tables verified/created successfully!");
    return mongoose.connection;
  } catch (err) {
    console.error("❌ PostgreSQL connection Error:", err.message);
    throw err;
  }
};

// Attach mongoose properties to connectDB so default imports can use it as mongoose
connectDB.Schema = Schema;
connectDB.models = registeredModels;
connectDB.model = mongoose.model;
connectDB.connect = connectDB;
connectDB.connection = mongoose.connection;
connectDB.Types = mongoose.Types;

export default connectDB;
export { mongoose, pool };
