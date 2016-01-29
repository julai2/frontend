import DS from 'ember-data';
import Ember from 'ember';

const { computed } = Ember;
const { empty, mapBy, sum } = computed;

export default DS.Model.extend({
  title: DS.attr('string'),
  location: DS.attr('string'),
  cohort: DS.belongsTo('cohort', {async: true}),
  parent: DS.belongsTo('learner-group', {async: true, inverse: 'children'}),
  children: DS.hasMany('learner-group', {async: true, inverse: 'parent'}),
  ilmSessions: DS.hasMany('ilm-session', {async: true}),
  offerings: DS.hasMany('offering', {async: true}),
  instructorGroups: DS.hasMany('instructor-group', {async: true}),
  users: DS.hasMany('user', {
    async: true,
    inverse: 'learnerGroups'
  }),
  instructors: DS.hasMany('user', {
    async: true,
    inverse: 'instructedLearnerGroups'
  }),
  courses: computed('offerings.[]', 'ilmSessions.[]', function(){
    var defer = Ember.RSVP.defer();
    let promises = [];
    let allCourses = [];
    promises.pushObject(new Ember.RSVP.Promise(resolve => {
      this.get('offerings').then(offerings => {
        if(!offerings.length){
          resolve();
        }
        let promises = [];
        offerings.forEach(offering => {
          promises.pushObject(offering.get('session').then(session =>{
            return session.get('course').then(course => {
              allCourses.pushObject(course);
            });
          }));
        });
        Ember.RSVP.all(promises).then(()=>{
          resolve();
        });
      });
    }));
    promises.pushObject(new Ember.RSVP.Promise(resolve => {
      this.get('ilmSessions').then(ilmSessions => {
        if(!ilmSessions.length){
          resolve();
        }
        let promises = [];
        ilmSessions.forEach(ilmSession => {
          promises.pushObject(ilmSession.get('session').then(session =>{
            if(!session){
              return;
            }
            return session.get('course').then(course => {
              allCourses.pushObject(course);
            });
          }));
        });
        Ember.RSVP.all(promises).then(()=>{
          resolve();
        });
      });
    }));

    Ember.RSVP.all(promises).then(()=>{
      defer.resolve(allCourses.uniq());
    });

    return DS.PromiseArray.create({
      promise: defer.promise
    });
  }),
  childUsers: mapBy('children', 'users'),
  childUserLengths: mapBy('childUsers', 'length'),
  childUsersTotal: sum('childUserLengths'),
  childrenUsersCounts: mapBy('children', 'childUsersTotal'),
  childrenUsersTotal: sum('childrenUsersCounts'),
  usersCount: computed('users.length', 'childUsersTotal', 'childrenUsersTotal', function(){
    return this.get('users.length') + this.get('childUsersTotal') + this.get('childrenUsersTotal');
  }),
  availableUsers: computed('users', 'parent.users.[]', 'parent.childUsers.[]', function(){
    var group = this;
    return new Ember.RSVP.Promise(function(resolve) {
      group.get('parent').then(function(parent){
        if(parent == null){
          resolve(false);
        } else {
          parent.get('users').then(function(parentUsers){
            var childUsers = parent.get('childUsers');
            var selectedUsers = Ember.A();
            Ember.RSVP.all(childUsers).then(function(){
              childUsers.forEach(function(userSet){
                userSet.forEach(function(c){
                  selectedUsers.pushObject(c);
                });
              });
              var availableUsers = parentUsers.filter(function(user){
                return !selectedUsers.contains(user);
              });
              resolve(availableUsers);
            });
          });
        }
      });
    });
  }),
  allDescendantUsers: computed('users.[]', 'children.@each.users.[]', function(){
    var deferred = Ember.RSVP.defer();
    this.get('users').then(users => {
      this.get('children').then(children => {
        Ember.RSVP.map(children.mapBy('allDescendantUsers'), childUsers => {
          users.addObjects(childUsers);
        }).then(() => {
          deferred.resolve(users.uniq());
        });
      });
    });

    return DS.PromiseArray.create({
      promise: deferred.promise
    });
  }),
  usersOnlyAtThisLevel: computed('users.[]', 'allDescendants.[]', function(){
    var deferred = Ember.RSVP.defer();
    this.get('users').then(users => {
      this.get('allDescendants').then(descendants => {
        var membersAtThisLevel = [];
        var promises = [];
        users.forEach(user => {
          let promise = user.get('learnerGroups').then(userGroups => {
            var subGroups = userGroups.filter(group => descendants.contains(group));
            if(subGroups.length === 0){
              membersAtThisLevel.pushObject(user);
            }
          });
          promises.pushObject(promise);
        });
        Ember.RSVP.all(promises).then(() => {
          deferred.resolve(membersAtThisLevel.sortBy('fullName'));
        });

      });

    });
    return DS.PromiseArray.create({
      promise: deferred.promise
    });
  }),
  destroyChildren: function(){
    var group = this;
    return new Ember.RSVP.Promise(function(resolve) {
      var promises = [];
      group.get('children').then(function(children){
        children.forEach(function(child){
          promises.push(child.destroyChildren().then(function(){
            child.destroyRecord();
          }));
        });
        resolve(Ember.RSVP.all(promises));
      });
    });
  },
  allParentsTitle: computed('allParentTitles', function(){
    let title = '';
    this.get('allParentTitles').forEach(str => {
      title += str + ' > ';
    });

    return title;
  }),
  allParentTitles: computed('parent.{title,allParentTitles}', function(){
    let titles = [];
    if(this.get('parent.content')){
      if(this.get('parent.allParentTitles')){
        titles.pushObjects(this.get('parent.allParentTitles'));
      }
      titles.pushObject(this.get('parent.title'));
    }

    return titles;
  }),
  sortTitle: computed('title', 'allParentsTitle', function(){
    var title = this.get('allParentsTitle') + this.get('title');
    return title.replace(/([\s->]+)/ig,"");
  }),
  allDescendants: computed('children.@each.allDescendants.[]', function(){
    var deferred = Ember.RSVP.defer();
    this.get('children').then(function(learnerGroups){
      var groups = [];
      var promises = [];
      learnerGroups.forEach(function(learnerGroup){
        groups.pushObject(learnerGroup);
        var promise = new Ember.RSVP.Promise(function(resolve) {
          learnerGroup.get('allDescendants').then(function(descendants){
            descendants.forEach(function(descendant){
              groups.pushObject(descendant);
            });
            resolve();
          });
        });
        promises.pushObject(promise);
      });
      Ember.RSVP.all(promises).then(function(){
        deferred.resolve(groups);
      });
    });
    return DS.PromiseArray.create({
      promise: deferred.promise
    });
  }),
  allParents: computed('parent', 'parent.allParents.[]', function(){
    var deferred = Ember.RSVP.defer();
    this.get('parent').then(parent => {
      var parents = [];
      if(!parent){
        deferred.resolve(parents);
      } else {
        parents.pushObject(parent);
        parent.get('allParents').then(allParents => {
          parents.pushObjects(allParents);
          deferred.resolve(parents);
        });
      }

    });
    return DS.PromiseArray.create({
      promise: deferred.promise
    });
  }),
  topLevelGroup: computed('parent', 'parent.topLevelGroup', function(){
    let promise = new Ember.RSVP.Promise(
      resolve => {
        this.get('parent').then(
          parent => {
            if(!parent){
              resolve(this);
            } else {
              parent.get('topLevelGroup').then(
                topLevelGroup => {
                  resolve(topLevelGroup);
                }
              );
            }
          }
        );
      }
    );
    return DS.PromiseObject.create({
      promise: promise
    });
  }),
  isTopLevelGroup: empty('parent.content'),
  removeUserFromGroupAndAllDescendants(user){
    let groups = [this];
    return new Ember.RSVP.Promise(resolve => {
      this.get('users').removeObject(user);
      user.get('learnerGroups').removeObject(this);
      this.get('allDescendants').then(all => {
        all.forEach(group=>{
          groups.pushObject(group);
          group.get('users').removeObject(user);
          user.get('learnerGroups').removeObject(group);
        });
        resolve(groups);
      });
    });
  },
  addUserToGroupAndAllParents(user){
    let groups = [this];
    return new Ember.RSVP.Promise(resolve => {
      this.get('users').pushObject(user);
      user.get('learnerGroups').pushObject(this);
      this.get('allParents').then(all => {
        all.forEach(group=>{
          groups.pushObject(group);
          group.get('users').pushObject(user);
          user.get('learnerGroups').pushObject(group);
        });
        resolve(groups);
      });
    });
  },
});
