import Ember from 'ember';
import DS from 'ember-data';

export default Ember.Component.extend(Ember.I18n.TranslateableProperties, {
  placeholderTranslation: 'general.filterPlaceholder',
  filter: '',
  sortBy: ['title'],
  subject: null,
  cohorts: [],
  learnerGroups: Ember.computed.alias('subject.learnerGroups'),
  sortedLearnerGroups: Ember.computed.sort('learnerGroups', 'sortBy'),
  tagName: 'section',
  classNames: ['detail-block'],
  filteredCohorts: function(){
    var self = this;
    var cohortProxy = Ember.ObjectProxy.extend({
      selectedLearnerGroups: [],
      hasAvailableLearnerGroups: Ember.computed.notEmpty('filteredAvailableLearnerGroups'),
      filter: '',
      filteredAvailableLearnerGroups: function(){
        var defer = Ember.RSVP.defer();
        var self = this;
        var filter = this.get('filter');
        var exp = new RegExp(filter, 'gi');
        var activeGroupFilter = function(learnerGroup) {
          var searchTerm = learnerGroup.get('title') + learnerGroup.get('allParentsTitle');
          return (
            learnerGroup.get('title') !== undefined &&
            self.get('selectedLearnerGroups') &&
            exp.test(searchTerm) &&
            !self.get('selectedLearnerGroups').contains(learnerGroup)
          );
        };
        this.get('content.topLevelLearnerGroups').then(function(cohortGroups){
          let learnerGroups = [];
          var promises = [];

          cohortGroups.forEach(function(learnerGroup){
            learnerGroups.pushObject(learnerGroup);
            var promise = new Ember.RSVP.Promise(function(resolve) {
              learnerGroup.get('allDescendants').then(function(descendants){
                learnerGroups.pushObjects(descendants);
                resolve();
              });
            });
            promises.pushObject(promise);
          });
          Ember.RSVP.all(promises).then(function(){
            defer.resolve(learnerGroups.filter(activeGroupFilter).sortBy('title'));
          });
        });
        return DS.PromiseArray.create({
          promise: defer.promise
        });
      }.property('content.learnerGroups.@each', 'content.learnerGroups.@each.allDescendants.@each', 'filter', 'selectedLearnerGroups.@each'),
    });
    return this.get('cohorts').map(function(cohort){
      var proxy = cohortProxy.create({
        content: cohort,
        filter: self.get('filter'),
        selectedLearnerGroups: self.get('learnerGroups')
      });
      return proxy;
    }).sortBy('title');

  }.property('cohorts.@each', 'filter', 'learnerGroups.@each'),

  actions: {
    add: function(learnerGroup){
      var subject = this.get('subject');
      var learnerGroups = subject.get('learnerGroups');
      learnerGroups.addObject(learnerGroup);
      learnerGroup.get('allDescendants').then(function(descendants){
        learnerGroups.addObjects(descendants);
      });
    },
    remove: function(learnerGroup){
      var subject = this.get('subject');
      var learnerGroups = subject.get('learnerGroups');
      learnerGroups.removeObject(learnerGroup);
      learnerGroup.get('allDescendants').then(function(descendants){
        learnerGroups.removeObjects(descendants);
      });
    }
  }
});
