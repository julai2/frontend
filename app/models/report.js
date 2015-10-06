import DS from 'ember-data';

export default DS.Model.extend({
  title: DS.attr('string'),
  createdAt: DS.attr('date'),
  subject: DS.attr('string'),
  prepositionalObject: DS.attr('string'),
  prepositionalObjectTableRowId: DS.attr('string'),
  deleted: DS.attr('boolean'),
  user: DS.belongsTo('user', {async: true}),
});
