/* eslint-disable no-unused-expressions */

import couchbase from 'couchbase';
import uuid from 'uuid/v4';
import { expect } from 'chai';
import sinon from 'sinon';
import yup from 'yup';

import createRepository from '../src';

const cluster = new couchbase.Mock.Cluster();
const bucket = cluster.openBucket();

const schema =
  yup.object().shape({
    id: yup.string().required(),
    _type: yup.string().required(),
    name: yup.string().required(),
    email: yup.string().email().required()
  });

const testRepository = createRepository({
  bucket,
  type: 'test',
  typeField: '_type',
  async validate (input) {
    return schema.validate(input);
  }
});

const countRegex = /^SELECT count\(\*\)/i;
const selectRegex = new RegExp('^SELECT `default`\\.\\*', 'i');

describe('Couchbase Repository', () => {
  let queryStub;

  before(() => {
    queryStub = sinon.stub(testRepository, 'query');
  });

  afterEach(() => {
    queryStub.reset();
  });

  after(() => {
    queryStub.restore();
  });

  describe('findAll', () => {
    it('returns nothing', async () => {
      queryStub.withArgs(
        sinon.match((value) => countRegex.test(value.options.statement)),
        sinon.match.object
      ).returns([{ count: 0 }]);
      queryStub.withArgs(
        sinon.match((value) => selectRegex.test(value.options.statement)),
        sinon.match.object
      ).returns([]);

      const results = await testRepository.findAll();

      expect(results.items).to.be.empty;
      expect(results.total).to.equal(0);
      expect(results.page.number).to.equal(0);
      expect(results.page.size).to.equal(20);
      expect(results.page.total).to.equal(0);
      expect(results.sort).to.be.empty;
      expect(results.filters).to.deep.equal({});
    });

    it('process params', async () => {
      queryStub.withArgs(
        sinon.match((value) => countRegex.test(value.options.statement)),
        sinon.match.object
      ).returns([{ count: 11 }]);
      queryStub.withArgs(
        sinon.match((value) => selectRegex.test(value.options.statement)),
        sinon.match.object
      ).returns([{ id: '111' }, { id: '222' }]);

      const results = await testRepository.findAll({
        page: {
          number: 1,
          size: 2
        },
        sort: ['id DESC', 'name DASC'],
        email: 'x@x.com',
        name: 'jj'
      });

      expect(results.items).to.deep.equal([{ id: '111' }, { id: '222' }]);
      expect(results.total).to.equal(11);
      expect(results.page.number).to.equal(1);
      expect(results.page.size).to.equal(2);
      expect(results.page.total).to.equal(6);
      expect(results.sort).to.have.members(['id DESC']);
      expect(results.filters).to.deep.equal({
        email: 'x@x.com',
        name: 'jj'
      });

      queryStub.restore();
    });
  });

  describe('findOne', () => {
    it('should throw not found error when id does not exist', async () => {
      try {
        await testRepository.findOne(uuid());

        throw new Error('id exists');
      } catch (err) {
        expect(err.code).to.equal(couchbase.errors.keyNotFound);
      }
    });

    it('should return data when id exists', async () => {
      const saved = await testRepository.save({
        name: 'Joe Blow',
        email: 'jblow@blah.com'
      });

      const record = await testRepository.findOne(saved.id);

      expect(record.id).to.equal(saved.id);
      expect(record._type).to.equal('test');
      expect(record.name).to.equal('Joe Blow');
      expect(record.email).to.equal('jblow@blah.com');
    });
  });

  describe('save', () => {
    it('should throw validation error when name is invalid', async () => {
      try {
        await testRepository.save({
          name: null,
          email: 'jblow@blah.com'
        });

        throw new Error('saved successfully');
      } catch (err) {
        expect(err.name).to.equal('ValidationError');
      }
    });

    it('should throw validation error when email is invalid', async () => {
      try {
        await testRepository.save({
          name: 'Joe Blow',
          email: 'jblow'
        });

        throw new Error('saved successfully');
      } catch (err) {
        expect(err.name).to.equal('ValidationError');
      }
    });

    it('should save successfully when validation passes', async () => {
      const saved = await testRepository.save({
        name: 'Joe Blow',
        email: 'jblow@blah.com'
      });

      const record = await testRepository.findOne(saved.id);

      expect(record.id).to.equal(saved.id);
      expect(record._type).to.equal('test');
      expect(record.name).to.equal('Joe Blow');
      expect(record.email).to.equal('jblow@blah.com');
    });

    it('should throw not found error when id does not exist', async () => {
      try {
        await testRepository.save({
          id: '123-abc',
          name: 'Joe Blow',
          email: 'jblow@blah.com'
        });

        throw new Error('id exists');
      } catch (err) {
        expect(err.code).to.equal(couchbase.errors.keyNotFound);
      }
    });
  });

  describe('del', () => {
    it('should throw not found error when id does not exist', async () => {
      try {
        await testRepository.del(uuid());

        throw new Error('id exists');
      } catch (err) {
        expect(err.code).to.equal(couchbase.errors.keyNotFound);
      }
    });

    it('should delete when id exists', async () => {
      const saved = await testRepository.save({
        name: 'Joe Blow',
        email: 'jblow@blah.com'
      });

      const record = await testRepository.findOne(saved.id);

      expect(record.id).to.equal(saved.id);
      expect(record._type).to.equal('test');
      expect(record.name).to.equal('Joe Blow');
      expect(record.email).to.equal('jblow@blah.com');

      await testRepository.del(saved.id);

      try {
        await await testRepository.findOne(saved.id);

        throw new Error('id exists');
      } catch (err) {
        expect(err.code).to.equal(couchbase.errors.keyNotFound);
      }
    });
  });
});
