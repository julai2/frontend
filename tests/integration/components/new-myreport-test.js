import { resolve } from 'rsvp';
import Service from '@ember/service';
import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';

module('Integration | Component | new myreport', function(hooks) {
  setupRenderingTest(hooks);
  setupMirage(hooks);

  test('it renders', async function(assert) {
    assert.expect(35);
    this.server.create('school', { title: 'first' });
    const school2 = this.server.create('school', { title: 'second' });
    this.server.create('school', { title: 'third' });

    const mockUser = EmberObject.create({
      school: resolve(school2)
    });

    const currentUserMock = Service.extend({
      model: resolve(mockUser)
    });
    this.owner.register('service:current-user', currentUserMock);


    this.set('close', ()=>{});
    await render(hbs`{{new-myreport close=(action close)}}`);
    const title = '.title';
    const schools = 'select:eq(0)';
    const schoolOptions = `${schools} option`;
    const allSchools = `${schoolOptions}:eq(0)`;
    const firstSchool = `${schoolOptions}:eq(1)`;
    const secondSchool = `${schoolOptions}:eq(2)`;
    const thirdSchool = `${schoolOptions}:eq(3)`;

    const subjects = 'select:eq(1) option';
    const firstSubject = `${subjects}:eq(0)`;
    const secondSubject = `${subjects}:eq(1)`;
    const thirdSubject = `${subjects}:eq(2)`;
    const fourthSubject = `${subjects}:eq(3)`;
    const fifthSubject = `${subjects}:eq(4)`;
    const sixthSubject = `${subjects}:eq(5)`;
    const seventhSubject = `${subjects}:eq(6)`;
    const eighthSubject = `${subjects}:eq(7)`;
    const ninthSubject = `${subjects}:eq(8)`;
    const tenthSubject = `${subjects}:eq(9)`;
    const eleventhSubject = `${subjects}:eq(10)`;

    await settled();
    assert.equal(this.$(title).text(), 'New Report');
    assert.notEqual(this.$(allSchools).text().search(/All Schools/), -1);
    assert.equal(this.$(allSchools).val(), "null");
    assert.ok(this.$(allSchools).not(':selected'), 'all schools is not selected');
    assert.notEqual(this.$(firstSchool).text().search(/first/), -1);
    assert.equal(this.$(firstSchool).val(), 1);
    assert.ok(this.$(firstSchool).not(':selected'), 'first school is not selected');
    assert.notEqual(this.$(secondSchool).text().search(/second/), -1);
    assert.equal(this.$(secondSchool).val(), 2);
    assert.ok(this.$(secondSchool).is(':selected'), 'users primary school is selected');
    assert.notEqual(this.$(thirdSchool).text().search(/third/), -1);
    assert.equal(this.$(thirdSchool).val(), 3);
    assert.ok(this.$(thirdSchool).not(':selected'), 'third school is not selected');

    assert.equal(this.$(firstSubject).text().trim(), 'Courses');
    assert.equal(this.$(firstSubject).val(), 'course');
    assert.equal(this.$(secondSubject).text().trim(), 'Sessions');
    assert.equal(this.$(secondSubject).val(), 'session');
    assert.equal(this.$(thirdSubject).text().trim(), 'Programs');
    assert.equal(this.$(thirdSubject).val(), 'program');
    assert.equal(this.$(fourthSubject).text().trim(), 'Program Years');
    assert.equal(this.$(fourthSubject).val(), 'program year');
    assert.equal(this.$(fifthSubject).text().trim(), 'Instructors');
    assert.equal(this.$(fifthSubject).val(), 'instructor');
    assert.equal(this.$(sixthSubject).text().trim(), 'Instructor Groups');
    assert.equal(this.$(sixthSubject).val(), 'instructor group');
    assert.equal(this.$(seventhSubject).text().trim(), 'Learning Materials');
    assert.equal(this.$(seventhSubject).val(), 'learning material');
    assert.equal(this.$(eighthSubject).text().trim(), 'Competencies');
    assert.equal(this.$(eighthSubject).val(), 'competency');
    assert.equal(this.$(ninthSubject).text().trim(), 'MeSH Terms');
    assert.equal(this.$(ninthSubject).val(), 'mesh term');
    assert.equal(this.$(tenthSubject).text().trim(), 'Terms');
    assert.equal(this.$(tenthSubject).val(), 'term');
    assert.equal(this.$(eleventhSubject).text().trim(), 'Session Types');
    assert.equal(this.$(eleventhSubject).val(), 'session type');
  });

  let checkObjects = async function(context, assert, subjectNum, subjectVal, expectedObjects){
    assert.expect(expectedObjects.length + 2);
    const school = context.server.create('school', { title: 'first' });
    const mockUser = EmberObject.create({
      school: resolve(school)
    });

    const currentUserMock = Service.extend({
      model: resolve(mockUser)
    });
    context.owner.register('service:current-user', currentUserMock);
    context.set('close', ()=>{});
    await render(hbs`{{new-myreport close=(action close)}}`);

    const schoolSelect = `select:eq(0)`;
    const select = `select:eq(1)`;
    const subjects = `${select} option`;
    const targetSubject = `${subjects}:eq(${subjectNum})`;

    const objectsOptions = 'select:eq(2) option';

    await settled();
    context.$(schoolSelect).val(null).change();
    await settled();
    assert.equal(context.$(targetSubject).val(), subjectVal, `${subjectVal} is in the list where we expect it.`);
    context.$(select).val(subjectVal).change();
    await settled();

    assert.equal(context.$(`${objectsOptions}:eq(0)`).val(), '', 'first option is blank');
    expectedObjects.forEach((val, i) => {
      assert.equal(context.$(`${objectsOptions}:eq(${i+1})`).val(), val, `${val} is object option`);
    });
  };

  test('choosing course selects correct objects', function(assert) {
    return checkObjects(this, assert, 0, 'course', [
      'session',
      'program',
      'instructor',
      'instructor group',
      'learning material',
      'competency',
      'mesh term',
    ]);
  });

  test('choosing session selects correct objects', function(assert) {
    return checkObjects(this, assert, 1, 'session', [
      'course',
      'program',
      'instructor',
      'instructor group',
      'learning material',
      'competency',
      'mesh term',
      'session type',
    ]);
  });

  test('choosing programs selects correct objects', function(assert) {
    return checkObjects(this, assert, 2, 'program', ['course', 'session']);
  });

  test('choosing program years selects correct objects', function(assert) {
    return checkObjects(this, assert, 3, 'program year', ['course', 'session']);
  });

  test('choosing instructor selects correct objects', function(assert) {
    return checkObjects(this, assert, 4, 'instructor', [
      'course',
      'session',
      'instructor group',
      'learning material',
      'session type',
    ]);
  });

  test('choosing instructor group selects correct objects', function(assert) {
    return checkObjects(this, assert, 5, 'instructor group', [
      'course',
      'session',
      'instructor',
      'learning material',
      'session type',
    ]);
  });

  test('choosing learning material selects correct objects', function(assert) {
    return checkObjects(this, assert, 6, 'learning material', [
      'course',
      'session',
      'instructor',
      'instructor group',
      'mesh term',
      'session type',
    ]);
  });

  test('choosing competency selects correct objects', function(assert) {
    return checkObjects(this, assert, 7, 'competency', [
      'course',
      'session',
      'session type',
    ]);
  });

  test('choosing mesh term selects correct objects', function(assert) {
    return checkObjects(this, assert, 8, 'mesh term', [
      'course',
      'session',
      'learning material',
      'session type',
    ]);
  });

  test('choosing term selects correct objects', function(assert) {
    return checkObjects(this, assert, 9, 'term', [
      'course',
      'session',
      'program year',
      'program',
      'instructor',
      'learning material',
      'competency',
      'mesh term',
    ]);
  });

  test('choosing session type selects correct objects', function(assert) {
    return checkObjects(this, assert, 10, 'session type', [
      'course',
      'program',
      'instructor',
      'instructor group',
      'learning material',
      'competency',
      'mesh term',
      'term'
    ]);
  });


  test('can search for user #2506', async function(assert) {
    assert.expect(3);

    const school = this.server.create('school', { title: 'first' });
    const mockUser = EmberObject.create({
      school: resolve(school)
    });
    const currentUserMock = Service.extend({
      model: resolve(mockUser)
    });
    this.owner.register('service:current-user', currentUserMock);
    this.server.create('user', {
      firstName: 'Test',
      lastName: 'Person',
      middleName: '',
      email: 'test@example.com',
    });

    const schoolSelect = 'select:eq(0)';
    const subjects = `select:eq(1) option`;
    const objectSelect = 'select:eq(2)';
    const targetSubject = `${subjects}:eq(0)`;
    const targetObject = `instructor`;
    const userSearch = '.user-search';
    const input = `${userSearch} input`;
    const results = `${userSearch} li`;
    const firstResult = `${results}:eq(1)`;
    const selectedUser = `.removable-list`;

    this.set('close', ()=>{});
    await render(hbs`{{new-myreport close=(action close)}}`);
    await settled();
    this.$(schoolSelect).val(null).change();
    await settled();
    assert.equal(this.$(targetSubject).val(), 'course');
    this.$(objectSelect).val(targetObject).change();
    await settled();

    assert.equal(this.$(userSearch).length, 1);
    this.$(input).val('test').trigger('input');
    await settled();

    await this.$(firstResult).click();
    await settled();
    assert.equal(this.$(selectedUser).text().trim(), 'Test Person');

    await settled();
  });
});
