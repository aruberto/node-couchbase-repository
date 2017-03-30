import couchbase from 'couchbase';
import uuid from 'uuid/v4';
import _ from 'lodash';
import Promise from 'bluebird';

export default function createRepository ({
  cluster,
  bucketName = 'default',
  bucketArgs = [],
  type,
  typeField = 'type',
  validate = async (input) => Promise.resolve(input)
}) {
  const bucket = cluster.openBucket(bucketName, ...bucketArgs);
  const queryAsync = Promise.promisify(bucket.query, { context: bucket });
  const getAsync = Promise.promisify(bucket.get, { context: bucket });
  const upsertAsync = Promise.promisify(bucket.upsert, { context: bucket });
  const removeAsync = Promise.promisify(bucket.remove, { context: bucket });

  return {
    get bucket () {
      return bucket;
    },

    async query (...args) {
      return queryAsync(...args);
    },

    async findAll ({ page = {}, sort = [], ...filters } = {}) {
      const { number = 0, size = 20 } = page;
      const limit = Math.max(Number.parseInt(size) || 0, 0);
      const offset = Math.max(Number.parseInt(number) || 0, 0) * limit;
      // can't get named parameters to work in order by clause, so use regex to prevent injection
      const sortFiltered = sort.filter(str => /^[a-zA-Z0-9.]+( +(ASC|DESC))?$/.test(str));
      const orderBy = sortFiltered.join(', ');

      const filterQueryStr = Object.keys(filters).map(x => {
        if (_.isArray(filters[x])) {
          return ` AND ${x} IN ($${x})`;
        }

        return ` AND ${x}=$${x}`;
      }).join('');
      const baseQueryStr = `FROM \`${bucketName}\` WHERE ${typeField}=$type${filterQueryStr}`;

      const countQuery = couchbase.N1qlQuery.fromString(`SELECT count(*) AS count ${baseQueryStr}`);
      const dataQuery = couchbase.N1qlQuery.fromString(
        `SELECT * ${baseQueryStr}` +
        (orderBy ? ` ORDER BY ${orderBy}` : '') +
        ' OFFSET $offset LIMIT $limit'
      );

      const [countResult, dataResult] = await Promise.all([
        this.query(countQuery, { ...filters, type }),
        this.query(dataQuery, { ...filters, limit, offset, orderBy, type })
      ]);

      return {
        items: dataResult[0].map(x => x[bucketName]),
        total: countResult[0][0].count,
        page: {
          number: limit <= 0 ? 0 : Math.floor(offset / limit),
          size: limit,
          total: limit <= 0 ? 0 : Math.floor((countResult[0][0].count + limit - 1) / limit)
        },
        sort: sortFiltered,
        filters
      };
    },

    async findOne (id) {
      const result = await getAsync(`${type}::${id}`);

      return result.value;
    },

    async save (input) {
      const id = input.id ? input.id : uuid();
      const value = await validate({
        ...input,
        id,
        [typeField]: type
      });

      await upsertAsync(`${type}::${value.id}`, value);

      return value;
    },

    async del (id) {
      await removeAsync(`${type}::${id}`);
    }
  };
}
